import {ID,SKILLS,ORIGINS,ROLES,planRoll,resolve,featLabel,featRank} from './rules.mjs';
const busy=new Set();
export const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const check=(name,label,disabled=false)=>`<label class="cdc-option"><input type="checkbox" name="${name}" ${disabled?'disabled':''}> ${label}</label>`;
async function chooseFeat(feats) {
  if(feats.length===1)return 0;
  const result=await foundry.applications.api.DialogV2.wait({window:{title:'Escolha o dado de façanha'},
    content:'<p>Conserve um dos resultados. Somente ele será usado no teste.</p>',rejectClose:false,
    buttons:feats.map((n,i)=>({action:`die${i}`,label:featLabel(n),callback:()=>i}))});
  // Closing cannot discard an evaluated test or refund a used resource.
  return Number.isInteger(result)?result:feats.indexOf([...feats].sort((a,b)=>featRank(b)-featRank(a))[0]);
}
export async function rollSkill(actor,skill) {
  if(!actor?.isOwner||actor.type!=='personagem')return ui.notifications.warn('Você precisa controlar este personagem.');
  if(busy.has(actor.uuid))return ui.notifications.warn('Conclua o teste em andamento.');
  busy.add(actor.uuid);
  let helperLock;
  try {
    const s=actor.system, spec=s.specialty===skill&&!s.specialtyUsed&&s.skills[skill]>0&&ROLES[s.role]?.skills.includes(skill);
    const origin=ORIGINS[s.origin], cultural=!s.originUsed&&origin.skills.includes(skill);
    const helpers=game.actors.filter(a=>a.id!==actor.id&&a.type==='personagem'&&a.isOwner&&a.system.hope.value>0);
    const content=`<div class="cdc-dialog"><p><strong>${escapeHTML(SKILLS[skill].label)}</strong> · ${s.skills[skill]}d6 · alvo ${20-s.attributes[SKILLS[skill].attribute]}</p>
      <p>A narradora define a consequência antes dos dados. A ação deve ser possível.</p>
      ${check('hope','Gastar 1 Esperança: +1d6',s.hope.value<1)}
      ${check('specialty','Usar especialidade da sessão: escolher entre dois dados de façanha',!spec)}
      ${check('origin',`Usar ${escapeHTML(origin.benefit)}: +1d6 nesta aventura`,!cultural)}
      <label>Experiência cultural pertinente, se usar o benefício<input type="text" name="reason" placeholder="Confirme a pertinência com a narradora"></label>
      <label>Circunstância<select name="modifier"><option value="0">Normal</option><option value="-2">Favorável: alvo −2</option><option value="2">Excepcionalmente difícil: alvo +2</option></select></label>
      <label>Apoio de um companheiro controlado por você<select name="helper"><option value="">Sem apoio</option>${helpers.map(a=>`<option value="${a.id}">${escapeHTML(a.name)}</option>`).join('')}</select></label>
      <label>Perícia pertinente do ajudante<select name="helperSkill">${Object.entries(SKILLS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></label>
      <label>Como o companheiro ajuda<input name="helpReason" type="text"></label>
      <p class="cdc-hint">O apoio custa 1 Esperança do ajudante. Para personagem de outro jogador, peça ao dono ou à narradora para fazer o teste com permissão sobre ambos.</p>
      <label>Visibilidade<select name="rollMode"><option value="publicroll">Pública</option><option value="gmroll">Privada para narradora</option><option value="blindroll">Cega para narradora</option><option value="selfroll">Somente você</option></select></label></div>`;
    const options=await foundry.applications.api.DialogV2.wait({window:{title:`Teste de ${SKILLS[skill].label}`},content,rejectClose:false,
      buttons:[{action:'roll',label:'Rolar',default:true,callback:(_e,b)=>{
        const e=b.form.elements;return {hope:e.hope.checked,specialty:e.specialty.checked,origin:e.origin.checked,
          reason:e.reason.value.trim(),modifier:Number(e.modifier.value),helper:e.helper.value,helperSkill:e.helperSkill.value,
          helpReason:e.helpReason.value.trim(),rollMode:e.rollMode.value};
      }},{action:'cancel',label:'Cancelar',callback:()=>null}]});
    if(!options)return;
    if(options.origin&&!options.reason)throw Error('Descreva a experiência cultural e confirme sua pertinência antes de usar o benefício.');
    const helper=options.helper?game.actors.get(options.helper):null;
    if(options.helper&&(!helper||helper.id===actor.id||!helper.isOwner||helper.type!=='personagem'||helper.system.hope.value<1||!SKILLS[options.helperSkill]||helper.system.skills[options.helperSkill]<1||!options.helpReason))throw Error('Apoio exige um companheiro controlado, Esperança, perícia de nível 1 ou maior e descrição da ajuda.');
    if(helper){if(busy.has(helper.uuid))throw Error('O ajudante já participa de outro teste.');busy.add(helper.uuid);helperLock=helper.uuid;}
    // Re-read all values after the dialog, since it may have been open for a while.
    const plan=planRoll(actor.system,skill,options), count=plan.count+Number(Boolean(helper));
    const roll=await new Roll(`${plan.feats}d12${count?` + ${count}d6`:''}`).evaluate();
    const feats=roll.dice.find(d=>d.faces===12).results.map(r=>r.result);
    const dice=roll.dice.find(d=>d.faces===6)?.results.map(r=>r.result)??[];
    const chosen=await chooseFeat(feats), result=resolve({feats,dice,target:plan.target,weary:plan.weary,chosen});
    const updates={};
    if(options.hope)updates['system.hope.value']=actor.system.hope.value-1;
    if(options.specialty)updates['system.specialtyUsed']=true;
    if(options.origin)updates['system.originUsed']=true;
    // Revalidate balances and uses immediately before spending.
    planRoll(actor.system,skill,options);
    if(helper&&(!helper.isOwner||helper.system.hope.value<1))throw Error('O ajudante não tem mais Esperança disponível.');
    const helperHope=helper?.system.hope.value;
    if(helper)await helper.update({'system.hope.value':helperHope-1});
    try { if(Object.keys(updates).length)await actor.update(updates); }
    catch(error) {
      if(helper) {
        try { await helper.update({'system.hope.value':helperHope}); }
        catch(rollbackError) { console.error(ID,rollbackError);ui.notifications.error('Não foi possível restaurar o ajudante. Confira sua Esperança com a narradora.'); }
      }
      throw error;
    }
    const ds=dice.map((n,i)=>`<span class="cdc-die ${plan.weary&&n<=3?'muted':''} ${n===6?'six':''}">${n}${result.effective[i]!==n?'→0':''}</span>`).join('');
    const usage=[options.hope?'1 Esperança própria':'',options.specialty?'Especialidade usada':'',options.origin?`${origin.benefit}: ${escapeHTML(options.reason)}`:'',helper?`Apoio de ${escapeHTML(helper.name)} (1 Esperança): ${escapeHTML(options.helpReason)}`:''].filter(Boolean);
    const card=`<article class="cdc-roll"><header>COMPANHIA DO CAMINHO</header><h3>${escapeHTML(SKILLS[skill].label)}</h3>
      <div class="cdc-result ${result.success?'success':'failure'}">${result.degree}</div>
      <p>Façanha: <strong>${featLabel(result.feat)}</strong>${feats.length===2?` · outro resultado: ${featLabel(feats[1-chosen])}`:''}</p>
      <div class="cdc-dice">${ds||'<span>Sem dados de sucesso</span>'}</div>
      <p><strong>${result.automatic?'Êxito automático':`Total ${result.total}`} · alvo ${plan.target}</strong></p>
      <p>${result.success?`${result.sixes} seis(es): combine os benefícios com a narradora.`:'Os seis não convertem uma falha em sucesso.'}</p>
      ${plan.weary?'<p>Cansado: resultados 1–3 dos d6 contam zero.</p>':''}
      ${usage.length?`<p class="cdc-hint">${usage.join('<br>')}</p>`:''}
      <p class="cdc-hint">Consequências de falha não são debitadas automaticamente.</p></article>`;
    // The custom total deliberately differs from the raw numeric sum of standard d12 dice.
    // Keep the native evaluated Roll for audit/Foundry dice integrations, display our own card.
    await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),content:card,
      flags:{[ID]:{skill,target:plan.target,feats,dice,chosen,result,options,rules:'0.3'}}},{rollMode:options.rollMode});
    return result;
  } catch(err){console.error(`${ID} | Teste`,err);ui.notifications.error(err.message);}
  finally{busy.delete(actor.uuid);if(helperLock)busy.delete(helperLock);}
}
