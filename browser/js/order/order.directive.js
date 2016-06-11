app.directive('currentCart', function ($state, OrderFactory) {

  return {
      restrict: 'E',
      scope: {},
      templateUrl: 'js/order/current.html',
      link: function(scope) {

        scope.update = function(item) {
          var sock = {
            quantity: item.newAmount,
            id: item.id
          }
          return OrderFactory.updateItem(sock)
          .then(function(update){
            item.quantity = item.newAmount;
            item.newAmount = null;
          })
        }

        scope.delete = function(item) {
          var todelete = { item: item }
          OrderFactory.deleteItem(todelete.item.id)
        }

        scope.singleSockView = function(id) {
          $state.go('singleSockView', {id: id})
        }

        return OrderFactory.showCart('current')
        .then(function(current) { scope.currentCart = current })
    }
  }
})

app.directive('cartHistory', function($state, OrderFactory) {

  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'js/order/history.html',
    link: function (scope) {
      return OrderFactory.showCart('history')
      .then(function(history) {
        console.log(history)
        scope.cartHistory = history })
    }
  }

})
