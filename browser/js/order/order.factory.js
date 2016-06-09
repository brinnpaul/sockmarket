app.factory('OrderFactory', function($http) {
  return {
    addToCart: function(obj) {
      console.log("OBJECT", obj)
      return $http.post('/api/order/', obj)
      .then(function(res) {
        console.log("RESPONSE", res)
        return res.data
      })
    }
  }
})
