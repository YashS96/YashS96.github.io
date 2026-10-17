# yashs96.github.io: writing

Astro site for long-form technical articles with hand-built SVG diagrams. Deploys to GitHub Pages on every push to `main`.

## Layout

| Path | What it is |
| --- | --- |
| `src/content/writing/*.mdx` | Articles. Frontmatter: `title`, `subtitle`, `date`, `series`, `part`, `readingTime`, `tags`, `draft` |
| `widgets/*.jsx` | Diagram sources (JSX that returns an `<svg>`). Edit these to change a diagram |
| `src/diagrams/*.svg` | Generated from `widgets/` by `npm run diagrams`. Don't hand-edit |
| `src/components/Diagram.astro` | `<Diagram name="p1-01-map" />` inlines an SVG so it follows light/dark theme |
| `src/styles/global.css` | Site and diagram colour tokens (`--dg-*`) for light and dark |
| `.github/workflows/deploy.yml` | Build and deploy to Pages |

## Commands

```bash
npm ci            # install
npm run dev       # local dev server at http://localhost:4321
npm run build     # render diagrams + build static site into dist/
npm run preview   # serve dist/ locally
```

## Add an article

1. Create `src/content/writing/<slug>.mdx` with the frontmatter above.
2. Add diagrams as `widgets/<name>.jsx`, then reference them with `<Diagram name="<name>" />`.
3. Push to `main`.

## One-time GitHub setup

Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

For a project repo (not `YashS96.github.io`), set `base: '/<repo-name>'` in `astro.config.mjs`.

## Note on the root `index.html`

`public/index.html` is the portfolio page Astro serves at `/`. A copy also sits at the repo root so the site keeps working while Pages is still set to "Deploy from a branch". Once Pages uses **GitHub Actions**, edit `public/index.html` and delete the root copy and root `.nojekyll`.
