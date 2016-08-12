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
    controller: function($scope, socks) {
      $scope.socks = socks;
      // console.log($scope.socks);
    }
  })
  .state('admin.users', {
    templateUrl: 'js/admin/views/admin.users.html',
    resolve: {
      users: function(UserFactory) {
        return UserFactory.fetchAll();
      }
    }
  })
})

