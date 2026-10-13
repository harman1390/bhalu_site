<?php
/**
 * Barelyn headless store API — replaces the WooCommerce Store API.
 * All requests route through here via .htaccess: ?p=<path>
 *
 * GET  products                     list (search, category, slug, orderby, on_sale, _fields)
 * GET  products/categories          list
 * GET  cart                         session cart
 * POST cart/add-item                { id, quantity }
 * POST cart/update-item             { key, quantity }
 * POST cart/remove-item             { key } or ?key=
 * POST checkout                     { billing_address, shipping_address, payment_method }
 * POST auth/token                   { username, password } -> { token, user_* }
 * POST rzp/register                 { name, email, phone, password }
 * POST rzp/razorpay-order           { order_id }
 * POST rzp/razorpay-verify          { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

$path   = trim( (string) ( $_GET['p'] ?? '' ), '/' );
$method = $_SERVER['REQUEST_METHOD'];

if ( $method === 'OPTIONS' ) {
	header( 'Access-Control-Allow-Origin: *' );
	header( 'Access-Control-Allow-Headers: content-type, nonce' );
	header( 'Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS' );
	exit;
}

try {
	$pdo = db();
} catch ( Throwable $e ) {
	fail( 'db_error', 'Database unavailable', 500 );
}

switch ( true ) {
	case $method === 'GET' && $path === 'products':
		require __DIR__ . '/routes/products.php';
		break;
	case $method === 'GET' && $path === 'products/categories':
		require __DIR__ . '/routes/categories.php';
		break;
	case $path === 'cart' || str_starts_with( $path, 'cart/' ):
		require __DIR__ . '/routes/cart.php';
		break;
	case $method === 'POST' && $path === 'checkout':
		require __DIR__ . '/routes/checkout.php';
		break;
	case str_starts_with( $path, 'auth/' ):
		require __DIR__ . '/routes/auth.php';
		break;
	case str_starts_with( $path, 'rzp/' ):
		require __DIR__ . '/routes/rzp.php';
		break;
	default:
		fail( 'rest_no_route', 'No route was found matching the URL and request method', 404 );
}
