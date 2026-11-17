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
