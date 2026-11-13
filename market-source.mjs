import {sanitySettings, API_VERSION} from './content-source.mjs';
import site from './site-config.json' with {type:'json'};

export async function loadMarket(starters, env=process.env) {
 if ((env.CONTENT_SOURCE||site.contentSource)!=='sanity' || env.SANITY_TEST_RESPONSE) return starters;
 const {projectId,dataset}=sanitySettings(env);
 const url=new URL(`https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${dataset}`);
 url.searchParams.set('query','*[_type=="marketListing"]|order(order asc,name asc){name,category,description,whatsapp,instagram,hidden}');
 url.searchParams.set('perspective','published');
 const response=await fetch(url,{signal:AbortSignal.timeout(15000),cache:'no-store'});
 if(!response.ok) throw Error('Market listings could not be loaded');
 const {result}=await response.json();
 if(!Array.isArray(result)) throw Error('Invalid market listings');
 return result.filter(item=>!item.hidden);
}
