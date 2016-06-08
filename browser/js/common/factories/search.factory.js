app.factory("SearchFactory", function ($http) {
	var SearchFactory = {};

	SearchFactory.findBySearchText = function (text) {
		return $http.get('/api/search/?q=' + text)
		.then(function(results) {
			return results.data;
		})
	}

	return SearchFactory;
})