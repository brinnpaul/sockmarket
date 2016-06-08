app.config(function ($stateProvider) {

    // Register our *about* state.
    $stateProvider.state('socks', {
        url: '/socks',
        controller: 'sockViewController',
        templateUrl: 'js/productview/productview.html'
    });

    $stateProvider.state('socks.sockId', {
      url:'/socks/:id',
      controller: 'sockIdController',
      templateUrl: 'js/productview/productview.html'

    })

});

app.controller('sockViewController', function ($scope, ProductViewFactory, ReviewFactory) {

  $scope.setSock = function(sockId) {
    return ProductViewFactory.singleSock(sockId) // return?
    .then(function(sock) {
      $scope.sock = sock
    })
  }

  $scope.setReviews = function(sockId) {
    return ReviewFactory.productReviews(sockId)
    .then(function(reviews) {
      $scope.reviews = reviews
    })
  }

  $scope.setSock(1);
  $scope.setReviews(1);

  $scope.newReview = function() {
    var newReview = {
      text: $scope.reviewText,
      sockId: $scope.sock.id
    }
    return ReviewFactory.postReview(newReview)
    .then(function(newReview){
      var review = {};
      review.user = {};

        review.user.first_name = newReview.user.first_name;
        review.user.last_name = newReview.user.last_name;
        review.user.profile_pic = newReview.user.profile_pic;
        review.user.username = newReview.user.username;
        review.text = newReview.review.text;

      $scope.reviews.push(review);
      $scope.reviewText = null;
    })
  }

  $scope.alreadyPosted = function() {
    // add in after finishing other stuff
  }

});

app.controller('sockIdController', function ($scope, $stateParams, ProductViewFactory) {

  $scope.setSock = function(sockId) {
    return ProductViewFactory.singleSock(sockId) // return?
    .then(function(sock) {
      $scope.sock = sock
      console.log(sock);
    })
  }

  // $scope.setReviews = function(sockId) {
  //   return ProductViewFactory.productReviews(sockId)
  //   .then(function(reviews) {
  //     $scope.reviews = reviews
  //   })
  // }

  $scope.setSock($stateParams.id);
  // $scope.setReviews(3);

});
