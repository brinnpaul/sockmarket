app.controller('UserCtrl', function ($scope, $state, theUser, theUserSocks, AuthService, UserFactory) {
    console.log("controller", theUserSocks);
	$scope.user = theUser;
	$scope.socks = theUserSocks;

	$scope.toShippingInfo = function(id){
		$state.go('personal', {id: id});
	};

	$scope.toSockView = function (id) {
		$state.go('singleSockView', {id: id})
	};

	AuthService.getLoggedInUser().then(function (user) {
        return user.id == $scope.user.id || user.isAdmin ? true : false
    })
    .then(function (result) {
    	console.log(result)
    	$scope.verifyUser = result
    });

    $scope.delete = UserFactory.delete
})
