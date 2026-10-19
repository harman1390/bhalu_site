<?php
/** POST /auth/token { username, password } — jwt-auth compatible response.
 *  POST /auth/register { name, email, phone, password } — create customer. */

$action = trim( substr( $path, strlen( 'auth/' ) ), '/' );
$in     = body();

if ( $method === 'POST' && $action === 'token' ) {
	rate_limit( 'login', 10, 300 ); // 10 attempts / 5 min per IP

	$user = trim( (string) ( $in['username'] ?? '' ) );
	$pass = (string) ( $in['password'] ?? '' );
	if ( $user === '' || $pass === '' ) fail( 'jwt_auth_empty_credentials', 'Username and password are required.', 403 );

	$st = $pdo->prepare( 'SELECT * FROM users WHERE email = ? OR username = ?' );
	$st->execute( array( $user, $user ) );
	$u = $st->fetch();
	if ( ! $u || ! password_verify( $pass, $u['password_hash'] ) ) {
		fail( 'jwt_auth_failed', 'Incorrect username or password.', 403 );
	}

	$token = jwt_encode( array( 'sub' => (int) $u['id'], 'email' => $u['email'] ), cfg()['jwt_secret'] );
	json_out( array(
		'token'             => $token,
		'user_email'        => $u['email'],
		'user_nicename'     => $u['username'],
		'user_display_name' => $u['name'],
	) );
}

if ( $method === 'POST' && $action === 'register' ) {
	rate_limit( 'register', 5, 600 ); // 5 signups / 10 min per IP
	require_once __DIR__ . '/../mailer.php';

	$name  = trim( (string) ( $in['name'] ?? '' ) );
	$email = trim( (string) ( $in['email'] ?? '' ) );
	$phone = preg_replace( '/\D/', '', (string) ( $in['phone'] ?? '' ) );
	$pass  = (string) ( $in['password'] ?? '' );

	if ( ! $email || ! filter_var( $email, FILTER_VALIDATE_EMAIL ) ) {
		fail( 'bad_email', 'Please enter a valid email address.', 400 );
	}
	if ( strlen( $phone ) !== 10 ) fail( 'bad_phone', 'Please enter a valid 10-digit mobile number.', 400 );
	if ( strlen( $pass ) < 6 ) fail( 'bad_password', 'Password must be at least 6 characters.', 400 );

	$st = $pdo->prepare( 'SELECT id FROM users WHERE email = ?' );
	$st->execute( array( $email ) );
	if ( $st->fetch() ) fail( 'exists', 'An account already exists with this email.', 409 );

	$username = strstr( $email, '@', true );
	$pdo->prepare( 'INSERT INTO users (username, email, name, phone, password_hash) VALUES (?,?,?,?,?)' )
		->execute( array( $username, $email, $name, $phone, password_hash( $pass, PASSWORD_DEFAULT ) ) );
	mail_welcome( $email, $name );

	json_out( array( 'status' => 'created', 'user_id' => (int) $pdo->lastInsertId() ) );
}

fail( 'rest_no_route', 'No route was found matching the URL and request method', 404 );
