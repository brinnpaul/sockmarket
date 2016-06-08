app.controller('navbarCtrl', function ($scope, $state, SearchFactory) {

	$scope.search = function(searchTerms){
		// SearchFactory.findBySearchText(searchTerms)
		// .then(function(results){
		// 	$scope.results = results;
		// 	console.log(results);
			$state.go('searchResults', {searchTerms: searchTerms});
		// })
	}
})

app.controller('searchCtrl', function ($scope, $state, allResults) {
	$scope.results = allResults;
	$scope.logResults = function(){
		console.log(allResults);
	}
})