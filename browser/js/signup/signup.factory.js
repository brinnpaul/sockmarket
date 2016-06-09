app.factory('SignupFactory', function ($http) {

  var SignupFactory = {};

  SignupFactory.submit = function(userInfo){
  	return $http.post('/api/user', userInfo)
  	.then(function(response){
  		return response.data;
  	})
  }

  return SignupFactory;

})