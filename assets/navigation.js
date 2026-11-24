(() => {
 const disclosure=document.querySelector('.explore-navigation');if(!disclosure)return;
 const trigger=disclosure.querySelector('summary'),links=[...disclosure.querySelectorAll('nav a')];
 const mobile=matchMedia('(max-width: 760px)');
 function reset(){disclosure.open=!mobile.matches;}
 reset();mobile.addEventListener('change',reset);
 function close(restoreFocus=false){if(mobile.matches&&disclosure.open){disclosure.open=false;if(restoreFocus)trigger.focus();}}
 document.addEventListener('click',event=>{if(!disclosure.contains(event.target))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobile.matches&&disclosure.open){event.preventDefault();close(true);}});
 links.forEach(link=>link.addEventListener('click',()=>close()));
 function currentSection(){
  const about=links.find(link=>link.dataset.section==='about');
  const writing=links[0];const normalize=pathname=>pathname.replace(/index\.html$/,'');
  if(!about||normalize(location.pathname)!==normalize(new URL(writing.href).pathname))return;
  writing.removeAttribute('aria-current');about.removeAttribute('aria-current');
  (location.hash==='#about'?about:writing).setAttribute('aria-current','location');
 }
 currentSection();addEventListener('hashchange',currentSection);
})();
