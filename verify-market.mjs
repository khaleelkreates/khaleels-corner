import {shopPath,registeredShopId,initialShopSlug} from './shop-routes.mjs';
import cataloguePublicHandler from './api/catalogue-public.mjs';
import assert from 'node:assert/strict';
import {cleanCatalogue,isId} from './server/market-catalogue.mjs';
import {shopPage} from './api/catalogue-public.mjs';
import catalogueHandler from './api/market-catalogue.mjs';
const uuid='12345678-1234-4123-8123-123456789012';
const profile={name:'Example',category:'Fashion',description:'Hello',whatsapp:'2348012345678',instagram:'example',email:'',logo:null,flyer:null};
const item={id:uuid,name:'Example item',description:'',price:'',available:true,photos:[]};
assert.ok(isId(uuid));assert.ok(!isId(uuid+'&select=code_hash'));
assert.throws(()=>cleanCatalogue(profile,Array(6).fill(item)));
assert.throws(()=>cleanCatalogue(profile,[item,item]));
assert.throws(()=>cleanCatalogue(profile,[{...item,photos:[uuid,uuid,uuid]}]));
assert.throws(()=>cleanCatalogue({...profile,whatsapp:'javascript:alert(1)'},[]));
assert.throws(()=>cleanCatalogue({...profile,instagram:'https://example.com'},[]));
assert.throws(()=>cleanCatalogue(profile,[{...item,photos:['https://another-shop/photo.webp']} ]));
assert.deepEqual(cleanCatalogue(profile,[item]),{profile,items:[item]});
const html=shopPage({...profile,name:'<script>alert(1)</script>',id:uuid,gallery:[],items:[{...item,name:'<img src=x onerror=alert(1)>',photos:[]}]});
assert.ok(!html.includes('<script>alert(1)'));assert.ok(!html.includes('<img src=x'));
assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('rel="canonical"'));assert.ok(html.includes('application/ld+json'));
assert.ok(html.includes('Ask for price'));assert.ok(html.includes('wa.me/2348012345678?text='));
console.log('PASS: catalogue limits, contact validation, unsafe photo IDs, escaped public content and crawlable catalogue markup.');
const originalFetch=globalThis.fetch;
const previousSecret=process.env.MARKET_ACCESS_SECRET;
const previousUrl=process.env.MARKET_SUPABASE_URL;
const previousKey=process.env.MARKET_SUPABASE_SECRET;
process.env.MARKET_ACCESS_SECRET='local-test';process.env.MARKET_SUPABASE_URL='https://example.supabase.co';process.env.MARKET_SUPABASE_SECRET='local-test';
try {
  let actor={id:uuid,role:'seller',business_id:uuid},calls=0;
  globalThis.fetch=async url=>{calls++;assert.ok(String(url).endsWith('/rpc/market_current_account'),'Blocked actions must not reach shop data.');return new Response(JSON.stringify(actor?[actor]:[]));};
  async function invoke({method='GET',businessId=uuid,origin='https://example.com',body={}}={}) {
    const req={method,query:{businessId},headers:{host:'example.com',origin,'content-type':'application/json',cookie:'__Host-corner-market='+'a'.repeat(64)},body:{businessId,...body}};
    const res={code:200,setHeader(){return this;},status(code){this.code=code;return this;},json(data){return {status:this.code,data};}};
    return catalogueHandler(req,res);
  }
  assert.equal((await invoke({businessId:'99999999-1234-4123-8123-123456789012'})).status,403);
  assert.equal((await invoke({method:'POST',businessId:'99999999-1234-4123-8123-123456789012',body:{action:'save'}})).status,403);
  actor={...actor,role:'manager'};assert.equal((await invoke()).status,403);
  actor=null;assert.equal((await invoke()).status,401);
  calls=0;assert.equal((await invoke({method:'POST',origin:'https://other.example'})).status,403);assert.equal(calls,0);
  console.log('PASS: seller cross-business reads/writes, reset-admin editing, unauthenticated access and cross-origin requests are blocked before shop data access.');
} finally {
  globalThis.fetch=originalFetch;
  for(const [key,value] of Object.entries({MARKET_ACCESS_SECRET:previousSecret,MARKET_SUPABASE_URL:previousUrl,MARKET_SUPABASE_SECRET:previousKey})) {if(value===undefined) delete process.env[key];else process.env[key]=value;}
}

const known='50aeafcf-99c5-4724-bb1a-a17d6b8463fc';
assert.equal(shopPath({id:known,name:'A newly edited business name'}),'/market/el-lizzy');
assert.equal(registeredShopId('el-lizzy'),known);
assert.equal(initialShopSlug('A & B','source-one'),initialShopSlug('A & B','source-one'));
assert.notEqual(initialShopSlug('A & B','source-one'),initialShopSlug('A & B','source-two'));
const previous={fetch:globalThis.fetch,url:process.env.MARKET_SUPABASE_URL,key:process.env.MARKET_SUPABASE_SECRET,secret:process.env.MARKET_ACCESS_SECRET};
try{
 process.env.MARKET_SUPABASE_URL='https://example.supabase.co';process.env.MARKET_SUPABASE_SECRET='test';process.env.MARKET_ACCESS_SECRET='test';
 globalThis.fetch=async url=>{assert.ok(String(url).includes('id=eq.'+known));return new Response(JSON.stringify([{id:known,source_id:'market-el-lizzy-abode',published_profile:{name:'EL-Lizzy',description:'Example',category:'Real estate',legacyGallery:[]},published_items:[]}]));};
 const makeResponse=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(c){this.code=c;return this;},json(data){return {status:this.code,data,headers:this.headers};},send(data){return {status:this.code,data,headers:this.headers};},end(){return {status:this.code,headers:this.headers};}});
 const old=await cataloguePublicHandler({method:'GET',query:{business:known,page:'1'}},makeResponse());assert.equal(old.status,308);assert.equal(old.headers.Location,'/market/el-lizzy');
 const pretty=await cataloguePublicHandler({method:'GET',query:{slug:'el-lizzy',page:'1'}},makeResponse());assert.equal(pretty.status,200);assert.ok(pretty.data.includes('/market/el-lizzy'));assert.ok(!pretty.data.includes('/shops/'+known));
 assert.equal((await cataloguePublicHandler({method:'GET',query:{slug:'../unsafe',page:'1'}},makeResponse())).status,404);
 console.log('PASS permanent readable slugs, name-change stability, legacy redirects and safe route validation.');
}finally{globalThis.fetch=previous.fetch;for(const [key,value]of Object.entries({MARKET_SUPABASE_URL:previous.url,MARKET_SUPABASE_SECRET:previous.key,MARKET_ACCESS_SECRET:previous.secret})){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
