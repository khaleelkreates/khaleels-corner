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
