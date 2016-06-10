app.controller('cartCurrent', function ($scope, OrderFactory, currentCart) {

  $scope.currentCart = currentCart

  $scope.update = function(item, amount) {
    var sock = {
      quantity: amount,
      id: item.id
    }
    return OrderFactory.updateItem(sock)
    .then(function(res){
      console.log("herere", res)
      item.quantity = amount;
      $scope.amount = null
    })
  }

  $scope.delete = function(item) {

    return OrderFactory.deleteItem(item.id)
    .then(function(item_deleted) {
      console.log(item_deleted)
    })
  }

})


app.controller('cartHistory', function ($scope, OrderFactory, cartHistory) {

  $scope.cartHistory = cartHistory

})
