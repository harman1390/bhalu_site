<?php
/** /cart, /cart/add-item, /cart/update-item, /cart/remove-item */

$action = trim( substr( $path, strlen( 'cart' ) ), '/' );
$cid    = cart_id( $pdo );
$in     = body();

switch ( true ) {

	case $method === 'GET' && $action === '':
		json_out( cart_payload( $pdo, $cid ) );

	case $method === 'POST' && $action === 'add-item':
		$pid = (int) ( $in['id'] ?? 0 );
		$qty = max( 1, (int) ( $in['quantity'] ?? 1 ) );
		$st  = $pdo->prepare( 'SELECT id, is_in_stock FROM products WHERE id = ?' );
		$st->execute( array( $pid ) );
		$p = $st->fetch();
		if ( ! $p ) fail( 'woocommerce_rest_product_invalid_id', 'Invalid product ID.', 404 );
		if ( ! (int) $p['is_in_stock'] ) fail( 'woocommerce_rest_product_out_of_stock', 'You cannot add this product to the cart — out of stock.', 400 );

		$key = substr( md5( "$cid:$pid" ), 0, 32 );
		$pdo->prepare(
			'INSERT INTO cart_items (cart_id, item_key, product_id, quantity)
			 VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)'
		)->execute( array( $cid, $key, $pid, $qty ) );
		json_out( cart_payload( $pdo, $cid ) );

	case $method === 'POST' && $action === 'update-item':
		$key = (string) ( $in['key'] ?? '' );
		$qty = (int) ( $in['quantity'] ?? 1 );
		if ( $key === '' ) fail( 'woocommerce_rest_cart_item_key_missing', 'Cart item key is required.', 400 );
		if ( $qty <= 0 ) {
			$pdo->prepare( 'DELETE FROM cart_items WHERE cart_id = ? AND item_key = ?' )->execute( array( $cid, $key ) );
		} else {
			$pdo->prepare( 'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND item_key = ?' )
				->execute( array( $qty, $cid, $key ) );
		}
		json_out( cart_payload( $pdo, $cid ) );

	case $method === 'POST' && $action === 'remove-item':
		$key = (string) ( $in['key'] ?? $_GET['key'] ?? '' );
		if ( $key === '' ) fail( 'woocommerce_rest_cart_item_key_missing', 'Cart item key is required.', 400 );
		$pdo->prepare( 'DELETE FROM cart_items WHERE cart_id = ? AND item_key = ?' )->execute( array( $cid, $key ) );
		json_out( cart_payload( $pdo, $cid ) );

	default:
		fail( 'rest_no_route', 'No route was found matching the URL and request method', 404 );
}
