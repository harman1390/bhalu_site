<?php
/**
 * Barelyn store backend config.
 * Single source for DB creds, currency, JWT secret, Razorpay keys.
 */
return array(
	'db' => array(
		'host'    => '127.0.0.1',
		'name'    => 'barelyn_shop',
		'user'    => 'root',
		'pass'    => '',
		'charset' => 'utf8mb4',
	),

	// Source WordPress DB — used ONLY by migrate.php for the one-time import.
	'wp_db'      => 'barelyn_local',
	'wp_prefix'  => 'wp_',
	'wp_uploads' => 'd:/Coding/Bhalu/barelyn.co.in/public_html/wp-content/uploads',

	'currency'        => 'INR',
	'currency_symbol' => '₹',

	// Secret for signing customer tokens — change in production.
	'jwt_secret' => 'CHANGE_ME_barelyn_local_dev_secret',

	// Razorpay (ported from woocommerce_razorpay_settings — test keys).
	'rzp' => array(
		'key_id'     => 'rzp_test_TSIwRkH00Rxq8W',
		'key_secret' => 'jH0jv4h07sK73kMNdy58ieqT',
	),

	// Transactional email. If smtp.host is empty, mail() is tried, then
	// messages are appended to `log` — so dev never loses emails.
	'mail' => array(
		'from'      => 'orders@barelyn.co.in',
		'from_name' => 'BARELYN',
		'admin'     => 'admin@barelyn.co.in', // new-order notifications
		'smtp'      => array(
			'host'   => '',   // e.g. smtp.gmail.com / smtp.hostinger.com
			'port'   => 587,
			'user'   => '',
			'pass'   => '',
			'secure' => 'tls', // 'tls' | 'ssl' | ''
		),
		'log' => __DIR__ . '/mail.log',
	),

	// Minimal admin panel at /barelyn-api/admin/ — change these!
	'admin' => array(
		'username' => 'admin',
		'password' => 'barelyn@123',
	),
);
