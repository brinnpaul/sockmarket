
app.factory('OrderFactory', function($http) {
  var cachedCart = []
  var checkCart = function(obj, arr) {
    return arr.map(function(item) { return item.sockId }).indexOf(obj.sockId) === -1 ? false : true
  }
  return {
    addToCart: function(obj) {
      return $http.get('/api/order/current')
      .then(function(res) { return checkCart(obj, res.data) })
      .then(function(inCart) {
        if (inCart) {
          return "Already in Cart!"
        } else {
          return $http.post('/api/order/', obj)
          .then(function(res) { return res.data })
        }
      })
    },
    showCart: function(type) {
      //type = 'current' || type = 'history'
      return $http.get('/api/order/'+type)
      .then(function(order) {
        cachedCart = order.data
        return cachedCart || []
      })
    },
    calculateTotal: function(type) {
      return $http.get('/api/order/'+type)
      .then(function(order) {
        cachedCart = order.data
        return cachedCart || []
      })
      .then(function(cart) {
        if (type==='current') {
          return cart.reduce(function(o, item) {return o + (
            item.sock.price*item.quantity)}, 0)
        } else {
          return cart.reduce(function(o, order) {
            return o + order.items.reduce(function(o, item) {
              return o + (item.sock.price*item.quantity)}, 0)
          }, 0)
        }
      })
    },
    updateItem: function(obj) {
      return $http.put('/api/order', obj)
      .then(function(item) { return item.data })
    },
    deleteItem: function(itemId) {
      return $http.delete('/api/order/'+itemId)
      .then(function(toRemove) {
        cachedCart.splice(cachedCart.map(function(item) { return item.id }).indexOf(itemId),1)
        return cachedCart
      })
    },
    ensureCart: function() {
      return $http.get('/api/order/createcart')
      .then(function(order) {
        return {exists: order.data}
      })
    },

  }
})
