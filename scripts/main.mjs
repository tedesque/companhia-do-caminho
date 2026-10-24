import {ID} from './rules.mjs';
import {CharacterModel} from './model.mjs';
import {CharacterSheet} from './sheet.mjs';
import {rollSkill} from './roll.mjs';
export async function createExample() {
  if(!game.user.isGM)return ui.notifications.warn('Somente o GM pode criar este personagem.');
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
      content:'<p>Deseja criar um comerciante pré-definido?</p><p>Você pode personalizar nome, origem e habilidades na ficha.</p>',rejectClose:false});
    if(yes)await createExample();
    await game.settings.set(ID,'welcomed',true);
  }catch(error){console.error(ID,error);ui.notifications.error(error.message);}
});
