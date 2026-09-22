# Fix the live site: every published page returns an error

## What is happening

The preview version of the site works fine and loads fast. The **published** site
(wcaglobal.org and world-changers-hub.lovable.app) returns an error for every page —
home, About, Locations, Events, everything.

The cause is not the page code and not the database. One of the Supabase libraries the
site depends on fails to start up inside the published hosting environment. Because that
failure happens before any page can be prepared, every request dies immediately with a
generic error. The preview runs in a different environment, which is why it never showed
the problem.

## The fix

1. **Repair the faulty library loading** so it starts correctly in the published
   environment. This is a build-configuration change; no page or feature behaviour changes.
2. **Make the public pages independent of that library on the server.** The prepared
   server-side data for Home, About, Locations, Events, Fundraising and Regional pages will
   read from the database over plain web requests instead of going through the realtime
   Supabase library, which is only needed in the browser. This removes an entire class of
   publishing failures and keeps the fast server delivery we built.
3. **Load the browser-side Supabase connection only in the browser**, so the realtime part
   is never started while a page is being prepared on the server.
4. **Add a pre-publish check**: build the production version and request the main public
   pages against it before publishing, so an error like this is caught before it reaches
   visitors.

## Verification before handing back

- Production build succeeds.
- Home, About, Locations, a regional page, Events, Fundraising and an event detail page all
  return a real page (not an error) from the production build.
- Preview still loads fast on phone, tablet and desktop, in English and French, light and dark.
- Publish, then confirm the live addresses serve pages correctly.

## Technical detail

- Published worker error (all routes, status 500):
  `TypeError: Class extends value [object Module] is not a constructor or null` thrown at
  module init inside `@supabase/realtime-js`, which extends a class from `@supabase/phoenix`.
  `@supabase/phoenix` ships dual CJS/ESM (`priv/static/phoenix.cjs.js` / `phoenix.mjs`); the
  worker bundle picks the CommonJS build, so the import resolves to a module namespace object
  and the `extends` fails. h3 swallows it into `{"status":500,"unhandled":true,"message":"HTTPError"}`.
- Step 1: add a `resolve.alias` in `vite.config.ts` mapping `@supabase/phoenix` to
  `@supabase/phoenix/priv/static/phoenix.mjs` (passed through `defineConfig({ vite: { ... } })`).
  No `ssr.external` / `resolve.external` changes.
- Step 2: in `src/lib/public-site.functions.ts` and `src/lib/public-event.functions.ts`,
  replace `createClient` from `@supabase/supabase-js` with a small internal PostgREST
  `fetch` helper (`SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`, `apikey` header, 8s timeout,
  same select/filter/order/limit strings, same return shapes and zod validation). Server
  functions then pull in zero Supabase runtime code.
- Step 3: keep `@/integrations/supabase/client` API-identical but defer client construction
  (lazy getter / proxy) so `createClient` is not executed during SSR module evaluation.
  `client.server.ts` and `auth-middleware.ts` keep current behaviour.
- Step 4: run the production build and smoke-test the routes above against the built worker
  output before publishing; keep the existing `src/server.ts` error wrapper and logging.
