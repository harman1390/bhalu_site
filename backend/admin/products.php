<?php
/** Products: list / add / edit / delete, image upload. */

require __DIR__ . '/_common.php';
require_admin();
$pdo = db();

$msg = '';
$err = '';

$UPLOAD_DIR = dirname( __DIR__, 2 ) . '/public/uploads';
$UPLOAD_URL = '/uploads/';

function slugify( string $s ): string {
	$s = strtolower( trim( $s ) );
	$s = preg_replace( '/[^a-z0-9]+/', '-', $s );
	return trim( $s, '-' ) ?: 'product';
}

function unique_slug( PDO $pdo, string $base, int $exclude = 0 ): string {
	$slug = $base;
	$i = 2;
	while ( true ) {
		$st = $pdo->prepare( 'SELECT id FROM products WHERE slug = ? AND id != ?' );
		$st->execute( array( $slug, $exclude ) );
		if ( ! $st->fetch() ) return $slug;
		$slug = $base . '-' . $i++;
	}
}

/** Handle an uploaded image; returns stored URL or null. */
function save_image( string $field, string $dir, string $urlBase ): ?string {
	if ( empty( $_FILES[ $field ] ) || $_FILES[ $field ]['error'] !== UPLOAD_ERR_OK ) return null;
	$ext = strtolower( pathinfo( $_FILES[ $field ]['name'], PATHINFO_EXTENSION ) );
	if ( ! in_array( $ext, array( 'jpg', 'jpeg', 'png', 'webp', 'gif' ), true ) ) return null;
	// Verify the content is actually an image, not just a renamed payload.
	$info = @getimagesize( $_FILES[ $field ]['tmp_name'] );
	if ( $info === false || ! in_array( $info[2], array( IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP, IMAGETYPE_GIF ), true ) ) {
		return null;
	}
	if ( ! is_dir( $dir ) ) mkdir( $dir, 0775, true );
	$name = uniqid( 'p', true ) . '.' . $ext;
	move_uploaded_file( $_FILES[ $field ]['tmp_name'], "$dir/$name" );
	return $urlBase . $name;
}

/* ---------- actions ---------- */

