app.directive('designView', function (SockFactory) {
	return {
		restrict: 'E',
		templateUrl: 'js/design/design-view.html',
		scope: {
			theSock: '='
		},
		link: function (scope) {
			
		}
	}
})