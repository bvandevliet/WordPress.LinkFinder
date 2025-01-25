<?php

namespace Linkfinder;

defined( 'ABSPATH' ) || exit;


/**
 * Class for updating hyperlinks in posts.
 *
 * @since 2020.06.11
 */
class Manage_Links
{
  /**
   * Retrieve hyperlinks throughout the website.
   *
   * @since 2020.06.11
   *
   * @global wpdb $wpdb
   *
   * @return array An array of post ID's with hyperlink information, see `let linkinfo`.
   *
   * @ignore TODO: In chunks of 10 or 20 posts to prevent database overload ..
   */
  public static function retrieve_hyperlinks()
  {
    global $wpdb;

    $results = $wpdb->get_results(
      "SELECT ID, post_title, post_name, post_type, post_status, post_content FROM {$wpdb->posts}
      WHERE
        post_status NOT IN ('auto-draft', 'private', 'trash') AND
        post_type NOT IN ('revision')"
    );

    // Build array with <a> tag strings.
    $postid_hyperlinks = array();

    foreach ( $results as $result )
    {
      // let linkinfo =
      $postid_hyperlinks[ $result->ID ] = array(
        'post_title'  => $result->post_title,
        'post_name'   => $result->post_name,
        'post_type'   => $result->post_type,
        'post_status' => $result->post_status,
        'hyperlinks'  => \Linkfinder\Link_Elem::multi_from_input( $result->post_content ),
      );
    }

    return $postid_hyperlinks;
  }

  /**
   * Update hyperlinks from a POST request.
   *
   * The `$_POST` parameters must contain "oldlink_elem-{post_id}-{link_index}" and "newlink-{post_id}-{link_index}".
   *
   * @since 2020.06.11
   *
   * @return bool True on success, false if an error occured.
   */
  public static function update_from_post_request()
  {
    if ( $_SERVER['REQUEST_METHOD'] !== 'POST' )
    {
      return false;
    }

    $newlinks = array();

    // Fetch hyperlinks to replace as defined by the user.
    foreach ( $_POST as $parameter => $value )
    {
      // Sanitize $parameter and $value.
      $parameter = sanitize_key( $parameter );
      $new_link  = esc_url_raw( linkfinder_trim( wp_unslash( $value ) ) );

      // Verify whether the parameter is relevant for further processing.
      if ( preg_match( '/^newlink-(\d+)-(\d+)$/i', $parameter, $matches_post ) && ! empty( $new_link )/* && false !== wp_parse_url( $new_link )*/ )
      {
        // For some strange reasons, it could occur that an expected POST parameter doesn't exist,
        // then just skip to the next iteration without pushing anyting to the array.
        try
        {
          // Sanitize $oldlink_elem.
          $oldlink_elem = wp_kses_post( linkfinder_trim( wp_unslash( $_POST[ 'oldlink_elem-' . $matches_post[1] . '-' . $matches_post[2] ] ) ) );
        }
        catch ( Exception )
        {
          continue;
        }

        // Validate and create the replacing html element: $newlink_elem.
        //
        // This is done using preg_match() with segment patterns according to the earlier preg_match_all().
        // Also, only the hyperlink segment of $oldlink_elem and $newlink_elem is allowed to be different.
        //
        // If for some reason an invalid html element passes the checks, it should not replace anything, as there should be no matches.
        // If it does match something in the replace query, it already was incorrectly stored in the database in the first place.
        // This module is not intended to repair already existing errors. Always only the hyperlink attribute values will be replaced.
        $oldlink = \Linkfinder\Link_Elem::single_from_input( $oldlink_elem );

        if (
          empty( $oldlink ) ||
          empty( $oldlink->link_elem_original ) ||
          empty( $oldlink->link_elem_before_url ) ||
          empty( $oldlink->link_elem_after_url ))
        {
          continue;
        }

        $newlink_elem = wp_kses_post( $oldlink->link_elem_before_url . $new_link . $oldlink->link_elem_after_url );

        $newlinks[] = array(
          'postid'       => $matches_post[1],
          'oldlink_elem' => $oldlink_elem,
          'newlink_elem' => $newlink_elem,
        );
      }
    }

    return self::update_database( $newlinks );
  }

  /**
   * Update internal hyperlinks as absolute url (self-pings allowed) or as relative url (self-pings avoided).
   *
   * @since 2020.06.11
   *
   * @param bool $allow Wheter to allow or avoid internal hyperlinks to trigger self-pings.
   * @return bool True on success, false if an error occured.
   */
  public static function allow_selfpings( bool $allow = true )
  {
    $newlinks = array();

    $home_url    = rtrim( home_url(), '/' );
    $home_domain = preg_replace( '/^(?:https?:\/\/)?(?:www\.)?/i', '', $home_url );

    foreach ( self::retrieve_hyperlinks() as $postid => $linkinfo )
    {
      /**
       * @var \Linkfinder\Link_Elem[]
       */
      $hyperlinks = $linkinfo['hyperlinks'];

      foreach ( $hyperlinks as $hyperlink )
      {
        // Sanitize $oldlink_elem and the hyperlink.
        $oldlink_elem = wp_kses_post( linkfinder_trim( $hyperlink->link_elem_original ) );
        $new_link     = esc_url_raw( linkfinder_trim( $hyperlink->link_elem_url_value ) );

        // Rewrite the hyperlinks.
        $new_link = preg_replace( '/^(\/|\#|\?)|^(?:https?:\/\/)?(?:www\.)?(?:' . preg_quote( $home_domain, '/' ) . ')(\/|\#|\?)?/i', $allow ? $home_url . '$1$2' : '$1$2', $new_link, -1, $count );

        if ( $allow && preg_match( '/^[a-z0-9-]+?\.php/i', $new_link ) )
        {
          $count++;
          $new_link = $home_url . '/' . $linkinfo['post_name'] . '/' . $new_link;
        }

        // If nothing was replaced, link is not internal, skip to the next iteration without pushing anything to the array.
        if ( $count === 0 )
        {
          continue;
        }

        // Create the replacing html element: $newlink_elem.
        $newlink_elem = wp_kses_post( $hyperlink->link_elem_before_url . $new_link . $hyperlink->link_elem_after_url );

        $newlinks[] = array(
          'postid'       => $postid,
          'oldlink_elem' => $oldlink_elem,
          'newlink_elem' => $newlink_elem,
        );
      }
    }

    return self::update_database( $newlinks );
  }

  /**
   * Replace given links in the database.
   *
   * Made private to restrict free database write access.
   *
   * @since 2020.06.11
   *
   * @global wpdb $wpdb
   *
   * @param array $newlinks {
   *  @type array $newlink {
   *    @type string  $oldlink_elem
   *    @type string  $newlink_elem
   *    @type int     $postid
   *  }, ...
   * }
   * @return bool True on success, false if an error occured.
   */
  private static function update_database( $newlinks )
  {
    global $wpdb;

    $success = true;

    foreach ( $newlinks as $newlink )
    {
      $results = $wpdb->query(
        $wpdb->prepare(
          "UPDATE {$wpdb->posts}
          SET post_content = REPLACE(post_content, %s, %s)
          WHERE id = %d;",
          array(
            $newlink['oldlink_elem'],
            $newlink['newlink_elem'],
            $newlink['postid'],
          )
        )
      );

      if ( $results === false )
      {
        $success = false;
      }
    }

    return $success;
  }
}
