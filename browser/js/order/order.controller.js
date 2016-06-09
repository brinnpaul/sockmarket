app.controller('cartCurrent', function ($scope, OrderFactory, currentCart) {

  $scope.currentCart = currentCart

  $scope.update = function(item, quantity) {
    var sock = {
      quantity: quantity,
      id: item.id
    }
    return OrderFactory.updateItem(sock)
    .then(function(res){
      console.log("herere", res)
      item.quantity = quantity;
    })
  }

  $scope.delete = function() {
    return OrderFactory.deleteItem
  }

})


app.controller('cartHistory', function ($scope, OrderFactory, cartHistory) {

  $scope.cartHistory = cartHistory

})
