# GrowthFun — informational preview

This branch contains only the source for the bilingual GrowthFun project introduction. The application is not publicly available. This branch does not contain the application, content catalog, offline worker, private alpha, or any developmental instructions or artwork drafts.

With the Node.js version in `.nvmrc`, run `node --test preview-site/build.test.mjs` and `node preview-site/build.mjs`. The site is generated into `out-preview/` from an explicit file allowlist; `node preview-site/build.mjs --check` verifies it byte for byte. Serve that directory on a static host with directory indexes and a real 404. English and Simplified Chinese are available at `en/` and `zh-Hans/` under the site root.

The `Public informational preview` GitHub Actions workflow tests the site and publishes only `out-preview/` from `public-preview`. It never deploys pull requests. The bundled Fraunces subset is subject to the included [SIL Open Font License](public/fonts/Fraunces-OFL.txt). GitHub Pages may process technical request data; the site itself uses no forms, analytics, cookies, service worker, or app storage.
