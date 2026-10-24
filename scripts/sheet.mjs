import {ID,ATTRIBUTES,SKILLS,ORIGINS,ROLES,isWeary,creationWarnings,recovery} from './rules.mjs';
import {rollSkill} from './roll.mjs';
export class CharacterSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS={classes:['cdc','cdc-sheet'],tag:'form',position:{width:860,height:800},
    window:{resizable:true},form:{submitOnChange:true,closeOnSubmit:false},
    actions:{roll:CharacterSheet.onRoll,rest:CharacterSheet.onRest,reset:CharacterSheet.onReset,example:CharacterSheet.onExample}};
  static PARTS={main:{template:`systems/${ID}/templates/character.hbs`,scrollable:['.cdc-body']}};
  async _prepareContext(options) {
    const ctx=await super._prepareContext(options),s=this.document.system;
    return {...ctx,actor:this.document,s,readOnly:!this.isEditable,
      weary:isWeary(s),incapacitated:s.resistance.value===0,
      total:Object.values(s.skills).reduce((a,b)=>a+b,0),warnings:creationWarnings(s),
      attributes:Object.entries(ATTRIBUTES).map(([key,label])=>({key,label,value:s.attributes[key],target:20-s.attributes[key],
        skills:Object.entries(SKILLS).filter(([,v])=>v.attribute===key).map(([id,v])=>({id,label:v.label,value:s.skills[id]}))})),
      origins:Object.entries(ORIGINS).map(([key,v])=>({key,label:v.label,selected:s.origin===key})),
      roles:Object.entries(ROLES).map(([key,v])=>({key,label:v.label,selected:s.role===key})),
      specialties:[{key:'none',label:'Ainda não definida',selected:s.specialty==='none'},...Object.entries(SKILLS).map(([key,v])=>({key,label:v.label,selected:s.specialty===key}))],
      benefit:ORIGINS[s.origin].benefit,isGM:game.user.isGM};
  }
  static async onRoll(_e,target) {if(!this.isEditable)return;await this.submit();return rollSkill(this.document,target.dataset.skill);}
  static async onRest(_e,target) {
    if(!this.isEditable)return;await this.submit();
    const kind=target.dataset.kind;
    const label={shelter:'Noite com abrigo, água e alimento: +4 Resistência e −1 Fadiga.',rough:'Noite precária: +2 Resistência; mantém Fadiga.',community:'Intervalo comunitário efetivo: restaura Resistência e Esperança e zera Fadiga.'}[kind];
    const yes=await foundry.applications.api.DialogV2.confirm({window:{title:'Aplicar recuperação'},content:`<p>${label}</p><p>Aplique uma vez por período realmente transcorrido, conforme combinado com a narradora. Ferimentos não são curados.</p>`,rejectClose:false});
    if(!yes)return;
    const result=recovery(this.document.system,kind);
    await this.document.update({'system.resistance.value':result.resistance,'system.hope.value':result.hope,'system.fatigue':result.fatigue});
  }
  static async onReset(_e,target) {
    if(!this.isEditable)return;await this.submit();const adventure=target.dataset.kind==='adventure';
    const yes=await foundry.applications.api.DialogV2.confirm({window:{title:adventure?'Nova aventura':'Nova sessão'},
      content:`<p>Renovar ${adventure?'o benefício cultural para a próxima aventura':'a especialidade para a próxima sessão'} deste personagem? Recursos não serão recuperados.</p>`,rejectClose:false});
    if(yes)await this.document.update({[adventure?'system.originUsed':'system.specialtyUsed']:false});
  }
  static async onExample(){if(game.user.isGM)await game.caminho.createExample();}
}
