import fs from 'node:fs';
import path from 'node:path';
import site from './site-config.json' with {type:'json'};
const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const json=s=>JSON.stringify(s).replace(/</g,'\\u003c');
/** Add domain-dependent discovery files without inventing a production URL. */
export function enhanceOutput({out,posts}){
 const preview=process.env.VERCEL_ENV==='preview';
 const origin=(process.env.SITE_URL||site.siteUrl)?.replace(/\/$/,'');
 if(origin){const u=new URL(origin);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw Error('SITE_URL must be your site origin, without a path, query or credentials.');}
 const head=(file,extra)=>{const p=path.join(out,file);fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('</head>',extra+'</head>'))};
 if(preview){for(const rel of ['index.html','finesse/index.html',...posts.map(p=>`posts/${p.slug}.html`)])head(rel,'<meta name="robots" content="noindex,nofollow">');}
 head('404.html','<meta name="robots" content="noindex">');
 if(!origin){fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\n${preview?'Disallow: /':'Allow: /'}\n`);console.log('SEO: set SITE_URL to generate sitemap, RSS and absolute structured data.');return;}
 const urls=[`${origin}/`,...posts.map(p=>`${origin}/posts/${p.slug}.html`)];
 fs.writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${xml(url)}</loc></url>`).join('')}</urlset>`);
 fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\n${preview?'Disallow: /':'Allow: /'}\nSitemap: ${origin}/sitemap.xml\n`);
 const rss=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Khaleel’s Corner</title><link>${xml(origin)}/</link><description>Stories, reflections and life as it comes, by Khaleel.</description><language>en</language><atom:link href="${xml(origin)}/feed.xml" rel="self" type="application/rss+xml"/>${posts.map(p=>{const url=`${origin}/posts/${p.slug}.html`;return `<item><title>${xml(p.title)}</title><link>${xml(url)}</link><guid isPermaLink="true">${xml(url)}</guid><description>${xml(p.excerpt||p.body.split('\n')[0])}</description><category>${xml(p.category)}</category>${p.date?`<pubDate>${new Date(p.date+'T12:00:00+01:00').toUTCString()}</pubDate>`:''}</item>`}).join('')}</channel></rss>`;
 fs.writeFileSync(path.join(out,'feed.xml'),rss);
 const feed=`<link rel="alternate" type="application/rss+xml" title="Khaleel’s Corner" href="${xml(origin)}/feed.xml">`;
 head('index.html',feed+`<script type="application/ld+json">${json({'@context':'https://schema.org','@type':'Blog',name:'Khaleel’s Corner',url:origin+'/',author:{'@type':'Person',name:'Khaleel'}})}</script>`);
 for(const p of posts){const url=`${origin}/posts/${p.slug}.html`;const schema={'@context':'https://schema.org','@type':'BlogPosting',headline:p.title,description:p.excerpt||p.body.split('\n')[0],articleSection:p.category,inLanguage:'en',url,mainEntityOfPage:{'@type':'WebPage','@id':url},author:{'@type':'Person',name:'Khaleel'},publisher:{'@type':'Organization',name:'Khaleel’s Corner'},...(p.date?{datePublished:p.date}:{}),...(p.coverImageUrl?{image:[p.coverImageUrl]}:p.image?{image:[`${origin}/${p.image}`]}:{})};head(`posts/${p.slug}.html`,feed+`<script type="application/ld+json">${json(schema)}</script>`)}
 console.log('SEO: generated sitemap.xml, robots.txt, feed.xml and Blog/BlogPosting structured data.');
}
