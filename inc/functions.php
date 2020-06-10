<?php

if( ! defined( 'ABSPATH' ) ) { die(); }


/**
 * Remove line breaks and double whitespaces from string.
 * 
 * @since 2020.06.11
 * 
 * @ignore @.param/return !!
 */
function linkfinder_trim( string $string, string $delim = ' ' )
{
  return trim( preg_replace( array( '/\s+/', '/\t+/', '/(\r|\r?\n)+/' ), $delim, $string ) );
}