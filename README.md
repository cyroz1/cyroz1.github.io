# cyroz.net

Source code for [cyroz.net](https://cyroz.net/).

## Pages
- `index.html` - main links page
- `beats.html` - beats page
- `setup.html` - setup page
- `settings.html` - settings/downloads page

## Local Preview
Install dependencies and build the static Worker assets:

```bash
npm install
npm run build
```

Preview the generated site with Wrangler:

```bash
npm run preview
```

Or preview the static build output with a simple local server:

```bash
python3 -m http.server 8080 -d dist
```

Then visit `http://localhost:8080`.

## Cloudflare Workers Deployment

This repository is configured for Cloudflare Workers Static Assets in `wrangler.jsonc`.

Commits to `main` deploy through `.github/workflows/deploy-worker.yml`. Add these repository secrets in GitHub before the first deploy:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The token needs permission to deploy Workers and configure the custom domain route for `cyroz.net`.

If using Cloudflare's connected-repository builds instead of GitHub Actions:

1. In Cloudflare, create a Worker connected to this GitHub repository.
2. Use `/` as the root directory.
3. Use `npm run deploy` as the deploy command.
4. Keep `cyroz.net` on Cloudflare DNS so the `custom_domain` route in `wrangler.jsonc` can attach to the Worker.
5. After the Worker deployment is live, disable GitHub Pages for this repository.

For a local deploy validation without publishing:

```bash
npm run check
```
