# AIM | Artemis Investment Metrics

Website and beta web app for AIM, a decision intelligence platform for real estate, small business acquisitions, and personal finance. A product of Carlisle Capital LLC.

## What is in the site
* `index.html` marketing site with a live rental calculator, modules, pricing, roadmap, and FAQ
* `demo.html` demo request form. Submitting it opens the app.
* `app.html` the full AIM workspace: dashboard, opportunities, rental, short term rental, and business analyzers, scenarios and sensitivity, AIM Score and target price, owned asset tracking, compare, budget and goals, net worth, AIMBot, AIM Learning, and reports
* `privacy.html` and `terms.html`

During the beta all workspace data is saved in the visitor's browser. No server or database is needed.

## Folder layout
* `src/` the files you edit
* `build.py` builds the site into `docs/`. Run `python3 build.py`
* `docs/` the published site (GitHub Pages serves this folder)
* `assets/` logo files

## Publish on GitHub Pages
Settings, then Pages. Source: Deploy from a branch. Branch: `main`, folder `/docs`.

## Collect demo requests by email
1. Create a free form at formspree.io and copy its endpoint.
2. Run `AIM_FORM_ENDPOINT="https://formspree.io/f/yourid" python3 build.py`
3. Commit and push. Each demo request is then emailed to you.
