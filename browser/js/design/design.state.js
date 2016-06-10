app.config(function ($stateProvider) {
    $stateProvider.state('design', {
      url:'/design',
      controller: 'DesignController',
      templateUrl: '<design-sock></design-sock>'
    })
});