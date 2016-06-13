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
          .then(function() {
            scope.calcTotal()
          })
        }

        scope.delete = function(item) {
          var todelete = { item: item }
          OrderFactory.deleteItem(todelete.item.id)
        }

        scope.singleSockView = function(id) {
          $state.go('singleSockView', {id: id})
        }

        scope.calcTotal = function() {
          return OrderFactory.calculateTotal('current')
          .then(function(cartTotal) { scope.total = cartTotal })
        }

        scope.calcTotal()
        .then(function() {
          console.log(scope.total)
        })

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

      scope.calcTotal = function() {
        return OrderFactory.calculateTotal('history')
        .then(function(cartTotal) { scope.totalSpent = cartTotal })
      }

      scope.calcTotal()
      .then(function() { console.log(scope.totalSpent) })

      return OrderFactory.showCart('history')
      .then(function(history) { scope.cartHistory = history })
    }
  }

})
