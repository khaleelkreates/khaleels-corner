# Catalogue workspace

Open `/seller.html` on the deployed site and enter your business access code.

1. Add your business description and public contact details.
2. Upload a logo or main flyer if you have one.
3. Add up to **five items**, with **two photos per item**. A price is optional.
4. Click **Save draft** to keep changes private, or **Publish changes** to update your public catalogue.
5. Use **View public catalogue** to copy your shop link.

The market listing fetches the published business details. A site rebuild also includes them in the static market cards and sitemap. Publishing attempts to trigger the existing Sanity deployment webhook. If no webhook covers market listings, the owner can redeploy in Vercel to refresh the static copy and sitemap. The live catalogue itself works without a rebuild.

## Owner setup

Run `supabase/market-catalogue.sql` once in the same Supabase project used for market access. Sign in as owner and click **Set up existing business profiles** once. This imports the current public Sanity listings and creates the `corner-market` public storage bucket. Re-running setup preserves edited profiles.

Choose a business in the owner workspace to edit its catalogue. Sellers can only edit their assigned business. Reset administrators manage seller access codes and cannot edit catalogues.

## Photos and storage

Photos are converted in the browser to WebP, resized to a maximum of 1400 pixels and compressed to **400 KB or less**. Source files may be up to 20 MB. Supported modern browsers include Chrome, Edge and Safari.

Each business can have at most 24 stored photos and 10 MB of photo storage, allowing room for both a saved draft and the previous published version. The active catalogue uses at most 12 photos (logo, flyer, and ten item photos). Removed photos are released when no saved or published version uses them. Abandoned uploads become eligible for cleanup after a day, on the next upload/save. Original files should be kept separately.

Uploaded image URLs are public and random. Draft descriptions/items are available only through authenticated server endpoints. Upload only images intended for public display.

Two editors saving the same business are protected by a version check. If a newer edit exists, copy your changes and reload the business before saving. Unsaved entries remain in the page, with a warning before leaving. They are not a backup.

Supabase service credentials remain on the server. The browser receives a secure, HttpOnly session cookie and no database secret.
