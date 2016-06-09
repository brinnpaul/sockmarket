app.config(function ($stateProvider) {
	$stateProvider.state('cart', {
    url: '/cart/current',
		templateUrl: '/js/order/cart.html',
		controller: 'cartCurrent',
		resolve: {
			currentCart: function (OrderFactory) {
				return OrderFactory.showCart('current');
			}
		}
  })

  $stateProvider.state('cart', {
    url: '/cart/history',
    templateUrl: '/js/order/history.html',
    controller: 'cartHistory',
    resolve: {
      orderHistory: function (OrderFactory) {
        return OrderFactory.showCart('history');
      }
    }
  })

})
