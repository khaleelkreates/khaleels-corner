import {marketCategory} from './market-categories.mjs';
import {shopPath} from './shop-routes.mjs';
import {escapeText as esc} from './reading-text.mjs';

export const starterListings = [
 {name:'Loluwa Kennel Limited',category:'Dogs & breeding',description:'Healthy, vaccinated dogs, a choice of breeds, and friendly, expert care.',whatsapp:'2348161737445'},
 {name:'Luxury Hair',category:'Hair & beauty',description:'Luxury hair at affordable prices, with worldwide delivery. Message the seller for current prices and offers.',whatsapp:'2348173786990'},
 {name:'Divine Sartorial House',category:'Fashion',description:'See their latest work and get in touch on Instagram.',instagram:'divinesartorialhouse'},
 {name:'Racheal Footies',category:'Footwear',description:'Browse their styles and get in touch on Instagram.',instagram:'racheal_footies'},
];

const icons = {
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 style:'<path d="m8 3-5 3 3 5 2-1v11h8V10l2 1 3-5-5-3-4 3-4-3Z"/>',
 food:'<path d="M4 12h16v9H4zM3 12c0-4 3-4 4-2 1-4 4-4 5-1 2-3 5-2 5 1 3-2 5 0 4 2M8 6V4m4 2V2m4 4V4"/>',
 pets:'<ellipse cx="12" cy="16" rx="6" ry="5"/><ellipse cx="5" cy="8" rx="2" ry="3"/><ellipse cx="11" cy="5" rx="2" ry="3"/><ellipse cx="18" cy="7" rx="2" ry="3"/>',
 property:'<path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/>',
 autos:'<path d="m4 10 2-6h12l2 6M3 10h18v8H3zM5 18v3m14-3v3M6 14h2m8 0h2"/>',
 services:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3"/>',
 writing:'<path d="m4 20 4-1L21 6l-4-4L4 15v5ZM14 5l5 5M3 22h18"/>',
 person:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
 help:'<circle cx="12" cy="12" r="10"/><path d="M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 3h.01"/>',
 email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
 whatsapp:'<path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L4 20l.8-3.8a8.5 8.5 0 1 1 15.7-4.5Z"/><path d="M9 8c-.7 0-1 .6-1 1.3 0 2.2 3.5 5.6 5.8 5.7.8 0 1.4-.5 1.4-1.2l-2-1-.8.7a6 6 0 0 1-2.8-2.8l.6-.8L9 8Z"/>',
 instagram:'<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><path d="M16.8 7.3h.1"/>',
 shop:'<path d="M4 11v9h16v-9M3 10l2-6h14l2 6a3 3 0 0 1-5 2 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-5-2Zm7 10v-5h4v5"/>',
};
export const icon = name => `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const actionIcon = kind => `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24"><use href="/market-icons.svg#${kind}"></use></svg>`;
const external = (href,label,kind) => `<a class="market-contact market-action-${kind}" href="${esc(href)}" aria-label="${esc(label)}" title="${esc(label)}" target="_blank" rel="noopener noreferrer">${actionIcon(kind)}<span class="contact-label">${esc(label)}</span></a>`;

