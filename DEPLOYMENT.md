# 🚀 Free Deployment Guide — Vijaykumar's Mutta Bonda Shop

This guide walks you through deploying your shop website **100% free** using:

| Service | Role | Free Tier |
|---|---|---|
| **GitHub** | Code hosting & version control | Unlimited public repos |
| **Vercel** | Frontend hosting (static site) | 100GB bandwidth/mo |
| **Render** | Backend API hosting (Node.js) | 750 hrs/mo free |
| **Supabase** | Database (PostgreSQL) *or* Auth | 500MB DB, 50K MAU |

---

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  GitHub (source of truth)                           │
│  └── mutta-bonda-shop/                              │
│      ├── frontend/  → deployed to Vercel            │
│      └── backend/   → deployed to Render            │
└─────────────────────────────────────────────────────┘
        │                        │
        ▼                        ▼
   Vercel (static site)    Render (Node.js API)
        │                        │
        └──────────┬─────────────┘
                   ▼
        Database (choose ONE):
        ├── MongoDB Atlas (free M0) ← current setup
        └── Supabase Postgres (free) ← optional migration
```

---

## 🟢 STEP 1 — Push Code to GitHub

### 1.1 Create a GitHub account
If you don't have one, sign up at [github.com](https://github.com).

### 1.2 Create a new repository
1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `mutta-bonda-shop`
3. **Visibility:** Public (free) or Private (also free)
4. **Don't** initialize with README (you already have one)
5. Click **Create repository**

### 1.3 Push your local code
```bash
# From your project folder
git init
git add .
git commit -m "Initial commit — Mutta Bonda Shop"

# Add your GitHub repo as remote
git remote add origin https://github.com/<YOUR_USERNAME>/mutta-bonda-shop.git
git branch -M main
git push -u origin main
```

### 1.4 Verify `.gitignore` is correct
Make sure `backend/.gitignore` contains:
```
node_modules/
.env
```

> ⚠️ **NEVER commit your `.env` file** — it contains secrets!

---

## 🟢 STEP 2 — Deploy Backend to Render (Free)

Render hosts your Node.js API at a public URL like `https://mutta-bonda-shop-api.onrender.com`.

