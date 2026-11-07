const rows=[...document.querySelectorAll('.post-row')];
const search=document.querySelector('#search');
let category='All';
function filter(){const q=search.value.trim().toLocaleLowerCase();let count=0;rows.forEach(row=>{row.hidden=!((category==='All'||row.dataset.category===category)&&row.dataset.search.includes(q));if(!row.hidden)count++});document.querySelector('.empty-state').hidden=count!==0;const note=document.querySelector('.results-note');note.hidden=category==='All'&&!q;note.textContent=`${count} ${count===1?'piece':'pieces'} found.`}
if(search){document.querySelector('.journal-tools').hidden=false;search.addEventListener('input',filter);document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});filter()}))}
const share=document.querySelector('.whatsapp-share');
if(share&&/^https?:$/.test(location.protocol)){share.href='https://wa.me/?text='+encodeURIComponent(share.dataset.title+' — Khaleel’s Corner\n'+location.href);share.hidden=false}
document.querySelector('.copy-link')?.addEventListener('click',async()=>{const status=document.querySelector('.share-status');if(location.protocol==='file:'){status.textContent='This is a local preview. Share the public link after deployment.';return}try{await navigator.clipboard.writeText(location.href);status.textContent='Link copied. Send it to your person.'}catch{status.textContent='Copy this page’s link from the address bar.'}});
const progress=document.querySelector('.reading-progress span');
const prose=document.querySelector('.prose');
if(progress&&prose){let pending=false;const update=()=>{const rect=prose.getBoundingClientRect();const range=Math.max(1,rect.height-window.innerHeight*.5);const fraction=Math.max(0,Math.min(1,(window.innerHeight*.3-rect.top)/range));progress.style.transform=`scaleX(${fraction})`;pending=false};window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(update)}},{passive:true});window.addEventListener('resize',update);update()}
