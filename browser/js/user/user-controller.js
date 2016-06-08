app.controller('UserCtrl', function ($scope, theUser) {
    console.log("controller", theUser);
	$scope.user = theUser;
})
