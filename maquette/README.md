# gabier.sh — site

Static site, no build step. Open `index.html` or serve the folder:

```sh
python3 -m http.server -d site 8080
```

Deploy: GitHub Pages (Settings → Pages → branch `main`, folder `/site`), Netlify, Cloudflare Pages, or `rsync` to any nginx.

Replace `[TON_USER]` with the GitHub user, and the `[X] MB` figures once measured.
