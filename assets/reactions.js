const reactionBar=document.querySelector('[data-reactions]');
if(reactionBar){
 const story=reactionBar.dataset.reactions;
 const endpoint='/api/reactions?story='+encodeURIComponent(story);
 const buttons=[...reactionBar.querySelectorAll('button')];
 const status=reactionBar.querySelector('[role="status"]');
 const storageKey='corner-reactions:'+story;
 let visitor;
 let selected={};
 try {
  const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');
  visitor=saved.visitor;
  selected=saved.selected||{};
 } catch {}
 visitor ||= crypto.randomUUID();
 async function request(options) {
  const response=await fetch(endpoint,options);
  if(!response.ok) throw Error('Reactions are unavailable right now.');
  return response.json();
 }
 function render(counts) {
  for(const button of buttons){
   const reaction=button.value;
   button.setAttribute('aria-pressed',String(selected[reaction]===true));
   button.querySelector('[data-count]').textContent=counts[reaction];
  }
 }
 request().then(counts=>{render(counts);reactionBar.hidden=false;}).catch(()=>{});
 for(const button of buttons) button.addEventListener('click',async()=>{
  const reaction=button.value;
  const active=!selected[reaction];
  buttons.forEach(item=>{item.disabled=true;});
  status.textContent='';
  try {
   const counts=await request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor,reaction,active})});
   selected[reaction]=active;
   try {localStorage.setItem(storageKey,JSON.stringify({visitor,selected}));} catch {}
   render(counts);
  } catch(error) {
   status.textContent=error.message;
  } finally {
   buttons.forEach(item=>{item.disabled=false;});
  }
 });
}
