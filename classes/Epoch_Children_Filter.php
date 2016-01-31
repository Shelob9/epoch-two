<?php
/**
 * Adds children to parent comments
 *
 * @package   epoch
 * @author    Josh Pollock <Josh@JoshPress.net>
 * @license   GPL-2.0+
 * @link
 * @Copyright 2016 Transitive, Inc.
 */
class Epoch_Children_Filter{
	/**
	 * @var \WP_REST_Comments_Controller
	 */
	private $comment_class;

	/**
	 * Constructor for object
	 */
	public function __construct(  ){
		$this->comment_class = new WP_REST_Comments_Controller();
		add_filter( 'rest_prepare_comment', array( $this, 'callback' ), 10, 3 );
	}

	/**
	 * Add children to comments
	 *
	 * @uses "rest_prepare_comment" filter
	 *
	 * @param $response
	 * @param $comment
	 * @param $request
	 *
	 * @return mixed
	 */
	public function callback( $response, $comment, $request ){
		remove_filter( 'comments_clauses', 'epoch_only_parents' );
		$child_query = get_comments( array(
			'parent' => $comment->comment_ID
		));

		if( ! empty( $child_query ) ){
			foreach( $child_query as $child ){
				$child_comment = $this->comment_class->prepare_item_for_response( $child, $request );
				$response->data[ 'children' ][ $child->comment_ID ] = $child_comment->get_data();
			}
		}
		add_filter( 'comments_clauses', 'epoch_only_parents' );

		return $response;
	}

}
