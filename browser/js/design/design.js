app.config(function ($stateProvider) {
    $stateProvider.state('designView', {
      url:'/socks/design/:id',
      scope: {
        theSock: '='
      },
      controller: 'designViewCtrl',
      template: '<design-view></design-view>',
    })

});

app.controller('designViewCtrl', function ($scope, $http) {

  $http.post('/api/user/matchId')
    .then(function (res) {
      return $scope.showView = res
    })

	// // $scope.description;
	// $scope.tags;
	// $scope.title;
	// console.log($scope.description);
})