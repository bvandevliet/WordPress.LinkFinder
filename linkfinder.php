<?php

/**
 * Plugin Name:       Link Finder
 * Version:           [[VERSION]]
 * Requires at least: 6.4
 * Tested up to:      6.7
 * Requires PHP:      8.2
 * Description:       Find and repair broken links throughout your website.
 * Author:            Bob Vandevliet
 * Author URI:        https://www.bvandevliet.nl/
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl.html
 * Text Domain:       linkfinder
 *
 * @ignore TODO: Add link text table column.
 * @ignore TODO: Add option to prevent search engines from following a link.
 * @ignore TODO: Add option to unlink, remove the link but keep the link text.
 */

defined( 'ABSPATH' ) || exit;

// Define plugin constants.
define( 'LINKFINDER_PLUGIN_VERSION', '[[VERSION]]' );
define( 'LINKFINDER_ABSPATH', trailingslashit( __DIR__ ) );
define( 'LINKFINDER_URL', plugin_dir_url( __FILE__ ) );

// Composer autoload.
require __DIR__ . '/vendor/autoload.php';


/**
 * Append subtile call-to-action write review link below plugin at the plugins admin page.
 *
 * @since 2021.11.29
 */
add_filter(
  'plugin_action_links_' . plugin_basename( __FILE__ ),
  function ( $actions )
  {
    array_unshift(
      $actions,
      '<a href="' . admin_url( 'tools.php?page=linkfinder' ) . '">' . __( 'Find them!', 'linkfinder' ) . '</a>',
      '<a href="https://wordpress.org/plugins/link-finder/#reviews" target="_blank" rel="noopener">' . __( 'Rate', 'linkfinder' ) . ' &#9733;</a>'
    );

    return $actions;
  }
);


/**
 * Add the plugin menu's and pages (admin_menu).
 *
 * @since 2020.06.11
 *
 * @link https://developer.wordpress.org/plugins/administration-menus/
 */
add_action(
  'admin_menu',
  function ()
  {
    $hookname = add_management_page(
      __( 'Link Finder', 'linkfinder' ),
      __( 'Link Finder', 'linkfinder' ),
      'edit_pages',
      'linkfinder',
      function ()
      {
        // Print submit messages.
        settings_errors( 'linkfinder' );

        ?>
        <div class="wrap linkfinder-page">
          <h1>Link Finder</h1>
          <form action="<?php echo htmlspecialchars( $_SERVER['REQUEST_URI'] ); ?>" method="post">
            <?php
            // Output security fields for the registered setting.
            settings_fields( 'linkfinder' );
            // Output setting sections and their fields.
            do_settings_sections( 'linkfinder' );

            /**
             * Filter the submit button.
             *
             * @since 2020.06.11
             */
            echo apply_filters( 'linkfinder_submit_button', get_submit_button( __( 'Save changes', 'linkfinder' ) ) );
            ?>
          </form>
        </div>
        <?php
      }
    );

    /**
     * After submit callback.
     *
     * @since 2020.06.11
     */
    add_action(
      'load-' . $hookname,
      function ()
      {
        if ( $_SERVER['REQUEST_METHOD'] !== 'POST' )
        {
          return;
        }

        // Check if request is valid and permitted.
        if ( empty( $_POST['_wpnonce'] ) || empty( $_POST['action'] ) || wp_verify_nonce( $_POST['_wpnonce'], 'linkfinder-options' ) === false )
        {
          add_settings_error(
            'linkfinder',
            'linkfinder_invalidpost',
            __( 'Something went wrong, please try again!', 'linkfinder' )
          );
          return;
        }

        linkfinder_after_page_submit_cb();
      }
    );
  }
);


/**
 * Enqueue admin styles and scripts.
 *
 * @since 2020.06.11
 * @since 2021.10.29 Dynamic versioning.
 */
add_action(
  'admin_enqueue_scripts',
  function ()
  {
    if ( isset( $_GET['page'] ) && $_GET['page'] === 'linkfinder' )
    {
      wp_enqueue_style( 'linkfinder_styles', plugin_dir_url( __FILE__ ) . 'assets/linkfinder-styles.css', array(), LINKFINDER_PLUGIN_VERSION );
      wp_enqueue_script( 'linkfinder_scripts', plugin_dir_url( __FILE__ ) . 'assets/linkfinder-scripts.js', array( 'jquery' ), LINKFINDER_PLUGIN_VERSION, false );
      wp_localize_script(
        'linkfinder_scripts',
        'translations',
        array(
          'dont_change' => __( '(don\'t change)', 'linkfinder' ),
          'follow_link' => __( 'Follow link to retrieve final URL ..', 'linkfinder' ),
        )
      );
    }
  }
);
