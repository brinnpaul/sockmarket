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
    $stateProvider.state('docs', {
        url: '/docs',
        templateUrl: 'js/docs/docs.html'
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

app.controller('sockIdController', function ($scope, $state, $stateParams, theSock, theReviews, ReviewFactory, OrderFactory, AuthService) {

    $scope.dateParser = function (date) {

        //return to this later. Would be good if socks and reviews stated when they were posted

        //should add it to a factory, because many pages can make use of it

        var monthObj = {
            '01': "January",
            '02': "February",
            '03': "March",
            '04': "April",
            '05': "May",
            '06': "June",
            '07': "July",
            '08': "August",
            '09': "September",
            '10': "October",
            '11': "November",
            '12': "December"
        };

        return monthObj[date.slice(5, 7)] + ' ' + date.slice(8, 10) + ', ' + date.slice(0, 4);
    };

    $scope.reviewNotAllowed = false;
    $scope.sock = theSock;
    $scope.reviews = theReviews;
    console.log($scope.sock);

    $scope.alert = function () {
        $scope.alerting = !$scope.alerting;
    };

    $scope.goToUserPage = function (userId) {
        $state.go('user', { userId: userId });
    };

    $scope.addItem = function () {
        var item = {};
        item.sockId = $scope.sock.id;
        item.quantity = +$scope.quantity;
        console.log(item);
        if (item.quantity > 0) return OrderFactory.addToCart(item);
        //else $scope.alert()
    };

    $scope.displayTags = function () {
        return $scope.sock.tags.map(function (tag) {
            return '#' + tag;
        }).join(", ");
    };

    $scope.displayTags();

    $scope.getLoggedInUserId = function () {
        return AuthService.getLoggedInUser().then(function (user) {
            console.log(user);
            if (!user) {
                $scope.loggedInUserId = 'none';
            } else {
                $scope.loggedInUserId = user.id;
            }
        });
    };

    $scope.getLoggedInUserId();

    $scope.userCannotPostReview = function () {
        return $scope.reviewNotAllowed;
    };

    $scope.userCannotPostReview();

    $scope.newReview = function () {

        //if user has already review sock, don't allow user to review it again
        var usersWhoReviewedSock = $scope.reviews.map(function (review) {
            return review.userId;
        });

        if ($scope.loggedInUserId === 'none') {
            $scope.reviewErrorMessage = "You must be logged in to review a sock!";
            $scope.reviewNotAllowed = true;
        } else if (usersWhoReviewedSock.indexOf($scope.loggedInUserId) !== -1) {
            $scope.reviewErrorMessage = "You've already reviewed this sock! You can't review it again!";
            $scope.reviewNotAllowed = true;
            //if sock id matches user id, user don't allow user to post a review
        } else if ($scope.loggedInUserId === $scope.sock.user.id) {
                $scope.reviewErrorMessage = "You can't review your own sock!";
                $scope.reviewNotAllowed = true;
            } else {

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
            }
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

app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiZGVzaWduL2Rlc2lnbi1kaXJlY3RpdmUuanMiLCJkZXNpZ24vZGVzaWduLmNvbnRyb2xsZXIuanMiLCJkZXNpZ24vZGVzaWduLmRpcmVjdGl2ZS5qcyIsImRlc2lnbi9kZXNpZ24uanMiLCJkZXNpZ24vZGVzaWduLnN0YXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJkb2NzL2RvY3MuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJvcmRlci9vcmRlci5jb250cm9sbGVyLmpzIiwib3JkZXIvb3JkZXIuZmFjdG9yeS5qcyIsIm9yZGVyL29yZGVyLnN0YXRlLmpzIiwicHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuZmFjdG9yeS5qcyIsInByb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3LmpzIiwicmV2aWV3L3Jldmlldy5mYWN0b3J5LmpzIiwic2VhcmNocmVzdWx0cy9zZWFyY2guc3RhdGUuanMiLCJzaWdudXAvc2lnbnVwLmNvbnRyb2xsZXIuanMiLCJzaWdudXAvc2lnbnVwLmZhY3RvcnkuanMiLCJzaWdudXAvc2lnbnVwLnN0YXRlLmpzIiwidXNlci91c2VyLWNvbnRyb2xsZXIuanMiLCJ1c2VyL3VzZXItZmFjdG9yeS5qcyIsInVzZXIvdXNlci1zdGF0ZXMuanMiLCJjb21tb24vY29udHJvbGxlcnMvbmF2YmFyLmNvbnRyb2xsZXIuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvc2VhcmNoLmZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmRpcmVjdGl2ZS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQUNBLE9BQUEsR0FBQSxHQUFBLFFBQUEsTUFBQSxDQUFBLFlBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsQ0FBQSxDQUFBOztBQUVBLElBQUEsTUFBQSxDQUFBLFVBQUEsa0JBQUEsRUFBQSxpQkFBQSxFQUFBOztBQUVBLHNCQUFBLFNBQUEsQ0FBQSxJQUFBOztBQUVBLHVCQUFBLFNBQUEsQ0FBQSxHQUFBOztBQUVBLHVCQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQSxlQUFBLFFBQUEsQ0FBQSxNQUFBO0FBQ0EsS0FGQTtBQUdBLENBVEE7OztBQVlBLElBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7OztBQUdBLFFBQUEsK0JBQUEsU0FBQSw0QkFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsTUFBQSxJQUFBLElBQUEsTUFBQSxJQUFBLENBQUEsWUFBQTtBQUNBLEtBRkE7Ozs7QUFNQSxlQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsWUFBQSxDQUFBLDZCQUFBLE9BQUEsQ0FBQSxFQUFBOzs7QUFHQTtBQUNBOztBQUVBLFlBQUEsWUFBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0E7QUFDQTs7O0FBR0EsY0FBQSxjQUFBOztBQUVBLG9CQUFBLGVBQUEsR0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7Ozs7QUFJQSxnQkFBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsUUFBQSxJQUFBLEVBQUEsUUFBQTtBQUNBLGFBRkEsTUFFQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxPQUFBO0FBQ0E7QUFDQSxT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QSxNQUFBLEVBQUEsRUFBQSxRQUFBLE1BQUEsRUFBQTtBQUNBLEtBRkE7O0FBSUEsV0FBQSxPQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUEsT0FBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUEsT0FBQSxJQUFBLENBQUEsRUFBQTtBQUNBLGFBQUEsUUFBQSxHQUFBLENBQUEsT0FBQSxRQUFBO0FBQ0EsZ0JBQUEsR0FBQSxDQUFBLElBQUE7QUFDQSxZQUFBLEtBQUEsUUFBQSxHQUFBLENBQUEsRUFBQSxPQUFBLGFBQUEsU0FBQSxDQUFBLElBQUEsQ0FBQTs7QUFFQSxLQVBBOztBQVNBLFdBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLE9BQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxNQUFBLEdBQUE7QUFDQSxTQUZBLEVBRUEsSUFGQSxDQUVBLElBRkEsQ0FBQTtBQUdBLEtBSkE7O0FBTUEsV0FBQSxXQUFBOztBQUVBLFdBQUEsaUJBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxZQUFBLGVBQUEsR0FDQSxJQURBLENBQ0EsVUFBQSxJQUFBLEVBQUE7QUFDQSxvQkFBQSxHQUFBLENBQUEsSUFBQTtBQUNBLGdCQUFBLENBQUEsSUFBQSxFQUFBO0FBQ0EsdUJBQUEsY0FBQSxHQUFBLE1BQUE7QUFDQSxhQUZBLE1BRUE7QUFDQSx1QkFBQSxjQUFBLEdBQUEsS0FBQSxFQUFBO0FBQ0E7QUFDQSxTQVJBLENBQUE7QUFTQSxLQVZBOztBQVlBLFdBQUEsaUJBQUE7O0FBRUEsV0FBQSxvQkFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLE9BQUEsZ0JBQUE7QUFDQSxLQUZBOztBQUlBLFdBQUEsb0JBQUE7O0FBRUEsV0FBQSxTQUFBLEdBQUEsWUFBQTs7O0FBR0EsWUFBQSx1QkFBQSxPQUFBLE9BQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxtQkFBQSxPQUFBLE1BQUE7QUFDQSxTQUZBLENBQUE7O0FBSUEsWUFBQSxPQUFBLGNBQUEsS0FB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QUFBO0FBQ0EsYUFYQSxDQUFBO0FBWUEsU0FkQSxNQWNBO0FBQ0E7QUFDQTtBQUNBLEtBbEJBO0FBbUJBLENBN0NBOzs7Ozs7Ozs7Ozs7Ozs7OztBQ2dCQSxJQUFBLE9BQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxRQUFBLGdCQUFBLEVBQUE7O0FBRUEsa0JBQUEsTUFBQSxHQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsZ0JBQUEsR0FBQSxDQUFBLHFCQUFBLEVBQUEsUUFBQTtBQUNBLGVBQUEsTUFBQSxJQUFBLENBQUEsWUFBQSxFQUFBLFFBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxTQUFBLElBQUE7QUFDQSxTQUhBLENBQUE7QUFJQSxLQU5BO0FBT0EsV0FBQSxhQUFBO0FBQ0EsQ0FYQTs7QUNoQkEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxTQURBO0FBRUEsb0JBQUEsWUFGQTtBQUdBLHFCQUFBO0FBSEEsS0FBQTs7QUFNQSxtQkFBQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsYUFBQSxXQURBO0FBRUEsb0JBQUEsWUFGQTtBQUdBLHFCQUFBO0FBSEEsS0FBQTtBQUtBLENBWkE7QUNBQSxJQUFBLFVBQUEsQ0FBQSxVQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxZQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUEsSUFBQSxHQUFBLE9BQUE7QUFDQSxXQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxVQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxlQUFBLEVBQUEsQ0FBQSxnQkFBQSxFQUFBLEVBQUEsSUFBQSxFQUFBLEVBQUE7QUFDQSxLQUZBO0FBR0EsQ0FQQTs7QUNBQSxJQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxRQUFB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R0EsYUFKQTs7QUFNQSxnQkFBQSxVQUFBLFNBQUEsT0FBQSxHQUFBO0FBQ0EsNEJBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLDBCQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsaUJBRkE7QUFHQSxhQUpBOztBQU1BLGdCQUFBLGFBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxzQkFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLGFBRkE7O0FBSUE7O0FBRUEsdUJBQUEsR0FBQSxDQUFBLFlBQUEsWUFBQSxFQUFBLE9BQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsWUFBQSxhQUFBLEVBQUEsVUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxZQUFBLGNBQUEsRUFBQSxVQUFBO0FBRUE7O0FBMUNBLEtBQUE7QUE4Q0EsQ0FoREE7O0FDQUEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLHFCQUFBO0FBRkEsS0FBQTtBQUlBLENBTEE7QUNBQTs7QUFFQSxJQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxlQUFBO0FBQ0EsMEJBQUE7QUFEQSxTQURBO0FBSUEsa0JBQUEsR0FKQTtBQUtBLHFCQUFBO0FBTEEsS0FBQTtBQU9BLENBUkE7O0FDRkEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQSxrQkFBQSxHQURBO0FBRUEscUJBQUEseURBRkE7QUFHQSxjQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsUUFBQSxHQUFBLGdCQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ3NvY2ttYXJrZXQnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Fib3V0Jywge1xuICAgICAgICB1cmw6ICcvYWJvdXQnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWJvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hYm91dC9hYm91dC5odG1sJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Fib3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEZ1bGxzdGFja1BpY3MpIHtcblxuICAgIC8vIEltYWdlcyBvZiBiZWF1dGlmdWwgRnVsbHN0YWNrIHBlb3BsZS5cbiAgICAkc2NvcGUuaW1hZ2VzID0gXy5zaHVmZmxlKEZ1bGxzdGFja1BpY3MpO1xuXG59KTtcblxuIiwiYXBwLmRpcmVjdGl2ZSgnZGVzaWduVmlldycsIGZ1bmN0aW9uIChTb2NrRmFjdG9yeSwgJHN0YXRlKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2Rlc2lnbi9kZXNpZ24tdmlldy5odG1sJyxcblx0XHQvLyBzY29wZToge1xuXHRcdC8vIFx0dGhlU29jazogJz0nXG5cdFx0Ly8gfSxcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0XHR2YXIgdGl0bGUgPSBzY29wZS50aXRsZTtcblx0XHRcdHZhciBkZXNjcmlwdGlvbiA9IHNjb3BlLmRlc2NyaXB0aW9uO1xuXHRcdFx0dmFyIHRhZ3MgPSBzY29wZS50YWdzO1xuXHRcdFx0dmFyIGNhbnZhcyA9IGVsZW1lbnQuZmluZCgnY2FudmFzJylbMF07XG5cdFx0XHRzY29wZS5zYXZlRGVzaWduID0gZnVuY3Rpb24gKHRpdGxlLCBkZXNjcmlwdGlvbiwgdGFncykge1xuXHRcdFx0XHR2YXIgdGFnc0FyciA9IFNvY2tGYWN0b3J5LnByZXBhcmVUYWdzKHRhZ3MpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdUQUdTOicsIHRhZ3NBcnIpO1xuXHRcdFx0XHR2YXIgZGF0YVVSTCA9IGNhbnZhcy50b0RhdGFVUkwoKVxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhkZXNjcmlwdGlvbilcblx0XHRcdFx0dmFyIG5ld1NvY2tEYXRhT2JqID0ge1xuXHRcdFx0XHRcdHRpdGxlOiB0aXRsZSxcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24sXG5cdFx0XHRcdFx0dGFnczogdGFnc0Fycixcblx0XHRcdFx0XHRpbWFnZTogZGF0YVVSTFxuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZXR1cm4gU29ja0ZhY3Rvcnkuc2F2ZURlc2lnbihuZXdTb2NrRGF0YU9iailcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuXHRcdFx0XHRcdCRzdGF0ZS5nbygndXNlcicsIHt1c2VySWQ6IHJlc3VsdC5kYXRhLnVzZXJJZH0pXG5cdFx0XHRcdH0pXG5cdFx0XHR9O1xuXG5cblx0XHRcdHZhciBjb2xvciA9ICQoXCIuc2VsZWN0ZWRcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdHZhciBjb250ZXh0ID0gJChcImNhbnZhc1wiKVswXS5nZXRDb250ZXh0KFwiMmRcIik7XG5cdFx0XHR2YXIgJGNhbnZhcyA9ICQoXCJjYW52YXNcIik7XG5cdFx0XHR2YXIgbGFzdEV2ZW50O1xuXHRcdFx0dmFyIG1vdXNlRG93biA9IGZhbHNlO1xuXG5cdFx0XHR2YXIgYmFja2dyb3VuZCA9IG5ldyBJbWFnZSgpO1xuXG5cdFx0XHQvLyBjb250ZXh0LmZpbGxTdHlsZSA9ICcjZjhmOGZmJztcblx0XHRcdC8vIGNvbnRleHQub3BhY2l0eSA9IDA7XG5cdFx0XHQvLyBjb250ZXh0LmZpbGwoKVxuXG5cdFx0XHQvLyBmdW5jdGlvbiBnZW5lcmF0ZVNvY2tVUkwoKXtcblx0XHRcdC8vICAgZnVuY3Rpb24gZ2VuZXJhdGVSYW5kb21OdW1iZXIoKSB7XG5cdFx0XHQvLyAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMpICsgMTtcblx0XHRcdC8vICAgfVxuXHRcdFx0Ly8gICB2YXIgbnVtID0gZ2VuZXJhdGVSYW5kb21OdW1iZXIoKTtcblxuXHRcdFx0Ly8gICBpZiAobnVtID09PSAxKSByZXR1cm4gJy9zb2NrLWJnLycgKyBudW0gKyAnLnBuZydcblx0XHRcdC8vICAgZWxzZSByZXR1cm4gJy9zb2NrLWJnLycgKyBudW0gKyAnLmpwZyc7XG5cdFx0XHQvLyB9XG5cblx0XHRcdGJhY2tncm91bmQuc3JjID0gJy9zb2NrLWJnLzEucG5nJztcblxuXHRcdFx0YmFja2dyb3VuZC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdCAgY29udGV4dC5kcmF3SW1hZ2UoYmFja2dyb3VuZCwgMCwgMCk7XG5cdFx0XHR9O1xuXG5cdFx0XHQvL1doZW4gY2xpY2tpbmcgb24gY29udHJvbCBsaXN0IGl0ZW1zXG5cdFx0XHQgICQoXCIuY29udHJvbHNcIikub24oXCJjbGlja1wiLCBcImxpXCIgLCBmdW5jdGlvbigpe1xuXHRcdFx0ICAgICAvL0Rlc2xlY3Qgc2libGluZyBlbGVtZW50c1xuXHRcdFx0ICAgICAkKHRoaXMpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcblx0XHRcdCAgICAgLy9TZWxlY3QgY2xpY2tlZCBlbGVtZW50XG5cdFx0XHQgICAgICQodGhpcykuYWRkQ2xhc3MoXCJzZWxlY3RlZFwiKTtcblx0XHRcdCAgICAgLy9zdG9yZSB0aGUgY29sb3Jcblx0XHRcdCAgICAgY29sb3IgPSAkKHRoaXMpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XG5cdFx0XHQgIH0pO1xuXG5cdFx0XHQvL1doZW4gXCJBZGQgQ29sb3JcIiBidXR0b24gaXMgcHJlc3NlZFxuXHRcdFx0ICAkKFwiI3JldmVhbENvbG9yU2VsZWN0XCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdFx0ICAvL1Nob3cgY29sb3Igc2VsZWN0IG9yIGhpZGUgdGhlIGNvbG9yIHNlbGVjdFxuXHRcdFx0ICAgIGNoYW5nZUNvbG9yKCk7XG5cdFx0XHQgIFx0JChcIiNjb2xvclNlbGVjdFwiKS50b2dnbGUoKTtcblx0XHRcdCAgfSk7XG5cblx0XHRcdC8vVXBkYXRlIHRoZSBuZXcgY29sb3Igc3BhblxuXHRcdFx0ZnVuY3Rpb24gY2hhbmdlQ29sb3IoKXtcblx0XHRcdFx0dmFyIHIgPSAkKFwiI3JlZFwiKS52YWwoKTtcblx0XHRcdFx0dmFyIGcgPSAkKFwiI2dyZWVuXCIpLnZhbCgpO1xuXHRcdFx0XHR2YXIgYiA9ICQoXCIjYmx1ZVwiKS52YWwoKTtcblx0XHRcdFx0JChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiKFwiICsgciArIFwiLCBcIiArIGcgKyBcIiwgXCIgKyBiICsgXCIpXCIpO1xuXHRcdFx0ICAvL1doZW4gY29sb3Igc2xpZGVycyBjaGFuZ2VcblxuXG5cdFx0XHR9XG5cblx0XHRcdCQoXCJpbnB1dFt0eXBlPXJhbmdlXVwiKS5vbihcImlucHV0XCIsIGNoYW5nZUNvbG9yKTtcblxuXHRcdFx0Ly93aGVuIFwiQWRkIENvbG9yXCIgaXMgcHJlc3NlZFxuXHRcdFx0JChcIiNhZGROZXdDb2xvclwiKS5jbGljayhmdW5jdGlvbigpe1xuXHRcdFx0ICAvL2FwcGVuZCB0aGUgY29sb3IgdG8gdGhlIGNvbnRyb2xzIHVsXG5cdFx0XHQgIHZhciAkbmV3Q29sb3IgPSAkKFwiPGxpPjwvbGk+XCIpO1xuXHRcdFx0ICAkbmV3Q29sb3IuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCAkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIikpO1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzIHVsXCIpLmFwcGVuZCgkbmV3Q29sb3IpO1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzIGxpXCIpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcblx0XHRcdCAgJChcIi5jb250cm9scyBsaVwiKS5sYXN0KCkuYWRkQ2xhc3MoXCJzZWxlY3RlZFwiKTtcblx0XHRcdCAgY29sb3IgPSAkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XG5cdFx0XHQgIC8vd2hlbiBhZGRlZCwgcmVzdG9yZSBzbGlkZXJzIGFuZCBwcmV2aWV3IGNvbG9yIHRvIGRlZmF1bHRcblx0XHRcdCAgJChcIiNjb2xvclNlbGVjdFwiKS5oaWRlKCk7XG5cdFx0XHRcdHZhciByID0gJChcIiNyZWRcIikudmFsKDApO1xuXHRcdFx0XHR2YXIgZyA9ICQoXCIjZ3JlZW5cIikudmFsKDApO1xuXHRcdFx0XHR2YXIgYiA9ICQoXCIjYmx1ZVwiKS52YWwoMCk7XG5cdFx0XHRcdCQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYihcIiArIHIgKyBcIiwgXCIgKyBnICsgXCIsIFwiICsgYiArIFwiKVwiKTtcblxuXHRcdFx0fSlcblxuXHRcdFx0Ly9PbiBtb3VzZSBldmVudHMgb24gdGhlIGNhbnZhc1xuXHRcdFx0JGNhbnZhcy5tb3VzZWRvd24oZnVuY3Rpb24oZSl7XG5cdFx0XHQgIGxhc3RFdmVudCA9IGU7XG5cdFx0XHQgIG1vdXNlRG93biA9IHRydWU7XG5cdFx0XHR9KS5tb3VzZW1vdmUoZnVuY3Rpb24oZSl7XG5cdFx0XHQgIC8vZHJhdyBsaW5lc1xuXHRcdFx0ICBpZiAobW91c2VEb3duKXtcblx0XHRcdCAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuXHRcdFx0ICAgIGNvbnRleHQubW92ZVRvKGxhc3RFdmVudC5vZmZzZXRYLGxhc3RFdmVudC5vZmZzZXRZKTtcblx0XHRcdCAgICBjb250ZXh0LmxpbmVUbyhlLm9mZnNldFgsIGUub2Zmc2V0WSk7XG5cdFx0XHQgICAgY29udGV4dC5zdHJva2VTdHlsZSA9IGNvbG9yO1xuXHRcdFx0ICAgIGNvbnRleHQuc3Ryb2tlKCk7XG5cdFx0XHQgICAgY29udGV4dC5saW5lQ2FwID0gJ3JvdW5kJztcblx0XHRcdCAgICBjb250ZXh0LmxpbmVXaWR0aCA9IDIwO1xuXG5cdFx0XHQgICAgbGFzdEV2ZW50ID0gZTtcblx0XHRcdCAgfVxuXHRcdFx0fSkubW91c2V1cChmdW5jdGlvbigpe1xuXHRcdFx0ICAgIG1vdXNlRG93biA9IGZhbHNlO1xuXHRcdFx0fSkubW91c2VsZWF2ZShmdW5jdGlvbigpe1xuXHRcdFx0ICAgICRjYW52YXMubW91c2V1cCgpO1xuXHRcdFx0fSk7XG5cblxuXG5cblx0XHRcdC8vIHZhciBza2V0Y2ggPSBlbGVtZW50LmZpbmQoJyNza2V0Y2gnKTtcblx0XHRcdC8vIGNvbnNvbGUubG9nKHNrZXRjaCk7XG5cdFx0XHQvLyB2YXIgc2tldGNoU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHNrZXRjaClcblx0XHQgICAgLy8gY2FudmFzLndpZHRoID0gcGFyc2VJbnQoc2tldGNoU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnd2lkdGgnKSk7XG5cdFx0ICAgIC8vIGNhbnZhcy5oZWlnaHQgPSBwYXJzZUludChza2V0Y2hTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdoZWlnaHQnKSk7XG5cblxuXG5cdCAgICBcdC8vIHZhciBjb2xvciA9ICdibGFjayc7XG5cdFx0ICAgIC8vIHNjb3BlLmNoYW5nZUNvbG9yID0gZnVuY3Rpb24gKGNob3NlbkNvbG9yKSB7XG5cdFx0ICAgIC8vIFx0Y29sb3IgPSBjaG9zZW5Db2xvcjtcblx0XHQgICAgLy8gXHRjb25zb2xlLmxvZygnQ09MT1InLCBjb2xvcilcblx0XHQgICAgLy8gfVx0XHQgICAgXG5cblx0XHQgICAgLy8gdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdFx0ICAgIC8vIGN0eC5saW5lV2lkdGggPSAyMDtcblx0XHQgICAgLy8gY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcblx0XHQgICAgLy8gY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuXG5cdFx0ICAgIC8vIHZhciBjdXJyZW50TW91c2VQb3NpdGlvbiA9IHtcblx0XHQgICAgLy8gICAgIHg6IDAsXG5cdFx0ICAgIC8vICAgICB5OiAwXG5cdFx0ICAgIC8vIH07XG5cblx0XHQgICAgLy8gdmFyIGxhc3RNb3VzZVBvc2l0aW9uID0ge1xuXHRcdCAgICAvLyAgICAgeDogMCxcblx0XHQgICAgLy8gICAgIHk6IDBcblx0XHQgICAgLy8gfTtcblxuXHRcdCAgICAvLyB2YXIgZHJhd2luZyA9IGZhbHNlO1xuXG5cdFx0ICAgIC8vIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuXHRcdCAgICAvLyAgICAgZHJhd2luZyA9IHRydWU7XG5cdFx0ICAgIC8vICAgICBjdXJyZW50TW91c2VQb3NpdGlvbi54ID0gZS5vZmZzZXRYO1xuXHRcdCAgICAvLyAgICAgY3VycmVudE1vdXNlUG9zaXRpb24ueSA9IGUub2Zmc2V0WTtcblx0XHQgICAgLy8gfSk7XG5cblx0XHQgICAgLy8gY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbiAoKSB7XG5cdFx0ICAgIC8vICAgICBkcmF3aW5nID0gZmFsc2U7XG5cdFx0ICAgIC8vIH0pO1xuXG5cdFx0ICAgIC8vIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBmdW5jdGlvbiAoZSkge1xuXHRcdCAgICAvLyAgICAgaWYgKCFkcmF3aW5nKSByZXR1cm47XG5cblx0XHQgICAgLy8gICAgIGxhc3RNb3VzZVBvc2l0aW9uLnggPSBjdXJyZW50TW91c2VQb3NpdGlvbi54O1xuXHRcdCAgICAvLyAgICAgbGFzdE1vdXNlUG9zaXRpb24ueSA9IGN1cnJlbnRNb3VzZVBvc2l0aW9uLnk7XG5cblx0XHQgICAgLy8gICAgIGN1cnJlbnRNb3VzZVBvc2l0aW9uLnggPSBlLm9mZnNldFg7XG5cdFx0ICAgIC8vICAgICBjdXJyZW50TW91c2VQb3NpdGlvbi55ID0gZS5vZmZzZXRZO1xuXG5cdFx0ICAgIC8vICAgICBjb25zb2xlLmxvZygnUE9TSVRJT04nLCBjdXJyZW50TW91c2VQb3NpdGlvbilcblxuXHRcdCAgICAvLyAgICAgZHJhdyhsYXN0TW91c2VQb3NpdGlvbiwgY3VycmVudE1vdXNlUG9zaXRpb24sIGNvbG9yLCB0cnVlKTtcblxuXHRcdCAgICAvLyB9KTtcblxuXHRcdCAgICAvLyB2YXIgZHJhdyA9IGZ1bmN0aW9uIChzdGFydCwgZW5kLCBzdHJva2VDb2xvcikge1xuXG5cdFx0ICAgIC8vICAgICAvLyBEcmF3IHRoZSBsaW5lIGJldHdlZW4gdGhlIHN0YXJ0IGFuZCBlbmQgcG9zaXRpb25zXG5cdFx0ICAgIC8vICAgICAvLyB0aGF0IGlzIGNvbG9yZWQgd2l0aCB0aGUgZ2l2ZW4gY29sb3IuXG5cdFx0ICAgIC8vICAgICBjdHguYmVnaW5QYXRoKCk7XG5cdFx0ICAgIC8vICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2VDb2xvciB8fCAnYmxhY2snO1xuXHRcdCAgICAvLyAgICAgY3R4Lm1vdmVUbyhzdGFydC54LCBzdGFydC55KTtcblx0XHQgICAgLy8gICAgIGN0eC5saW5lVG8oZW5kLngsIGVuZC55KTtcblx0XHQgICAgLy8gICAgIGN0eC5jbG9zZVBhdGgoKTtcblx0XHQgICAgLy8gICAgIGN0eC5zdHJva2UoKTtcblxuXHRcdCAgICAvLyB9O1xuXG5cdFx0fVxuXHR9XG59KSIsImFwcC5jb250cm9sbGVyKCdEZXNpZ25Db250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXG4gICRzY29wZS5oaSA9IFwiaGlcIjtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnZGVzaWduU29jaycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgY29udHJvbGxlcjogJ0Rlc2lnbkNvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Rlc2lnbi9kZXNpZ24udmlldy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGVzaWduVmlldycsIHtcbiAgICAgIHVybDonL3NvY2tzL2Rlc2lnbi86aWQnLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgdGhlU29jazogJz0nXG4gICAgICB9LFxuICAgICAgY29udHJvbGxlcjogJ2Rlc2lnblZpZXdDdHJsJyxcbiAgICAgIHRlbXBsYXRlOiAnPGRlc2lnbi12aWV3PjwvZGVzaWduLXZpZXc+JyxcbiAgICB9KVxuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ2Rlc2lnblZpZXdDdHJsJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXHQvLyAvLyAkc2NvcGUuZGVzY3JpcHRpb247XG5cdC8vICRzY29wZS50YWdzO1xuXHQvLyAkc2NvcGUudGl0bGU7XG5cdC8vIGNvbnNvbGUubG9nKCRzY29wZS5kZXNjcmlwdGlvbik7XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rlc2lnbicsIHtcbiAgICAgIHVybDonL2Rlc2lnbicsXG4gICAgICBjb250cm9sbGVyOiAnRGVzaWduQ29udHJvbGxlcicsXG4gICAgICB0ZW1wbGF0ZVVybDogJzxkZXNpZ24tc29jaz48L2Rlc2lnbi1zb2NrPidcbiAgICB9KVxufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkb2NzJywge1xuICAgICAgICB1cmw6ICcvZG9jcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZG9jcy9kb2NzLmh0bWwnXG4gICAgfSk7XG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ2hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdG1vc3RSZWNlbnRTb2NrczogZnVuY3Rpb24gKFNvY2tGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU29ja0ZhY3RvcnkubW9zdFJlY2VudFNvY2tzKClcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignaG9tZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBtb3N0UmVjZW50U29ja3MsICRzdGF0ZSwgJHN0YXRlUGFyYW1zKSB7XG5cbiAgJHNjb3BlLm1vc3RSZWNlbnRTb2NrcyA9IG1vc3RSZWNlbnRTb2Nrc1xuICAkc2NvcGUuc2VlU29jayA9IGZ1bmN0aW9uIChpZCkge1xuICAgICRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcbiAgfVxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcbiAgICAgICAgICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTtcblxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICB2YXIgZ2V0U3Rhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcbiAgICB9O1xuXG59KTsiLCJhcHAuY29udHJvbGxlcignY2FydEN1cnJlbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGN1cnJlbnRDYXJ0KSB7XG5cbiAgJHNjb3BlLmN1cnJlbnRDYXJ0ID0gY3VycmVudENhcnRcblxuICAkc2NvcGUudXBkYXRlID0gZnVuY3Rpb24oaXRlbSkge1xuICAgIHZhciBzb2NrID0ge1xuICAgICAgcXVhbnRpdHk6IGl0ZW0ubmV3QW1vdW50LFxuICAgICAgaWQ6IGl0ZW0uaWRcbiAgICB9XG4gICAgcmV0dXJuIE9yZGVyRmFjdG9yeS51cGRhdGVJdGVtKHNvY2spXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKXtcbiAgICAgIGNvbnNvbGUubG9nKFwiaGVyZXJlXCIsIHJlcylcbiAgICAgIGl0ZW0ucXVhbnRpdHkgPSBpdGVtLm5ld0Ftb3VudDtcbiAgICAgIGl0ZW0ubmV3QW1vdW50ID0gbnVsbDtcbiAgICB9KVxuICB9XG5cbiAgJHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcblxuICAgIHJldHVybiBPcmRlckZhY3RvcnkuZGVsZXRlSXRlbShpdGVtLmlkKVxuICAgIC50aGVuKGZ1bmN0aW9uKGl0ZW1fZGVsZXRlZCkge1xuICAgICAgY29uc29sZS5sb2coaXRlbV9kZWxldGVkKVxuICAgIH0pXG4gIH1cblxufSlcblxuXG5hcHAuY29udHJvbGxlcignY2FydEhpc3RvcnknLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGNhcnRIaXN0b3J5KSB7XG5cbiAgJHNjb3BlLmNhcnRIaXN0b3J5ID0gY2FydEhpc3RvcnlcblxufSlcbiIsImFwcC5mYWN0b3J5KCdPcmRlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuICByZXR1cm4ge1xuICAgIGFkZFRvQ2FydDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9vcmRlci8nLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG4gICAgc2hvd0NhcnQ6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvJyt0eXBlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVyLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcbiAgICB1cGRhdGVJdGVtOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIGNvbnNvbGUubG9nKG9iailcbiAgICAgIHJldHVybiAkaHR0cC5wdXQoJy9hcGkvb3JkZXInLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcbiAgICBkZWxldGVJdGVtOiBmdW5jdGlvbihpdGVtSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5kZWxldGUoJy9hcGkvb3JkZXIvJytpdGVtSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtLmRhdGFcbiAgICAgIH0pXG4gICAgfVxuICB9XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2N1cnJlbnRDYXJ0Jywge1xuICAgIHVybDogJy9jYXJ0L2N1cnJlbnQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL29yZGVyL2NhcnQuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ2NhcnRDdXJyZW50Jyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRjdXJyZW50Q2FydDogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuXHRcdFx0XHRyZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdjdXJyZW50Jylcblx0XHRcdH1cblx0XHR9XG4gIH0pXG5cbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnRIaXN0b3J5Jywge1xuICAgIHVybDogJy9jYXJ0L2hpc3RvcnknLFxuICAgIHRlbXBsYXRlVXJsOiAnL2pzL29yZGVyL2hpc3RvcnkuaHRtbCcsXG4gICAgY29udHJvbGxlcjogJ2NhcnRIaXN0b3J5JyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBjYXJ0SGlzdG9yeTogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdoaXN0b3J5Jyk7XG4gICAgICB9XG4gICAgfVxuICB9KVxuXG59KVxuIiwiYXBwLmZhY3RvcnkoJ1NvY2tGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBzaW5nbGVTb2NrOiBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay8nK3NvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIHNvY2tCeVVzZXJJZDogZnVuY3Rpb24odXNlcklkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svYnlVc2VyLycgKyB1c2VySWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2ZldGNoZWQnLCByZXMuZGF0YSlcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBtb3N0UmVjZW50U29ja3M6IGZ1bmN0aW9uICgpIHtcbiAgICBcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay9yZWNlbnQnKVxuICAgIFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgXHRcdHJldHVybiByZXMuZGF0YVxuICAgIFx0fSlcbiAgICB9LFxuXG4gICAgc2F2ZURlc2lnbjogZnVuY3Rpb24gKG5ld1NvY2tEYXRhT2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9zb2NrLycsIG5ld1NvY2tEYXRhT2JqKVxuICAgIH0sXG5cbiAgICBwcmVwYXJlVGFnczogZnVuY3Rpb24gKHRhZ0lucHV0KSB7XG4gICAgICByZXR1cm4gdGFnSW5wdXQuc3BsaXQoJyAnKS5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICBlID0gZS5yZXBsYWNlKC8sL2ksIFwiXCIpO1xuICAgICAgICBlID0gZS5zdWJzdHJpbmcoMSk7XG4gICAgICAgIHJldHVybiBlXG4gICAgICB9KTtcbiAgICB9XG5cbiAgfVxuXG59KVxuIiwiLy8gYXBwLmNvbnRyb2xsZXIoJ3NvY2tWaWV3Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFNvY2tGYWN0b3J5LCBSZXZpZXdGYWN0b3J5KSB7XG5cbi8vICAgJHNjb3BlLnNldFNvY2sgPSBmdW5jdGlvbihzb2NrSWQpIHtcbi8vICAgICByZXR1cm4gU29ja0ZhY3Rvcnkuc2luZ2xlU29jayhzb2NrSWQpIC8vIHJldHVybj9cbi8vICAgICAudGhlbihmdW5jdGlvbihzb2NrKSB7XG4vLyAgICAgICAkc2NvcGUuc29jayA9IHNvY2tcbi8vICAgICB9KVxuLy8gICB9XG5cbi8vICAgJHNjb3BlLnNldFJldmlld3MgPSBmdW5jdGlvbihzb2NrSWQpIHtcbi8vICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wcm9kdWN0UmV2aWV3cyhzb2NrSWQpXG4vLyAgICAgLnRoZW4oZnVuY3Rpb24ocmV2aWV3cykge1xuLy8gICAgICAgJHNjb3BlLnJldmlld3MgPSByZXZpZXdzXG4vLyAgICAgfSlcbi8vICAgfVxuXG4vLyAgICRzY29wZS5zZXRTb2NrKDEpO1xuLy8gICAkc2NvcGUuc2V0UmV2aWV3cygxKTtcblxuLy8gICAkc2NvcGUubmV3UmV2aWV3ID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgdmFyIG5ld1JldmlldyA9IHtcbi8vICAgICAgIHRleHQ6ICRzY29wZS5yZXZpZXdUZXh0LFxuLy8gICAgICAgc29ja0lkOiAkc2NvcGUuc29jay5pZFxuLy8gICAgIH1cbi8vICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wb3N0UmV2aWV3KG5ld1Jldmlldylcbi8vICAgICAudGhlbihmdW5jdGlvbihuZXdSZXZpZXcpe1xuLy8gICAgICAgdmFyIHJldmlldyA9IHt9O1xuLy8gICAgICAgcmV2aWV3LnVzZXIgPSB7fTtcblxuLy8gICAgICAgICByZXZpZXcudXNlci5maXJzdF9uYW1lID0gbmV3UmV2aWV3LnVzZXIuZmlyc3RfbmFtZTtcbi8vICAgICAgICAgcmV2aWV3LnVzZXIubGFzdF9uYW1lID0gbmV3UmV2aWV3LnVzZXIubGFzdF9uYW1lO1xuLy8gICAgICAgICByZXZpZXcudXNlci5wcm9maWxlX3BpYyA9IG5ld1Jldmlldy51c2VyLnByb2ZpbGVfcGljO1xuLy8gICAgICAgICByZXZpZXcudXNlci51c2VybmFtZSA9IG5ld1Jldmlldy51c2VyLnVzZXJuYW1lO1xuLy8gICAgICAgICByZXZpZXcudGV4dCA9IG5ld1Jldmlldy5yZXZpZXcudGV4dDtcblxuLy8gICAgICAgJHNjb3BlLnJldmlld3MucHVzaChyZXZpZXcpO1xuLy8gICAgICAgJHNjb3BlLnJldmlld1RleHQgPSBudWxsO1xuLy8gICAgIH0pXG4vLyAgIH1cblxuLy8gICAkc2NvcGUuYWxyZWFkeVBvc3RlZCA9IGZ1bmN0aW9uKCkge1xuLy8gICAgIC8vIGFkZCBpbiBhZnRlciBmaW5pc2hpbmcgb3RoZXIgc3R1ZmZcbi8vICAgfVxuXG4vLyB9KTtcblxuYXBwLmNvbnRyb2xsZXIoJ3NvY2tJZENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsICRzdGF0ZVBhcmFtcywgdGhlU29jaywgdGhlUmV2aWV3cywgUmV2aWV3RmFjdG9yeSwgT3JkZXJGYWN0b3J5LCBBdXRoU2VydmljZSkge1xuXG4gICRzY29wZS5kYXRlUGFyc2VyID0gZnVuY3Rpb24oZGF0ZSl7XG5cbiAgICAvL3JldHVybiB0byB0aGlzIGxhdGVyLiBXb3VsZCBiZSBnb29kIGlmIHNvY2tzIGFuZCByZXZpZXdzIHN0YXRlZCB3aGVuIHRoZXkgd2VyZSBwb3N0ZWRcblxuICAgIC8vc2hvdWxkIGFkZCBpdCB0byBhIGZhY3RvcnksIGJlY2F1c2UgbWFueSBwYWdlcyBjYW4gbWFrZSB1c2Ugb2YgaXRcblxuICAgIHZhciBtb250aE9iaiA9IHtcbiAgICAgICcwMSc6IFwiSmFudWFyeVwiLFxuICAgICAgJzAyJzogXCJGZWJydWFyeVwiLFxuICAgICAgJzAzJzogXCJNYXJjaFwiLFxuICAgICAgJzA0JzogXCJBcHJpbFwiLFxuICAgICAgJzA1JzogXCJNYXlcIixcbiAgICAgICcwNic6IFwiSnVuZVwiLFxuICAgICAgJzA3JzogXCJKdWx5XCIsXG4gICAgICAnMDgnOiBcIkF1Z3VzdFwiLFxuICAgICAgJzA5JzogXCJTZXB0ZW1iZXJcIixcbiAgICAgICcxMCc6IFwiT2N0b2JlclwiLFxuICAgICAgJzExJzogXCJOb3ZlbWJlclwiLFxuICAgICAgJzEyJzogXCJEZWNlbWJlclwiXG4gICAgfVxuXG4gICAgcmV0dXJuIG1vbnRoT2JqW2RhdGUuc2xpY2UoNSw3KV0gKyAnICcgKyBkYXRlLnNsaWNlKDgsMTApICsgJywgJyArIGRhdGUuc2xpY2UoMCwgNCk7XG5cbiAgfVxuXG5cbiAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSBmYWxzZTtcbiAgJHNjb3BlLnNvY2sgPSB0aGVTb2NrO1xuICAkc2NvcGUucmV2aWV3cyA9IHRoZVJldmlld3M7XG4gIGNvbnNvbGUubG9nKCRzY29wZS5zb2NrKTtcblxuICAkc2NvcGUuYWxlcnQgPSBmdW5jdGlvbigpIHtcbiAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nXG4gIH1cblxuICAkc2NvcGUuZ29Ub1VzZXJQYWdlID0gZnVuY3Rpb24odXNlcklkKSB7XG4gICAgJHN0YXRlLmdvKCd1c2VyJywge3VzZXJJZDogdXNlcklkfSk7XG4gIH1cblxuICAkc2NvcGUuYWRkSXRlbSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtID0ge31cbiAgICBpdGVtLnNvY2tJZCA9ICRzY29wZS5zb2NrLmlkXG4gICAgaXRlbS5xdWFudGl0eSA9ICskc2NvcGUucXVhbnRpdHlcbiAgICBjb25zb2xlLmxvZyhpdGVtKVxuICAgIGlmIChpdGVtLnF1YW50aXR5ID4gMCkgcmV0dXJuIE9yZGVyRmFjdG9yeS5hZGRUb0NhcnQoaXRlbSlcbiAgICAvL2Vsc2UgJHNjb3BlLmFsZXJ0KClcbiAgfVxuXG4gICRzY29wZS5kaXNwbGF5VGFncyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkc2NvcGUuc29jay50YWdzLm1hcChmdW5jdGlvbih0YWcpe1xuICAgICAgcmV0dXJuICcjJyArIHRhZztcbiAgICB9KS5qb2luKFwiLCBcIik7XG4gIH1cblxuICAkc2NvcGUuZGlzcGxheVRhZ3MoKTtcblxuICAkc2NvcGUuZ2V0TG9nZ2VkSW5Vc2VySWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcbiAgICAudGhlbihmdW5jdGlvbih1c2VyKXtcbiAgICAgIGNvbnNvbGUubG9nKHVzZXIpO1xuICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICRzY29wZS5sb2dnZWRJblVzZXJJZCA9ICdub25lJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5sb2dnZWRJblVzZXJJZCA9IHVzZXIuaWQ7XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gICRzY29wZS5nZXRMb2dnZWRJblVzZXJJZCgpO1xuXG4gICRzY29wZS51c2VyQ2Fubm90UG9zdFJldmlldyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJHNjb3BlLnJldmlld05vdEFsbG93ZWQ7XG4gIH1cblxuICAkc2NvcGUudXNlckNhbm5vdFBvc3RSZXZpZXcoKTtcblxuICAkc2NvcGUubmV3UmV2aWV3ID0gZnVuY3Rpb24oKSB7XG4gIFxuICAvL2lmIHVzZXIgaGFzIGFscmVhZHkgcmV2aWV3IHNvY2ssIGRvbid0IGFsbG93IHVzZXIgdG8gcmV2aWV3IGl0IGFnYWluXG4gICAgdmFyIHVzZXJzV2hvUmV2aWV3ZWRTb2NrID0gJHNjb3BlLnJldmlld3MubWFwKGZ1bmN0aW9uKHJldmlldyl7XG4gICAgICByZXR1cm4gcmV2aWV3LnVzZXJJZDtcbiAgICB9KVxuXG4gICAgaWYgKCRzY29wZS5sb2dnZWRJblVzZXJJZCA9PT0gJ25vbmUnKSB7XG4gICAgICAkc2NvcGUucmV2aWV3RXJyb3JNZXNzYWdlID0gXCJZb3UgbXVzdCBiZSBsb2dnZWQgaW4gdG8gcmV2aWV3IGEgc29jayFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHVzZXJzV2hvUmV2aWV3ZWRTb2NrLmluZGV4T2YoJHNjb3BlLmxvZ2dlZEluVXNlcklkKSAhPT0gLTEpIHtcbiAgICAgICRzY29wZS5yZXZpZXdFcnJvck1lc3NhZ2UgPSBcIllvdSd2ZSBhbHJlYWR5IHJldmlld2VkIHRoaXMgc29jayEgWW91IGNhbid0IHJldmlldyBpdCBhZ2FpbiFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgLy9pZiBzb2NrIGlkIG1hdGNoZXMgdXNlciBpZCwgdXNlciBkb24ndCBhbGxvdyB1c2VyIHRvIHBvc3QgYSByZXZpZXdcbiAgICB9IGVsc2UgaWYgKCRzY29wZS5sb2dnZWRJblVzZXJJZCA9PT0gJHNjb3BlLnNvY2sudXNlci5pZCkge1xuICAgICAgJHNjb3BlLnJldmlld0Vycm9yTWVzc2FnZSA9IFwiWW91IGNhbid0IHJldmlldyB5b3VyIG93biBzb2NrIVwiO1xuICAgICAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIHZhciBuZXdSZXZpZXcgPSB7XG4gICAgICAgIHRleHQ6ICRzY29wZS5yZXZpZXdUZXh0LFxuICAgICAgICBzb2NrSWQ6ICRzY29wZS5zb2NrLmlkXG4gICAgICB9XG4gICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wb3N0UmV2aWV3KG5ld1JldmlldylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG5ld1Jldmlldyl7XG4gICAgICAgIHZhciByZXZpZXcgPSB7fTtcbiAgICAgICAgcmV2aWV3LnVzZXIgPSB7fTtcblxuICAgICAgICAgIHJldmlldy51c2VyLmZpcnN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5maXJzdF9uYW1lO1xuICAgICAgICAgIHJldmlldy51c2VyLmxhc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmxhc3RfbmFtZTtcbiAgICAgICAgICByZXZpZXcudXNlci5wcm9maWxlX3BpYyA9IG5ld1Jldmlldy51c2VyLnByb2ZpbGVfcGljO1xuICAgICAgICAgIHJldmlldy51c2VyLnVzZXJuYW1lID0gbmV3UmV2aWV3LnVzZXIudXNlcm5hbWU7XG4gICAgICAgICAgcmV2aWV3LnRleHQgPSBuZXdSZXZpZXcucmV2aWV3LnRleHQ7XG5cbiAgICAgICAgJHNjb3BlLnJldmlld3MucHVzaChyZXZpZXcpO1xuICAgICAgICAkc2NvcGUucmV2aWV3VGV4dCA9IG51bGw7XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG59KTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgIC8vIFJlZ2lzdGVyIG91ciAqYWJvdXQqIHN0YXRlLlxuICAgIC8vICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzb2NrcycsIHtcbiAgICAvLyAgICAgdXJsOiAnL3NvY2tzJyxcbiAgICAvLyAgICAgY29udHJvbGxlcjogJ3NvY2tWaWV3Q29udHJvbGxlcicsXG4gICAgLy8gICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuaHRtbCdcbiAgICAvLyB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVTb2NrVmlldycsIHtcbiAgICAgIHVybDonL3NvY2tzLzppZCcsXG4gICAgICBjb250cm9sbGVyOiAnc29ja0lkQ29udHJvbGxlcicsXG4gICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3Lmh0bWwnLFxuICAgICAgcmVzb2x2ZToge1xuICAgICAgICB0aGVTb2NrOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBTb2NrRmFjdG9yeSkge1xuICAgICAgICAgIHJldHVybiBTb2NrRmFjdG9yeS5zaW5nbGVTb2NrKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgfSxcbiAgICAgICAgdGhlUmV2aWV3czogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgUmV2aWV3RmFjdG9yeSkge1xuICAgICAgICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LnByb2R1Y3RSZXZpZXdzKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG5cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1Jldmlld0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICByZXR1cm4ge1xuICAgIHBvc3RSZXZpZXc6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvcmV2aWV3LycsIG9iailcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcbiAgICBwcm9kdWN0UmV2aWV3czogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Jldmlldy9zb2NrLycrc29ja0lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZWFyY2hSZXN1bHRzJywge1xuXHRcdHVybDogJy9zZWFyY2gvOnNlYXJjaFRlcm1zJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9zZWFyY2hyZXN1bHRzL3NlYXJjaC52aWV3Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6IFwic2VhcmNoQ3RybFwiLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGFsbFJlc3VsdHM6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFNlYXJjaEZhY3RvcnkpIHtcblx0XHRcdFx0cmV0dXJuIFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dCgkc3RhdGVQYXJhbXMuc2VhcmNoVGVybXMpXG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvLyBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBhbGxSZXN1bHRzKSB7XG5cdFx0Ly8gXHQkc2NvcGUucmVzdWx0cyA9IGFsbFJlc3VsdHM7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhcIkFsbCBSZXN1bHRzISFcIiwgYWxsUmVzdWx0cyk7XG5cdFx0Ly8gXHQkc2NvcGUubnVtYmVyID0gMTIzO1xuXHRcdC8vIH1cblx0XHQvLyBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMpIHtcblx0XHQvLyBcdGNvbnNvbGUubG9nKFwiSEVSRUVFRUVcIiwgJHN0YXRlUGFyYW1zLnJlc3VsdHMpXG5cdFx0Ly8gXHQkc2NvcGUucmVzdWx0cyA9ICRzdGF0ZVBhcmFtcy5yZXN1bHRzXG5cdFx0Ly8gfVxuXHR9KVxufSlcbiIsImFwcC5jb250cm9sbGVyKCdTaWdudXBDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgU2lnbnVwRmFjdG9yeSwgJHN0YXRlKSB7XG5cbiAgZnVuY3Rpb24gcGFzc3dvcmRWYWxpZCAocGFzc3dvcmQpIHtcbiAgICBpZiAocGFzc3dvcmQubGVuZ3RoIDwgNikge1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJQYXNzd29yZCBtdXN0IGJlIDYgY2hhcmFjdGVycyBsb25nIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAocGFzc3dvcmQgIT09ICRzY29wZS5wdzIpIHtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiVGhlIHBhc3N3b3JkIGZpZWxkcyBkb24ndCBtYXRjaCFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKC9cXFcvLnRlc3QocGFzc3dvcmQpKXtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiUGFzc3dvcmQgY2Fubm90IGNvbnRhaW4gc3BlY2lhbCBjaGFyYWN0ZXJzIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAkc2NvcGUuc2hvd0Vycm9yID0gZmFsc2U7XG5cbiAgJHNjb3BlLmRpc3BsYXlFcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkc2NvcGUuc2hvd0Vycm9yO1xuICB9XG5cbiAgJHNjb3BlLnN1Ym1pdFNpZ251cCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAocGFzc3dvcmRWYWxpZCgkc2NvcGUucGFzc3dvcmQpKXtcbiAgICAgIGNvbnNvbGUubG9nKFwibm93IEkgZG9uJ3Qgd29yayFcIik7XG4gICAgICByZXR1cm4gU2lnbnVwRmFjdG9yeS5zdWJtaXQoe1xuICAgICAgIGVtYWlsOiAkc2NvcGUuZW1haWwsXG4gICAgICAgdXNlcm5hbWU6ICRzY29wZS51c2VybmFtZSxcbiAgICAgICBwYXNzd29yZDogJHNjb3BlLnBhc3N3b3JkLFxuICAgICAgIGZpcnN0X25hbWU6ICRzY29wZS5maXJzdG5hbWUsXG4gICAgICAgbGFzdF9uYW1lOiAkc2NvcGUubGFzdG5hbWUsXG4gICAgICAgaXNBZG1pbjogZmFsc2UsXG4gICAgICAgbmV3VXNlcjogdHJ1ZVxuICAgICB9KS50aGVuKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlcyk7XG4gICAgICAgIHJldHVybiAkc3RhdGUuZ28oJ3BlcnNvbmFsJyk7XG4gICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbn0pOyIsIi8vIGFwcC5mYWN0b3J5KCdTaWdudXBGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbi8vICAgdmFyIFNpZ251cEZhY3RvcnkgPSB7fTtcblxuLy8gICBTaWdudXBGYWN0b3J5LnN1Ym1pdCA9IGZ1bmN0aW9uKHVzZXJJbmZvKXtcbi8vICAgXHRjb25zb2xlLmxvZyh1c2VySW5mbyk7XG4vLyAgIFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci8nLCB1c2VySW5mbylcbi8vICAgXHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4vLyAgIFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcbi8vICAgXHR9KVxuLy8gICB9XG5cbi8vICAgcmV0dXJuIFNpZ251cEZhY3Rvcnk7XG5cbi8vIH0pXG5cbmFwcC5mYWN0b3J5KCdTaWdudXBGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBTaWdudXBGYWN0b3J5ID0ge307XG5cblx0U2lnbnVwRmFjdG9yeS5zdWJtaXQgPSBmdW5jdGlvbiAodXNlckluZm8pIHtcblx0XHRjb25zb2xlLmxvZyhcIkZyb20gU2lnbnVwIEZhY3RvcnlcIiwgdXNlckluZm8pO1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvJywgdXNlckluZm8pXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0fSlcblx0fVxuXHRyZXR1cm4gU2lnbnVwRmFjdG9yeTtcbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnbnVwJywge1xuXHRcdHVybDogJy9zaWdudXAnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDdHJsJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9zaWdudXAvc2lnbnVwLnZpZXcuaHRtbCdcblx0fSk7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3BlcnNvbmFsJywge1xuXHRcdHVybDogJy9wZXJzb25hbCcsXG5cdFx0Y29udHJvbGxlcjogJ1NpZ251cEN0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3NpZ251cC9wZXJzb25hbGluZm8udmlldy5odG1sJ1xuXHR9KTtcbn0pOyIsImFwcC5jb250cm9sbGVyKCdVc2VyQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgdGhlVXNlciwgdGhlVXNlclNvY2tzKSB7XG4gICAgY29uc29sZS5sb2coXCJjb250cm9sbGVyXCIsIHRoZVVzZXJTb2Nrcyk7XG5cdCRzY29wZS51c2VyID0gdGhlVXNlcjtcblx0JHNjb3BlLnNvY2tzID0gdGhlVXNlclNvY2tzO1xuXHQkc2NvcGUudG9Tb2NrVmlldyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdCRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcblx0fVxufSlcbiIsImFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXHR2YXIgVXNlckZhY3RvcnkgPSB7fTtcblxuXHRVc2VyRmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3VzZXIvJyArIGlkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJmYWN0b3J5XCIsIHJlc3BvbnNlLmRhdGEpXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YVxuXHRcdH0pXG5cdH1cblxuXHRVc2VyRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3VzZXJzJylcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhXG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiBVc2VyRmFjdG9yeTtcbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgndXNlcicsIHtcblx0XHR1cmw6ICcvdXNlci86dXNlcklkJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy91c2VyL3VzZXItcHJvZmlsZS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnVXNlckN0cmwnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdHRoZVVzZXI6IGZ1bmN0aW9uIChVc2VyRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLnVzZXJJZCk7XG5cdFx0XHR9LFxuXHRcdFx0dGhlVXNlclNvY2tzOiBmdW5jdGlvbiAoU29ja0ZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuXHRcdFx0XHRyZXR1cm4gU29ja0ZhY3Rvcnkuc29ja0J5VXNlcklkKCRzdGF0ZVBhcmFtcy51c2VySWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSlcbn0pXG4iLCJhcHAuY29udHJvbGxlcignbmF2YmFyQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgU2VhcmNoRmFjdG9yeSkge1xuXG5cdCRzY29wZS5zZWFyY2ggPSBmdW5jdGlvbihzZWFyY2hUZXJtcyl7XG5cdFx0Ly8gU2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0KHNlYXJjaFRlcm1zKVxuXHRcdC8vIC50aGVuKGZ1bmN0aW9uKHJlc3VsdHMpe1xuXHRcdC8vIFx0JHNjb3BlLnJlc3VsdHMgPSByZXN1bHRzO1xuXHRcdC8vIFx0Y29uc29sZS5sb2cocmVzdWx0cyk7XG5cdFx0XHRyZXR1cm4gJHN0YXRlLmdvKCdzZWFyY2hSZXN1bHRzJywge3NlYXJjaFRlcm1zOiBzZWFyY2hUZXJtc30pO1xuXHRcdC8vIH0pXG5cdH1cbn0pXG5cbmFwcC5jb250cm9sbGVyKCdzZWFyY2hDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBhbGxSZXN1bHRzLCAkc3RhdGVQYXJhbXMpIHtcblx0JHNjb3BlLnJlc3VsdHMgPSBhbGxSZXN1bHRzO1xuXHQkc2NvcGUuc2VlU29jayA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdCRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcblx0fVxufSkiLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZmFjdG9yeShcIlNlYXJjaEZhY3RvcnlcIiwgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBTZWFyY2hGYWN0b3J5ID0ge307XG5cblx0U2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0ID0gZnVuY3Rpb24gKHRleHQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NlYXJjaC8/cT0nICsgdGV4dClcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHRzKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0cy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gU2VhcmNoRmFjdG9yeTtcbn0pIiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdBYm91dCcsIHN0YXRlOiAnYWJvdXQnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0Rlc2lnbicsIHN0YXRlOiAnZGVzaWduVmlldycgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTXkgUHJvZmlsZScsIHN0YXRlOiAndXNlcih7dXNlcklkOnVzZXIuaWR9KScsIGF1dGg6IHRydWUgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTWVtYmVycyBPbmx5Jywgc3RhdGU6ICdtZW1iZXJzT25seScsIGF1dGg6IHRydWUgfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdvYXV0aEJ1dHRvbicsIGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICBzY29wZToge1xuICAgICAgcHJvdmlkZXJOYW1lOiAnQCdcbiAgICB9LFxuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmh0bWwnXG4gIH1cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
