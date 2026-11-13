// Private, in-memory preview. Draft text is never placed in a URL or sent to the public site.
import {renderArticle} from '../reading-text.mjs';
import project from './project.json' with {type:'json'};
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function previewMarkup(doc={}){
 const prose=renderArticle(doc.richBody,String(doc.body||'Your reflection will appear here.'));
 const cover=doc.coverImage;
 const asset=cover?.asset?._ref?.match(/^image-([a-f0-9]+)-(\d+x\d+)-([a-z0-9]+)$/i);
 const coverUrl=asset?`https://cdn.sanity.io/images/${project.projectId}/${project.dataset}/${asset[1]}-${asset[2]}.${asset[3]}`:'';
 const figure=coverUrl?`<figure style="margin:0 0 24px;text-align:center"><img src="${escape(coverUrl)}" alt="${escape(cover.alt)}" style="max-width:100%;height:auto">${cover.caption?`<figcaption>${escape(cover.caption)}</figcaption>`:''}</figure>`:'';
 return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><style>*{box-sizing:border-box}body{background:#f6f2e9;color:#38333c;margin:0;padding:35px 8%;font:19px/1.9 Georgia,serif}main{max-width:680px;margin:auto}small{font:10px Arial;letter-spacing:2px;color:#9b583e}h1{font:40px/1.15 Georgia;letter-spacing:-1px}p{white-space:normal;margin:0 0 25px}header{border-bottom:1px solid #d9d1c7;margin-bottom:30px;padding-bottom:20px}header p{font:12px Arial;color:#706a70}</style></head><body><main><header><small>PRIVATE ARTICLE PREVIEW · ${escape(doc.category)}</small><h1>${escape(doc.title||'Untitled reflection')}</h1><p>Khaleel · Drafts save automatically. This preview does not publish the article.</p></header>${figure}${prose}</main></body></html>`;
}
