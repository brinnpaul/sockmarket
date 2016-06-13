app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state, OrderFactory) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function (scope) {

            OrderFactory.ensureCart()

            scope.items = [
                { label: 'Home', state: 'home' },
                { label: 'My Profile', state: 'user({userId:user.id})', auth: true },
                // { label: 'About', state: 'about' },
                { label: 'Design a Sock', state: 'designView' },
                { label: 'Admin Dashboard', state: 'admin'}
            ];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                   $state.go('home');
                });
            };

            var setUser = function () {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function () {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);

        }

    };

});
