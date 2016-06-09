app.controller('cartCurrent', function ($scope, OrderFactory) {

  $scope.update = function() {
    return OrderFactory.updateItem()
  }
})


app.controller('cartHistory', function ($scope, OrderFactory) {


})
