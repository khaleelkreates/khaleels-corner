# Khaleel's Writing Desk

Authenticated Sanity Studio for manual article management. Readers do not get editing access. New article, Edit and Publish are native Studio controls; Preview article is a private in-memory text preview. Drafts auto-save. Hide article retains the draft and removes the published version from Sanity. Select the **Published perspective** before opening the document actions menu to find Hide article (Unpublish). A subsequent successful Vercel rebuild removes its current public page.

There is no public draft-preview URL and no browser API key to paste. Add your Sanity project ID to `.env.local` (copy `.env.example`) and sign in through Sanity. Host this Studio with Sanity's hosting or as a separate Vercel project; the public blog remains a separate static build. Do not switch the blog to CMS mode before importing and checking the existing articles.

Run `npm install`, then `npm run dev`. `npm run deploy` hosts the dashboard at your chosen `*.sanity.studio` address after Sanity account setup. Full connection instructions are in `../CMS_SETUP.md`.

Changing a post in Studio does not instantly mutate static HTML. Publish and Hide must trigger a Vercel production deploy hook configured as a Sanity webhook. Wait for that deployment to be Ready. Old immutable Vercel deployment URLs and copies already received by readers are not erased by unpublishing.
