<?php
/**
 * One-shot description sanitizer for barelyn_shop.products.
 * Strips junk containers/attributes (ChatGPT-export artifacts, inline
 * classes/styles) and keeps only simple content tags.
 * Run: C:\xampp\php\php.exe backend\cleanup-descriptions.php  — safe to re-run.
 */

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

$pdo  = db();
$rows = $pdo->query( 'SELECT id, description, short_description FROM products' )->fetchAll();
$up   = $pdo->prepare( 'UPDATE products SET description = ?, short_description = ? WHERE id = ?' );

foreach ( $rows as $r ) {
	$d = clean_html( (string) $r['description'] );
	$s = strip_tags( (string) $r['short_description'] );
	$s = trim( preg_replace( '/\s+/', ' ', $s ) );
	if ( $d !== $r['description'] || $s !== $r['short_description'] ) {
		$up->execute( array( $d, $s, $r['id'] ) );
		echo "cleaned #{$r['id']}\n";
	}
}
echo "done\n";
