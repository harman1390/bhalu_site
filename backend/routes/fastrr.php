<?php
/**
 * /fastrr/init, /fastrr/confirm, /fastrr/status — Fastrr (Shiprocket/Pickrr) hosted checkout.
 *
 * Flow: POST /checkout creates a pending order -> /fastrr/init creates a Fastrr
 * checkout session -> frontend opens the hosted iframe -> on success the iframe
 * posts a message and the frontend calls /fastrr/confirm.
 *
 * NOTE: the legacy Pickrr API has no public status endpoint — /fastrr/confirm is
 * client-triggered. For production hardening use the Fastrr headless API
 * (api key + secret) with server-side order webhooks.
 */

require_once __DIR__ . '/../mailer.php';

rate_limit( 'fastrr', 40, 300 ); // 40 calls / 5 min per IP

$action = trim( substr( $path, strlen( 'fastrr/' ) ), '/' );
$in     = body();

/** Order mutations/polls are only allowed for the cart session that created them. */
function order_owned( array $order ): bool {
	return ! empty( $order['cart_token'] )
		&& hash_equals( (string) $order['cart_token'], cart_token() );
}

/* ---- create Fastrr checkout session ----
   With order_id: session for that order (checkout page flow).
   Without it: find-or-create a pending order from the bl_cart cookie
   (direct "Buy Now" from the cart drawer — Fastrr collects address+payment). */
if ( $method === 'POST' && $action === 'init' ) {
	$oid = (int) ( $in['order_id'] ?? 0 );

	if ( ! $oid ) {
		$cid_cart = cart_id( $pdo );
		$token    = cart_token();
		$count    = $pdo->prepare( 'SELECT COUNT(*) FROM cart_items WHERE cart_id = ?' );
		$count->execute( array( $cid_cart ) );
		if ( ! (int) $count->fetchColumn() ) fail( 'empty_cart', 'Your cart is empty.', 400 );

		$st = $pdo->prepare( "SELECT id FROM orders WHERE cart_token = ? AND status = 'pending' ORDER BY id DESC LIMIT 1" );
		$st->execute( array( $token ) );
		$oid = (int) ( $st->fetchColumn() ?: 0 );
		if ( ! $oid ) {
			$pdo->prepare( "INSERT INTO orders (status,total,currency,payment_method,cart_token) VALUES ('pending',0,'INR','fastrr',?)" )
				->execute( array( $token ) );
			$oid = (int) $pdo->lastInsertId();
		}
		// Sync order items + total from the live cart.
		$pdo->prepare( 'DELETE FROM order_items WHERE order_id = ?' )->execute( array( $oid ) );
		$pdo->prepare(
			'INSERT INTO order_items (order_id, product_id, quantity, price)
			 SELECT ?, ci.product_id, ci.quantity, p.price
			 FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?'
		)->execute( array( $oid, $cid_cart ) );
		$pdo->prepare( 'UPDATE orders SET total = COALESCE((SELECT SUM(quantity*price) FROM order_items WHERE order_id = ?),0) WHERE id = ?' )
			->execute( array( $oid, $oid ) );
	}

	$st  = $pdo->prepare( 'SELECT * FROM orders WHERE id = ?' );
	$st->execute( array( $oid ) );
	$order = $st->fetch();
	if ( ! $order ) fail( 'no_order', 'Order not found', 404 );
	if ( ! order_owned( $order ) ) fail( 'forbidden', 'Order does not belong to this session.', 403 );
	if ( $order['status'] === 'paid' ) fail( 'already_paid', 'Order is already paid.', 400 );

	// Direct mode: the storefront drives the current Fastrr UI itself
	// (fastrr-boost-ui widget URL built client-side) — just record the order.
	if ( ! empty( $in['direct'] ) ) {
		$pdo->prepare( "UPDATE orders SET payment_method = 'fastrr' WHERE id = ?" )->execute( array( $oid ) );
		json_out( array( 'order_id' => $oid, 'direct' => true ) );
	}

	$f = cfg()['fastrr'];
	if ( empty( $f['token'] ) ) fail( 'no_keys', 'Fastrr token not configured', 500 );

	$its = $pdo->prepare(
		'SELECT oi.quantity, oi.price, p.id, p.name, p.slug, p.sku, p.images, p.regular_price
		 FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?'
	);
	$its->execute( array( $oid ) );

	$fallback_img = 'https://barelyn.co.in/wp-content/uploads/2026/03/image-32-1.png';
	$items        = array();
	$item_count   = 0;
	$total        = 0;

	foreach ( $its->fetchAll() as $it ) {
		$qty         = (int) $it['quantity'];
		$item_count += $qty;
		$total      += $qty * (int) $it['price'];
		$imgs        = json_decode( $it['images'] ?? '[]', true ) ?: array();
		$img         = $imgs[0]['src'] ?? '';
		if ( $img === '' ) $img = $fallback_img;
		if ( str_starts_with( $img, '/' ) ) $img = 'https://barelyn.co.in' . $img;

		// Fastrr expects all amounts in paise (minor units) — same as our storage.
		$items[] = array(
			'id'                 => (int) $it['id'],
			'product_id'         => (int) $it['id'],
			'variant_id'         => (int) $it['id'],
			'quantity'           => $qty,
			'title'              => $it['name'],
			'price'              => (int) $it['price'],
			'original_price'     => (int) $it['regular_price'],
			'sku'                => (string) $it['sku'],
			'url'                => 'https://barelyn.co.in/product/' . $it['slug'],
			'image'              => $img,
			'featured_image'     => array( 'url' => $img ),
			'requires_shipping'  => true,
		);
	}
	if ( ! $items ) fail( 'empty_order', 'Order has no items.', 400 );

	$payload = array(
		'order_details' => array(
			'token'                 => $f['token'],
			'note'                  => 'barelyn-order-' . $oid,
			'attributes'            => new stdClass(),
			'original_total_price'  => $total,
			'total_price'           => $total,
			'total_discount'        => 0,
			'total_weight'          => 0,
			'item_count'            => $item_count,
			'taxes_included'        => false,
			'items'                 => $items,
			'requires_shipping'     => true,
			'currency'              => 'INR',
			'items_subtotal_price'  => $total,
		),
		'domain' => $f['domain'],
	);

	$ch = curl_init( $f['init_url'] );
	curl_setopt_array( $ch, array(
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_POST           => true,
		CURLOPT_HTTPHEADER     => array( 'Content-Type: application/json' ),
		CURLOPT_POSTFIELDS     => json_encode( $payload ),
		CURLOPT_TIMEOUT        => 25,
	) );
	$res = curl_exec( $ch );
	$err = curl_error( $ch );
	curl_close( $ch );
	if ( $res === false ) {
		error_log( 'Fastrr init curl error: ' . $err );
		fail( 'fastrr_fail', 'Fastrr unreachable', 502 );
	}

	$r = json_decode( $res, true );
	if ( empty( $r['success'] ) || empty( $r['data']['checkout_id'] ) ) {
		fail( 'fastrr_fail', 'Fastrr checkout init failed' . ( isset( $r['message'] ) ? ': ' . $r['message'] : '' ), 502 );
	}

	$cid = $r['data']['checkout_id'];
	$pdo->prepare( "UPDATE orders SET fastrr_checkout_id = ?, payment_method = 'fastrr' WHERE id = ?" )
		->execute( array( $cid, $oid ) );

	json_out( array(
		'order_id'    => $oid,
		'checkout_id' => $cid,
		'iframe_url'  => $f['iframe_base'] . $cid,
	) );
}

