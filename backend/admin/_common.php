<?php
/** Shared admin auth + layout. Every admin page includes this first. */

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

session_set_cookie_params( array(
	'lifetime' => 0,
	'path'     => '/',
	'secure'   => ! empty( $_SERVER['HTTPS'] ) && $_SERVER['HTTPS'] !== 'off',
	'httponly' => true,
	'samesite' => 'Lax',
) );
session_start();

header( 'X-Frame-Options: DENY' );
header( 'X-Content-Type-Options: nosniff' );
header( 'Referrer-Policy: same-origin' );

/* ---------- CSRF ---------- */

function csrf_token(): string {
	if ( empty( $_SESSION['csrf'] ) ) $_SESSION['csrf'] = bin2hex( random_bytes( 20 ) );
	return $_SESSION['csrf'];
}

function csrf_field(): void {
	echo '<input type="hidden" name="csrf" value="' . csrf_token() . '">';
}

function csrf_check(): void {
	if ( ! hash_equals( $_SESSION['csrf'] ?? '', (string) ( $_POST['csrf'] ?? '' ) ) ) {
		http_response_code( 403 );
		exit( 'Invalid CSRF token.' );
	}
}

// Logout is a POST + CSRF-protected action.
if ( $_SERVER['REQUEST_METHOD'] === 'POST' && isset( $_POST['logout'] ) ) {
	csrf_check();
	$_SESSION = array();
	session_destroy();
	header( 'Location: index.php' );
	exit;
}

function admin_cfg(): array {
	return cfg()['admin'];
}

function is_admin(): bool {
	return ! empty( $_SESSION['bl_admin'] );
}

function require_admin(): void {
	if ( ! is_admin() ) {
		header( 'Location: index.php' );
		exit;
	}
}

function h( $s ): string {
	return htmlspecialchars( (string) $s, ENT_QUOTES );
}

function money( $paise ): string {
	return cfg()['currency_symbol'] . number_format( ( (int) $paise ) / 100, 0 );
}

