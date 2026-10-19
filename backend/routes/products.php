<?php
/** GET /products — filters: search, category, slug, on_sale, min_price, max_price, stock_status, orderby, order, per_page, page, _fields */

$q = 'SELECT p.*, GROUP_CONCAT(pc.category_id) AS cat_ids
	  FROM products p
	  LEFT JOIN product_categories pc ON pc.product_id = p.id';

$where = array();
$args  = array();

if ( isset( $_GET['search'] ) && $_GET['search'] !== '' ) {
	$where[] = 'p.name LIKE ?';
	$args[]  = '%' . $_GET['search'] . '%';
}
if ( isset( $_GET['slug'] ) && $_GET['slug'] !== '' ) {
	$where[] = 'p.slug = ?';
	$args[]  = $_GET['slug'];
}
if ( isset( $_GET['category'] ) && $_GET['category'] !== '' ) {
	$where[] = 'pc.category_id = ?';
	$args[]  = (int) $_GET['category'];
}
if ( isset( $_GET['on_sale'] ) && in_array( $_GET['on_sale'], array( 'true', '1' ), true ) ) {
	$where[] = 'p.sale_price IS NOT NULL AND p.sale_price < p.regular_price';
}
// WC convention: min_price/max_price are in minor units (paise).
if ( isset( $_GET['min_price'] ) && ctype_digit( (string) $_GET['min_price'] ) ) {
	$where[] = 'p.price >= ?';
	$args[]  = (int) $_GET['min_price'];
}
if ( isset( $_GET['max_price'] ) && ctype_digit( (string) $_GET['max_price'] ) ) {
	$where[] = 'p.price <= ?';
	$args[]  = (int) $_GET['max_price'];
}
if ( isset( $_GET['stock_status'] ) && $_GET['stock_status'] === 'instock' ) {
	$where[] = 'p.is_in_stock = 1';
}

$sql = $q . ( $where ? ' WHERE ' . implode( ' AND ', $where ) : '' ) . ' GROUP BY p.id';

$orderby = $_GET['orderby'] ?? 'menu_order';
$order   = strtolower( $_GET['order'] ?? 'asc' ) === 'desc' ? 'DESC' : 'ASC';
$sql .= match ( $orderby ) {
	'date'       => " ORDER BY p.created_at $order",
	'price'      => " ORDER BY p.price $order",
	'rating'     => " ORDER BY p.average_rating $order",
	'popularity' => " ORDER BY p.total_sales $order",
	'name'       => " ORDER BY p.name $order",
	default      => " ORDER BY p.menu_order $order, p.id $order",
};

$per = min( 100, max( 1, (int) ( $_GET['per_page'] ?? 24 ) ) );
$page = max( 1, (int) ( $_GET['page'] ?? 1 ) );
$sql .= " LIMIT $per OFFSET " . ( $per * ( $page - 1 ) );

$st = $pdo->prepare( $sql );
$st->execute( $args );
$rows = $st->fetchAll();

// Attach category refs for the serializer.
$catMap = array();
foreach ( $pdo->query( 'SELECT id, name, slug FROM categories' ) as $c ) {
	$catMap[ (int) $c['id'] ] = $c;
}

$out = array();
foreach ( $rows as $r ) {
	$ids   = array_filter( array_map( 'intval', explode( ',', (string) $r['cat_ids'] ) ) );
	$names = $slugs = array();
	foreach ( $ids as $cid ) {
		if ( isset( $catMap[ $cid ] ) ) {
			$names[] = $catMap[ $cid ]['name'];
			$slugs[] = $catMap[ $cid ]['slug'];
		}
	}
	$r['category_ids']   = json_encode( array_values( $ids ) );
	$r['category_names'] = json_encode( $names );
	$r['category_slugs'] = json_encode( $slugs );
	$out[] = product_json( $r );
}

if ( isset( $_GET['_fields'] ) ) $out = apply_fields( $out, $_GET['_fields'] );
json_out( $out );
