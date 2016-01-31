var Epoch = Epoch || {};

Epoch.app = angular.module( 'epoch', ['ngResource', 'ngSanitize' ] );

Epoch.app.controller( 'comments', ['$scope', '$http', '$sce', '$timeout', function( $scope, $http, $sce, $timeout ){
    var page = 1;
    var postID = jQuery( '#epoch' ).attr( 'data-post-id' );
    var totalPages;
    var total;
    var commentIDs = [];
    $scope.post_comments = {};
    $scope.partials = EPOCH_VARS.partials;

    /**
     * Calculate highest comment ID
     *
     * @returns {number}
     */
    var findHighest = function(){

        var _h = Math.max.apply(null, commentIDs );
        if( 'NaN' == _h || '-Infinity' == _h || null == _h ) {
            return 0;
        }else{
            return _h;
        }

    };

    /**
     *
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
            total = res.headers( 'w-wp-total' );
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
     * @returns {boolean}
     */
    $scope.showNextPage = function() {
        if( page < totalPages ) {
            return true;
        }

    };

    /**
     * Callback for getting previous page
     */
    $scope.prev = function(){
        page--;
        getComments();

    };

    /**
     * Callback for getting next page
     */
    $scope.next = function(){
        page++;
        getComments();
    };

    /**
     * Have URL for comment author?
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

    $scope.isApproved = function( id ){
        var match = find( id );
        if ( !_.isEmpty( match ) ) {
            if ( 'approved' == match.status ){
                return true;
            }
        }
    };

    $scope.approve = function( ){
        var comment = this.comment;
        return update_status( comment, 'approved' );
    };

    $scope.unApprove = function( ){
        var comment = this.comment;
        return update_status( comment, 'hold' );
    };

    $scope.spam = function( id ){
        var comment = this.comment;
        return update_status( comment, 'spam' );
    };

    $scope.delete = function( id ){
        var comment = this.comment;
        var id = comment.id;
        $http({
            url: EPOCH_VARS.api.comments + id + '?_wpnonce=' + EPOCH_VARS.nonce,
            method: 'DELETE'
        }).then( function( res ) {
            totalPages =  res.headers('x-wp-totalpages');
            total = res.headers( 'w-wp-total' );
            console.log( res );
        }, function errorCallback( res ) {
            var error = res.data.message;
        });
    };


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
            total = res.headers( 'w-wp-total' );
            console.log( res );
        }, function errorCallback( res ) {
            var error = res.data.message;
        });

    };


    $timeout( poll, 3000);

    var poll = function(){
        getComments();
    }


}]);


Epoch.app.controller( 'commentForm', [ '$scope', '$http'], function( $scope, $http ){

});





