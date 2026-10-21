# LUXEWEAR

Luxury fashion storefront built with React, Vite, Express, and sql.js.

## Run locally

Requirements: Node.js 22.12 or newer.

```bash
npm install
npm run build
npm start
```

The server listens on the `PORT` environment variable (defaults to 3000).

## Deploy on Render

1. Push the contents of this project folder to the root of a GitHub repository.
2. In Render, create a **Web Service** and connect that repository.
3. Runtime: **Node**.
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Set these environment variables in Render:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = a long, unique random secret
   - `ADMIN_EMAIL` = the email you want to use for the admin account
   - `ADMIN_PASSWORD` = a unique password of at least 12 characters
   - `WHATSAPP_NUMBER` = your store's WhatsApp number in international digits, without `+` or spaces

Do not put real passwords or secrets in GitHub. The admin account is only created when both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set.

## Important storage warning

This app currently writes its database to `data/luxewear.sqlite` and product uploads to `public/uploads`. Render's ordinary free web-service filesystem is ephemeral. Database changes, uploaded product images, and order records can be lost on redeploy/restart. Do **not** use this deployment for real customer orders until the database and uploaded images are moved to persistent storage.

The local SQLite database was intentionally excluded from this cleaned source package. The app will create a new empty database and seed its starter catalog on first run.

## Security

Never commit `.env` files, credentials, database files, customer information, or `node_modules`.
