# Free manual publishing at your own /admin page

Target website: https://khaleels-corner-pi.vercel.app

Verified project ID: `nlzgbij6`. A read-only request to its `production` dataset succeeded. The non-secret ID is now in `cms/project.json`, so the dashboard build does not require you to enter it again. The content source stays on the original files until the initial article import is complete and `CONTENT_SOURCE=sanity` is explicitly set.

The dashboard will live at https://khaleels-corner-pi.vercel.app/admin after the CMS update is deployed and your Sanity project is connected. That address is not active merely because these source files exist locally.

## Cost

Use Sanity **Free**, not a paid subscription. New projects may show a Growth trial banner. Sanity says the project automatically falls back to Free when the trial ends and there is no charge unless you explicitly upgrade. Do not add a payment method or depend on Growth-only features. This manual setup uses normal drafts, publish/unpublish, Studio authentication and a webhook. It does not use scheduled drafts, custom paid roles or private datasets.

Free has usage quotas. At the time checked, Sanity lists 20 user seats and two public datasets on Free. Draft text is still protected from anonymous access even in a public dataset. Published documents are publicly queryable. Ordinary image-asset URLs are publicly accessible; do not upload sensitive unpublished photographs or unreleased comic art that requires access control.

Vercel Hobby remains for personal non-commercial use. The current personal journal can be launched without advertising; a later monetised/commercial site needs hosting terms reviewed. No free service can be promised to remain unlimited or unchanged forever.

## Connect your project

1. In Sanity Manage, create/select a project and use the **Free** plan. Create a public dataset called `production` if it does not already exist. Leave trial-only functionality unused. The project ID is a short non-secret identifier visible in project settings.
2. Copy `cms/.env.example` to `cms/.env.local` on your laptop. Set `SANITY_STUDIO_PROJECT_ID` to the real ID and `SANITY_STUDIO_DATASET` to `production`. Do not put API tokens in a `SANITY_STUDIO_` variable: those variables enter the browser bundle.
3. In Sanity project's API / CORS settings, add `https://khaleels-corner-pi.vercel.app` with **Allow credentials** enabled. For local dashboard testing add `http://localhost:3333` too. Use exact origins, not wildcards or a URL containing `/admin`.
4. From PowerShell in the website folder, install dashboard dependencies with `npm.cmd --prefix cms install`. Then run `npm.cmd run cms:dev` and sign in to the intended Sanity account. Only grant Studio access to the owner.
5. Import the existing 14 public articles once, preserving their addresses and wording. In PowerShell:

```powershell
Set-Location 'C:\Users\HP\Documents\ChatGPT\Finesse lab\khaleels-corner\cms'
npx.cmd sanity login
npx.cmd sanity exec import-articles.js --with-user-token
```

The importer uses your local CLI login; there is no API token to paste into chat. It skips articles with existing published/draft IDs and records an authenticated import marker to stop later runs from resurrecting hidden content. No external import has been run by this delivery.

6. In Studio, verify the 14 articles and original slugs. Do not change the public website to CMS mode until these are present. Use Preview article to check text without publishing. Drafts save automatically.
7. Upload the updated project source (including the `cms` folder, `content-source.mjs` and `build-admin.mjs`) to the existing GitHub repository. Exclude `node_modules`, `.env.local`, `.sanity` and `dist`. The Vercel install command in `vercel.json` installs the dashboard packages. The public website still has no runtime package dependencies.
8. In Vercel Production environment variables, set:

| Name | Value |
| --- | --- |
| `SITE_URL` | `https://khaleels-corner-pi.vercel.app` |
| `SANITY_PROJECT_ID` | Your actual project ID |
| `SANITY_DATASET` | `production` |
| `CONTENT_SOURCE` | `sanity` |

Do not add a write token to the public site build. The site reads published articles anonymously. A failed CMS request fails the new build, preserving the previous deployment rather than restoring stale local articles.

9. Redeploy and test `/admin`, its sign-in, the journal and a published article. Then connect the webhook below.

## Make Publish and Hide update the public site

Manual publishing means you click the editorial buttons yourself. A webhook still needs to notify Vercel to rebuild the static pages; otherwise the CMS changes and the website stays unchanged.

1. In Vercel project Settings → Git → Deploy Hooks, create a deploy hook for `main`. Keep its URL private; it can trigger builds.
2. In Sanity Manage → API → Webhooks, add that URL, set method POST and choose the `production` dataset.
3. Enable **Create, Update and Delete** triggers. Exclude draft/version events and scope to reflections:

```groq
_type == "reflection" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))
```

Use the normal published-document event behavior; leave drafts/versions inclusion disabled. Ensure delete events trigger too: unpublish deletes the published document. Test Hide as well as Publish; a webhook that only handles creates is incomplete.

4. Create a temporary draft and confirm it has no public URL. Publish it; wait for Vercel **Ready** and verify its link. Hide it; wait for the next successful build and confirm both its homepage card and old current-site URL are removed. Republish it to confirm the same slug works. Delete only the temporary test when finished.

## Your daily buttons

- **New article:** use the plus/create control in All articles.
- **Save draft:** typing auto-saves a private draft. Wait for Studio's saved/synced indication before closing.
- **Preview article:** private text preview within the editor, without sending draft text to the website. Photo selection is visible in the form; this text preview is not a complete public-layout proof.
- **Publish / Update website:** makes the approved document public in Sanity and triggers a new Vercel build. Wait for that build to finish before sharing its link.
- **Hide article (Unpublish):** select the **Published perspective** in the editor, then open its actions menu and choose Hide. This retains the draft. After the rebuild the current public page disappears.
- **Edit a live post:** edits remain private until Publish / Update website is clicked again; the previous published version stays live meanwhile.

Unpublishing removes the current deployment's article. It cannot erase old immutable deployment URLs, browser caches or copies already saved by readers. Keep material that has never been public as drafts from the start.

## Limits and current verification

The admin integration and published-only content loader are source code prepared locally. Account sign-in, a live webhook, import and live Publish/Hide have not been verified without your project connection. Local tests cover public-only reads, safe preview text, no stale file fallback, hidden URLs and an empty journal. The Sanity bundle build depends on installing the dashboard packages successfully.

References: [Free plan and trial](https://www.sanity.io/docs/platform-management/growth-plan-trial), [pricing](https://www.sanity.io/pricing), [draft visibility](https://www.sanity.io/docs/content-lake/drafts-and-versions), [self-hosting Studio](https://www.sanity.io/docs/studio/deployment), [environment-variable security](https://www.sanity.io/docs/studio/environment-variables).
