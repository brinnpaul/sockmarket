'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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
app.controller('cartCurrent', function ($scope, OrderFactory, currentCart) {});

app.controller('cartHistory', function ($scope, OrderFactory, cartHistory) {

    // $scope.cartHistory = cartHistory

});

app.directive('currentCart', function ($state, OrderFactory) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/order/current.html',
        link: function link(scope) {

            scope.update = function (item) {
                var sock = {
                    quantity: item.newAmount,
                    id: item.id
                };
                return OrderFactory.updateItem(sock).then(function (update) {
                    item.quantity = item.newAmount;
                    item.newAmount = null;
                });
            };

            scope.delete = function (item) {
                var todelete = { item: item };
                OrderFactory.deleteItem(todelete.item.id);
            };

            scope.singleSockView = function (id) {
                $state.go('singleSockView', { id: id });
            };

            return OrderFactory.showCart('current').then(function (current) {
                scope.currentCart = current;
            });
        }
    };
});

app.directive('cartHistory', function ($state, OrderFactory) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/order/history.html',
        link: function link(scope) {
            return OrderFactory.showCart('history').then(function (history) {
                console.log(history);
                scope.cartHistory = history;
            });
        }
    };
});

app.factory('OrderFactory', function ($http) {
    var cachedCart = [];
    var checkCart = function checkCart(obj, arr) {
        return arr.map(function (item) {
            return item.sockId;
        }).indexOf(obj.sockId) === -1 ? false : true;
    };
    return {
        addToCart: function addToCart(obj) {
            return $http.get('/api/order/current').then(function (res) {
                return checkCart(obj, res.data);
            }).then(function (inCart) {
                if (inCart) {
                    return "Already in Cart!";
                } else {
                    return $http.post('/api/order/', obj).then(function (res) {
                        return res.data;
                    });
                }
            });
        },
        showCart: function showCart(type) {
            //type = 'current' || type = 'history'
            return $http.get('/api/order/' + type).then(function (order) {
                cachedCart = order.data;
                return cachedCart || [];
            });
        },
        updateItem: function updateItem(obj) {
            return $http.put('/api/order', obj).then(function (item) {
                return item.data;
            });
        },
        deleteItem: function deleteItem(itemId) {
            return $http.delete('/api/order/' + itemId).then(function (toRemove) {
                cachedCart.splice(cachedCart.map(function (item) {
                    return item.id;
                }).indexOf(itemId), 1);
                return cachedCart;
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
        templateUrl: '/js/order/cart.html',
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

app.controller('sockIdController', function ($scope, $state, $stateParams, theSock, theReviews, ReviewFactory, OrderFactory) {

    $scope.sock = theSock;
    $scope.reviews = theReviews;

    $scope.alert = function (message) {
        $scope.message = message;
        $scope.alerting = !$scope.alerting;
        setTimeout(function () {
            $scope.alerting = !$scope.alerting;
            $scope.$digest();
        }, 3000);
        // if (!$scope.alerting) $scope.message === null
    };

    $scope.addItem = function () {
        var item = {};
        item.sockId = $scope.sock.id;
        item.quantity = +$scope.quantity;
        if (item.quantity > 0) {
            OrderFactory.addToCart(item).then(function (response) {
                if ((typeof response === 'undefined' ? 'undefined' : _typeof(response)) !== "object") $scope.alert(response);else $state.go('currentCart');
            });
        } else $scope.alert('You have to add at least one sock!');
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
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'About', state: 'about' }, { label: 'Design', state: 'designView' }, { label: 'My Profile', state: 'user({userId:user.id})', auth: true }, { label: 'My Cart', state: 'currentCart' }];

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

app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiZGVzaWduL2Rlc2lnbi1kaXJlY3RpdmUuanMiLCJkZXNpZ24vZGVzaWduLmNvbnRyb2xsZXIuanMiLCJkZXNpZ24vZGVzaWduLmRpcmVjdGl2ZS5qcyIsImRlc2lnbi9kZXNpZ24uanMiLCJkZXNpZ24vZGVzaWduLnN0YXRlLmpzIiwiZG9jcy9kb2NzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJtZW1iZXJzLW9ubHkvbWVtYmVycy1vbmx5LmpzIiwibG9naW4vbG9naW4uanMiLCJvcmRlci9vcmRlci5jb250cm9sbGVyLmpzIiwib3JkZXIvb3JkZXIuZGlyZWN0aXZlLmpzIiwib3JkZXIvb3JkZXIuZmFjdG9yeS5qcyIsIm9yZGVyL29yZGVyLnN0YXRlLmpzIiwicHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuZmFjdG9yeS5qcyIsInByb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3LmpzIiwic2VhcmNocmVzdWx0cy9zZWFyY2guc3RhdGUuanMiLCJyZXZpZXcvcmV2aWV3LmZhY3RvcnkuanMiLCJzaWdudXAvc2lnbnVwLmNvbnRyb2xsZXIuanMiLCJzaWdudXAvc2lnbnVwLmZhY3RvcnkuanMiLCJzaWdudXAvc2lnbnVwLnN0YXRlLmpzIiwidXNlci91c2VyLWNvbnRyb2xsZXIuanMiLCJ1c2VyL3VzZXItZmFjdG9yeS5qcyIsInVzZXIvdXNlci1zdGF0ZXMuanMiLCJjb21tb24vY29udHJvbGxlcnMvbmF2YmFyLmNvbnRyb2xsZXIuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvc2VhcmNoLmZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uZGlyZWN0aXZlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsWUFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEsc0JBQUEsU0FBQSxDQUFBLElBQUE7O0FBRUEsdUJBQUEsU0FBQSxDQUFBLEdBQUE7O0FBRUEsdUJBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBLGVBQUEsUUFBQSxDQUFBLE1BQUE7QUFDQSxLQUZBO0FBR0EsQ0FUQTs7O0FBWUEsSUFBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsUUFBQSwrQkFBQSxTQUFBLDRCQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsZUFBQSxNQUFBLElBQUEsSUFBQSxNQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsS0FGQTs7OztBQU1BLGVBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFFQSxZQUFBLENBQUEsNkJBQUEsT0FBQSxDQUFBLEVBQUE7OztBQUdBO0FBQ0E7O0FBRUEsWUFBQSxZQUFBLGVBQUEsRUFBQSxFQUFBOzs7QUFHQTtBQUNBOzs7QUFHQSxjQUFBLGNBQUE7O0FBRUEsb0JBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7OztBQUlBLGdCQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxRQUFBLElBQUEsRUFBQSxRQUFBO0FBQ0EsYUFGQSxNQUVBO0FBQ0EsdUJB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UUFBQSxDQUFBO0FBQ0E7QUFKQSxTQUFBO0FBTUEsS0FiQTs7QUFlQSxRQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLHNCQUFBLFlBQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxXQURBLEVBRUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxtQkFBQSxVQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsU0FKQSxDQUFBO0FBTUEsS0FQQTs7QUFTQSxRQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGlCQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsZ0JBQUEsT0FBQSxTQUFBLElBQUE7QUFDQSxvQkFBQSxNQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBQSxJQUFBO0FBQ0EsdUJBQUEsVUFBQSxDQUFBLFlBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsSUFBQTtBQUNBOzs7O0FBSUEsYUFBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxRQUFBLElBQUE7QUFDQSxTQUZBOztBQUlBLGFBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsZ0JBQUEsS0FBQSxlQUFBLE1BQUEsZUFBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLElBQUEsQ0FBQSxRQUFBLElBQUEsQ0FBQTtBQUNBOzs7OztBQUtBLG1CQUFBLE1BQUEsR0FBQSxDQUFBLFVBQUEsRUFBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLElBQUE7QUFDQSxhQUZBLENBQUE7QUFJQSxTQXJCQTs7QUF1QkEsYUFBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxtQkFBQSxNQUFBLElBQUEsQ0FBQSxRQUFBLEVBQUEsV0FBQSxFQUNBLElBREEsQ0FDQSxpQkFEQSxFQUVBLEtBRkEsQ0FFQSxZQUFBO0FBQ0EsdUJBQUEsR0FBQSxNQUFB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LFNBQUEsSUFBQTtBQUNBLG1CQUFBLFNBQUEsSUFBQTtBQUNBLFNBSkEsQ0FBQTtBQUtBLEtBTkE7O0FBUUEsZ0JBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLE1BQUEsR0FBQSxDQUFBLFlBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxTQUFBLElBQUE7QUFDQSxTQUhBLENBQUE7QUFJQSxLQUxBOztBQU9BLFdBQUEsV0FBQTtBQUNBLENBbkJBOztBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsZUFEQTtBQUVBLHFCQUFBLDRCQUZBO0FBR0Esb0JBQUEsVUFIQTtBQUlBLGlCQUFBO0FBQ0EscUJBQUEsaUJBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLHVCQUFBLFlBQUEsU0FBQSxDQUFBLGFBQUEsTUFBQSxDQUFBO0FBQ0EsYUFIQTtBQUlBLDBCQUFBLHNCQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSx1QkFBQSxZQUFBLFlBQUEsQ0FBQSxhQUFBLE1BQUEsQ0FBQTtBQUNBO0FBTkE7QUFKQSxLQUFBO0FBYUEsQ0FkQTs7QUNBQSxJQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQTs7QUFFQSxXQUFBLE1BQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTs7Ozs7QUFLQSxlQUFBLE9BQUEsRUFBQSxDQUFBLGVBQUEsRUFBQSxFQUFBLGFBQUEsV0FBQSxFQUFBLENBQUE7O0FBRUEsS0FQQTtBQVFBLENBVkE7O0FBWUEsSUFBQSxVQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsV0FBQSxPQUFBLEdBQUEsVUFBQTtBQUNBLFdBQUEsT0FBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsZUFBQSxFQUFBLENBQUEsZ0JBQUEsRUFBQSxFQUFBLElB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QSxHQUFBO0FBQ0Esc0JBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxhQUZBOztBQUlBOztBQUVBLHVCQUFBLEdBQUEsQ0FBQSxZQUFBLFlBQUEsRUFBQSxPQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLFlBQUEsYUFBQSxFQUFBLFVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsWUFBQSxjQUFBLEVBQUEsVUFBQTtBQUVBOztBQTFDQSxLQUFBO0FBOENBLENBaERBOztBQ0FBLElBQUEsU0FBQSxDQUFBLGVBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGtCQUFBLEdBREE7QUFFQSxxQkFBQTtBQUZBLEtBQUE7QUFJQSxDQUxBO0FDQUEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQSxrQkFBQSxHQURBO0FBRUEscUJBQUEseURBRkE7QUFHQSxjQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsUUFBQSxHQUFBLGdCQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBO0FDQUE7O0FBRUEsSUFBQSxTQUFBLENBQUEsYUFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0EsZUFBQTtBQUNBLDBCQUFBO0FBREEsU0FEQTtBQUlBLGtCQUFBLEdBSkE7QUFLQSxxQkFBQTtBQUxBLEtBQUE7QUFPQSxDQVJBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ3NvY2ttYXJrZXQnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Fib3V0Jywge1xuICAgICAgICB1cmw6ICcvYWJvdXQnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWJvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hYm91dC9hYm91dC5odG1sJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Fib3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEZ1bGxzdGFja1BpY3MpIHtcblxuICAgIC8vIEltYWdlcyBvZiBiZWF1dGlmdWwgRnVsbHN0YWNrIHBlb3BsZS5cbiAgICAkc2NvcGUuaW1hZ2VzID0gXy5zaHVmZmxlKEZ1bGxzdGFja1BpY3MpO1xuXG59KTtcblxuIiwiYXBwLmRpcmVjdGl2ZSgnZGVzaWduVmlldycsIGZ1bmN0aW9uIChTb2NrRmFjdG9yeSwgJHN0YXRlKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2Rlc2lnbi9kZXNpZ24tdmlldy5odG1sJyxcblx0XHQvLyBzY29wZToge1xuXHRcdC8vIFx0dGhlU29jazogJz0nXG5cdFx0Ly8gfSxcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0XHR2YXIgdGl0bGUgPSBzY29wZS50aXRsZTtcblx0XHRcdHZhciBkZXNjcmlwdGlvbiA9IHNjb3BlLmRlc2NyaXB0aW9uO1xuXHRcdFx0dmFyIHRhZ3MgPSBzY29wZS50YWdzO1xuXHRcdFx0dmFyIGNhbnZhcyA9IGVsZW1lbnQuZmluZCgnY2FudmFzJylbMF07XG5cdFx0XHRzY29wZS5zYXZlRGVzaWduID0gZnVuY3Rpb24gKHRpdGxlLCBkZXNjcmlwdGlvbiwgdGFncykge1xuXHRcdFx0XHR2YXIgdGFnc0FyciA9IFNvY2tGYWN0b3J5LnByZXBhcmVUYWdzKHRhZ3MpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdUQUdTOicsIHRhZ3NBcnIpO1xuXHRcdFx0XHR2YXIgZGF0YVVSTCA9IGNhbnZhcy50b0RhdGFVUkwoKVxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhkZXNjcmlwdGlvbilcblx0XHRcdFx0dmFyIG5ld1NvY2tEYXRhT2JqID0ge1xuXHRcdFx0XHRcdHRpdGxlOiB0aXRsZSxcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24sXG5cdFx0XHRcdFx0dGFnczogdGFnc0Fycixcblx0XHRcdFx0XHRpbWFnZTogZGF0YVVSTFxuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZXR1cm4gU29ja0ZhY3Rvcnkuc2F2ZURlc2lnbihuZXdTb2NrRGF0YU9iailcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuXHRcdFx0XHRcdCRzdGF0ZS5nbygndXNlcicsIHt1c2VySWQ6IHJlc3VsdC5kYXRhLnVzZXJJZH0pXG5cdFx0XHRcdH0pXG5cdFx0XHR9O1xuXG5cblx0XHRcdHZhciBjb2xvciA9ICQoXCIuc2VsZWN0ZWRcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdHZhciBjb250ZXh0ID0gJChcImNhbnZhc1wiKVswXS5nZXRDb250ZXh0KFwiMmRcIik7XG5cdFx0XHR2YXIgJGNhbnZhcyA9ICQoXCJjYW52YXNcIik7XG5cdFx0XHR2YXIgbGFzdEV2ZW50O1xuXHRcdFx0dmFyIG1vdXNlRG93biA9IGZhbHNlO1xuXG5cdFx0XHR2YXIgYmFja2dyb3VuZCA9IG5ldyBJbWFnZSgpO1xuXG5cdFx0XHQvLyBjb250ZXh0LmZpbGxTdHlsZSA9ICcjZjhmOGZmJztcblx0XHRcdC8vIGNvbnRleHQub3BhY2l0eSA9IDA7XG5cdFx0XHQvLyBjb250ZXh0LmZpbGwoKVxuXG5cdFx0XHQvLyBmdW5jdGlvbiBnZW5lcmF0ZVNvY2tVUkwoKXtcblx0XHRcdC8vICAgZnVuY3Rpb24gZ2VuZXJhdGVSYW5kb21OdW1iZXIoKSB7XG5cdFx0XHQvLyAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMpICsgMTtcblx0XHRcdC8vICAgfVxuXHRcdFx0Ly8gICB2YXIgbnVtID0gZ2VuZXJhdGVSYW5kb21OdW1iZXIoKTtcblxuXHRcdFx0Ly8gICBpZiAobnVtID09PSAxKSByZXR1cm4gJy9zb2NrLWJnLycgKyBudW0gKyAnLnBuZydcblx0XHRcdC8vICAgZWxzZSByZXR1cm4gJy9zb2NrLWJnLycgKyBudW0gKyAnLmpwZyc7XG5cdFx0XHQvLyB9XG5cblx0XHRcdGJhY2tncm91bmQuc3JjID0gJy9zb2NrLWJnLzEucG5nJztcblxuXHRcdFx0YmFja2dyb3VuZC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdCAgY29udGV4dC5kcmF3SW1hZ2UoYmFja2dyb3VuZCwgMCwgMCk7XG5cdFx0XHR9O1xuXG5cdFx0XHQvL1doZW4gY2xpY2tpbmcgb24gY29udHJvbCBsaXN0IGl0ZW1zXG5cdFx0XHQgICQoXCIuY29udHJvbHNcIikub24oXCJjbGlja1wiLCBcImxpXCIgLCBmdW5jdGlvbigpe1xuXHRcdFx0ICAgICAvL0Rlc2xlY3Qgc2libGluZyBlbGVtZW50c1xuXHRcdFx0ICAgICAkKHRoaXMpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcblx0XHRcdCAgICAgLy9TZWxlY3QgY2xpY2tlZCBlbGVtZW50XG5cdFx0XHQgICAgICQodGhpcykuYWRkQ2xhc3MoXCJzZWxlY3RlZFwiKTtcblx0XHRcdCAgICAgLy9zdG9yZSB0aGUgY29sb3Jcblx0XHRcdCAgICAgY29sb3IgPSAkKHRoaXMpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XG5cdFx0XHQgIH0pO1xuXG5cdFx0XHQvL1doZW4gXCJBZGQgQ29sb3JcIiBidXR0b24gaXMgcHJlc3NlZFxuXHRcdFx0ICAkKFwiI3JldmVhbENvbG9yU2VsZWN0XCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdFx0ICAvL1Nob3cgY29sb3Igc2VsZWN0IG9yIGhpZGUgdGhlIGNvbG9yIHNlbGVjdFxuXHRcdFx0ICAgIGNoYW5nZUNvbG9yKCk7XG5cdFx0XHQgIFx0JChcIiNjb2xvclNlbGVjdFwiKS50b2dnbGUoKTtcblx0XHRcdCAgfSk7XG5cblx0XHRcdC8vVXBkYXRlIHRoZSBuZXcgY29sb3Igc3BhblxuXHRcdFx0ZnVuY3Rpb24gY2hhbmdlQ29sb3IoKXtcblx0XHRcdFx0dmFyIHIgPSAkKFwiI3JlZFwiKS52YWwoKTtcblx0XHRcdFx0dmFyIGcgPSAkKFwiI2dyZWVuXCIpLnZhbCgpO1xuXHRcdFx0XHR2YXIgYiA9ICQoXCIjYmx1ZVwiKS52YWwoKTtcblx0XHRcdFx0JChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiKFwiICsgciArIFwiLCBcIiArIGcgKyBcIiwgXCIgKyBiICsgXCIpXCIpO1xuXHRcdFx0ICAvL1doZW4gY29sb3Igc2xpZGVycyBjaGFuZ2VcblxuXG5cdFx0XHR9XG5cblx0XHRcdCQoXCJpbnB1dFt0eXBlPXJhbmdlXVwiKS5vbihcImlucHV0XCIsIGNoYW5nZUNvbG9yKTtcblxuXHRcdFx0Ly93aGVuIFwiQWRkIENvbG9yXCIgaXMgcHJlc3NlZFxuXHRcdFx0JChcIiNhZGROZXdDb2xvclwiKS5jbGljayhmdW5jdGlvbigpe1xuXHRcdFx0ICAvL2FwcGVuZCB0aGUgY29sb3IgdG8gdGhlIGNvbnRyb2xzIHVsXG5cdFx0XHQgIHZhciAkbmV3Q29sb3IgPSAkKFwiPGxpPjwvbGk+XCIpO1xuXHRcdFx0ICAkbmV3Q29sb3IuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCAkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIikpO1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzIHVsXCIpLmFwcGVuZCgkbmV3Q29sb3IpO1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzIGxpXCIpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcblx0XHRcdCAgJChcIi5jb250cm9scyBsaVwiKS5sYXN0KCkuYWRkQ2xhc3MoXCJzZWxlY3RlZFwiKTtcblx0XHRcdCAgY29sb3IgPSAkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XG5cdFx0XHQgIC8vd2hlbiBhZGRlZCwgcmVzdG9yZSBzbGlkZXJzIGFuZCBwcmV2aWV3IGNvbG9yIHRvIGRlZmF1bHRcblx0XHRcdCAgJChcIiNjb2xvclNlbGVjdFwiKS5oaWRlKCk7XG5cdFx0XHRcdHZhciByID0gJChcIiNyZWRcIikudmFsKDApO1xuXHRcdFx0XHR2YXIgZyA9ICQoXCIjZ3JlZW5cIikudmFsKDApO1xuXHRcdFx0XHR2YXIgYiA9ICQoXCIjYmx1ZVwiKS52YWwoMCk7XG5cdFx0XHRcdCQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYihcIiArIHIgKyBcIiwgXCIgKyBnICsgXCIsIFwiICsgYiArIFwiKVwiKTtcblxuXHRcdFx0fSlcblxuXHRcdFx0Ly9PbiBtb3VzZSBldmVudHMgb24gdGhlIGNhbnZhc1xuXHRcdFx0JGNhbnZhcy5tb3VzZWRvd24oZnVuY3Rpb24oZSl7XG5cdFx0XHQgIGxhc3RFdmVudCA9IGU7XG5cdFx0XHQgIG1vdXNlRG93biA9IHRydWU7XG5cdFx0XHR9KS5tb3VzZW1vdmUoZnVuY3Rpb24oZSl7XG5cdFx0XHQgIC8vZHJhdyBsaW5lc1xuXHRcdFx0ICBpZiAobW91c2VEb3duKXtcblx0XHRcdCAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuXHRcdFx0ICAgIGNvbnRleHQubW92ZVRvKGxhc3RFdmVudC5vZmZzZXRYLGxhc3RFdmVudC5vZmZzZXRZKTtcblx0XHRcdCAgICBjb250ZXh0LmxpbmVUbyhlLm9mZnNldFgsIGUub2Zmc2V0WSk7XG5cdFx0XHQgICAgY29udGV4dC5zdHJva2VTdHlsZSA9IGNvbG9yO1xuXHRcdFx0ICAgIGNvbnRleHQuc3Ryb2tlKCk7XG5cdFx0XHQgICAgY29udGV4dC5saW5lQ2FwID0gJ3JvdW5kJztcblx0XHRcdCAgICBjb250ZXh0LmxpbmVXaWR0aCA9IDIwO1xuXG5cdFx0XHQgICAgbGFzdEV2ZW50ID0gZTtcblx0XHRcdCAgfVxuXHRcdFx0fSkubW91c2V1cChmdW5jdGlvbigpe1xuXHRcdFx0ICAgIG1vdXNlRG93biA9IGZhbHNlO1xuXHRcdFx0fSkubW91c2VsZWF2ZShmdW5jdGlvbigpe1xuXHRcdFx0ICAgICRjYW52YXMubW91c2V1cCgpO1xuXHRcdFx0fSk7XG5cblxuXG5cblx0XHRcdC8vIHZhciBza2V0Y2ggPSBlbGVtZW50LmZpbmQoJyNza2V0Y2gnKTtcblx0XHRcdC8vIGNvbnNvbGUubG9nKHNrZXRjaCk7XG5cdFx0XHQvLyB2YXIgc2tldGNoU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHNrZXRjaClcblx0XHQgICAgLy8gY2FudmFzLndpZHRoID0gcGFyc2VJbnQoc2tldGNoU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnd2lkdGgnKSk7XG5cdFx0ICAgIC8vIGNhbnZhcy5oZWlnaHQgPSBwYXJzZUludChza2V0Y2hTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdoZWlnaHQnKSk7XG5cblxuXG5cdCAgICBcdC8vIHZhciBjb2xvciA9ICdibGFjayc7XG5cdFx0ICAgIC8vIHNjb3BlLmNoYW5nZUNvbG9yID0gZnVuY3Rpb24gKGNob3NlbkNvbG9yKSB7XG5cdFx0ICAgIC8vIFx0Y29sb3IgPSBjaG9zZW5Db2xvcjtcblx0XHQgICAgLy8gXHRjb25zb2xlLmxvZygnQ09MT1InLCBjb2xvcilcblx0XHQgICAgLy8gfVx0XHQgICAgXG5cblx0XHQgICAgLy8gdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdFx0ICAgIC8vIGN0eC5saW5lV2lkdGggPSAyMDtcblx0XHQgICAgLy8gY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcblx0XHQgICAgLy8gY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuXG5cdFx0ICAgIC8vIHZhciBjdXJyZW50TW91c2VQb3NpdGlvbiA9IHtcblx0XHQgICAgLy8gICAgIHg6IDAsXG5cdFx0ICAgIC8vICAgICB5OiAwXG5cdFx0ICAgIC8vIH07XG5cblx0XHQgICAgLy8gdmFyIGxhc3RNb3VzZVBvc2l0aW9uID0ge1xuXHRcdCAgICAvLyAgICAgeDogMCxcblx0XHQgICAgLy8gICAgIHk6IDBcblx0XHQgICAgLy8gfTtcblxuXHRcdCAgICAvLyB2YXIgZHJhd2luZyA9IGZhbHNlO1xuXG5cdFx0ICAgIC8vIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuXHRcdCAgICAvLyAgICAgZHJhd2luZyA9IHRydWU7XG5cdFx0ICAgIC8vICAgICBjdXJyZW50TW91c2VQb3NpdGlvbi54ID0gZS5vZmZzZXRYO1xuXHRcdCAgICAvLyAgICAgY3VycmVudE1vdXNlUG9zaXRpb24ueSA9IGUub2Zmc2V0WTtcblx0XHQgICAgLy8gfSk7XG5cblx0XHQgICAgLy8gY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbiAoKSB7XG5cdFx0ICAgIC8vICAgICBkcmF3aW5nID0gZmFsc2U7XG5cdFx0ICAgIC8vIH0pO1xuXG5cdFx0ICAgIC8vIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBmdW5jdGlvbiAoZSkge1xuXHRcdCAgICAvLyAgICAgaWYgKCFkcmF3aW5nKSByZXR1cm47XG5cblx0XHQgICAgLy8gICAgIGxhc3RNb3VzZVBvc2l0aW9uLnggPSBjdXJyZW50TW91c2VQb3NpdGlvbi54O1xuXHRcdCAgICAvLyAgICAgbGFzdE1vdXNlUG9zaXRpb24ueSA9IGN1cnJlbnRNb3VzZVBvc2l0aW9uLnk7XG5cblx0XHQgICAgLy8gICAgIGN1cnJlbnRNb3VzZVBvc2l0aW9uLnggPSBlLm9mZnNldFg7XG5cdFx0ICAgIC8vICAgICBjdXJyZW50TW91c2VQb3NpdGlvbi55ID0gZS5vZmZzZXRZO1xuXG5cdFx0ICAgIC8vICAgICBjb25zb2xlLmxvZygnUE9TSVRJT04nLCBjdXJyZW50TW91c2VQb3NpdGlvbilcblxuXHRcdCAgICAvLyAgICAgZHJhdyhsYXN0TW91c2VQb3NpdGlvbiwgY3VycmVudE1vdXNlUG9zaXRpb24sIGNvbG9yLCB0cnVlKTtcblxuXHRcdCAgICAvLyB9KTtcblxuXHRcdCAgICAvLyB2YXIgZHJhdyA9IGZ1bmN0aW9uIChzdGFydCwgZW5kLCBzdHJva2VDb2xvcikge1xuXG5cdFx0ICAgIC8vICAgICAvLyBEcmF3IHRoZSBsaW5lIGJldHdlZW4gdGhlIHN0YXJ0IGFuZCBlbmQgcG9zaXRpb25zXG5cdFx0ICAgIC8vICAgICAvLyB0aGF0IGlzIGNvbG9yZWQgd2l0aCB0aGUgZ2l2ZW4gY29sb3IuXG5cdFx0ICAgIC8vICAgICBjdHguYmVnaW5QYXRoKCk7XG5cdFx0ICAgIC8vICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2VDb2xvciB8fCAnYmxhY2snO1xuXHRcdCAgICAvLyAgICAgY3R4Lm1vdmVUbyhzdGFydC54LCBzdGFydC55KTtcblx0XHQgICAgLy8gICAgIGN0eC5saW5lVG8oZW5kLngsIGVuZC55KTtcblx0XHQgICAgLy8gICAgIGN0eC5jbG9zZVBhdGgoKTtcblx0XHQgICAgLy8gICAgIGN0eC5zdHJva2UoKTtcblxuXHRcdCAgICAvLyB9O1xuXG5cdFx0fVxuXHR9XG59KSIsImFwcC5jb250cm9sbGVyKCdEZXNpZ25Db250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXG4gICRzY29wZS5oaSA9IFwiaGlcIjtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnZGVzaWduU29jaycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgY29udHJvbGxlcjogJ0Rlc2lnbkNvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Rlc2lnbi9kZXNpZ24udmlldy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGVzaWduVmlldycsIHtcbiAgICAgIHVybDonL3NvY2tzL2Rlc2lnbi86aWQnLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgdGhlU29jazogJz0nXG4gICAgICB9LFxuICAgICAgY29udHJvbGxlcjogJ2Rlc2lnblZpZXdDdHJsJyxcbiAgICAgIHRlbXBsYXRlOiAnPGRlc2lnbi12aWV3PjwvZGVzaWduLXZpZXc+JyxcbiAgICB9KVxuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ2Rlc2lnblZpZXdDdHJsJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXHQvLyAvLyAkc2NvcGUuZGVzY3JpcHRpb247XG5cdC8vICRzY29wZS50YWdzO1xuXHQvLyAkc2NvcGUudGl0bGU7XG5cdC8vIGNvbnNvbGUubG9nKCRzY29wZS5kZXNjcmlwdGlvbik7XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rlc2lnbicsIHtcbiAgICAgIHVybDonL2Rlc2lnbicsXG4gICAgICBjb250cm9sbGVyOiAnRGVzaWduQ29udHJvbGxlcicsXG4gICAgICB0ZW1wbGF0ZVVybDogJzxkZXNpZ24tc29jaz48L2Rlc2lnbi1zb2NrPidcbiAgICB9KVxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZG9jcycsIHtcbiAgICAgICAgdXJsOiAnL2RvY3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2RvY3MvZG9jcy5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ2hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdG1vc3RSZWNlbnRTb2NrczogZnVuY3Rpb24gKFNvY2tGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU29ja0ZhY3RvcnkubW9zdFJlY2VudFNvY2tzKClcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignaG9tZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBtb3N0UmVjZW50U29ja3MsICRzdGF0ZSwgJHN0YXRlUGFyYW1zKSB7XG5cbiAgJHNjb3BlLm1vc3RSZWNlbnRTb2NrcyA9IG1vc3RSZWNlbnRTb2Nrc1xuICAkc2NvcGUuc2VlU29jayA9IGZ1bmN0aW9uIChpZCkge1xuICAgICRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcbiAgfVxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21lbWJlcnNPbmx5Jywge1xuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29udHJvbGxlcignY2FydEN1cnJlbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGN1cnJlbnRDYXJ0KSB7XG5cbn0pXG5cblxuYXBwLmNvbnRyb2xsZXIoJ2NhcnRIaXN0b3J5JywgZnVuY3Rpb24gKCRzY29wZSwgT3JkZXJGYWN0b3J5LCBjYXJ0SGlzdG9yeSkge1xuXG4gIC8vICRzY29wZS5jYXJ0SGlzdG9yeSA9IGNhcnRIaXN0b3J5XG5cbn0pXG4iLCJhcHAuZGlyZWN0aXZlKCdjdXJyZW50Q2FydCcsIGZ1bmN0aW9uICgkc3RhdGUsIE9yZGVyRmFjdG9yeSkge1xuXG4gIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgc2NvcGU6IHt9LFxuICAgICAgdGVtcGxhdGVVcmw6ICdqcy9vcmRlci9jdXJyZW50Lmh0bWwnLFxuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUpIHtcblxuICAgICAgICBzY29wZS51cGRhdGUgPSBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgdmFyIHNvY2sgPSB7XG4gICAgICAgICAgICBxdWFudGl0eTogaXRlbS5uZXdBbW91bnQsXG4gICAgICAgICAgICBpZDogaXRlbS5pZFxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnVwZGF0ZUl0ZW0oc29jaylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbih1cGRhdGUpe1xuICAgICAgICAgICAgaXRlbS5xdWFudGl0eSA9IGl0ZW0ubmV3QW1vdW50O1xuICAgICAgICAgICAgaXRlbS5uZXdBbW91bnQgPSBudWxsO1xuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5kZWxldGUgPSBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgdmFyIHRvZGVsZXRlID0geyBpdGVtOiBpdGVtIH1cbiAgICAgICAgICBPcmRlckZhY3RvcnkuZGVsZXRlSXRlbSh0b2RlbGV0ZS5pdGVtLmlkKVxuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuc2luZ2xlU29ja1ZpZXcgPSBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuICAgICAgICAudGhlbihmdW5jdGlvbihjdXJyZW50KSB7IHNjb3BlLmN1cnJlbnRDYXJ0ID0gY3VycmVudCB9KVxuICAgIH1cbiAgfVxufSlcblxuYXBwLmRpcmVjdGl2ZSgnY2FydEhpc3RvcnknLCBmdW5jdGlvbigkc3RhdGUsIE9yZGVyRmFjdG9yeSkge1xuXG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICBzY29wZToge30sXG4gICAgdGVtcGxhdGVVcmw6ICdqcy9vcmRlci9oaXN0b3J5Lmh0bWwnLFxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnaGlzdG9yeScpXG4gICAgICAudGhlbihmdW5jdGlvbihoaXN0b3J5KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGhpc3RvcnkpXG4gICAgICAgIHNjb3BlLmNhcnRIaXN0b3J5ID0gaGlzdG9yeSB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiXG5hcHAuZmFjdG9yeSgnT3JkZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApIHtcbiAgdmFyIGNhY2hlZENhcnQgPSBbXVxuICB2YXIgY2hlY2tDYXJ0ID0gZnVuY3Rpb24ob2JqLCBhcnIpIHtcbiAgICByZXR1cm4gYXJyLm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLnNvY2tJZCB9KS5pbmRleE9mKG9iai5zb2NrSWQpID09PSAtMSA/IGZhbHNlIDogdHJ1ZVxuICB9XG4gIHJldHVybiB7XG4gICAgYWRkVG9DYXJ0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvY3VycmVudCcpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHsgcmV0dXJuIGNoZWNrQ2FydChvYmosIHJlcy5kYXRhKSB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oaW5DYXJ0KSB7XG4gICAgICAgIGlmIChpbkNhcnQpIHtcbiAgICAgICAgICByZXR1cm4gXCJBbHJlYWR5IGluIENhcnQhXCJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9vcmRlci8nLCBvYmopXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7IHJldHVybiByZXMuZGF0YSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gICAgc2hvd0NhcnQ6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIC8vdHlwZSA9ICdjdXJyZW50JyB8fCB0eXBlID0gJ2hpc3RvcnknXG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyLycrdHlwZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKSB7XG4gICAgICAgIGNhY2hlZENhcnQgPSBvcmRlci5kYXRhXG4gICAgICAgIHJldHVybiBjYWNoZWRDYXJ0IHx8IFtdXG4gICAgICB9KVxuICAgIH0sXG4gICAgdXBkYXRlSXRlbTogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucHV0KCcvYXBpL29yZGVyJywgb2JqKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5kYXRhIH0pXG4gICAgfSxcbiAgICBkZWxldGVJdGVtOiBmdW5jdGlvbihpdGVtSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5kZWxldGUoJy9hcGkvb3JkZXIvJytpdGVtSWQpXG4gICAgICAudGhlbihmdW5jdGlvbih0b1JlbW92ZSkge1xuICAgICAgICBjYWNoZWRDYXJ0LnNwbGljZShjYWNoZWRDYXJ0Lm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLmlkIH0pLmluZGV4T2YoaXRlbUlkKSwxKVxuICAgICAgICByZXR1cm4gY2FjaGVkQ2FydFxuICAgICAgfSlcbiAgICB9XG4gIH1cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY3VycmVudENhcnQnLCB7XG4gICAgdXJsOiAnL2NhcnQvY3VycmVudCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvb3JkZXIvY2FydC5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnY2FydEN1cnJlbnQnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGN1cnJlbnRDYXJ0OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuXHRcdFx0fVxuXHRcdH1cbiAgfSlcblxuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2FydEhpc3RvcnknLCB7XG4gICAgdXJsOiAnL2NhcnQvaGlzdG9yeScsXG4gICAgdGVtcGxhdGVVcmw6ICcvanMvb3JkZXIvY2FydC5odG1sJyxcbiAgICBjb250cm9sbGVyOiAnY2FydEhpc3RvcnknLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGNhcnRIaXN0b3J5OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG4gICAgICAgIHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2hpc3RvcnknKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbn0pXG4iLCJhcHAuZmFjdG9yeSgnU29ja0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICByZXR1cm4ge1xuICAgIHNpbmdsZVNvY2s6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrLycrc29ja0lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgc29ja0J5VXNlcklkOiBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay9ieVVzZXIvJyArIHVzZXJJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIG1vc3RSZWNlbnRTb2NrczogZnVuY3Rpb24gKCkge1xuICAgIFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL3JlY2VudCcpXG4gICAgXHQudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICBcdFx0cmV0dXJuIHJlcy5kYXRhXG4gICAgXHR9KVxuICAgIH0sXG5cbiAgICBzYXZlRGVzaWduOiBmdW5jdGlvbiAobmV3U29ja0RhdGFPYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svJywgbmV3U29ja0RhdGFPYmopXG4gICAgfSxcblxuICAgIHByZXBhcmVUYWdzOiBmdW5jdGlvbiAodGFnSW5wdXQpIHtcbiAgICAgIHJldHVybiB0YWdJbnB1dC5zcGxpdCgnICcpLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgIGUgPSBlLnJlcGxhY2UoLywvaSwgXCJcIik7XG4gICAgICAgIGUgPSBlLnN1YnN0cmluZygxKTtcbiAgICAgICAgcmV0dXJuIGVcbiAgICAgIH0pO1xuICAgIH1cblxuICB9XG5cbn0pXG4iLCIvLyBhcHAuY29udHJvbGxlcignc29ja1ZpZXdDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgU29ja0ZhY3RvcnksIFJldmlld0ZhY3RvcnkpIHtcblxuLy8gICAkc2NvcGUuc2V0U29jayA9IGZ1bmN0aW9uKHNvY2tJZCkge1xuLy8gICAgIHJldHVybiBTb2NrRmFjdG9yeS5zaW5nbGVTb2NrKHNvY2tJZCkgLy8gcmV0dXJuP1xuLy8gICAgIC50aGVuKGZ1bmN0aW9uKHNvY2spIHtcbi8vICAgICAgICRzY29wZS5zb2NrID0gc29ja1xuLy8gICAgIH0pXG4vLyAgIH1cblxuLy8gICAkc2NvcGUuc2V0UmV2aWV3cyA9IGZ1bmN0aW9uKHNvY2tJZCkge1xuLy8gICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LnByb2R1Y3RSZXZpZXdzKHNvY2tJZClcbi8vICAgICAudGhlbihmdW5jdGlvbihyZXZpZXdzKSB7XG4vLyAgICAgICAkc2NvcGUucmV2aWV3cyA9IHJldmlld3Ncbi8vICAgICB9KVxuLy8gICB9XG5cbi8vICAgJHNjb3BlLnNldFNvY2soMSk7XG4vLyAgICRzY29wZS5zZXRSZXZpZXdzKDEpO1xuXG4vLyAgICRzY29wZS5uZXdSZXZpZXcgPSBmdW5jdGlvbigpIHtcbi8vICAgICB2YXIgbmV3UmV2aWV3ID0ge1xuLy8gICAgICAgdGV4dDogJHNjb3BlLnJldmlld1RleHQsXG4vLyAgICAgICBzb2NrSWQ6ICRzY29wZS5zb2NrLmlkXG4vLyAgICAgfVxuLy8gICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LnBvc3RSZXZpZXcobmV3UmV2aWV3KVxuLy8gICAgIC50aGVuKGZ1bmN0aW9uKG5ld1Jldmlldyl7XG4vLyAgICAgICB2YXIgcmV2aWV3ID0ge307XG4vLyAgICAgICByZXZpZXcudXNlciA9IHt9O1xuXG4vLyAgICAgICAgIHJldmlldy51c2VyLmZpcnN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5maXJzdF9uYW1lO1xuLy8gICAgICAgICByZXZpZXcudXNlci5sYXN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5sYXN0X25hbWU7XG4vLyAgICAgICAgIHJldmlldy51c2VyLnByb2ZpbGVfcGljID0gbmV3UmV2aWV3LnVzZXIucHJvZmlsZV9waWM7XG4vLyAgICAgICAgIHJldmlldy51c2VyLnVzZXJuYW1lID0gbmV3UmV2aWV3LnVzZXIudXNlcm5hbWU7XG4vLyAgICAgICAgIHJldmlldy50ZXh0ID0gbmV3UmV2aWV3LnJldmlldy50ZXh0O1xuXG4vLyAgICAgICAkc2NvcGUucmV2aWV3cy5wdXNoKHJldmlldyk7XG4vLyAgICAgICAkc2NvcGUucmV2aWV3VGV4dCA9IG51bGw7XG4vLyAgICAgfSlcbi8vICAgfVxuXG4vLyAgICRzY29wZS5hbHJlYWR5UG9zdGVkID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgLy8gYWRkIGluIGFmdGVyIGZpbmlzaGluZyBvdGhlciBzdHVmZlxuLy8gICB9XG5cbi8vIH0pO1xuXG5hcHAuY29udHJvbGxlcignc29ja0lkQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCB0aGVTb2NrLCB0aGVSZXZpZXdzLCBSZXZpZXdGYWN0b3J5LCBPcmRlckZhY3RvcnkpIHtcblxuICAkc2NvcGUuc29jayA9IHRoZVNvY2s7XG4gICRzY29wZS5yZXZpZXdzID0gdGhlUmV2aWV3cztcblxuICAkc2NvcGUuYWxlcnQgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSBtZXNzYWdlXG4gICAgJHNjb3BlLmFsZXJ0aW5nID0gISRzY29wZS5hbGVydGluZ1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nXG4gICAgICAkc2NvcGUuJGRpZ2VzdCgpXG4gICAgfSwgMzAwMClcbiAgICAvLyBpZiAoISRzY29wZS5hbGVydGluZykgJHNjb3BlLm1lc3NhZ2UgPT09IG51bGxcbiAgfVxuXG4gICRzY29wZS5hZGRJdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW0gPSB7fVxuICAgIGl0ZW0uc29ja0lkID0gJHNjb3BlLnNvY2suaWRcbiAgICBpdGVtLnF1YW50aXR5ID0gKyRzY29wZS5xdWFudGl0eVxuICAgIGlmIChpdGVtLnF1YW50aXR5ID4gMCkge1xuICAgICAgT3JkZXJGYWN0b3J5LmFkZFRvQ2FydChpdGVtKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXNwb25zZSAhPT0gXCJvYmplY3RcIikgJHNjb3BlLmFsZXJ0KHJlc3BvbnNlKVxuICAgICAgICBlbHNlICRzdGF0ZS5nbygnY3VycmVudENhcnQnKVxuICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSAkc2NvcGUuYWxlcnQoJ1lvdSBoYXZlIHRvIGFkZCBhdCBsZWFzdCBvbmUgc29jayEnKVxuICB9XG5cbiAgJHNjb3BlLm5ld1JldmlldyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdSZXZpZXcgPSB7XG4gICAgICB0ZXh0OiAkc2NvcGUucmV2aWV3VGV4dCxcbiAgICAgIHNvY2tJZDogJHNjb3BlLnNvY2suaWRcbiAgICB9XG4gICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucG9zdFJldmlldyhuZXdSZXZpZXcpXG4gICAgLnRoZW4oZnVuY3Rpb24obmV3UmV2aWV3KXtcbiAgICAgIHZhciByZXZpZXcgPSB7fTtcbiAgICAgIHJldmlldy51c2VyID0ge307XG5cbiAgICAgICAgcmV2aWV3LnVzZXIuZmlyc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmZpcnN0X25hbWU7XG4gICAgICAgIHJldmlldy51c2VyLmxhc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmxhc3RfbmFtZTtcbiAgICAgICAgcmV2aWV3LnVzZXIucHJvZmlsZV9waWMgPSBuZXdSZXZpZXcudXNlci5wcm9maWxlX3BpYztcbiAgICAgICAgcmV2aWV3LnVzZXIudXNlcm5hbWUgPSBuZXdSZXZpZXcudXNlci51c2VybmFtZTtcbiAgICAgICAgcmV2aWV3LnRleHQgPSBuZXdSZXZpZXcucmV2aWV3LnRleHQ7XG5cbiAgICAgICRzY29wZS5yZXZpZXdzLnB1c2gocmV2aWV3KTtcbiAgICAgICRzY29wZS5yZXZpZXdUZXh0ID0gbnVsbDtcbiAgICB9KVxuICB9XG5cbiAgJHNjb3BlLmFscmVhZHlQb3N0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBhZGQgaW4gYWZ0ZXIgZmluaXNoaW5nIG90aGVyIHN0dWZmXG4gIH1cblxufSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAvLyAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc29ja3MnLCB7XG4gICAgLy8gICAgIHVybDogJy9zb2NrcycsXG4gICAgLy8gICAgIGNvbnRyb2xsZXI6ICdzb2NrVmlld0NvbnRyb2xsZXInLFxuICAgIC8vICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3Lmh0bWwnXG4gICAgLy8gfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2luZ2xlU29ja1ZpZXcnLCB7XG4gICAgICB1cmw6Jy9zb2Nrcy86aWQnLFxuICAgICAgY29udHJvbGxlcjogJ3NvY2tJZENvbnRyb2xsZXInLFxuICAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0dmlldy9wcm9kdWN0dmlldy5odG1sJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgdGhlU29jazogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgU29ja0ZhY3RvcnkpIHtcbiAgICAgICAgICByZXR1cm4gU29ja0ZhY3Rvcnkuc2luZ2xlU29jaygkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgIH0sXG4gICAgICAgIHRoZVJldmlld3M6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFJldmlld0ZhY3RvcnkpIHtcbiAgICAgICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wcm9kdWN0UmV2aWV3cygkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZWFyY2hSZXN1bHRzJywge1xuXHRcdHVybDogJy9zZWFyY2gvOnNlYXJjaFRlcm1zJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9zZWFyY2hyZXN1bHRzL3NlYXJjaC52aWV3Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6IFwic2VhcmNoQ3RybFwiLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGFsbFJlc3VsdHM6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFNlYXJjaEZhY3RvcnkpIHtcblx0XHRcdFx0cmV0dXJuIFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dCgkc3RhdGVQYXJhbXMuc2VhcmNoVGVybXMpXG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvLyBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBhbGxSZXN1bHRzKSB7XG5cdFx0Ly8gXHQkc2NvcGUucmVzdWx0cyA9IGFsbFJlc3VsdHM7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhcIkFsbCBSZXN1bHRzISFcIiwgYWxsUmVzdWx0cyk7XG5cdFx0Ly8gXHQkc2NvcGUubnVtYmVyID0gMTIzO1xuXHRcdC8vIH1cblx0XHQvLyBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMpIHtcblx0XHQvLyBcdGNvbnNvbGUubG9nKFwiSEVSRUVFRUVcIiwgJHN0YXRlUGFyYW1zLnJlc3VsdHMpXG5cdFx0Ly8gXHQkc2NvcGUucmVzdWx0cyA9ICRzdGF0ZVBhcmFtcy5yZXN1bHRzXG5cdFx0Ly8gfVxuXHR9KVxufSlcbiIsImFwcC5mYWN0b3J5KCdSZXZpZXdGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBwb3N0UmV2aWV3OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3Jldmlldy8nLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG4gICAgcHJvZHVjdFJldmlld3M6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9yZXZpZXcvc29jay8nK3NvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbn0pXG4iLCJhcHAuY29udHJvbGxlcignU2lnbnVwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIFNpZ251cEZhY3RvcnksICRzdGF0ZSkge1xuXG4gIGZ1bmN0aW9uIHBhc3N3b3JkVmFsaWQgKHBhc3N3b3JkKSB7XG4gICAgaWYgKHBhc3N3b3JkLmxlbmd0aCA8IDYpIHtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiUGFzc3dvcmQgbXVzdCBiZSA2IGNoYXJhY3RlcnMgbG9uZyFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHBhc3N3b3JkICE9PSAkc2NvcGUucHcyKSB7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlRoZSBwYXNzd29yZCBmaWVsZHMgZG9uJ3QgbWF0Y2ghXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmICgvXFxXLy50ZXN0KHBhc3N3b3JkKSl7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlBhc3N3b3JkIGNhbm5vdCBjb250YWluIHNwZWNpYWwgY2hhcmFjdGVycyFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLnNob3dFcnJvciA9IGZhbHNlO1xuXG4gICRzY29wZS5kaXNwbGF5RXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJHNjb3BlLnNob3dFcnJvcjtcbiAgfVxuXG4gICRzY29wZS5zdWJtaXRTaWdudXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHBhc3N3b3JkVmFsaWQoJHNjb3BlLnBhc3N3b3JkKSl7XG4gICAgICBjb25zb2xlLmxvZyhcIm5vdyBJIGRvbid0IHdvcmshXCIpO1xuICAgICAgcmV0dXJuIFNpZ251cEZhY3Rvcnkuc3VibWl0KHtcbiAgICAgICBlbWFpbDogJHNjb3BlLmVtYWlsLFxuICAgICAgIHVzZXJuYW1lOiAkc2NvcGUudXNlcm5hbWUsXG4gICAgICAgcGFzc3dvcmQ6ICRzY29wZS5wYXNzd29yZCxcbiAgICAgICBmaXJzdF9uYW1lOiAkc2NvcGUuZmlyc3RuYW1lLFxuICAgICAgIGxhc3RfbmFtZTogJHNjb3BlLmxhc3RuYW1lLFxuICAgICAgIGlzQWRtaW46IGZhbHNlLFxuICAgICAgIG5ld1VzZXI6IHRydWVcbiAgICAgfSkudGhlbihmdW5jdGlvbihyZXMpe1xuICAgICAgICBjb25zb2xlLmxvZyhyZXMpO1xuICAgICAgICByZXR1cm4gJHN0YXRlLmdvKCdwZXJzb25hbCcpO1xuICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG59KTsiLCIvLyBhcHAuZmFjdG9yeSgnU2lnbnVwRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4vLyAgIHZhciBTaWdudXBGYWN0b3J5ID0ge307XG5cbi8vICAgU2lnbnVwRmFjdG9yeS5zdWJtaXQgPSBmdW5jdGlvbih1c2VySW5mbyl7XG4vLyAgIFx0Y29uc29sZS5sb2codXNlckluZm8pO1xuLy8gICBcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvJywgdXNlckluZm8pXG4vLyAgIFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuLy8gICBcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4vLyAgIFx0fSlcbi8vICAgfVxuXG4vLyAgIHJldHVybiBTaWdudXBGYWN0b3J5O1xuXG4vLyB9KVxuXG5hcHAuZmFjdG9yeSgnU2lnbnVwRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXHR2YXIgU2lnbnVwRmFjdG9yeSA9IHt9O1xuXG5cdFNpZ251cEZhY3Rvcnkuc3VibWl0ID0gZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG5cdFx0Y29uc29sZS5sb2coXCJGcm9tIFNpZ251cCBGYWN0b3J5XCIsIHVzZXJJbmZvKTtcblx0XHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2VyLycsIHVzZXJJbmZvKVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuXHRcdH0pXG5cdH1cblx0cmV0dXJuIFNpZ251cEZhY3Rvcnk7XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ251cCcsIHtcblx0XHR1cmw6ICcvc2lnbnVwJyxcblx0XHRjb250cm9sbGVyOiAnU2lnbnVwQ3RybCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvc2lnbnVwL3NpZ251cC52aWV3Lmh0bWwnXG5cdH0pO1xuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwZXJzb25hbCcsIHtcblx0XHR1cmw6ICcvcGVyc29uYWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDdHJsJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9zaWdudXAvcGVyc29uYWxpbmZvLnZpZXcuaHRtbCdcblx0fSk7XG59KTsiLCJhcHAuY29udHJvbGxlcignVXNlckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIHRoZVVzZXIsIHRoZVVzZXJTb2Nrcykge1xuICAgIGNvbnNvbGUubG9nKFwiY29udHJvbGxlclwiLCB0aGVVc2VyU29ja3MpO1xuXHQkc2NvcGUudXNlciA9IHRoZVVzZXI7XG5cdCRzY29wZS5zb2NrcyA9IHRoZVVzZXJTb2Nrcztcblx0JHNjb3BlLnRvU29ja1ZpZXcgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHQkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG5cdH1cbn0pXG4iLCJhcHAuZmFjdG9yeSgnVXNlckZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0dmFyIFVzZXJGYWN0b3J5ID0ge307XG5cblx0VXNlckZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS91c2VyLycgKyBpZClcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZmFjdG9yeVwiLCByZXNwb25zZS5kYXRhKVxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGFcblx0XHR9KVxuXHR9XG5cblx0VXNlckZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS91c2VycycpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YVxuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gVXNlckZhY3Rvcnk7XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VzZXInLCB7XG5cdFx0dXJsOiAnL3VzZXIvOnVzZXJJZCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvdXNlci91c2VyLXByb2ZpbGUuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1VzZXJDdHJsJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR0aGVVc2VyOiBmdW5jdGlvbiAoVXNlckZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuXHRcdFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy51c2VySWQpO1xuXHRcdFx0fSxcblx0XHRcdHRoZVVzZXJTb2NrczogZnVuY3Rpb24gKFNvY2tGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0cmV0dXJuIFNvY2tGYWN0b3J5LnNvY2tCeVVzZXJJZCgkc3RhdGVQYXJhbXMudXNlcklkKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pXG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ25hdmJhckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIFNlYXJjaEZhY3RvcnkpIHtcblxuXHQkc2NvcGUuc2VhcmNoID0gZnVuY3Rpb24oc2VhcmNoVGVybXMpe1xuXHRcdC8vIFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dChzZWFyY2hUZXJtcylcblx0XHQvLyAudGhlbihmdW5jdGlvbihyZXN1bHRzKXtcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gcmVzdWx0cztcblx0XHQvLyBcdGNvbnNvbGUubG9nKHJlc3VsdHMpO1xuXHRcdFx0cmV0dXJuICRzdGF0ZS5nbygnc2VhcmNoUmVzdWx0cycsIHtzZWFyY2hUZXJtczogc2VhcmNoVGVybXN9KTtcblx0XHQvLyB9KVxuXHR9XG59KVxuXG5hcHAuY29udHJvbGxlcignc2VhcmNoQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgYWxsUmVzdWx0cywgJHN0YXRlUGFyYW1zKSB7XG5cdCRzY29wZS5yZXN1bHRzID0gYWxsUmVzdWx0cztcblx0JHNjb3BlLnNlZVNvY2sgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHQkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG5cdH1cbn0pIiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmZhY3RvcnkoXCJTZWFyY2hGYWN0b3J5XCIsIGZ1bmN0aW9uICgkaHR0cCkge1xuXHR2YXIgU2VhcmNoRmFjdG9yeSA9IHt9O1xuXG5cdFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dCA9IGZ1bmN0aW9uICh0ZXh0KSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9zZWFyY2gvP3E9JyArIHRleHQpXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzdWx0cykge1xuXHRcdFx0cmV0dXJuIHJlc3VsdHMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0cmV0dXJuIFNlYXJjaEZhY3Rvcnk7XG59KSIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnSG9tZScsIHN0YXRlOiAnaG9tZScgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQWJvdXQnLCBzdGF0ZTogJ2Fib3V0JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdEZXNpZ24nLCBzdGF0ZTogJ2Rlc2lnblZpZXcnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ015IFByb2ZpbGUnLCBzdGF0ZTogJ3VzZXIoe3VzZXJJZDp1c2VyLmlkfSknLCBhdXRoOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ015IENhcnQnLCBzdGF0ZTogJ2N1cnJlbnRDYXJ0J31cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldFVzZXIoKTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLmdyZWV0aW5nID0gUmFuZG9tR3JlZXRpbmdzLmdldFJhbmRvbUdyZWV0aW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ29hdXRoQnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICBwcm92aWRlck5hbWU6ICdAJ1xuICAgIH0sXG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uaHRtbCdcbiAgfVxufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
