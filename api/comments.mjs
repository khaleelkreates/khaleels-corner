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
  if (!await query('defined(*[_type=="reflection" && slug.current==$story][0]._id)',{story})) return res.status(404).json({error:'Story unavailable'});
  if (req.method==='GET') {
   const rows = await query('*[_type=="storyComment" && story==$story && hidden!=true]|order(_createdAt desc)[0...100]{"id":_id,message,signature}',{story});
   return res.status(200).json({rows});
  }
  const origin = req.headers.origin;
  if (!origin || new URL(origin).host!==req.headers.host || !/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')) return res.status(403).json({error:'Invalid origin'});
  const {message,signature='',website=''} = req.body || {};
  if (website || typeof message!=='string' || !message.trim() || message.length>1200 || typeof signature!=='string' || signature.length>40) return res.status(400).json({error:'Invalid comment'});
  // A time bucket allows one write per visitor per minute without storing raw IP addresses.
  const ip = req.headers['x-vercel-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const bucket = createHmac('sha256',token).update(ip+'|'+Math.floor(Date.now()/60000)).digest('hex');
  const comment = {id:'comment-'+randomUUID(),message:message.trim(),signature:signature.trim()};
  const response = await fetch(api+'/mutate/'+project.dataset+'?visibility=sync',{
   method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({mutations:[
    {create:{_id:'limits.'+bucket,_type:'commentRateLimit'}},
    {create:{_id:comment.id,_type:'storyComment',story,message:comment.message,signature:comment.signature}},
   ]}),signal:AbortSignal.timeout(8000),
  });
  if(response.status===409) return res.status(429).json({error:'Please wait before posting again'});
  if(!response.ok) throw Error('Comment write failed');
  return res.status(201).json({comment});
 } catch {
  return res.status(503).json({error:'Comments unavailable'});
 }
}
