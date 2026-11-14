import {escapeText as esc} from './reading-text.mjs';

export const starterListings = [
 {name:'Loluwa Kennel Limited',category:'Dogs & breeding',description:'Healthy, vaccinated dogs, a choice of breeds, and friendly, expert care.',whatsapp:'2348161737445'},
 {name:'Luxury Hair',category:'Hair & beauty',description:'Luxury hair at affordable prices, with worldwide delivery. Message the seller for current prices and offers.',whatsapp:'2348173786990'},
 {name:'Divine Sartorial House',category:'Fashion',description:'See their latest work and get in touch on Instagram.',instagram:'divinesartorialhouse'},
 {name:'Racheal Footies',category:'Footwear',description:'Browse their styles and get in touch on Instagram.',instagram:'racheal_footies'},
];

const icons = {
 email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
 whatsapp:'<path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L4 20l.8-3.8a8.5 8.5 0 1 1 15.7-4.5Z"/><path d="M9 8c-.7 0-1 .6-1 1.3 0 2.2 3.5 5.6 5.8 5.7.8 0 1.4-.5 1.4-1.2l-2-1-.8.7a6 6 0 0 1-2.8-2.8l.6-.8L9 8Z"/>',
 instagram:'<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><path d="M16.8 7.3h.1"/>',
 shop:'<path d="M4 11v9h16v-9M3 10l2-6h14l2 6a3 3 0 0 1-5 2 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-5-2Zm7 10v-5h4v5"/>',
};
export const icon = name => `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const external = (href,label,kind) => `<a class="market-contact" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${icon(kind)} ${esc(label)}</a>`;

function galleryMarkup(gallery=[]) {
 const images=(gallery||[]).filter(image=>/^https:\/\/cdn\.sanity\.io\/images\/[\w/.-]+$/.test(image?.url||''));
 if(!images.length) return '';
 return `<div class="market-gallery" data-image-count="${images.length}">${images.map(({url,alt,profileScreenshot})=>{
  const description=esc(alt||'Business gallery image');
  if(profileScreenshot) return `<div class="market-gallery-logo"><img src="${esc(url)}?rect=92,407,356,356&w=480&auto=format" alt="${description}" loading="lazy" decoding="async"></div>`;
  return `<a class="market-gallery-photo" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open full image: ${description}"><img src="${esc(url)}?w=700&auto=format" alt="${description}" loading="lazy" decoding="async"><span class="market-expand" aria-hidden="true">↗</span></a>`;
 }).join('')}</div>`;
}

export function marketInvite(base) {
 return `<aside class="market-invite"><a class="market-roll" href="${base}market.html"><span class="market-roll-icon">${icon('shop')}</span><span>Visit the Corner Market <span aria-hidden="true">↗</span></span></a></aside>`;
}
export function marketPage(listings, ownerWhatsApp='2349060379294') {
 const addLink = /^\d{8,15}$/.test(ownerWhatsApp||'') ? external('https://wa.me/'+ownerWhatsApp+'?text='+encodeURIComponent("Hi Khaleel! I’d like to add my business to the Corner Market."),'Ask Khaleel on WhatsApp','whatsapp') : '';
 return `<main class="market-page" id="main"><a class="back-link" href="index.html#journal">← Back to the notebook</a><section class="market-hero"><span class="market-icon">${icon('shop')}</span><h1>The Corner <em>Market.</em></h1><p>A little space for businesses run by friends of the Corner.</p></section><section class="market-grid" aria-label="Businesses">${listings.map(item=>`<article class="market-item">${galleryMarkup(item.gallery)}<div class="market-details"><p class="eyebrow">${esc(item.category)}</p><h2>${esc(item.name)}</h2><p>${esc(item.description)}</p><div class="market-links">${/^\d{8,15}$/.test(item.whatsapp||'')?external('https://wa.me/'+item.whatsapp,'WhatsApp','whatsapp'):''}${/^[\w.]{1,30}$/.test(item.instagram||'')?external('https://www.instagram.com/'+item.instagram+'/','Instagram','instagram'):''}${/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(item.email||'')?external('mailto:'+item.email,'Email','email'):''}</div></div></article>`).join('')}</section><section class="market-join"><h2>Want your business here?</h2><p>Listings are free.</p>${addLink}</section></main>`;
}
export function commentSection(slug) {
 return `<section class="story-comments" data-story="${esc(slug)}" aria-labelledby="comments-title"><h2 id="comments-title">Leave a note</h2><p>What did this story bring to mind?</p><form hidden><label>Your comment<textarea name="message" required maxlength="1200" rows="4"></textarea></label><label>Sign as <span>(optional)</span><input name="signature" maxlength="40" placeholder="A name, a nickname, or leave blank"></label><div hidden aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div><button type="submit">Post comment</button></form><p role="status"></p><noscript>Enable JavaScript to read and leave comments.</noscript><ol class="comment-list"></ol></section>`;
}
