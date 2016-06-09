app.config(function ($stateProvider) {
	$stateProvider.state('signup', {
		url: '/signup',
		templateUrl: '/js/signup/signup.view.html',
		controller: 'SignupCtrl'
	})
})