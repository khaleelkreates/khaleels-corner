import fs from 'node:fs';
import path from 'node:path';
import site from './site-config.json' with {type:'json'};
import {plainArticleText} from './reading-text.mjs';
export const API_VERSION='2025-02-19';
export function loadLocalPosts(root){
 const posts=[];
 for(const file of fs.readdirSync(path.join(root,'content')).filter(f=>f.endsWith('.md'))){
  const raw=fs.readFileSync(path.join(root,'content',file),'utf8').replace(/\r\n/g,'\n');
  const match=raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);if(!match)throw Error(`Missing metadata in ${file}`);
  const meta=Object.fromEntries(match[1].split('\n').filter(Boolean).map(l=>{const i=l.indexOf(':');if(i<1)throw Error(`Invalid metadata in ${file}`);return [l.slice(0,i).trim(),l.slice(i+1).trim()]}));
  if(!['draft','published'].includes(meta.status))throw Error(`Invalid status in ${file}`);if(meta.status!=='published')continue;
  posts.push(normalizePost({...meta,slug:file.slice(0,-3),body:match[2].trim()},file));
 }
 return posts;
}
export function normalizePost(p,label='CMS article'){
 if(Array.isArray(p.richBody))p={...p,body:plainArticleText(p.richBody)};
 for(const key of ['title','category','body'])if(typeof p[key]!=='string'||!p[key].trim())throw Error(`Missing ${key}: ${label}`);
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))throw Error(`Invalid article slug: ${label}`);
 if(p.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!Number.isFinite(Date.parse(p.date+'T12:00:00Z'))||new Date(p.date+'T12:00:00Z').toISOString().slice(0,10)!==p.date))throw Error(`Invalid article date: ${label}`);
 if(p.coverImageUrl){const url=new URL(p.coverImageUrl);if(url.protocol!=='https:'||url.hostname!=='cdn.sanity.io'||!url.pathname.startsWith('/images/'))throw Error('Invalid CMS image URL');if(!p.imageAlt?.trim())throw Error('A cover image needs a description');}
 return {...p,body:p.body.trim(),date:p.date||undefined,excerpt:typeof p.excerpt==='string'?p.excerpt:'',featured:String(p.featured)==='true'?'true':'false',minutes:Math.max(1,Math.ceil(p.body.trim().split(/\s+/).length/200)),order:Number(p.order)||0};
}
export function sanitySettings(env=process.env){
 const projectId=env.SANITY_PROJECT_ID||site.projectId,dataset=env.SANITY_DATASET||site.dataset||'production';
 if(!/^[a-z0-9]+$/.test(projectId||''))throw Error('Set SANITY_PROJECT_ID to your real Sanity project ID.');
 if(!/^[a-z0-9_-]+$/.test(dataset))throw Error('Invalid SANITY_DATASET.');
 return {projectId,dataset};
}
export async function loadSanityPosts({env=process.env,fetchImpl=fetch}={}){
 const {projectId,dataset}=sanitySettings(env);
 const query=`*[_type == "reflection" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{_id,title,"slug":slug.current,category,excerpt,body,richBody,date,order,featured,"coverImageUrl":coverImage.asset->url,"imageAlt":coverImage.alt,"imageCaption":coverImage.caption}`;
 const url=new URL(`https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${dataset}`);url.searchParams.set('query',query);url.searchParams.set('perspective','published');
 // Anonymous API reads cannot see drafts. Never pass a draft-reading token to the site build.
 const response=await fetchImpl(url,{signal:AbortSignal.timeout(30000),cache:'no-store'});
 if(!response.ok)throw Error(`Sanity read failed (${response.status}); keeping the previous deployed site. No local fallback is allowed.`);
 const data=await response.json();if(data.error||!Array.isArray(data.result))throw Error('Sanity returned an invalid article list.');
 const ids=new Set();return data.result.map(p=>{if(p._id?.startsWith('drafts.')||p._id?.startsWith('versions.'))throw Error('Draft content rejected.');const post=normalizePost(p,p._id);if(ids.has(post.slug))throw Error('Two CMS articles share a URL.');ids.add(post.slug);return post});
}
export async function loadPosts(root,env=process.env){
 const mode=env.CONTENT_SOURCE||site.contentSource||'files';if(!['files','sanity'].includes(mode))throw Error('CONTENT_SOURCE must be files or sanity.');
 return mode==='sanity'?loadSanityPosts({env}):loadLocalPosts(root);
}
