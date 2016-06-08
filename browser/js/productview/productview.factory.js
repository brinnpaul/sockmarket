app.factory('ProductViewFactory', function ($http) {

  return {
    singleSock: function(sockId) {
      return $http.get('/api/sock/'+sockId)
      .then(function(res) {
        return res.data
      })
    }

  }

})
