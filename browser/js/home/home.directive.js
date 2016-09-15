app.directive('sockDetail', function($state) {
  return {
    restrict: 'E',
    templateUrl: "js/home/sockdetail.html",
  scope: {
      sock: '='
    },
    link: function(scope) {
      scope.formatBrowseSockTitle = function (title) {
        if (title.length < 20) {
          return title;
        } else {
          return title.slice(0, 19) + '...';
        }
      }

      scope.seeSock = function (id) {
        $state.go('singleSockView', {id: id});
      }
      scope.seeUser = function (id) {
        $state.go('user', {userId: id});
      }
    }
  };
});