import registry from './shop-slugs.json' with {type:'json'};
export function shopSlug(shop){return registry.find(entry=>entry.id===shop.id)?.slug||shop.published_profile?.slug||shop.profile?.slug||shop.slug||'shop-'+shop.id;}
export function shopPath(shop){return '/market/'+shopSlug(shop);}
export function registeredShopId(slug){return registry.find(entry=>entry.slug===slug)?.id||(slug.startsWith('shop-')?slug.slice(5):null);}
export function initialShopSlug(name,sourceId){const clean=name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'business';let hash=2166136261;for(const character of sourceId){hash^=character.charCodeAt(0);hash=Math.imul(hash,16777619);}return clean+'-'+(hash>>>0).toString(16).padStart(8,'0');}
