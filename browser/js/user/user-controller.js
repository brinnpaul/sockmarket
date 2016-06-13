app.controller('UserCtrl', function ($scope, $state, theUser, theUserSocks, AuthService) {
    console.log("controller", theUserSocks);
	$scope.user = theUser;
	$scope.socks = theUserSocks;

	$scope.toShippingInfo = function(id){
		$state.go('personal', {id: id});
	};

	$scope.toSockView = function (id) {
		$state.go('singleSockView', {id: id})
	};

    $scope.verifyUser = function () {
        if(AuthService.isAuthenticated()) {
        return AuthService.getLoggedInUser().then(function (user) {
            return user == $scope.user;
        });
    	}
    };

})
