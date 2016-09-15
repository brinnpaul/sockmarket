app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'homeCtrl',
        resolve: {
        	mostRecentSocks: function (SockFactory) {
        		return SockFactory.mostRecentSocks();
        	},
          mostPopularSocks: function(SockFactory) {
            return SockFactory.mostPopularSocks();
          },
          recentlyPurchasedSocks: function(SockFactory) {
            return SockFactory.recentlyPurchasedSocks();
          }
        }
    });
});