/* ---- mark order paid after hosted checkout succeeds ---- */
if ( $method === 'POST' && $action === 'confirm' ) {
	$oid = (int) ( $in['order_id'] ?? 0 );
	if ( ! $oid ) {
		// Resolve the latest pending Fastrr order for this cart (direct flow / return redirect).
		$st = $pdo->prepare( "SELECT id FROM orders WHERE cart_token = ? AND status = 'pending' AND payment_method = 'fastrr' ORDER BY id DESC LIMIT 1" );
		$st->execute( array( cart_token() ) );
		$oid = (int) ( $st->fetchColumn() ?: 0 );
	}
	$st  = $pdo->prepare( 'SELECT * FROM orders WHERE id = ?' );
	$st->execute( array( $oid ) );
	$order = $st->fetch();
	if ( ! $order ) fail( 'no_order', 'Order not found', 404 );
	if ( ! order_owned( $order ) ) fail( 'forbidden', 'Order does not belong to this session.', 403 );
	if ( $order['payment_method'] !== 'fastrr' && empty( $order['fastrr_checkout_id'] ) )
		fail( 'no_session', 'No Fastrr session for this order.', 400 );
	if ( $order['status'] === 'paid' ) json_out( array( 'status' => 'paid', 'order_id' => $oid ) );

	$pdo->prepare( "UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ?" )
		->execute( array( $oid ) );

	// Clear the cart this order was built from (cart-driven sessions).
	if ( ! empty( $order['cart_token'] ) ) {
		$pdo->prepare( 'DELETE ci FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE c.token = ?' )
			->execute( array( $order['cart_token'] ) );
	}
	mail_order_paid( $pdo, $oid );

	json_out( array( 'status' => 'paid', 'order_id' => $oid ) );
}

/* ---- order status poll (used when the iframe is closed) ---- */
if ( $method === 'POST' && $action === 'status' ) {
	$oid = (int) ( $in['order_id'] ?? 0 );
	$st  = $pdo->prepare( 'SELECT status, cart_token FROM orders WHERE id = ?' );
	$st->execute( array( $oid ) );
	$order = $st->fetch();
	if ( ! $order ) fail( 'no_order', 'Order not found', 404 );
	if ( ! order_owned( $order ) ) fail( 'forbidden', 'Order does not belong to this session.', 403 );
	json_out( array( 'status' => $order['status'], 'order_id' => $oid ) );
}

fail( 'rest_no_route', 'No route was found matching the URL and request method', 404 );
