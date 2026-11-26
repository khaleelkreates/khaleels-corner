import covers from './covers.json' with {type:'json'};
export function withCovers(posts){return posts.map(p=>{
 if(p.coverImageUrl||p.image)return p;
 const cover=covers[p.slug];if(!cover)return p;
 return {...p,image:cover.image,imageAlt:cover.alt,imageCaption:cover.credit};
})}
