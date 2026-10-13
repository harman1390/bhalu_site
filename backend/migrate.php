<?php
/**
 * One-shot importer: WordPress/WooCommerce -> barelyn_shop.
 * Run:  C:\xampp\php\php.exe backend\migrate.php
 * Or browse: http://localhost/barelyn-api/migrate.php
 * Safe to re-run — tables are truncated first.
 */

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

$cfg = require __DIR__ . '/config.php';
$wp  = $cfg['wp_db'];
$pre = $cfg['wp_prefix'];

$out = function ( string $m ) {
	if ( PHP_SAPI === 'cli' ) { echo $m, PHP_EOL; }
	else { echo '<pre>' . htmlspecialchars( $m ) . '</pre>'; }
	flush();
};

$out( '== Barelyn WP -> PHP migration ==' );

/* ---------- 1. schema ---------- */
$pdo = db( '' );
$pdo->exec( 'CREATE DATABASE IF NOT EXISTS `' . $cfg['db']['name'] . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci' );
$pdo->exec( 'USE `' . $cfg['db']['name'] . '`' );

$pdo->exec( "
CREATE TABLE IF NOT EXISTS categories (
	id INT UNSIGNED PRIMARY KEY,
	name VARCHAR(190) NOT NULL,
	slug VARCHAR(190) NOT NULL UNIQUE,
	description TEXT NULL,
	image VARCHAR(500) NULL,
	count INT UNSIGNED NOT NULL DEFAULT 0,
	parent INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB" );

$pdo->exec( "
CREATE TABLE IF NOT EXISTS products (
	id INT UNSIGNED PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	slug VARCHAR(255) NOT NULL UNIQUE,
	description MEDIUMTEXT NULL,
	short_description TEXT NULL,
	sku VARCHAR(100) NULL,
	price INT UNSIGNED NOT NULL DEFAULT 0,
	regular_price INT UNSIGNED NOT NULL DEFAULT 0,
	sale_price INT UNSIGNED NULL,
	images MEDIUMTEXT NULL,
	average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
	review_count INT UNSIGNED NOT NULL DEFAULT 0,
	is_in_stock TINYINT(1) NOT NULL DEFAULT 1,
	total_sales INT UNSIGNED NOT NULL DEFAULT 0,
	menu_order INT NOT NULL DEFAULT 0,
	created_at DATETIME NULL
) ENGINE=InnoDB" );

$pdo->exec( "
CREATE TABLE IF NOT EXISTS product_categories (
	product_id INT UNSIGNED NOT NULL,
	category_id INT UNSIGNED NOT NULL,
	PRIMARY KEY (product_id, category_id)
) ENGINE=InnoDB" );

$pdo->exec( "
CREATE TABLE IF NOT EXISTS carts (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	token VARCHAR(64) NOT NULL UNIQUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB" );

$pdo->exec( "
CREATE TABLE IF NOT EXISTS cart_items (
	cart_id INT UNSIGNED NOT NULL,
	item_key VARCHAR(64) NOT NULL,
	product_id INT UNSIGNED NOT NULL,
	quantity INT UNSIGNED NOT NULL DEFAULT 1,
	PRIMARY KEY (cart_id, item_key)
) ENGINE=InnoDB" );

$pdo->exec( "
CREATE TABLE IF NOT EXISTS users (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	username VARCHAR(100) NOT NULL,
	email VARCHAR(190) NOT NULL UNIQUE,
	name VARCHAR(190) NULL,
	phone VARCHAR(20) NULL,
	password_hash VARCHAR(255) NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB" );

$pdo->exec( "
CREATE TABLE IF NOT EXISTS orders (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	status VARCHAR(20) NOT NULL DEFAULT 'pending',
	total INT UNSIGNED NOT NULL DEFAULT 0,
	currency VARCHAR(10) NOT NULL DEFAULT 'INR',
	billing_json MEDIUMTEXT NULL,
	shipping_json MEDIUMTEXT NULL,
	payment_method VARCHAR(40) NULL,
	razorpay_order_id VARCHAR(60) NULL,
	razorpay_payment_id VARCHAR(60) NULL,
	cart_token VARCHAR(64) NULL,
	paid_at DATETIME NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB" );

$pdo->exec( "
CREATE TABLE IF NOT EXISTS order_items (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	order_id INT UNSIGNED NOT NULL,
	product_id INT UNSIGNED NOT NULL,
	quantity INT UNSIGNED NOT NULL,
	price INT UNSIGNED NOT NULL
) ENGINE=InnoDB" );

$out( 'schema ok' );

/* ---------- 2. import categories ---------- */
$pdo->exec( 'TRUNCATE product_categories' );
$pdo->exec( 'TRUNCATE products' );
$pdo->exec( 'TRUNCATE categories' );

$src = $pdo; // same connection, different schema

$imgFor = function ( int $attId ) use ( $src, $wp, $pre ): ?string {
	if ( ! $attId ) return null;
	$st = $src->prepare( "SELECT guid FROM {$wp}.{$pre}posts WHERE ID = ?" );
	$st->execute( array( $attId ) );
	$guid = $st->fetchColumn();
	return $guid ? (string) $guid : null;
};

$cats = $src->query( "
	SELECT t.term_id, t.name, t.slug, tt.description, tt.count, tt.parent,
	       (SELECT meta_value FROM {$wp}.{$pre}termmeta WHERE term_id = t.term_id AND meta_key = 'thumbnail_id' LIMIT 1) AS thumb
	FROM {$wp}.{$pre}terms t
	JOIN {$wp}.{$pre}term_taxonomy tt ON t.term_id = tt.term_id
	WHERE tt.taxonomy = 'product_cat' AND t.slug != 'uncategorized'" )->fetchAll();

$insCat = $src->prepare( 'INSERT INTO categories (id, name, slug, description, image, count, parent) VALUES (?,?,?,?,?,?,?)' );
foreach ( $cats as $c ) {
	$insCat->execute( array(
		(int) $c['term_id'], $c['name'], $c['slug'], $c['description'],
		$imgFor( (int) $c['thumb'] ), (int) $c['count'], (int) $c['parent'],
	) );
}
$out( 'categories: ' . count( $cats ) );

/* ---------- 3. import products ---------- */
$products = $src->query( "
	SELECT ID, post_title, post_name, post_content, post_excerpt, menu_order, post_date
	FROM {$wp}.{$pre}posts WHERE post_type = 'product' AND post_status = 'publish'" )->fetchAll();

$meta = function ( int $pid, string $key ) use ( $src, $wp, $pre ) {
	$st = $src->prepare( "SELECT meta_value FROM {$wp}.{$pre}postmeta WHERE post_id = ? AND meta_key = ? LIMIT 1" );
	$st->execute( array( $pid, $key ) );
	return $st->fetchColumn();
};

$insP = $src->prepare(
	'INSERT INTO products (id, name, slug, description, short_description, sku, price, regular_price, sale_price,
	 images, average_rating, review_count, is_in_stock, total_sales, menu_order, created_at)
	 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
);
$insPC = $src->prepare( 'INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?,?)' );

foreach ( $products as $p ) {
	$pid = (int) $p['ID'];

	$reg   = (float) ( $meta( $pid, '_regular_price' ) ?: 0 );
	$sale  = $meta( $pid, '_sale_price' );
	$saleF = $sale !== false && $sale !== '' ? (float) $sale : null;
	$price = (float) ( $meta( $pid, '_price' ) ?: ( $saleF ?? $reg ) );

	// images: featured + gallery
	$images = array();
	$attIds = array_filter( array_map( 'intval', array_merge(
		array( (int) $meta( $pid, '_thumbnail_id' ) ),
		explode( ',', (string) $meta( $pid, '_product_image_gallery' ) )
	) ) );
	foreach ( $attIds as $att ) {
		$url = $imgFor( $att );
		if ( ! $url ) continue;
		$alt = $meta( $att, '_wp_attachment_image_alt' );
		$images[] = array(
			'id' => $att, 'src' => $url, 'thumbnail' => $url,
			'srcset' => '', 'sizes' => '', 'name' => '', 'alt' => (string) ( $alt ?: '' ),
		);
	}

	$stock = ( $meta( $pid, '_stock_status' ) ?: 'instock' ) === 'instock' ? 1 : 0;

	$insP->execute( array(
		$pid,
		$p['post_title'],
		$p['post_name'],
		clean_html( (string) $p['post_content'] ),
		trim( preg_replace( '/\s+/', ' ', strip_tags( (string) $p['post_excerpt'] ) ) ),
		(string) ( $meta( $pid, '_sku' ) ?: '' ),
		(int) round( $price * 100 ),
		(int) round( $reg * 100 ),
		$saleF !== null ? (int) round( $saleF * 100 ) : null,
		json_encode( $images, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ),
		(float) ( $meta( $pid, '_wc_average_rating' ) ?: 0 ),
		(int) ( $meta( $pid, '_wc_review_count' ) ?: 0 ),
		$stock,
		(int) ( $meta( $pid, 'total_sales' ) ?: 0 ),
		(int) $p['menu_order'],
		$p['post_date'],
	) );

	// category links
	$rel = $src->prepare(
		"SELECT tr.term_taxonomy_id FROM {$wp}.{$pre}term_relationships tr
		 JOIN {$wp}.{$pre}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
		 WHERE tr.object_id = ? AND tt.taxonomy = 'product_cat'"
	);
	$rel->execute( array( $pid ) );
	foreach ( $rel->fetchAll() as $r ) {
		$insPC->execute( array( $pid, (int) $r['term_taxonomy_id'] ) );
	}
}
$out( 'products: ' . count( $products ) );

// category count refresh (exclude uncategorized already filtered)
$src->exec( 'UPDATE categories c SET count = (SELECT COUNT(*) FROM product_categories pc WHERE pc.category_id = c.id)' );

$out( 'done ✓' );
