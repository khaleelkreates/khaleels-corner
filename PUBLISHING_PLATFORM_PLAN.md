# Khaleel's Corner publishing platform

## Decision

Keep the custom website, GitHub and Vercel. Start on free service tiers where they meet the requirements. Retain the Finesse teaser and keep comic scripts outside the public project until launch approval. This is an implementation specification, not a claim that integrations already exist.

## Proposed services and boundaries

| Need | Proposed implementation | Cost/operational boundary |
| --- | --- | --- |
| Write, edit, preview, approve | Sanity Studio with article, category, author and editorial-status fields | Free supports a solo CMS. Native scheduled drafts are a Growth feature; free uses our separate scheduler. Formal multi-person role separation may need an upgrade. |
| Three-month publication queue | Store approved scheduled posts as authenticated Sanity **drafts**, then a GitHub Actions worker publishes only due approved revisions | Actions usage quotas apply. Scheduled runs can be delayed, so this is not an exact-minute service-level guarantee. |
| Site releases | Vercel rebuild after a due article is published; confirm successful deployment and the article's live URL | A failed build leaves the previous site live and must not trigger newsletter/social delivery. |
| Email subscription and campaigns | Brevo signup form with confirmation, list management, unsubscribe and campaign delivery | Free currently allows 300 sends/day. Larger simultaneous newsletters need a paid plan or an explicitly designed send strategy. |
| Search/discovery | HTML article pages, canonical metadata, sitemap, robots, BlogPosting JSON-LD, RSS and Search Console verification | Domain-dependent build files now exist; live domain and Search Console setup remain. Indexing/rich results are not guaranteed. |
| Advertising readiness | Inactive responsive placements after article content and, on wide screens, a secondary rail; explicit Advertisement labels; no ads on the coming-soon page | Activate only after approval and correct consent/privacy configuration. Spaces do not guarantee AdSense approval. |
| Readership | GA4 for article/topic engagement, return visits and acquisition, with tagged WhatsApp/email/social URLs | Configure property, privacy disclosures and consent behavior before loading tracking. |
| Social distribution | Publish event → confirmed live page → queue supported channels through a service such as Buffer | Connector/API capabilities and limits depend on the channel. Do not promise automated personal WhatsApp Status publishing. |

## CMS workflow

Draft → In review → Approved and scheduled → Publishing → Live → Distributed.

Approval must record the approved revision, approval timestamp and intended publication time. Editing a queued draft invalidates its approval until reviewed again. Include timezone-aware scheduling displayed in Africa/Lagos; store UTC timestamps internally. Unapproved, cancelled and future posts must not be published.

Sanity's free datasets expose published documents to public API queries. Therefore **do not publish a future post into Sanity merely with a future date/status and assume it is private**. Keep it under Sanity's authenticated draft path until due. Keep access tokens server-side. Sanity image asset URLs are not access-controlled by ordinary dataset privacy: unreleased comic art should remain outside public asset hosting.

For a solo owner, the approval step is an intentional editorial checkpoint. Enforced separate writer/approver permissions are a different requirement and may need paid roles. The scheduler must not silently reapprove changed content.

## Reliable automation requirements

Use article ID plus approved revision as the publication identity. Check due times in UTC. Serialize publication workers or use atomic revision checks to avoid overlapping runs. Keep durable delivery state in an authenticated store, separate from public article data. Record the deployment ID and canonical URL.

For email, persist the provider's campaign ID before requesting send. On retry, inspect its status; do not create/send a second campaign just because a network request timed out. Apply equivalent duplicate prevention per social channel. A new edit to an already published article must not automatically resend the newsletter. Provide manual retry, cancel and failure visibility in the CMS. Never infer subscriber consent from WhatsApp contacts.

A successful acceptance test must demonstrate: future drafts are unreadable publicly, one approved post goes live, its URL works, one confirmed subscriber receives one email, a retry does not duplicate it, an unapproved edit is blocked, and failed deployment prevents distribution. Actual test email/social sends require the user's explicit authorization.

## Three months of content

At one article per week, prepare 13 approved weekly releases. There are 14 imported titled pieces in the current preview. A possible launch is one public piece plus 13 queued pieces, subject to final editorial approval, first release date and weekly publishing time. The current files are not yet an approved scheduled queue. Their publication dates are unknown and must not be invented.

Keep room to swap a scheduled reflection for a timely piece. Scheduling an article does not authorize automatic rewriting or creating new posts in Khaleel's name.

## Rollout order

1. Review the launch selection, deploy the existing design, and establish the production URL.
2. Create/configure the Sanity project and CMS schema; import reflections as drafts, retaining original wording.
3. Add authenticated preview, approval and scheduling; test with a private test article before scheduling the content bank.
4. Configure Brevo signup/confirmation/unsubscribe and verified sending identity; connect live-publication events to campaigns.
5. Verify Search Console, SEO output, analytics and attribution. Add real About/contact/privacy information matching the actual connected services.
6. Add dormant ad positions and activate supported social channels. Keep ads off until the site qualifies and the hosting plan permits monetisation.
7. Approve and schedule the 13-week calendar after choosing the weekly slot. Monitor delivery failures and queue coverage.

## Accounts/configuration required

- Existing GitHub/Vercel account and the real production URL.
- A Sanity account/project and dataset. Project ID is non-secret; write tokens go into the relevant encrypted secret stores, never chat or browser source.
- A Brevo account, verified sender, signup form/list, and preferably an owned domain with email authentication records.
- GA4 property/measurement ID and Search Console ownership verification.
- Social accounts/channels chosen explicitly before connecting publishing permissions.

Free-first is not free forever. Vercel Hobby is for personal non-commercial use; monetisation requires a suitable commercial plan. Sanity's native scheduling and richer roles are paid. Email and automation usage can also exceed free quotas. No paid accounts or subscriptions have been created.

## Primary references checked November 2026

- [Sanity pricing](https://www.sanity.io/pricing), [scheduled drafts](https://www.sanity.io/docs/studio/scheduled-drafts), [draft visibility](https://www.sanity.io/docs/content-lake/drafts-and-versions), [asset security](https://www.sanity.io/docs/content-lake/keeping-your-data-safe).
- [GitHub scheduling limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
- [Brevo plans and send limits](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans).
- [Vercel fair-use guidance](https://vercel.com/docs/limits/fair-use-guidelines).
- [AdSense site readiness](https://support.google.com/adsense/answer/7299563).
- [Buffer supported channels](https://support.buffer.com/articles/connecting-your-channels-to-buffer-HvWLgAJvL9).
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), [GA4 acquisition reports](https://developers.google.com/analytics/devguides/reporting/data/v1/predefined-reports).
