// Static cards remain usable if this enhancement or the catalogue service is unavailable.
(async()=>{
  try {
    const response=await fetch('/api/catalogue-public');if(!response.ok) return;
    const {shops}=await response.json();
    for(const shop of shops) {
      const card=Array.from(document.querySelectorAll('[data-source-id]')).find(card=>card.dataset.sourceId===shop.source_id);if(!card) continue;
      card.querySelector('h2').textContent=shop.name;card.querySelector('.eyebrow').textContent=shop.category;
      card.querySelector('.market-details > p:not(.eyebrow)').textContent=shop.description;
      const links=card.querySelector('.market-links');
      const anchor=(href,label,icon)=>{
        const a=document.createElement('a');a.className='market-contact';a.href=href;
        if(icon) a.append(icon.cloneNode(true));a.append(document.createTextNode(label));
        if(href.startsWith('https:')) {a.target='_blank';a.rel='noopener noreferrer';}return a;
      };
      const old=Array.from(links.querySelectorAll('a'));
      const contactIcon=part=>old.find(link=>link.href.includes(part))?.querySelector('svg');
      const updated=[anchor('/shops/'+encodeURIComponent(shop.id),'View catalogue')];
      if(/^\d{8,15}$/.test(shop.whatsapp||'')) updated.push(anchor('https://wa.me/'+shop.whatsapp,'WhatsApp',contactIcon('wa.me')));
      if(/^[\w.]{1,30}$/.test(shop.instagram||'')) updated.push(anchor('https://www.instagram.com/'+shop.instagram+'/','Instagram',contactIcon('instagram.com')));
      if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shop.email||'')) updated.push(anchor('mailto:'+shop.email,'Email',contactIcon('mailto:')));
      links.replaceChildren(...updated);
      if(shop.flyer && shop.gallery[0]) {
        const gallery=document.createElement('div');gallery.className='market-gallery';gallery.dataset.imageCount='1';
        const link=anchor(shop.gallery[0].url,'');link.className='market-gallery-photo';link.setAttribute('aria-label','Open '+shop.name+' flyer');
        const image=document.createElement('img');image.src=shop.gallery[0].url;image.alt=shop.name+' flyer';image.loading='lazy';image.decoding='async';link.append(image);gallery.append(link);
        const oldGallery=card.querySelector('.market-gallery');if(oldGallery) oldGallery.replaceWith(gallery);else card.prepend(gallery);
      }
    }
  } catch { /* Keep the statically published market cards. */ }
})();
