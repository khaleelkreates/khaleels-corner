// Static cards remain usable if this enhancement or the catalogue service is unavailable.
(async()=>{
  try {
    const response=await fetch('/api/catalogue-public');if(!response.ok) return;
    const {shops}=await response.json();
    for(const shop of shops) {
      const card=Array.from(document.querySelectorAll('[data-source-id]')).find(card=>card.dataset.sourceId===shop.source_id);if(!card) continue;
      const title=card.querySelector('h2 a')||card.querySelector('h2');title.textContent=shop.name;if(title.tagName==='A')title.href=shop.url;card.dataset.marketGroup=shop.group||card.dataset.marketGroup;card.querySelector('.eyebrow').textContent=shop.category;
      card.querySelector('.market-description').textContent=shop.description;
      const links=card.querySelector('.market-links');
      const anchor=(href,label,kind)=>{
        const a=document.createElement('a');a.className='market-contact';a.href=href;
        if(kind) {
          a.classList.add('market-action-'+kind);a.setAttribute('aria-label',label);a.title=label;
          const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','22');svg.setAttribute('height','22');svg.setAttribute('aria-hidden','true');
          const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','/market-icons.svg#'+kind);svg.append(use);a.append(svg);
        }
        const text=document.createElement('span');text.className='contact-label';text.textContent=label;a.append(text);
        if(href.startsWith('https:')) {a.target='_blank';a.rel='noopener noreferrer';}return a;
      };
      const updated=[anchor(shop.url||'/shops/'+encodeURIComponent(shop.id),'Catalogue','catalogue')];
      if(/^\d{8,15}$/.test(shop.whatsapp||'')) updated.push(anchor('https://wa.me/'+shop.whatsapp,'WhatsApp','whatsapp'));
      if(/^[\w.]{1,30}$/.test(shop.instagram||'')) updated.push(anchor('https://www.instagram.com/'+shop.instagram+'/','Instagram','instagram'));
      if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shop.email||'')) updated.push(anchor('mailto:'+shop.email,'Email','email'));
      links.replaceChildren(updated[0]);card.querySelector('.market-socials').replaceChildren(...updated.slice(1));
      if(shop.flyer && shop.gallery[0]) {
        const gallery=document.createElement('div');gallery.className='market-gallery';gallery.dataset.imageCount='1';
        const link=anchor(shop.gallery[0].url,'');link.className='market-gallery-photo';link.setAttribute('aria-label','Open '+shop.name+' flyer');
        const image=document.createElement('img');image.src=shop.gallery[0].url;image.alt=shop.name+' flyer';image.loading='lazy';image.decoding='async';const expand=document.createElement('span');expand.className='market-expand';expand.textContent='↗';expand.setAttribute('aria-hidden','true');link.append(image,expand);gallery.append(link);
        const oldGallery=card.querySelector('.market-gallery');if(oldGallery) oldGallery.replaceWith(gallery);else card.prepend(gallery);
      }
    }
    document.dispatchEvent(new Event('market:updated'));
  } catch { /* Keep the statically published market cards. */ }
})();
