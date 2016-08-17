app.factory('LikeFactory', function($http) {

  return {
    getAllLikes: function() {
      return $http.get('/api/like')
      .then(function(likes) {
        return likes.data;
      })
    },
    getSockLikes: function(sockId) {
      return $http.get('/api/like/sock/'+sockId)
      .then(function(likes) {
        return likes.data;
      })
    },
    getUserSockLike: function(sockId) {
      return $http.get('/api/like/user/sock/'+sockId)
      .then(function(like) {
        return like.data;
      })
    },
    getUserLikes: function(userId) {
      return $http.get('/api/like/user/'+userId)
      .then(function(likes) {
        return likes.data;
      })
    },
    newLike: function(sockId) {
      return $http.post('api/like/like/'+sockId)
      .then(function(like) {
        return like.data;
      })
    },
    newDislike: function(sockId) {
      return $http.post('api/like/dislike/'+sockId)
      .then(function(like) {
        return like.data;
      })
    },
    updateLike: function(sockId) {
      return $http.put('api/like/like/'+sockId)
      .then(function(like) {
        return like.data
      })
    },
    updateDislike: function(sockId) {
      return $http.put('api/like/dislike/'+sockId)
      .then(function(like) {
        return like.data;
      })
    }
  }
})