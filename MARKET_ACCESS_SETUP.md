# Market access setup

The seller access screen uses a business prefix and a random secret, such as
`LOLUWA-7K9M-4WQX-8P3D`. Example codes in this document are illustrative.
Each code has 12 random characters from a 32-character alphabet.

The prefix is public context. The random suffix controls access. The database
stores a keyed hash. Code replacement invalidates all sessions for that account.
Reset administrators can replace seller codes. The owner can create reset
administrators and seller accounts. Sessions expire after eight hours.

## Installation

1. Run `supabase/market-access.sql` in the resumed Invoreview project's SQL Editor.
2. Add these server variables to the existing Vercel project and your private
   setup terminal.

   - `MARKET_SUPABASE_URL` is `https://fpoxrlsnlszyoslhpfor.supabase.co`.
   - `MARKET_SUPABASE_SECRET` is the project's legacy service-role key.
   - `MARKET_ACCESS_SECRET` is a random secret of at least 32 bytes.
     Generate one locally with
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

3. Run `node scripts/setup-market-access.mjs`. This creates business access
   records from the published Sanity market list and one owner account. Save the
   displayed owner code privately. Repeating this command preserves existing codes.
4. Deploy the updated source, including the Vercel server functions. Open
   `/seller.html` and sign in using the owner code.
5. Create a seller account for a pilot business and a manager account for the
   delegated reset administrator. Share codes privately through each person's
   known contact.

Keep service-role credentials in server settings. The seller browser calls the
Vercel function, which enforces account roles. Supabase tables and RPCs deny
anonymous and regular authenticated access.

## Delivery status

This stage implements code generation, sign-in, sign-out, account creation,
delegated resets, session revocation, attempt limiting and reset history.
The seller screen shows the five-item allowance. Product editing and file upload
limits require the next catalogue stage. The public market continues to read
its current Sanity listings until the catalogue migration is tested.

## Verification before inviting owners

- Test wrong-code and repeated-attempt responses.
- Confirm a seller receives their assigned business ID.
- Confirm a seller cannot list accounts, create accounts or reset another code.
- Confirm a manager can reset a seller but cannot reset an owner or manager.
- Reset a pilot seller and verify the old code and its existing session fail.
- Confirm neither code hashes nor server credentials appear in browser responses.

Changing `MARKET_ACCESS_SECRET` invalidates all codes and sessions. Keep a secure
copy alongside the database recovery material.