### 2.1 Create a Render account
1. Go to [render.com](https://render.com)
2. Sign up with **GitHub** (easiest — connects your repos automatically)

### 2.2 Create a Web Service
1. Click **New → Web Service**
2. **Connect repository:** select `mutta-bonda-shop`
3. **Root Directory:** `backend`
4. **Environment:** Node
5. **Build Command:** `npm install`
6. **Start Command:** `npm start`

### 2.3 Set environment variables
In the **Environment** tab, add:

| Key | Value |
|---|---|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string (e.g. `xK9#mP2$vL8@qR5!`) |
| `JWT_EXPIRES_IN` | `7d` |
| `ADMIN_EMAIL` | Your admin email |
| `ADMIN_PASSWORD` | A strong admin password |
| `CLIENT_ORIGIN` | Your Vercel URL (add after Step 3) |

### 2.4 Choose instance type
- Select **Free** instance (spins down after 15 min idle — fine for demo)
- Click **Create Web Service**

### 2.5 Seed the database
After deployment, run the seed script once:
1. In Render, go to your service → **Shell** tab
2. Run: `npm run seed`
3. This creates your admin account and initial menu items

### 2.6 Test your API
Open `https://mutta-bonda-shop-api.onrender.com/api/health`
→ Should return `{"status":"ok"}`

---

## 🟢 STEP 3 — Deploy Frontend to Vercel (Free)

Vercel hosts your static HTML/CSS/JS site with a free CDN and custom domain support.

### 3.1 Create a Vercel account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with **GitHub** (connects your repos automatically)

### 3.2 Import your repository
1. Click **Add New → Project**
2. Select the `mutta-bonda-shop` repo
3. Vercel will auto-detect it's a static site

### 3.3 Configure the project
- **Framework Preset:** Other
- **Root Directory:** `frontend`
- **Build Command:** *(leave empty — static site)*
- **Output Directory:** *(leave empty)*

### 3.4 Deploy
Click **Deploy**. Vercel gives you a URL like:
`https://mutta-bonda-shop.vercel.app`

### 3.5 Point frontend to your backend
In `frontend/index.html` and `frontend/admin.html`, add this line **before** the `<script src="js/main.js">` tag:

```html
<script>window.API_BASE = "https://mutta-bonda-shop-api.onrender.com/api";</script>
```

Then push to GitHub — Vercel auto-redeploys on every push.

---

## 🟢 STEP 4 — Connect Frontend ↔ Backend (CORS)

### 4.1 Update `CLIENT_ORIGIN` on Render
Go to Render → your service → **Environment** tab → edit `CLIENT_ORIGIN`:

```
https://mutta-bonda-shop.vercel.app
```

### 4.2 Test the connection
1. Open your Vercel site
2. Add an item to cart → checkout
3. Check Render logs — you should see POST requests to `/api/orders`

---

## 🟢 STEP 5 — Optional: Use Supabase as Database

Your current backend uses **MongoDB Atlas** (free M0 tier). If you prefer **Supabase** (PostgreSQL), here's how:

### 5.1 Create a Supabase project
1. Go to [supabase.com](https://supabase.com)
2. Sign up → **New Project**
3. Choose a name (e.g. `mutta-bonda-shop`) and a strong DB password
4. Choose region closest to you (e.g. `ap-south-1` Mumbai)
5. Click **Create project**

### 5.2 Get your connection string
1. In Supabase dashboard → **Project Settings → Database**
2. Copy the **Connection string** (URI format)
3. It looks like:
   ```
   postgresql://postgres.<project-ref>:<password>@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   ```

### 5.3 Create tables
In Supabase → **SQL Editor**, run:

```sql
-- Menu items
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  img TEXT,
  tag TEXT,
  is_todays_special BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  payment_method TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC,
  delivery NUMERIC,
  discount NUMERIC,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  visit_date DATE,
  favourite_item TEXT,
  food_quality TEXT,
  ratings JSONB,
  visit_again TEXT,
  recommend TEXT,
  suggestions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contact messages
CREATE TABLE contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin users (for auth)
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.4 Install Supabase client in backend
```bash
cd backend
npm install @supabase/supabase-js
```

### 5.5 Add Supabase env vars to Render
| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | Your anon/public key (Project Settings → API) |
| `SUPABASE_SERVICE_KEY` | Your service role key (keep secret!) |

### 5.6 Update backend code to use Supabase
Replace MongoDB calls in `backend/routes/*.js` with Supabase queries. Example for orders:

```js
// backend/routes/orderRoutes.js (Supabase version)
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.post("/", async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .insert([req.body])
    .select();

  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data[0]);
});

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});
```

> 💡 **Tip:** You can keep MongoDB Atlas instead — it's already free and working. Supabase is only if you prefer PostgreSQL or want Supabase Auth for admin login.

---

## 🟢 STEP 6 — Custom Domain (Optional, Free)

### On Vercel
1. Go to your project → **Settings → Domains**
2. Add your domain (e.g. `mutta-bonda-shop.com`)
3. At your DNS provider, add a CNAME record:
   - **Name:** `www`
   - **Value:** `cname.vercel-dns.com`
4. Vercel auto-verifies and issues a free SSL certificate

### On Render
1. Go to your service → **Settings → Custom Domain**
2. Add your domain
3. Add a CNAME record pointing to your Render URL

---

## 🟢 STEP 7 — Keep Everything in Sync

### Auto-deploy on push
- **Vercel:** auto-redeploys on every push to `main`
- **Render:** auto-redeploys on every push to `main`

### Update flow
```bash
# Make changes
git add .
git commit -m "Update menu prices"
git push origin main

# Vercel & Render auto-deploy 🎉
```

---

## 🧪 Quick Test Checklist

- [ ] `https://mutta-bonda-shop-api.onrender.com/api/health` → `{"status":"ok"}`
- [ ] Vercel site loads at `https://mutta-bonda-shop.vercel.app`
- [ ] Menu items display on the site
- [ ] Add to cart → checkout opens WhatsApp
- [ ] Order appears in `admin.html` (after login)
- [ ] Feedback form submits successfully
- [ ] Contact form submits successfully

---

## 🆑 Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| Frontend loads but no data syncs | `window.API_BASE` wrong or CORS | Update `window.API_BASE` in HTML; check `CLIENT_ORIGIN` on Render |
| API returns 404 | Wrong route or backend not deployed | Check Render logs; test `/api/health` |
| Admin login fails | DB not seeded | Run `npm run seed` in Render Shell |
| Render free instance slow | Spins down after 15 min idle | First request takes ~30s to wake up — normal |
| Vercel shows blank page | Wrong root directory | Set Root Directory to `frontend` |
| CORS error in browser | `CLIENT_ORIGIN` mismatch | Must exactly match your Vercel URL (no trailing slash) |

---

## 📊 Cost Summary

| Service | Free Tier | What You Get |
|---|---|---|
| GitHub | $0 forever | Unlimited public repos |
| Vercel | $0 forever | 100GB bandwidth, SSL, CDN |
| Render | $0 forever | 750 hrs/mo (1 instance) |
| MongoDB Atlas | $0 forever | 512MB storage, M0 cluster |
| Supabase | $0 forever | 500MB DB, 50K MAU |

**Total cost: $0/month** 🎉

---

## 🎯 Next Steps After Deployment

1. **Replace placeholder images** — swap `picsum.photos` URLs with real shop photos
2. **Add real menu items** — use `admin.html` to manage
3. **Set up WhatsApp Business** — for order notifications
4. **Add Google Analytics** — track visitors
5. **Share your link!** — `https://mutta-bonda-shop.vercel.app`