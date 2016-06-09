app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'homeCtrl',
        resolve: {
        	mostRecentSocks: function (SockFactory) {
        		return SockFactory.mostRecentSocks()
        	}
        }
    });
});

app.controller('homeCtrl', function ($scope, mostRecentSocks, $state, $stateParams) {

  $scope.mostRecentSocks = mostRecentSocks
  $scope.seeSock = function (id) {
    $state.go('singleSockView', {id: id})
  }
})