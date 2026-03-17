# Chuff-diner

Chuff Diner is now a full-stack app with:

- Bootstrap frontend
- Express backend API
- SQLite-backed persistent storage using sql.js
- Checkout modal for customer name, item, and quantity
- Admin dashboard to view live orders

## GitHub Pages

The repository can be published on GitHub Pages as a static demo.

- Images and frontend layout will work normally on Pages.
- Because GitHub Pages cannot run the Express backend, the site automatically falls back to demo data.
- In demo mode, orders are saved in the browser using localStorage.
- For the full API-backed experience, run the app locally with `npm start`.

To enable Pages for this repository:

1. Open repository Settings -> Pages.
2. Under Source, choose `GitHub Actions`.
3. Push to `main` and let the Pages workflow deploy automatically.

Pages URLs in this repo:

- Main site: `https://chuff-diner.github.io/Chuff-diner/`
- Admin page: `https://chuff-diner.github.io/Chuff-diner/admin.html`

## Full backend hosting

If you want the live GitHub URL to use the real Express API instead of demo mode, GitHub Pages alone is not enough. The backend must be hosted on a service like Render, Railway, Fly.io, or AWS, and the frontend can then be pointed at that API.

Right now, the GitHub Pages version is prepared to run as a static demo, while the local Node server remains the full version.

*** Add File: c:\Users\tshep\Desktop\Chuff-Diner\Chuff-diner\.github\workflows\pages.yml
name: Deploy GitHub Pages

on:
	push:
		branches:
			- main
	workflow_dispatch:

permissions:
	contents: read
	pages: write
	id-token: write

concurrency:
	group: pages
	cancel-in-progress: true

jobs:
	deploy:
		runs-on: ubuntu-latest
		environment:
			name: github-pages
			url: ${{ steps.deployment.outputs.page_url }}
		steps:
			- name: Checkout
				uses: actions/checkout@v4

			- name: Setup Pages
				uses: actions/configure-pages@v5

			- name: Upload artifact
				uses: actions/upload-pages-artifact@v3
				with:
					path: .

			- name: Deploy to GitHub Pages
				id: deployment
				uses: actions/deploy-pages@v4

*** Add File: c:\Users\tshep\Desktop\Chuff-Diner\Chuff-diner\.nojekyll


## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open:

http://127.0.0.1:3000/

Admin dashboard:

http://127.0.0.1:3000/admin

## API endpoints

- `GET /api/health`
- `GET /api/menu`
- `GET /api/diners`
- `GET /api/orders`
- `POST /api/orders`

Notes:

- Orders are persisted in `data/chuff-diner.sqlite` and survive server restarts.
- Menu and diner branch data are seeded automatically on first start.

Example order payload:

```json
{
	"itemId": "burger",
	"quantity": 2,
	"customerName": "Web Customer"
}
```