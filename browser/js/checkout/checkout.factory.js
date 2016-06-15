app.factory('CheckoutFactory', function ($http, $state) {

  return {
    chargeCard: function(obj) {
      return $http.post('/checkout', obj)
      .then(function(order) {
        return order.data
      })
    }
  }
})
