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
    updateItem: function() {
      return $http.put('/api/order')
      .then(function(item) {
        return item.data
      })
    },
    deleteItem: function() {
      return $http.delete('/api/delete')
      .then(function(item) {
        return item.data
      })
    }
  }
})
