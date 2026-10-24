/** Pure, independently testable implementation of the household draft 0.3. */
export const ID = 'companhia-do-caminho';
export const ATTRIBUTES = {body:'Corpo', spirit:'Ânimo', wit:'Engenho'};
export const SKILLS = {
  athletics:{label:'Atletismo',attribute:'body'}, travel:{label:'Viagem',attribute:'body'},
  stealth:{label:'Furtividade',attribute:'body'}, craft:{label:'Ofício',attribute:'body'},
  handling:{label:'Manejo',attribute:'body'}, readiness:{label:'Prontidão',attribute:'body'},
  encourage:{label:'Encorajar',attribute:'spirit'}, courtesy:{label:'Cortesia',attribute:'spirit'},
  persuade:{label:'Persuasão',attribute:'spirit'}, negotiate:{label:'Negociação',attribute:'spirit'},
  insight:{label:'Intuição social',attribute:'spirit'}, report:{label:'Relato',attribute:'spirit'},
  observe:{label:'Observação',attribute:'wit'}, navigate:{label:'Orientação',attribute:'wit'},
  investigate:{label:'Investigação',attribute:'wit'}, heal:{label:'Cura',attribute:'wit'},
  lore:{label:'Saber',attribute:'wit'}, supplies:{label:'Provisões',attribute:'wit'}
};
export const ORIGINS = {
  none:{label:'Ainda não definida',benefit:'Nenhum',skills:[]},
  judea:{label:'Judeu da Judeia ou Galileia',benefit:'Costumes conhecidos',skills:['courtesy','lore']},
  diaspora:{label:'Judeu da Diáspora',benefit:'Entre comunidades',skills:['courtesy','report']},
  greek:{label:'Gentio de formação grega',benefit:'Vivência urbana',skills:['negotiate','investigate']}
};
export const ROLES = {
  none:{label:'Ainda não definida',skills:[]}, messenger:{label:'Mensageiro',skills:['travel','report']},
  caregiver:{label:'Cuidador',skills:['heal','encourage']}, mediator:{label:'Mediador',skills:['courtesy','persuade']},
  provider:{label:'Provedor',skills:['craft','supplies']}, protector:{label:'Protetor',skills:['observe','readiness']},
  scholar:{label:'Estudioso',skills:['lore','investigate']}
};
export const clamp = (n,min,max) => Math.max(min,Math.min(max,Number(n)||0));
export const resistanceMax = s => 18 + 2*s.attributes.body;
export const hopeMax = s => 6 + s.attributes.spirit;
export const isWeary = s => s.resistance.value <= s.load + s.fatigue;
export const featLabel = n => n === 12 ? 'Êxito (Gandalf)' : n === 11 ? 'Olho (0)' : String(n);
export const featValue = n => n===11 || n===12 ? 0 : n;
export const featRank = n => n===12 ? 100 : featValue(n);
export function resolve({feats,dice,target,weary=false,chosen=0}) {
  if (!Array.isArray(feats) || ![1,2].includes(feats.length) || feats.some(n=>!Number.isInteger(n)||n<1||n>12)) throw Error('Dado de façanha inválido.');
  if (!Array.isArray(dice) || dice.some(n=>!Number.isInteger(n)||n<1||n>6)) throw Error('Dado de sucesso inválido.');
  if (!Number.isInteger(chosen)||chosen<0||chosen>=feats.length||!Number.isFinite(target)) throw Error('Escolha ou alvo inválido.');
  const feat=feats[chosen], effective=dice.map(n=>weary&&n<=3?0:n);
  const total=featValue(feat)+effective.reduce((a,b)=>a+b,0);
  const automatic=feat===12, success=automatic||total>=target;
  const sixes=dice.filter(n=>n===6).length;
  return {feat,chosen,total,effective,sixes,success,automatic,
    degree:!success?'Falha':sixes>=2?'Sucesso extraordinário':sixes===1?'Grande sucesso':'Sucesso'};
}
export function planRoll(s,skill,{hope=false,specialty=false,origin=false,modifier=0}={}) {
  if (!SKILLS[skill]) throw Error('Perícia desconhecida.');
  if (![0,-2,2].includes(modifier)) throw Error('Modificador inválido.');
  if (hope && s.hope.value<1) throw Error('Esperança insuficiente.');
  if (specialty && (s.specialtyUsed||s.specialty!==skill||s.skills[skill]<1||!ROLES[s.role]?.skills.includes(skill))) throw Error('Especialidade indisponível para esta perícia e função.');
  if (origin && (s.originUsed||!ORIGINS[s.origin]?.skills.includes(skill))) throw Error('Benefício de origem indisponível para esta perícia.');
  return {target:20-s.attributes[SKILLS[skill].attribute]+modifier,
    count:s.skills[skill]+Number(hope)+Number(origin),feats:specialty?2:1,weary:isWeary(s)};
}
export function recovery(s,kind) {
  if (!['shelter','rough','community'].includes(kind)) throw Error('Repouso desconhecido.');
  if (kind==='community') return {resistance:resistanceMax(s),hope:hopeMax(s),fatigue:0};
  return {resistance:Math.min(resistanceMax(s),s.resistance.value+(kind==='shelter'?4:2)),
    hope:s.hope.value,fatigue:Math.max(0,s.fatigue-(kind==='shelter'?1:0))};
}
export function creationWarnings(s) {
  const sum=Object.values(s.skills).reduce((a,b)=>a+b,0), messages=[];
  if (Object.values(s.attributes).sort((a,b)=>a-b).join(',')!=='4,5,6') messages.push('Na criação, distribua 6, 5 e 4 uma vez cada.');
  if(sum+s.reservedPoints!==16) messages.push(`Perícias + pontos reservados somam ${sum+s.reservedPoints}; a criação prevê 16.`);
  if(s.reservedPoints) messages.push(`${s.reservedPoints} ponto(s) reservado(s). Não geram dados até serem distribuídos.`);
  if(s.specialty!=='none' && (!ROLES[s.role]?.skills.includes(s.specialty)||s.skills[s.specialty]<1)) messages.push('Especialidade precisa corresponder à função e ter nível 1 ou maior.');
  return messages;
}
