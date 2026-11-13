import {defineField,defineType} from 'sanity';
import {RichInput} from './rich-input.js';
import {plainArticleText} from '../reading-text.mjs';
export const reflection=defineType({
 name:'reflection',title:'Article',type:'document',
 fields:[
  defineField({name:'title',title:'Article title',type:'string',validation:r=>r.required().max(250)}),
  defineField({name:'slug',title:'Article address',type:'slug',options:{source:'title',maxLength:100},description:'Click Generate for a new article. Keep this unchanged after publishing so shared links continue working.',validation:r=>r.required().custom(value=>!value?.current||/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)?true:'Use lowercase letters, numbers and single hyphens.')}),
  defineField({name:'category',title:'Topic',type:'string',initialValue:'Life & perspective',options:{list:['Life & perspective','Small joys','Growth & ambition','Love & Lagos']},validation:r=>r.required()}),
  defineField({name:'excerpt',title:'Short introduction',type:'text',rows:3,description:'Shown in the reading list and link previews.',validation:r=>r.required().max(500)}),
  defineField({name:'body',title:'Original article text',type:'text',readOnly:true,hidden:({document})=>!document?.body||!!document?.richBody}),
  defineField({name:'richBody',title:'Your article',type:'array',components:{input:RichInput},
   validation:r=>r.custom((value,context)=>(value?plainArticleText(value):context.document?.body)?.trim()?true:'Write your article before publishing.'),
   of:[{type:'block',styles:[{title:'Normal',value:'normal'},{title:'Heading',value:'h2'},{title:'Subheading',value:'h3'},{title:'Quote',value:'blockquote'}],
    lists:[{title:'Bulleted',value:'bullet'},{title:'Numbered',value:'number'}],
    marks:{decorators:[{title:'Bold',value:'strong'},{title:'Italic',value:'em'},{title:'Underline',value:'underline'},{title:'Strikethrough',value:'strike-through'}],
     annotations:[{name:'link',title:'Link',type:'object',fields:[{name:'href',title:'Web address',type:'url',validation:r=>r.required().uri({scheme:['http','https']})}]}]}}]}),
  defineField({name:'coverImage',title:'Story cover photograph',type:'image',description:'Optional. Shown on the story card, featured story and article page. Your upload replaces the starter cover. Add a short image description before publishing.',options:{hotspot:true},fields:[defineField({name:'alt',title:'Describe the image',type:'string',validation:r=>r.custom((value,context)=>context.parent?.asset&&!value?.trim()?'Describe the image before publishing.':true)}),defineField({name:'caption',title:'Caption or credit',type:'string'})]}),
  defineField({name:'date',title:'Publication date (optional)',type:'date',description:'Leave blank for older pieces whose original date is unknown. This is a label; it does not schedule publication.'}),
  defineField({name:'featured',title:'Feature on the homepage',type:'boolean',initialValue:false,description:'Select one lead story. If several are selected, the first in reading order is used.'}),
  defineField({name:'order',title:'Archive order',type:'number',initialValue:0,description:'For undated articles: lower numbers come first.'})
 ],
 preview:{select:{title:'title',subtitle:'category',media:'coverImage'}},
 orderings:[{title:'Archive order',name:'archiveOrder',by:[{field:'order',direction:'asc'}]}]
});
