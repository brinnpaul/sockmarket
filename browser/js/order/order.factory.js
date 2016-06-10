app.factory('OrderFactory', function($http) {
  return {
    addToCart: function(obj) {
      return $http.post('/api/order/', obj)
      .then(function(res) {
        return res.data
      })
    },
    showCart: function(type) {
      return $http.get('/api/order/'+type)
      .then(function(order) {
        return order.data
      })
    },
    updateItem: function(obj) {
      console.log(obj)
      return $http.put('/api/order', obj)
      .then(function(item) {
        return item.data
      })
    },
    deleteItem: function(itemId) {
      return $http.delete('/api/order/'+itemId)
      .then(function(item) {
        return item.data
      })
    }
  }
})
