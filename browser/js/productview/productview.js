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

// app.controller('sockIdController', function ($scope, $state, $stateParams, theSock, theReviews, ReviewFactory, OrderFactory, AuthService) {

//   // $scope.dateParser = function(date){

//   //   //return to this later. Would be good if socks and reviews stated when they were posted

  //   //should add it to a factory, because many pages can make use of it

  //   var monthObj = {
  //     '01': "January",
  //     '02': "February",
  //     '03': "March",
  //     '04': "April",
  //     '05': "May",
  //     '06': "June",
  //     '07': "July",
  //     '08': "August",
  //     '09': "September",
  //     '10': "October",
  //     '11': "November",
  //     '12': "December"
  //   }

  // }

app.controller('sockIdController', function ($scope, $state, AuthService, $stateParams, theSock, theReviews, ReviewFactory, OrderFactory) {



  $scope.reviewNotAllowed = false;
  $scope.sock = theSock;
  $scope.reviews = theReviews;

  console.log($scope.sock);
  console.log($scope.reviews);

  $scope.alert = function(message) {
    $scope.message = message;
    $scope.alerting = !$scope.alerting;
    setTimeout(function() {
      $scope.alerting = !$scope.alerting
      $scope.$digest()
    }, 3000)
    // if (!$scope.alerting) $scope.message === null
  }

  $scope.goToUserPage = function(userId) {
    $state.go('user', {userId: userId});
  }

  $scope.addItem = function() {
    var item = {};
    item.sockId = $scope.sock.id;
    item.quantity = +$scope.quantity;
    item.originalPrice = +$scope.sock.price;
    if (item.quantity > 0) {
      OrderFactory.addToCart(item)
      .then(function(response) {
        if (typeof response !== "object") $scope.alert(response);
        else $state.go('currentCart');
      })
    }
    else $scope.alert('You have to add at least one sock!');
  }

  $scope.displayTags = function() {
    return $scope.sock.tags.map(function(tag){
      return '#' + tag;
    }).join(", ");
  }

  $scope.displayTags();

  $scope.getLoggedInUserId = function() {
    return AuthService.getLoggedInUser()
    .then(function(user){
      console.log(user);
      if (!user) {
        $scope.loggedInUserId = 'none';
      } else {
        $scope.loggedInUserId = user.id;
      }
    })
  }

  $scope.getLoggedInUserId();

  $scope.userCannotPostReview = function () {
    return $scope.reviewNotAllowed;
  }

  $scope.userCannotPostReview();

  $scope.newReview = function() {
  
  //if user has already review sock, don't allow user to review it again
    var usersWhoReviewedSock = $scope.reviews.map(function(review){
      return review.userId;
    })

    if ($scope.loggedInUserId === 'none') {
      $scope.reviewErrorMessage = "You must be logged in to review a sock!";
      $scope.reviewNotAllowed = true;
    } else if (usersWhoReviewedSock.indexOf($scope.loggedInUserId) !== -1) {
      $scope.reviewErrorMessage = "You've already reviewed this sock! You can't review it again!";
      $scope.reviewNotAllowed = true;
  //if sock id matches user id, user don't allow user to post a review
    } else if ($scope.loggedInUserId === $scope.sock.user.id) {
      $scope.reviewErrorMessage = "You can't review your own sock!";
      $scope.reviewNotAllowed = true;
    } else {

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
