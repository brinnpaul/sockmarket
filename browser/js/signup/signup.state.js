app.config(function ($stateProvider) {
	$stateProvider.state('signup', {
		url: '/signup',
		controller: 'SignupCtrl',
		templateUrl: '/js/signup/signup.view.html'
	});

	$stateProvider.state('signup.2', {
		url: '/2',
		controller: 'SignupCtrl',
		templateUrl: '/js/signup/personalinfo.view.html'
	});
});