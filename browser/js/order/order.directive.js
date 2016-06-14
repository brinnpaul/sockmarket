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
          .then(function(){
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
          .then(function() { return scope.calcTotal() })
          .then(function(newTotal) { scope.total = newTotal })
        }

        scope.singleSockView = function(id) { $state.go('singleSockView', {id: id}) }
        scope.toCheckout = function() { $state.go('checkout') }

        scope.calcTotal = function() {
          return OrderFactory.calculateTotal('current')
          .then(function(cartTotal) {
            scope.total = cartTotal
            return cartTotal
          })
        }

        scope.calcTotal()

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
