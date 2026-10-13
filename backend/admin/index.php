<?php
/** Admin login + dashboard. */

require __DIR__ . '/_common.php';

$err = '';
if ( $_SERVER['REQUEST_METHOD'] === 'POST' ) {
	$a = admin_cfg();
	if ( ( $_POST['u'] ?? '' ) === $a['username'] && ( $_POST['p'] ?? '' ) === $a['password'] ) {
		$_SESSION['bl_admin'] = true;
		header( 'Location: index.php' );
		exit;
	}
	$err = 'Invalid credentials';
}

if ( ! is_admin() ) {
	page_head( 'Sign in' );
	?>
	<div class="wrap">
		<div class="login-card">
			<div class="logo"><img src="http://localhost:3000/wp-uploads/2026/03/Barelyn-Logo-1-1-1.png" alt="BARELYN"><small>ADMIN PANEL</small></div>
			<?php if ( $err ) echo "<div class='err' style='margin-top:18px'>$err</div>"; ?>
			<form method="post" style="margin-top:20px">
				<label>Username</label><input type="text" name="u" required autofocus>
				<label>Password</label><input type="password" name="p" required>
				<p style="margin-top:22px"><button class="btn" style="width:100%;justify-content:center;padding:11px">Sign in</button></p>
			</form>
		</div>
	</div>
	<?php
	page_foot();
	exit;
}

require_admin();
$pdo = db();

$stats = array(
	'products'      => (int) $pdo->query( 'SELECT COUNT(*) FROM products' )->fetchColumn(),
	'orders'        => (int) $pdo->query( 'SELECT COUNT(*) FROM orders' )->fetchColumn(),
	'pending'       => (int) $pdo->query( "SELECT COUNT(*) FROM orders WHERE status='pending'" )->fetchColumn(),
	'revenue_paise' => (int) $pdo->query( "SELECT COALESCE(SUM(total),0) FROM orders WHERE status IN ('paid','shipped','delivered')" )->fetchColumn(),
	'customers'     => (int) $pdo->query( 'SELECT COUNT(*) FROM users' )->fetchColumn(),
	'out_of_stock'  => (int) $pdo->query( 'SELECT COUNT(*) FROM products WHERE is_in_stock = 0' )->fetchColumn(),
);

/* orders by status */
$statusColors = array(
	'paid'      => '#2e7d32', 'delivered' => '#1b5e20', 'shipped' => '#1e5fa8',
	'pending'   => '#b36414', 'cancelled' => '#b3382c',
);
$statusRows = $pdo->query( 'SELECT status, COUNT(*) c FROM orders GROUP BY status ORDER BY c DESC' )->fetchAll();
$statusTotal = array_sum( array_map( fn( $r ) => (int) $r['c'], $statusRows ) );

/* top 5 products by units sold */
$top = $pdo->query(
	'SELECT p.name, SUM(oi.quantity) qty, SUM(oi.price * oi.quantity) rev
	 FROM order_items oi JOIN products p ON p.id = oi.product_id
	 GROUP BY p.id ORDER BY qty DESC LIMIT 5'
)->fetchAll();
$topMax = max( 1, ...array_map( fn( $t ) => (int) $t['qty'], $top ?: array( array( 'qty' => 1 ) ) ) );

/* payment method split */
$payRows = $pdo->query(
	"SELECT COALESCE(NULLIF(payment_method,''),'unknown') m, COUNT(*) c, SUM(total) t
	 FROM orders GROUP BY m ORDER BY c DESC"
)->fetchAll();
$payMax = max( 1, ...array_map( fn( $r ) => (int) $r['c'], $payRows ?: array( array( 'c' => 1 ) ) ) );
$recent = $pdo->query( 'SELECT id, status, total, created_at FROM orders ORDER BY id DESC LIMIT 8' )->fetchAll();

/* daily revenue + order count, last 30 days */
$days  = 30;
$byDay = array();
foreach ( $pdo->query(
	"SELECT DATE(created_at) d, SUM(total) t, COUNT(*) c FROM orders
	 WHERE created_at >= CURDATE() - INTERVAL $days DAY GROUP BY d"
) as $r ) {
	$byDay[ $r['d'] ] = array( (int) $r['t'], (int) $r['c'] );
}
$series = array();
for ( $i = $days - 1; $i >= 0; $i-- ) {
	$d = date( 'Y-m-d', strtotime( "-$i days" ) );
	$series[] = array( $d, $byDay[ $d ][0] ?? 0, $byDay[ $d ][1] ?? 0 );
}
$max = max( 1, ...array_map( fn( $s ) => $s[1], $series ) );

