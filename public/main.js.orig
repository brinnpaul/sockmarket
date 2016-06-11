'use strict';

window.app = angular.module('sockmarket', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    // Trigger page refresh when accessing an OAuth route
    $urlRouterProvider.when('/auth/:provider', function () {
        window.location.reload();
    });
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });
    });
});

app.config(function ($stateProvider) {

    // Register our *about* state.
    $stateProvider.state('about', {
        url: '/about',
        controller: 'AboutController',
        templateUrl: 'js/about/about.html'
    });
});

app.controller('AboutController', function ($scope, FullstackPics) {

    // Images of beautiful Fullstack people.
    $scope.images = _.shuffle(FullstackPics);
});

app.config(function ($stateProvider) {
    $stateProvider.state('docs', {
        url: '/docs',
        templateUrl: 'js/docs/docs.html'
    });
});

(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.

    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin).catch(function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin).catch(function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

app.directive('designView', function (SockFactory, $state) {
    return {
        restrict: 'E',
        templateUrl: 'js/design/design-view.html',
        // scope: {
        // 	theSock: '='
        // },
        link: function link(scope, element, attrs) {
            var title = scope.title;
            var description = scope.description;
            var tags = scope.tags;
            var canvas = element.find('canvas')[0];
            scope.saveDesign = function (title, description, tags) {
                var tagsArr = SockFactory.prepareTags(tags);
                console.log('TAGS:', tagsArr);
                var dataURL = canvas.toDataURL();
                // console.log(description)
                var newSockDataObj = {
                    title: title,
                    description: description,
                    tags: tagsArr,
                    image: dataURL
                };
                return SockFactory.saveDesign(newSockDataObj).then(function (result) {
                    $state.go('user', { userId: result.data.userId });
                });
            };

            var color = $(".selected").css("background-color");
            var context = $("canvas")[0].getContext("2d");
            var $canvas = $("canvas");
            var lastEvent;
            var mouseDown = false;

            var background = new Image();

            // context.fillStyle = '#f8f8ff';
            // context.opacity = 0;
            // context.fill()

            // function generateSockURL(){
            //   function generateRandomNumber() {
            //     return Math.floor(Math.random() * 3) + 1;
            //   }
            //   var num = generateRandomNumber();

            //   if (num === 1) return '/sock-bg/' + num + '.png'
            //   else return '/sock-bg/' + num + '.jpg';
            // }

            background.src = '/sock-bg/1.png';

            background.onload = function () {
                context.drawImage(background, 0, 0);
            };

            //When clicking on control list items
            $(".controls").on("click", "li", function () {
                //Deslect sibling elements
                $(this).siblings().removeClass("selected");
                //Select clicked element
                $(this).addClass("selected");
                //store the color
                color = $(this).css("background-color");
            });

            //When "Add Color" button is pressed
            $("#revealColorSelect").click(function () {
                //Show color select or hide the color select
                changeColor();
                $("#colorSelect").toggle();
            });

            //Update the new color span
            function changeColor() {
                var r = $("#red").val();
                var g = $("#green").val();
                var b = $("#blue").val();
                $("#newColor").css("background-color", "rgb(" + r + ", " + g + ", " + b + ")");
                //When color sliders change
            }

            $("input[type=range]").on("input", changeColor);

            //when "Add Color" is pressed
            $("#addNewColor").click(function () {
                //append the color to the controls ul
                var $newColor = $("<li></li>");
                $newColor.css("background-color", $("#newColor").css("background-color"));
                $(".controls ul").append($newColor);
                $(".controls li").siblings().removeClass("selected");
                $(".controls li").last().addClass("selected");
                color = $("#newColor").css("background-color");
                //when added, restore sliders and preview color to default
                $("#colorSelect").hide();
                var r = $("#red").val(0);
                var g = $("#green").val(0);
                var b = $("#blue").val(0);
                $("#newColor").css("background-color", "rgb(" + r + ", " + g + ", " + b + ")");
            });

            //On mouse events on the canvas
            $canvas.mousedown(function (e) {
                lastEvent = e;
                mouseDown = true;
            }).mousemove(function (e) {
                //draw lines
                if (mouseDown) {
                    context.beginPath();
                    context.moveTo(lastEvent.offsetX, lastEvent.offsetY);
                    context.lineTo(e.offsetX, e.offsetY);
                    context.strokeStyle = color;
                    context.stroke();
                    context.lineCap = 'round';
                    context.lineWidth = 20;

                    lastEvent = e;
                }
            }).mouseup(function () {
                mouseDown = false;
            }).mouseleave(function () {
                $canvas.mouseup();
            });

            // var sketch = element.find('#sketch');
            // console.log(sketch);
            // var sketchStyle = getComputedStyle(sketch)
            // canvas.width = parseInt(sketchStyle.getPropertyValue('width'));
            // canvas.height = parseInt(sketchStyle.getPropertyValue('height'));

            // var color = 'black';
            // scope.changeColor = function (chosenColor) {
            // 	color = chosenColor;
            // 	console.log('COLOR', color)
            // }		   

            // var ctx = canvas.getContext('2d');

            // ctx.lineWidth = 20;
            // ctx.lineJoin = 'round';
            // ctx.lineCap = 'round';

            // var currentMousePosition = {
            //     x: 0,
            //     y: 0
            // };

            // var lastMousePosition = {
            //     x: 0,
            //     y: 0
            // };

            // var drawing = false;

            // canvas.addEventListener('mousedown', function (e) {
            //     drawing = true;
            //     currentMousePosition.x = e.offsetX;
            //     currentMousePosition.y = e.offsetY;
            // });

            // canvas.addEventListener('mouseup', function () {
            //     drawing = false;
            // });

            // canvas.addEventListener('mousemove', function (e) {
            //     if (!drawing) return;

            //     lastMousePosition.x = currentMousePosition.x;
            //     lastMousePosition.y = currentMousePosition.y;

            //     currentMousePosition.x = e.offsetX;
            //     currentMousePosition.y = e.offsetY;

            //     console.log('POSITION', currentMousePosition)

            //     draw(lastMousePosition, currentMousePosition, color, true);

            // });

            // var draw = function (start, end, strokeColor) {

            //     // Draw the line between the start and end positions
            //     // that is colored with the given color.
            //     ctx.beginPath();
            //     ctx.strokeStyle = strokeColor || 'black';
            //     ctx.moveTo(start.x, start.y);
            //     ctx.lineTo(end.x, end.y);
            //     ctx.closePath();
            //     ctx.stroke();

            // };
        }
    };
});
app.controller('DesignController', function ($scope) {

    $scope.hi = "hi";
});
app.directive('designSock', function () {

    return {
        restrict: 'E',
        scope: {},
        controller: 'DesignController',
        templateUrl: 'js/design/design.view.html',
        link: function link(scope) {}

    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('designView', {
        url: '/socks/design/:id',
        scope: {
            theSock: '='
        },
        controller: 'designViewCtrl',
        template: '<design-view></design-view>'
    });
});

app.controller('designViewCtrl', function ($scope) {
    // // $scope.description;
    // $scope.tags;
    // $scope.title;
    // console.log($scope.description);
});
app.config(function ($stateProvider) {
    $stateProvider.state('design', {
        url: '/design',
        controller: 'DesignController',
        templateUrl: '<design-sock></design-sock>'
    });
});
app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'homeCtrl',
        resolve: {
            mostRecentSocks: function mostRecentSocks(SockFactory) {
                return SockFactory.mostRecentSocks();
            }
        }
    });
});

