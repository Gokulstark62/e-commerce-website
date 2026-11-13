# SS Stylo Fashion

A responsive fashion store with category browsing, product details, a shopping bag, customer accounts, Stripe checkout, and a separate admin dashboard for managing products and orders.

## Stack

- React storefront and admin dashboard
- Express and Node.js API
- MongoDB/Mongoose for customer accounts, saved carts, products, and orders
- Cloudinary for production product-image storage
- Stripe Checkout for online payments

## Run locally

Install Node.js, then install dependencies in each app:

```powershell
cd backend
npm install
cd ..\frontend
npm install
cd ..\admin
npm install
```

Create `backend/.env` with:

```env
PORT=4000
SECRET_KEY=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-unique-password
FRONTEND_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002
BACKEND_URL=http://localhost:4000
SHIPPING_FEE_INR=0
```

For customer accounts, saved carts, order history, and checkout, also configure:

```env
MONGODB_URI=your-mongodb-connection-string
STRIPE_SECRET_KEY=your-stripe-test-secret-key
```

Product management works with local files for development. On a fresh local file-based catalog, the included starter products are copied in automatically. Runtime uploads and catalog data are ignored by Git.

Create `frontend/.env`:

```env
PORT=3001
REACT_APP_API_URL=http://localhost:4000
```

Create `admin/.env`:

```env
PORT=3002
REACT_APP_API_URL=http://localhost:4000
```

Run each app in its own terminal:

```powershell
# backend
cd backend
npm run dev
```

```powershell
# customer storefront
cd frontend
npm start
```

```powershell
# admin dashboard
cd admin
npm start
```

Open the storefront at [http://localhost:3001](http://localhost:3001) and the admin dashboard at [http://localhost:3002](http://localhost:3002). Sign in to the dashboard with `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then use **Add Product** and **Product List** to manage the catalog.

## Deploy for a client (Vercel + Render)

The repository includes Vercel SPA/security configuration in `frontend/vercel.json` and `admin/vercel.json`, and an API service blueprint in `render.yaml`.

1. Push this repository to a private GitHub repository owned by the client.
2. Create a MongoDB Atlas cluster and database user. Restrict network access to the API host where possible.
3. Create a Cloudinary account for permanent product image storage.
4. In Render, create a Blueprint from the repository and deploy `ss-stylo-api`. Add the production values for `MONGODB_URI`, `FRONTEND_URL`, `ADMIN_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STRIPE_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Render generates `SECRET_KEY`; it must be at least 32 characters, and the admin password must be at least 16 characters. Set `SHIPPING_FEE_INR` to the flat shipping fee in rupees (default `0`). Add any additional Vercel/custom-domain origins to `CORS_ORIGINS` as a comma-separated list of exact HTTPS origins.
5. In Vercel, create two projects from the same repository:
   - Storefront: set the project root to `frontend`.
   - Admin dashboard: set the project root to `admin`.

   For both projects, set `REACT_APP_API_URL` to the deployed Render API URL (for example `https://ss-stylo-api.onrender.com`) for the Production environment, then deploy. Add custom domains in Vercel if desired.
6. Update Render's `FRONTEND_URL` and `ADMIN_URL` to the final HTTPS Vercel/custom-domain URLs and redeploy. Confirm the API `/health` endpoint reports `{"status":"ok","database":"connected"}`.
7. In Stripe, use a live secret key only after business verification and test-mode checkout have passed. Add a webhook endpoint at `https://<render-api-host>/api/orders/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`; set the resulting signing secret as `STRIPE_WEBHOOK_SECRET` in Render.
8. In the admin dashboard, sign in with the private `ADMIN_EMAIL`/`ADMIN_PASSWORD` environment values and add the client's actual catalog and product photography. Test an end-to-end order with Stripe test mode before switching to live payments.

Vercel builds `REACT_APP_API_URL` into each static app, so set it before building and redeploy both projects after changing the API domain. Never put Stripe secret keys, MongoDB credentials, or the admin password in Vercel frontend variables or source control. The admin app is not indexed by search engines; it is protected by API-side admin authentication.

Production checkout prices products from the database, and payment completion is verified with Stripe rather than trusted from a browser redirect. Production image uploads require Cloudinary because Render's local filesystem is not persistent. Shipping is configured once with `SHIPPING_FEE_INR` on the API and displayed consistently in the store and checkout. Configure live Stripe, database backups, custom domains, and business-specific returns/privacy/tax settings before accepting client orders.
