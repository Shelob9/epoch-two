<?php
/**
 * Optionally filters REST API comment query to only get comments higher than a given ID
 *
 * @package   epoch
 * @author    Josh Pollock <Josh@JoshPress.net>
 * @license   GPL-2.0+
 * @link
 * @Copyright 2016 Transitive, Inc.
 */
class Epoch_Highest_Filter  {

	/**
	 * The post ID to get comments from
	 *
	 * @var int
	 */
	protected $post_id;

	/**
	 * Get comments with an ID higher than this.
	 *
	 * @var int
	 */
	protected $higher_than;

	/**
	 * Array of IDs that are higher
	 *
	 * @var array
	 */
	protected $higher_ids;

	/**
	 * Set up the object
	 *
	 * @param int $post_id ID of post to get comments from
	 * @param int $higher_than Get comments with an ID higher than this.
	 */
	public function __construct( $post_id, $higher_than ){
		$this->post_id = $post_id;
		$this->higher_than = $higher_than;
		if ( 0 < $this->higher_than ) {
			$this->find_higher();
		}

		if( ! empty( $this->higher_ids ) ){
			add_filter( 'rest_comment_query', array( $this, 'filter' ) );
		}

	}

	/**
	 * Alter args passed by REST API to WP_Comment_Query class
	 *
	 * @uses "rest_comment_query"
	 *
	 * @param array $args
	 *
	 * @return array
	 */
	public function filter( $args ){
		$args[ 'comment__in' ] = $this->higher_ids;
		return $args;
	}

	/**
	 * Query database to see if there are comments with an ID higher than $this->higher_than
	 */
	protected function find_higher(){
		global $wpdb;
		$query = $wpdb->prepare( "SELECT comment_ID FROM $wpdb->comments WHERE comment_post_ID = %d AND comment_ID > %d", $this->post_id, $this->higher_than );
		$wpdb->query( $query );
		if( 0 < $wpdb->num_rows ){
			$this->higher_ids = wp_list_pluck( $wpdb->last_result, 'comment_ID' );

		}
	}

}
