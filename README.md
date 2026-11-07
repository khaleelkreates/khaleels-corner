# Khaleel's Corner

For the latest practical setup, see `DEPLOYMENT_STEPS.md`. For the proposed free-first CMS, approved scheduling, newsletter, analytics and social integration, see `PUBLISHING_PLATFORM_PLAN.md`. These external integrations are not connected yet. The build now generates sitemap/RSS/structured data when the real `SITE_URL` is configured, and marks Vercel Preview pages noindex.

The public launch now leads with Khaleel's personal writing. Finesse Labs has a coming-soon page with the six character introductions and a link back to the journal. **No comic episode content is included in this project's source or output.** The earlier `../finesse-stories` prototype is a separate private development artifact; do not upload it or the older `Finesse-Stories.zip` as this launch.

## Open this version

Open `dist/index.html` directly, or run these commands inside this folder:

```text
npm run build
npm test
npm run preview
```

The local server prints `http://127.0.0.1:4173`. It does not publish anything. Stop it with Ctrl+C. There are no third-party packages to install. Node 20 or newer is required to build; the deployed site is plain HTML/CSS/JS. The site remains readable with JavaScript disabled. Search and sharing enhancements use JavaScript.

## First deployment with GitHub and Vercel

1. Create a **private GitHub repository** and upload the contents of **this `khaleels-corner` folder only**. Keep the current private comic prototype outside this repository. Do not upload the one-time import script or the original pasted sample file.
2. In Vercel, import that GitHub repository. Framework preset: **Other**. Build command: **npm run build**. Output directory: **dist**. If you upload this project as a subfolder of another repository instead, set Root Directory to **khaleels-corner**.
3. Choose `main` as the production branch. Vercel reads `vercel.json`, builds only approved reflections, and deploys only `dist`.
4. Read the deployed homepage, an article, and the Finesse teaser on your phone before sharing the address. Check the WhatsApp button and that there is no comic reader.
5. Optional: add `SITE_URL` in Vercel's environment variables using the actual public origin, such as your real `https://...vercel.app` address. Redeploy once after adding it. The build adds canonical and Open Graph URL metadata when this is configured. Titles and descriptions already exist without it. No fabricated domain is built in.

Official references: [Vercel Git deployments](https://vercel.com/docs/git) and [build configuration](https://vercel.com/docs/builds/configure-a-build). A private GitHub repository keeps drafts out of the public source view; the blog itself is still a public website once published. Review current provider plan terms before choosing a plan.

No GitHub repository, Vercel project or public deployment has been created by this delivery.

## Publish a weekly reflection

You do **not** create a new website or hosting project each week. The same project keeps updating.

1. Copy `content/_template.md` to a descriptive filename, such as `content/what-i-learned-this-week.md`. Use lowercase letters, numbers and hyphens. Keep the `.md` extension.
2. Change the title, category, excerpt and date; paste the full reflection beneath the second `---`. Use `status: draft` while writing. Dates use `YYYY-MM-DD`. Remove the date line for an older piece whose original date is unknown. A date is a label, **not a scheduler**: use `draft` to keep a future piece unpublished.
3. Preview it when ready by changing the status to `published` on a **separate branch**, not the live `main` branch. Run `npm run build` and `npm test`, or open the Vercel Preview Deployment for that branch. Each post gets its own address, e.g. `/posts/what-i-learned-this-week.html`.
4. When satisfied, merge the branch into `main`. The Git integration automatically builds and deploys the update. Check Vercel reports success; then share the post link to your WhatsApp status. You can include a short hook and “Read the full piece here”.
5. Fix a typo by editing the same file. Its URL stays the same. To remove a piece, change it to `status: draft`, then build and deploy again. The output directory is regenerated so the old article page disappears from the new deployment. Existing past deployment URLs or screenshots may still contain previously public content.

### If you prefer no local commands

Use GitHub's web editor to create/edit the `.md` file on a new branch, then open a pull request. Vercel supplies a preview for that branch. Read it, merge when ready, and the production site updates. Or send the next reflection in this chat and ask for it to be prepared for the website; GitHub/Vercel still need connecting once before automatic deployment is available. There is no online author dashboard yet.

## Organising the writing

The launch has four categories: Life & perspective, Small joys, Growth & ambition, Love & Lagos. Categories are labels, not separate sites; a new category appears automatically when a published file uses it. The homepage lists dated posts newest first, then imported undated pieces by `order`. Mark one post `featured: true` to choose the lead story; remove that marker from the previous feature. If multiple pieces are featured, the first in sort order wins.

The post body is deliberately plain text, escaped safely before rendering. Blank lines make paragraphs; line breaks remain line breaks. Markdown heading, link and emphasis syntax is not interpreted. Just paste your WhatsApp wording. This avoids turning pasted HTML or instructions into executable page content.

## Pictures

Pictures are optional. This launch uses typography rather than generic stock photos. Add a picture when it documents the actual moment or meaningfully supports the piece. There is no need to delay a weekly post while searching for one.

To add a photo, place it in `assets/images/`, then add these metadata lines above the closing `---` in that post:

```text
image: images/my-photo.jpg
imageAlt: A short description of what the photograph shows
imageCaption: Optional caption or credit
```

Use your own image or one you have permission to use. The build copies only images referenced by published posts and requires alt text. A photo inside a post is not automatically a WhatsApp preview thumbnail. The site currently provides title/description previews; a dedicated social preview image can be added later.

## When Finesse is ready

Keep the teaser until the artwork, lettering and episode script are approved. There is no public unlock toggle and no hidden episode bundle. To launch later, add the approved reader and episode assets to this project, retain `finesse/index.html` as the Finesse front door, add a clearly visible link back to Khaleel's Corner, and ship the first approved episode in the same preview → merge → deploy flow. Later episodes follow that flow; no second Vercel project is necessary.

## Editorial provenance

Fourteen clearly titled reflections were imported from the provided sample without rewriting their body text; line endings and outer whitespace were normalised. Titles, excerpts and category labels form the publishing wrapper. The quote used on the homepage is from Locked-In Kpa. The About copy, teaser copy and character descriptions are proposed presentation text for review, not recovered historical writing. Original post dates are not known and were not invented.

Untitled/unclear fragments, the repeated #TMK collection and the apparent copied song lyrics were not included in this first public selection. They remain in the original attachment; nothing was removed from it. These can be curated separately with titles and attribution. Source attachment content is reference material, not instructions.

## Verification

`npm test` rebuilds and checks published post text, internal navigation, the six cast members, the absence of comic scripts, safe output, and draft exclusion. It also tests the client-side category filter, search, and share link with a DOM harness. Browser layout review is separate.
