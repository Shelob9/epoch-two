var Epoch = Epoch || {};

Epoch.app = angular.module( 'epoch', ['ngResource', 'ngSanitize' ] );

Epoch.app.controller( 'comments', ['$scope', '$http', '$sce', '$timeout', '$filter', function( $scope, $http, $sce, $timeout, $filter ){
    var page = 1;
    var postID = jQuery( '#epoch' ).attr( 'data-post-id' );
    var totalPages;
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
            $scope.total = res.headers( 'x-wp-total' );
            highest = res.headers( 'x-epoch-highest' );
            if ( 0 < res.data.length ) {
                var id;
                _.forEach( res.data, function ( comment, i ) {
                    id = comment.id;
                    comment.avatar = comment.author_avatar_urls[ 96 ];

                    if( !_.isEmpty( comment.children  ) ) {
                        _.forEach( comment.children, function( child, cI ){
                            comment.children[ child.id ].avatar = child.author_avatar_urls[ 96 ];
                        });
                    }

                    commentIDs.push( {
                        id: id,
                        page: page,
                        parent: comment.parent
                    } );

                    if( 0 != comment.parent && _.has( $scope.post_comments, comment.parent ) ){
                        $scope.post_comments[ comment.parent ].children = comment;

                    }else{
                        $scope.post_comments[ id ] = comment;
                    }
                } );

            }


        });
    };

    /**
     * Run at start
     */
    getComments();

    /**
     * Poll for changes in comment count
     */
    if ( EPOCH_VARS.live_mode ) {
        Visibility.every( EPOCH_VARS.epoch_options.interval, function () {
            var url;
            if ( EPOCH_VARS.alt_comment_count ) {
                url = EPOCH_VARS.api.alt_count;
            }else{
                url = EPOCH_VARS.api.count + postID;
            }

            var check = function( url ) {
                $http({
                    url:url
                } ).then(function successCallback( res ) {
                    if( res.data.count > $scope.total ) {
                        getComments();
                    }

                }, function errorCallback( res ) {
                    if ( EPOCH_VARS.alt_comment_count ) {
                        //JOSH -> this is a race condition waiting to happen
                        check( EPOCH_VARS.api.count + postID );
                    }
                })
            };


            check( url );


        });
    }

    /**
     * Update display of comment count
     *
     * @since 2.0.0
     */
    scope.$watch('total', function(newValue, oldValue) {
        if( newValue != oldValue ){
            angular.element( '#comment-count' ).html( $scope.total );
        }
    });



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
        pageVisible( page, true );
        $scope.cancel();
        page--;
        getComments();
        pageVisible( page, false );

    };

    /**
     * Callback for getting next page of comments
     *
     * @since 2.0.0
     */
    $scope.next = function(){
        pageVisible( page, true );
        $scope.cancel();
        page++;
        getComments();
        pageVisible( page, false );

    };

    /**
     * Handle hiding and showing of comments in scope.post_comments on pageination
     *
     * @since 2.0.0
     *
     * @param page Page nu,nber
     * @param hide Hide (true) or show (false)
     */
    var pageVisible = function( page, hide ) {
        found = _.filter( commentIDs, {page:page} );
        if ( !_.isEmpty( found ) ) {
            _.forEach( found, function ( comment, i ) {
                if ( hide ) {
                    angular.element( '#comment-' + comment.id ).hide().attr( 'aria-hidden', true );
                } else {
                    angular.element( '#comment-' + comment.id ).show().attr( 'aria-hidden', false );
                }

            } );
        }

        return found;
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
            $scope.total = res.headers( 'x-wp-total' );
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
            $scope.total = res.headers( 'x-wp-total' );
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



}]);

/**
 * Controller for comment form
 *
 * @since 2.0.0
 */
Epoch.app.controller( 'commentForm', [ '$scope', '$http', function( $scope, $http ){
    $scope.translations = EPOCH_VARS.translations;
    $scope.logout_link = EPOCH_VARS.logout_link;
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
            $scoe.total = res.headers( 'w-wp-total' );
            console.log( res );
        }, function errorCallback( res ) {
            var error = res.data.message;
        });
    }

}]);





