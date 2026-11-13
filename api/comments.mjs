import {createHmac, randomUUID} from 'node:crypto';
import {sanitySettings, API_VERSION} from '../content-source.mjs';

const project = sanitySettings();
const api = `https://${project.projectId}.api.sanity.io/v${API_VERSION}/data`;
const token = process.env.SANITY_COMMENTS_TOKEN;

async function query(groq, values) {
 const url = new URL(api + '/query/' + project.dataset);
 url.searchParams.set('query', groq);
 url.searchParams.set('perspective', 'published');
 for (const [key,value] of Object.entries(values)) url.searchParams.set('$'+key,JSON.stringify(value));
 const response = await fetch(url, {signal:AbortSignal.timeout(8000)});
 if (!response.ok) throw Error('Comment query failed');
 return (await response.json()).result;
}
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 const story = req.query.story;
 if (!['GET','POST'].includes(req.method)) return res.status(405).json({error:'Unsupported method'});
 if (typeof story !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(story) || story.length>100) return res.status(400).json({error:'Invalid story'});
 if (!token) return res.status(503).json({error:'Comments unavailable'});
 try {
  if (req.method==='GET') {
   const {exists,roots}=await query(`{
    "exists":defined(*[_type=="reflection" && slug.current==$story][0]._id),
    "roots":*[_type=="storyComment" && story==$story && hidden!=true && !defined(parentId)]|order(_createdAt desc)[0...100]{
     "id":_id,message,signature,
     "replies":*[_type=="storyComment" && story==$story && hidden!=true && parentId==^._id]|order(_createdAt asc)[0...100]{"id":_id,message,signature,parentId}
    }
   }`,{story});
   if(!exists) return res.status(404).json({error:'Story unavailable'});
   const rows=roots.flatMap(({replies,...root})=>[root,...replies]);
   res.setHeader('Cache-Control','public, max-age=0, s-maxage=30');
   return res.status(200).json({rows});
  }
  const origin = req.headers.origin;
  if (!origin || new URL(origin).host!==req.headers.host || !/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')) return res.status(403).json({error:'Invalid origin'});
  const {message,signature='',website='',parentId=null} = req.body || {};
  if (website || typeof message!=='string' || !message.trim() || message.length>1200 || typeof signature!=='string' || signature.length>40) return res.status(400).json({error:'Invalid comment'});
  if(parentId!==null && (typeof parentId!=='string'||!/^comment-[a-f0-9-]{36}$/.test(parentId))) return res.status(400).json({error:'Invalid reply'});
  const {exists,parent}=await query(`{
   "exists":defined(*[_type=="reflection" && slug.current==$story][0]._id),
   "parent":defined(*[_type=="storyComment" && _id==$parentId && story==$story && hidden!=true && !defined(parentId)][0]._id)
  }`,{story,parentId});
  if(!exists||parentId&&!parent) return res.status(404).json({error:'Story or comment unavailable'});
  // A time bucket allows one write per visitor per minute without storing raw IP addresses.
  const ip = req.headers['x-vercel-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const bucket = createHmac('sha256',token).update(ip+'|'+Math.floor(Date.now()/60000)).digest('hex');
  const comment = {id:'comment-'+randomUUID(),message:message.trim(),signature:signature.trim(),...(parentId?{parentId}:{})};
  const {id,...fields}=comment;
  const response = await fetch(api+'/mutate/'+project.dataset+'?visibility=sync',{
   method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({mutations:[
    {create:{_id:'limits.'+bucket,_type:'commentRateLimit'}},
    {create:{_id:id,_type:'storyComment',story,...fields}},
   ]}),signal:AbortSignal.timeout(8000),
  });
  if(response.status===409) return res.status(429).json({error:'Please wait before posting again'});
  if(!response.ok) throw Error('Comment write failed');
  return res.status(201).json({comment});
 } catch {
  return res.status(503).json({error:'Comments unavailable'});
 }
}
