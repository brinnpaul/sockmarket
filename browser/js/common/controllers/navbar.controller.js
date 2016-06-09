app.controller('navbarCtrl', function ($scope, $state, SearchFactory) {

	$scope.search = function(searchTerms){
		// SearchFactory.findBySearchText(searchTerms)
		// .then(function(results){
		// 	$scope.results = results;
		// 	console.log(results);
			return $state.go('searchResults', {searchTerms: searchTerms});
		// })
	}
})

app.controller('searchCtrl', function ($scope, $state, allResults, $stateParams) {
	$scope.results = allResults;
	$scope.seeSock = function (id) {
		$state.go('singleSockView', {id: id})
	}
})