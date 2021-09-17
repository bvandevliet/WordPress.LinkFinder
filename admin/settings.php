<?php

defined( 'ABSPATH' ) || exit;


/**
 * @link https://stackoverflow.com/questions/17743337/access-wordpress-functions-in-standalone-plugin-page
 *
 * @link https://developer.wordpress.org/?s=Requests_Response
 * @link https://developer.wordpress.org/?s=WP_HTTP_Requests_Response
 */


/**
 * Register setting sections and fields.
 *
 * @since 2020.06.11
 *
 * @link https://developer.wordpress.org/plugins/settings/
 */
add_action(
  'admin_init',
  function ()
  {
    /**
     * The main section.
     *
     * @since 2020.06.11
     */
    add_settings_section(
      'linkfinder_section', // $id*
      null, // $title*
      function ()
      {
        ?>
        <p>
          <?php _e( 'Find and repair broken links.', 'linkfinder' ); ?>
          <?php
          _e(
            'Links to admin-pages are ignored.<br>
            If a potential improvement could be made to an internal link, it is marked yellow. All broken links will be marked red.<br>
            <strong>Please note that sometimes links may appear false-positive, always follow the link manually to confirm before making changes!</strong>',
            'linkfinder'
          );
          ?>
        </p>

        <p id="linkfinder_statusbar"><b><span></span></b> (<span></span>) &nbsp;|&nbsp; <b><span></span></b></p>
        <table id="linkfinder_table" class="linkfinder_table">
          <tr>
            <th><?php _e( 'Code', 'linkfinder' ); ?></th>
            <th><?php _e( 'Message', 'linkfinder' ); ?></th>
            <th><?php _e( 'Post title (edit-link)', 'linkfinder' ); ?></th>
            <th><?php _e( 'Post type', 'linkfinder' ); ?></th>
            <th><?php _e( 'Element', 'linkfinder' ); ?></th>
            <th><?php _e( 'Original hyperlink', 'linkfinder' ); ?></th>
            <th></th>
            <th><?php _e( 'New hyperlink', 'linkfinder' ); ?></th>
          </tr>
        </table>

        <script>
          linkfinder_process_links(
            <?php echo json_encode( Linkfinder_Manage_Site_Hyperlinks::retrieve_hyperlinks() ); ?>,
            '<?php echo esc_js( home_url() ); ?>',
            '<?php echo esc_js( admin_url() ); ?>',
            '<?php echo esc_js( admin_url( 'admin-ajax.php?action=linkfinder_process_links' ) ); ?>'
          )
        </script>

        <?php
      }, // $callback*
      'linkfinder' // $page*
    );
  }
);


/**
 * AJAX hook to include the WordPress functions in a standalone php file.
 *
 * @since 2020.06.11
 */
add_action(
  'wp_ajax_linkfinder_process_links',
  function ()
  {
    if (
      ! wp_doing_ajax() ||
      ! is_user_logged_in()
    ) {
      wp_die(
        '',
        '',
        array(
          'response' => 401,
          'exit'     => true,
        )
      );
    }

    /**
     * The link-validator sets the global $response_code to use in wp_die() ..
     */
    require dirname( __FILE__ ) . '/../inc/link-validator_wp-api.php';

    // die();
    wp_die(
      '',
      '',
      array(
        'response' => intval( $response_code ),
        'exit'     => true,
      )
    );
  }
);


/**
 * Filter the submit button to provide the option for resolving while either allowing or avoiding self-pings.
 *
 * @since 2020.06.11
 *
 * @ignore use `ob_start()` and `ob_get_clean()`?
 */
add_filter(
  'linkfinder_submit_button',
  function ()
  {
    $submit_button  = '<p class="submit">';
    $submit_button .= '<input type="submit" class="button button-primary" name="submit" value="' . esc_attr__( 'Apply changes', 'linkfinder' ) . '" />';
    $submit_button .= '<br><br>' . __( 'OR apply changes while ..', 'linkfinder' ) . '<br><br>';
    $submit_button .= '<input type="submit" class="button button-secondary" name="allow_self_pings" value=".. ' . esc_attr__( 'allowing self-pings (default)', 'linkfinder' ) . '" />';
    $submit_button .= '&nbsp;';
    $submit_button .= '<input type="submit" class="button button-secondary" name="avoid_self_pings" value=".. ' . esc_attr__( 'avoiding self-pings', 'linkfinder' ) . '" />';
    $submit_button .= '<br><br>(<a href="https://make.wordpress.org/support/user-manual/building-your-wordpress-community/trackbacks-and-pingbacks/#can-i-stop-self-pings" target="_blank" rel="noopener noreferrer">' . __( 'About self-pings', 'linkfinder' ) . '</a>)<br><br>';
    $submit_button .= '<strong>' . __( 'Changes are irreversable!', 'linkfinder' ) . '</strong>';
    $submit_button .= '</p>';

    return $submit_button;
  }
);


/**
 * After authenticated page submit.
 *
 * @since 2020.06.11
 */
function linkfinder_after_page_submit_cb()
{
  /**
   * Update given hyperlinks in database.
   */
  $success_POST = Linkfinder_Manage_Site_Hyperlinks::update_from_post_request();

  /**
   * Check if internal url should be formatted absolute or relative.
   */
  $success_SELFPINGS = true;
  if (
    ! empty( $_POST['allow_self_pings'] ) ||
    ! empty( $_POST['avoid_self_pings'] )
  ) {
    $success_SELFPINGS = Linkfinder_Manage_Site_Hyperlinks::allow_selfpings( empty( $_POST['avoid_self_pings'] ) );
  }

  /**
   * Set error messages.
   */
  if (
    ! $success_POST ||
    ! $success_SELFPINGS
  ) {
    add_settings_error(
      'linkfinder',
      'linkfinder_errormsg',
      __( 'Something went wrong, not all hyperlinks were updated! Remaining issues will reappear in the list.', 'linkfinder' )
    );
  } else {
    add_settings_error(
      'linkfinder',
      'linkfinder_successmsg',
      __( 'Hyperlinks updated. If there are any remaining issues, they will (re)appear in the list.', 'linkfinder' ),
      'updated'
    );
  }
}
