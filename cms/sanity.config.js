import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {reflection} from './schema.js';
import {PreviewAction,nameAction} from './actions.js';
import project from './project.json' with {type:'json'};
const projectId=process.env.SANITY_STUDIO_PROJECT_ID||project.projectId;
if(!projectId)throw Error('Set SANITY_STUDIO_PROJECT_ID in cms/.env.local to your Sanity Project ID.');
export default defineConfig({
 name:'khaleels-corner',title:'Khaleel’s Corner · Writing Desk',projectId,dataset:process.env.SANITY_STUDIO_DATASET||project.dataset,
 plugins:[structureTool({structure:S=>S.list().title('Your writing desk').items([
  S.listItem().title('All articles · Add / Edit').child(S.documentTypeList('reflection').title('Your articles')),
  S.divider(),
  S.listItem().title('Published articles').child(S.documentList().title('Published · switch to Published to Hide').filter('_type == "reflection" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))')),
  S.listItem().title('Drafts and unpublished edits').child(S.documentList().title('Drafts · saved automatically').filter('_type == "reflection" && _id in path("drafts.**")'))
 ])})],
 schema:{types:[reflection]},
 document:{actions:(prev,ctx)=>ctx.schemaType==='reflection'?[...prev.map(a=>a.action==='publish'?nameAction(a,'Publish / Update website'):a.action==='unpublish'?nameAction(a,'Hide article (Unpublish)'):a),PreviewAction]:prev}
});
