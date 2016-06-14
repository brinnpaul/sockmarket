app.config(function ($stateProvider) {
	$stateProvider.state('checkout', {
    url: '/cart/checkout',
		templateUrl: '/js/checkout/checkout.html',
		controller: 'checkoutController',
		resolve: {
			currentCart: function (OrderFactory) {
				return OrderFactory.showCart('current')
			}
		}
  })
})
