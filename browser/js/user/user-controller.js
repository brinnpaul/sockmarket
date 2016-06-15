app.controller('UserCtrl', function ($scope, $state, theUser, theUserSocks, AuthService, UserFactory) {
    console.log("controller", theUserSocks);
	$scope.user = theUser;
	$scope.socks = theUserSocks;

    $scope.dateParser = function () {
        var rawDate = $scope.user.createdAt.split("T")[0].split("-");
        var rawYear = rawDate[0];
        var rawMonth = rawDate[1];
        var rawDay = rawDate[2];

        var monthObj = {
            "01":"January",
            "02":"February",
            "03":"March",
            "04":"April",
            "05":"May",
            "06":"June",
            "07":"July",
            "08":"August",
            "09":"September",
            "10":"October",
            "11":"November",
            "12":"December"
        }
        return rawDay + " " + monthObj[rawMonth] + " " + rawYear;
    }

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
    	$scope.verifyUser = result
    });

	AuthService.getLoggedInUser().then(function (user) {
        return user.isAdmin ? true : false
    })
    .then(function (result) {
    	$scope.isAdmin = result
    });

    if ($scope.user.isAdmin) $scope.adminButton = "Make Non-Admin"
    if (!$scope.user.isAdmin) $scope.adminButton = "Make Admin"

    $scope.delete = UserFactory.delete;
    
    $scope.makeAdmin = function (id) {
    	return UserFactory.makeAdmin(id)
    	.then(function (res) {
    		if ($scope.user.isAdmin) {
    			$scope.user.isAdmin = false
    			$scope.adminButton = "Make Admin"
    		}
    		else if (!$scope.user.isAdmin) {
    			$scope.user.isAdmin = true
    			$scope.adminButton = "Make Non-Admin"
    		}
    	});
    }
})
