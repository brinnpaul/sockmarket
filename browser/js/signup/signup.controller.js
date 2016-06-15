app.controller('SignupCtrl', function ($scope, SignupFactory, $state, AuthService) {

  function passwordValid (password) {
    if (password.length < 6) {
      $scope.showError = true;
      $scope.errorMessage = "Password must be 6 characters long!";
      return false;
    } else if (password !== $scope.pw2) {
      $scope.showError = true;
      $scope.errorMessage = "The password fields don't match!";
      return false;
    } else if (/\W/.test(password)){
      $scope.showError = true;
      $scope.errorMessage = "Password cannot contain special characters!";
      return false;
    } else {
      return true;
    }
  }

  $scope.showError = false;

  $scope.displayError = function() {
    return $scope.showError;
  }

  $scope.submitSignup = function () {
    if (passwordValid($scope.password)){
      return SignupFactory.submit({
       email: $scope.email,
       username: $scope.username,
       password: $scope.password,
       first_name: $scope.firstname,
       last_name: $scope.lastname,
       isAdmin: false,
       newUser: true
     }).then(function(response){
        var loginObj = {};
        loginObj.email = $scope.email;
        loginObj.password = $scope.password;
        AuthService.login(loginObj)
        .then(function(response){
          return $state.go('personal', {id: response.id});
        })
     })
    } else {
      return;
    }
  }
});
