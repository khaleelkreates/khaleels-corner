import {shopSlug,shopPath,initialShopSlug} from '../shop-routes.mjs';
import {cookieToken,currentAccount,database,digest,rpc} from '../server/market-access.mjs';
import {cleanCatalogue,ensureBucket,isId,mediaUrl,storage} from '../server/market-catalogue.mjs';
import {sanitySettings,API_VERSION} from '../content-source.mjs';

async function cleanUnused(hash,businessId,discard=null) {
  const rows=await rpc('market_claim_unused_images',{session_hash:hash,shop_id:businessId,discard_id:discard});
  if(!rows.length) return [];
  await storage('object/corner-market',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:rows.map(row=>row.path)})});
  await database('market_media?business_id=eq.'+businessId+'&state=eq.deleting&id=in.('+rows.map(row=>row.id).join(',')+')',{method:'DELETE'});
  return rows.map(row=>row.id);
}
async function importProfiles() {
  await ensureBucket();
  const {projectId,dataset}=sanitySettings(process.env);
  const url=new URL(`https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${dataset}`);
  url.searchParams.set('query','*[_type=="marketListing" && !(_id in path("drafts.**"))]{_id,name,category,description,whatsapp,instagram,email,hidden,gallery[]{alt,profileScreenshot,"url":asset->url}}');
  url.searchParams.set('perspective','published');
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
  if(!response.ok) throw Error('Could not import business details.');
  const {result}=await response.json();
  let count=0;
  for(const source of result.filter(item=>!item.hidden)) {
    const profile={...Object.fromEntries(['name','category','description','whatsapp','instagram','email'].map(key=>[key,source[key]||''])),logo:null,flyer:null,slug:initialShopSlug(source.name,source._id),legacyGallery:source.gallery||[]};
    await database('market_businesses?on_conflict=source_id',{
      method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},body:JSON.stringify({source_id:source._id,name:source.name}),
    });
    const changed=await database('market_businesses?source_id=eq.'+encodeURIComponent(source._id)+'&version=eq.0',{
      method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({profile,version:1,published_profile:profile,published_items:[]}),
    });
    count+=changed.length;
  }
  return count;
}
async function refreshMarket(sourceId) {
  if(!sourceId || !process.env.SANITY_COMMENTS_TOKEN) return false;
  const {projectId,dataset}=sanitySettings(process.env);
  const response=await fetch(`https://${projectId}.api.sanity.io/v${API_VERSION}/data/mutate/${dataset}`,{
    method:'POST',headers:{Authorization:'Bearer '+process.env.SANITY_COMMENTS_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify({mutations:[{patch:{id:sourceId,set:{cataloguePublishedAt:new Date().toISOString()}}}]}),signal:AbortSignal.timeout(12000),
  });
  return response.ok;
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
  if(!['GET','POST'].includes(req.method)) return res.status(405).json({error:'Unsupported method.'});
  try {
    if(req.method==='POST' && (req.headers.origin!=='https://'+req.headers.host || !/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))) return res.status(403).json({error:'Invalid request.'});
    const account=await currentAccount(req);
    if(!account) return res.status(401).json({error:'Sign in again.'});
    if(req.method==='POST' && req.body?.action==='initialise' && account.role==='owner') return res.json({imported:await importProfiles()});
    const businessId=req.method==='GET'?req.query.businessId:req.body?.businessId;
    if(!isId(businessId)) return res.status(400).json({error:'Choose a business.'});
    if(account.role!=='owner' && !(account.role==='seller' && account.business_id===businessId)) return res.status(403).json({error:'You can only edit your own business.'});
    const hash=digest(cookieToken(req),process.env.MARKET_ACCESS_SECRET);
    if(req.method==='GET') {
      const [shops,media]=await Promise.all([database('market_businesses?id=eq.'+businessId+'&select=id,name,profile,items,version,published_profile'),database('market_media?business_id=eq.'+businessId+'&select=id,bytes,state&order=created_at')]);
      if(!shops.length) return res.status(404).json({error:'Business unavailable.'});
      return res.json({shop:{...shops[0],url:shopPath(shops[0])},media:media.map(item=>({...item,url:mediaUrl(businessId,item.id)}))});
    }
    const {action}=req.body;
    if(action==='upload') {
      const {imageId,data}=req.body;
      if(!isId(imageId) || typeof data!=='string' || data.length>546136 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return res.status(400).json({error:'Upload a photo smaller than 400 KB.'});
      const bytes=Buffer.from(data,'base64');
      if(bytes.length<30 || bytes.length>409600 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WEBP' || bytes.readUInt32LE(4)+8!==bytes.length) return res.status(400).json({error:'The photo must be a valid WebP image.'});
      const chunk=bytes.toString('ascii',12,16);let width,height;
      if(chunk==='VP8X') {width=1+bytes.readUIntLE(24,3);height=1+bytes.readUIntLE(27,3);if(bytes[20]&2) return res.status(400).json({error:'Animated photos are not supported.'});}
      else if(chunk==='VP8 ' && bytes.toString('hex',23,26)==='9d012a') {width=bytes.readUInt16LE(26)&16383;height=bytes.readUInt16LE(28)&16383;}
      else if(chunk==='VP8L' && bytes[20]===47) {const bits=bytes.readUInt32LE(21);width=1+(bits&16383);height=1+((bits>>>14)&16383);}
      if(!width || !height || width>1600 || height>1600) return res.status(400).json({error:'Resize the photo to 1600 pixels or smaller.'});
      await cleanUnused(hash,businessId);
      const [media]=await rpc('market_reserve_image',{session_hash:hash,shop_id:businessId,image_id:imageId,image_bytes:bytes.length});
      if(media.state!=='ready') {
        // Immutable object paths prevent a later request from replacing a saved image.
        try {await storage('object/corner-market/'+media.path,{method:'POST',headers:{'Content-Type':'image/webp'},body:bytes});}
        catch(error) {
          const existing=await storage('object/info/corner-market/'+media.path).catch(()=>null);
          if(!existing) throw error;
        }
        await rpc('market_finish_image',{session_hash:hash,shop_id:businessId,image_id:imageId});
      }
      return res.json({id:imageId,url:mediaUrl(businessId,imageId),bytes:bytes.length});
    }
    if(action==='discard') {
      if(!isId(req.body.imageId)) return res.status(400).json({error:'Invalid photo.'});
      return res.json({deleted:await cleanUnused(hash,businessId,req.body.imageId)});
    }
    if(action==='save') {
      let clean;
      try {clean=cleanCatalogue(req.body.profile,req.body.items);} catch(error) {return res.status(400).json({error:error.message});}
      if(!Number.isSafeInteger(req.body.version) || req.body.version<0 || typeof req.body.publish!=='boolean') return res.status(400).json({error:'Reload the editor before saving.'});
      const [before]=await database('market_businesses?id=eq.'+businessId+'&select=version,profile,items,published_profile,published_items');
      if(before.version!==req.body.version) return res.status(409).json({error:'A newer edit exists. Copy your changes, then reload this business.'});
      clean.profile.slug=shopSlug({...before,id:businessId});
      const previousIds=Array.from(new Set(JSON.stringify(before).match(/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/gi)||[]));
      const version=await rpc('market_save_catalogue',{session_hash:hash,shop_id:businessId,shop_profile:clean.profile,shop_items:clean.items,expected_version:req.body.version,make_public:req.body.publish});
      const deleted=(await Promise.all(previousIds.filter(id=>!JSON.stringify(clean).includes(id)).map(id=>cleanUnused(hash,businessId,id).catch(()=>[])))).flat();
      let refreshed=false;
      if(req.body.publish) {
        const [shop]=await database('market_businesses?id=eq.'+businessId+'&select=source_id');
        refreshed=await refreshMarket(shop.source_id).catch(()=>false);
      }
      await cleanUnused(hash,businessId).catch(()=>{});
      return res.json({version,published:req.body.publish,refreshed,deleted});
    }
    return res.status(400).json({error:'Unknown catalogue action.'});
  } catch(error) {
    console.error('Market catalogue request failed', {code:error.code||'unavailable',status:error.status||0});
    if(error.code==='40001') return res.status(409).json({error:'A newer edit exists. Copy your changes, then reload this business.'});
    if(error.code==='P0001') return res.status(400).json({error:['Shop image allowance reached','Photo is not available for this shop','Maximum five catalogue items','Maximum two photos per item'].includes(error.detail)?error.detail:'The catalogue could not be saved. Check its fields.'});
    if(error.code==='42703' || error.code==='42P01' || error.code==='PGRST202') return res.status(503).json({error:'Run the market-catalogue.sql migration in Supabase to activate the editor.'});
    return res.status(503).json({error:'Catalogue service is temporarily unavailable. Your entries are still in the editor.'});
  }
}
