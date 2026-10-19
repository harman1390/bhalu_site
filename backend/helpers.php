<?php
/** Shared response + serializer helpers. */

function cfg(): array {
	static $c = null;
	if ( $c === null ) $c = require __DIR__ . '/config.php';
	return $c;
}

function json_out( $data, int $status = 200 ): void {
	http_response_code( $status );
	header( 'Content-Type: application/json; charset=utf-8' );
	header( 'X-Content-Type-Options: nosniff' );
	header( 'nonce: php-store' ); // satisfies storefront nonce capture; unused by backend
	header( 'nonce-timestamp: ' . time() );
	echo json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	exit;
}

/** Mirror WP REST error shape: { code, message, data: { status } } — client reads data?.message */
function fail( string $code, string $message, int $status = 400 ): void {
	json_out( array( 'code' => $code, 'message' => $message, 'data' => array( 'status' => $status ) ), $status );
}

function body(): array {
	// php://input ignores post_max_size — cap reads to 64 KB.
	$raw = file_get_contents( 'php://input', false, null, 0, 65536 );
	$d   = json_decode( (string) $raw, true );
	return is_array( $d ) ? $d : array();
}

/** Apply ?_fields=a,b,c to an assoc array or list of assoc arrays. */
function apply_fields( $data, string $fields ) {
	$keep = array_flip( array_map( 'trim', explode( ',', $fields ) ) );
	$pick = function ( $row ) use ( $keep ) {
		return array_intersect_key( $row, $keep );
	};
	if ( isset( $data[0] ) && is_array( $data[0] ) ) return array_map( $pick, $data );
	return $pick( $data );
}

/* ---------- cart session ---------- */

function cart_token(): string {
	// Only accept tokens we issued (40-hex) — reject arbitrary cookie values.
	if ( ! empty( $_COOKIE['bl_cart'] )
		&& preg_match( '/^[a-f0-9]{40}$/', (string) $_COOKIE['bl_cart'] ) ) {
		return $_COOKIE['bl_cart'];
	}
	$t = bin2hex( random_bytes( 20 ) );
	setcookie( 'bl_cart', $t, array(
		'expires'  => time() + 60 * 60 * 24 * 30,
		'path'     => '/',
		'secure'   => ! empty( $_SERVER['HTTPS'] ) && $_SERVER['HTTPS'] !== 'off',
		'httponly' => true, // never read by JS — all calls go through the Next proxy
		'samesite' => 'Lax',
	) );
	$_COOKIE['bl_cart'] = $t;
	return $t;
}

function cart_id( PDO $pdo ): int {
	$token = cart_token();
	$st = $pdo->prepare( 'SELECT id FROM carts WHERE token = ?' );
	$st->execute( array( $token ) );
	$id = $st->fetchColumn();
	if ( $id ) return (int) $id;
	$pdo->prepare( 'INSERT INTO carts (token) VALUES (?)' )->execute( array( $token ) );
	return (int) $pdo->lastInsertId();
}

/* ---------- serializers (match src/lib/types.ts) ---------- */

function cur(): array {
	$c = cfg();
	return array(
		'currency_code'    => $c['currency'],
		'currency_symbol'  => $c['currency_symbol'],
		'currency_minor_unit' => 2,
	);
}

function image_json( ?string $src, string $alt = '', string $name = '' ): ?array {
	if ( ! $src ) return null;
	return array(
		'id'        => 0,
		'src'       => $src,
		'thumbnail' => $src,
		'srcset'    => '',
		'sizes'     => '',
		'name'      => $name,
		'alt'       => $alt,
	);
}

function product_prices( array $p ): array {
	$cur = cur();
	return array(
		'price'         => (string) (int) $p['price'],
		'regular_price' => (string) (int) $p['regular_price'],
		'sale_price'    => $p['sale_price'] !== null ? (string) (int) $p['sale_price'] : '',
		'price_range'   => null,
		'currency_code' => $cur['currency_code'],
		'currency_symbol' => $cur['currency_symbol'],
		'currency_minor_unit' => 2,
		'currency_decimal_separator'  => '.',
		'currency_thousand_separator' => ',',
		'currency_prefix' => $cur['currency_symbol'],
		'currency_suffix' => '',
		'raw_prices'    => array(
			'precision'     => 6,
			'price'         => (string) ( (int) $p['price'] * 10000 ),
			'regular_price' => (string) ( (int) $p['regular_price'] * 10000 ),
			'sale_price'    => $p['sale_price'] !== null ? (string) ( (int) $p['sale_price'] * 10000 ) : '',
		),
	);
}

function category_refs( array $p ): array {
	$ids = json_decode( $p['category_ids'] ?? '[]', true );
	$names = json_decode( $p['category_names'] ?? '[]', true );
	$slugs = json_decode( $p['category_slugs'] ?? '[]', true );
	$out = array();
	foreach ( $ids as $i => $cid ) {
		$slug = $slugs[ $i ] ?? '';
		$out[] = array(
			'id'   => (int) $cid,
			'name' => $names[ $i ] ?? '',
			'slug' => $slug,
			'link' => '/product-category/' . $slug,
		);
	}
	return $out;
}

