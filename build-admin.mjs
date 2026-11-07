import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));
const project=JSON.parse(fs.readFileSync(path.join(root,'cms','project.json'),'utf8'));
const projectId=process.env.SANITY_PROJECT_ID||process.env.SANITY_STUDIO_PROJECT_ID||project.projectId;
if(!projectId){console.log('Admin: not connected yet. Add your free Sanity project ID to enable /admin.');process.exit(0)}
if(!/^[a-z0-9]+$/.test(projectId))throw Error('Invalid Sanity project ID.');
const cli=path.join(root,'cms','node_modules','sanity','bin','sanity');
if(!fs.existsSync(cli))throw Error('Install CMS dependencies first: npm --prefix cms install');
execFileSync(process.execPath,[cli,'build',path.join(root,'dist','admin')],{cwd:path.join(root,'cms'),stdio:'inherit',env:{...process.env,SANITY_STUDIO_PROJECT_ID:projectId,SANITY_STUDIO_DATASET:process.env.SANITY_DATASET||process.env.SANITY_STUDIO_DATASET||'production',SANITY_STUDIO_BASEPATH:'/admin'}});
const index=path.join(root,'dist','admin','index.html');
fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace('</head>','<meta name="robots" content="noindex,nofollow"></head>'));
console.log('Admin: Writing Desk built at /admin. Sign in through Sanity; no paid features configured.');
