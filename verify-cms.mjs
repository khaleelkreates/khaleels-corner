import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {loadSanityPosts,normalizePost} from './content-source.mjs';
import {previewMarkup} from './cms/preview.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const post={_id:'reflection-test',slug:'test-reflection',title:'A live thought',category:'Small joys',body:'A line.\n\nAnother line.',excerpt:'A little joy.',order:0};
let called=false;
const loaded=await loadSanityPosts({env:{SANITY_PROJECT_ID:'testproject'},fetchImpl:async(url,options)=>{called=true;assert.equal(url.searchParams.get('perspective'),'published');assert.ok(!options.headers);return{ok:true,json:async()=>({result:[post]})}}});assert.ok(called);assert.equal(loaded.length,1);
await assert.rejects(loadSanityPosts({env:{SANITY_PROJECT_ID:'testproject'},fetchImpl:async()=>({ok:false,status:503})}),/No local fallback/);
await assert.rejects(loadSanityPosts({env:{SANITY_PROJECT_ID:'testproject'},fetchImpl:async()=>({ok:true,json:async()=>({result:[{...post,_id:'drafts.reflection-test'}]})})}),/Draft content rejected/);
await assert.rejects(loadSanityPosts({env:{SANITY_PROJECT_ID:'testproject'},fetchImpl:async()=>({ok:true,json:async()=>({result:[post,post]})})}),/share a URL/);
assert.throws(()=>normalizePost({...post,slug:'../leak'}),/Invalid article slug/);
assert.throws(()=>normalizePost({...post,coverImageUrl:'https://bad.example/x.jpg',imageAlt:'X'}),/Invalid CMS image/);
const preview=previewMarkup({title:'<script>alert(1)</script>',body:'<img src=x onerror=alert(1)>\n\nHello'});assert.ok(!preview.includes('<script>'));assert.ok(!preview.includes('<img'));assert.ok(preview.includes('&lt;script&gt;'));assert.ok(preview.includes('Hello'));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'khaleel-cms-')),fixture=path.join(temp,'posts.json');
const env={...process.env,CONTENT_SOURCE:'sanity',SANITY_PROJECT_ID:'testproject',SANITY_DATASET:'production',SANITY_TEST_RESPONSE:fixture};
try{
 fs.writeFileSync(fixture,JSON.stringify([post]));
 execFileSync(process.execPath,['--import',pathToFileURL(path.join(root,'tests','sanity-fetch.mjs')).href,path.join(root,'build.mjs')],{env,stdio:'pipe'});
 assert.ok(fs.existsSync(path.join(root,'dist','posts','test-reflection.html')));
 assert.ok(!fs.existsSync(path.join(root,'dist','posts','locked-in-kpa.html')),'Old local article resurfaced');
 const home=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.ok(!home.includes('posts/locked-in-kpa.html'));assert.ok(home.includes('A live thought'));
 fs.writeFileSync(fixture,'[]');
 execFileSync(process.execPath,['--import',pathToFileURL(path.join(root,'tests','sanity-fetch.mjs')).href,path.join(root,'build.mjs')],{env,stdio:'pipe'});
 assert.equal(fs.readdirSync(path.join(root,'dist','posts')).length,0);
 const emptyHome=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.ok(emptyHome.includes('The notebook is taking a breather'));assert.ok(!emptyHome.includes('test-reflection.html'));
}finally{
 fs.unlinkSync(fixture);fs.rmdirSync(temp);
 execFileSync(process.execPath,[path.join(root,'build.mjs')],{env:{...process.env,CONTENT_SOURCE:'files'},stdio:'pipe'});
}
console.log('PASS: published-only CMS reads; no auth token; no fallback; draft and duplicate rejection; safe private preview; hidden URLs removed; zero-article build; local preview restored.');
