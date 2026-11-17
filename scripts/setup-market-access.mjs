import {database, digest, generateAccessCode} from '../server/market-access.mjs';
import {sanitySettings, API_VERSION} from '../content-source.mjs';

if (!process.env.MARKET_SUPABASE_URL || !process.env.MARKET_SUPABASE_SECRET || !process.env.MARKET_ACCESS_SECRET) {
  throw Error('Set the three MARKET environment variables in your terminal first.');
}
const {projectId,dataset} = sanitySettings();
const source = new URL(`https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${dataset}`);
source.searchParams.set('query', '*[_type=="marketListing" && hidden!=true]{_id,name}');
source.searchParams.set('perspective','published');
const response = await fetch(source);
if (!response.ok) throw Error('Cannot load the existing market business names.');
const {result} = await response.json();
for (const shop of result) {
  await database('market_businesses?on_conflict=source_id', {
    method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},
    body:JSON.stringify({source_id:shop._id,name:shop.name}),
  });
}
const existing = await database('market_accounts?role=eq.owner&select=id');
if (existing.length) {
  console.log('Business access records are ready. Owner access already exists.');
} else {
  const code = generateAccessCode('KHALEEL');
  await database('market_accounts', {
    method:'POST',body:JSON.stringify({label:'Khaleel',role:'owner',code_hash:digest(code,process.env.MARKET_ACCESS_SECRET)}),
  });
  console.log('Owner access created. Save this privately. It will not be displayed again.');
  console.log(code);
}
