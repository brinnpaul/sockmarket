// app.controller('SignupCtrl', function ($scope, SignupFactory, $state) {

//   $scope.submitSignup = function(){
//     console.log("I work!");
//     // return SignupFactory.submit({
//     //   email: $scope.email,
//     //   username: $scope.username,
//     //   password: $scope.password,
//     //   first_name: $scope.firstname,
//     //   last_name: $scope.lastname
//     // }).then(function(result){
//     //   return $state.go('home');
//     // }
//   }

// });

app.controller('SignupCtrl', function ($scope, SignupFactory, $state) {

  $scope.submitSignup = function () {
    console.log("now I work!");
    return SignupFactory.submit({
      email: $scope.email,
      username: $scope.username,
      password: $scope.password,
      first_name: $scope.firstname,
      last_name: $scope.lastname,
      isAdmin: false
    }).then(function(res){
      console.log(res);
      return $state.go('signup.2', {res: res});
    })
  }
});