app.controller('homeCtrl', function ($scope, mostRecentSocks, $state, $stateParams) {

    $scope.mostRecentSocks = mostRecentSocks;
    $scope.seeSock = function (id) {
        $state.go('singleSockView', { id: id });
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/login/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, AuthService, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        AuthService.login(loginInfo).then(function () {
            $state.go('home');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('membersOnly', {
        url: '/members-area',
        template: '<img ng-repeat="item in stash" width="300" ng-src="{{ item }}" />',
        controller: function controller($scope, SecretStash) {
            SecretStash.getStash().then(function (stash) {
                $scope.stash = stash;
            });
        },
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });
});

app.factory('SecretStash', function ($http) {

    var getStash = function getStash() {
        return $http.get('/api/members/secret-stash').then(function (response) {
            return response.data;
        });
    };

    return {
        getStash: getStash
    };
});
app.controller('cartCurrent', function ($scope, OrderFactory, currentCart) {

    $scope.currentCart = currentCart;

    $scope.update = function (item) {
        var sock = {
            quantity: item.newAmount,
            id: item.id
        };
        return OrderFactory.updateItem(sock).then(function (res) {
            console.log("herere", res);
            item.quantity = item.newAmount;
            item.newAmount = null;
        });
    };

    $scope.delete = function (item) {

        return OrderFactory.deleteItem(item.id).then(function (item_deleted) {
            console.log(item_deleted);
        });
    };
});

app.controller('cartHistory', function ($scope, OrderFactory, cartHistory) {

    $scope.cartHistory = cartHistory;
});

app.factory('OrderFactory', function ($http) {
    return {
        addToCart: function addToCart(obj) {
            return $http.post('/api/order/', obj).then(function (res) {
                return res.data;
            });
        },
        showCart: function showCart(type) {
            return $http.get('/api/order/' + type).then(function (order) {
                return order.data;
            });
        },
        updateItem: function updateItem(obj) {
            console.log(obj);
            return $http.put('/api/order', obj).then(function (item) {
                return item.data;
            });
        },
        deleteItem: function deleteItem(itemId) {
            return $http.delete('/api/order/' + itemId).then(function (item) {
                return item.data;
            });
        }
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('currentCart', {
        url: '/cart/current',
        templateUrl: '/js/order/cart.html',
        controller: 'cartCurrent',
        resolve: {
            currentCart: function currentCart(OrderFactory) {
                return OrderFactory.showCart('current');
            }
        }
    });

    $stateProvider.state('cartHistory', {
        url: '/cart/history',
        templateUrl: '/js/order/history.html',
        controller: 'cartHistory',
        resolve: {
            cartHistory: function cartHistory(OrderFactory) {
                return OrderFactory.showCart('history');
            }
        }
    });
});

app.factory('SockFactory', function ($http) {

    return {
        singleSock: function singleSock(sockId) {
            return $http.get('/api/sock/' + sockId).then(function (res) {
                return res.data;
            });
        },

        sockByUserId: function sockByUserId(userId) {
            return $http.get('/api/sock/byUser/' + userId).then(function (res) {
                console.log('fetched', res.data);
                return res.data;
            });
        },

        mostRecentSocks: function mostRecentSocks() {
            return $http.get('/api/sock/recent').then(function (res) {
                return res.data;
            });
        },

        saveDesign: function saveDesign(newSockDataObj) {
            return $http.post('/api/sock/', newSockDataObj);
        },

        prepareTags: function prepareTags(tagInput) {
            return tagInput.split(' ').map(function (e) {
                e = e.replace(/,/i, "");
                e = e.substring(1);
                return e;
            });
        }

    };
});

// app.controller('sockViewController', function ($scope, SockFactory, ReviewFactory) {

//   $scope.setSock = function(sockId) {
//     return SockFactory.singleSock(sockId) // return?
//     .then(function(sock) {
//       $scope.sock = sock
//     })
//   }

//   $scope.setReviews = function(sockId) {
//     return ReviewFactory.productReviews(sockId)
//     .then(function(reviews) {
//       $scope.reviews = reviews
//     })
//   }

//   $scope.setSock(1);
//   $scope.setReviews(1);

//   $scope.newReview = function() {
//     var newReview = {
//       text: $scope.reviewText,
//       sockId: $scope.sock.id
//     }
//     return ReviewFactory.postReview(newReview)
//     .then(function(newReview){
//       var review = {};
//       review.user = {};

//         review.user.first_name = newReview.user.first_name;
//         review.user.last_name = newReview.user.last_name;
//         review.user.profile_pic = newReview.user.profile_pic;
//         review.user.username = newReview.user.username;
//         review.text = newReview.review.text;

//       $scope.reviews.push(review);
//       $scope.reviewText = null;
//     })
//   }

//   $scope.alreadyPosted = function() {
//     // add in after finishing other stuff
//   }

// });

app.controller('sockIdController', function ($scope, $stateParams, theSock, theReviews, ReviewFactory, OrderFactory) {

    $scope.sock = theSock;
    $scope.reviews = theReviews;
    $scope.alert = function () {
        $scope.alerting = !$scope.alerting;
    };

    $scope.addItem = function () {
        var item = {};
        item.sockId = $scope.sock.id;
        item.quantity = +$scope.quantity;
        console.log(item);
        if (item.quantity > 0) return OrderFactory.addToCart(item);
        //else $scope.alert()
    };

    $scope.newReview = function () {
        var newReview = {
            text: $scope.reviewText,
            sockId: $scope.sock.id
        };
        return ReviewFactory.postReview(newReview).then(function (newReview) {
            var review = {};
            review.user = {};

            review.user.first_name = newReview.user.first_name;
            review.user.last_name = newReview.user.last_name;
            review.user.profile_pic = newReview.user.profile_pic;
            review.user.username = newReview.user.username;
            review.text = newReview.review.text;

            $scope.reviews.push(review);
            $scope.reviewText = null;
        });
    };

    $scope.alreadyPosted = function () {
        // add in after finishing other stuff
    };
});

app.config(function ($stateProvider) {

    // Register our *about* state.
    // $stateProvider.state('socks', {
    //     url: '/socks',
    //     controller: 'sockViewController',
    //     templateUrl: 'js/productview/productview.html'
    // });

    $stateProvider.state('singleSockView', {
        url: '/socks/:id',
        controller: 'sockIdController',
        templateUrl: 'js/productview/productview.html',
        resolve: {
            theSock: function theSock($stateParams, SockFactory) {
                return SockFactory.singleSock($stateParams.id);
            },
            theReviews: function theReviews($stateParams, ReviewFactory) {
                return ReviewFactory.productReviews($stateParams.id);
            }
        }
    });
});

app.factory('ReviewFactory', function ($http) {

    return {
        postReview: function postReview(obj) {
            return $http.post('/api/review/', obj).then(function (res) {
                return res.data;
            });
        },
        productReviews: function productReviews(sockId) {
            return $http.get('/api/review/sock/' + sockId).then(function (res) {
                return res.data;
            });
        }
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('searchResults', {
        url: '/search/:searchTerms',
        templateUrl: '/js/searchresults/search.view.html',
        controller: "searchCtrl",
        resolve: {
            allResults: function allResults($stateParams, SearchFactory) {
                return SearchFactory.findBySearchText($stateParams.searchTerms);
            }
        }
    });
});

// controller: function ($scope, allResults) {
// 	$scope.results = allResults;
// 	console.log("All Results!!", allResults);
// 	$scope.number = 123;
// }
// controller: function ($scope, $stateParams) {
// 	console.log("HEREEEEE", $stateParams.results)
// 	$scope.results = $stateParams.results
// }
app.controller('SignupCtrl', function ($scope, SignupFactory, $state) {

    function passwordValid(password) {
        if (password.length < 6) {
            $scope.showError = true;
            $scope.errorMessage = "Password must be 6 characters long!";
            return false;
        } else if (password !== $scope.pw2) {
            $scope.showError = true;
            $scope.errorMessage = "The password fields don't match!";
            return false;
        } else if (/\W/.test(password)) {
            $scope.showError = true;
            $scope.errorMessage = "Password cannot contain special characters!";
            return false;
        } else {
            return true;
        }
    }

    $scope.showError = false;

    $scope.displayError = function () {
        return $scope.showError;
    };

    $scope.submitSignup = function () {
        if (passwordValid($scope.password)) {
            console.log("now I don't work!");
            return SignupFactory.submit({
                email: $scope.email,
                username: $scope.username,
                password: $scope.password,
                first_name: $scope.firstname,
                last_name: $scope.lastname,
                isAdmin: false,
                newUser: true
            }).then(function (res) {
                console.log(res);
                return $state.go('personal');
            });
        } else {
            return;
        }
    };
});
// app.factory('SignupFactory', function ($http) {

//   var SignupFactory = {};

//   SignupFactory.submit = function(userInfo){
//   	console.log(userInfo);
//   	return $http.post('/api/user/', userInfo)
//   	.then(function(response){
//   		return response.data;
//   	})
//   }

//   return SignupFactory;

// })

app.factory('SignupFactory', function ($http) {
    var SignupFactory = {};

    SignupFactory.submit = function (userInfo) {
        console.log("From Signup Factory", userInfo);
        return $http.post('/api/user/', userInfo).then(function (response) {
            return response.data;
        });
    };
    return SignupFactory;
});

app.config(function ($stateProvider) {
    $stateProvider.state('signup', {
        url: '/signup',
        controller: 'SignupCtrl',
        templateUrl: '/js/signup/signup.view.html'
    });

    $stateProvider.state('personal', {
        url: '/personal',
        controller: 'SignupCtrl',
        templateUrl: '/js/signup/personalinfo.view.html'
    });
});
app.controller('UserCtrl', function ($scope, $state, theUser, theUserSocks) {
    console.log("controller", theUserSocks);
    $scope.user = theUser;
    $scope.socks = theUserSocks;
    $scope.toSockView = function (id) {
        $state.go('singleSockView', { id: id });
    };
});

app.factory('UserFactory', function ($http) {
    var UserFactory = {};

    UserFactory.fetchById = function (id) {
        return $http.get('/api/user/' + id).then(function (response) {
            console.log("factory", response.data);
            return response.data;
        });
    };

    UserFactory.fetchAll = function () {
        return $http.get('/api/users').then(function (response) {
            return response.data;
        });
    };

    return UserFactory;
});

app.config(function ($stateProvider) {
    $stateProvider.state('user', {
        url: '/user/:userId',
        templateUrl: '/js/user/user-profile.html',
        controller: 'UserCtrl',
        resolve: {
            theUser: function theUser(UserFactory, $stateParams) {
                return UserFactory.fetchById($stateParams.userId);
            },
            theUserSocks: function theUserSocks(SockFactory, $stateParams) {
                return SockFactory.sockByUserId($stateParams.userId);
            }
        }
    });
});

app.controller('navbarCtrl', function ($scope, $state, SearchFactory) {

    $scope.search = function (searchTerms) {
        // SearchFactory.findBySearchText(searchTerms)
        // .then(function(results){
        // 	$scope.results = results;
        // 	console.log(results);
        return $state.go('searchResults', { searchTerms: searchTerms });
        // })
    };
});

app.controller('searchCtrl', function ($scope, $state, allResults, $stateParams) {
    $scope.results = allResults;
    $scope.seeSock = function (id) {
        $state.go('singleSockView', { id: id });
    };
});
app.factory('FullstackPics', function () {
    return ['https://pbs.twimg.com/media/B7gBXulCAAAXQcE.jpg:large', 'https://fbcdn-sphotos-c-a.akamaihd.net/hphotos-ak-xap1/t31.0-8/10862451_10205622990359241_8027168843312841137_o.jpg', 'https://pbs.twimg.com/media/B-LKUshIgAEy9SK.jpg', 'https://pbs.twimg.com/media/B79-X7oCMAAkw7y.jpg', 'https://pbs.twimg.com/media/B-Uj9COIIAIFAh0.jpg:large', 'https://pbs.twimg.com/media/B6yIyFiCEAAql12.jpg:large', 'https://pbs.twimg.com/media/CE-T75lWAAAmqqJ.jpg:large', 'https://pbs.twimg.com/media/CEvZAg-VAAAk932.jpg:large', 'https://pbs.twimg.com/media/CEgNMeOXIAIfDhK.jpg:large', 'https://pbs.twimg.com/media/CEQyIDNWgAAu60B.jpg:large', 'https://pbs.twimg.com/media/CCF3T5QW8AE2lGJ.jpg:large', 'https://pbs.twimg.com/media/CAeVw5SWoAAALsj.jpg:large', 'https://pbs.twimg.com/media/CAaJIP7UkAAlIGs.jpg:large', 'https://pbs.twimg.com/media/CAQOw9lWEAAY9Fl.jpg:large', 'https://pbs.twimg.com/media/B-OQbVrCMAANwIM.jpg:large', 'https://pbs.twimg.com/media/B9b_erwCYAAwRcJ.png:large', 'https://pbs.twimg.com/media/B5PTdvnCcAEAl4x.jpg:large', 'https://pbs.twimg.com/media/B4qwC0iCYAAlPGh.jpg:large', 'https://pbs.twimg.com/media/B2b33vRIUAA9o1D.jpg:large', 'https://pbs.twimg.com/media/BwpIwr1IUAAvO2_.jpg:large', 'https://pbs.twimg.com/media/BsSseANCYAEOhLw.jpg:large', 'https://pbs.twimg.com/media/CJ4vLfuUwAAda4L.jpg:large', 'https://pbs.twimg.com/media/CI7wzjEVEAAOPpS.jpg:large', 'https://pbs.twimg.com/media/CIdHvT2UsAAnnHV.jpg:large', 'https://pbs.twimg.com/media/CGCiP_YWYAAo75V.jpg:large', 'https://pbs.twimg.com/media/CIS4JPIWIAI37qu.jpg:large'];
});

app.factory('RandomGreetings', function () {

    var getRandomFromArray = function getRandomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    var greetings = ['Hello, world!', 'At long last, I live!', 'Hello, simple human.', 'What a beautiful day!', 'I\'m like any other project, except that I am yours. :)', 'This empty string is for Lindsay Levine.', 'こんにちは、ユーザー様。', 'Welcome. To. WEBSITE.', ':D', 'Yes, I think we\'ve met before.', 'Gimme 3 mins... I just grabbed this really dope frittata', 'If Cooper could offer only one piece of advice, it would be to nevSQUIRREL!'];

    return {
        greetings: greetings,
        getRandomGreeting: function getRandomGreeting() {
            return getRandomFromArray(greetings);
        }
    };
});

app.factory("SearchFactory", function ($http) {
    var SearchFactory = {};

    SearchFactory.findBySearchText = function (text) {
        return $http.get('/api/search/?q=' + text).then(function (results) {
            return results.data;
        });
    };

    return SearchFactory;
});
app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
    };
});
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'About', state: 'about' }, { label: 'Design', state: 'designView' }, { label: 'My Profile', state: 'user({userId:user.id})', auth: true }, { label: 'Members Only', state: 'membersOnly', auth: true }];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('home');
                });
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});

