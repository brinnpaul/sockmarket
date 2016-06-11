// app.controller('sockViewController', function ($scope, SockFactory, ReviewFactory) {

//   $scope.setSock = function(sockId) {
//     return SockFactory.singleSock(sockId) // return?
//     .then(function(sock) {
//       $scope.sock = sock
//     })
//   }

//   $scope.setReviews = function(sockId) {
//     return ReviewFactory.productReviews(sockId)
//     .then(function(reviews) {
//       $scope.reviews = reviews
//     })
//   }

//   $scope.setSock(1);
//   $scope.setReviews(1);

//   $scope.newReview = function() {
//     var newReview = {
//       text: $scope.reviewText,
//       sockId: $scope.sock.id
//     }
//     return ReviewFactory.postReview(newReview)
//     .then(function(newReview){
//       var review = {};
//       review.user = {};

//         review.user.first_name = newReview.user.first_name;
//         review.user.last_name = newReview.user.last_name;
//         review.user.profile_pic = newReview.user.profile_pic;
//         review.user.username = newReview.user.username;
//         review.text = newReview.review.text;

//       $scope.reviews.push(review);
//       $scope.reviewText = null;
//     })
//   }

//   $scope.alreadyPosted = function() {
//     // add in after finishing other stuff
//   }

// });

app.controller('sockIdController', function ($scope, $state, $stateParams, theSock, theReviews, ReviewFactory, OrderFactory) {

  $scope.sock = theSock;
  $scope.reviews = theReviews;

  $scope.alert = function(message) {
    $scope.message = message
    $scope.alerting = !$scope.alerting
    setTimeout(function() {
      $scope.alerting = !$scope.alerting
      $scope.$digest()
    }, 3000)
    // if (!$scope.alerting) $scope.message === null
  }

  $scope.addItem = function() {
    var item = {}
    item.sockId = $scope.sock.id
    item.quantity = +$scope.quantity
    if (item.quantity > 0) {
      OrderFactory.addToCart(item)
      .then(function(response) {
        if (typeof response !== "object") $scope.alert(response)
        else $state.go('currentCart')
      })
    }
    else $scope.alert('You have to add at least one sock!')
  }

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

app.config(function ($stateProvider) {

    // Register our *about* state.
    // $stateProvider.state('socks', {
    //     url: '/socks',
    //     controller: 'sockViewController',
    //     templateUrl: 'js/productview/productview.html'
    // });

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
        }
      }
    })

});