function page_head( string $title, string $active = '' ): void {
	?><!doctype html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= h( $title ) ?> — BARELYN Admin</title>
<style>
	:root {
		--ink:#241f1b; --muted:#8a7d72; --terra:#b5704a; --terra-deep:#9a5836;
		--cream:#f1e5d7; --blush:#eadbc9; --sand:#e0cdb8; --border:#e3d5c2;
		--panel:#f7efe4; --card:#fdfaf5;
		--green:#2e7d32; --green-bg:#e6f2e7; --amber:#b36414; --amber-bg:#fbebd2;
		--red:#b3382c; --red-bg:#fae3de; --blue:#1e5fa8; --blue-bg:#e4eef8;
	}
	* { box-sizing:border-box; margin:0 }
	body { font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
		background:linear-gradient(160deg,var(--cream),#ecdcc8); color:var(--ink);
		font-size:14px; display:flex; min-height:100vh }

	/* ---- sidebar ---- */
	aside { width:230px; flex-shrink:0; background:var(--blush);
		border-right:1px solid var(--sand); display:flex; flex-direction:column;
		position:sticky; top:0; height:100vh }
	aside .brand { padding:22px 20px 16px; border-bottom:1px solid var(--sand) }
	aside .brand img { height:30px; width:auto; display:block }
	aside .brand small { display:block; font-size:10px; font-weight:700; letter-spacing:.2em;
		color:var(--terra); margin-top:8px }
	aside nav { padding:14px 12px; display:flex; flex-direction:column; gap:3px }
	aside nav a { display:flex; align-items:center; gap:11px; color:#5d4c3d; text-decoration:none;
		padding:9px 12px; border-radius:9px; font-size:13.5px; font-weight:500; transition:.15s }
	aside nav a svg { opacity:.6; transition:.15s }
	aside nav a:hover { color:var(--ink); background:rgba(255,255,255,.55) }
	aside nav a.on { color:#fff; background:var(--terra); box-shadow:0 4px 10px rgba(181,112,74,.3) }
	aside nav a.on svg { opacity:1 }
	aside .bottom { margin-top:auto; padding:14px 12px; border-top:1px solid var(--border) }
	aside .bottom a { color:var(--muted); text-decoration:none; display:flex; align-items:center;
		gap:11px; padding:9px 12px; border-radius:9px; font-size:13px; font-weight:500; transition:.15s }
	aside .bottom a:hover { color:var(--red); background:var(--red-bg) }

	/* ---- content ---- */
	main { flex:1; padding:28px 32px 48px; min-width:0 }
	h1 { font-size:21px; font-weight:600; letter-spacing:-.01em; margin-bottom:18px }
	h1 .btn { vertical-align:3px; margin-left:10px }
	.sub { color:var(--muted); font-size:13px; margin:-12px 0 18px }

	table { width:100%; border-collapse:collapse; background:var(--card); border-radius:14px;
		box-shadow:0 1px 3px rgba(60,40,25,.08) }
	th { text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:.08em;
		color:#7a6552; padding:13px 16px; border-bottom:1px solid var(--border); font-weight:600;
		background:var(--panel) }
	th:first-child { border-radius:14px 0 0 0 } th:last-child { border-radius:0 14px 0 0 }
	td { padding:12px 16px; border-bottom:1px solid #efe4d4; vertical-align:middle }
	tbody tr:last-child td, tr:last-child td { border:0 }
	tbody tr:hover, tr:hover td { background:var(--panel) }
	tr:target td { background:var(--blush) !important }

	.card { background:var(--card); border:1px solid #efe3d0; border-radius:14px; padding:22px;
		box-shadow:0 1px 3px rgba(60,40,25,.07); margin-bottom:16px }
	.stat { position:relative; overflow:hidden }
	.stat::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:var(--terra) }
	.stat .label { font-size:11px; text-transform:uppercase; letter-spacing:.09em; color:var(--muted); font-weight:600 }
	.stat .num { font-size:26px; font-weight:700; letter-spacing:-.02em; margin-top:4px }

	input[type=text], input[type=email], input[type=password], input[type=number], textarea, select {
		width:100%; border:1px solid var(--sand); border-radius:9px; padding:9px 12px;
		font:inherit; background:#fffdf9; color:var(--ink); transition:border-color .15s, box-shadow .15s }
	input:focus, textarea:focus, select:focus { outline:0; border-color:var(--terra);
		box-shadow:0 0 0 3px rgba(181,112,74,.15) }
	input[type=checkbox] { accent-color:var(--terra); width:15px; height:15px; vertical-align:-2px; margin-right:5px }
	input[type=file] { font-size:13px; color:var(--muted) }
	label { display:block; font-size:12px; font-weight:600; margin:14px 0 5px; color:#6b5f55 }

	.btn { display:inline-flex; align-items:center; justify-content:center; gap:7px;
		background:linear-gradient(180deg,#c07d55,var(--terra)); color:#fff;
		border:0; border-radius:10px; padding:10px 22px; font:inherit; font-weight:600;
		font-size:13px; cursor:pointer; text-decoration:none; letter-spacing:.01em;
		box-shadow:0 2px 6px rgba(154,88,54,.35), inset 0 1px 0 rgba(255,255,255,.25);
		transition:transform .12s, box-shadow .15s, filter .15s }
	.btn:hover { filter:brightness(1.06); transform:translateY(-1px);
		box-shadow:0 5px 14px rgba(154,88,54,.4), inset 0 1px 0 rgba(255,255,255,.25) }
	.btn:active { transform:translateY(0); box-shadow:0 1px 3px rgba(154,88,54,.35);
		filter:brightness(.97) }
	.btn.sm { padding:6px 15px; font-size:12px; border-radius:8px }
	.btn.ghost { background:var(--card); color:var(--terra); border:1.5px solid #d9a184;
		box-shadow:0 1px 3px rgba(60,40,25,.08) }
	.btn.ghost:hover { background:var(--terra); border-color:var(--terra); color:#fff; filter:none }
	.btn.ghost:active { filter:none }
	.btn.danger { background:var(--card); color:var(--red); border:1.5px solid #e0b3ac;
		box-shadow:0 1px 3px rgba(60,40,25,.08) }
	.btn.danger:hover { background:var(--red); border-color:var(--red); color:#fff; filter:none }
	.btn.danger:active { filter:none }
	.btn svg { flex-shrink:0 }

	.msg { background:var(--green-bg); border:1px solid #a8d5ab; color:var(--green);
		padding:11px 16px; border-radius:10px; margin-bottom:16px; font-size:13px; font-weight:500 }
	.err { background:var(--red-bg); border:1px solid #eba9a0; color:var(--red);
		padding:11px 16px; border-radius:10px; margin-bottom:16px; font-size:13px; font-weight:500 }

	.row { display:grid; grid-template-columns:1fr 1fr; gap:0 18px }
	.pill { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:999px;
		font-size:11px; font-weight:600; letter-spacing:.02em }
	.pill::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor }
	.pill.paid { background:var(--green-bg); color:var(--green) }
	.pill.pending { background:var(--amber-bg); color:var(--amber) }
	.pill.cancelled { background:var(--red-bg); color:var(--red) }
	.pill.shipped { background:var(--blue-bg); color:var(--blue) }
	.pill.delivered { background:var(--green-bg); color:var(--green) }

	img.thumb { width:46px; height:46px; object-fit:cover; border-radius:9px;
		background:#f4efe9; display:block }
	.mut { color:var(--muted); font-size:12px }

	/* login */
	body.login { display:block }
	body.login .wrap { min-height:100vh; display:flex; align-items:center; justify-content:center;
		background:linear-gradient(160deg,#f1e5d7 0%,#e6d3bc 55%,#d9bfa1 100%) }
	.login-card { background:var(--card); border:1px solid #e8d5bd; width:370px; padding:40px 34px;
		border-radius:20px; box-shadow:0 16px 50px rgba(60,40,25,.2) }
	.login-card .logo { text-align:center }
	.login-card .logo img { height:38px; width:auto }
	.login-card .logo small { display:block; font-size:10px; letter-spacing:.22em; color:var(--muted);
		font-weight:600; margin-top:10px }

	@media (max-width:760px) {
		body { display:block }
		aside { width:100%; height:auto; position:static; flex-direction:row; align-items:center; padding:0 10px }
		aside .brand { padding:12px 10px; border-bottom:0 }
		aside .brand img { height:24px }
		aside .brand small { display:none }
		aside nav { flex-direction:row; flex:1; padding:6px }
		aside nav a svg { display:none }
		aside .bottom { margin:0; border:0; padding:6px }
		main { padding:18px 14px }
	}
</style></head>
<body class="<?= is_admin() ? '' : 'login' ?>">
<?php if ( is_admin() ): ?>
<aside>
	<div class="brand">
		<img src="http://localhost:3000/wp-uploads/2026/03/Barelyn-Logo-1-1-1.png" alt="BARELYN">
		<small>ADMIN PANEL</small>
	</div>
	<nav>
		<a href="index.php" class="<?= $active === 'dashboard' ? 'on' : '' ?>">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
			Dashboard</a>
		<a href="products.php" class="<?= $active === 'products' ? 'on' : '' ?>">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>
			Products</a>
		<a href="orders.php" class="<?= $active === 'orders' ? 'on' : '' ?>">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4H6z"/><path d="M4 6h16"/><path d="M9 10a3 3 0 0 0 6 0"/></svg>
			Orders</a>
	</nav>
	<div class="bottom">
		<form method="post" action="index.php" style="margin:0">
			<?php csrf_field(); ?>
			<button type="submit" name="logout" value="1" style="all:unset;cursor:pointer;color:var(--muted);display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:9px;font-size:13px;font-weight:500;width:100%;box-sizing:border-box">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
				Log out</button>
		</form>
	</div>
</aside>
<?php endif; ?>
<main>
<?php }

function page_foot(): void {
	echo '</main></body></html>';
}

/* ---------- description <-> plain text (admin never sees raw HTML) ---------- */

function html_to_text( string $html ): string {
	$t = preg_replace( '#<li[^>]*>#i', '- ', $html );
	$t = preg_replace( '#</(p|h2|h3|h4|ul|ol|li)>#i', "\n", $t );
	$t = preg_replace( '#<(p|ul|ol|h2|h3|h4)[^>]*>#i', "\n", $t );
	$t = preg_replace( '#<br\s*/?>#i', "\n", $t );
	$t = strip_tags( $t );
	$t = html_entity_decode( $t, ENT_QUOTES, 'UTF-8' );
	return trim( (string) preg_replace( "/\n{3,}/", "\n\n", $t ) );
}

function text_to_html( string $text ): string {
	$text = trim( $text );
	if ( $text === '' ) return '';
	$out = '';
	$inList = false;
	foreach ( preg_split( '/\r?\n/', $text ) as $line ) {
		$l = trim( $line );
		if ( $l === '' ) {
			if ( $inList ) { $out .= '</ul>'; $inList = false; }
			continue;
		}
		if ( str_starts_with( $l, '- ' ) ) {
			if ( ! $inList ) { $out .= '<ul>'; $inList = true; }
			$out .= '<li>' . htmlspecialchars( substr( $l, 2 ), ENT_QUOTES ) . '</li>';
		} else {
			if ( $inList ) { $out .= '</ul>'; $inList = false; }
			$out .= '<p>' . htmlspecialchars( $l, ENT_QUOTES ) . '</p>';
		}
	}
	if ( $inList ) $out .= '</ul>';
	return $out;
}
