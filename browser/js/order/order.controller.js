app.controller('cartCurrent', function ($scope, OrderFactory, currentCart) {
  $scope.current = currentCart
})


app.controller('cartHistory', function ($scope, OrderFactory, cartHistory) {

  $scope.cartHistory = cartHistory

})
