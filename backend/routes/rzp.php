<?php
/** /rzp/register, /rzp/razorpay-order, /rzp/razorpay-verify — ported from theme razorpay-api.php. */

require_once __DIR__ . '/../mailer.php';

$action = trim( substr( $path, strlen( 'rzp/' ) ), '/' );
$in     = body();

/* ---- register customer ---- */
if ( $method === 'POST' && $action === 'register' ) {
	$name  = trim( (string) ( $in['name'] ?? '' ) );
	$email = trim( (string) ( $in['email'] ?? '' ) );
	$phone = preg_replace( '/\D/', '', (string) ( $in['phone'] ?? '' ) );
	$pass  = (string) ( $in['password'] ?? '' );

	if ( ! $email || ! filter_var( $email, FILTER_VALIDATE_EMAIL ) ) {
		fail( 'bad_email', 'Please enter a valid email address.', 400 );
	}
	if ( strlen( $phone ) !== 10 ) fail( 'bad_phone', 'Please enter a valid 10-digit mobile number.', 400 );
	if ( strlen( $pass ) < 6 ) fail( 'bad_password', 'Password must be at least 6 characters.', 400 );

	$st = $pdo->prepare( 'SELECT id FROM users WHERE email = ?' );
	$st->execute( array( $email ) );
	if ( $st->fetch() ) fail( 'exists', 'An account already exists with this email.', 409 );

	$username = strstr( $email, '@', true );
	$pdo->prepare( 'INSERT INTO users (username, email, name, phone, password_hash) VALUES (?,?,?,?,?)' )
		->execute( array( $username, $email, $name, $phone, password_hash( $pass, PASSWORD_DEFAULT ) ) );
	mail_welcome( $email, $name );

	json_out( array( 'status' => 'created', 'user_id' => (int) $pdo->lastInsertId() ) );
}

/* ---- create razorpay order ---- */
if ( $method === 'POST' && $action === 'razorpay-order' ) {
	$oid = (int) ( $in['order_id'] ?? 0 );
	$st  = $pdo->prepare( 'SELECT * FROM orders WHERE id = ?' );
	$st->execute( array( $oid ) );
	$order = $st->fetch();
	if ( ! $order ) fail( 'no_order', 'Order not found', 404 );

	$keys = cfg()['rzp'];
	if ( ! $keys['key_id'] || ! $keys['key_secret'] ) fail( 'no_keys', 'Razorpay keys not configured', 500 );

	$ch = curl_init( 'https://api.razorpay.com/v1/orders' );
	curl_setopt_array( $ch, array(
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_POST           => true,
		CURLOPT_USERPWD        => $keys['key_id'] . ':' . $keys['key_secret'],
		CURLOPT_HTTPHEADER     => array( 'Content-Type: application/json' ),
		CURLOPT_POSTFIELDS     => json_encode( array(
			'amount'   => (int) $order['total'],
			'currency' => $order['currency'],
			'receipt'  => 'bl_' . $oid,
		) ),
		CURLOPT_TIMEOUT        => 20,
	) );
	$res = curl_exec( $ch );
	$err = curl_error( $ch );
	curl_close( $ch );
	if ( $res === false ) fail( 'rzp_fail', 'Razorpay unreachable: ' . $err, 502 );

	$rzp = json_decode( $res, true );
	if ( empty( $rzp['id'] ) ) fail( 'rzp_fail', 'Razorpay order creation failed', 502 );

	$pdo->prepare( 'UPDATE orders SET razorpay_order_id = ? WHERE id = ?' )->execute( array( $rzp['id'], $oid ) );

	json_out( array(
		'key_id'            => $keys['key_id'],
		'amount'            => (int) $order['total'],
		'currency'          => $order['currency'],
		'razorpay_order_id' => $rzp['id'],
	) );
}

/* ---- verify payment ---- */
if ( $method === 'POST' && $action === 'razorpay-verify' ) {
	$oid     = (int) ( $in['order_id'] ?? 0 );
	$rzpOrd  = (string) ( $in['razorpay_order_id'] ?? '' );
	$rzpPay  = (string) ( $in['razorpay_payment_id'] ?? '' );
	$rzpSig  = (string) ( $in['razorpay_signature'] ?? '' );

	$st = $pdo->prepare( 'SELECT * FROM orders WHERE id = ?' );
	$st->execute( array( $oid ) );
	if ( ! $st->fetch() ) fail( 'no_order', 'Order not found', 404 );

	$expected = hash_hmac( 'sha256', $rzpOrd . '|' . $rzpPay, cfg()['rzp']['key_secret'] );
	if ( ! hash_equals( $expected, $rzpSig ) ) {
		fail( 'bad_sig', 'Signature verification failed', 400 );
	}

	$pdo->prepare( "UPDATE orders SET status = 'paid', razorpay_payment_id = ?, paid_at = NOW() WHERE id = ?" )
		->execute( array( $rzpPay, $oid ) );
	mail_order_paid( $pdo, $oid );

	json_out( array( 'status' => 'paid', 'order_id' => $oid ) );
}

fail( 'rest_no_route', 'No route was found matching the URL and request method', 404 );
