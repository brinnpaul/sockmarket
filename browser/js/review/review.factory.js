app.factory('ReviewFactory', function ($http) {

  return {
    postReview: function(obj) {
      return $http.post('/api/review/', obj)
      .then(function(res) {
        return res.data
      })
    },
    productReviews: function(sockId) {
      return $http.get('/api/review/sock/'+sockId)
      .then(function(res) {
        return res.data
      })
    }
  }

})
