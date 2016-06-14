app.factory('CheckoutFactory', function ($http, $state) {

  return {
    chargeCard: function(obj) {
      $http.post('/checkout', obj)
      .then(function(order) {
        return order.data
      })
    }
  }
})
