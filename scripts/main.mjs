import {ID} from './rules.mjs';
import {CharacterModel} from './model.mjs';
import {CharacterSheet} from './sheet.mjs';
import {rollSkill} from './roll.mjs';
export async function createExample() {
  if(!game.user.isGM)return ui.notifications.warn('A narradora cria o exemplo.');
  const response=await fetch(`systems/${ID}/examples/comerciante.json`);
  if(!response.ok)throw Error('Não foi possível carregar o personagem de exemplo.');
  const data=await response.json();
  const actor=await Actor.create(data);actor.sheet.render({force:true});return actor;
}
Hooks.once('init',()=>{
  CONFIG.Actor.dataModels.personagem=CharacterModel;
  foundry.documents.collections.Actors.registerSheet(ID,CharacterSheet,{types:['personagem'],makeDefault:true,label:'Companhia do Caminho'});
  game.settings.register(ID,'welcomed',{scope:'world',config:false,type:Boolean,default:false});
  game.caminho={rollSkill,createExample};
});
Hooks.once('ready',async()=>{
  if(!game.user.isGM||game.settings.get(ID,'welcomed'))return;
  try {
    const yes=await foundry.applications.api.DialogV2.confirm({window:{title:'Bem-vindo à Companhia do Caminho'},
      content:'<p>Protótipo 0.1, baseado nas regras domésticas 0.3. Deseja criar o comerciante usado no teste?</p><p>A ficha também permite criar outras cópias depois.</p>',rejectClose:false});
    if(yes)await createExample();
    await game.settings.set(ID,'welcomed',true);
  }catch(error){console.error(ID,error);ui.notifications.error(error.message);}
});
