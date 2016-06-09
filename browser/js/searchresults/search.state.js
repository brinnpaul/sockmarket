app.config(function ($stateProvider) {
	$stateProvider.state('searchResults', {
		url: '/search/:searchTerms',
		templateUrl: '/js/searchresults/search.view.html',
		controller: "searchCtrl",
		resolve: {
			allResults: function ($stateParams, SearchFactory) {
				return SearchFactory.findBySearchText($stateParams.searchTerms)
			}
		},
		// controller: function ($scope, allResults) {
		// 	$scope.results = allResults;
		// 	console.log("All Results!!", allResults);
		// 	$scope.number = 123;
		// }
		// controller: function ($scope, $stateParams) {
		// 	console.log("HEREEEEE", $stateParams.results)
		// 	$scope.results = $stateParams.results
		// }
	})
})