/* svg chart geometry */
$W = 760; $H = 190; $padX = 8; $padT = 12; $padB = 24;
$iw = $W - $padX * 2; $ih = $H - $padT - $padB;
$pts = array();
foreach ( $series as $i => $s ) {
	$x = $padX + $iw * $i / max( 1, count( $series ) - 1 );
	$y = $padT + $ih * ( 1 - $s[1] / $max );
	$pts[] = array( round( $x, 1 ), round( $y, 1 ), $s );
}
$line = implode( ' ', array_map( fn( $p ) => "$p[0],$p[1]", $pts ) );
$area = "$padX," . ( $H - $padB ) . ' ' . $line . ' ' . ( $W - $padX ) . ',' . ( $H - $padB );

page_head( 'Dashboard', 'dashboard' );
?>
<h1>Dashboard</h1>
<p class="sub">Store at a glance</p>
<div class="row" style="grid-template-columns:repeat(5,1fr);gap:14px">
	<div class="card stat"><div class="label">Revenue</div><div class="num"><?= money( $stats['revenue_paise'] ) ?></div></div>
	<div class="card stat"><div class="label">Orders</div><div class="num"><?= $stats['orders'] ?></div></div>
	<div class="card stat"><div class="label">Products</div><div class="num"><?= $stats['products'] ?></div></div>
	<div class="card stat"><div class="label">Customers</div><div class="num"><?= $stats['customers'] ?></div></div>
	<div class="card stat" style="--terra:<?= $stats['out_of_stock'] ? '#b3382c' : '#b5704a' ?>"><div class="label">Out of stock</div><div class="num" style="color:<?= $stats['out_of_stock'] ? 'var(--red)' : 'inherit' ?>"><?= $stats['out_of_stock'] ?></div></div>
</div>
<h1 style="margin-top:10px">Revenue <span class="mut" style="font-weight:400;font-size:12px">last 30 days</span></h1>
<div class="card" style="padding:18px 20px 8px">
	<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:4px">
		<span><?= money( $max ) ?></span>
		<span><?= money( array_sum( array_map( fn( $s ) => $s[1], $series ) ) ) ?> total</span>
	</div>
	<svg viewBox="0 0 <?= $W ?> <?= $H ?>" width="100%" preserveAspectRatio="none" style="display:block">
		<defs>
			<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#b5704a" stop-opacity=".28"/>
				<stop offset="1" stop-color="#b5704a" stop-opacity="0"/>
			</linearGradient>
		</defs>
		<?php foreach ( array( .25, .5, .75 ) as $gy ): ?>
			<line x1="<?= $padX ?>" x2="<?= $W - $padX ?>" y1="<?= $padT + $ih * $gy ?>" y2="<?= $padT + $ih * $gy ?>" stroke="#f0e7dc" stroke-width="1"/>
		<?php endforeach; ?>
		<polygon points="<?= $area ?>" fill="url(#g)"/>
		<polyline points="<?= $line ?>" fill="none" stroke="#b5704a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
		<?php foreach ( $pts as $p ):
			if ( $p[2][1] > 0 ): ?>
				<circle cx="<?= $p[0] ?>" cy="<?= $p[1] ?>" r="3.5" fill="#b5704a" stroke="#fff" stroke-width="1.5">
					<title><?= h( date( 'd M', strtotime( $p[2][0] ) ) ) ?> — <?= money( $p[2][1] ) ?> · <?= $p[2][2] ?> order<?= $p[2][2] === 1 ? '' : 's' ?></title>
				</circle>
			<?php endif; endforeach; ?>
		<text x="<?= $padX ?>" y="<?= $H - 8 ?>" font-size="10" fill="#a39890"><?= h( date( 'd M', strtotime( $series[0][0] ) ) ) ?></text>
		<text x="<?= $W - $padX ?>" y="<?= $H - 8 ?>" font-size="10" fill="#a39890" text-anchor="end"><?= h( date( 'd M' ) ) ?></text>
	</svg>
</div>

