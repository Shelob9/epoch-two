<?php
/**
 * Template for what is outputted on initial page load
 *
 * @package   Epoch
 * @author    Postmatic
 * @license   GPL-2.0+
 * @link
 * Copyright 2016 Transitive, Inc.
 */

global $post;

function epoch_get_form( $post_id ) {
	if ( 0 < absint( $post_id ) && comments_open( $post_id ) ) {

		ob_start();
		comment_form( [], $post_id );
		$html = ob_get_clean();
	} else if ( ! comments_open( $post_id ) ) {
		$html = __( 'Comments are closed.', 'epoch' );
	} else {
		$html = '';
	}

	return $html;

}

$comment_count = get_comment_count( $post->ID );
$comment_count = $comment_count[ 'approved' ];

if ( $comment_count == 0 and ! comments_open( $post ) ) {
	return;
}
echo '<div id="comments" ng-app="epoch">';


		if ( $comment_count == 0 ) {
			$comment_count_message = __( 'There are no comments', 'epoch' );
		} else {
			$comment_count_message = sprintf(
				_n( 'There is one comment', 'There are %s comments', $comment_count, 'epoch' ),
				'<span id="comment-count">' . $comment_count . '</span>'
			);
		}
echo $comment_count_message;

	?>

<div id="epoch" data-post-id="<?php echo esc_attr( $post->ID ); ?>">
	<div id="epoch-comment-template" ng-controller="comments">
		<div ng-repeat="comment in post_comments track by $index" ng-include="partials + 'comment.html'" class="epoch-comment">
		</div>
		<!--/ng-repeater-->
		<button ng-click="prev()" class="epoch-button" ng-show="showPrevPage()">
			<?php esc_html_e( 'Previous' ); ?>
		</button>
		<button ng-click="next()" class="epoch-button" ng-show="showNextPage()">
			<?php esc_html_e( 'Next' ); ?>
		</button>

	</div>
	<div ng-controller="commentForm">
		<?php echo epoch_get_form( $post->ID ); ?>
	</div>
</div>