if ( $_SERVER['REQUEST_METHOD'] === 'POST' ) {
	csrf_check();
	$act = $_POST['act'] ?? '';

	if ( $act === 'save' ) {
		$id    = (int) ( $_POST['id'] ?? 0 );
		$name  = trim( (string) $_POST['name'] );
		$price = (int) round( (float) $_POST['price'] * 100 );
		$sale  = trim( (string) $_POST['sale_price'] ) !== '' ? (int) round( (float) $_POST['sale_price'] * 100 ) : null;
		$stock = isset( $_POST['is_in_stock'] ) ? 1 : 0;
		$cats  = array_map( 'intval', (array) ( $_POST['cats'] ?? array() ) );

		if ( $name === '' || $price <= 0 ) {
			$err = 'Name and a price are required.';
		} else {
			$slug = unique_slug( $pdo, slugify( $_POST['slug'] ?: $name ), $id );

			// keep existing images unless replaced
			$images = array();
			if ( $id ) {
				$st = $pdo->prepare( 'SELECT images FROM products WHERE id = ?' );
				$st->execute( array( $id ) );
				$images = json_decode( (string) $st->fetchColumn(), true ) ?: array();
			}
			$new = save_image( 'image', $UPLOAD_DIR, $UPLOAD_URL );
			if ( $new ) {
				array_unshift( $images, image_json( $new, $name, $name ) );
			}
			if ( isset( $_POST['extra_image'] ) ) {
				foreach ( (array) $_POST['extra_image'] as $u ) {
					$u = trim( (string) $u );
					// http(s) or same-site paths only — never javascript:/data:.
					if ( $u && ( preg_match( '#^https?://#i', $u ) || str_starts_with( $u, '/' ) ) ) {
						$images[] = image_json( $u, $name, $name );
					}
				}
			}

			$fields = array(
				'name'              => $name,
				'slug'              => $slug,
				'description'       => text_to_html( (string) $_POST['description'] ),
				'short_description' => text_to_html( (string) $_POST['short_description'] ),
				'sku'               => (string) $_POST['sku'],
				'price'             => $sale !== null && $sale < $price ? $sale : $price,
				'regular_price'     => $price,
				'sale_price'        => $sale,
				'images'            => json_encode( array_values( $images ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ),
				'is_in_stock'       => $stock,
			);

			if ( $id ) {
				$set = implode( ', ', array_map( fn( $k ) => "$k = ?", array_keys( $fields ) ) );
				$pdo->prepare( "UPDATE products SET $set WHERE id = ?" )
					->execute( array_merge( array_values( $fields ), array( $id ) ) );
			} else {
				$fields['created_at'] = date( 'Y-m-d H:i:s' );
				$cols = implode( ',', array_keys( $fields ) );
				$qs   = implode( ',', array_fill( 0, count( $fields ), '?' ) );
				$pdo->prepare( "INSERT INTO products ($cols) VALUES ($qs)" )
					->execute( array_values( $fields ) );
				$id = (int) $pdo->lastInsertId();
			}

			// category links
			$pdo->prepare( 'DELETE FROM product_categories WHERE product_id = ?' )->execute( array( $id ) );
			$ins = $pdo->prepare( 'INSERT IGNORE INTO product_categories VALUES (?,?)' );
			foreach ( $cats as $c ) $ins->execute( array( $id, $c ) );

			header( 'Location: products.php?saved=1' );
			exit;
		}
	}

	if ( $act === 'delete' ) {
		$id = (int) $_POST['id'];
		$pdo->prepare( 'DELETE FROM product_categories WHERE product_id = ?' )->execute( array( $id ) );
		$pdo->prepare( 'DELETE FROM cart_items WHERE product_id = ?' )->execute( array( $id ) );
		$pdo->prepare( 'DELETE FROM products WHERE id = ?' )->execute( array( $id ) );
		header( 'Location: products.php?deleted=1' );
		exit;
	}
}

if ( isset( $_GET['saved'] ) ) $msg = 'Product saved.';
if ( isset( $_GET['deleted'] ) ) $msg = 'Product deleted.';

/* ---------- edit view ---------- */
$edit = null;
if ( isset( $_GET['edit'] ) ) {
	$st = $pdo->prepare( 'SELECT * FROM products WHERE id = ?' );
	$st->execute( array( (int) $_GET['edit'] ) );
	$edit = $st->fetch();
}
if ( isset( $_GET['new'] ) ) $edit = array();

$allCats = $pdo->query( 'SELECT id, name FROM categories ORDER BY name' )->fetchAll();

page_head( 'Products', 'products' );

if ( $msg ) echo "<div class='msg'>$msg</div>";
if ( $err ) echo "<div class='err'>$err</div>";

if ( $edit !== null ) {
	$id     = (int) ( $edit['id'] ?? 0 );
	$myCats = array();
	if ( $id ) {
		$st = $pdo->prepare( 'SELECT category_id FROM product_categories WHERE product_id = ?' );
		$st->execute( array( $id ) );
		$myCats = array_map( 'intval', $st->fetchAll( PDO::FETCH_COLUMN ) );
	}
	$imgs = json_decode( $edit['images'] ?? '[]', true ) ?: array();
	?>
	<h1><?= $id ? 'Edit' : 'Add' ?> product</h1>
	<div class="card">
	<form method="post" enctype="multipart/form-data">
		<?php csrf_field(); ?>
		<input type="hidden" name="act" value="save">
		<input type="hidden" name="id" value="<?= $id ?>">
		<div class="row">
			<div><label>Name *</label><input type="text" name="name" required value="<?= h( $edit['name'] ?? '' ) ?>"></div>
			<div><label>Slug</label><input type="text" name="slug" value="<?= h( $edit['slug'] ?? '' ) ?>" placeholder="auto"></div>
		</div>
		<div class="row">
			<div><label>Price (₹) *</label><input type="number" step="0.01" min="0" name="price" required value="<?= isset( $edit['regular_price'] ) ? number_format( $edit['regular_price'] / 100, 2, '.', '' ) : '' ?>"></div>
			<div><label>Sale price (₹)</label><input type="number" step="0.01" min="0" name="sale_price" value="<?= isset( $edit['sale_price'] ) && $edit['sale_price'] !== null ? number_format( $edit['sale_price'] / 100, 2, '.', '' ) : '' ?>"></div>
		</div>
		<div class="row">
			<div><label>SKU</label><input type="text" name="sku" value="<?= h( $edit['sku'] ?? '' ) ?>"></div>
			<div><label style="margin-top:24px"><input type="checkbox" name="is_in_stock" <?= ( $edit['is_in_stock'] ?? 1 ) ? 'checked' : '' ?>> In stock</label></div>
		</div>
		<label>Short description</label><textarea name="short_description" rows="2"><?= h( html_to_text( $edit['short_description'] ?? '' ) ) ?></textarea>
		<label>Description <span class="mut" style="font-weight:400">(plain text — blank line = new paragraph, "- " = bullet)</span></label><textarea name="description" rows="8"><?= h( html_to_text( $edit['description'] ?? '' ) ) ?></textarea>
		<label>Categories</label>
		<div style="display:flex;flex-wrap:wrap;gap:14px">
			<?php foreach ( $allCats as $c ): ?>
				<label style="margin:0;font-weight:400"><input type="checkbox" name="cats[]" value="<?= (int) $c['id'] ?>" <?= in_array( (int) $c['id'], $myCats, true ) ? 'checked' : '' ?>> <?= h( $c['name'] ) ?></label>
			<?php endforeach; ?>
		</div>
		<label>Image (upload — replaces first image)</label>
		<?php if ( $imgs ): ?>
			<div style="display:flex;gap:8px;margin-bottom:6px">
				<?php foreach ( $imgs as $im ): ?><img class="thumb" src="<?= h( wp_img_path( $im['src'] ?? '' ) ) ?>"><?php endforeach; ?>
			</div>
		<?php endif; ?>
		<input type="file" name="image" accept="image/*">
		<label>Additional image URL</label><input type="text" name="extra_image[]" placeholder="https://… (optional)">
		<p style="margin-top:20px">
			<button class="btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg> Save product</button>
			<a class="btn ghost" href="products.php">Cancel</a>
		</p>
	</form>
	</div>
	<?php
	page_foot();
	exit;
}

/* ---------- list view ---------- */
$rows = $pdo->query(
	'SELECT p.*, (SELECT GROUP_CONCAT(c.name) FROM product_categories pc JOIN categories c ON c.id = pc.category_id WHERE pc.product_id = p.id) AS cats
	 FROM products p ORDER BY p.id DESC'
)->fetchAll();

/** Admin runs on Apache (:80) but images are served by Next (:3000) — absolutize. */
function wp_img_path( string $src ): string {
	$front = 'http://localhost:3000';
	if ( preg_match( '#/wp-content/uploads/(.+)$#i', $src, $m ) ) return "$front/wp-uploads/{$m[1]}";
	if ( str_starts_with( $src, '/uploads/' ) || str_starts_with( $src, '/wp-uploads/' ) ) return $front . $src;
	return $src;
}
?>
<h1>Products <a class="btn sm" href="?new=1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Add product</a></h1>
<table>
	<tr><th></th><th>Name</th><th>Price</th><th>Stock</th><th>Categories</th><th style="width:150px"></th></tr>
	<?php foreach ( $rows as $p ):
		$imgs = json_decode( $p['images'] ?? '[]', true ) ?: array();
		$thumb = $imgs[0]['src'] ?? '';
	?>
	<tr>
		<td><?php if ( $thumb ): ?><img class="thumb" src="<?= h( wp_img_path( $thumb ) ) ?>"><?php endif; ?></td>
		<td><b><?= h( $p['name'] ) ?></b><br><span class="mut"><?= h( $p['slug'] ) ?></span></td>
		<td>
			<?php if ( $p['sale_price'] !== null && $p['sale_price'] < $p['regular_price'] ): ?>
				<b><?= money( $p['sale_price'] ) ?></b> <s class="mut"><?= money( $p['regular_price'] ) ?></s>
			<?php else: ?>
				<b><?= money( $p['regular_price'] ) ?></b>
			<?php endif; ?>
		</td>
		<td><?= $p['is_in_stock'] ? '<span class="pill paid">in stock</span>' : '<span class="pill cancelled">out</span>' ?></td>
		<td class="mut"><?= h( $p['cats'] ) ?></td>
		<td>
			<a class="btn sm ghost" href="?edit=<?= (int) $p['id'] ?>">Edit</a>
			<form method="post" style="display:inline" onsubmit="return confirm('Delete this product?')">
				<?php csrf_field(); ?>
				<input type="hidden" name="act" value="delete"><input type="hidden" name="id" value="<?= (int) $p['id'] ?>">
				<button class="btn sm danger">Delete</button>
			</form>
		</td>
	</tr>
	<?php endforeach; ?>
</table>
<?php
page_foot();
