# Barelyn Store Backend (PHP + MySQL)

Replaces the WordPress/WooCommerce backend for the Next.js storefront.
Response shapes intentionally mirror the WC Store API + the custom
`barelyn/v1` endpoints so the frontend needs no changes.

## Layout

| File | Purpose |
|---|---|
| `config.php` | DB creds, currency, JWT secret, Fastrr token, WP source DB (migration only). Secrets read `BARELYN_*` env vars — literal values are local dev only |
| `db.php` | PDO factory (`db()` shop DB, `db('')` server-level) |
| `helpers.php` | JSON/error responses (WC-style `{code,message,data:{status}}`), serializers matching `src/lib/types.ts`, cart session cookie (`bl_cart`), mini HS256 JWT, per-IP `rate_limit()` |
| `index.php` | Router — all traffic lands here via `.htaccess` (`?p=`). No CORS: browsers only ever talk to the Next.js same-origin proxies |
| `routes/products.php` | `GET /products` — `search`, `category`, `slug`, `on_sale`, `orderby`, `per_page`, `page`, `_fields` |
| `routes/categories.php` | `GET /products/categories` |
| `routes/cart.php` | `GET /cart`, `POST /cart/add-item`, `update-item`, `remove-item` |
| `routes/checkout.php` | `POST /checkout` — creates order, clears cart (rate-limited, email validated) |
| `routes/auth.php` | `POST /auth/token` (jwt-auth compatible) + `POST /auth/register` — both rate-limited |
| `routes/fastrr.php` | `init` / `confirm` / `status` — every order action is bound to the `bl_cart` session that created it |
| `migrate.php` | One-shot WP → `barelyn_shop` importer — **CLI only** (also denied in `.htaccess`) |

## Setup (local XAMPP)

The folder is junctioned into Apache:

```
mklink /J C:\xampp\htdocs\barelyn-api D:\Coding\Bhalu\storefront\backend
mklink /J D:\Coding\Bhalu\storefront\public\wp-uploads D:\Coding\Bhalu\barelyn.co.in\public_html\wp-content\uploads
```

- API base: `http://localhost/barelyn-api`
- Run migration once: `php backend/migrate.php` (CLI only — web access is denied) — creates `barelyn_shop`, imports products/categories/images from `barelyn_local`
- Product media is served from `public/wp-uploads` (junction) — WP no longer needed for images
- Frontend points here via `STORE_API` in `.env.local`

## Prices

All money is stored and returned in **paise** (minor units, INR, minor unit 2) — same convention as the WC Store API.

## Admin panel

- URL: `http://localhost/barelyn-api/admin/` — credentials from `BARELYN_ADMIN_USER` / `BARELYN_ADMIN_PASS` env vars (`admin` key in `config.php` holds dev fallbacks; **set env vars in production**). Login is CSRF-protected and progressively throttled
- Products: add/edit/delete, price + sale price (₹), stock toggle, categories, image upload (saved to `storefront/public/uploads`, served by Next at `/uploads/…`)
- Orders: read-only view (customer, items, payment id, status) — status moves on its own via checkout/payment

## Email

- Configure `mail.smtp` via `BARELYN_SMTP_*` env vars (any SMTP: Gmail, Hostinger, SES…)
- Without SMTP it tries `mail()`, then appends to `storefront/mail.log` (outside the backend docroot — never web-served)

## Notes

- Nonces: the frontend's nonce handshake is satisfied by a static `nonce` header; the backend doesn't enforce CSRF on cart writes (same model as WC Store API sessions — cart cookie is `SameSite=Lax`, `HttpOnly`, `Secure`-on-HTTPS).
- Cart sessions are anonymous, keyed by the `bl_cart` cookie (30 days).
- Orders live in `orders`/`order_items`; payment is Fastrr hosted checkout: `/checkout` → `/fastrr/init` → hosted modal → `/fastrr/confirm`. Order actions are bound to the creating cart session (`cart_token`). **Residual risk:** the legacy Pickrr API has no server-side payment-status endpoint, so `confirm` is client-triggered — a shopper can mark *their own* order paid without paying. Reconcile `paid` orders against the Fastrr dashboard before shipping, or move to the Fastrr headless API with webhooks.
- Rate limiting: per-IP sliding window (files in `sys_temp/barelyn_rl`) on login, register, checkout, fastrr.
- Set `BARELYN_JWT_SECRET`, `BARELYN_DB_*`, `BARELYN_ADMIN_*`, `BARELYN_FASTRR_TOKEN`, `BARELYN_SMTP_*` env vars in production.
