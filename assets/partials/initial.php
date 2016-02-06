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


$comment_count = get_comment_count( $post->ID );
$comment_count = $comment_count[ 'approved' ];
$comments_open = comments_open( $post );

if ( $comment_count == 0 && ! $comments_open  ) {
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

<div id="epoch" data-epoch-post-id="<?php echo esc_attr( $post->ID ); ?>" data-epoch-total="<?php echo esc_attr( $comment_count ); ?>" data-epoch-open="<?php esc_attr( $comments_open ); ?>" ng-app="epoch"  ng-controller="comments">

	<div id="epoch-comment-template">
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
	<div id="epoch-comment-before"></div>
	<?php
		if( comments_open( $post ) ) : ?>
		<div ng-controller="commentForm" id="epoch-reply">
			<?php
				if( 0 != get_current_user_id() ) {
					include( EPOCH_PATH . 'assets/partials/logged-in-form.html' );
				}else{
					include( EPOCH_PATH . 'assets/partials/not-logged-in-form.html' );
				}
			endif;
		?>

		</div>
</div>
