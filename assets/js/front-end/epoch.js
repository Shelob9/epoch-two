var Epoch = Epoch || {};

Epoch.app = angular.module( 'epoch', ['ngResource', 'ngSanitize' ] );

Epoch.app.controller( 'comments', ['$scope', '$http', '$sce', '$timeout', '$filter', function( $scope, $http, $sce, $timeout, $filter ){
    var page = 1;
    var postID = jQuery( '#epoch' ).attr( 'data-post-id' );
    var totalPages;
    var total;
    var commentIDs = [];
    var highest = 0;
    $scope.post_comments = {};
    $scope.partials = EPOCH_VARS.partials;
    if ( _.isEmpty( $scope.comment ) ) {
        $scope.comment = {
            author: EPOCH_VARS.user,
            content: '',
            parent: 0,
            post: $scope.postID
        };
    }


    /**
     * Check if comments are open
     *
     * @since 2.0.0
     */
    $http({
        url: EPOCH_VARS.api.posts + postID,
        cache: true
    } ).then( function( res )  {
        if( 'open' == res.data.comment_status ) {
             $scope.comments_open = true;
        }else{
            $scope.comments_open = false;
        }
    });

    $scope.translations = EPOCH_VARS.translations;

    /**
     * Get comments and update model
     *
     * @since 2.0.0
     */
    var getComments = function(){
        var highest = findHighest();
        $http({

            url: EPOCH_VARS.api.comments,
            params: {
                page: page,
                post: postID,
                epoch: true,
                epochHighest: highest
            },
            cache: true
        }).then( function( res ) {
            totalPages =  res.headers('x-wp-totalpages');
            total = res.headers( 'x-wp-total' );
            highest = res.headers( 'x-wp-highest' );
            if ( 0 < res.data.length ) {
                $scope.post_comments = res.data;
                for ( var i = 0; i < $scope.post_comments.length; i++ ) {
                    $scope.post_comments[ i ].avatar = $scope.post_comments[ i ].author_avatar_urls[ 96 ];
                    if ( !jQuery.inArray( $scope.post_comments[ i ].id, commentIDs ) ) {
                        commentIDs.push( $scope.post_comments[ i ].id );
                    }
                    if( !_.isEmpty( $scope.post_comments[ i ].children ) ){
                        _.forEach( $scope.post_comments[ i ].children, function(child, index) {
                            $scope.post_comments[ i ].children[ index ].avatar = $scope.post_comments[ i ].children[ index ].author_avatar_urls[ 96 ];
                        });
                    }
                }
            }
        });
    };

    //run at start
    getComments();



    /**
     * Should we hide previous button?
     *
     * @since 2.0.0
     *
     * @returns {boolean}
     */
    $scope.showPrevPage = function() {
        if( 1 != page  ){
            return true;
        }
    };

    /**
     * Should we hide next button?
     *
     * @since 2.0.0
     *
     * @returns {boolean}
     */
    $scope.showNextPage = function() {
        if( page < totalPages ) {
            return true;
        }

    };

    /**
     * Callback for getting previous page of comments
     *
     * @since 2.0.0
     *
     */
    $scope.prev = function(){
        $scope.cancel();
        page--;
        getComments();

    };

    /**
     * Callback for getting next page of comments
     *
     * @since 2.0.0
     */
    $scope.next = function(){
        $scope.cancel();
        page++;
        getComments();
    };

    /**
     * Have URL for comment author?
     *
     * @since 2.0.0
     *
     * @param id
     * @returns {boolean}
     */
    $scope.hasAuthorURL = function( id ){
        var match = find( id );
        if ( !_.isEmpty( match ) ) {
            if ( !_.isEmpty( match.author_url ) ){
                return true;
            }
        }

    };

    /**
     * Check if comment is approved
     *
     * @since 2.0.0
     *
     * @param id
     * @returns {boolean}
     */
    $scope.isApproved = function( id ){
        var match = find( id );
        if ( !_.isEmpty( match ) ) {
            if ( 'approved' == match.status ){
                return true;
            }
        }
    };

    /**
     * Approve a comment
     *
     * @since 2.0.0
     */
    $scope.approve = function(){
        var comment = this.comment;
        return update_status( comment, 'approved' );
    };

    /**
     * Unpprove a comment
     *
     * @since 2.0.0
     */
    $scope.unApprove = function(){
        var comment = this.comment;
        return update_status( comment, 'hold' );
    };

    /**
     * Spam a comment
     *
     * @since 2.0.0
     */
    $scope.spam = function(){
        var comment = this.comment;
        return update_status( comment, 'spam' );
    };

    /**
     * Delete a comment
     *
     * @since 2.0.0
     */
    $scope.delete = function(){
        var comment = this.comment;
        var id = comment.id;
        $http({
            url: EPOCH_VARS.api.comments + id + '?_wpnonce=' + EPOCH_VARS.nonce,
            method: 'DELETE'
        }).then( function( res ) {
            totalPages =  res.headers('x-wp-totalpages');
            total = res.headers( 'x-wp-total' );
            highest = res.headers( 'x-wp-highest' );
        }, function errorCallback( res ) {
            var error = res.data.message;
        });
    };

    /**
     * Find a comment in the current comments object by comment ID
     *
     * @since 2.0.0
     * @param id
     */
    var find = function( id ){
        var found = _.filter( $scope.post_comments, _.matches( {
            id: id
        } ) );
        if( !_.isEmpty( found ) ) {
            return found[0];
        }
    };

    var update_status = function( comment, status ){
        var id = comment.id;
        $http({
            url: EPOCH_VARS.api.comments + id + '?_wpnonce=' + EPOCH_VARS.nonce,
            params: {
                id: id,
                status: status
            },
            method: 'POST'
        }).then( function( res ) {
            totalPages =  res.headers('x-wp-totalpages');
            total = res.headers( 'x-wp-total' );
            highest = res.headers( 'x-wp-highest' );
        }, function errorCallback( res ) {
            var error = res.data.message;
        });

    };

    /**
     * Click handler for moving form form for inline comments
     *
     * @since 2.0.0
     */
    $scope.moveForm = function() {
        var id = this.comment.id;
        moveForm( id );
    };

    /**
     * Move handler for moving form form for inline comments
     *
     * @since 2.0.0
     */
    var moveForm = function ( id ) {
        angular.element( '#epoch-reply' ).detach().appendTo( '#comment-' + id );
        $scope.comment.parent = id;
    };

    /**
     * Edit comment
     *
     * @since 2.0.0
     *
     * @todo this
     */
    $scope.editComment = function(){
        $scope.comment = this.comment;
        $scope.comment.content = this.comment.content.rendered;
        moveForm( this.comment.id );

    };

    /**
     * Show edit link?
     *
     * @since 2.2.0
     *
     * @returns {boolean}
     */
    $scope.showEdit = function(){
        if( this.comment.author == EPOCH_VARS.user ){
            return true;
        }
    };

    /**
     * Put comment form back when canceling
     *
     * @since 2.0.0
     */
    $scope.cancel = function() {
        $scope.comment = {};
        angular.element( '#epoch-reply' ).detach().appendTo( '#epoch-comment-before' );
    };



/**
    $timeout( poll, 3000);

    var poll = function(){
        getComments();
    }

**/
}]);

/**
 * Controller for comment form
 *
 * @since 2.0.0
 */
Epoch.app.controller( 'commentForm', [ '$scope', '$http', function( $scope, $http ){
    $scope.translations = EPOCH_VARS.translations;
    $scope.logout_link = EPOCH_VARS.logout_link,
    $scope.postID = jQuery( '#epoch' ).attr( 'data-post-id' );


    /**
     * Handle comment submission
     *
     * @since 2.0.0
     */
    $scope.submit = function(){
        $http({
            url: EPOCH_VARS.api.comments + '?_wpnonce=' + EPOCH_VARS.nonce,
            params: $scope.comment,
            method: 'POST'
        }).then( function( res ) {
            $scope.comment = {};
            totalPages =  res.headers('x-wp-totalpages');
            total = res.headers( 'w-wp-total' );
            console.log( res );
        }, function errorCallback( res ) {
            var error = res.data.message;
        });
    }

}]);





