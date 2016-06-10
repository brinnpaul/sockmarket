// app.factory('SignupFactory', function ($http) {

//   var SignupFactory = {};

//   SignupFactory.submit = function(userInfo){
//   	console.log(userInfo);
//   	return $http.post('/api/user/', userInfo)
//   	.then(function(response){
//   		return response.data;
//   	})
//   }

//   return SignupFactory;

// })

app.factory('SignupFactory', function ($http) {
	var SignupFactory = {};

	SignupFactory.submit = function (userInfo) {
		console.log("From Signup Factory", userInfo);
		return $http.post('/api/user/', userInfo)
		.then(function(response){
			return response.data;
		})
	}
	return SignupFactory;
})
