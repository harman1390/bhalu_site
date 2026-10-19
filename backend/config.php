<?php
/**
 * Barelyn store backend config.
 * Single source for DB creds, currency, JWT secret, Fastrr token.
 * Secrets come from BARELYN_* env vars; the literal values below are local dev only.
 */
return array(
	'db' => array(
		'host'    => getenv( 'BARELYN_DB_HOST' ) ?: '127.0.0.1',
		'name'    => getenv( 'BARELYN_DB_NAME' ) ?: 'barelyn_shop',
		'user'    => getenv( 'BARELYN_DB_USER' ) ?: 'root',
		'pass'    => getenv( 'BARELYN_DB_PASS' ) ?: '',
		'charset' => 'utf8mb4',
	),

	// Source WordPress DB — used ONLY by migrate.php for the one-time import.
	'wp_db'      => 'barelyn_local',
	'wp_prefix'  => 'wp_',
	'wp_uploads' => 'd:/Coding/Bhalu/barelyn.co.in/public_html/wp-content/uploads',

	'currency'        => 'INR',
	'currency_symbol' => '₹',

	// Secret for signing customer tokens — set BARELYN_JWT_SECRET in production.
	'jwt_secret' => getenv( 'BARELYN_JWT_SECRET' ) ?: 'barelyn_local_dev_secret_do_not_ship',

	// Fastrr (Shiprocket/Pickrr) hosted checkout — storefront integration id
	// recovered from the old Woo plugin (fastrr_checkout_option_name.integration_id).
	'fastrr' => array(
		'token'       => getenv( 'BARELYN_FASTRR_TOKEN' ) ?: '3208e6de-c655-4815-8d74-366296c334ec',
		'init_url'    => 'https://pickout.pickrr.com/users/checkout/init/',
		'iframe_base' => 'https://checkout-pickrr.netlify.app/?checkoutId=',
		'domain'      => 'barelyn.co.in',
	),

	// Transactional email. If smtp.host is empty, mail() is tried, then
	// messages are appended to `log` — so dev never loses emails.
	'mail' => array(
		'from'      => 'orders@barelyn.co.in',
		'from_name' => 'BARELYN',
		'admin'     => 'admin@barelyn.co.in', // new-order notifications
		'smtp'      => array(
			'host'   => getenv( 'BARELYN_SMTP_HOST' ) ?: '',   // e.g. smtp.gmail.com / smtp.hostinger.com
			'port'   => (int) ( getenv( 'BARELYN_SMTP_PORT' ) ?: 587 ),
			'user'   => getenv( 'BARELYN_SMTP_USER' ) ?: '',
			'pass'   => getenv( 'BARELYN_SMTP_PASS' ) ?: '',
			'secure' => 'tls', // 'tls' | 'ssl' | ''
		),
		// Outside the backend docroot so the log (customer PII) is never web-served.
		'log' => dirname( __DIR__ ) . '/mail.log',
	),

	// Minimal admin panel at /barelyn-api/admin/ — set BARELYN_ADMIN_* in production!
	'admin' => array(
		'username' => getenv( 'BARELYN_ADMIN_USER' ) ?: 'admin',
		'password' => getenv( 'BARELYN_ADMIN_PASS' ) ?: 'barelyn@123',
	),
);
