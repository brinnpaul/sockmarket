app.factory('SockFactory', function ($http) {

  return {
    singleSock: function(sockId) {
      return $http.get('/api/sock/'+sockId)
      .then(function(res) {
        return res.data
      })
    },

    mostRecentSocks: function () {
    	return $http.get('/api/sock/recent')
    	.then(function(res) {
    		return res.data
    	})
    }

  }

})