<div class="row" style="grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:16px">

	<!-- orders by status donut -->
	<div class="card">
		<div class="mut" style="font-weight:600;text-transform:uppercase;letter-spacing:.08em;font-size:11px;margin-bottom:14px">Orders by status</div>
		<div style="display:flex;align-items:center;gap:18px">
			<svg width="104" height="104" viewBox="0 0 42 42" style="flex-shrink:0">
				<circle cx="21" cy="21" r="15.915" fill="none" stroke="#efe4d4" stroke-width="7"/>
				<?php $off = 25; foreach ( $statusRows as $sr ):
					$pct = $statusTotal ? (int) $sr['c'] / $statusTotal * 100 : 0;
					$col = $statusColors[ $sr['status'] ] ?? '#a39890'; ?>
					<circle cx="21" cy="21" r="15.915" fill="none" stroke="<?= $col ?>" stroke-width="7"
						stroke-dasharray="<?= round( $pct, 1 ) ?> <?= round( 100 - $pct, 1 ) ?>" stroke-dashoffset="<?= round( $off, 1 ) ?>">
						<title><?= h( $sr['status'] ) ?>: <?= (int) $sr['c'] ?></title></circle>
				<?php $off -= $pct; endforeach; ?>
				<text x="21" y="24" text-anchor="middle" font-size="10" font-weight="700" fill="#241f1b"><?= $statusTotal ?></text>
			</svg>
			<div style="display:flex;flex-direction:column;gap:7px;font-size:12.5px">
				<?php foreach ( $statusRows as $sr ): ?>
					<span style="display:flex;align-items:center;gap:7px">
						<i style="width:9px;height:9px;border-radius:50%;background:<?= $statusColors[ $sr['status'] ] ?? '#a39890' ?>"></i>
						<?= h( ucfirst( $sr['status'] ) ) ?> <b style="margin-left:auto;padding-left:14px"><?= (int) $sr['c'] ?></b>
					</span>
				<?php endforeach; ?>
				<?php if ( ! $statusRows ): ?><span class="mut">No orders yet</span><?php endif; ?>
			</div>
		</div>
	</div>

	<!-- top products -->
	<div class="card">
		<div class="mut" style="font-weight:600;text-transform:uppercase;letter-spacing:.08em;font-size:11px;margin-bottom:14px">Top products <span style="text-transform:none;letter-spacing:0;font-weight:500">by units</span></div>
		<div style="display:flex;flex-direction:column;gap:11px">
			<?php foreach ( $top as $i => $t ): ?>
				<div>
					<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px">
						<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:78%"><?= $i + 1 ?>. <?= h( $t['name'] ) ?></span>
						<b><?= (int) $t['qty'] ?></b>
					</div>
					<div style="height:7px;border-radius:99px;background:#efe4d4">
						<div style="height:100%;border-radius:99px;background:linear-gradient(90deg,#c07d55,#b5704a);width:<?= round( $t['qty'] / $topMax * 100 ) ?>%"></div>
					</div>
				</div>
			<?php endforeach; ?>
			<?php if ( ! $top ): ?><span class="mut">No sales yet</span><?php endif; ?>
		</div>
	</div>

	<!-- payment methods -->
	<div class="card">
		<div class="mut" style="font-weight:600;text-transform:uppercase;letter-spacing:.08em;font-size:11px;margin-bottom:14px">Payments</div>
		<div style="display:flex;flex-direction:column;gap:11px">
			<?php foreach ( $payRows as $r ): ?>
				<div>
					<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px">
						<span><?= h( ucfirst( $r['m'] ) ) ?></span>
						<b><?= (int) $r['c'] ?> <span class="mut" style="font-weight:400">· <?= money( $r['t'] ) ?></span></b>
					</div>
					<div style="height:7px;border-radius:99px;background:#efe4d4">
						<div style="height:100%;border-radius:99px;background:#9a5836;width:<?= round( $r['c'] / $payMax * 100 ) ?>%"></div>
					</div>
				</div>
			<?php endforeach; ?>
			<?php if ( ! $payRows ): ?><span class="mut">No payments yet</span><?php endif; ?>
		</div>
	</div>
</div>

<h1 style="margin-top:10px">Recent orders</h1>
<table>
	<tr><th>#</th><th>Status</th><th>Total</th><th>Placed</th><th></th></tr>
	<?php foreach ( $recent as $o ): ?>
		<tr>
			<td>#<?= (int) $o['id'] ?></td>
			<td><span class="pill <?= h( $o['status'] ) ?>"><?= h( $o['status'] ) ?></span></td>
			<td><?= money( $o['total'] ) ?></td>
			<td class="mut"><?= h( $o['created_at'] ) ?></td>
			<td><a class="btn sm ghost" href="orders.php#o<?= (int) $o['id'] ?>">View</a></td>
		</tr>
	<?php endforeach; ?>
	<?php if ( ! $recent ): ?><tr><td colspan="5" class="mut">No orders yet.</td></tr><?php endif; ?>
</table>
<?php if ( $stats['pending'] ): ?><p class="mut"><?= $stats['pending'] ?> order(s) awaiting payment.</p><?php endif;
page_foot();
