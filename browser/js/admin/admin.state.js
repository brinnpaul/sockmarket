app.config(function($stateProvider) {
  $stateProvider.state('admin', {
    url: '/admin',
    templateUrl: 'js/admin/admin.html',
    controller: 'AdminCtrl',
  })
  .state('admin.socks', {
    templateUrl: 'js/admin/views/admin.socks.html',
    resolve: {
      socks: function(SockFactory) {
        return SockFactory.allSocks();
      }
    },
    controller: function($scope, socks, SockFactory, ReviewFactory) {
      $scope.socks = socks;
      console.log(socks);
      $scope.deleteSock = function(id) {
        console.log("deleteSock")
        return SockFactory.delete(id)
        .then(function() {
          $scope.socks = $scope.socks.filter(function(sock) { if (sock.id !== id) return sock});
        })
      }

      $scope.deleteReview = function(id) {
        return ReviewFactory.delete(id)
        .then(function(review) {
          $scope.socks = $scope.socks.map(function(sock) {
            if (sock.id !== review.sockId) {
              return sock;
            } else {
              sock.reviews = sock.reviews.filter(function(reviewOnSock) { return reviewOnSock.id !== id })
              return sock;
            }
          })
        })
      }

    }
  })
  .state('admin.users', {
    templateUrl: 'js/admin/views/admin.users.html',
    resolve: {
      users: function(UserFactory) {
        return UserFactory.fetchAll();
      }
    },
    controller: function($scope, $state, users, UserFactory) {
      $scope.users = users;
      console.log("Im USERS", users);
      $scope.seeUserSock = function (id) {
        $state.go('singleSockView', {id: id});
      };
    }
  })
})

