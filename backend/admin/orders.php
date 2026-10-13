<?php
/** Orders: read-only list. Status is driven by the checkout/payment flow. */

require __DIR__ . '/_common.php';
require_admin();
$pdo = db();

$rows = $pdo->query( 'SELECT * FROM orders ORDER BY id DESC LIMIT 100' )->fetchAll();

page_head( 'Orders', 'orders' );
?>
<h1>Orders</h1>
<table>
	<tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Placed</th></tr>
	<?php foreach ( $rows as $o ):
		$bill = json_decode( $o['billing_json'] ?? '{}', true );
		$items = $pdo->prepare( 'SELECT oi.quantity, p.name FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?' );
		$items->execute( array( (int) $o['id'] ) );
		$li = array_map( fn( $i ) => h( $i['name'] ?? '?' ) . ' ×' . (int) $i['quantity'], $items->fetchAll() );
	?>
	<tr id="o<?= (int) $o['id'] ?>">
		<td><b>#<?= (int) $o['id'] ?></b></td>
		<td><?= h( trim( ( $bill['first_name'] ?? '' ) . ' ' . ( $bill['last_name'] ?? '' ) ) ?: '—' ) ?><br>
			<span class="mut"><?= h( $bill['email'] ?? '' ) ?><br><?= h( $bill['phone'] ?? '' ) ?></span></td>
		<td class="mut" style="max-width:240px"><?= implode( '<br>', $li ) ?></td>
		<td><b><?= money( $o['total'] ) ?></b></td>
		<td class="mut"><?= h( $o['razorpay_payment_id'] ?: $o['payment_method'] ?: '—' ) ?></td>
		<td><span class="pill <?= h( $o['status'] ) ?>"><?= h( $o['status'] ) ?></span></td>
		<td class="mut"><?= h( $o['created_at'] ) ?></td>
	</tr>
	<?php endforeach; ?>
	<?php if ( ! $rows ): ?><tr><td colspan="7" class="mut">No orders yet.</td></tr><?php endif; ?>
</table>
<?php
page_foot();
