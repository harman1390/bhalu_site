<?php
/** GET /products/categories — per_page, _fields */

$per  = min( 100, max( 1, (int) ( $_GET['per_page'] ?? 50 ) ) );
$rows = $pdo->query( "SELECT * FROM categories ORDER BY name LIMIT $per" )->fetchAll();

$out = array_map( 'category_json', $rows );
if ( isset( $_GET['_fields'] ) ) $out = apply_fields( $out, $_GET['_fields'] );
json_out( $out );
