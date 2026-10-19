<?php
/**
 * Minimal mailer — no dependencies.
 * Order of attempts: SMTP (if configured) -> mail() -> append to mail log.
 * Never throws; email failures must not break checkout.
 */

require_once __DIR__ . '/helpers.php';

function send_mail( string $to, string $subject, string $html ): bool {
	// Strip CRLF + validate — $to is interpolated into mail() and SMTP commands.
	$to = str_replace( array( "\r", "\n" ), '', trim( $to ) );
	if ( ! filter_var( $to, FILTER_VALIDATE_EMAIL ) ) return false;

	$cfg = cfg()['mail'];
	$from = $cfg['from_name'] . ' <' . $cfg['from'] . '>';

	$headers = "MIME-Version: 1.0\r\n";
	$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
	$headers .= 'From: ' . $from . "\r\n";

	try {
		if ( ! empty( $cfg['smtp']['host'] ) ) {
			if ( smtp_send( $to, $subject, $html, $cfg ) ) return true;
		}
		if ( @mail( $to, '=?UTF-8?B?' . base64_encode( $subject ) . '?=', $html, $headers ) ) return true;
	} catch ( Throwable $e ) {
		/* fall through to log */
	}

	// Dev fallback: never lose a message.
	@file_put_contents(
		$cfg['log'],
		"\n===== " . date( 'Y-m-d H:i:s' ) . " =====\nTo: $to\nSubject: $subject\n$html\n",
		FILE_APPEND
	);
	return false;
}

/** Bare-bones SMTP client (AUTH LOGIN, STARTTLS/ssl). */
function smtp_send( string $to, string $subject, string $html, array $cfg ): bool {
	$s = $cfg['smtp'];
	$host = $s['secure'] === 'ssl' ? 'ssl://' . $s['host'] : $s['host'];
	$fp = @stream_socket_client( "$host:{$s['port']}", $errno, $errstr, 10 );
	if ( ! $fp ) return false;

	$read = function () use ( $fp ) {
		$out = '';
		while ( $line = fgets( $fp, 512 ) ) {
			$out .= $line;
			if ( isset( $line[3] ) && $line[3] === ' ' ) break;
		}
		return $out;
	};
	$cmd = function ( string $c ) use ( $fp, $read ) {
		fwrite( $fp, $c . "\r\n" );
		return $read();
	};

	$ok = true;
	$read();
	$cmd( 'EHLO ' . ( $s['host'] ) );
	if ( $s['secure'] === 'tls' ) {
		$cmd( 'STARTTLS' );
		if ( ! stream_socket_enable_crypto( $fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT ) ) $ok = false;
		else $cmd( 'EHLO ' . $s['host'] );
	}
	if ( $ok && $s['user'] !== '' ) {
		$cmd( 'AUTH LOGIN' );
		$cmd( base64_encode( $s['user'] ) );
		$r = $cmd( base64_encode( $s['pass'] ) );
		if ( strpos( $r, '235' ) === false ) $ok = false;
	}
	if ( $ok ) {
		$cmd( 'MAIL FROM:<' . $cfg['from'] . '>' );
		$cmd( 'RCPT TO:<' . $to . '>' );
		$cmd( 'DATA' );
		$msg  = 'From: ' . $cfg['from_name'] . ' <' . $cfg['from'] . ">\r\n";
		$msg .= "To: <$to>\r\n";
		$msg .= 'Subject: =?UTF-8?B?' . base64_encode( $subject ) . "?=\r\n";
		$msg .= "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n$html\r\n.";
		$r = $cmd( $msg );
		$ok = strpos( $r, '250' ) !== false;
	}
	$cmd( 'QUIT' );
	fclose( $fp );
	return $ok;
}

/* ---------- transactional templates ---------- */

function money_fmt( int $paise ): string {
	return cfg()['currency_symbol'] . number_format( $paise / 100, 0 );
}

function mail_order_received( PDO $pdo, int $oid ): void {
	$st = $pdo->prepare( 'SELECT * FROM orders WHERE id = ?' );
	$st->execute( array( $oid ) );
	$o = $st->fetch();
	if ( ! $o ) return;
	$bill = json_decode( $o['billing_json'] ?? '{}', true );

	$items = $pdo->prepare(
		'SELECT oi.quantity, oi.price, p.name FROM order_items oi
		 JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?'
	);
	$items->execute( array( $oid ) );

	$rows = '';
	foreach ( $items->fetchAll() as $it ) {
		$rows .= '<tr><td style="padding:6px 0">' . htmlspecialchars( $it['name'] ) . ' × ' . (int) $it['quantity']
			. '</td><td style="text-align:right">' . money_fmt( (int) $it['price'] * (int) $it['quantity'] ) . '</td></tr>';
	}

	$name  = htmlspecialchars( $bill['first_name'] ?? 'there' );
	$total = money_fmt( (int) $o['total'] );
	$html  = "<div style='font-family:sans-serif;max-width:520px'>
		<h2 style='color:#b5704a'>Thanks, $name — order #$oid received</h2>
		<p>We're getting your order ready.</p>
		<table style='width:100%;font-size:14px'>$rows</table>
		<p style='border-top:1px solid #eee;padding-top:10px'><b>Total: $total</b></p>
		<p style='color:#888;font-size:12px'>— BARELYN</p></div>";

	if ( ! empty( $bill['email'] ) ) {
		send_mail( $bill['email'], "Order #$oid received — BARELYN", $html );
	}
	send_mail( cfg()['mail']['admin'], "New order #$oid — $total", $html );
}

function mail_order_paid( PDO $pdo, int $oid ): void {
	$st = $pdo->prepare( 'SELECT * FROM orders WHERE id = ?' );
	$st->execute( array( $oid ) );
	$o = $st->fetch();
	if ( ! $o ) return;
	$bill = json_decode( $o['billing_json'] ?? '{}', true );
	if ( empty( $bill['email'] ) ) return;

	$name  = htmlspecialchars( $bill['first_name'] ?? 'there' );
	$total = money_fmt( (int) $o['total'] );
	$html  = "<div style='font-family:sans-serif;max-width:520px'>
		<h2 style='color:#b5704a'>Payment confirmed — order #$oid</h2>
		<p>Hi $name, we've received your payment of <b>$total</b>. Your order is being packed.</p>
		<p style='color:#888;font-size:12px'>— BARELYN</p></div>";

	send_mail( $bill['email'], "Payment confirmed — order #$oid", $html );
}

function mail_welcome( string $email, string $name ): void {
	$n = htmlspecialchars( $name ?: 'there' );
	send_mail( $email, 'Welcome to BARELYN',
		"<div style='font-family:sans-serif;max-width:520px'>
		<h2 style='color:#b5704a'>Welcome, $n</h2>
		<p>Your account is ready — happy shopping.</p>
		<p style='color:#888;font-size:12px'>— BARELYN</p></div>" );
}
