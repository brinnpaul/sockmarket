app.config(function ($stateProvider) {
	$stateProvider.state('signup', {
		url: '/signup',
		controller: 'SignupCtrl',
		templateUrl: '/js/signup/signup.view.html'
	});

});