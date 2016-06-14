app.controller('checkoutController', function ($scope, OrderFactory, currentCart) {
  $scope.currentCart = currentCart

  $scope.calcTotal = function() {
    return OrderFactory.calculateTotal('current')
    .then(function(cartTotal) { $scope.total = cartTotal })
  }

  $scope.calcTotal()
})
