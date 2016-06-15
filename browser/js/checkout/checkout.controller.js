app.controller('checkoutController', function ($scope, OrderFactory, currentCart, CheckoutFactory, $state) {
  $scope.currentCart = currentCart

  $scope.calcTotal = function() {
    return OrderFactory.calculateTotal('current')
    .then(function(cartTotal) { $scope.total = cartTotal })
  }
  $scope.calcTotal()

  $scope.charge = function(status, response) {
    console.log(response)
    CheckoutFactory.chargeCard({
      token: response.id,
      amount: parseInt($scope.total*100)
    })
    .then(function(res) {
      return OrderFactory.ensureCart()
    })
    .then(function(res) {
      $state.go('cartHistory')
    })
  }

})
