<?php
/** POST /checkout { billing_address, shipping_address, payment_method } */

require_once __DIR__ . '/../mailer.php';

rate_limit( 'checkout', 20, 600 ); // 20 orders / 10 min per IP

$in  = body();
$cid = cart_id( $pdo );

$items = $pdo->prepare(
	'SELECT ci.product_id, ci.quantity, p.price FROM cart_items ci
	 JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?'
);
$items->execute( array( $cid ) );
$rows = $items->fetchAll();
if ( ! $rows ) fail( 'woocommerce_rest_cart_empty', 'Cannot place an order with an empty cart.', 400 );

// Bound scalar fields — these get stored and echoed into emails.
$clip = fn( $a ) => is_array( $a ) ? array_map( fn( $v ) => is_string( $v ) ? mb_substr( $v, 0, 500 ) : $v, $a ) : array();
$bill = $clip( $in['billing_address'] ?? array() );
$ship = $clip( $in['shipping_address'] ?? array() );
$email = trim( (string) ( $bill['email'] ?? '' ) );
if ( $email === '' || ! filter_var( $email, FILTER_VALIDATE_EMAIL )
	|| preg_match( '/[\r\n]/', $email ) || empty( $bill['first_name'] ) ) {
	fail( 'woocommerce_rest_checkout_missing_field', 'A valid billing name and email are required.', 400 );
}
$bill['email'] = $email;

$total = 0;
foreach ( $rows as $r ) $total += (int) $r['price'] * (int) $r['quantity'];

$pdo->beginTransaction();
try {
	$pdo->prepare(
		'INSERT INTO orders (status, total, currency, billing_json, shipping_json, payment_method, cart_token)
		 VALUES (?,?,?,?,?,?,?)'
	)->execute( array(
		'pending',
		$total,
		cfg()['currency'],
		json_encode( $bill, JSON_UNESCAPED_UNICODE ),
		json_encode( $ship, JSON_UNESCAPED_UNICODE ),
		(string) ( $in['payment_method'] ?? 'fastrr' ),
		cart_token(),
	) );
	$oid = (int) $pdo->lastInsertId();

	$li = $pdo->prepare( 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)' );
	foreach ( $rows as $r ) {
		$li->execute( array( $oid, $r['product_id'], $r['quantity'], $r['price'] ) );
	}
	// Increment sales counters for popularity ordering.
	$pdo->prepare( 'UPDATE products p JOIN order_items oi ON oi.product_id = p.id
					SET p.total_sales = p.total_sales + oi.quantity WHERE oi.order_id = ?' )
		->execute( array( $oid ) );

	$pdo->prepare( 'DELETE FROM cart_items WHERE cart_id = ?' )->execute( array( $cid ) );
	$pdo->commit();
	mail_order_received( $pdo, $oid ); // customer + admin notify; failures are swallowed
} catch ( Throwable $e ) {
	$pdo->rollBack();
	fail( 'woocommerce_rest_checkout_error', 'Could not create the order.', 500 );
}

json_out( array(
	'id'           => $oid,
	'order_id'     => $oid,
	'order_number' => (string) $oid,
	'order_key'    => 'bl_order_' . $oid,
	'status'       => 'pending',
	'payment_result' => array( 'payment_status' => 'pending', 'payment_details' => array(), 'redirect_url' => '' ),
) );
