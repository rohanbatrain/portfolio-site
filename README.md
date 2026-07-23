# rohanbatra.in — Portfolio & UPES-ECS × HPE Showcase

The personal site of **Rohan Batra** ([@rohanbatrain](https://github.com/rohanbatrain)) —
a Platform &amp; Reliability Engineer — plus a showcase of **UPES-ECS**, a resilient,
offline-first campus emergency communication system, and the July 2026 collaboration with
Team HPE.

🔗 **Live:** https://hpe.rohanbatra.in

> *“I build and operate systems that stay up.”*

---

## Pages

- **`index.html`** — the developer portfolio (main page): about, skills, featured projects, experience, contact.
- **`upes-ecs.html`** — a small redirect to the canonical UPES-ECS landing page, which is the **single source of truth**: <https://rohanbatrain.github.io/UPES-ECS/> (built from the `landing/` sources in the UPES-ECS repo). The portfolio's UPES-ECS links point there directly.

## Assets

- `assets/css/styles.css` — shared design system (dark + light, responsive)
- `assets/css/portfolio.css` — portfolio-page component styles
- `assets/js/main.js` — theme toggle, mobile nav, scroll reveal
- `CNAME` — custom domain for GitHub Pages (`hpe.rohanbatra.in`)

## Add your photos & videos

Media is hosted on Google Drive and loaded by the site. You only edit
[`assets/js/media.js`](assets/js/media.js) — paste each file's Google Drive **file ID**.
Full steps: [`MEDIA-GUIDE.md`](MEDIA-GUIDE.md).

Until IDs are added, the media section shows tasteful “coming soon” placeholders, so the
site always looks complete.

## Deploy (GitHub Pages)

1. Create a public repo and push these files.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`.
3. Add a DNS **CNAME** record: `hpe` → `<your-username>.github.io`.
4. GitHub Pages will pick up the `CNAME` file and serve at `https://hpe.rohanbatra.in`.
   (Enable **Enforce HTTPS** once the certificate is issued.)

## Local preview

```bash
# any static server works, e.g.
python -m http.server 8080
# then open http://localhost:8080
```

## Tech

Hand-written HTML/CSS/JS. No build step, no framework, no tracking. Fast and
self-contained (fonts are the only external request).

---

© Rohan Batra. Independent student project showcase. HPE, Aruba, Juniper Networks, and
Mist are trademarks of their respective owners; this site is not affiliated with or
endorsed by Hewlett Packard Enterprise or Juniper Networks.
