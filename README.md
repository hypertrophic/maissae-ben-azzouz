# Maissae Ben Azzouz — Portfolio

One-page static site. No backend, no cookies, no third-party scripts.

- `index.html` `style.css` `script.js`
- `assets/` portrait, cards, gallery, self-hosted fonts

---

## Publish on GitHub Pages

1. New repo, e.g. `maissae-ben-azzouz`.
2. Put **these files at the repo root** (`index.html` must not sit in a subfolder).

   ```bash
   git init
   git add .
   git commit -m "Portfolio Maissae Ben Azzouz"
   git branch -M main
   git remote add origin https://github.com/YOUR_USER/maissae-ben-azzouz.git
   git push -u origin main
   ```

3. **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**
4. Site: `https://YOUR_USER.github.io/maissae-ben-azzouz/`

### Share image (do this once Pages is live)

Crawlers need an absolute image URL. In `index.html` replace both `assets/og.jpg` meta values with:

```
https://YOUR_USER.github.io/maissae-ben-azzouz/assets/og.jpg
```

### Custom domain (optional)

Add a `CNAME` file containing `maissaebenazzouz.com`, then point DNS at GitHub Pages.

---

## Add painting photos

```html
<figure class="tile" data-cat="peinture">
  <img src="assets/gallery/votre-toile.jpg" width="900" height="700" alt="Description" loading="lazy" decoding="async" />
  <figcaption>
    <strong>Titre</strong>
    <span>Peinture · année</span>
  </figcaption>
</figure>
```

`data-cat`: `numerique` | `design` | `peinture`

---

## Local preview

```bash
python3 -m http.server 8000
```
