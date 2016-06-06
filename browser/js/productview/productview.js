app.config(function ($stateProvider) {

    // Register our *about* state.
    $stateProvider.state('productview', {
        url: '/product',
        controller: 'productViewController',
        templateUrl: 'js/productview/productview.html'
    });

    // $stateProvider.state('productview.productId', {
    //   url:'/product/:id'
    //   controller: 'productViewController',
    //   templateUrl: 'js/productview/productview.html'
    // })

});

app.controller('productViewController', function ($scope) {

});
