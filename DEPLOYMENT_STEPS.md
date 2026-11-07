# Deploy Khaleel's Corner from this laptop

This is the current static launch, not the future CMS. Git and Vercel CLI are installed on this laptop. No GitHub remote is configured for this workspace; installation alone does not connect this project. Browser sign-in and CLI sign-in can also be separate.

## Recommended first deployment — GitHub website and Vercel dashboard

1. Open GitHub in your browser. Choose **New repository**. Name it `khaleels-corner`, choose **Private**, and create it.
2. In File Explorer, open `C:\Users\HP\Documents\ChatGPT\Finesse lab\khaleels-corner`.
3. Use GitHub's **uploading an existing file** / **Add file → Upload files** option. Upload the **contents of this folder**, not the parent `Finesse lab` folder. `package.json`, `build.mjs`, `seo.mjs` and `vercel.json` must be at the repository root. Include `assets`, `content`, `cast.json` and supporting source files. There is no need to upload `dist`; Vercel generates it. Keep the older comic prototype outside this repository. Commit the upload.
4. Open the Vercel dashboard and choose **Add New → Project**. Import `khaleels-corner` from GitHub. If it is missing, update Vercel's GitHub repository access to include it.
5. Use these project settings:

| Setting | Value |
| --- | --- |
| Project name | `khaleels-corner`, or another available name |
| Framework preset | Other |
| Root directory | Repository root (`./`) |
| Build command | `npm run build` |
| Output directory | `dist` |
| Production branch | `main`, if that is the repository's default branch |
| Environment variables initially required | None |

6. Click **Deploy**. Once the deployment is **Ready**, open the exact address Vercel gives you. Do not guess the address from the project name.
7. In project **Settings → Environment Variables**, add `SITE_URL` with that real public origin (e.g. your actual HTTPS Vercel address, no page path). Apply it to Production and redeploy. This generates the sitemap, RSS feed, canonical URLs and structured data using the correct domain. Change `SITE_URL` and redeploy again if you later add a custom domain. Preview deployments use noindex.
8. Read the homepage, a full reflection and the Finesse page on your phone. Test search and WhatsApp sharing. The current version publishes all 14 imported reflections; change the launch selection before deployment if you want the rest held for a future schedule. The `date` field alone does not schedule a post.

If the repository contains a `khaleels-corner` subfolder instead of the files at its root, set Vercel Root Directory to `khaleels-corner`. Do not use `dist` as the Root Directory.

## Terminal shortcut for a first live deployment

If you want a live link before connecting a GitHub repository, these PowerShell commands deploy the current project using the installed CLI:

```powershell
Set-Location 'C:\Users\HP\Documents\ChatGPT\Finesse lab\khaleels-corner'
npm.cmd test
vercel.cmd --prod
```

Follow the CLI's sign-in prompt if shown, choose your intended account, and set up a **new project** unless an existing one is yours and intended for this site. Use the current directory and the settings above. Do not override a different existing project. A CLI deployment does not automatically create/connect a GitHub repository; finish that connection under the Vercel project's Git settings if you use this shortcut. The dashboard route above is easier for automatic future deployments.

## Updates before the CMS exists

Edit an article under `content/` on a new branch in GitHub. Open its Vercel Preview Deployment and read it. Merge the branch into the live `main` branch; Vercel rebuilds and deploys automatically. Keep the article filename unchanged when fixing typos so existing links keep working.

## After the CMS upgrade

Article changes will be made in the CMS. You will write, preview, approve and schedule there. The publishing workflow will trigger the website update automatically; email/social delivery must wait for the article's production URL to be live. GitHub remains for code changes and the automation workflow.

## What is not connected yet

No CMS project, newsletter account, analytics property, AdSense account or social publishing account is connected. Nothing has been emailed or scheduled. The deploy commands above are instructions, not commands already run by this delivery.

References: [Vercel Git integration](https://vercel.com/docs/git), [Vercel deployments](https://vercel.com/docs/deployments), [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github).
