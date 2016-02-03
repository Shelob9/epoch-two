<?php
/**
 * @package   Epoch
 * @author    Postmatic
 * @license   GPL-2.0+
 * @link
 * Copyright 2015 Transitive, Inc.
 *
 * @wordpress-plugin
 *
 * Plugin Name: Epoch
 * Version: 2.0.0-a-1
 * Plugin URI:  http://gopostmatic.com/epoch
 * Description: Native commenting made realtime, mobile, CDN and Cache friendly, and full of SEO mojo as well. Commenting perfected.
 * Author:      Postmatic
 * Author URI:  https://gopostmatic.com/
 * Text Domain: epoch
 * License:     GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Domain Path: /languages
 */

define('EPOCH_PATH',  plugin_dir_path( __FILE__ ) );
define('EPOCH_URL',  plugin_dir_url( __FILE__ ) );
define( 'EPOCH_VER', '2.0.0-a-1' );

if ( ! defined( 'EPOCH_ALT_COUNT_CHECK_MODE' ) ) {

	/**
	 * Whether to save comment counts to text files and attempt to use them to check comment counts.
	 *
	 * NOTE: Experimental. Do not use.
	 *
	 * @since 1.0.1
	 */
	define( 'EPOCH_ALT_COUNT_CHECK_MODE', false );

}

/**
 * Setup scripts/styles
 */
add_action( 'wp_enqueue_scripts', function(){
	wp_enqueue_script( 'jquery' );
	wp_enqueue_script( 'angularjs', '//cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.9/angular.min.js');
	wp_enqueue_script( 'angular-resource', '//cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.9/angular-resource.min.js' );
	wp_enqueue_script( 'angular-sanitize', '//cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.9/angular-sanitize.min.js' );
	wp_enqueue_script( 'lowdash', '//cdnjs.cloudflare.com/ajax/libs/lodash.js/4.1.0/lodash.min.js');
	wp_enqueue_script( 'epoch-two', EPOCH_URL . 'assets/js/front-end/epoch.js', array( 'angularjs' ) );
	$vars = array(
		'api'          => array(
			'root'     => esc_url_raw( rest_url() ),
			'posts'    => esc_url_raw( rest_url( '/wp/v2/posts/' ) ),
			'comments' => esc_url_raw( rest_url( '/wp/v2/comments/' ) ),
		),
		'nonce'        => wp_create_nonce( 'wp_rest' ),
		'translations' => epoch_translation(),
		'partials'     => esc_url_raw( EPOCH_URL . 'assets/partials/' ),
		'user'         => 0,

	);
	$logout_link = wp_logout_url();
	$current_url = get_permalink( get_post() );
	if( filter_var( $current_url, FILTER_VALIDATE_URL ) ){
		$logout_link = add_query_arg( 'redirect_to', $current_url, $logout_link );

	}

	$vars[ 'logout_link' ] = $logout_link;
	if ( 0 != get_current_user_id() ) {
		$vars[ 'user' ] = get_current_user_id();
	}
	wp_localize_script( 'epoch-two', 'EPOCH_VARS', $vars );
});

/**
 * Translation strings for front-end
 *
 * @return array
 */
function epoch_translation() {
	$translations = array(
		'awaiting_moderation' => esc_html__( 'Comment Awaiting Moderation', 'epoch' ),
		'approve' => esc_html__( 'Approve Comment', 'epoch' ),
		'unApprove' => esc_html__( 'Unapprove Comment', 'epoch' ),
		'trash' => esc_html__( 'Delete Comment', 'epoch' ),
		'spam' => esc_html__( 'Spam Comment', 'epoch' ),
		'reply' => esc_html__( 'Reply', 'epoch' ),
		'form' => array(
			'header' => esc_html__( 'Leave a Reply', 'epoch' ),
			'logged_in_aria_label' => esc_html__( 'Logged in as admin. Edit your profile.', 'epoch' ),
			'logged_in_message' => esc_html__( 'Logged in as: SHOULD SAY CURRENT USER NAME', 'epoch' ),
			'comment_label' =>esc_html__( 'Comment', 'epoch'),
			'submit_value' => esc_html__( 'Post Comment', 'epoch' ),
			'name' => esc_html__( 'Name', 'epoch' ),
			'email' => esc_html__( 'Email', 'epoch' ),
			'website' => esc_html__( 'Website', 'epoch' ),
			'email_not_pub' => esc_html__( 'Your email address will not be published.', 'epoch' ),
			'req_fields_are'  => esc_html__( 'Required fields are marked', 'epoch'),
			'cancel' => esc_html__( 'Cancel Reply', 'epoch' )
 		)
	);
	return $translations;
}

/**
 * Load our comments template file
 */
add_filter( 'comments_template', function(){
	return dirname( __FILE__ ) . '/assets/partials/initial.php';
});

/**
 * Setup our filters on epoch comment requests
 */
add_action( 'rest_api_init', function() {
	if( isset( $_GET[ 'epoch' ], $_GET[ 'post' ], $_GET[ 'epochHighest' ]  ) && 0 != absint( $_GET[ 'epochHighest' ] ) ) {
		include_once( dirname( __FILE__ ) . '/classes/Epoch_Highest_Filter.php' );
		new Epoch_Children_Filter( absint( $_GET[ 'post' ] ), absint( $_GET[ 'epochHighest' ] ) );
	}

	if( isset( $_GET[ 'epoch' ] ) ) {
		add_filter( 'comments_clauses', 'epoch_only_parents' );

		include_once( dirname( __FILE__ ) . '/classes/Epoch_Children_Filter.php' );
		new Epoch_Children_Filter();
	}

}, 1 );

/**
 * Make WP_Comment_Query only get parents
 *
 * @uses "comments_clauses"
 *
 * @param array $clauses
 *
 * @return mixed
 */
function epoch_only_parents( $clauses ){
	$clauses[ 'where' ] .= ' AND comment_parent = 0';

	return $clauses;

}