function safeMarketImage(value) {
 if(/^https:\/\/cdn\.sanity\.io\/images\/[\w/.-]+$/.test(value||'')) return true;
 const origin=process.env.MARKET_SUPABASE_URL?.trim().replace(/\/$/,'');
 return !!origin && typeof value==='string' && value.startsWith(origin+'/storage/v1/object/public/corner-market/') && /^[\w/.-]+$/.test(value.slice((origin+'/storage/v1/object/public/corner-market/').length));
}
function galleryMarkup(gallery=[]) {
 const images=(gallery||[]).filter(image=>safeMarketImage(image?.url));
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
function marketCard(item){
 const route=item.id?shopPath(item):null;
 const contacts=[/^\d{8,15}$/.test(item.whatsapp||'')?external('https://wa.me/'+item.whatsapp,'WhatsApp','whatsapp'):'',/^[\w.]{1,30}$/.test(item.instagram||'')?external('https://www.instagram.com/'+item.instagram+'/','Instagram','instagram'):'',/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(item.email||'')?external('mailto:'+item.email,'Email','email'):''].join('');
 return `<article class="market-item" data-source-id="${esc(item._id||item.source_id||'')}" data-market-group="${marketCategory(item.category)}">${galleryMarkup((item.gallery||[]).slice(0,1))}<div class="market-details"><p class="eyebrow">${esc(item.category)}</p><h2>${route?`<a href="${esc(route)}">${esc(item.name)}</a>`:esc(item.name)}</h2><div class="market-links">${route?`<a class="market-contact market-action-catalogue" href="${esc(route)}" aria-label="View ${esc(item.name)} catalogue">${actionIcon('catalogue')}<span class="contact-label">Catalogue</span></a>`:''}</div><details class="market-card-more"><summary>About &amp; contact</summary><p class="market-description">${esc(item.description)}</p><div class="market-socials">${contacts}</div></details></div></article>`;
}
export function marketPage(listings,ownerWhatsApp='2349060379294'){
 const addLink=/^\d{8,15}$/.test(ownerWhatsApp||'')?external('https://wa.me/'+ownerWhatsApp+'?text='+encodeURIComponent('Hi Khaleel! I’d like to add my business to the Corner Market.'),'Ask Khaleel on WhatsApp','whatsapp'):'';
 const groups=[['All','shop'],['Style','style'],['Food','food'],['Services','services'],['Pets','pets'],['Property','property'],['Autos','autos']];
 return `<main class="market-page" id="main"><section class="market-hero"><p class="market-kicker">GOOD PEOPLE. GOOD BUSINESSES.</p><h1>The Corner <em>Market.</em></h1><p>Discover a business. Find your people.</p></section><section class="market-browse" aria-label="Find a business" hidden><label class="market-search">${icon('search')}<span class="visually-hidden">Search businesses, services or categories</span><input id="market-search" type="search" placeholder="What are you looking for?" autocomplete="off"></label><div class="market-categories" role="group" aria-label="Business categories">${groups.map(([name,kind])=>`<button type="button" data-market-filter="${name}" aria-pressed="${name==='All'}"><span class="category-icon">${icon(kind)}</span><span>${name}</span><small data-count></small></button>`).join('')}</div></section><div class="market-section-heading"><h2>Explore the businesses</h2><p id="market-results" aria-live="polite">${listings.length} businesses</p></div><section class="market-grid" aria-label="Businesses">${listings.map(marketCard).join('')}</section><div class="market-empty" hidden><h2>Nothing here just yet.</h2><p>Try another word or explore all the businesses.</p><button type="button" id="market-reset">Clear filters</button></div><section class="market-join"><p class="market-kicker">A SPACE FOR YOUR BUSINESS</p><h2>Join the Corner.</h2><p>Listings are free. Let’s make room for your work.</p>${addLink}</section><nav class="market-mobile-nav" aria-label="Market shortcuts"><a href="index.html#journal">${icon('writing')}<span>Writing</span></a><a href="market.html" aria-current="page">${icon('shop')}<span>Market</span></a><a href="seller.html">${icon('person')}<span>My shop</span></a><a href="seller-guide.html">${icon('help')}<span>Guide</span></a></nav></main><script src="/market-browse.js" defer></script><script src="/market-catalogue.js" defer></script>`;
}
export function commentSection(slug) {
 return `<section class="story-comments" data-story="${esc(slug)}" aria-labelledby="comments-title"><h2 id="comments-title">Leave a note</h2><p>What did this story bring to mind?</p><form hidden><label>Your comment<textarea name="message" required maxlength="1200" rows="4"></textarea></label><label>Sign as <span>(optional)</span><input name="signature" maxlength="40" placeholder="A name, a nickname, or leave blank"></label><div hidden aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div><button type="submit">Post comment</button></form><p role="status"></p><noscript>Enable JavaScript to read and leave comments.</noscript><ol class="comment-list"></ol></section>`;
}
