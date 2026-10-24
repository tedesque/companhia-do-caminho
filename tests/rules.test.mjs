import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolve,planRoll,recovery,isWeary,creationWarnings,SKILLS,ORIGINS} from '../scripts/rules.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../examples/comerciante.json',import.meta.url)));
const merchant=()=>structuredClone(source.system);
test('Os dezoito nomes e seus atributos correspondem ao croqui',()=>{
  assert.equal(Object.keys(SKILLS).length,18);assert.equal(SKILLS.supplies.attribute,'wit');
  assert.equal(SKILLS.insight.attribute,'spirit');assert.equal(SKILLS.craft.attribute,'body');
});
test('Travessia real do beta-teste: 1 + 6 + 1 = 8, falha, mesmo com seis',()=>{
  const r=resolve({feats:[1],dice:[6,1],target:15});
  assert.equal(r.total,8);assert.equal(r.success,false);assert.equal(r.sixes,1);assert.equal(r.degree,'Falha');
});
test('Gandalf dá sucesso automático, Olho vale zero sem falha automática',()=>{
  assert.equal(resolve({feats:[12],dice:[],target:30}).success,true);
  assert.equal(resolve({feats:[11],dice:[6,6,4],target:16}).success,true);
  assert.equal(resolve({feats:[11],dice:[6,6,4],target:16}).total,16);
});
test('Cansado zera apenas resultados 1–3 dos d6',()=>{
  const r=resolve({feats:[8],dice:[2,4,6],target:15,weary:true});
  assert.deepEqual(r.effective,[0,4,6]);assert.equal(r.total,18);assert.equal(r.degree,'Grande sucesso');
});
test('O jogador pode escolher qualquer um dos dois dados; nunca soma ambos',()=>{
  assert.equal(resolve({feats:[12,4],dice:[5],chosen:1,target:14}).total,9);
  assert.equal(resolve({feats:[12,4],dice:[5],chosen:0,target:14}).automatic,true);
});
test('Graus de sucesso e igualdade do alvo',()=>{
  assert.equal(resolve({feats:[8],dice:[6],target:14}).degree,'Grande sucesso');
  assert.equal(resolve({feats:[2],dice:[6,6],target:14}).degree,'Sucesso extraordinário');
  assert.equal(resolve({feats:[10],dice:[4],target:14}).degree,'Sucesso');
});
test('Alvos corretos e acúmulo de Esperança e origem sem mudar perícia',()=>{
  const s=merchant();assert.equal(planRoll(s,'supplies').target,16);
  assert.equal(planRoll(s,'travel').target,15);assert.equal(planRoll(s,'persuade').target,14);
  const p=planRoll(s,'courtesy',{hope:true,origin:true});assert.equal(p.count,4);assert.equal(s.skills.courtesy,2);
  assert.equal(planRoll(s,'persuade',{hope:true,specialty:true,modifier:2}).feats,2);
});
test('Uso de benefícios impede duplicação, perícia errada e função incoerente',()=>{
  const s=merchant();s.specialtyUsed=true;assert.throws(()=>planRoll(s,'persuade',{specialty:true}));
  s.specialtyUsed=false;s.role='provider';assert.throws(()=>planRoll(s,'persuade',{specialty:true}));
  assert.throws(()=>planRoll(s,'travel',{origin:true}));s.originUsed=true;
  assert.throws(()=>planRoll(s,'courtesy',{origin:true}));s.hope.value=0;
  assert.throws(()=>planRoll(s,'travel',{hope:true}));
});
test('As três origens possuem exatamente as perícias aprovadas',()=>{
  assert.deepEqual(ORIGINS.judea.skills,['courtesy','lore']);assert.deepEqual(ORIGINS.diaspora.skills,['courtesy','report']);
  assert.deepEqual(ORIGINS.greek.skills,['negotiate','investigate']);
});
test('Recuperação respeita máximos, noite comum não renova Esperança',()=>{
  const s=merchant();s.resistance.value=26;s.hope.value=9;s.fatigue=1;
  assert.deepEqual(recovery(s,'shelter'),{resistance:28,hope:9,fatigue:0});
  assert.deepEqual(recovery(s,'rough'),{resistance:28,hope:9,fatigue:1});
  assert.deepEqual(recovery(s,'community'),{resistance:28,hope:12,fatigue:0});
});
test('Condição Cansado muda exatamente no limite e não decorre da ansiedade',()=>{
  const s=merchant();s.load=5;s.fatigue=2;s.resistance.value=7;assert.equal(isWeary(s),true);
  s.resistance.value=8;s.shaken=true;assert.equal(isWeary(s),false);
});
test('A ficha mantém os dois pontos pendentes sem inventar Subterfúgio',()=>{
  const s=merchant();assert.equal(Object.values(s.skills).reduce((a,b)=>a+b,0),14);
  assert.equal(s.reservedPoints,2);assert.equal(s.skills.stealth,0);
  assert.equal(creationWarnings(s).length,1);assert.match(creationWarnings(s)[0],/reservado/);
});
test('Entradas de dados inválidas são rejeitadas',()=>{
  for(const input of [{feats:[0],dice:[],target:14},{feats:[13],dice:[],target:14},{feats:[5],dice:[7],target:14},{feats:[5],dice:[],target:NaN},{feats:[5],dice:[],target:14,chosen:1}])assert.throws(()=>resolve(input));
});
