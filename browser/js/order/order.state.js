app.config(function ($stateProvider) {
	$stateProvider.state('currentCart', {
    url: '/cart/current',
		templateUrl: '/js/order/cart.html',
		controller: 'cartCurrent',
		resolve: {
			currentCart: function (OrderFactory) {
				return OrderFactory.showCart('current')
			}
		}
  })

  $stateProvider.state('cartHistory', {
    url: '/cart/history',
    templateUrl: '/js/order/history.html',
    controller: 'cartHistory',
    resolve: {
      cartHistory: function (OrderFactory) {
        return OrderFactory.showCart('history');
      }
    }
  })

})
