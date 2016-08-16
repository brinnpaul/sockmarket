app.directive('sockAdminRow', function() {
  return {
    restrict: 'E',
    scope: {
      sock: "=sockAdminRow"
    },
    templateUrl: 'js/admin/views/sockAdminRow.html',
    link: function(scope) {
    }
  }
});