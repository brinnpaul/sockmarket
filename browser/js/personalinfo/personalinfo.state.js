app.config(function ($stateProvider) {

	$stateProvider.state('personal', {
		url: '/personal/:id',
		controller: 'PersonalInfoCtrl',
		templateUrl: '/js/personalinfo/personalinfo.view.html',
		resolve: {
			theUser: function ($stateParams, UserFactory){
				return UserFactory.fetchById($stateParams.id);
			}
		}
	});
});