import {getCliClient} from 'sanity/cli';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {loadLocalPosts} from '../content-source.mjs';
const client=getCliClient({apiVersion:'2025-02-19'});
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const posts=loadLocalPosts(root);
// A durable marker prevents a later import from resurrecting hidden/deleted posts.
const marker='drafts.kh-corner-initial-import';
const done=await client.getDocument(marker);if(done)throw Error('Initial import already completed. Use the Writing Desk for further changes.');
const ids=posts.map(p=>'reflection-'+p.slug);
const existing=await client.fetch('*[_id in $ids]._id',{ids:ids.flatMap(id=>[id,'drafts.'+id])},{perspective:'raw'});
const known=new Set(existing);let transaction=client.transaction(),count=0;
for(const p of posts){const id='reflection-'+p.slug;if(known.has(id)||known.has('drafts.'+id))continue;if(p.image)throw Error('This local article contains an image: migrate its asset before importing.');const doc={_id:id,_type:'reflection',title:p.title,slug:{_type:'slug',current:p.slug},category:p.category,excerpt:p.excerpt||p.body.split('\n')[0],body:p.body,featured:p.featured==='true',order:p.order,...(p.date?{date:p.date}:{})};transaction=transaction.createIfNotExists(doc);count++;}
transaction=transaction.createIfNotExists({_id:marker,_type:'migrationMarker',completedAt:new Date().toISOString()});
await transaction.commit();console.log(`Imported ${count} original articles. Existing articles and drafts were left unchanged. Import marker saved.`);
