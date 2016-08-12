app.directive('sockAdminRow', () => {
  return {
    restrict: 'EA',
    scope: { sock: "=sockAdminRow" },
    templateUrl: 'js/admin/views/sockAdminRow.html',
    link: (scope, element, attrs) => {
      console.log(scope.sock)
    }
  }
})