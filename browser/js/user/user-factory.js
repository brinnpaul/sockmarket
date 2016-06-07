app.factory('UserFactory', function ($http) {
	var UserFactory = {};

	UserFactory.fetchById = function (id) {
		$http.get('/api/user/' + id)
		.then(function (response) {
			return response.data
		})
	}

	UserFactory.fetchAll = function () {
		return $http.get('/api/users')
		.then(function (response) {
			return response.data
		})
	}
})