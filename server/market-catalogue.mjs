import {database} from './market-access.mjs';
export const isId = value => typeof value === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
export function cleanCatalogue(profile, items) {
  function text(value, max, required=false) {
    if(typeof value !== 'string' || value.length>max || required && !value.trim()) throw Error('Check the text fields and their lengths.');
    return value.trim();
  }
  function photo(value) {if(value == null) return null;if(!isId(value)) throw Error('Invalid photo.');return value;}
  if(!profile || !Array.isArray(items) || items.length>5) throw Error('You can list up to five catalogue items.');
  const p = {name:text(profile.name,100,true), category:text(profile.category,80),description:text(profile.description,1200),
    whatsapp:text(profile.whatsapp,15),instagram:text(profile.instagram,30),email:text(profile.email,150),logo:photo(profile.logo),flyer:photo(profile.flyer)};
  if(p.whatsapp && !/^\d{8,15}$/.test(p.whatsapp)) throw Error('Use an international WhatsApp number, e.g. 2348012345678.');
  if(p.instagram && !/^[\w.]{1,30}$/.test(p.instagram)) throw Error('Enter the Instagram handle without @ or a link.');
  if(p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw Error('Check the contact email.');
  const seen=new Set();
  const products=items.map(item=>{
    if(!isId(item.id) || seen.has(item.id) || !Array.isArray(item.photos) || item.photos.length>2 || typeof item.available!=='boolean') throw Error('Each item needs a unique ID and up to two photos.');
    seen.add(item.id);
    return {id:item.id,name:text(item.name,100,true),description:text(item.description,800),price:text(item.price,80),available:item.available,photos:item.photos.map(value=>{if(!isId(value)) throw Error('Invalid photo.');return value;})};
  });
  return {profile:p,items:products};
}
export async function storage(path, options={}) {
  const response=await fetch(process.env.MARKET_SUPABASE_URL.trim().replace(/\/$/,'')+'/storage/v1/'+path,{
    ...options,headers:{apikey:process.env.MARKET_SUPABASE_SECRET.trim(),Authorization:'Bearer '+process.env.MARKET_SUPABASE_SECRET.trim(),...options.headers},signal:AbortSignal.timeout(20000),
  });
  if(!response.ok) throw Error('Photo storage is temporarily unavailable.');
  return response;
}
export async function ensureBucket() {
  const response=await fetch(process.env.MARKET_SUPABASE_URL.trim().replace(/\/$/,'')+'/storage/v1/bucket/corner-market',{headers:{apikey:process.env.MARKET_SUPABASE_SECRET.trim(),Authorization:'Bearer '+process.env.MARKET_SUPABASE_SECRET.trim()},signal:AbortSignal.timeout(12000)});
  if(response.ok) return;
  if(response.status!==404 && response.status!==400) throw Error('Photo storage is unavailable.');
  await storage('bucket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'corner-market',name:'corner-market',public:true,file_size_limit:409600,allowed_mime_types:['image/webp']})});
}
export function mediaUrl(shop,id) {
  return process.env.MARKET_SUPABASE_URL.trim().replace(/\/$/,'')+'/storage/v1/object/public/corner-market/'+shop+'/'+id+'.webp';
}
export function publicShop(row) {
  const profile=row.published_profile;
  return {...profile,id:row.id,source_id:row.source_id,items:(row.published_items||[]).map(item=>({...item,photos:item.photos.map(id=>mediaUrl(row.id,id))})),
    gallery:profile.flyer?[{url:mediaUrl(row.id,profile.flyer),alt:profile.name+' flyer'}]:profile.legacyGallery||[],logo:profile.logo?mediaUrl(row.id,profile.logo):null};
}
export async function publishedShops() {
  return (await database('market_businesses?published_profile=not.is.null&select=id,source_id,published_profile,published_items&order=name')).map(publicShop);
}
