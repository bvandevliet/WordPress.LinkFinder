<?php

namespace Linkfinder;

defined( 'ABSPATH' ) || exit;


/**
 * Class for updating hyperlinks in posts.
 *
 * @since 00.00.00
 */
class Link_Elem
{
  /**
   * Regular expression to match hyperlinks.
   */
  public const LINKREGEX = '/(<\s*([^>\s]+?)\b[^>]*?\b(href|src)\s*=\s*[\'"])([^\'"]*?)([\'"][^>]*?>)/ims';

  /**
   * The full original link element.
   */
  public string $link_elem_original;

  /**
   * The type of link element.
   */
  public string $link_elem_type;

  /**
   * The part of the link element before the URL.
   */
  public string $link_elem_before_url;

  /**
   * The part of the link element after the URL.
   */
  public string $link_elem_after_url;

  /**
   * The URL attribute of the link element.
   */
  public string $link_elem_url_attr;

  /**
   * The URL value of the link element.
   */
  public string $link_elem_url_value;

  /**
   * Create a new instance of the class.
   */
  private function __construct()
  {
  }

  /**
   * Create a new instance from a set of matches.
   *
   * @param array $matches The matches from the regular expression.
   */
  private static function from_matches( array $matches ) : self
  {
    $instance = new self();

    $instance->link_elem_original   = $matches[0];
    $instance->link_elem_type       = $matches[2];
    $instance->link_elem_before_url = $matches[1];
    $instance->link_elem_after_url  = $matches[5];
    $instance->link_elem_url_attr   = $matches[3];
    $instance->link_elem_url_value  = $matches[4];

    return $instance;
  }

  /**
   * Create an array of instances from an input string.
   *
   * @param string $input The input string containing link elements.
   *
   * @return Link_Elem[] An array of link elements.
   */
  public static function multi_from_input( string $input ) : array
  {
    preg_match_all( self::LINKREGEX, $input, $matches, PREG_SET_ORDER );

    $link_elems = array();

    foreach ( $matches as $match )
    {
      $link_elems[] = self::from_matches( $match );
    }

    return $link_elems;
  }

  /**
   * Create a new instance from an input string.
   *
   * @param string $input The input string containing a single link element.
   *
   * @return self|null The link element or null if no match was found.
   */
  public static function single_from_input( string $input ) : self|null
  {
    $result = preg_match( self::LINKREGEX, $input, $matches );

    if ( $result !== 1 )
    {
      return null;
    }

    return self::from_matches( $matches );
  }
}
