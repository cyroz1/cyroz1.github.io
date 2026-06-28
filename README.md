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

Commits to `main` deploy through Cloudflare Workers Builds. In Cloudflare:

1. In Cloudflare, create a Worker connected to this GitHub repository.
2. Use `/` as the root directory.
3. Use `npm run deploy` as the deploy command.
4. After the Worker deployment is live, disable GitHub Pages for this repository.

To serve `cyroz.net`, add the domain to Cloudflare DNS, update the registrar nameservers to Cloudflare's nameservers, and then attach `cyroz.net` to the `cyroz-net` Worker from the Worker's **Domains** tab.

For a local deploy validation without publishing:

```bash
npm run check
```
