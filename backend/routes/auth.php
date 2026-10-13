<?php
/** POST /auth/token { username, password } — jwt-auth compatible response. */

$action = trim( substr( $path, strlen( 'auth/' ) ), '/' );
$in     = body();

if ( $method === 'POST' && $action === 'token' ) {
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

fail( 'rest_no_route', 'No route was found matching the URL and request method', 404 );
