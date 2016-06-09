app.config(function ($stateProvider) {
    $stateProvider.state('designView', {
      url:'/socks/design/:id',
      scope: {
        theSock: '='
      },
      template: '<design-view the-sock="sock"></design-view>',
    })

});