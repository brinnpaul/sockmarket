app.factory('PersonalInfoFactory', function ($http) {

  // PersonalFactory = {};

  return {
    submit : function(id, userInfo){
      return $http.put('/api/user/' + id, userInfo)
      .then(function(response){
        return response.data;
      })
    }
  }

})
