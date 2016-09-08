app.controller('homeCtrl', function ($scope, mostRecentSocks, mostPopularSocks, SockFactory, $state, $stateParams) {

  $scope.mostRecentSocks = mostRecentSocks;
  $scope.mostPopularSocks = mostPopularSocks;


  $scope.maxSockId = null;
  $scope.browseSocks = [];
  $scope.busy = false;

  $scope.loadSocks = function(id) {
    if (this.busy) return;
    this.busy = true;

    return SockFactory.browseSocks(id)
    .then(function(socks) {
      $scope.maxSockId = socks[socks.length-1].id;
      $scope.busy = false;
      $scope.browseSocks = $scope.browseSocks.concat(socks);
    })

  }

  $scope.seeSock = function (id) {
    $state.go('singleSockView', {id: id});
  }
});

