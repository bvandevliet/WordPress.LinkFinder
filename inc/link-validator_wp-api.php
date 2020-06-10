<?php

if( ! defined( 'ABSPATH' ) ) { die(); }

if(
  ! wp_doing_ajax() ||
  ! is_user_logged_in()
) {
  wp_die( '', '', array( 'response' => 401, 'exit' => true ) );
}

$response_code = 200;


/**
 * Using the native WordPress method ..
 */

header( 'Content-Type: text/plain' );

if(
  ! empty( $_POST['link'] )
) {
  $url = esc_url( $_POST['link'] );
  $follow = false;

  if(
    ! empty( $_POST['follow'] ) &&
    (
      $_POST['follow'] == true ||
      $_POST['follow'] == 'true'
    )
  ) {
    $follow = true;

    add_action( 'requests-requests.after_request', function( $Requests_Response )
    {
      /**
       * The CURLINFO_EFFECTIVE_URL equivalent is available in the below property.
       */
      echo $Requests_Response->url;
    } );
  }

  $response = wp_remote_get( $url, array(
    // 'method' => 'GET', // default..
    'redirection' => $follow ? 20 : 0,
    'blocking' => true,
    'user-agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0',
  ) );

  if(
    ! $follow
  ) {
    if(
      is_wp_error( $response ) ||
      ! $response_code = wp_remote_retrieve_response_code( $response )
    ) {
      $response_code = 0;
    }
  }
}
else {
  $response_code = 0;
  echo 'NO_LINK_PROVIDED';
}

// http_response_code( $response_code );
