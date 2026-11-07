import {defineField,defineType} from 'sanity';
export const reflection=defineType({
 name:'reflection',title:'Article',type:'document',
 fields:[
  defineField({name:'title',title:'Article title',type:'string',validation:r=>r.required().max(250)}),
  defineField({name:'slug',title:'Article address',type:'slug',options:{source:'title',maxLength:100},description:'Click Generate for a new article. Keep this unchanged after publishing so shared links continue working.',validation:r=>r.required().custom(value=>!value?.current||/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)?true:'Use lowercase letters, numbers and single hyphens.')}),
  defineField({name:'category',title:'Topic',type:'string',initialValue:'Life & perspective',options:{list:['Life & perspective','Small joys','Growth & ambition','Love & Lagos']},validation:r=>r.required()}),
  defineField({name:'excerpt',title:'Short introduction',type:'text',rows:3,description:'Shown in the reading list and link previews.',validation:r=>r.required().max(500)}),
  defineField({name:'body',title:'Your article',type:'text',rows:24,description:'Paste your writing here. Blank lines make paragraphs. Your wording, emoji and line breaks are preserved. Draft changes save automatically; click Publish / Update website when ready.',validation:r=>r.required()}),
  defineField({name:'coverImage',title:'Optional photograph',type:'image',options:{hotspot:true},fields:[defineField({name:'alt',title:'Describe the image',type:'string',validation:r=>r.custom((value,context)=>context.parent?.asset&&!value?.trim()?'Describe the image before publishing.':true)}),defineField({name:'caption',title:'Caption or credit',type:'string'})]}),
  defineField({name:'date',title:'Publication date (optional)',type:'date',description:'Leave blank for older pieces whose original date is unknown. This is a label; it does not schedule publication.'}),
  defineField({name:'featured',title:'Feature on the homepage',type:'boolean',initialValue:false,description:'Select one lead story. If several are selected, the first in reading order is used.'}),
  defineField({name:'order',title:'Archive order',type:'number',initialValue:0,description:'For undated articles: lower numbers come first.'})
 ],
 preview:{select:{title:'title',subtitle:'category',media:'coverImage'}},
 orderings:[{title:'Archive order',name:'archiveOrder',by:[{field:'order',direction:'asc'}]}]
});
