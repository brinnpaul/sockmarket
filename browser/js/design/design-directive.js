app.directive('designView', function (SockFactory) {
	return {
		restrict: 'E',
		templateUrl: 'js/design/design-view.html',
		// scope: {
		// 	theSock: '='
		// },
		link: function (scope, element, attrs, designViewCtrl) {
			var title = scope.title;
			var description = scope.description;
			// var tags = SockFactory.prepareTags(scope.tags)
			scope.saveDesign = function (title, description, tags) {
				var canvas = element.find('canvas')[0];
				var dataURL = canvas.toDataURL()
				console.log(dataURL)
				// console.log(description)
				var newSockDataObj = {
					title: title,
					description: description,
					// tags: scope.tags,
					// image: dataURL
				};
				return SockFactory.saveDesign(newSockDataObj)
			}
		}
	}
})