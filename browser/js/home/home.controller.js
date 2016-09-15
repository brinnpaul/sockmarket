app.controller('homeCtrl', function ($scope, mostRecentSocks, mostPopularSocks, recentlyPurchasedSocks, SockFactory, $state, $stateParams) {

  $scope.mostRecentSocks = mostRecentSocks;
  $scope.mostPopularSocks = mostPopularSocks;
  $scope.recentlyPurchasedSocks = recentlyPurchasedSocks;

  console.log("IM YOUR RECENT SOCKS", $scope.recentlyPurchasedSocks);

  $scope.maxSockId = null;
  $scope.browseSocks = [];
  $scope.busy = false;

  $scope.loadSocks = function(id) {
    if (this.busy) return;
    if (this.maxSockId === 'done') return;
    this.busy = true;

    return SockFactory.browseSocks(id)
    .then(function(socks) {
      console.log(socks);
      if (socks.length === 0) return $scope.maxSockId = 'done';
      $scope.maxSockId = socks[socks.length-1].id;
      $scope.busy = false;
      $scope.browseSocks = $scope.browseSocks.concat(socks);
    })

  }

  $scope.formatBrowseSockTitle = function (title) {
    if (title.length < 24) {
      return title;
    } else {
      return title.slice(0, 23) + '...';
    }
  }

  $scope.seeSock = function (id) {
    $state.go('singleSockView', {id: id});
  }
  $scope.seeUser = function (id) {
    $state.go('user', {userId: id});
  }
});

