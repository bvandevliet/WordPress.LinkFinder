<?php

defined( 'ABSPATH' ) || exit;


/**
 * Remove line breaks and double whitespaces from string.
 */
function linkfinder_trim( string $string, string $delim = ' ' )
{
  return trim( preg_replace( '/([\s\t\v\0\r]|\r?\n)+/', $delim, $string ) );
}
