import {SKILLS,resistanceMax,hopeMax,clamp,ORIGINS,ROLES} from './rules.mjs';
const f=foundry.data.fields;
const number=(initial,max=999)=>new f.NumberField({required:true,nullable:false,integer:true,min:0,max,initial});
const string=(initial='')=>new f.StringField({required:true,nullable:false,initial});
export class CharacterModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      attributes:new f.SchemaField({body:number(5,10),spirit:number(6,10),wit:number(4,10)}),
      skills:new f.SchemaField(Object.fromEntries(Object.keys(SKILLS).map(k=>[k,number(0,3)]))),
      resistance:new f.SchemaField({value:number(28)}),hope:new f.SchemaField({value:number(12)}),
      load:number(5),fatigue:number(0),reservedPoints:number(0,16),
      origin:new f.StringField({required:true,nullable:false,initial:'none',choices:Object.keys(ORIGINS)}),
      role:new f.StringField({required:true,nullable:false,initial:'none',choices:Object.keys(ROLES)}),
      specialty:new f.StringField({required:true,nullable:false,initial:'none',choices:['none',...Object.keys(SKILLS)]}),
      originUsed:new f.BooleanField({initial:false}),specialtyUsed:new f.BooleanField({initial:false}),
      shaken:new f.BooleanField({initial:false}),wounded:new f.BooleanField({initial:false}),
      background:new f.SchemaField(Object.fromEntries(['age','grewUp','community','period','citizenship','languages','literacy','occupation','motivation','tension','traits','bonds','custom','contact','memory','journeyRole','patron','equipment','notes'].map(k=>[k,string()])))
    };
  }
  prepareDerivedData() {
    this.resistance.max=resistanceMax(this);this.hope.max=hopeMax(this);
    this.resistance.value=clamp(this.resistance.value,0,this.resistance.max);
    this.hope.value=clamp(this.hope.value,0,this.hope.max);
  }
}
