<?php

/**
 * @TODO What this does.
 *
 * @package   @TODO
 * @author    Josh Pollock <Josh@JoshPress.net>
 * @license   GPL-2.0+
 * @link
 * @copyright 2016 Josh Pollock
 */
class Epoch_Helper {


	/**
	 * Given a post ID determine the number of comments
	 *
	 * @since  1.0.5
	 * @param  int $post_id The post ID
	 * @return int          The comment count
	 */
	public static function get_comment_count( $post_id ) {
		$options = options::get_display_options();
		$count   = 0;

		$comments = get_approved_comments( $post_id );

		foreach ( $comments as $comment ) {

			if ( $comment->comment_type === '' || ( $comment->comment_type === 'pingback' && empty( $options['hide_pings'] ) ) ) {
				$count++;
			}

		}

		return (int) $count;
	}

	/**
	 * If possible, write comment count to a text file.
	 *
	 * @since 1.0.2
	 *
	 * @param int $post_id
	 * @param null|int $comment_count
	 *
	 * @return array
	 */
	public static function write_comment_count( $post_id, $comment_count = null ) {
		if ( ! EPOCH_ALT_COUNT_CHECK_MODE ){
			return array(
				'code' => 501,
				'message' => __( 'File system comment count checks not enabled.', 'epoch' )
			);

		}

		if( is_null( $comment_count ) ) {
			$comment_count = get_comment_count( $post_id );
		}

		if( is_object( $comment_count ) ) {
			$comment_count = (string) $comment_count->approved;
		}

		$dir =  api_paths::comment_count_dir( false );

		if ( ! is_dir( $dir ) ) {
			wp_mkdir_p( $dir );
		}

		if ( ! is_dir( $dir ) ) {
			$return[ 'message' ] = __( 'Could not create directory.', 'epoch' );
			return $return;

		}

		$path = api_paths::comment_count_alt_check_url( $post_id, false );

		if ( ! file_exists( $path ) ) {
			$handle = fopen( $path, 'w+' );
		}else{
			$handle = fopen( $path, 'w' );
		}

		$written = fwrite( $handle, $comment_count );

		$closed = fclose( $handle );
		if( $written && $closed ) {
			return true;
		}

		$written = file_put_contents( $path, $comment_count );
		if( ! $written ) {
			return false;

		}


	}


	/**
	 * If possible, return the URL to check this post's comments from a txt file.
	 *
	 * @since 2.0.0
	 *
	 * @param $post_id
	 * @param bool $url Optional. If true, the default, URL is returned. If false the directory path is returned.
	 *
	 * @return string
	 */
	public static function comment_count_alt_check_url( $post_id, $url = true ) {
		if ( 0 < absint( $post_id ) &&  EPOCH_ALT_COUNT_CHECK_MODE ){
			return self::comment_count_dir( $url ) . $post_id . '.txt';

		}

	}

	/**
	 * Get the URL for the directory we use to save comment counts in.
	 *
	 * @since 1.0.2
	 *
	 * @param bool $url Optional. If true, the default, URL is returned. If false the directory path is returned.
	 *
	 * @return string
	 */
	public static function comment_count_dir( $url = true ) {
		$upload_dir = wp_upload_dir();
		if ( $url ) {
			$dir = $upload_dir[ 'baseurl' ];
		} else {
			$dir = $upload_dir[ 'basedir' ];
		}

		$dir = trailingslashit( $dir ) . 'epoch/';

		/**
		 * Filter the location for comment count files
		 *
		 * @since 1.0.2
		 *
		 * @param string $url
		 * @param bool $url Optional. If true, the default, URL is returned. If false the directory path is returned.
		 */
		return apply_filters( 'epoch_comment_count_dir', $dir, $url );

	}

}
