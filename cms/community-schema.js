import {defineField,defineType} from 'sanity';

export const marketListing = defineType({
 name:'marketListing',title:'Market listing',type:'document',
 fields:[
  defineField({name:'name',type:'string',validation:r=>r.required().max(100)}),
  defineField({name:'category',type:'string',validation:r=>r.required().max(60)}),
  defineField({name:'description',type:'text',rows:4,validation:r=>r.required().max(600)}),
  defineField({name:'whatsapp',title:'WhatsApp number (international digits)',type:'string',validation:r=>r.regex(/^\d{8,15}$/)}),
  defineField({name:'instagram',title:'Instagram username',type:'string',validation:r=>r.regex(/^[\w.]{1,30}$/)}),
  defineField({name:'order',type:'number',initialValue:0}),
  defineField({name:'hidden',title:'Hide listing',type:'boolean',initialValue:false}),
 ],
});
export const storyComment = defineType({
 name:'storyComment',title:'Story comment',type:'document',
 fields:[
  defineField({name:'story',title:'Story address',type:'string',readOnly:true}),
  defineField({name:'message',type:'text',readOnly:true}),
  defineField({name:'signature',type:'string',readOnly:true}),
  defineField({name:'hidden',title:'Hide comment',type:'boolean',initialValue:false}),
 ],
 preview:{select:{title:'message',subtitle:'story'}},
});
