// Only loaded by the isolated CMS integration tests. Never imported by the production build.
import fs from 'node:fs';
const result=JSON.parse(fs.readFileSync(process.env.SANITY_TEST_RESPONSE,'utf8'));
globalThis.fetch=async(url,options)=>{
 if(!String(url).startsWith('https://testproject.api.sanity.io/'))throw Error('Unexpected test request');
 if(options.headers?.Authorization)throw Error('Public build attempted authenticated draft access');
 return {ok:true,status:200,json:async()=>({result})};
};
