import {createHmac} from 'node:crypto';
import {API_VERSION, sanitySettings} from '../content-source.mjs';

const {projectId,dataset}=sanitySettings();
const api=`https://${projectId}.api.sanity.io/v${API_VERSION}/data`;
const token=process.env.SANITY_COMMENTS_TOKEN;
const reactions=['like','laugh'];

async function readStory(story) {
 const url=new URL(api+'/query/'+dataset);
 url.searchParams.set('query',`{
  "exists":defined(*[_type=="reflection" && slug.current==$story][0]._id),
  "like":count(*[_type=="storyReaction" && story==$story && reaction=="like"]),
  "laugh":count(*[_type=="storyReaction" && story==$story && reaction=="laugh"])
 }`);
 url.searchParams.set('$story',JSON.stringify(story));
 url.searchParams.set('perspective','published');
 const response=await fetch(url,{signal:AbortSignal.timeout(8000)});
 if(!response.ok) throw Error('Reaction lookup failed');
 return (await response.json()).result;
}

export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 const {story}=req.query;
 if(!['GET','POST'].includes(req.method)) return res.status(405).json({error:'Unsupported method'});
 if(typeof story!=='string'||story.length>100||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(story)) return res.status(400).json({error:'Invalid story'});
 if(!token) return res.status(503).json({error:'Reactions unavailable'});
 try {
  if(req.method==='POST'){
   if(req.headers.origin!==`https://${req.headers.host}`||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')) return res.status(403).json({error:'Invalid origin'});
   const {visitor,reaction,active}=req.body||{};
   if(typeof visitor!=='string'||! /^[a-f0-9-]{36}$/.test(visitor)||!reactions.includes(reaction)||typeof active!=='boolean') return res.status(400).json({error:'Invalid reaction'});
   if(!(await readStory(story)).exists) return res.status(404).json({error:'Story unavailable'});
   const id='reaction-'+createHmac('sha256',token).update(JSON.stringify([story,reaction,visitor])).digest('hex');
   const mutation=active?{createIfNotExists:{_id:id,_type:'storyReaction',story,reaction}}:{delete:{id}};
   const response=await fetch(api+'/mutate/'+dataset+'?visibility=sync',{
    method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({mutations:[mutation]}),signal:AbortSignal.timeout(8000),
   });
   if(!response.ok) throw Error('Reaction write failed');
  }
  const {exists,like,laugh}=await readStory(story);
  if(!exists) return res.status(404).json({error:'Story unavailable'});
  return res.status(200).json({like,laugh});
 } catch {
  return res.status(503).json({error:'Reactions unavailable'});
 }
}
