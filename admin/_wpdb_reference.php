<?php

/**
 * https://developer.wordpress.org/reference/classes/wpdb/
 *
 * wpdb::flush()
 * Kill cached query results
 * https://developer.wordpress.org/reference/classes/wpdb/flush/
 *
 * wpdb::prepare(
 *   string $query,
 *   array|mixed $args
 * )
 * Prepares a SQL query for safe execution. Uses sprintf()-like syntax
 * https://developer.wordpress.org/reference/classes/wpdb/prepare/
 *
 * wpdb::query(
 *   string $query
 * )
 * Perform a MySQL database query, using current database connection
 * https://developer.wordpress.org/reference/classes/wpdb/query/
 *
 * wpdb::get_row(
 *   string|null $query = null,
 *   string $output = OBJECT,
 *   int $y
 * )
 * Retrieve one row from the database
 * https://developer.wordpress.org/reference/classes/wpdb/get_row/
 *
 * wpdb::get_results(
 *   string $query = null,
 *   string $output = OBJECT
 * )
 * Retrieve an entire SQL result set from the database (i.e., many rows)
 * https://developer.wordpress.org/reference/classes/wpdb/get_results/
 *
 * wpdb::insert(
 *   string $table,
 *   array $data,
 *   array|string $format = null
 * )
 * Insert a row into a table
 * https://developer.wordpress.org/reference/classes/wpdb/insert/
 *
 * wpdb::update(
 *   string $table,
 *   array $data,
 *   array $where,
 *   array|string $format = null,
 *   array|string $where_format = null
 * )
 * Update a row in the table
 * https://developer.wordpress.org/reference/classes/wpdb/update/
 *
 * wpdb::replace(
 *   string $table,
 *   array $data,
 *   array|string $format = null
 * )
 * Replace a row into a table
 * https://developer.wordpress.org/reference/classes/wpdb/replace/
 *
 * wpdb::delete(
 *   string $table,
 *   array $where,
 *   array|string $where_format = null
 * )
 * Delete a row in the table
 * https://developer.wordpress.org/reference/classes/wpdb/delete/
 */
