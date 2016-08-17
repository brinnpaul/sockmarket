app.config(function ($stateProvider) {

  $stateProvider.state('singleSockView', {
    url:'/socks/:id',
    controller: 'sockIdController',
    templateUrl: 'js/productview/productview.html',
    resolve: {
      theSock: function ($stateParams, SockFactory) {
        return SockFactory.singleSock($stateParams.id)
      },
      theReviews: function ($stateParams, ReviewFactory) {
        return ReviewFactory.productReviews($stateParams.id)
      },
      currentUserLike: function($stateParams, LikeFactory, AuthService) {
        return AuthService.getLoggedInUser()
        .then(function(user) {
          if (user) return LikeFactory.getUserSockLike($stateParams.id);
          else return "no user data";
        })
      },
      sockLikes: function($stateParams, LikeFactory) {
        return LikeFactory.getSockLikes($stateParams.id)
      }
    }
  })

});