'use strict';

app.directive('oauthButton', function () {
    return {
        scope: {
            providerName: '@'
        },
        restrict: 'E',
        templateUrl: 'js/common/directives/oauth-button/oauth-button.html'
    };
});

app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiZG9jcy9kb2NzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJkZXNpZ24vZGVzaWduLWRpcmVjdGl2ZS5qcyIsImRlc2lnbi9kZXNpZ24uY29udHJvbGxlci5qcyIsImRlc2lnbi9kZXNpZ24uZGlyZWN0aXZlLmpzIiwiZGVzaWduL2Rlc2lnbi5qcyIsImRlc2lnbi9kZXNpZ24uc3RhdGUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJvcmRlci9vcmRlci5jb250cm9sbGVyLmpzIiwib3JkZXIvb3JkZXIuZmFjdG9yeS5qcyIsIm9yZGVyL29yZGVyLnN0YXRlLmpzIiwicHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuZmFjdG9yeS5qcyIsInByb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3LmpzIiwicmV2aWV3L3Jldmlldy5mYWN0b3J5LmpzIiwic2VhcmNocmVzdWx0cy9zZWFyY2guc3RhdGUuanMiLCJzaWdudXAvc2lnbnVwLmNvbnRyb2xsZXIuanMiLCJzaWdudXAvc2lnbnVwLmZhY3RvcnkuanMiLCJzaWdudXAvc2lnbnVwLnN0YXRlLmpzIiwidXNlci91c2VyLWNvbnRyb2xsZXIuanMiLCJ1c2VyL3VzZXItZmFjdG9yeS5qcyIsInVzZXIvdXNlci1zdGF0ZXMuanMiLCJjb21tb24vY29udHJvbGxlcnMvbmF2YmFyLmNvbnRyb2xsZXIuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvc2VhcmNoLmZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmRpcmVjdGl2ZS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQUNBLE9BQUEsR0FBQSxHQUFBLFFBQUEsTUFBQSxDQUFBLFlBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsQ0FBQSxDQUFBOztBQUVBLElBQUEsTUFBQSxDQUFBLFVBQUEsa0JBQUEsRUFBQSxpQkFBQSxFQUFBOztBQUVBLHNCQUFBLFNBQUEsQ0FBQSxJQUFBOztBQUVBLHVCQUFBLFNBQUEsQ0FBQSxHQUFBOztBQUVBLHVCQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQSxlQUFBLFFBQUEsQ0FBQSxNQUFBO0FBQ0EsS0FGQTtBQUdBLENBVEE7OztBQVlBLElBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7OztBQUdBLFFBQUEsK0JBQUEsU0FBQSw0QkFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsTUFBQSxJQUFBLElBQUEsTUFBQSxJQUFBLENBQUEsWUFBQTtBQUNBLEtBRkE7Ozs7QUFNQSxlQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsWUFBQSxDQUFBLDZCQUFBLE9BQUEsQ0FBQSxFQUFBOzs7QUFHQTtBQUNBOztBQUVBLFlBQUEsWUFBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0E7QUFDQTs7O0FBR0EsY0FBQSxjQUFBOztBQUVBLG9CQUFBLGVBQUEsR0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7Ozs7QUFJQSxnQkFBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsUUFBQSxJQUFBLEVBQUEsUUFBQTtBQUNBLGFBRkEsTUFFQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxPQUFBO0FBQ0E7QUFDQSxT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QUEsZUFBQSxFQUFBLFVBQUEsZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQSxrQkFBQSxHQURBO0FBRUEscUJBQUEseURBRkE7QUFHQSxjQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsUUFBQSxHQUFBLGdCQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ3NvY2ttYXJrZXQnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Fib3V0Jywge1xuICAgICAgICB1cmw6ICcvYWJvdXQnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWJvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hYm91dC9hYm91dC5odG1sJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Fib3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEZ1bGxzdGFja1BpY3MpIHtcblxuICAgIC8vIEltYWdlcyBvZiBiZWF1dGlmdWwgRnVsbHN0YWNrIHBlb3BsZS5cbiAgICAkc2NvcGUuaW1hZ2VzID0gXy5zaHVmZmxlKEZ1bGxzdGFja1BpY3MpO1xuXG59KTtcblxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZG9jcycsIHtcbiAgICAgICAgdXJsOiAnL2RvY3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2RvY3MvZG9jcy5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Rlc2lnblZpZXcnLCBmdW5jdGlvbiAoU29ja0ZhY3RvcnksICRzdGF0ZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9kZXNpZ24vZGVzaWduLXZpZXcuaHRtbCcsXG5cdFx0Ly8gc2NvcGU6IHtcblx0XHQvLyBcdHRoZVNvY2s6ICc9J1xuXHRcdC8vIH0sXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdFx0dmFyIHRpdGxlID0gc2NvcGUudGl0bGU7XG5cdFx0XHR2YXIgZGVzY3JpcHRpb24gPSBzY29wZS5kZXNjcmlwdGlvbjtcblx0XHRcdHZhciB0YWdzID0gc2NvcGUudGFncztcblx0XHRcdHZhciBjYW52YXMgPSBlbGVtZW50LmZpbmQoJ2NhbnZhcycpWzBdO1xuXHRcdFx0c2NvcGUuc2F2ZURlc2lnbiA9IGZ1bmN0aW9uICh0aXRsZSwgZGVzY3JpcHRpb24sIHRhZ3MpIHtcblx0XHRcdFx0dmFyIHRhZ3NBcnIgPSBTb2NrRmFjdG9yeS5wcmVwYXJlVGFncyh0YWdzKVxuXHRcdFx0XHRjb25zb2xlLmxvZygnVEFHUzonLCB0YWdzQXJyKTtcblx0XHRcdFx0dmFyIGRhdGFVUkwgPSBjYW52YXMudG9EYXRhVVJMKClcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coZGVzY3JpcHRpb24pXG5cdFx0XHRcdHZhciBuZXdTb2NrRGF0YU9iaiA9IHtcblx0XHRcdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuXHRcdFx0XHRcdHRhZ3M6IHRhZ3NBcnIsXG5cdFx0XHRcdFx0aW1hZ2U6IGRhdGFVUkxcblx0XHRcdFx0fTtcblx0XHRcdFx0cmV0dXJuIFNvY2tGYWN0b3J5LnNhdmVEZXNpZ24obmV3U29ja0RhdGFPYmopXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0XHRcdFx0XHQkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiByZXN1bHQuZGF0YS51c2VySWR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fTtcblxuXG5cdFx0XHR2YXIgY29sb3IgPSAkKFwiLnNlbGVjdGVkXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XG5cdFx0XHR2YXIgY29udGV4dCA9ICQoXCJjYW52YXNcIilbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXHRcdFx0dmFyICRjYW52YXMgPSAkKFwiY2FudmFzXCIpO1xuXHRcdFx0dmFyIGxhc3RFdmVudDtcblx0XHRcdHZhciBtb3VzZURvd24gPSBmYWxzZTtcblxuXHRcdFx0dmFyIGJhY2tncm91bmQgPSBuZXcgSW1hZ2UoKTtcblxuXHRcdFx0Ly8gY29udGV4dC5maWxsU3R5bGUgPSAnI2Y4ZjhmZic7XG5cdFx0XHQvLyBjb250ZXh0Lm9wYWNpdHkgPSAwO1xuXHRcdFx0Ly8gY29udGV4dC5maWxsKClcblxuXHRcdFx0Ly8gZnVuY3Rpb24gZ2VuZXJhdGVTb2NrVVJMKCl7XG5cdFx0XHQvLyAgIGZ1bmN0aW9uIGdlbmVyYXRlUmFuZG9tTnVtYmVyKCkge1xuXHRcdFx0Ly8gICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzKSArIDE7XG5cdFx0XHQvLyAgIH1cblx0XHRcdC8vICAgdmFyIG51bSA9IGdlbmVyYXRlUmFuZG9tTnVtYmVyKCk7XG5cblx0XHRcdC8vICAgaWYgKG51bSA9PT0gMSkgcmV0dXJuICcvc29jay1iZy8nICsgbnVtICsgJy5wbmcnXG5cdFx0XHQvLyAgIGVsc2UgcmV0dXJuICcvc29jay1iZy8nICsgbnVtICsgJy5qcGcnO1xuXHRcdFx0Ly8gfVxuXG5cdFx0XHRiYWNrZ3JvdW5kLnNyYyA9ICcvc29jay1iZy8xLnBuZyc7XG5cblx0XHRcdGJhY2tncm91bmQub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQgIGNvbnRleHQuZHJhd0ltYWdlKGJhY2tncm91bmQsIDAsIDApO1xuXHRcdFx0fTtcblxuXHRcdFx0Ly9XaGVuIGNsaWNraW5nIG9uIGNvbnRyb2wgbGlzdCBpdGVtc1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzXCIpLm9uKFwiY2xpY2tcIiwgXCJsaVwiICwgZnVuY3Rpb24oKXtcblx0XHRcdCAgICAgLy9EZXNsZWN0IHNpYmxpbmcgZWxlbWVudHNcblx0XHRcdCAgICAgJCh0aGlzKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vU2VsZWN0IGNsaWNrZWQgZWxlbWVudFxuXHRcdFx0ICAgICAkKHRoaXMpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vc3RvcmUgdGhlIGNvbG9yXG5cdFx0XHQgICAgIGNvbG9yID0gJCh0aGlzKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICB9KTtcblxuXHRcdFx0Ly9XaGVuIFwiQWRkIENvbG9yXCIgYnV0dG9uIGlzIHByZXNzZWRcblx0XHRcdCAgJChcIiNyZXZlYWxDb2xvclNlbGVjdFwiKS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCAgLy9TaG93IGNvbG9yIHNlbGVjdCBvciBoaWRlIHRoZSBjb2xvciBzZWxlY3Rcblx0XHRcdCAgICBjaGFuZ2VDb2xvcigpO1xuXHRcdFx0ICBcdCQoXCIjY29sb3JTZWxlY3RcIikudG9nZ2xlKCk7XG5cdFx0XHQgIH0pO1xuXG5cdFx0XHQvL1VwZGF0ZSB0aGUgbmV3IGNvbG9yIHNwYW5cblx0XHRcdGZ1bmN0aW9uIGNoYW5nZUNvbG9yKCl7XG5cdFx0XHRcdHZhciByID0gJChcIiNyZWRcIikudmFsKCk7XG5cdFx0XHRcdHZhciBnID0gJChcIiNncmVlblwiKS52YWwoKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKCk7XG5cdFx0XHRcdCQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYihcIiArIHIgKyBcIiwgXCIgKyBnICsgXCIsIFwiICsgYiArIFwiKVwiKTtcblx0XHRcdCAgLy9XaGVuIGNvbG9yIHNsaWRlcnMgY2hhbmdlXG5cblxuXHRcdFx0fVxuXG5cdFx0XHQkKFwiaW5wdXRbdHlwZT1yYW5nZV1cIikub24oXCJpbnB1dFwiLCBjaGFuZ2VDb2xvcik7XG5cblx0XHRcdC8vd2hlbiBcIkFkZCBDb2xvclwiIGlzIHByZXNzZWRcblx0XHRcdCQoXCIjYWRkTmV3Q29sb3JcIikuY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdCAgLy9hcHBlbmQgdGhlIGNvbG9yIHRvIHRoZSBjb250cm9scyB1bFxuXHRcdFx0ICB2YXIgJG5ld0NvbG9yID0gJChcIjxsaT48L2xpPlwiKTtcblx0XHRcdCAgJG5ld0NvbG9yLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpKTtcblx0XHRcdCAgJChcIi5jb250cm9scyB1bFwiKS5hcHBlbmQoJG5ld0NvbG9yKTtcblx0XHRcdCAgJChcIi5jb250cm9scyBsaVwiKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgbGlcIikubGFzdCgpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgIGNvbG9yID0gJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICAvL3doZW4gYWRkZWQsIHJlc3RvcmUgc2xpZGVycyBhbmQgcHJldmlldyBjb2xvciB0byBkZWZhdWx0XG5cdFx0XHQgICQoXCIjY29sb3JTZWxlY3RcIikuaGlkZSgpO1xuXHRcdFx0XHR2YXIgciA9ICQoXCIjcmVkXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGcgPSAkKFwiI2dyZWVuXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKDApO1xuXHRcdFx0XHQkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2IoXCIgKyByICsgXCIsIFwiICsgZyArIFwiLCBcIiArIGIgKyBcIilcIik7XG5cblx0XHRcdH0pXG5cblx0XHRcdC8vT24gbW91c2UgZXZlbnRzIG9uIHRoZSBjYW52YXNcblx0XHRcdCRjYW52YXMubW91c2Vkb3duKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICBsYXN0RXZlbnQgPSBlO1xuXHRcdFx0ICBtb3VzZURvd24gPSB0cnVlO1xuXHRcdFx0fSkubW91c2Vtb3ZlKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICAvL2RyYXcgbGluZXNcblx0XHRcdCAgaWYgKG1vdXNlRG93bil7XG5cdFx0XHQgICAgY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdCAgICBjb250ZXh0Lm1vdmVUbyhsYXN0RXZlbnQub2Zmc2V0WCxsYXN0RXZlbnQub2Zmc2V0WSk7XG5cdFx0XHQgICAgY29udGV4dC5saW5lVG8oZS5vZmZzZXRYLCBlLm9mZnNldFkpO1xuXHRcdFx0ICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBjb2xvcjtcblx0XHRcdCAgICBjb250ZXh0LnN0cm9rZSgpO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZUNhcCA9ICdyb3VuZCc7XG5cdFx0XHQgICAgY29udGV4dC5saW5lV2lkdGggPSAyMDtcblxuXHRcdFx0ICAgIGxhc3RFdmVudCA9IGU7XG5cdFx0XHQgIH1cblx0XHRcdH0pLm1vdXNldXAoZnVuY3Rpb24oKXtcblx0XHRcdCAgICBtb3VzZURvd24gPSBmYWxzZTtcblx0XHRcdH0pLm1vdXNlbGVhdmUoZnVuY3Rpb24oKXtcblx0XHRcdCAgICAkY2FudmFzLm1vdXNldXAoKTtcblx0XHRcdH0pO1xuXG5cblxuXG5cdFx0XHQvLyB2YXIgc2tldGNoID0gZWxlbWVudC5maW5kKCcjc2tldGNoJyk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhza2V0Y2gpO1xuXHRcdFx0Ly8gdmFyIHNrZXRjaFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShza2V0Y2gpXG5cdFx0ICAgIC8vIGNhbnZhcy53aWR0aCA9IHBhcnNlSW50KHNrZXRjaFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3dpZHRoJykpO1xuXHRcdCAgICAvLyBjYW52YXMuaGVpZ2h0ID0gcGFyc2VJbnQoc2tldGNoU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JykpO1xuXG5cblxuXHQgICAgXHQvLyB2YXIgY29sb3IgPSAnYmxhY2snO1xuXHRcdCAgICAvLyBzY29wZS5jaGFuZ2VDb2xvciA9IGZ1bmN0aW9uIChjaG9zZW5Db2xvcikge1xuXHRcdCAgICAvLyBcdGNvbG9yID0gY2hvc2VuQ29sb3I7XG5cdFx0ICAgIC8vIFx0Y29uc29sZS5sb2coJ0NPTE9SJywgY29sb3IpXG5cdFx0ICAgIC8vIH1cdFx0ICAgIFxuXG5cdFx0ICAgIC8vIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRcdCAgICAvLyBjdHgubGluZVdpZHRoID0gMjA7XG5cdFx0ICAgIC8vIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG5cdFx0ICAgIC8vIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcblxuXHRcdCAgICAvLyB2YXIgY3VycmVudE1vdXNlUG9zaXRpb24gPSB7XG5cdFx0ICAgIC8vICAgICB4OiAwLFxuXHRcdCAgICAvLyAgICAgeTogMFxuXHRcdCAgICAvLyB9O1xuXG5cdFx0ICAgIC8vIHZhciBsYXN0TW91c2VQb3NpdGlvbiA9IHtcblx0XHQgICAgLy8gICAgIHg6IDAsXG5cdFx0ICAgIC8vICAgICB5OiAwXG5cdFx0ICAgIC8vIH07XG5cblx0XHQgICAgLy8gdmFyIGRyYXdpbmcgPSBmYWxzZTtcblxuXHRcdCAgICAvLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcblx0XHQgICAgLy8gICAgIGRyYXdpbmcgPSB0cnVlO1xuXHRcdCAgICAvLyAgICAgY3VycmVudE1vdXNlUG9zaXRpb24ueCA9IGUub2Zmc2V0WDtcblx0XHQgICAgLy8gICAgIGN1cnJlbnRNb3VzZVBvc2l0aW9uLnkgPSBlLm9mZnNldFk7XG5cdFx0ICAgIC8vIH0pO1xuXG5cdFx0ICAgIC8vIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZnVuY3Rpb24gKCkge1xuXHRcdCAgICAvLyAgICAgZHJhd2luZyA9IGZhbHNlO1xuXHRcdCAgICAvLyB9KTtcblxuXHRcdCAgICAvLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24gKGUpIHtcblx0XHQgICAgLy8gICAgIGlmICghZHJhd2luZykgcmV0dXJuO1xuXG5cdFx0ICAgIC8vICAgICBsYXN0TW91c2VQb3NpdGlvbi54ID0gY3VycmVudE1vdXNlUG9zaXRpb24ueDtcblx0XHQgICAgLy8gICAgIGxhc3RNb3VzZVBvc2l0aW9uLnkgPSBjdXJyZW50TW91c2VQb3NpdGlvbi55O1xuXG5cdFx0ICAgIC8vICAgICBjdXJyZW50TW91c2VQb3NpdGlvbi54ID0gZS5vZmZzZXRYO1xuXHRcdCAgICAvLyAgICAgY3VycmVudE1vdXNlUG9zaXRpb24ueSA9IGUub2Zmc2V0WTtcblxuXHRcdCAgICAvLyAgICAgY29uc29sZS5sb2coJ1BPU0lUSU9OJywgY3VycmVudE1vdXNlUG9zaXRpb24pXG5cblx0XHQgICAgLy8gICAgIGRyYXcobGFzdE1vdXNlUG9zaXRpb24sIGN1cnJlbnRNb3VzZVBvc2l0aW9uLCBjb2xvciwgdHJ1ZSk7XG5cblx0XHQgICAgLy8gfSk7XG5cblx0XHQgICAgLy8gdmFyIGRyYXcgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCwgc3Ryb2tlQ29sb3IpIHtcblxuXHRcdCAgICAvLyAgICAgLy8gRHJhdyB0aGUgbGluZSBiZXR3ZWVuIHRoZSBzdGFydCBhbmQgZW5kIHBvc2l0aW9uc1xuXHRcdCAgICAvLyAgICAgLy8gdGhhdCBpcyBjb2xvcmVkIHdpdGggdGhlIGdpdmVuIGNvbG9yLlxuXHRcdCAgICAvLyAgICAgY3R4LmJlZ2luUGF0aCgpO1xuXHRcdCAgICAvLyAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlQ29sb3IgfHwgJ2JsYWNrJztcblx0XHQgICAgLy8gICAgIGN0eC5tb3ZlVG8oc3RhcnQueCwgc3RhcnQueSk7XG5cdFx0ICAgIC8vICAgICBjdHgubGluZVRvKGVuZC54LCBlbmQueSk7XG5cdFx0ICAgIC8vICAgICBjdHguY2xvc2VQYXRoKCk7XG5cdFx0ICAgIC8vICAgICBjdHguc3Ryb2tlKCk7XG5cblx0XHQgICAgLy8gfTtcblxuXHRcdH1cblx0fVxufSkiLCJhcHAuY29udHJvbGxlcignRGVzaWduQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUpIHtcblxuICAkc2NvcGUuaGkgPSBcImhpXCI7XG5cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2Rlc2lnblNvY2snLCBmdW5jdGlvbiAoKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIGNvbnRyb2xsZXI6ICdEZXNpZ25Db250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9kZXNpZ24vZGVzaWduLnZpZXcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rlc2lnblZpZXcnLCB7XG4gICAgICB1cmw6Jy9zb2Nrcy9kZXNpZ24vOmlkJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIHRoZVNvY2s6ICc9J1xuICAgICAgfSxcbiAgICAgIGNvbnRyb2xsZXI6ICdkZXNpZ25WaWV3Q3RybCcsXG4gICAgICB0ZW1wbGF0ZTogJzxkZXNpZ24tdmlldz48L2Rlc2lnbi12aWV3PicsXG4gICAgfSlcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdkZXNpZ25WaWV3Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0Ly8gLy8gJHNjb3BlLmRlc2NyaXB0aW9uO1xuXHQvLyAkc2NvcGUudGFncztcblx0Ly8gJHNjb3BlLnRpdGxlO1xuXHQvLyBjb25zb2xlLmxvZygkc2NvcGUuZGVzY3JpcHRpb24pO1xufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkZXNpZ24nLCB7XG4gICAgICB1cmw6Jy9kZXNpZ24nLFxuICAgICAgY29udHJvbGxlcjogJ0Rlc2lnbkNvbnRyb2xsZXInLFxuICAgICAgdGVtcGxhdGVVcmw6ICc8ZGVzaWduLXNvY2s+PC9kZXNpZ24tc29jaz4nXG4gICAgfSlcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ2hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdG1vc3RSZWNlbnRTb2NrczogZnVuY3Rpb24gKFNvY2tGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU29ja0ZhY3RvcnkubW9zdFJlY2VudFNvY2tzKClcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignaG9tZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBtb3N0UmVjZW50U29ja3MsICRzdGF0ZSwgJHN0YXRlUGFyYW1zKSB7XG5cbiAgJHNjb3BlLm1vc3RSZWNlbnRTb2NrcyA9IG1vc3RSZWNlbnRTb2Nrc1xuICAkc2NvcGUuc2VlU29jayA9IGZ1bmN0aW9uIChpZCkge1xuICAgICRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcbiAgfVxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcbiAgICAgICAgICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTtcblxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICB2YXIgZ2V0U3Rhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcbiAgICB9O1xuXG59KTsiLCJhcHAuY29udHJvbGxlcignY2FydEN1cnJlbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGN1cnJlbnRDYXJ0KSB7XG5cbiAgJHNjb3BlLmN1cnJlbnRDYXJ0ID0gY3VycmVudENhcnRcblxuICAkc2NvcGUudXBkYXRlID0gZnVuY3Rpb24oaXRlbSkge1xuICAgIHZhciBzb2NrID0ge1xuICAgICAgcXVhbnRpdHk6IGl0ZW0ubmV3QW1vdW50LFxuICAgICAgaWQ6IGl0ZW0uaWRcbiAgICB9XG4gICAgcmV0dXJuIE9yZGVyRmFjdG9yeS51cGRhdGVJdGVtKHNvY2spXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKXtcbiAgICAgIGNvbnNvbGUubG9nKFwiaGVyZXJlXCIsIHJlcylcbiAgICAgIGl0ZW0ucXVhbnRpdHkgPSBpdGVtLm5ld0Ftb3VudDtcbiAgICAgIGl0ZW0ubmV3QW1vdW50ID0gbnVsbDtcbiAgICB9KVxuICB9XG5cbiAgJHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcblxuICAgIHJldHVybiBPcmRlckZhY3RvcnkuZGVsZXRlSXRlbShpdGVtLmlkKVxuICAgIC50aGVuKGZ1bmN0aW9uKGl0ZW1fZGVsZXRlZCkge1xuICAgICAgY29uc29sZS5sb2coaXRlbV9kZWxldGVkKVxuICAgIH0pXG4gIH1cblxufSlcblxuXG5hcHAuY29udHJvbGxlcignY2FydEhpc3RvcnknLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGNhcnRIaXN0b3J5KSB7XG5cbiAgJHNjb3BlLmNhcnRIaXN0b3J5ID0gY2FydEhpc3RvcnlcblxufSlcbiIsImFwcC5mYWN0b3J5KCdPcmRlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuICByZXR1cm4ge1xuICAgIGFkZFRvQ2FydDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9vcmRlci8nLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG4gICAgc2hvd0NhcnQ6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvJyt0eXBlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVyLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcbiAgICB1cGRhdGVJdGVtOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIGNvbnNvbGUubG9nKG9iailcbiAgICAgIHJldHVybiAkaHR0cC5wdXQoJy9hcGkvb3JkZXInLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcbiAgICBkZWxldGVJdGVtOiBmdW5jdGlvbihpdGVtSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5kZWxldGUoJy9hcGkvb3JkZXIvJytpdGVtSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtLmRhdGFcbiAgICAgIH0pXG4gICAgfVxuICB9XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2N1cnJlbnRDYXJ0Jywge1xuICAgIHVybDogJy9jYXJ0L2N1cnJlbnQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL29yZGVyL2NhcnQuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ2NhcnRDdXJyZW50Jyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRjdXJyZW50Q2FydDogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuXHRcdFx0XHRyZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdjdXJyZW50Jylcblx0XHRcdH1cblx0XHR9XG4gIH0pXG5cbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnRIaXN0b3J5Jywge1xuICAgIHVybDogJy9jYXJ0L2hpc3RvcnknLFxuICAgIHRlbXBsYXRlVXJsOiAnL2pzL29yZGVyL2hpc3RvcnkuaHRtbCcsXG4gICAgY29udHJvbGxlcjogJ2NhcnRIaXN0b3J5JyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBjYXJ0SGlzdG9yeTogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdoaXN0b3J5Jyk7XG4gICAgICB9XG4gICAgfVxuICB9KVxuXG59KVxuIiwiYXBwLmZhY3RvcnkoJ1NvY2tGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBzaW5nbGVTb2NrOiBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay8nK3NvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIHNvY2tCeVVzZXJJZDogZnVuY3Rpb24odXNlcklkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svYnlVc2VyLycgKyB1c2VySWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2ZldGNoZWQnLCByZXMuZGF0YSlcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBtb3N0UmVjZW50U29ja3M6IGZ1bmN0aW9uICgpIHtcbiAgICBcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay9yZWNlbnQnKVxuICAgIFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgXHRcdHJldHVybiByZXMuZGF0YVxuICAgIFx0fSlcbiAgICB9LFxuXG4gICAgc2F2ZURlc2lnbjogZnVuY3Rpb24gKG5ld1NvY2tEYXRhT2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9zb2NrLycsIG5ld1NvY2tEYXRhT2JqKVxuICAgIH0sXG5cbiAgICBwcmVwYXJlVGFnczogZnVuY3Rpb24gKHRhZ0lucHV0KSB7XG4gICAgICByZXR1cm4gdGFnSW5wdXQuc3BsaXQoJyAnKS5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICBlID0gZS5yZXBsYWNlKC8sL2ksIFwiXCIpO1xuICAgICAgICBlID0gZS5zdWJzdHJpbmcoMSk7XG4gICAgICAgIHJldHVybiBlXG4gICAgICB9KTtcbiAgICB9XG5cbiAgfVxuXG59KVxuIiwiLy8gYXBwLmNvbnRyb2xsZXIoJ3NvY2tWaWV3Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFNvY2tGYWN0b3J5LCBSZXZpZXdGYWN0b3J5KSB7XG5cbi8vICAgJHNjb3BlLnNldFNvY2sgPSBmdW5jdGlvbihzb2NrSWQpIHtcbi8vICAgICByZXR1cm4gU29ja0ZhY3Rvcnkuc2luZ2xlU29jayhzb2NrSWQpIC8vIHJldHVybj9cbi8vICAgICAudGhlbihmdW5jdGlvbihzb2NrKSB7XG4vLyAgICAgICAkc2NvcGUuc29jayA9IHNvY2tcbi8vICAgICB9KVxuLy8gICB9XG5cbi8vICAgJHNjb3BlLnNldFJldmlld3MgPSBmdW5jdGlvbihzb2NrSWQpIHtcbi8vICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wcm9kdWN0UmV2aWV3cyhzb2NrSWQpXG4vLyAgICAgLnRoZW4oZnVuY3Rpb24ocmV2aWV3cykge1xuLy8gICAgICAgJHNjb3BlLnJldmlld3MgPSByZXZpZXdzXG4vLyAgICAgfSlcbi8vICAgfVxuXG4vLyAgICRzY29wZS5zZXRTb2NrKDEpO1xuLy8gICAkc2NvcGUuc2V0UmV2aWV3cygxKTtcblxuLy8gICAkc2NvcGUubmV3UmV2aWV3ID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgdmFyIG5ld1JldmlldyA9IHtcbi8vICAgICAgIHRleHQ6ICRzY29wZS5yZXZpZXdUZXh0LFxuLy8gICAgICAgc29ja0lkOiAkc2NvcGUuc29jay5pZFxuLy8gICAgIH1cbi8vICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wb3N0UmV2aWV3KG5ld1Jldmlldylcbi8vICAgICAudGhlbihmdW5jdGlvbihuZXdSZXZpZXcpe1xuLy8gICAgICAgdmFyIHJldmlldyA9IHt9O1xuLy8gICAgICAgcmV2aWV3LnVzZXIgPSB7fTtcblxuLy8gICAgICAgICByZXZpZXcudXNlci5maXJzdF9uYW1lID0gbmV3UmV2aWV3LnVzZXIuZmlyc3RfbmFtZTtcbi8vICAgICAgICAgcmV2aWV3LnVzZXIubGFzdF9uYW1lID0gbmV3UmV2aWV3LnVzZXIubGFzdF9uYW1lO1xuLy8gICAgICAgICByZXZpZXcudXNlci5wcm9maWxlX3BpYyA9IG5ld1Jldmlldy51c2VyLnByb2ZpbGVfcGljO1xuLy8gICAgICAgICByZXZpZXcudXNlci51c2VybmFtZSA9IG5ld1Jldmlldy51c2VyLnVzZXJuYW1lO1xuLy8gICAgICAgICByZXZpZXcudGV4dCA9IG5ld1Jldmlldy5yZXZpZXcudGV4dDtcblxuLy8gICAgICAgJHNjb3BlLnJldmlld3MucHVzaChyZXZpZXcpO1xuLy8gICAgICAgJHNjb3BlLnJldmlld1RleHQgPSBudWxsO1xuLy8gICAgIH0pXG4vLyAgIH1cblxuLy8gICAkc2NvcGUuYWxyZWFkeVBvc3RlZCA9IGZ1bmN0aW9uKCkge1xuLy8gICAgIC8vIGFkZCBpbiBhZnRlciBmaW5pc2hpbmcgb3RoZXIgc3R1ZmZcbi8vICAgfVxuXG4vLyB9KTtcblxuYXBwLmNvbnRyb2xsZXIoJ3NvY2tJZENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMsIHRoZVNvY2ssIHRoZVJldmlld3MsIFJldmlld0ZhY3RvcnksIE9yZGVyRmFjdG9yeSkge1xuXG4gICRzY29wZS5zb2NrID0gdGhlU29jaztcbiAgJHNjb3BlLnJldmlld3MgPSB0aGVSZXZpZXdzO1xuICAkc2NvcGUuYWxlcnQgPSBmdW5jdGlvbigpIHtcbiAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nXG4gIH1cblxuICAkc2NvcGUuYWRkSXRlbSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtID0ge31cbiAgICBpdGVtLnNvY2tJZCA9ICRzY29wZS5zb2NrLmlkXG4gICAgaXRlbS5xdWFudGl0eSA9ICskc2NvcGUucXVhbnRpdHlcbiAgICBjb25zb2xlLmxvZyhpdGVtKVxuICAgIGlmIChpdGVtLnF1YW50aXR5ID4gMCkgcmV0dXJuIE9yZGVyRmFjdG9yeS5hZGRUb0NhcnQoaXRlbSlcbiAgICAvL2Vsc2UgJHNjb3BlLmFsZXJ0KClcbiAgfVxuXG4gICRzY29wZS5uZXdSZXZpZXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmV3UmV2aWV3ID0ge1xuICAgICAgdGV4dDogJHNjb3BlLnJldmlld1RleHQsXG4gICAgICBzb2NrSWQ6ICRzY29wZS5zb2NrLmlkXG4gICAgfVxuICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LnBvc3RSZXZpZXcobmV3UmV2aWV3KVxuICAgIC50aGVuKGZ1bmN0aW9uKG5ld1Jldmlldyl7XG4gICAgICB2YXIgcmV2aWV3ID0ge307XG4gICAgICByZXZpZXcudXNlciA9IHt9O1xuXG4gICAgICAgIHJldmlldy51c2VyLmZpcnN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5maXJzdF9uYW1lO1xuICAgICAgICByZXZpZXcudXNlci5sYXN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5sYXN0X25hbWU7XG4gICAgICAgIHJldmlldy51c2VyLnByb2ZpbGVfcGljID0gbmV3UmV2aWV3LnVzZXIucHJvZmlsZV9waWM7XG4gICAgICAgIHJldmlldy51c2VyLnVzZXJuYW1lID0gbmV3UmV2aWV3LnVzZXIudXNlcm5hbWU7XG4gICAgICAgIHJldmlldy50ZXh0ID0gbmV3UmV2aWV3LnJldmlldy50ZXh0O1xuXG4gICAgICAkc2NvcGUucmV2aWV3cy5wdXNoKHJldmlldyk7XG4gICAgICAkc2NvcGUucmV2aWV3VGV4dCA9IG51bGw7XG4gICAgfSlcbiAgfVxuXG4gICRzY29wZS5hbHJlYWR5UG9zdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gYWRkIGluIGFmdGVyIGZpbmlzaGluZyBvdGhlciBzdHVmZlxuICB9XG5cbn0pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgLy8gJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NvY2tzJywge1xuICAgIC8vICAgICB1cmw6ICcvc29ja3MnLFxuICAgIC8vICAgICBjb250cm9sbGVyOiAnc29ja1ZpZXdDb250cm9sbGVyJyxcbiAgICAvLyAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0dmlldy9wcm9kdWN0dmlldy5odG1sJ1xuICAgIC8vIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpbmdsZVNvY2tWaWV3Jywge1xuICAgICAgdXJsOicvc29ja3MvOmlkJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdzb2NrSWRDb250cm9sbGVyJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuaHRtbCcsXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIHRoZVNvY2s6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFNvY2tGYWN0b3J5KSB7XG4gICAgICAgICAgcmV0dXJuIFNvY2tGYWN0b3J5LnNpbmdsZVNvY2soJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICB9LFxuICAgICAgICB0aGVSZXZpZXdzOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBSZXZpZXdGYWN0b3J5KSB7XG4gICAgICAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucHJvZHVjdFJldmlld3MoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmV2aWV3RmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gIHJldHVybiB7XG4gICAgcG9zdFJldmlldzogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9yZXZpZXcvJywgb2JqKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9LFxuICAgIHByb2R1Y3RSZXZpZXdzOiBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcmV2aWV3L3NvY2svJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NlYXJjaFJlc3VsdHMnLCB7XG5cdFx0dXJsOiAnL3NlYXJjaC86c2VhcmNoVGVybXMnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3NlYXJjaHJlc3VsdHMvc2VhcmNoLnZpZXcuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogXCJzZWFyY2hDdHJsXCIsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0YWxsUmVzdWx0czogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgU2VhcmNoRmFjdG9yeSkge1xuXHRcdFx0XHRyZXR1cm4gU2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0KCRzdGF0ZVBhcmFtcy5zZWFyY2hUZXJtcylcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIGFsbFJlc3VsdHMpIHtcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gYWxsUmVzdWx0cztcblx0XHQvLyBcdGNvbnNvbGUubG9nKFwiQWxsIFJlc3VsdHMhIVwiLCBhbGxSZXN1bHRzKTtcblx0XHQvLyBcdCRzY29wZS5udW1iZXIgPSAxMjM7XG5cdFx0Ly8gfVxuXHRcdC8vIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcykge1xuXHRcdC8vIFx0Y29uc29sZS5sb2coXCJIRVJFRUVFRVwiLCAkc3RhdGVQYXJhbXMucmVzdWx0cylcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gJHN0YXRlUGFyYW1zLnJlc3VsdHNcblx0XHQvLyB9XG5cdH0pXG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ1NpZ251cEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBTaWdudXBGYWN0b3J5LCAkc3RhdGUpIHtcblxuICBmdW5jdGlvbiBwYXNzd29yZFZhbGlkIChwYXNzd29yZCkge1xuICAgIGlmIChwYXNzd29yZC5sZW5ndGggPCA2KSB7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlBhc3N3b3JkIG11c3QgYmUgNiBjaGFyYWN0ZXJzIGxvbmchXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChwYXNzd29yZCAhPT0gJHNjb3BlLnB3Mikge1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJUaGUgcGFzc3dvcmQgZmllbGRzIGRvbid0IG1hdGNoIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoL1xcVy8udGVzdChwYXNzd29yZCkpe1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJQYXNzd29yZCBjYW5ub3QgY29udGFpbiBzcGVjaWFsIGNoYXJhY3RlcnMhXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gICRzY29wZS5zaG93RXJyb3IgPSBmYWxzZTtcblxuICAkc2NvcGUuZGlzcGxheUVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICRzY29wZS5zaG93RXJyb3I7XG4gIH1cblxuICAkc2NvcGUuc3VibWl0U2lnbnVwID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChwYXNzd29yZFZhbGlkKCRzY29wZS5wYXNzd29yZCkpe1xuICAgICAgY29uc29sZS5sb2coXCJub3cgSSBkb24ndCB3b3JrIVwiKTtcbiAgICAgIHJldHVybiBTaWdudXBGYWN0b3J5LnN1Ym1pdCh7XG4gICAgICAgZW1haWw6ICRzY29wZS5lbWFpbCxcbiAgICAgICB1c2VybmFtZTogJHNjb3BlLnVzZXJuYW1lLFxuICAgICAgIHBhc3N3b3JkOiAkc2NvcGUucGFzc3dvcmQsXG4gICAgICAgZmlyc3RfbmFtZTogJHNjb3BlLmZpcnN0bmFtZSxcbiAgICAgICBsYXN0X25hbWU6ICRzY29wZS5sYXN0bmFtZSxcbiAgICAgICBpc0FkbWluOiBmYWxzZSxcbiAgICAgICBuZXdVc2VyOiB0cnVlXG4gICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgY29uc29sZS5sb2cocmVzKTtcbiAgICAgICAgcmV0dXJuICRzdGF0ZS5nbygncGVyc29uYWwnKTtcbiAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxufSk7IiwiLy8gYXBwLmZhY3RvcnkoJ1NpZ251cEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuLy8gICB2YXIgU2lnbnVwRmFjdG9yeSA9IHt9O1xuXG4vLyAgIFNpZ251cEZhY3Rvcnkuc3VibWl0ID0gZnVuY3Rpb24odXNlckluZm8pe1xuLy8gICBcdGNvbnNvbGUubG9nKHVzZXJJbmZvKTtcbi8vICAgXHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2VyLycsIHVzZXJJbmZvKVxuLy8gICBcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbi8vICAgXHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuLy8gICBcdH0pXG4vLyAgIH1cblxuLy8gICByZXR1cm4gU2lnbnVwRmFjdG9yeTtcblxuLy8gfSlcblxuYXBwLmZhY3RvcnkoJ1NpZ251cEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0dmFyIFNpZ251cEZhY3RvcnkgPSB7fTtcblxuXHRTaWdudXBGYWN0b3J5LnN1Ym1pdCA9IGZ1bmN0aW9uICh1c2VySW5mbykge1xuXHRcdGNvbnNvbGUubG9nKFwiRnJvbSBTaWdudXAgRmFjdG9yeVwiLCB1c2VySW5mbyk7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci8nLCB1c2VySW5mbylcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuXHR9XG5cdHJldHVybiBTaWdudXBGYWN0b3J5O1xufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0Y29udHJvbGxlcjogJ1NpZ251cEN0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3NpZ251cC9zaWdudXAudmlldy5odG1sJ1xuXHR9KTtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncGVyc29uYWwnLCB7XG5cdFx0dXJsOiAnL3BlcnNvbmFsJyxcblx0XHRjb250cm9sbGVyOiAnU2lnbnVwQ3RybCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvc2lnbnVwL3BlcnNvbmFsaW5mby52aWV3Lmh0bWwnXG5cdH0pO1xufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ1VzZXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCB0aGVVc2VyLCB0aGVVc2VyU29ja3MpIHtcbiAgICBjb25zb2xlLmxvZyhcImNvbnRyb2xsZXJcIiwgdGhlVXNlclNvY2tzKTtcblx0JHNjb3BlLnVzZXIgPSB0aGVVc2VyO1xuXHQkc2NvcGUuc29ja3MgPSB0aGVVc2VyU29ja3M7XG5cdCRzY29wZS50b1NvY2tWaWV3ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0JHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KVxuXHR9XG59KVxuIiwiYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBVc2VyRmFjdG9yeSA9IHt9O1xuXG5cdFVzZXJGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlci8nICsgaWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImZhY3RvcnlcIiwgcmVzcG9uc2UuZGF0YSlcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhXG5cdFx0fSlcblx0fVxuXG5cdFVzZXJGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlcnMnKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGFcblx0XHR9KVxuXHR9XG5cblx0cmV0dXJuIFVzZXJGYWN0b3J5O1xufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1c2VyJywge1xuXHRcdHVybDogJy91c2VyLzp1c2VySWQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3VzZXIvdXNlci1wcm9maWxlLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdVc2VyQ3RybCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0dGhlVXNlcjogZnVuY3Rpb24gKFVzZXJGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMudXNlcklkKTtcblx0XHRcdH0sXG5cdFx0XHR0aGVVc2VyU29ja3M6IGZ1bmN0aW9uIChTb2NrRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHJldHVybiBTb2NrRmFjdG9yeS5zb2NrQnlVc2VySWQoJHN0YXRlUGFyYW1zLnVzZXJJZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxufSlcbiIsImFwcC5jb250cm9sbGVyKCduYXZiYXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBTZWFyY2hGYWN0b3J5KSB7XG5cblx0JHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uKHNlYXJjaFRlcm1zKXtcblx0XHQvLyBTZWFyY2hGYWN0b3J5LmZpbmRCeVNlYXJjaFRleHQoc2VhcmNoVGVybXMpXG5cdFx0Ly8gLnRoZW4oZnVuY3Rpb24ocmVzdWx0cyl7XG5cdFx0Ly8gXHQkc2NvcGUucmVzdWx0cyA9IHJlc3VsdHM7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhyZXN1bHRzKTtcblx0XHRcdHJldHVybiAkc3RhdGUuZ28oJ3NlYXJjaFJlc3VsdHMnLCB7c2VhcmNoVGVybXM6IHNlYXJjaFRlcm1zfSk7XG5cdFx0Ly8gfSlcblx0fVxufSlcblxuYXBwLmNvbnRyb2xsZXIoJ3NlYXJjaEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIGFsbFJlc3VsdHMsICRzdGF0ZVBhcmFtcykge1xuXHQkc2NvcGUucmVzdWx0cyA9IGFsbFJlc3VsdHM7XG5cdCRzY29wZS5zZWVTb2NrID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0JHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KVxuXHR9XG59KSIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5mYWN0b3J5KFwiU2VhcmNoRmFjdG9yeVwiLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0dmFyIFNlYXJjaEZhY3RvcnkgPSB7fTtcblxuXHRTZWFyY2hGYWN0b3J5LmZpbmRCeVNlYXJjaFRleHQgPSBmdW5jdGlvbiAodGV4dCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc2VhcmNoLz9xPScgKyB0ZXh0KVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdHMpIHtcblx0XHRcdHJldHVybiByZXN1bHRzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiBTZWFyY2hGYWN0b3J5O1xufSkiLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdBYm91dCcsIHN0YXRlOiAnYWJvdXQnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0Rlc2lnbicsIHN0YXRlOiAnZGVzaWduVmlldycgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTXkgUHJvZmlsZScsIHN0YXRlOiAndXNlcih7dXNlcklkOnVzZXIuaWR9KScsIGF1dGg6IHRydWUgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTWVtYmVycyBPbmx5Jywgc3RhdGU6ICdtZW1iZXJzT25seScsIGF1dGg6IHRydWUgfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ29hdXRoQnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICBwcm92aWRlck5hbWU6ICdAJ1xuICAgIH0sXG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uaHRtbCdcbiAgfVxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
