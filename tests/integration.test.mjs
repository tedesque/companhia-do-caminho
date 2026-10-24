/** A controlled API stand-in; this is not a running Foundry instance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const example=JSON.parse(fs.readFileSync(new URL('../examples/comerciante.json',import.meta.url)));
let dialogs=[],dice=[],chats=[],errors=[],updates=[],hooks={},dialogConfigs=[];
class Field{constructor(options){this.options=options;}}
class Sheet{async _prepareContext(){return {editable:true};}async submit(){} }
globalThis.foundry={data:{fields:{NumberField:Field,StringField:Field,BooleanField:Field,SchemaField:Field}},abstract:{TypeDataModel:class{}},applications:{api:{HandlebarsApplicationMixin:C=>C,DialogV2:{wait:async config=>{dialogConfigs.push(config);return dialogs.shift();},confirm:async()=>dialogs.shift()}},sheets:{ActorSheetV2:Sheet}},documents:{collections:{Actors:{registerSheet:(...args)=>{globalThis.registered=args;}}}}};
globalThis.Hooks={once:(event,fn)=>{hooks[event]=fn;}};
globalThis.CONFIG={Actor:{dataModels:{}}};
globalThis.ui={notifications:{warn:m=>errors.push(m),error:m=>errors.push(m)}};
globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor.id})};
globalThis.Roll=class{
  constructor(formula){this.formula=formula;}
  async evaluate(){const d=dice.shift();this.dice=[{faces:12,results:d.feats.map(result=>({result}))}];if(d.dice.length)this.dice.push({faces:6,results:d.dice.map(result=>({result}))});return this;}
  async toMessage(data,options){chats.push({formula:this.formula,data,options});}
};
function actor(id='a'){
  return {id,uuid:`Actor.${id}`,name:'Exemplo',type:'personagem',isOwner:true,system:structuredClone(example.system),async update(change){updates.push({id,change});for(const [key,value]of Object.entries(change)){const path=key.split('.');let target=this;for(const part of path.slice(0,-1))target=target[part];target[path.at(-1)]=value;}}};
}
function setup(a){dialogConfigs=[];dialogs=[];dice=[];chats=[];errors=[];updates=[];
  const actors=[a];actors.get=id=>actors.find(a=>a.id===id);
  globalThis.game={actors,user:{isGM:true},settings:{register:()=>{},get:()=>true}};return actors;
}
const {rollSkill}=await import('../scripts/roll.mjs');
const {CharacterModel}=await import('../scripts/model.mjs');
const {CharacterSheet}=await import('../scripts/sheet.mjs');
await import('../scripts/main.mjs');
test('Init registra modelo e ficha V2 e expõe a API',()=>{
  setup(actor());hooks.init();assert.equal(CONFIG.Actor.dataModels.personagem,CharacterModel);
  assert.equal(globalThis.registered[0],'companhia-do-caminho');assert.equal(game.caminho.rollSkill,rollSkill);
});
test('Schema cobre exatamente os 18 campos de perícia',()=>{
  const schema=CharacterModel.defineSchema();assert.equal(Object.keys(schema.skills.options).length,18);
  assert.equal(schema.reservedPoints.options.max,16);
});
test('Dados derivados contêm máximos e limitam recursos',()=>{
  const s=structuredClone(example.system);s.resistance.value=200;s.hope.value=100;
  CharacterModel.prototype.prepareDerivedData.call(s);assert.equal(s.resistance.max,28);assert.equal(s.hope.value,12);
});
test('Cancelar o diálogo não rola nem gasta recurso',async()=>{
  const a=actor();setup(a);dialogs.push(null);await rollSkill(a,'travel');assert.equal(chats.length,0);assert.equal(updates.length,0);
});
test('Integração de Provisões usa Engenho e publica o total correto',async()=>{
  const a=actor();setup(a);dialogs.push({modifier:0,rollMode:'publicroll'});dice.push({feats:[8],dice:[6,4]});
  const r=await rollSkill(a,'supplies');assert.equal(r.total,18);assert.equal(chats[0].data.flags['companhia-do-caminho'].target,16);assert.equal(updates.length,0);
});
test('Esperança e especialidade são debitadas uma vez, com escolha explícita',async()=>{
  const a=actor();setup(a);dialogs.push({hope:true,specialty:true,modifier:0,rollMode:'gmroll'},1);dice.push({feats:[11,8],dice:[1,2,3,6]});
  const r=await rollSkill(a,'persuade');assert.equal(r.total,20);assert.equal(a.system.hope.value,11);assert.equal(a.system.specialtyUsed,true);assert.equal(updates.length,1);assert.equal(chats[0].options.rollMode,'gmroll');
});
test('Fechar a escolha conserva o melhor dado e não permite descartar o teste',async()=>{
  const a=actor();setup(a);dialogs.push({specialty:true,modifier:0},null);dice.push({feats:[2,12],dice:[1,1,1]});
  const r=await rollSkill(a,'persuade');assert.equal(r.automatic,true);assert.equal(a.system.specialtyUsed,true);
});
test('Origem exige justificativa e não se aplica fora da perícia',async()=>{
  const a=actor();setup(a);dialogs.push({origin:true,modifier:0,reason:''});await rollSkill(a,'courtesy');assert.equal(errors.length,1);assert.equal(updates.length,0);
  dialogs.push({origin:true,modifier:0,reason:'Costume aprendido'});await rollSkill(a,'travel');assert.equal(errors.length,2);assert.equal(updates.length,0);
});
test('Benefício pertinente acrescenta dado e é marcado, sem gastar Esperança',async()=>{
  const a=actor();setup(a);dialogs.push({origin:true,modifier:0,reason:'Forma de apresentação aprendida'});dice.push({feats:[6],dice:[2,4,6]});
  await rollSkill(a,'courtesy');assert.equal(a.system.originUsed,true);assert.equal(a.system.hope.value,12);assert.equal(chats[0].formula,'1d12 + 3d6');
});
test('Apoio cobra do ajudante e não do protagonista',async()=>{
  const a=actor(),b=actor('b');setup(a).push(b);b.system.skills.craft=1;
  dialogs.push({modifier:0,helper:'b',helperSkill:'craft',helpReason:'Segura o tecido para o reparo'});dice.push({feats:[8],dice:[3,6]});
  await rollSkill(a,'craft');assert.equal(a.system.hope.value,12);assert.equal(b.system.hope.value,11);assert.equal(chats[0].formula,'1d12 + 2d6');
});
test('Permissão e falta de Esperança bloqueiam gastos',async()=>{
  const a=actor();setup(a);a.isOwner=false;await rollSkill(a,'travel');assert.equal(errors.length,1);assert.equal(updates.length,0);
  a.isOwner=true;a.system.hope.value=0;dialogs.push({hope:true,modifier:0});await rollSkill(a,'travel');assert.equal(errors.length,2);assert.equal(updates.length,0);
});
test('Contexto da ficha oferece as 18 perícias e mostra pendência de criação',async()=>{
  const a=actor();setup(a);const sheet=new CharacterSheet();sheet.document=a;sheet.isEditable=true;
  const ctx=await sheet._prepareContext({});assert.equal(ctx.attributes.flatMap(a=>a.skills).length,18);assert.equal(ctx.warnings.length,1);assert.equal(ctx.weary,false);
});

const {dieIcon}=await import('../scripts/roll.mjs');
test('Ícones identificam d12 e d6, símbolos especiais e seleção sem depender só de cor',()=>{
  assert.match(dieIcon(12,9,{selected:true}),/aria-label="d12: 9, escolhido"/);
  assert.match(dieIcon(12,11,{discarded:true}),/aria-label="d12: Olho \(0\), descartado"/);
  assert.match(dieIcon(12,12),/Êxito/);
  assert.match(dieIcon(6,6,{six:true}),/d6: 6/);
});
test('Chat conserva os dois d12 com escolhido e descartado e identifica a quantidade de d6',async()=>{
  const a=actor();setup(a);dialogs.push({specialty:true,modifier:0},0);dice.push({feats:[9,11],dice:[5,2,2]});
  await rollSkill(a,'persuade');const content=chats[0].data.content;
  assert.match(content,/Façanha · 2d12/);assert.match(content,/Sucesso · 3d6/);
  assert.match(content,/d12: 9, escolhido/);assert.match(content,/d12: Olho \(0\), descartado/);
  assert.doesNotMatch(content,/narradora|Consequências de falha/);
  assert.equal(a.system.hope.value,12);assert.equal(a.system.specialtyUsed,true);
});

test('Escolha usa HTML no conteúdo e rótulo de botão em texto simples',async()=>{
  const a=actor();setup(a);dialogs.push({specialty:true,modifier:0},1);dice.push({feats:[3,8],dice:[2,2,2]});
  await rollSkill(a,'persuade');const choice=dialogConfigs[1];
  assert.match(choice.content,/type="radio" name="chosen" value="0"/);
  assert.match(choice.content,/d12: 3/);assert.match(choice.content,/d12: 8/);
  assert.equal(choice.buttons[0].label,'Escolher');
  assert.equal(choice.buttons[0].callback(null,{form:{elements:{chosen:{value:'1'}}}}),1);
  assert.equal(chats[0].data.flags['companhia-do-caminho'].chosen,1);
});
test('D12 e d6 possuem geometria de faces e valor separado acessível',()=>{
  for(const faces of [12,6]){
    const icon=dieIcon(faces,4);assert.match(icon,/viewBox="0 0 64 64"/);
    assert.match(icon,/class="cdc-die-value">4/);assert.match(icon,/<path /);
  }
});
