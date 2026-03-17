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