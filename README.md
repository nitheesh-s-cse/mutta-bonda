# Vijaykumar's Mutta Bonda Shop — Full Website

A complete ordering website for the shop: premium animated frontend, a working cart and WhatsApp checkout, an admin dashboard, and a Node.js/Express/MongoDB backend for menu, orders, feedback, and contact data.

```
mutta-bonda-shop/
├── frontend/          → static site (HTML/CSS/JS) — customer site + admin.html
│   ├── index.html
│   ├── admin.html
│   ├── css/style.css
│   ├── js/main.js
│   ├── js/admin.js
│   └── assets/favicon.svg
└── backend/           → Node.js/Express/MongoDB API
    ├── server.js
    ├── seed.js
    ├── config/db.js
    ├── models/
    ├── routes/
    └── middleware/auth.js
```

> **Note on images:** the menu, gallery, and hero use placeholder photography (picsum.photos) so the site is visually complete out of the box. Swap the `imgUrl()` calls in `js/main.js` and the `<img>` tags in `index.html` for real photos of the shop and dishes whenever you're ready — search "how to replace images" below.

---

## 1. Install Node.js

Download the LTS version from [nodejs.org](https://nodejs.org) and install it. Confirm it worked:

```bash
node -v
npm -v
```

## 2. Set up MongoDB

You have two options:

**A. MongoDB Atlas (recommended — free, no local install)**
1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free (M0) cluster.
3. Under **Database Access**, create a username/password.
4. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`) for now.
5. Click **Connect → Drivers**, copy the connection string — it looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mutta-bonda-shop`

**B. Local MongoDB**
Install MongoDB Community Server for your OS, then use `mongodb://localhost:27017/mutta-bonda-shop` as your connection string.

## 3. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in:
- `MONGO_URI` — your connection string from step 2
- `JWT_SECRET` — any long random string (used to sign admin login tokens)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the login you'll use for `admin.html`
- `CLIENT_ORIGIN` — where your frontend will run (e.g. `http://localhost:5500` or your live domain)

## 4. Run the backend

```bash
cd backend
npm install
npm run seed     # loads the starting menu + creates your admin account
npm start        # or: npm run dev (auto-restarts on changes, needs nodemon)
```

You should see `Mutta Bonda Shop API running on port 5000`. Test it: open `http://localhost:5000/api/health` — it should return `{"status":"ok"}`.

## 5. Run the frontend

The frontend is static — no build step. Easiest ways to preview it locally:

- **VS Code:** install the "Live Server" extension, right-click `frontend/index.html` → *Open with Live Server*.
- **Or with Node:** `npx serve frontend`

By default the frontend calls the API at `http://localhost:5000/api`. To point it elsewhere (e.g. your deployed backend), add this line right before the `<script src="js/main.js">` tag in `index.html` and `admin.html`:

```html
<script>window.API_BASE = "https://your-backend-url.onrender.com/api";</script>
```

## 6. Connect frontend and backend

Once both are running, open the frontend in your browser. Adding items to the cart and checking out will also POST an order to your backend; the feedback and contact forms POST to `/api/feedback` and `/api/contact`. Open `admin.html`, log in with the admin credentials from your `.env`, and you'll see live orders, sales stats, and menu management.

## 7. Git and GitHub setup

```bash
git init
git add .
git commit -m "Initial commit — Mutta Bonda Shop website"
```

Create a new empty repository on [github.com](https://github.com/new), then:

```bash
git remote add origin https://github.com/<your-username>/mutta-bonda-shop.git
git branch -M main
git push -u origin main
```

**Important:** `.env` is already ignored by convention — never commit it. Create a `.gitignore` in `backend/` with:
```
node_modules/
.env
```

## 8. Deploy the frontend (GitHub Pages — static only)

1. In your GitHub repo, go to **Settings → Pages**.
2. Set **Source** to the branch containing `frontend/` (or move the frontend files to the repo root / a `docs/` folder, since Pages serves from root or `/docs`).
3. Save — your site will be live at `https://<your-username>.github.io/<repo-name>/`.
4. Update `window.API_BASE` (step 5) to point at your deployed backend URL, since GitHub Pages can't run Node.

## 9. Deploy the backend (Render)

1. Push your code to GitHub (step 7).
2. Go to [render.com](https://render.com) → **New → Web Service** → connect your repo.
3. Set **Root Directory** to `backend`.
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. Add environment variables from your `.env` file (Render → Environment tab): `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_ORIGIN` (set this to your GitHub Pages URL once live).
7. Deploy. Render gives you a URL like `https://mutta-bonda-shop-api.onrender.com`.
8. Run the seed script once from your local machine pointed at the live database (`MONGO_URI` in your local `.env` set to the Atlas URI) with `npm run seed`, or add a one-off Render Shell command.

*(Railway works almost identically — connect the repo, set the root directory to `backend`, add the same environment variables, deploy.)*

## 10. Connect a custom domain

On Render: **Settings → Custom Domain** → add your domain and follow the DNS instructions (usually a CNAME record pointing to your Render URL). On GitHub Pages: **Settings → Pages → Custom domain**, then add a CNAME record with your DNS provider pointing to `<your-username>.github.io`.

## 11. Updating things later

- **Menu items / prices:** log into `admin.html` and add, edit, or disable items directly — no code changes needed.
- **Today's Special:** update the `isTodaysSpecial` field on a menu item via the admin API (or add a small toggle in `admin.html` if you'd like — the backend route already supports it via `PUT /api/menu/:id`).
- **Logo:** replace `frontend/assets/favicon.svg` with your own SVG or PNG, and update the inline `<svg>` marks in the navbar/footer of `index.html` with an `<img>` tag if you'd rather use a raster logo.
- **Photos:** replace the `picsum.photos` placeholder URLs in `index.html` and `js/main.js` (`imgUrl()` function and gallery array) with real photos — upload them to `frontend/assets/` and point the `src` at the local path, e.g. `assets/mutta-bonda.jpg`.
- **Menu PDF:** if you'd like a downloadable PDF menu, drop it in `frontend/assets/menu.pdf` and link it from the nav, e.g. `<a href="assets/menu.pdf" download>Download Menu</a>`.

## 12. Troubleshooting

| Problem | Likely cause |
|---|---|
| Frontend loads but menu/cart data doesn't sync | `window.API_BASE` doesn't match your backend URL, or CORS — check `CLIENT_ORIGIN` in the backend `.env` matches your frontend's actual URL. |
| `MongoDB connection failed` on server start | Wrong `MONGO_URI`, wrong password, or Atlas Network Access doesn't allow your IP (or `0.0.0.0/0`). |
| Admin login fails after deploy | You seeded the database with different `.env` values than the ones set on Render — re-run `npm run seed` against the live database, or check `ADMIN_EMAIL`/`ADMIN_PASSWORD`. |
| Orders/feedback don't appear in `admin.html` | You're not logged in (token expired — log out and back in), or the backend URL in `admin.html`'s `window.API_BASE` is wrong. |
| GitHub Pages shows a blank page | Check the deployed path — Pages serves from repo root or `/docs`, so `frontend/` contents usually need to be at that path, not nested. |

---

Built as a customer-facing ordering site (cart, WhatsApp checkout, menu search, gallery, reviews, feedback) plus an admin dashboard (orders, sales stats, menu management) backed by a REST API.
