app.factory('UserFactory', function ($http, $state) {
	var UserFactory = {};

	UserFactory.fetchById = function (id) {
		return $http.get('/api/user/' + id)
		.then(function (response) {
            console.log("factory", response.data)
			return response.data
		})
	}

	UserFactory.fetchAll = function () {
		return $http.get('/api/users')
		.then(function (response) {
			return response.data
		})
	}

	UserFactory.delete = function (id) {
		return $http.post('/api/user/delete/' + id)
		.then($state.go('home'))
	}

	return UserFactory;
})
