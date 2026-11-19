(() => {
  const $=id=>document.getElementById(id), form=$('catalogue-form'), status=$('catalogue-status');
  let shop, media=new Map(), busy=false;
  const defaults={name:'',category:'',description:'',whatsapp:'',instagram:'',email:'',logo:null,flyer:null};
  const mark=()=>{window.catalogueDirty=true;};
  const node=(tag,text,cls)=>{const element=document.createElement(tag);if(text) element.textContent=text;if(cls) element.className=cls;return element;};
  const button=(text,fn)=>{const b=node('button',text);b.type='button';b.addEventListener('click',fn);return b;};
  async function api(body, id) {
    const response=await fetch('/api/market-catalogue'+(id?'?businessId='+encodeURIComponent(id):''),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,businessId:shop?.id})}:{});
    const data=await response.json();if(!response.ok) throw Error(data.error||'Request failed.');return data;
  }
  function lock(value) {busy=value;window.catalogueBusy=value;form.querySelectorAll('button,input,textarea,select').forEach(el=>el.disabled=value);$('catalogue-business').disabled=value;}
  function usage() {$('item-count').textContent=shop.items.length+'/5';$('add-item').disabled=busy||shop.items.length>=5;$('photo-usage').textContent=media.size+' of 24 stored photos · '+(Array.from(media.values()).reduce((sum,m)=>sum+m.bytes,0)/1048576).toFixed(1)+' of 10 MB used. Saved and published versions can share photos.';}
  async function compress(file) {
    if(!file.type.startsWith('image/') || file.size>20000000) throw Error('Choose a photo smaller than 20 MB.');
    const bitmap=await createImageBitmap(file);
    try {
      if(bitmap.width*bitmap.height>60000000) throw Error('Choose a smaller photo.');
      const canvas=document.createElement('canvas');let size=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
      for(let attempt=0;attempt<7;attempt++) {
        canvas.width=Math.max(1,Math.round(bitmap.width*size));canvas.height=Math.max(1,Math.round(bitmap.height*size));
        canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82-attempt*.06));
        if(!blob || blob.type!=='image/webp') throw Error('Photo conversion is unavailable in this browser. Try a recent Chrome, Edge or Safari.');
        if(blob.size<=409600) return blob;size*=.85;
      }
      throw Error('This photo could not be reduced. Try a smaller image.');
    } finally {bitmap.close();}
  }
  function photoControl(title,ids,onChange,max) {
    const box=node('div',null,'photo-control');box.append(node('h4',title));
    const images=node('div',null,'photo-row');
    ids.forEach(id=>{
      const tile=node('div',null,'photo-tile'),image=node('img');image.src=media.get(id)?.url||'';image.alt=title+' preview';
      tile.append(image,button('Remove',()=>{onChange(ids.filter(value=>value!==id));mark();renderPhotos();renderItems();api({action:'discard',imageId:id}).then(result=>{result.deleted.forEach(value=>media.delete(value));usage();}).catch(()=>{});}));images.append(tile);
    });box.append(images);
    if(ids.length<max) {
      const label=node('label','Upload photo'),input=node('input');input.type='file';input.accept='image/*';
      input.addEventListener('change',async()=>{
        if(!input.files[0] || busy) return;lock(true);status.textContent='Resizing and uploading photo…';
        try {
          const blob=await compress(input.files[0]);
          const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
          const image=await api({action:'upload',imageId:crypto.randomUUID(),data});media.set(image.id,image);onChange([...ids,image.id]);mark();
          status.textContent='Photo uploaded. Save your draft or publish to use it.';renderPhotos();renderItems();
        } catch(error) {status.textContent=error.message;} finally {lock(false);usage();}
      });label.append(input);box.append(label);
    }return box;
  }
  function renderPhotos() {
    for(const key of ['logo','flyer']) $(key+'-upload').replaceChildren(photoControl(key==='logo'?'Business logo':'Main flyer',shop.profile[key]?[shop.profile[key]]:[],ids=>shop.profile[key]=ids[0]||null,1));
    if(!shop.profile.flyer && shop.profile.legacyGallery?.length) {
      const existing=node('div',null,'photo-row');
      shop.profile.legacyGallery.slice(0,2).forEach(photo=>{
        if(!/^https:\/\/cdn\.sanity\.io\/images\/[\w/.-]+$/.test(photo.url||'')) return;
        const tile=node('a',null,'photo-tile');tile.href=photo.url;tile.target='_blank';tile.rel='noopener';
        const image=node('img');image.src=photo.url;image.alt=photo.alt||'Existing business image';image.loading='lazy';tile.append(image);existing.append(tile);
      });$('flyer-upload').append(node('p','Your existing gallery stays public until you upload a replacement flyer.','hint'),existing);
    }
  }
  function renderItems() {
    $('catalogue-items').replaceChildren(...shop.items.map((item,index)=>{
      const card=node('article',null,'item-editor');card.append(node('h3','Item '+(index+1)));
      for(const [key,title,max] of [['name','Item name',100],['description','Description',800],['price','Price (optional)',80]]) {
        const label=node('label',title),input=node(key==='description'?'textarea':'input');input.value=item[key];input.maxLength=max;input.required=key==='name';if(key==='description') input.rows=3;
        input.addEventListener('input',()=>{item[key]=input.value;mark();});label.append(input);card.append(label);
      }
      const label=node('label','Availability'),select=node('select');for(const [value,title] of [['yes','Available'],['no','Currently unavailable']]) {const option=node('option',title);option.value=value;select.append(option);}select.value=item.available?'yes':'no';select.onchange=()=>{item.available=select.value==='yes';mark();};label.append(select);card.append(label);
      card.append(photoControl('Item photos',item.photos,ids=>item.photos=ids,2),button('Delete item',()=>{if(!confirm('Remove this item from your draft? Publish to remove it from the public catalogue.')) return;shop.items.splice(index,1);mark();renderItems();}));return card;
    }));usage();
  }
  async function load(id) {
    if(busy) return;
    if(window.catalogueDirty && !confirm('Discard unsaved changes and load this business?')) return false;
    lock(true);status.textContent='Loading catalogue…';
    try {
      const data=await api(null,id);shop=data.shop;shop.profile={...defaults,...shop.profile,name:shop.profile.name||shop.name};
      media=new Map(data.media.map(image=>[image.id,image]));
      for(const key of Object.keys(defaults).filter(key=>!['logo','flyer'].includes(key))) form.elements.namedItem(key).value=shop.profile[key];
      form.hidden=false;window.catalogueDirty=false;renderPhotos();renderItems();$('catalogue-preview').hidden=true;
      $('public-catalogue').href=shop.url||'/shops/'+shop.id;$('public-catalogue').hidden=!shop.published_profile;
      status.textContent='Changes stay in your draft until you click Publish changes.';return true;
    } catch(error) {form.hidden=true;status.textContent=error.message;return false;}
    finally {lock(false);if(shop) usage();}
  }
  async function save(publish) {
    if(busy || !form.reportValidity()) return;
    lock(true);status.textContent=publish?'Publishing…':'Saving draft…';
    try {
      const result=await api({action:'save',profile:shop.profile,items:shop.items,version:shop.version,publish});shop.version=result.version;window.catalogueDirty=false;(result.deleted||[]).forEach(id=>media.delete(id));
      status.textContent=publish?'Published. Your public catalogue is updated. The market listing updates after the site rebuild.':'Draft saved. Your public catalogue stays as it was.';
      if(publish) {$('public-catalogue').hidden=false;shop.published_profile={...shop.profile};}
    } catch(error) {status.textContent=error.message;} finally {lock(false);usage();}
  }
  form.addEventListener('input',event=>{if(event.target.name && Object.hasOwn(defaults,event.target.name)) {shop.profile[event.target.name]=event.target.value;mark();}});
  form.addEventListener('submit',event=>{event.preventDefault();save(false);});
  $('publish-catalogue').onclick=()=>save(true);
  $('add-item').onclick=()=>{if(shop.items.length>=5) return;shop.items.push({id:crypto.randomUUID(),name:'',description:'',price:'',available:true,photos:[]});mark();renderItems();};
  $('preview-catalogue').onclick=()=>{
    const content=$('preview-content');content.replaceChildren(node('h2',shop.profile.name),node('p',shop.profile.description));
    shop.items.forEach(item=>{const card=node('article',null,'item-editor');item.photos.forEach(id=>{const image=node('img');image.src=media.get(id)?.url||'';image.alt=item.name;image.className='preview-image';card.append(image);});card.append(node('h3',item.name||'Untitled item'),node('p',item.description),node('p',item.price||'Ask for price'),node('p',item.available?'Available':'Currently unavailable'));content.append(card);});
    $('catalogue-preview').hidden=false;$('catalogue-preview').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  };
  $('catalogue-import').onclick=async()=>{const b=$('catalogue-import');b.disabled=true;try {const data=await api({action:'initialise'});status.textContent=data.imported+' existing business profiles set up. Choose a business to edit.';if(shop) await load(shop.id);}catch(error){status.textContent=error.message;}finally{b.disabled=false;}};
  $('catalogue-business').onchange=async event=>{const id=event.target.value;if(!await load(id) && shop) event.target.value=shop.id;};
  window.addEventListener('market-account',async({detail:account})=>{
    if(!['owner','seller'].includes(account.role)) return;
    $('catalogue').hidden=false;
    if(account.role==='seller') {await load(account.business_id);return;}
    $('owner-catalogue').hidden=false;$('catalogue-business').replaceChildren(...Array.from($('businesses').options).map(option=>option.cloneNode(true)));
    if($('catalogue-business').value) await load($('catalogue-business').value);
  });
  window.addEventListener('beforeunload',event=>{if(window.catalogueDirty || busy){event.preventDefault();event.returnValue='';}});
})();
