app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'homeCtrl',
        resolve: {
        	mostRecentSocks: function (SockFactory) {
        		return SockFactory.mostRecentSocks()
        	},
          // mostPopularSocks: function(SockFactory) {
          //   return SockFacory.mostPopularSocks();
          // }
        }
    });
});

app.controller('homeCtrl', function ($scope, mostRecentSocks, SockFactory, $state, $stateParams) {

  $scope.mostRecentSocks = mostRecentSocks;
  SockFactory.mostPopularSocks()
  .then(function(socks){
    $scope.mostPopularSocks = socks;
  });
  
  $scope.seeSock = function (id) {
    $state.go('singleSockView', {id: id})
  }
})