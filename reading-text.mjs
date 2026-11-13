export const escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function articleParagraphs(text){
 return text.trim().split(/\n\s*\n/).flatMap(block=>{
  const lines=block.trim().split('\n');
  // WhatsApp prose is often pasted as separate long lines rather than blank-line paragraphs.
  // Keep short verse/list blocks together; give narrative thoughts their own paragraphs.
  if(lines.length>1&&lines.filter(line=>line.length>70).length>=2)return lines.map(line=>`<p>${escapeText(line.trim())}</p>`);
  return [`<p>${escapeText(block.trim()).replace(/\n/g,'<br>')}</p>`];
 }).join('\n');
}

export function legacyBlocks(text) {
 let key=0;
 return text.trim().split(/\n\s*\n/).flatMap(block=>{
  const lines=block.trim().split('\n');
  return lines.filter(line=>line.length>70).length>=2?lines.map(line=>line.trim()):[block.trim()];
 }).map(value=>({_type:'block',_key:'b'+key,style:'normal',markDefs:[],children:[{_type:'span',_key:'s'+key++,text:value,marks:[]}]}));
}

export function plainArticleText(blocks) {
 return Array.isArray(blocks)?blocks.filter(b=>b?._type==='block').map(b=>(b.children||[]).map(s=>s?.text||'').join('')).join('\n\n'):'';
}

export function renderArticle(blocks, legacy = '') {
 if (!Array.isArray(blocks)) return articleParagraphs(legacy);
 const styles={h2:'h2',h3:'h3',blockquote:'blockquote'};
 const decorators={strong:'strong',em:'em',underline:'u', 'strike-through':'s'};
 const html=[];
 let list='';
 for (const block of blocks.filter(item=>item?._type==='block')) {
  const nextList=block.listItem==='bullet'?'ul':block.listItem==='number'?'ol':'';
  if (nextList!==list) {
   if(list) html.push('</'+list+'>');
   if(nextList) html.push('<'+nextList+'>');
   list=nextList;
  }
  const tag=list?'li':Object.hasOwn(styles,block.style)?styles[block.style]:'p';
  const spans=(block.children||[]).filter(span=>span?._type==='span').map(span=>{
   let content=escapeText(span.text||'').replace(/\n/g,'<br>');
   for (const mark of span.marks||[]) {
    if (Object.hasOwn(decorators,mark)) {
     const element=decorators[mark];
     content=`<${element}>${content}</${element}>`;
    } else {
     const link=block.markDefs?.find(item=>item._key===mark && item._type==='link');
     if(typeof link?.href==='string' && /^https?:\/\/[^\s]+$/i.test(link.href)) content=`<a href="${escapeText(link.href)}" rel="noopener noreferrer">${content}</a>`;
    }
   }
   return content;
  });
  html.push(`<${tag}>${spans.join('')}</${tag}>`);
 }
 if(list) html.push('</'+list+'>');
 return html.join('\n');
}
