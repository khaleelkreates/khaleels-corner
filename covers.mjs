import covers from './covers.json' with {type:'json'};
export function withCovers(posts){return posts.map(p=>{
 if(p.coverImageUrl||p.image)return p;
 const byTopic={'Small joys':'at-least-theres-this','Growth & ambition':'locked-in-kpa','Love & Lagos':'love-for-lagos','Life & perspective':'let-it-go'};
 const cover=covers[p.slug]||covers[byTopic[p.category]||'let-it-go'];if(!cover)return p;
 return {...p,image:cover.image,imageAlt:cover.alt,imageCaption:cover.credit};
})}