function product_json( array $p ): array {
	$in_stock = (bool) $p['is_in_stock'];
	return array(
		'id'                => (int) $p['id'],
		'name'              => $p['name'],
		'slug'              => $p['slug'],
		'permalink'         => '/product/' . $p['slug'],
		'description'       => $p['description'],
		'short_description' => $p['short_description'],
		'sku'               => $p['sku'],
		'on_sale'           => $p['sale_price'] !== null && (int) $p['sale_price'] < (int) $p['regular_price'],
		'images'            => json_decode( $p['images'] ?? '[]', true ) ?: array(),
		'prices'            => product_prices( $p ),
		'categories'        => category_refs( $p ),
		'average_rating'    => (string) $p['average_rating'],
		'review_count'      => (int) $p['review_count'],
		'is_in_stock'       => $in_stock,
		'is_purchasable'    => $in_stock,
		'has_options'       => false,
		'type'              => 'simple',
		'add_to_cart'       => array(
			'text' => 'Add to cart', 'description' => '', 'url' => '', 'minimum' => 1, 'maximum' => 99,
		),
	);
}

function category_json( array $c ): array {
	return array(
		'id'           => (int) $c['id'],
		'name'         => $c['name'],
		'slug'         => $c['slug'],
		'description'  => $c['description'] ?? '',
		'image'        => image_json( $c['image'] ?? null, $c['name'], $c['name'] ),
		'count'        => (int) $c['count'],
		'parent'       => (int) ( $c['parent'] ?? 0 ),
		'review_count' => 0,
		'link'         => '/product-category/' . $c['slug'],
	);
}

/* ---------- cart payload ---------- */

function cart_payload( PDO $pdo, int $cart_id ): array {
	$rows = $pdo->prepare(
		'SELECT ci.item_key, ci.quantity, p.* FROM cart_items ci
		 JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?'
	);
	$rows->execute( array( $cart_id ) );
	$cur = cur();
	$items = array();
	$count = 0;
	$total = 0;
	foreach ( $rows->fetchAll() as $r ) {
		$qty  = (int) $r['quantity'];
		$line = $qty * (int) $r['price'];
		$count += $qty;
		$total += $line;
		$images = json_decode( $r['images'] ?? '[]', true ) ?: array();
		$items[] = array(
			'key'      => $r['item_key'],
			'id'       => (int) $r['id'],
			'name'     => $r['name'],
			'quantity' => $qty,
			'images'   => $images,
			'prices'   => array(
				'price'         => (string) (int) $r['price'],
				'regular_price' => (string) (int) $r['regular_price'],
				'sale_price'    => $r['sale_price'] !== null ? (string) (int) $r['sale_price'] : '',
				'currency_symbol' => $cur['currency_symbol'],
				'currency_code' => $cur['currency_code'],
			),
			'totals' => array(
				'line_subtotal'   => (string) $line,
				'line_total'      => (string) $line,
				'currency_symbol' => $cur['currency_symbol'],
			),
		);
	}
	return array(
		'items'          => $items,
		'items_count'    => $count,
		'items_weight'   => 0,
		'needs_shipping' => true,
		'needs_payment'  => $count > 0,
		'totals'         => array(
			'subtotal'        => (string) $total,
			'total_items'     => (string) $total,
			'total_price'     => (string) $total,
			'currency_symbol' => $cur['currency_symbol'],
			'currency_code'   => $cur['currency_code'],
		),
	);
}

/** Strip junk containers/attrs from imported HTML; keep simple content tags. */
function clean_html( string $html ): string {
	if ( trim( $html ) === '' ) return '';
	$html = preg_replace( '#<(script|style)[^>]*>.*?</\1>#is', '', $html );
	$html = strip_tags( $html, '<p><ul><ol><li><strong><b><em><i><br><h2><h3><h4>' );
	$html = preg_replace( '#<([a-z][a-z0-9]*)\s[^>]*>#i', '<$1>', $html );
	$html = str_replace( array( '<b>', '</b>', '<i>', '</i>' ), array( '<strong>', '</strong>', '<em>', '</em>' ), $html );
	$html = preg_replace( '/<p>\s*(<br\s*\/?>\s*)*<\/p>/i', '', $html );
	$html = preg_replace( '/(\r?\n){3,}/', "\n\n", $html );
	return trim( $html );
}

/* ---------- tiny JWT (HS256) ---------- */

function jwt_encode( array $payload, string $secret ): string {
	$b64 = fn( $s ) => rtrim( strtr( base64_encode( $s ), '+/', '-_' ), '=' );
	$head = $b64( json_encode( array( 'alg' => 'HS256', 'typ' => 'JWT' ) ) );
	$payload['iat'] = time();
	$payload['exp'] = time() + 60 * 60 * 24 * 30;
	$pay  = $b64( json_encode( $payload ) );
	$sig  = $b64( hash_hmac( 'sha256', "$head.$pay", $secret, true ) );
	return "$head.$pay.$sig";
}

/* ---------- tiny rate limiter ---------- */

/**
 * Per-IP sliding-window limiter (file store in sys temp — outside docroot).
 * rate_limit('login', 10, 300) = max 10 calls per IP per 5 minutes.
 */
function rate_limit( string $bucket, int $max, int $window ): void {
	$dir = sys_get_temp_dir() . '/barelyn_rl';
	if ( ! is_dir( $dir ) ) @mkdir( $dir, 0770, true );
	$f   = $dir . '/' . $bucket . '_' . md5( $_SERVER['REMOTE_ADDR'] ?? 'cli' );
	$now = time();
	$hits = array();
	if ( is_file( $f ) ) {
		foreach ( explode( ',', (string) file_get_contents( $f ) ) as $t ) {
			if ( (int) $t > $now - $window ) $hits[] = (int) $t;
		}
	}
	if ( count( $hits ) >= $max ) {
		fail( 'rate_limited', 'Too many attempts — please try again later.', 429 );
	}
	$hits[] = $now;
	@file_put_contents( $f, implode( ',', $hits ), LOCK_EX );
}
