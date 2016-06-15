app.controller('PersonalInfoCtrl', function ($scope, $state, AuthService, theUser, PersonalInfoFactory) {

	$scope.userId = theUser.id;
	$scope.address1 = theUser.address1;
	$scope.address2 = theUser.address2;
	$scope.zip = theUser.zip;
	$scope.state = theUser.state;
	$scope.country = theUser.country;
	$scope.phone = theUser.phone;
	$scope.displayError = false;

	$scope.submitPersonal = function (id) {
		if (($scope.country === "United States" || $scope.country === "Canada") && $scope.state === "") {
			$scope.displayError = true;
			return $scope.errorMessage = "If in US or Canada, must include State/Province";
		}

		var userInfo = {
			address1 : $scope.address1,
			address2 : $scope.address2,
			zip : $scope.zip,
			state : $scope.state,
			country : $scope.country,
			phone : $scope.phone
		}

		return PersonalInfoFactory.submit($scope.userId, userInfo)
		.then(function(response){
			// if ($scope.newUser) 
			return $state.go('home');
			// else return $state.go('user', {userId: $scope.userId});
		})
	}

});