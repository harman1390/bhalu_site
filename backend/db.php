<?php
/** PDO factory for the shop database. */

/** Pass '' to connect without a database (used by migrate.php bootstrap). */
function db( ?string $name = null ): PDO {
	static $pdo = null;
	$cfg = require __DIR__ . '/config.php';
	if ( $pdo === null || $name !== null ) {
		$d = $cfg['db'];
		$dsn = 'mysql:host=' . $d['host'] . ';charset=' . $d['charset']
			. ( $name === '' ? '' : ';dbname=' . ( $name ?? $d['name'] ) );
		$p = new PDO( $dsn, $d['user'], $d['pass'], array(
			PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
			PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
			PDO::ATTR_EMULATE_PREPARES   => false,
		) );
		if ( $name === null ) $pdo = $p;
		return $p;
	}
	return $pdo;
}
