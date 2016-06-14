app.controller('checkoutController', function ($scope, OrderFactory, currentCart, CheckoutFactory) {
  $scope.currentCart = currentCart

  $scope.calcTotal = function() {
    return OrderFactory.calculateTotal('current')
    .then(function(cartTotal) { $scope.total = cartTotal })
  }

  $scope.calcTotal()

  $scope.charge = function(status, repsonse) {
    CheckoutFactory.chargeCard({token: response.id})
    .then(function(res) {
      console.log(res)
    })
  }

})
