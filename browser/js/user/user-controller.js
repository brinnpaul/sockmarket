app.controller('UserCtrl', function ($scope, $state, theUser, theUserSocks) {
    console.log("controller", theUserSocks);
	$scope.user = theUser;
	$scope.socks = theUserSocks;
	$scope.toSockView = function (id) {
		$state.go('singleSockView', {id: id})
	}
})
