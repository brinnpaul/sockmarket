app.config(function ($stateProvider) {
	$stateProvider.state('user', {
		url: '/user/:userId',
		templateUrl: '/js/user/user-profile.html',
		controller: 'UserCtrl',
		resolve: {
			theUser: function (UserFactory, $stateParams) {
				return UserFactory.fetchById($stateParams.userId);
			}
		}
	})
})