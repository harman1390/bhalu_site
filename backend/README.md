# Barelyn Store Backend (PHP + MySQL)

Replaces the WordPress/WooCommerce backend for the Next.js storefront.
Response shapes intentionally mirror the WC Store API + the custom
`barelyn/v1` endpoints so the frontend needs no changes.

## Layout

| File | Purpose |
|---|---|
| `config.php` | DB creds, currency, JWT secret, Razorpay keys, WP source DB (migration only) |
| `db.php` | PDO factory (`db()` shop DB, `db('')` server-level) |
| `helpers.php` | JSON/error responses (WC-style `{code,message,data:{status}}`), serializers matching `src/lib/types.ts`, cart session cookie (`bl_cart`), mini HS256 JWT |
| `index.php` | Router — all traffic lands here via `.htaccess` (`?p=`) |
| `routes/products.php` | `GET /products` — `search`, `category`, `slug`, `on_sale`, `orderby`, `per_page`, `page`, `_fields` |
| `routes/categories.php` | `GET /products/categories` |
| `routes/cart.php` | `GET /cart`, `POST /cart/add-item`, `update-item`, `remove-item` |
| `routes/checkout.php` | `POST /checkout` — creates order, clears cart |
| `routes/auth.php` | `POST /auth/token` — jwt-auth compatible `{token, user_*}` |
| `routes/rzp.php` | `register`, `razorpay-order`, `razorpay-verify` (ported from theme) |
| `migrate.php` | One-shot WP → `barelyn_shop` importer (schema + data) |

## Setup (local XAMPP)

The folder is junctioned into Apache:

```
mklink /J C:\xampp\htdocs\barelyn-api D:\Coding\Bhalu\storefront\backend
mklink /J D:\Coding\Bhalu\storefront\public\wp-uploads D:\Coding\Bhalu\barelyn.co.in\public_html\wp-content\uploads
```

- API base: `http://localhost/barelyn-api`
- Run migration once: `php backend/migrate.php` (or browse `…/migrate.php`) — creates `barelyn_shop`, imports products/categories/images from `barelyn_local`
- Product media is served from `public/wp-uploads` (junction) — WP no longer needed for images
- Frontend points here via `STORE_API` in `.env.local`

## Prices

All money is stored and returned in **paise** (minor units, INR, minor unit 2) — same convention as the WC Store API.

## Admin panel

- URL: `http://localhost/barelyn-api/admin/` — credentials in `config.php` (`admin` key; **change them**)
- Products: add/edit/delete, price + sale price (₹), stock toggle, categories, image upload (saved to `storefront/public/uploads`, served by Next at `/uploads/…`)
- Orders: read-only view (customer, items, payment id, status) — status moves on its own via checkout/payment

## Email

- Configure `mail.smtp` in `config.php` for real delivery (any SMTP: Gmail, Hostinger, SES…)
- Without SMTP it tries `mail()`, then appends to `backend/mail.log` — check that file in dev

## Notes

- Nonces: the frontend's nonce handshake is satisfied by a static `nonce` header; the backend doesn't enforce CSRF on cart writes (same model as WC Store API sessions).
- Cart sessions are anonymous, keyed by the `bl_cart` cookie (30 days).
- Orders live in `orders`/`order_items`; Razorpay flow: `/checkout` → `rzp/razorpay-order` → modal → `rzp/razorpay-verify` (HMAC-SHA256 signature check).
- Change `jwt_secret` and DB creds in `config.php` for production.
