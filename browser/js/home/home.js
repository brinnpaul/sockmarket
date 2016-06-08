app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'sockViewController',
        resolve: {
        	mostRecentSocks: function (SockFactory) {
        		return SockFactory.mostRecentSocks()
        	}
        }
    });
});