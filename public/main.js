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

<<<<<<< HEAD
app.controller('checkoutController', function ($scope, OrderFactory, currentCart) {
  $scope.currentCart = currentCart;

  $scope.calcTotal = function () {
    return OrderFactory.calculateTotal('current').then(function (cartTotal) {
      $scope.total = cartTotal;
    });
  };

  $scope.calcTotal();
});

app.config(function ($stateProvider) {
  $stateProvider.state('checkout', {
    url: '/cart/checkout',
    templateUrl: '/js/checkout/checkout.html',
    controller: 'checkoutController',
    resolve: {
      currentCart: function currentCart(OrderFactory) {
        return OrderFactory.showCart('current');
      }
    }
  });
});
=======
app.controller('checkout', function ($scope, OrderFactory, currentCart) {});
>>>>>>> master

app.directive('designView', function (SockFactory, $state) {
  return {
    restrict: 'E',
    templateUrl: 'js/design/design-view.html',
    // scope: {
    // 	theSock: '='
    // },
    link: function link(scope, element, attrs, designViewCtrl) {

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
          if (result) $state.go('user', { userId: result.data.userId });
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

app.controller('designViewCtrl', function ($scope, $http) {

  $http.post('/api/user/matchId').then(function (res) {
    return $scope.showView = res;
  });

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

app.config(function ($stateProvider) {

  $stateProvider.state('admin', {
    url: '/admin',
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
app.controller('cartCurrent', function ($scope, OrderFactory, currentCart) {
  $scope.current = currentCart;
});

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
        return OrderFactory.updateItem(sock).then(function () {
          item.quantity = item.newAmount;
          item.newAmount = null;
        }).then(function () {
          scope.calcTotal();
        });
      };

      scope.delete = function (item) {
        var todelete = { item: item };
        OrderFactory.deleteItem(todelete.item.id).then(function () {
          return scope.calcTotal();
        }).then(function (newTotal) {
          scope.total = newTotal;
        });
      };

      scope.singleSockView = function (id) {
        $state.go('singleSockView', { id: id });
      };
      scope.toCheckout = function () {
        $state.go('checkout');
      };

      scope.calcTotal = function () {
        return OrderFactory.calculateTotal('current').then(function (cartTotal) {
          scope.total = cartTotal;
          return cartTotal;
        });
      };

      scope.calcTotal();

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

      scope.calcTotal = function () {
        return OrderFactory.calculateTotal('history').then(function (cartTotal) {
          scope.totalSpent = cartTotal;
        });
      };

      scope.calcTotal().then(function () {
        console.log(scope.totalSpent);
      });

      return OrderFactory.showCart('history').then(function (history) {
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
    calculateTotal: function calculateTotal(type) {
      return $http.get('/api/order/' + type).then(function (order) {
        cachedCart = order.data;
        return cachedCart || [];
      }).then(function (cart) {
        if (type === 'current') {
          return cart.reduce(function (o, item) {
            return o + item.sock.price * item.quantity;
          }, 0);
        } else {
          return cart.reduce(function (o, order) {
            return o + order.items.reduce(function (o, item) {
              return o + item.sock.price * item.quantity;
            }, 0);
          }, 0);
        }
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
    },
    ensureCart: function ensureCart() {
      return $http.get('/api/order/createcart').then(function (order) {
        return { exists: order.data };
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
    templateUrl: '/js/order/past.html',
    controller: 'cartHistory',
    resolve: {
      cartHistory: function cartHistory(OrderFactory) {
        return OrderFactory.showCart('history');
      }
    }
  });
});

app.controller('PersonalInfoCtrl', function ($scope, $state, AuthService, theUser, PersonalInfoFactory) {

  $scope.userId = theUser.id;
  $scope.address1 = theUser.address1;
  $scope.address2 = theUser.address2;
  $scope.zip = theUser.zip;
  $scope.state = theUser.state;
  $scope.country = theUser.country;
  $scope.phone = theUser.phone;
  $scope.displayError = false;

  //only a temporary solution -- checks to see if user is a new user by seeing if they're logged in

  // $scope.currentUserIsNew = function() {
  //   		 return AuthService.getLoggedInUser()
  //   		.then(function(user){
  //    		if (!user) return $scope.newUser = true;
  //  			else return $scope.newUser = false;
  //    	})
  // 	}

  // 	$scope.currentUserIsNew();

  console.log("heeeeeeeey");

  $scope.submitPersonal = function (id) {
    if (($scope.country === "United States" || $scope.country === "Canada") && $scope.state === "") {
      $scope.displayError = true;
      return $scope.errorMessage = "If in US or Canada, must include State/Province";
    }

    var userInfo = {
      address1: $scope.address1,
      address2: $scope.address2,
      zip: $scope.zip,
      state: $scope.state,
      country: $scope.country,
      phone: $scope.phone
    };

    return PersonalInfoFactory.submit($scope.userId, userInfo).then(function (response) {
      // if ($scope.newUser)
      return $state.go('home');
      // else return $state.go('user', {userId: $scope.userId});
    });
  };
});
app.factory('PersonalInfoFactory', function ($http) {

  // PersonalFactory = {};

  return {
    submit: function submit(id, userInfo) {
      return $http.put('/api/user/' + id, userInfo).then(function (response) {
        return response.data;
      });
    }
  };
});

app.config(function ($stateProvider) {

  $stateProvider.state('personal', {
    url: '/personal/:id',
    controller: 'PersonalInfoCtrl',
    templateUrl: '/js/personalinfo/personalinfo.view.html',
    resolve: {
      theUser: function theUser($stateParams, UserFactory) {
        return UserFactory.fetchById($stateParams.id);
      }
    }
  });
});
app.factory('SockFactory', function ($http, $state) {

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
    },

    upvote: function upvote(sockId) {
      return $http.post('/api/sock/upvote', { id: sockId }).then(function (res) {
        console.log(res.data);
        return res.data;
      });
    },

    downvote: function downvote(sockId) {
      return $http.post('/api/sock/downvote', { id: sockId }).then(function (res) {
        return res.data;
      });
    },

    delete: function _delete(id) {
      return $http.post('/api/sock/delete/' + id).then($state.go('home'));
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

// app.controller('sockIdController', function ($scope, $state, $stateParams, theSock, theReviews, ReviewFactory, OrderFactory, AuthService) {

//   // $scope.dateParser = function(date){

//   //   //return to this later. Would be good if socks and reviews stated when they were posted

//   //should add it to a factory, because many pages can make use of it

//   var monthObj = {
//     '01': "January",
//     '02': "February",
//     '03': "March",
//     '04': "April",
//     '05': "May",
//     '06': "June",
//     '07': "July",
//     '08': "August",
//     '09': "September",
//     '10': "October",
//     '11': "November",
//     '12': "December"
//   }

// }

app.controller('sockIdController', function ($scope, $state, AuthService, $stateParams, theSock, theReviews, ReviewFactory, OrderFactory, SockFactory, UserFactory) {

  $scope.reviewNotAllowed = false;
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

  $scope.goToUserPage = function (userId) {
    $state.go('user', { userId: userId });
  };

  $scope.addItem = function () {
    var item = {};
    item.sockId = $scope.sock.id;
    item.quantity = +$scope.quantity;
    item.originalPrice = +$scope.sock.price;
    if (item.quantity > 0) {
      OrderFactory.addToCart(item).then(function (response) {
        if ((typeof response === 'undefined' ? 'undefined' : _typeof(response)) !== "object") $scope.alert(response);else $state.go('currentCart');
      });
    } else $scope.alert('You have to add at least one sock!');
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

  $scope.upvote = function (sockId) {
    return SockFactory.upvote(sockId).then(function (res) {
      $scope.sock.upvotes++;
    });
  };

  $scope.downvote = function (sockId) {
    return SockFactory.downvote(sockId).then(function (res) {
      $scope.sock.downvotes++;
    });
  };

  AuthService.getLoggedInUser().then(function (user) {
    return user.id == $scope.sock.UserId || user.isAdmin ? true : false;
  }).then(function (result) {
    console.log(result);
    $scope.verifyUser = result;
  });

  $scope.delete = SockFactory.delete;
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
      }).then(function (response) {
        // response.newUser = true;
        return $state.go('personal', { id: response.id });
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
});
app.controller('UserCtrl', function ($scope, $state, theUser, theUserSocks, AuthService, UserFactory) {
  console.log("controller", theUserSocks);
  $scope.user = theUser;
  $scope.socks = theUserSocks;

  $scope.toShippingInfo = function (id) {
    $state.go('personal', { id: id });
  };

  $scope.toSockView = function (id) {
    $state.go('singleSockView', { id: id });
  };

  AuthService.getLoggedInUser().then(function (user) {
    return user.id == $scope.user.id || user.isAdmin ? true : false;
  }).then(function (result) {
    console.log(result);
    $scope.verifyUser = result;
  });

  $scope.delete = UserFactory.delete;
});

app.factory('UserFactory', function ($http, $state) {
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

  UserFactory.delete = function (id) {
    return $http.post('/api/user/delete/' + id).then($state.go('home'));
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
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state, OrderFactory) {

  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'js/common/directives/navbar/navbar.html',
    link: function link(scope) {

      OrderFactory.ensureCart();

      scope.items = [{ label: 'Home', state: 'home' }, { label: 'My Profile', state: 'user({userId:user.id})', auth: true },
      // { label: 'About', state: 'about' },
      { label: 'Design a Sock', state: 'designView' }];

      // { label: 'Admin Dashboard', state: 'admin'}
      scope.adminItems = [{ label: 'Admin Dashboard', state: 'admin' }];

      scope.user = null;

      scope.isLoggedIn = function () {
        return AuthService.isAuthenticated();
      };

      scope.logout = function () {
        return AuthService.logout().then(function () {
          $state.go('home');
        });
      };

      var setUser = function setUser() {
        return AuthService.getLoggedInUser().then(function (user) {
          scope.user = user;
        });
      };

      setUser();

      var removeUser = function removeUser() {
        scope.user = null;
      };

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
<<<<<<< HEAD
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuY29udHJvbGxlci5qcyIsImNoZWNrb3V0L2NoZWNrb3V0LnN0YXRlLmpzIiwiZGVzaWduL2Rlc2lnbi1kaXJlY3RpdmUuanMiLCJkZXNpZ24vZGVzaWduLmNvbnRyb2xsZXIuanMiLCJkZXNpZ24vZGVzaWduLmRpcmVjdGl2ZS5qcyIsImRlc2lnbi9kZXNpZ24uanMiLCJkZXNpZ24vZGVzaWduLnN0YXRlLmpzIiwiZG9jcy9kb2NzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJvcmRlci9vcmRlci5jb250cm9sbGVyLmpzIiwib3JkZXIvb3JkZXIuZGlyZWN0aXZlLmpzIiwib3JkZXIvb3JkZXIuZmFjdG9yeS5qcyIsIm9yZGVyL29yZGVyLnN0YXRlLmpzIiwicHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuZmFjdG9yeS5qcyIsInByb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3LmpzIiwicmV2aWV3L3Jldmlldy5mYWN0b3J5LmpzIiwic2VhcmNocmVzdWx0cy9zZWFyY2guc3RhdGUuanMiLCJzaWdudXAvc2lnbnVwLmNvbnRyb2xsZXIuanMiLCJzaWdudXAvc2lnbnVwLmZhY3RvcnkuanMiLCJzaWdudXAvc2lnbnVwLnN0YXRlLmpzIiwidXNlci91c2VyLWNvbnRyb2xsZXIuanMiLCJ1c2VyL3VzZXItZmFjdG9yeS5qcyIsInVzZXIvdXNlci1zdGF0ZXMuanMiLCJjb21tb24vY29udHJvbGxlcnMvbmF2YmFyLmNvbnRyb2xsZXIuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvc2VhcmNoLmZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmRpcmVjdGl2ZS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsWUFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEsb0JBQUEsU0FBQSxDQUFBLElBQUE7O0FBRUEscUJBQUEsU0FBQSxDQUFBLEdBQUE7O0FBRUEscUJBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUEsUUFBQSxDQUFBLE1BQUE7QUFDQSxHQUZBO0FBR0EsQ0FUQTs7O0FBWUEsSUFBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsTUFBQSwrQkFBQSxTQUFBLDRCQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQSxNQUFBLElBQUEsSUFBQSxNQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsR0FGQTs7OztBQU1BLGFBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFFQSxRQUFBLENBQUEsNkJBQUEsT0FBQSxDQUFBLEVBQUE7OztBQUdBO0FBQ0E7O0FBRUEsUUFBQSxZQUFBLGVBQUEsRUFBQSxFQUFBOzs7QUFHQTtBQUNBOzs7QUFHQSxVQUFBLGNBQUE7O0FBRUEsZ0JBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7OztBQUlBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZUFBQSxFQUFBLENBQUEsUUFBQSxJQUFBLEVBQUEsUUFBQTtBQUNBLE9BRkEsTUFFQTtBQUNBLGVBQUEsRUFBQSxDQUFBLE9BQUE7QUFDQTtBQUNBLEtBVEE7QUFXQSxHQTVCQTtBQThCQSxDQXZDQTs7QUNmQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7O0FBR0EsaUJBQUEsS0FBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLFNBQUEsUUFEQTtBQUVBLGdCQUFBLGlCQUZBO0FBR0EsaUJBQUE7QUFIQSxHQUFBO0FBTUEsQ0FUQTs7QUFXQSxJQUFBLFVBQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQTs7O0FBR0EsU0FBQSxNQUFBLEdBQUEsRUFBQSxPQUFBLENBQUEsYUFBQSxDQUFBO0FBRUEsQ0FMQTs7QUNYQSxJQUFBLFVBQUEsQ0FBQSxvQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxTQUFBLFdBQUEsR0FBQSxXQUFBOztBQUVBLFNBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxXQUFBLGFBQUEsY0FBQSxDQUFBLFNBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxTQUFBLEVBQUE7QUFBQSxhQUFBLEtBQUEsR0FBQSxTQUFBO0FBQUEsS0FEQSxDQUFBO0FBRUEsR0FIQTs7QUFLQSxTQUFBLFNBQUE7QUFDQSxDQVRBOztBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLFVBQUEsRUFBQTtBQUNBLFNBQUEsZ0JBREE7QUFFQSxpQkFBQSw0QkFGQTtBQUdBLGdCQUFBLG9CQUhBO0FBSUEsYUFBQTtBQUNBLG1CQUFBLHFCQUFBLFlBQUEsRUFBQTtBQUNBLGVBQUEsYUFBQSxRQUFBLENBQUEsU0FBQSxDQUFBO0FBQ0E7QUFIQTtBQUpBLEdBQUE7QUFVQSxDQVhBOztBQ0FBLElBQUEsU0FBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxTQUFBO0FBQ0EsY0FBQSxHQURBO0FBRUEsaUJBQUEsNEJBRkE7Ozs7QUFNQSxVQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUEsY0FBQSxFQUFBOztBQUVBLFVBQUEsUUFBQSxNQUFBLEtBQUE7QUFDQSxVQUFBLGNBQUEsTUFBQSxXQUFBO0FBQ0EsVUFBQSxPQUFBLE1BQUEsSUFBQTtBQUNBLFVBQUEsU0FBQSxRQUFBLElBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUEsV0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLFlBQUEsVUFBQSxZQUFBLFdBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxnQkFBQSxHQUFBLENBQUEsT0FBQSxFQUFBLE9BQUE7QUFDQSxZQUFBLFVBQUEsT0FBQSxTQUFBLEVBQUE7O0FBRUEsWUFBQSxpQkFBQTtBQUNBLGlCQUFBLEtBREE7QUFFQSx1QkFBQSxXQUZBO0FBR0EsZ0JBQUEsT0FIQTtBQUlBLGlCQUFBO0FBSkEsU0FBQTtBQU1BLGVBQUEsWUFBQSxVQUFBLENBQUEsY0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGlCQUFBLEVBQUEsQ0FBQSxNQUFBLEVBQUEsRUFBQSxRQUFBLE9BQUEsSUFBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFNBSEEsQ0FBQTtBQUlBLE9BZkE7O0FBa0JBLFVBQUEsUUFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLFVBQUEsVUFBQSxFQUFBLFFBQUEsRUFBQSxDQUFBLEVBQUEsVUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUEsVUFBQSxFQUFBLFFBQUEsQ0FBQTtBQUNBLFVBQUEsU0FBQTtBQUNBLFVBQUEsWUFBQSxLQUFBOztBQUVBLFVBQUEsYUFBQSxJQUFBLEtBQUEsRUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQWdCQSxpQkFBQSxHQUFBLEdBQUEsZ0JBQUE7O0FBRUEsaUJBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxTQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsRUFBQSxDQUFBO0FBQ0EsT0FGQTs7O0FBS0EsUUFBQSxXQUFBLEVBQUEsRUFBQSxDQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsWUFBQTs7QUFFQSxVQUFBLElBQUEsRUFBQSxRQUFBLEdBQUEsV0FBQSxDQUFBLFVBQUE7O0FBRUEsVUFBQSxJQUFBLEVBQUEsUUFBQSxDQUFBLFVBQUE7O0FBRUEsZ0JBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7QUFDQSxPQVBBOzs7QUFVQSxRQUFBLG9CQUFBLEVBQUEsS0FBQSxDQUFBLFlBQUE7O0FBRUE7QUFDQSxVQUFBLGNBQUEsRUFBQSxNQUFBO0FBQ0EsT0FKQTs7O0FBT0EsZUFBQSxXQUFBLEdBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxVQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxTQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsR0FBQTs7QUFJQTs7QUFFQSxRQUFBLG1CQUFBLEVBQUEsRUFBQSxDQUFBLE9BQUEsRUFBQSxXQUFBOzs7QUFHQSxRQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTs7QUFFQSxZQUFBLFlBQUEsRUFBQSxXQUFBLENBQUE7QUFDQSxrQkFBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLFVBQUEsY0FBQSxFQUFBLE1BQUEsQ0FBQSxTQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsUUFBQSxHQUFBLFdBQUEsQ0FBQSxVQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxVQUFBO0FBQ0EsZ0JBQUEsRUFBQSxX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QSxRQUFBO0FBQ0EsZUFBQSxZQUFBO0FBQ0EsYUFBQSxRQUFBLEdBQUEsQ0FBQSxPQUFBLFFBQUE7QUFDQSxhQUFBLE9BQUE7QUFDQSxLQUhBLEVBR0EsSUFIQTs7QUFLQSxHQVJBOztBQVVBLFNBQUEsWUFBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsTUFBQSxFQUFBLEVBQUEsUUFBQSxNQUFBLEVBQUE7QUFDQSxHQUZBOztBQUlBLFNBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxRQUFBLE9BQUEsRUFBQTtBQUNBLFNBQUEsTUFBQSxHQUFBLE9BQUEsSUFBQSxDQUFBLEVBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxDQUFBLE9BQUEsUUFBQTtBQUNBLFNBQUEsYUFBQSxHQUFBLENBQUEsT0FBQSxJQUFBLENBQUEsS0FBQTtBQUNBLFFBQUEsS0FBQSxRQUFBLEdBQUEsQ0FBQSxFQUFBO0FBQ0EsbUJBQUEsU0FBQSxDQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsUUFBQSx5Q0FBQSxRQUFBLE9BQUEsUUFBQSxFQUFBLE9BQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxLQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUE7QUFDQSxPQUpBO0FBS0EsS0FOQSxNQU9BLE9BQUEsS0FBQSxDQUFBLG9DQUFBO0FBQ0EsR0FiQTs7QUFlQSxTQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxPQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUE7QUFDQSxLQUZBLEVBRUEsSUFGQSxDQUVBLElBRkEsQ0FBQTtBQUdBLEdBSkE7O0FBTUEsU0FBQSxXQUFBOztBQUVBLFNBQUEsaUJBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxZQUFBLGVBQUEsR0FDQSxJQURBLENBQ0EsVUFBQSxJQUFBLEVBQUE7QUFDQSxjQUFBLEdBQUEsQ0FBQSxJQUFBO0FBQ0EsVUFBQSxDQUFBLElBQUEsRUFB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RUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLFVBQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxZQUFBO0FBQ0EsU0FBQSxJQUFBLEdBQUEsT0FBQTtBQUNBLFNBQUEsS0FBQSxHQUFBLFlBQUE7O0FBRUEsU0FBQSxjQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxVQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUNBLEdBRkE7O0FBSUEsU0FBQSxVQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxnQkFBQSxFQUFBLEVBQUEsSUFBQSxFQUFBLEVBQUE7QUFDQSxHQUZBO0FBR0EsQ0FaQTs7QUNBQSxJQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxNQUFBLGNBQUEsRUFBQTs7QUFFQSxjQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsTUFBQSxHQUFBLENBQUEsZUFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsY0FBQSxHQUFBLENBQUEsU0FBQSxFQUFBLFNBQUEsSUFBQTtBQUNBLGFBQUEsU0FBQSxJQUFBO0FBQ0EsS0FKQSxDQUFBO0FBS0EsR0FOQTs7QUFRQSxjQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxNQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxTQUFBLElBQUE7QUFDQSxLQUhBLENBQUE7QUFJQSxHQUxBOztBQU9BLFNBQUEsV0FBQTtBQUNBLENBbkJBOztBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFNBQUEsZUFEQTtBQUVBLGlCQUFBLDRCQUZBO0FBR0EsZ0JBQUEsVUFIQTtBQUlBLGFBQUE7QUFDQSxlQUFBLGlCQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxl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REEsRUFFQSxFQUFBLE9BQUEsWUFBQSxFQUFBLE9BQUEsd0JBQUEsRUFBQSxNQUFBLElBQUEsRUFGQTs7QUFJQSxRQUFBLE9BQUEsZUFBQSxFQUFBLE9BQUEsWUFBQSxFQUpBLEVBS0EsRUFBQSxPQUFBLGlCQUFBLEVBQUEsT0FBQSxPQUFBLEVBTEEsQ0FBQTs7QUFRQSxZQUFBLElBQUEsR0FBQSxJQUFBOztBQUVBLFlBQUEsVUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLFlBQUEsZUFBQSxFQUFBO0FBQ0EsT0FGQTs7QUFJQSxZQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0Esb0JBQUEsTUFBQSxHQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsaUJBQUEsRUFBQSxDQUFBLE1BQUE7QUFDQSxTQUZBO0FBR0EsT0FKQTs7QUFNQSxVQUFBLFVBQUEsU0FBQSxPQUFBLEdBQUE7QUFDQSxvQkFBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxTQUZBO0FBR0EsT0FKQTs7QUFNQSxVQUFBLGFBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxjQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsT0FGQTs7QUFJQTs7QUFFQSxpQkFBQSxHQUFBLENBQUEsWUFBQSxZQUFBLEVBQUEsT0FBQTtBQUNBLGlCQUFBLEdBQUEsQ0FBQSxZQUFBLGFBQUEsRUFBQSxVQUFBO0FBQ0EsaUJBQUEsR0FBQSxDQUFBLFlBQUEsY0FBQSxFQUFBLFVBQUE7QUFFQTs7QUE1Q0EsR0FBQTtBQWdEQSxDQWxEQTs7QUNBQSxJQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxpQkFBQTtBQUZBLEdBQUE7QUFJQSxDQUxBO0FDQUE7O0FBRUEsSUFBQSxTQUFBLENBQUEsYUFBQSxFQUFBLFlBQUE7QUFDQSxTQUFBO0FBQ0EsV0FBQTtBQUNBLG9CQUFBO0FBREEsS0FEQTtBQUlBLGNBQUEsR0FKQTtBQUtBLGlCQUFBO0FBTEEsR0FBQTtBQU9BLENBUkE7O0FDRkEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsZUFBQSxFQUFBOztBQUVBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxpQkFBQSx5REFGQTtBQUdBLFVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsR0FBQSxnQkFBQSxpQkFBQSxFQUFBO0FBQ0E7QUFMQSxHQUFBO0FBUUEsQ0FWQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdzb2NrbWFya2V0JywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZSddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgIC8vIFJlZ2lzdGVyIG91ciAqYWJvdXQqIHN0YXRlLlxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhYm91dCcsIHtcbiAgICAgICAgdXJsOiAnL2Fib3V0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Fib3V0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWJvdXQvYWJvdXQuaHRtbCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdBYm91dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBGdWxsc3RhY2tQaWNzKSB7XG5cbiAgICAvLyBJbWFnZXMgb2YgYmVhdXRpZnVsIEZ1bGxzdGFjayBwZW9wbGUuXG4gICAgJHNjb3BlLmltYWdlcyA9IF8uc2h1ZmZsZShGdWxsc3RhY2tQaWNzKTtcblxufSk7XG5cbiIsImFwcC5jb250cm9sbGVyKCdjaGVja291dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGN1cnJlbnRDYXJ0KSB7XG4gICRzY29wZS5jdXJyZW50Q2FydCA9IGN1cnJlbnRDYXJ0XG5cbiAgJHNjb3BlLmNhbGNUb3RhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBPcmRlckZhY3RvcnkuY2FsY3VsYXRlVG90YWwoJ2N1cnJlbnQnKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnRUb3RhbCkgeyAkc2NvcGUudG90YWwgPSBjYXJ0VG90YWwgfSlcbiAgfVxuXG4gICRzY29wZS5jYWxjVG90YWwoKVxufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjaGVja291dCcsIHtcbiAgICB1cmw6ICcvY2FydC9jaGVja291dCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvY2hlY2tvdXQvY2hlY2tvdXQuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ2NoZWNrb3V0Q29udHJvbGxlcicsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0Y3VycmVudENhcnQ6IGZ1bmN0aW9uIChPcmRlckZhY3RvcnkpIHtcblx0XHRcdFx0cmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnY3VycmVudCcpXG5cdFx0XHR9XG5cdFx0fVxuICB9KVxufSlcbiIsImFwcC5kaXJlY3RpdmUoJ2Rlc2lnblZpZXcnLCBmdW5jdGlvbiAoU29ja0ZhY3RvcnksICRzdGF0ZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9kZXNpZ24vZGVzaWduLXZpZXcuaHRtbCcsXG5cdFx0Ly8gc2NvcGU6IHtcblx0XHQvLyBcdHRoZVNvY2s6ICc9J1xuXHRcdC8vIH0sXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgZGVzaWduVmlld0N0cmwpIHtcblx0XHRcdFxuXHRcdFx0dmFyIHRpdGxlID0gc2NvcGUudGl0bGU7XG5cdFx0XHR2YXIgZGVzY3JpcHRpb24gPSBzY29wZS5kZXNjcmlwdGlvbjtcblx0XHRcdHZhciB0YWdzID0gc2NvcGUudGFncztcblx0XHRcdHZhciBjYW52YXMgPSBlbGVtZW50LmZpbmQoJ2NhbnZhcycpWzBdO1xuXHRcdFx0c2NvcGUuc2F2ZURlc2lnbiA9IGZ1bmN0aW9uICh0aXRsZSwgZGVzY3JpcHRpb24sIHRhZ3MpIHtcblx0XHRcdFx0dmFyIHRhZ3NBcnIgPSBTb2NrRmFjdG9yeS5wcmVwYXJlVGFncyh0YWdzKVxuXHRcdFx0XHRjb25zb2xlLmxvZygnVEFHUzonLCB0YWdzQXJyKTtcblx0XHRcdFx0dmFyIGRhdGFVUkwgPSBjYW52YXMudG9EYXRhVVJMKClcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coZGVzY3JpcHRpb24pXG5cdFx0XHRcdHZhciBuZXdTb2NrRGF0YU9iaiA9IHtcblx0XHRcdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuXHRcdFx0XHRcdHRhZ3M6IHRhZ3NBcnIsXG5cdFx0XHRcdFx0aW1hZ2U6IGRhdGFVUkxcblx0XHRcdFx0fTtcblx0XHRcdFx0cmV0dXJuIFNvY2tGYWN0b3J5LnNhdmVEZXNpZ24obmV3U29ja0RhdGFPYmopXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0XHRcdFx0XHQkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiByZXN1bHQuZGF0YS51c2VySWR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fTtcblxuXG5cdFx0XHR2YXIgY29sb3IgPSAkKFwiLnNlbGVjdGVkXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XG5cdFx0XHR2YXIgY29udGV4dCA9ICQoXCJjYW52YXNcIilbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXHRcdFx0dmFyICRjYW52YXMgPSAkKFwiY2FudmFzXCIpO1xuXHRcdFx0dmFyIGxhc3RFdmVudDtcblx0XHRcdHZhciBtb3VzZURvd24gPSBmYWxzZTtcblxuXHRcdFx0dmFyIGJhY2tncm91bmQgPSBuZXcgSW1hZ2UoKTtcblxuXHRcdFx0Ly8gY29udGV4dC5maWxsU3R5bGUgPSAnI2Y4ZjhmZic7XG5cdFx0XHQvLyBjb250ZXh0Lm9wYWNpdHkgPSAwO1xuXHRcdFx0Ly8gY29udGV4dC5maWxsKClcblxuXHRcdFx0Ly8gZnVuY3Rpb24gZ2VuZXJhdGVTb2NrVVJMKCl7XG5cdFx0XHQvLyAgIGZ1bmN0aW9uIGdlbmVyYXRlUmFuZG9tTnVtYmVyKCkge1xuXHRcdFx0Ly8gICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzKSArIDE7XG5cdFx0XHQvLyAgIH1cblx0XHRcdC8vICAgdmFyIG51bSA9IGdlbmVyYXRlUmFuZG9tTnVtYmVyKCk7XG5cblx0XHRcdC8vICAgaWYgKG51bSA9PT0gMSkgcmV0dXJuICcvc29jay1iZy8nICsgbnVtICsgJy5wbmcnXG5cdFx0XHQvLyAgIGVsc2UgcmV0dXJuICcvc29jay1iZy8nICsgbnVtICsgJy5qcGcnO1xuXHRcdFx0Ly8gfVxuXG5cdFx0XHRiYWNrZ3JvdW5kLnNyYyA9ICcvc29jay1iZy8xLnBuZyc7XG5cblx0XHRcdGJhY2tncm91bmQub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQgIGNvbnRleHQuZHJhd0ltYWdlKGJhY2tncm91bmQsIDAsIDApO1xuXHRcdFx0fTtcblxuXHRcdFx0Ly9XaGVuIGNsaWNraW5nIG9uIGNvbnRyb2wgbGlzdCBpdGVtc1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzXCIpLm9uKFwiY2xpY2tcIiwgXCJsaVwiICwgZnVuY3Rpb24oKXtcblx0XHRcdCAgICAgLy9EZXNsZWN0IHNpYmxpbmcgZWxlbWVudHNcblx0XHRcdCAgICAgJCh0aGlzKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vU2VsZWN0IGNsaWNrZWQgZWxlbWVudFxuXHRcdFx0ICAgICAkKHRoaXMpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vc3RvcmUgdGhlIGNvbG9yXG5cdFx0XHQgICAgIGNvbG9yID0gJCh0aGlzKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICB9KTtcblxuXHRcdFx0Ly9XaGVuIFwiQWRkIENvbG9yXCIgYnV0dG9uIGlzIHByZXNzZWRcblx0XHRcdCAgJChcIiNyZXZlYWxDb2xvclNlbGVjdFwiKS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCAgLy9TaG93IGNvbG9yIHNlbGVjdCBvciBoaWRlIHRoZSBjb2xvciBzZWxlY3Rcblx0XHRcdCAgICBjaGFuZ2VDb2xvcigpO1xuXHRcdFx0ICBcdCQoXCIjY29sb3JTZWxlY3RcIikudG9nZ2xlKCk7XG5cdFx0XHQgIH0pO1xuXG5cdFx0XHQvL1VwZGF0ZSB0aGUgbmV3IGNvbG9yIHNwYW5cblx0XHRcdGZ1bmN0aW9uIGNoYW5nZUNvbG9yKCl7XG5cdFx0XHRcdHZhciByID0gJChcIiNyZWRcIikudmFsKCk7XG5cdFx0XHRcdHZhciBnID0gJChcIiNncmVlblwiKS52YWwoKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKCk7XG5cdFx0XHRcdCQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYihcIiArIHIgKyBcIiwgXCIgKyBnICsgXCIsIFwiICsgYiArIFwiKVwiKTtcblx0XHRcdCAgLy9XaGVuIGNvbG9yIHNsaWRlcnMgY2hhbmdlXG5cblxuXHRcdFx0fVxuXG5cdFx0XHQkKFwiaW5wdXRbdHlwZT1yYW5nZV1cIikub24oXCJpbnB1dFwiLCBjaGFuZ2VDb2xvcik7XG5cblx0XHRcdC8vd2hlbiBcIkFkZCBDb2xvclwiIGlzIHByZXNzZWRcblx0XHRcdCQoXCIjYWRkTmV3Q29sb3JcIikuY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdCAgLy9hcHBlbmQgdGhlIGNvbG9yIHRvIHRoZSBjb250cm9scyB1bFxuXHRcdFx0ICB2YXIgJG5ld0NvbG9yID0gJChcIjxsaT48L2xpPlwiKTtcblx0XHRcdCAgJG5ld0NvbG9yLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpKTtcblx0XHRcdCAgJChcIi5jb250cm9scyB1bFwiKS5hcHBlbmQoJG5ld0NvbG9yKTtcblx0XHRcdCAgJChcIi5jb250cm9scyBsaVwiKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgbGlcIikubGFzdCgpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgIGNvbG9yID0gJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICAvL3doZW4gYWRkZWQsIHJlc3RvcmUgc2xpZGVycyBhbmQgcHJldmlldyBjb2xvciB0byBkZWZhdWx0XG5cdFx0XHQgICQoXCIjY29sb3JTZWxlY3RcIikuaGlkZSgpO1xuXHRcdFx0XHR2YXIgciA9ICQoXCIjcmVkXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGcgPSAkKFwiI2dyZWVuXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKDApO1xuXHRcdFx0XHQkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2IoXCIgKyByICsgXCIsIFwiICsgZyArIFwiLCBcIiArIGIgKyBcIilcIik7XG5cblx0XHRcdH0pXG5cblx0XHRcdC8vT24gbW91c2UgZXZlbnRzIG9uIHRoZSBjYW52YXNcblx0XHRcdCRjYW52YXMubW91c2Vkb3duKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICBsYXN0RXZlbnQgPSBlO1xuXHRcdFx0ICBtb3VzZURvd24gPSB0cnVlO1xuXHRcdFx0fSkubW91c2Vtb3ZlKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICAvL2RyYXcgbGluZXNcblx0XHRcdCAgaWYgKG1vdXNlRG93bil7XG5cdFx0XHQgICAgY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdCAgICBjb250ZXh0Lm1vdmVUbyhsYXN0RXZlbnQub2Zmc2V0WCxsYXN0RXZlbnQub2Zmc2V0WSk7XG5cdFx0XHQgICAgY29udGV4dC5saW5lVG8oZS5vZmZzZXRYLCBlLm9mZnNldFkpO1xuXHRcdFx0ICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBjb2xvcjtcblx0XHRcdCAgICBjb250ZXh0LnN0cm9rZSgpO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZUNhcCA9ICdyb3VuZCc7XG5cdFx0XHQgICAgY29udGV4dC5saW5lV2lkdGggPSAyMDtcblxuXHRcdFx0ICAgIGxhc3RFdmVudCA9IGU7XG5cdFx0XHQgIH1cblx0XHRcdH0pLm1vdXNldXAoZnVuY3Rpb24oKXtcblx0XHRcdCAgICBtb3VzZURvd24gPSBmYWxzZTtcblx0XHRcdH0pLm1vdXNlbGVhdmUoZnVuY3Rpb24oKXtcblx0XHRcdCAgICAkY2FudmFzLm1vdXNldXAoKTtcblx0XHRcdH0pO1xuXG5cblxuXG5cdFx0XHQvLyB2YXIgc2tldGNoID0gZWxlbWVudC5maW5kKCcjc2tldGNoJyk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhza2V0Y2gpO1xuXHRcdFx0Ly8gdmFyIHNrZXRjaFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShza2V0Y2gpXG5cdFx0ICAgIC8vIGNhbnZhcy53aWR0aCA9IHBhcnNlSW50KHNrZXRjaFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3dpZHRoJykpO1xuXHRcdCAgICAvLyBjYW52YXMuaGVpZ2h0ID0gcGFyc2VJbnQoc2tldGNoU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JykpO1xuXG5cblxuXHQgICAgXHQvLyB2YXIgY29sb3IgPSAnYmxhY2snO1xuXHRcdCAgICAvLyBzY29wZS5jaGFuZ2VDb2xvciA9IGZ1bmN0aW9uIChjaG9zZW5Db2xvcikge1xuXHRcdCAgICAvLyBcdGNvbG9yID0gY2hvc2VuQ29sb3I7XG5cdFx0ICAgIC8vIFx0Y29uc29sZS5sb2coJ0NPTE9SJywgY29sb3IpXG5cdFx0ICAgIC8vIH1cdFx0ICAgIFxuXG5cdFx0ICAgIC8vIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRcdCAgICAvLyBjdHgubGluZVdpZHRoID0gMjA7XG5cdFx0ICAgIC8vIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG5cdFx0ICAgIC8vIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcblxuXHRcdCAgICAvLyB2YXIgY3VycmVudE1vdXNlUG9zaXRpb24gPSB7XG5cdFx0ICAgIC8vICAgICB4OiAwLFxuXHRcdCAgICAvLyAgICAgeTogMFxuXHRcdCAgICAvLyB9O1xuXG5cdFx0ICAgIC8vIHZhciBsYXN0TW91c2VQb3NpdGlvbiA9IHtcblx0XHQgICAgLy8gICAgIHg6IDAsXG5cdFx0ICAgIC8vICAgICB5OiAwXG5cdFx0ICAgIC8vIH07XG5cblx0XHQgICAgLy8gdmFyIGRyYXdpbmcgPSBmYWxzZTtcblxuXHRcdCAgICAvLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcblx0XHQgICAgLy8gICAgIGRyYXdpbmcgPSB0cnVlO1xuXHRcdCAgICAvLyAgICAgY3VycmVudE1vdXNlUG9zaXRpb24ueCA9IGUub2Zmc2V0WDtcblx0XHQgICAgLy8gICAgIGN1cnJlbnRNb3VzZVBvc2l0aW9uLnkgPSBlLm9mZnNldFk7XG5cdFx0ICAgIC8vIH0pO1xuXG5cdFx0ICAgIC8vIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZnVuY3Rpb24gKCkge1xuXHRcdCAgICAvLyAgICAgZHJhd2luZyA9IGZhbHNlO1xuXHRcdCAgICAvLyB9KTtcblxuXHRcdCAgICAvLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24gKGUpIHtcblx0XHQgICAgLy8gICAgIGlmICghZHJhd2luZykgcmV0dXJuO1xuXG5cdFx0ICAgIC8vICAgICBsYXN0TW91c2VQb3NpdGlvbi54ID0gY3VycmVudE1vdXNlUG9zaXRpb24ueDtcblx0XHQgICAgLy8gICAgIGxhc3RNb3VzZVBvc2l0aW9uLnkgPSBjdXJyZW50TW91c2VQb3NpdGlvbi55O1xuXG5cdFx0ICAgIC8vICAgICBjdXJyZW50TW91c2VQb3NpdGlvbi54ID0gZS5vZmZzZXRYO1xuXHRcdCAgICAvLyAgICAgY3VycmVudE1vdXNlUG9zaXRpb24ueSA9IGUub2Zmc2V0WTtcblxuXHRcdCAgICAvLyAgICAgY29uc29sZS5sb2coJ1BPU0lUSU9OJywgY3VycmVudE1vdXNlUG9zaXRpb24pXG5cblx0XHQgICAgLy8gICAgIGRyYXcobGFzdE1vdXNlUG9zaXRpb24sIGN1cnJlbnRNb3VzZVBvc2l0aW9uLCBjb2xvciwgdHJ1ZSk7XG5cblx0XHQgICAgLy8gfSk7XG5cblx0XHQgICAgLy8gdmFyIGRyYXcgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCwgc3Ryb2tlQ29sb3IpIHtcblxuXHRcdCAgICAvLyAgICAgLy8gRHJhdyB0aGUgbGluZSBiZXR3ZWVuIHRoZSBzdGFydCBhbmQgZW5kIHBvc2l0aW9uc1xuXHRcdCAgICAvLyAgICAgLy8gdGhhdCBpcyBjb2xvcmVkIHdpdGggdGhlIGdpdmVuIGNvbG9yLlxuXHRcdCAgICAvLyAgICAgY3R4LmJlZ2luUGF0aCgpO1xuXHRcdCAgICAvLyAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlQ29sb3IgfHwgJ2JsYWNrJztcblx0XHQgICAgLy8gICAgIGN0eC5tb3ZlVG8oc3RhcnQueCwgc3RhcnQueSk7XG5cdFx0ICAgIC8vICAgICBjdHgubGluZVRvKGVuZC54LCBlbmQueSk7XG5cdFx0ICAgIC8vICAgICBjdHguY2xvc2VQYXRoKCk7XG5cdFx0ICAgIC8vICAgICBjdHguc3Ryb2tlKCk7XG5cblx0XHQgICAgLy8gfTtcblxuXHRcdH1cblx0fVxufSkiLCJhcHAuY29udHJvbGxlcignRGVzaWduQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUpIHtcblxuICAkc2NvcGUuaGkgPSBcImhpXCI7XG5cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2Rlc2lnblNvY2snLCBmdW5jdGlvbiAoKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIGNvbnRyb2xsZXI6ICdEZXNpZ25Db250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9kZXNpZ24vZGVzaWduLnZpZXcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rlc2lnblZpZXcnLCB7XG4gICAgICB1cmw6Jy9zb2Nrcy9kZXNpZ24vOmlkJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIHRoZVNvY2s6ICc9J1xuICAgICAgfSxcbiAgICAgIGNvbnRyb2xsZXI6ICdkZXNpZ25WaWV3Q3RybCcsXG4gICAgICB0ZW1wbGF0ZTogJzxkZXNpZ24tdmlldz48L2Rlc2lnbi12aWV3PicsXG4gICAgfSlcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdkZXNpZ25WaWV3Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwKSB7XG5cbiAgJGh0dHAucG9zdCgnL2FwaS91c2VyL21hdGNoSWQnKVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIHJldHVybiAkc2NvcGUuc2hvd1ZpZXcgPSByZXNcbiAgICB9KVxuXG5cdC8vIC8vICRzY29wZS5kZXNjcmlwdGlvbjtcblx0Ly8gJHNjb3BlLnRhZ3M7XG5cdC8vICRzY29wZS50aXRsZTtcblx0Ly8gY29uc29sZS5sb2coJHNjb3BlLmRlc2NyaXB0aW9uKTtcbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGVzaWduJywge1xuICAgICAgdXJsOicvZGVzaWduJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdEZXNpZ25Db250cm9sbGVyJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnPGRlc2lnbi1zb2NrPjwvZGVzaWduLXNvY2s+J1xuICAgIH0pXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkb2NzJywge1xuICAgICAgICB1cmw6ICcvZG9jcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZG9jcy9kb2NzLmh0bWwnXG4gICAgfSk7XG59KTtcbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0bW9zdFJlY2VudFNvY2tzOiBmdW5jdGlvbiAoU29ja0ZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBTb2NrRmFjdG9yeS5tb3N0UmVjZW50U29ja3MoKVxuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdob21lQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIG1vc3RSZWNlbnRTb2NrcywgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcblxuICAkc2NvcGUubW9zdFJlY2VudFNvY2tzID0gbW9zdFJlY2VudFNvY2tzXG4gICRzY29wZS5zZWVTb2NrID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgJHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KVxuICB9XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pOyIsImFwcC5jb250cm9sbGVyKCdjYXJ0Q3VycmVudCcsIGZ1bmN0aW9uICgkc2NvcGUsIE9yZGVyRmFjdG9yeSwgY3VycmVudENhcnQpIHtcbiAgJHNjb3BlLmN1cnJlbnQgPSBjdXJyZW50Q2FydFxufSlcblxuXG5hcHAuY29udHJvbGxlcignY2FydEhpc3RvcnknLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGNhcnRIaXN0b3J5KSB7XG5cbiAgLy8gJHNjb3BlLmNhcnRIaXN0b3J5ID0gY2FydEhpc3RvcnlcblxufSlcbiIsImFwcC5kaXJlY3RpdmUoJ2N1cnJlbnRDYXJ0JywgZnVuY3Rpb24gKCRzdGF0ZSwgT3JkZXJGYWN0b3J5KSB7XG5cbiAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICBzY29wZToge30sXG4gICAgICB0ZW1wbGF0ZVVybDogJ2pzL29yZGVyL2N1cnJlbnQuaHRtbCcsXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSkge1xuXG4gICAgICAgIHNjb3BlLnVwZGF0ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICB2YXIgc29jayA9IHtcbiAgICAgICAgICAgIHF1YW50aXR5OiBpdGVtLm5ld0Ftb3VudCxcbiAgICAgICAgICAgIGlkOiBpdGVtLmlkXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBPcmRlckZhY3RvcnkudXBkYXRlSXRlbShzb2NrKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpdGVtLnF1YW50aXR5ID0gaXRlbS5uZXdBbW91bnQ7XG4gICAgICAgICAgICBpdGVtLm5ld0Ftb3VudCA9IG51bGw7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNjb3BlLmNhbGNUb3RhbCgpXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICB2YXIgdG9kZWxldGUgPSB7IGl0ZW06IGl0ZW0gfVxuICAgICAgICAgIE9yZGVyRmFjdG9yeS5kZWxldGVJdGVtKHRvZGVsZXRlLml0ZW0uaWQpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5jYWxjVG90YWwoKSB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKG5ld1RvdGFsKSB7IHNjb3BlLnRvdGFsID0gbmV3VG90YWwgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLnNpbmdsZVNvY2tWaWV3ID0gZnVuY3Rpb24oaWQpIHsgJHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KSB9XG4gICAgICAgIHNjb3BlLnRvQ2hlY2tvdXQgPSBmdW5jdGlvbigpIHsgJHN0YXRlLmdvKCdjaGVja291dCcpIH1cblxuICAgICAgICBzY29wZS5jYWxjVG90YWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LmNhbGN1bGF0ZVRvdGFsKCdjdXJyZW50JylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihjYXJ0VG90YWwpIHtcbiAgICAgICAgICAgIHNjb3BlLnRvdGFsID0gY2FydFRvdGFsXG4gICAgICAgICAgICByZXR1cm4gY2FydFRvdGFsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmNhbGNUb3RhbCgpXG5cbiAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnY3VycmVudCcpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGN1cnJlbnQpIHsgc2NvcGUuY3VycmVudENhcnQgPSBjdXJyZW50IH0pXG4gICAgfVxuICB9XG59KVxuXG5hcHAuZGlyZWN0aXZlKCdjYXJ0SGlzdG9yeScsIGZ1bmN0aW9uKCRzdGF0ZSwgT3JkZXJGYWN0b3J5KSB7XG5cbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHNjb3BlOiB7fSxcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL29yZGVyL2hpc3RvcnkuaHRtbCcsXG4gICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgIHNjb3BlLmNhbGNUb3RhbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LmNhbGN1bGF0ZVRvdGFsKCdoaXN0b3J5JylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY2FydFRvdGFsKSB7IHNjb3BlLnRvdGFsU3BlbnQgPSBjYXJ0VG90YWwgfSlcbiAgICAgIH1cblxuICAgICAgc2NvcGUuY2FsY1RvdGFsKClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkgeyBjb25zb2xlLmxvZyhzY29wZS50b3RhbFNwZW50KSB9KVxuXG4gICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdoaXN0b3J5JylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGhpc3RvcnkpIHsgc2NvcGUuY2FydEhpc3RvcnkgPSBoaXN0b3J5IH0pXG4gICAgfVxuICB9XG5cbn0pXG4iLCJcbmFwcC5mYWN0b3J5KCdPcmRlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuICB2YXIgY2FjaGVkQ2FydCA9IFtdXG4gIHZhciBjaGVja0NhcnQgPSBmdW5jdGlvbihvYmosIGFycikge1xuICAgIHJldHVybiBhcnIubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uc29ja0lkIH0pLmluZGV4T2Yob2JqLnNvY2tJZCkgPT09IC0xID8gZmFsc2UgOiB0cnVlXG4gIH1cbiAgcmV0dXJuIHtcbiAgICBhZGRUb0NhcnQ6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci9jdXJyZW50JylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykgeyByZXR1cm4gY2hlY2tDYXJ0KG9iaiwgcmVzLmRhdGEpIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihpbkNhcnQpIHtcbiAgICAgICAgaWYgKGluQ2FydCkge1xuICAgICAgICAgIHJldHVybiBcIkFscmVhZHkgaW4gQ2FydCFcIlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL29yZGVyLycsIG9iailcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHsgcmV0dXJuIHJlcy5kYXRhIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSxcbiAgICBzaG93Q2FydDogZnVuY3Rpb24odHlwZSkge1xuICAgICAgLy90eXBlID0gJ2N1cnJlbnQnIHx8IHR5cGUgPSAnaGlzdG9yeSdcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvJyt0eXBlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgY2FjaGVkQ2FydCA9IG9yZGVyLmRhdGFcbiAgICAgICAgcmV0dXJuIGNhY2hlZENhcnQgfHwgW11cbiAgICAgIH0pXG4gICAgfSxcbiAgICBjYWxjdWxhdGVUb3RhbDogZnVuY3Rpb24odHlwZSkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci8nK3R5cGUpXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICBjYWNoZWRDYXJ0ID0gb3JkZXIuZGF0YVxuICAgICAgICByZXR1cm4gY2FjaGVkQ2FydCB8fCBbXVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpIHtcbiAgICAgICAgaWYgKHR5cGU9PT0nY3VycmVudCcpIHtcbiAgICAgICAgICByZXR1cm4gY2FydC5yZWR1Y2UoZnVuY3Rpb24obywgaXRlbSkge3JldHVybiBvICsgKFxuICAgICAgICAgICAgaXRlbS5zb2NrLnByaWNlKml0ZW0ucXVhbnRpdHkpfSwgMClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gY2FydC5yZWR1Y2UoZnVuY3Rpb24obywgb3JkZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBvICsgb3JkZXIuaXRlbXMucmVkdWNlKGZ1bmN0aW9uKG8sIGl0ZW0pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG8gKyAoaXRlbS5zb2NrLnByaWNlKml0ZW0ucXVhbnRpdHkpfSwgMClcbiAgICAgICAgICB9LCAwKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gICAgdXBkYXRlSXRlbTogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucHV0KCcvYXBpL29yZGVyJywgb2JqKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5kYXRhIH0pXG4gICAgfSxcbiAgICBkZWxldGVJdGVtOiBmdW5jdGlvbihpdGVtSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5kZWxldGUoJy9hcGkvb3JkZXIvJytpdGVtSWQpXG4gICAgICAudGhlbihmdW5jdGlvbih0b1JlbW92ZSkge1xuICAgICAgICBjYWNoZWRDYXJ0LnNwbGljZShjYWNoZWRDYXJ0Lm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLmlkIH0pLmluZGV4T2YoaXRlbUlkKSwxKVxuICAgICAgICByZXR1cm4gY2FjaGVkQ2FydFxuICAgICAgfSlcbiAgICB9LFxuICAgIGVuc3VyZUNhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci9jcmVhdGVjYXJ0JylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKSB7XG4gICAgICAgIHJldHVybiB7ZXhpc3RzOiBvcmRlci5kYXRhfVxuICAgICAgfSlcbiAgICB9LFxuXG4gIH1cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY3VycmVudENhcnQnLCB7XG4gICAgdXJsOiAnL2NhcnQvY3VycmVudCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvb3JkZXIvY2FydC5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnY2FydEN1cnJlbnQnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGN1cnJlbnRDYXJ0OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuXHRcdFx0fVxuXHRcdH1cbiAgfSlcblxuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2FydEhpc3RvcnknLCB7XG4gICAgdXJsOiAnL2NhcnQvaGlzdG9yeScsXG4gICAgdGVtcGxhdGVVcmw6ICcvanMvb3JkZXIvcGFzdC5odG1sJyxcbiAgICBjb250cm9sbGVyOiAnY2FydEhpc3RvcnknLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGNhcnRIaXN0b3J5OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG4gICAgICAgIHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2hpc3RvcnknKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbn0pXG4iLCJhcHAuZmFjdG9yeSgnU29ja0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICByZXR1cm4ge1xuICAgIHNpbmdsZVNvY2s6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrLycrc29ja0lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgc29ja0J5VXNlcklkOiBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay9ieVVzZXIvJyArIHVzZXJJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIG1vc3RSZWNlbnRTb2NrczogZnVuY3Rpb24gKCkge1xuICAgIFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL3JlY2VudCcpXG4gICAgXHQudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICBcdFx0cmV0dXJuIHJlcy5kYXRhXG4gICAgXHR9KVxuICAgIH0sXG5cbiAgICBzYXZlRGVzaWduOiBmdW5jdGlvbiAobmV3U29ja0RhdGFPYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svJywgbmV3U29ja0RhdGFPYmopXG4gICAgfSxcblxuICAgIHByZXBhcmVUYWdzOiBmdW5jdGlvbiAodGFnSW5wdXQpIHtcbiAgICAgIHJldHVybiB0YWdJbnB1dC5zcGxpdCgnICcpLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgIGUgPSBlLnJlcGxhY2UoLywvaSwgXCJcIik7XG4gICAgICAgIGUgPSBlLnN1YnN0cmluZygxKTtcbiAgICAgICAgcmV0dXJuIGVcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB1cHZvdGU6IGZ1bmN0aW9uIChzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svdXB2b3RlJywge2lkOiBzb2NrSWR9KVxuICAgIH0sXG5cbiAgICBkb3dudm90ZTogZnVuY3Rpb24gKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay9kb3dudm90ZScsIHtpZDogc29ja0lkfSlcbiAgICB9XG5cbiAgfVxuXG59KVxuIiwiLy8gYXBwLmNvbnRyb2xsZXIoJ3NvY2tWaWV3Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFNvY2tGYWN0b3J5LCBSZXZpZXdGYWN0b3J5KSB7XG5cbi8vICAgJHNjb3BlLnNldFNvY2sgPSBmdW5jdGlvbihzb2NrSWQpIHtcbi8vICAgICByZXR1cm4gU29ja0ZhY3Rvcnkuc2luZ2xlU29jayhzb2NrSWQpIC8vIHJldHVybj9cbi8vICAgICAudGhlbihmdW5jdGlvbihzb2NrKSB7XG4vLyAgICAgICAkc2NvcGUuc29jayA9IHNvY2tcbi8vICAgICB9KVxuLy8gICB9XG5cbi8vICAgJHNjb3BlLnNldFJldmlld3MgPSBmdW5jdGlvbihzb2NrSWQpIHtcbi8vICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wcm9kdWN0UmV2aWV3cyhzb2NrSWQpXG4vLyAgICAgLnRoZW4oZnVuY3Rpb24ocmV2aWV3cykge1xuLy8gICAgICAgJHNjb3BlLnJldmlld3MgPSByZXZpZXdzXG4vLyAgICAgfSlcbi8vICAgfVxuXG4vLyAgICRzY29wZS5zZXRTb2NrKDEpO1xuLy8gICAkc2NvcGUuc2V0UmV2aWV3cygxKTtcblxuLy8gICAkc2NvcGUubmV3UmV2aWV3ID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgdmFyIG5ld1JldmlldyA9IHtcbi8vICAgICAgIHRleHQ6ICRzY29wZS5yZXZpZXdUZXh0LFxuLy8gICAgICAgc29ja0lkOiAkc2NvcGUuc29jay5pZFxuLy8gICAgIH1cbi8vICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wb3N0UmV2aWV3KG5ld1Jldmlldylcbi8vICAgICAudGhlbihmdW5jdGlvbihuZXdSZXZpZXcpe1xuLy8gICAgICAgdmFyIHJldmlldyA9IHt9O1xuLy8gICAgICAgcmV2aWV3LnVzZXIgPSB7fTtcblxuLy8gICAgICAgICByZXZpZXcudXNlci5maXJzdF9uYW1lID0gbmV3UmV2aWV3LnVzZXIuZmlyc3RfbmFtZTtcbi8vICAgICAgICAgcmV2aWV3LnVzZXIubGFzdF9uYW1lID0gbmV3UmV2aWV3LnVzZXIubGFzdF9uYW1lO1xuLy8gICAgICAgICByZXZpZXcudXNlci5wcm9maWxlX3BpYyA9IG5ld1Jldmlldy51c2VyLnByb2ZpbGVfcGljO1xuLy8gICAgICAgICByZXZpZXcudXNlci51c2VybmFtZSA9IG5ld1Jldmlldy51c2VyLnVzZXJuYW1lO1xuLy8gICAgICAgICByZXZpZXcudGV4dCA9IG5ld1Jldmlldy5yZXZpZXcudGV4dDtcblxuLy8gICAgICAgJHNjb3BlLnJldmlld3MucHVzaChyZXZpZXcpO1xuLy8gICAgICAgJHNjb3BlLnJldmlld1RleHQgPSBudWxsO1xuLy8gICAgIH0pXG4vLyAgIH1cblxuLy8gICAkc2NvcGUuYWxyZWFkeVBvc3RlZCA9IGZ1bmN0aW9uKCkge1xuLy8gICAgIC8vIGFkZCBpbiBhZnRlciBmaW5pc2hpbmcgb3RoZXIgc3R1ZmZcbi8vICAgfVxuXG4vLyB9KTtcblxuLy8gYXBwLmNvbnRyb2xsZXIoJ3NvY2tJZENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsICRzdGF0ZVBhcmFtcywgdGhlU29jaywgdGhlUmV2aWV3cywgUmV2aWV3RmFjdG9yeSwgT3JkZXJGYWN0b3J5LCBBdXRoU2VydmljZSkge1xuXG4vLyAgIC8vICRzY29wZS5kYXRlUGFyc2VyID0gZnVuY3Rpb24oZGF0ZSl7XG5cbi8vICAgLy8gICAvL3JldHVybiB0byB0aGlzIGxhdGVyLiBXb3VsZCBiZSBnb29kIGlmIHNvY2tzIGFuZCByZXZpZXdzIHN0YXRlZCB3aGVuIHRoZXkgd2VyZSBwb3N0ZWRcblxuICAvLyAgIC8vc2hvdWxkIGFkZCBpdCB0byBhIGZhY3RvcnksIGJlY2F1c2UgbWFueSBwYWdlcyBjYW4gbWFrZSB1c2Ugb2YgaXRcblxuICAvLyAgIHZhciBtb250aE9iaiA9IHtcbiAgLy8gICAgICcwMSc6IFwiSmFudWFyeVwiLFxuICAvLyAgICAgJzAyJzogXCJGZWJydWFyeVwiLFxuICAvLyAgICAgJzAzJzogXCJNYXJjaFwiLFxuICAvLyAgICAgJzA0JzogXCJBcHJpbFwiLFxuICAvLyAgICAgJzA1JzogXCJNYXlcIixcbiAgLy8gICAgICcwNic6IFwiSnVuZVwiLFxuICAvLyAgICAgJzA3JzogXCJKdWx5XCIsXG4gIC8vICAgICAnMDgnOiBcIkF1Z3VzdFwiLFxuICAvLyAgICAgJzA5JzogXCJTZXB0ZW1iZXJcIixcbiAgLy8gICAgICcxMCc6IFwiT2N0b2JlclwiLFxuICAvLyAgICAgJzExJzogXCJOb3ZlbWJlclwiLFxuICAvLyAgICAgJzEyJzogXCJEZWNlbWJlclwiXG4gIC8vICAgfVxuXG4gIC8vIH1cblxuYXBwLmNvbnRyb2xsZXIoJ3NvY2tJZENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGVQYXJhbXMsIHRoZVNvY2ssIHRoZVJldmlld3MsIFJldmlld0ZhY3RvcnksIE9yZGVyRmFjdG9yeSwgU29ja0ZhY3RvcnkpIHtcblxuXG5cbiAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSBmYWxzZTtcbiAgJHNjb3BlLnNvY2sgPSB0aGVTb2NrO1xuICAkc2NvcGUucmV2aWV3cyA9IHRoZVJldmlld3M7XG5cblxuICAkc2NvcGUuYWxlcnQgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICRzY29wZS5hbGVydGluZyA9ICEkc2NvcGUuYWxlcnRpbmc7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICRzY29wZS5hbGVydGluZyA9ICEkc2NvcGUuYWxlcnRpbmdcbiAgICAgICRzY29wZS4kZGlnZXN0KClcbiAgICB9LCAzMDAwKVxuICAgIC8vIGlmICghJHNjb3BlLmFsZXJ0aW5nKSAkc2NvcGUubWVzc2FnZSA9PT0gbnVsbFxuICB9XG5cbiAgJHNjb3BlLmdvVG9Vc2VyUGFnZSA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICRzdGF0ZS5nbygndXNlcicsIHt1c2VySWQ6IHVzZXJJZH0pO1xuICB9XG5cbiAgJHNjb3BlLmFkZEl0ZW0gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbSA9IHt9O1xuICAgIGl0ZW0uc29ja0lkID0gJHNjb3BlLnNvY2suaWQ7XG4gICAgaXRlbS5xdWFudGl0eSA9ICskc2NvcGUucXVhbnRpdHk7XG4gICAgaXRlbS5vcmlnaW5hbFByaWNlID0gKyRzY29wZS5zb2NrLnByaWNlO1xuICAgIGlmIChpdGVtLnF1YW50aXR5ID4gMCkge1xuICAgICAgT3JkZXJGYWN0b3J5LmFkZFRvQ2FydChpdGVtKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXNwb25zZSAhPT0gXCJvYmplY3RcIikgJHNjb3BlLmFsZXJ0KHJlc3BvbnNlKTtcbiAgICAgICAgZWxzZSAkc3RhdGUuZ28oJ2N1cnJlbnRDYXJ0Jyk7XG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlICRzY29wZS5hbGVydCgnWW91IGhhdmUgdG8gYWRkIGF0IGxlYXN0IG9uZSBzb2NrIScpO1xuICB9XG5cbiAgJHNjb3BlLmRpc3BsYXlUYWdzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICRzY29wZS5zb2NrLnRhZ3MubWFwKGZ1bmN0aW9uKHRhZyl7XG4gICAgICByZXR1cm4gJyMnICsgdGFnO1xuICAgIH0pLmpvaW4oXCIsIFwiKTtcbiAgfVxuXG4gICRzY29wZS5kaXNwbGF5VGFncygpO1xuXG4gICRzY29wZS5nZXRMb2dnZWRJblVzZXJJZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKVxuICAgIC50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgY29uc29sZS5sb2codXNlcik7XG4gICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgJHNjb3BlLmxvZ2dlZEluVXNlcklkID0gJ25vbmUnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmxvZ2dlZEluVXNlcklkID0gdXNlci5pZDtcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgJHNjb3BlLmdldExvZ2dlZEluVXNlcklkKCk7XG5cbiAgJHNjb3BlLnVzZXJDYW5ub3RQb3N0UmV2aWV3ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZDtcbiAgfVxuXG4gICRzY29wZS51c2VyQ2Fubm90UG9zdFJldmlldygpO1xuXG4gICRzY29wZS5uZXdSZXZpZXcgPSBmdW5jdGlvbigpIHtcblxuICAvL2lmIHVzZXIgaGFzIGFscmVhZHkgcmV2aWV3IHNvY2ssIGRvbid0IGFsbG93IHVzZXIgdG8gcmV2aWV3IGl0IGFnYWluXG4gICAgdmFyIHVzZXJzV2hvUmV2aWV3ZWRTb2NrID0gJHNjb3BlLnJldmlld3MubWFwKGZ1bmN0aW9uKHJldmlldyl7XG4gICAgICByZXR1cm4gcmV2aWV3LnVzZXJJZDtcbiAgICB9KVxuXG4gICAgaWYgKCRzY29wZS5sb2dnZWRJblVzZXJJZCA9PT0gJ25vbmUnKSB7XG4gICAgICAkc2NvcGUucmV2aWV3RXJyb3JNZXNzYWdlID0gXCJZb3UgbXVzdCBiZSBsb2dnZWQgaW4gdG8gcmV2aWV3IGEgc29jayFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHVzZXJzV2hvUmV2aWV3ZWRTb2NrLmluZGV4T2YoJHNjb3BlLmxvZ2dlZEluVXNlcklkKSAhPT0gLTEpIHtcbiAgICAgICRzY29wZS5yZXZpZXdFcnJvck1lc3NhZ2UgPSBcIllvdSd2ZSBhbHJlYWR5IHJldmlld2VkIHRoaXMgc29jayEgWW91IGNhbid0IHJldmlldyBpdCBhZ2FpbiFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgLy9pZiBzb2NrIGlkIG1hdGNoZXMgdXNlciBpZCwgdXNlciBkb24ndCBhbGxvdyB1c2VyIHRvIHBvc3QgYSByZXZpZXdcbiAgICB9IGVsc2UgaWYgKCRzY29wZS5sb2dnZWRJblVzZXJJZCA9PT0gJHNjb3BlLnNvY2sudXNlci5pZCkge1xuICAgICAgJHNjb3BlLnJldmlld0Vycm9yTWVzc2FnZSA9IFwiWW91IGNhbid0IHJldmlldyB5b3VyIG93biBzb2NrIVwiO1xuICAgICAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIHZhciBuZXdSZXZpZXcgPSB7XG4gICAgICAgIHRleHQ6ICRzY29wZS5yZXZpZXdUZXh0LFxuICAgICAgICBzb2NrSWQ6ICRzY29wZS5zb2NrLmlkXG4gICAgICB9XG4gICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wb3N0UmV2aWV3KG5ld1JldmlldylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG5ld1Jldmlldyl7XG4gICAgICAgIHZhciByZXZpZXcgPSB7fTtcbiAgICAgICAgcmV2aWV3LnVzZXIgPSB7fTtcblxuICAgICAgICAgIHJldmlldy51c2VyLmZpcnN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5maXJzdF9uYW1lO1xuICAgICAgICAgIHJldmlldy51c2VyLmxhc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmxhc3RfbmFtZTtcbiAgICAgICAgICByZXZpZXcudXNlci5wcm9maWxlX3BpYyA9IG5ld1Jldmlldy51c2VyLnByb2ZpbGVfcGljO1xuICAgICAgICAgIHJldmlldy51c2VyLnVzZXJuYW1lID0gbmV3UmV2aWV3LnVzZXIudXNlcm5hbWU7XG4gICAgICAgICAgcmV2aWV3LnRleHQgPSBuZXdSZXZpZXcucmV2aWV3LnRleHQ7XG5cbiAgICAgICAgJHNjb3BlLnJldmlld3MucHVzaChyZXZpZXcpO1xuICAgICAgICAkc2NvcGUucmV2aWV3VGV4dCA9IG51bGw7XG4gICAgICB9KVxuICAgIH1cbiAgfVxuICAkc2NvcGUudXB2b3RlID0gU29ja0ZhY3RvcnkudXB2b3RlXG4gICRzY29wZS5kb3dudm90ZSA9IFNvY2tGYWN0b3J5LmRvd252b3RlXG5cblxufSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAvLyAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc29ja3MnLCB7XG4gICAgLy8gICAgIHVybDogJy9zb2NrcycsXG4gICAgLy8gICAgIGNvbnRyb2xsZXI6ICdzb2NrVmlld0NvbnRyb2xsZXInLFxuICAgIC8vICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3Lmh0bWwnXG4gICAgLy8gfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2luZ2xlU29ja1ZpZXcnLCB7XG4gICAgICB1cmw6Jy9zb2Nrcy86aWQnLFxuICAgICAgY29udHJvbGxlcjogJ3NvY2tJZENvbnRyb2xsZXInLFxuICAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0dmlldy9wcm9kdWN0dmlldy5odG1sJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgdGhlU29jazogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgU29ja0ZhY3RvcnkpIHtcbiAgICAgICAgICByZXR1cm4gU29ja0ZhY3Rvcnkuc2luZ2xlU29jaygkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgIH0sXG4gICAgICAgIHRoZVJldmlld3M6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFJldmlld0ZhY3RvcnkpIHtcbiAgICAgICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wcm9kdWN0UmV2aWV3cygkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuXG59KTtcbiIsImFwcC5mYWN0b3J5KCdSZXZpZXdGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBwb3N0UmV2aWV3OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3Jldmlldy8nLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG4gICAgcHJvZHVjdFJldmlld3M6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9yZXZpZXcvc29jay8nK3NvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2VhcmNoUmVzdWx0cycsIHtcblx0XHR1cmw6ICcvc2VhcmNoLzpzZWFyY2hUZXJtcycsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvc2VhcmNocmVzdWx0cy9zZWFyY2gudmlldy5odG1sJyxcblx0XHRjb250cm9sbGVyOiBcInNlYXJjaEN0cmxcIixcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRhbGxSZXN1bHRzOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBTZWFyY2hGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBTZWFyY2hGYWN0b3J5LmZpbmRCeVNlYXJjaFRleHQoJHN0YXRlUGFyYW1zLnNlYXJjaFRlcm1zKVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgYWxsUmVzdWx0cykge1xuXHRcdC8vIFx0JHNjb3BlLnJlc3VsdHMgPSBhbGxSZXN1bHRzO1xuXHRcdC8vIFx0Y29uc29sZS5sb2coXCJBbGwgUmVzdWx0cyEhXCIsIGFsbFJlc3VsdHMpO1xuXHRcdC8vIFx0JHNjb3BlLm51bWJlciA9IDEyMztcblx0XHQvLyB9XG5cdFx0Ly8gY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhcIkhFUkVFRUVFXCIsICRzdGF0ZVBhcmFtcy5yZXN1bHRzKVxuXHRcdC8vIFx0JHNjb3BlLnJlc3VsdHMgPSAkc3RhdGVQYXJhbXMucmVzdWx0c1xuXHRcdC8vIH1cblx0fSlcbn0pXG4iLCJhcHAuY29udHJvbGxlcignU2lnbnVwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIFNpZ251cEZhY3RvcnksICRzdGF0ZSkge1xuXG4gIGZ1bmN0aW9uIHBhc3N3b3JkVmFsaWQgKHBhc3N3b3JkKSB7XG4gICAgaWYgKHBhc3N3b3JkLmxlbmd0aCA8IDYpIHtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiUGFzc3dvcmQgbXVzdCBiZSA2IGNoYXJhY3RlcnMgbG9uZyFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHBhc3N3b3JkICE9PSAkc2NvcGUucHcyKSB7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlRoZSBwYXNzd29yZCBmaWVsZHMgZG9uJ3QgbWF0Y2ghXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmICgvXFxXLy50ZXN0KHBhc3N3b3JkKSl7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlBhc3N3b3JkIGNhbm5vdCBjb250YWluIHNwZWNpYWwgY2hhcmFjdGVycyFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLnNob3dFcnJvciA9IGZhbHNlO1xuXG4gICRzY29wZS5kaXNwbGF5RXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJHNjb3BlLnNob3dFcnJvcjtcbiAgfVxuXG4gICRzY29wZS5zdWJtaXRTaWdudXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHBhc3N3b3JkVmFsaWQoJHNjb3BlLnBhc3N3b3JkKSl7XG4gICAgICBjb25zb2xlLmxvZyhcIm5vdyBJIGRvbid0IHdvcmshXCIpO1xuICAgICAgcmV0dXJuIFNpZ251cEZhY3Rvcnkuc3VibWl0KHtcbiAgICAgICBlbWFpbDogJHNjb3BlLmVtYWlsLFxuICAgICAgIHVzZXJuYW1lOiAkc2NvcGUudXNlcm5hbWUsXG4gICAgICAgcGFzc3dvcmQ6ICRzY29wZS5wYXNzd29yZCxcbiAgICAgICBmaXJzdF9uYW1lOiAkc2NvcGUuZmlyc3RuYW1lLFxuICAgICAgIGxhc3RfbmFtZTogJHNjb3BlLmxhc3RuYW1lLFxuICAgICAgIGlzQWRtaW46IGZhbHNlLFxuICAgICAgIG5ld1VzZXI6IHRydWVcbiAgICAgfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIC8vIHJlc3BvbnNlLm5ld1VzZXIgPSB0cnVlO1xuICAgICAgICByZXR1cm4gJHN0YXRlLmdvKCdwZXJzb25hbCcsIHtpZDogcmVzcG9uc2UuaWR9KTtcbiAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxufSk7IiwiLy8gYXBwLmZhY3RvcnkoJ1NpZ251cEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuLy8gICB2YXIgU2lnbnVwRmFjdG9yeSA9IHt9O1xuXG4vLyAgIFNpZ251cEZhY3Rvcnkuc3VibWl0ID0gZnVuY3Rpb24odXNlckluZm8pe1xuLy8gICBcdGNvbnNvbGUubG9nKHVzZXJJbmZvKTtcbi8vICAgXHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2VyLycsIHVzZXJJbmZvKVxuLy8gICBcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbi8vICAgXHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuLy8gICBcdH0pXG4vLyAgIH1cblxuLy8gICByZXR1cm4gU2lnbnVwRmFjdG9yeTtcblxuLy8gfSlcblxuYXBwLmZhY3RvcnkoJ1NpZ251cEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0dmFyIFNpZ251cEZhY3RvcnkgPSB7fTtcblxuXHRTaWdudXBGYWN0b3J5LnN1Ym1pdCA9IGZ1bmN0aW9uICh1c2VySW5mbykge1xuXHRcdGNvbnNvbGUubG9nKFwiRnJvbSBTaWdudXAgRmFjdG9yeVwiLCB1c2VySW5mbyk7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci8nLCB1c2VySW5mbylcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuXHR9XG5cdHJldHVybiBTaWdudXBGYWN0b3J5O1xufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0Y29udHJvbGxlcjogJ1NpZ251cEN0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3NpZ251cC9zaWdudXAudmlldy5odG1sJ1xuXHR9KTtcblxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ1VzZXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCB0aGVVc2VyLCB0aGVVc2VyU29ja3MpIHtcbiAgICBjb25zb2xlLmxvZyhcImNvbnRyb2xsZXJcIiwgdGhlVXNlclNvY2tzKTtcblx0JHNjb3BlLnVzZXIgPSB0aGVVc2VyO1xuXHQkc2NvcGUuc29ja3MgPSB0aGVVc2VyU29ja3M7XG5cblx0JHNjb3BlLnRvU2hpcHBpbmdJbmZvID0gZnVuY3Rpb24oaWQpe1xuXHRcdCRzdGF0ZS5nbygncGVyc29uYWwnLCB7aWQ6IGlkfSk7XG5cdH1cblxuXHQkc2NvcGUudG9Tb2NrVmlldyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdCRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcblx0fVxufSlcbiIsImFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXHR2YXIgVXNlckZhY3RvcnkgPSB7fTtcblxuXHRVc2VyRmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3VzZXIvJyArIGlkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJmYWN0b3J5XCIsIHJlc3BvbnNlLmRhdGEpXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YVxuXHRcdH0pXG5cdH1cblxuXHRVc2VyRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3VzZXJzJylcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhXG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiBVc2VyRmFjdG9yeTtcbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgndXNlcicsIHtcblx0XHR1cmw6ICcvdXNlci86dXNlcklkJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy91c2VyL3VzZXItcHJvZmlsZS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnVXNlckN0cmwnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdHRoZVVzZXI6IGZ1bmN0aW9uIChVc2VyRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLnVzZXJJZCk7XG5cdFx0XHR9LFxuXHRcdFx0dGhlVXNlclNvY2tzOiBmdW5jdGlvbiAoU29ja0ZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuXHRcdFx0XHRyZXR1cm4gU29ja0ZhY3Rvcnkuc29ja0J5VXNlcklkKCRzdGF0ZVBhcmFtcy51c2VySWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSlcbn0pXG4iLCJhcHAuY29udHJvbGxlcignbmF2YmFyQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgU2VhcmNoRmFjdG9yeSkge1xuXG5cdCRzY29wZS5zZWFyY2ggPSBmdW5jdGlvbihzZWFyY2hUZXJtcyl7XG5cdFx0Ly8gU2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0KHNlYXJjaFRlcm1zKVxuXHRcdC8vIC50aGVuKGZ1bmN0aW9uKHJlc3VsdHMpe1xuXHRcdC8vIFx0JHNjb3BlLnJlc3VsdHMgPSByZXN1bHRzO1xuXHRcdC8vIFx0Y29uc29sZS5sb2cocmVzdWx0cyk7XG5cdFx0XHRyZXR1cm4gJHN0YXRlLmdvKCdzZWFyY2hSZXN1bHRzJywge3NlYXJjaFRlcm1zOiBzZWFyY2hUZXJtc30pO1xuXHRcdC8vIH0pXG5cdH1cbn0pXG5cbmFwcC5jb250cm9sbGVyKCdzZWFyY2hDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBhbGxSZXN1bHRzLCAkc3RhdGVQYXJhbXMpIHtcblx0JHNjb3BlLnJlc3VsdHMgPSBhbGxSZXN1bHRzO1xuXHQkc2NvcGUuc2VlU29jayA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdCRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcblx0fVxufSkiLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZmFjdG9yeShcIlNlYXJjaEZhY3RvcnlcIiwgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBTZWFyY2hGYWN0b3J5ID0ge307XG5cblx0U2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0ID0gZnVuY3Rpb24gKHRleHQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NlYXJjaC8/cT0nICsgdGV4dClcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHRzKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0cy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gU2VhcmNoRmFjdG9yeTtcbn0pIiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlLCBPcmRlckZhY3RvcnkpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgT3JkZXJGYWN0b3J5LmVuc3VyZUNhcnQoKVxuXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnSG9tZScsIHN0YXRlOiAnaG9tZScgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTXkgUHJvZmlsZScsIHN0YXRlOiAndXNlcih7dXNlcklkOnVzZXIuaWR9KScsIGF1dGg6IHRydWUgfSxcbiAgICAgICAgICAgICAgICAvLyB7IGxhYmVsOiAnQWJvdXQnLCBzdGF0ZTogJ2Fib3V0JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdEZXNpZ24gYSBTb2NrJywgc3RhdGU6ICdkZXNpZ25WaWV3JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdBZG1pbiBEYXNoYm9hcmQnLCBzdGF0ZTogJ2FkbWluJ31cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldFVzZXIoKTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnb2F1dGhCdXR0b24nLCBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB7XG4gICAgc2NvcGU6IHtcbiAgICAgIHByb3ZpZGVyTmFtZTogJ0AnXG4gICAgfSxcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvb2F1dGgtYnV0dG9uL29hdXRoLWJ1dHRvbi5odG1sJ1xuICB9XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLmdyZWV0aW5nID0gUmFuZG9tR3JlZXRpbmdzLmdldFJhbmRvbUdyZWV0aW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
=======
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuY29udHJvbGxlci5qcyIsImRlc2lnbi9kZXNpZ24tZGlyZWN0aXZlLmpzIiwiZGVzaWduL2Rlc2lnbi5jb250cm9sbGVyLmpzIiwiZGVzaWduL2Rlc2lnbi5kaXJlY3RpdmUuanMiLCJkZXNpZ24vZGVzaWduLmpzIiwiZGVzaWduL2Rlc2lnbi5zdGF0ZS5qcyIsImRvY3MvZG9jcy5qcyIsImZzYS9mc2EtcHJlLWJ1aWx0LmpzIiwiaG9tZS9ob21lLmpzIiwibG9naW4vbG9naW4uanMiLCJtZW1iZXJzLW9ubHkvbWVtYmVycy1vbmx5LmpzIiwib3JkZXIvb3JkZXIuY29udHJvbGxlci5qcyIsIm9yZGVyL29yZGVyLmRpcmVjdGl2ZS5qcyIsIm9yZGVyL29yZGVyLmZhY3RvcnkuanMiLCJvcmRlci9vcmRlci5zdGF0ZS5qcyIsInBlcnNvbmFsaW5mby9wZXJzb25hbGluZm8uY29udHJvbGxlci5qcyIsInBlcnNvbmFsaW5mby9wZXJzb25hbGluZm8uZmFjdG9yeS5qcyIsInBlcnNvbmFsaW5mby9wZXJzb25hbGluZm8uc3RhdGUuanMiLCJwcm9kdWN0dmlldy9wcm9kdWN0dmlldy5mYWN0b3J5LmpzIiwicHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuanMiLCJyZXZpZXcvcmV2aWV3LmZhY3RvcnkuanMiLCJzZWFyY2hyZXN1bHRzL3NlYXJjaC5zdGF0ZS5qcyIsInNpZ251cC9zaWdudXAuY29udHJvbGxlci5qcyIsInNpZ251cC9zaWdudXAuZmFjdG9yeS5qcyIsInNpZ251cC9zaWdudXAuc3RhdGUuanMiLCJ1c2VyL3VzZXItY29udHJvbGxlci5qcyIsInVzZXIvdXNlci1mYWN0b3J5LmpzIiwidXNlci91c2VyLXN0YXRlcy5qcyIsImNvbW1vbi9jb250cm9sbGVycy9uYXZiYXIuY29udHJvbGxlci5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9zZWFyY2guZmFjdG9yeS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uZGlyZWN0aXZlLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFDQSxPQUFBLEdBQUEsR0FBQSxRQUFBLE1BQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEsaUJBQUEsRUFBQTs7QUFFQSxvQkFBQSxTQUFBLENBQUEsSUFBQTs7QUFFQSxxQkFBQSxTQUFBLENBQUEsR0FBQTs7QUFFQSxxQkFBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQSxRQUFBLENBQUEsTUFBQTtBQUNBLEdBRkE7QUFHQSxDQVRBOzs7QUFZQSxJQUFBLEdBQUEsQ0FBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOzs7QUFHQSxNQUFBLCtCQUFBLFNBQUEsNEJBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxXQUFBLE1BQUEsSUFBQSxJQUFBLE1BQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxHQUZBOzs7O0FBTUEsYUFBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsUUFBQSxFQUFBOztBQUVBLFFBQUEsQ0FBQSw2QkFBQSxPQUFBLENBQUEsRUFBQTs7O0FBR0E7QUFDQTs7QUFFQSxRQUFBLFlBQUEsZUFBQSxFQUFBLEVBQUE7OztBQUdBO0FBQ0E7OztBQUdBLFVBQUEsY0FBQTs7QUFFQSxnQkFBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBOzs7O0FBSUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxlQUFBLEVBQUEsQ0FBQSxRQUFBLElBQUEsRUFBQSxRQUFBO0FBQ0EsT0FGQSxNQUVBO0FBQ0EsZUFBQSxFQUFBLENBQUEsT0FBQTtBQUNBO0FBQ0EsS0FUQTtBQVdBLEdBNUJBO0FBOEJBLENBdkNBOztBQ2ZBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOzs7QUFHQSxpQkFBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsU0FBQSxRQURBO0FBRUEsZ0JBQUEsaUJBRkE7QUFHQSxpQkFBQTtBQUhBLEdBQUE7QUFNQSxDQVRBOztBQVdBLElBQUEsVUFBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBOzs7QUFHQSxTQUFBLE1BQUEsR0FBQSxFQUFBLE9BQUEsQ0FBQSxhQUFBLENBQUE7QUFFQSxDQUxBOztBQ1hBLElBQUEsVUFBQSxDQUFBLFVBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLENBRUEsQ0FGQTs7QUNBQSxJQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsU0FBQTtBQUNBLGNBQUEsR0FEQTtBQUVBLGlCQUFBLDRCQUZBOzs7O0FBTUEsVUFBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBLGNBQUEsRUFBQTs7QUFFQSxVQUFBLFFBQUEsTUFBQSxLQUFBO0FBQ0EsVUFBQSxjQUFBLE1BQUEsV0FBQTtBQUNBLFVBQUEsT0FBQSxNQUFBLElBQUE7QUFDQSxVQUFBLFNBQUEsUUFBQSxJQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsVUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBLFdBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsWUFBQSxXQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsR0FBQSxDQUFBLE9BQUEsRUFBQSxPQUFBO0FBQ0EsWUFBQSxVQUFBLE9BQUEsU0FBQSxFQUFBOztBQUVBLFlBQUEsaUJBQUE7QUFDQSxpQkFBQSxLQURBO0FBRUEsdUJBQUEsV0FGQTtBQUdBLGdCQUFBLE9BSEE7QUFJQSxpQkFBQTtBQUpBLFNBQUE7QUFNQSxlQUFBLFlBQUEsVUFBQSxDQUFBLGNBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUEsQ0FBQSxNQUFBLEVBQUEsRUFBQSxRQUFBLE9BQUEsSUFBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFNBSEEsQ0FBQTtBQUlBLE9BZkE7O0FBa0JBLFVBQUEsUUFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLFVBQUEsVUFBQSxFQUFBLFFBQUEsRUFBQSxDQUFBLEVBQUEsVUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUEsVUFBQSxFQUFBLFFBQUEsQ0FBQTtBQUNBLFVBQUEsU0FBQTtBQUNBLFVBQUEsWUFBQSxLQUFBOztBQUVBLFVBQUEsYUFBQSxJQUFBLEtBQUEsRUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQWdCQSxpQkFBQSxHQUFBLEdBQUEsZ0JBQUE7O0FBRUEsaUJBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxTQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsRUFBQSxDQUFBO0FBQ0EsT0FGQTs7O0FBS0EsUUFBQSxXQUFBLEVBQUEsRUFBQSxDQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsWUFBQTs7QUFFQSxVQUFBLElBQUEsRUFBQSxRQUFBLEdBQUEsV0FBQSxDQUFBLFVBQUE7O0FBRUEsVUFBQSxJQUFBLEVBQUEsUUFBQSxDQUFBLFVBQUE7O0FBRUEsZ0JBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7QUFDQSxPQVBBOzs7QUFVQSxRQUFBLG9CQUFBLEVBQUEsS0FBQSxDQUFBLFlBQUE7O0FBRUE7QUFDQSxVQUFBLGNBQUEsRUFBQSxNQUFBO0FBQ0EsT0FKQTs7O0FBT0EsZUFBQSxXQUFBLEdBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxVQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxTQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsR0FBQTs7QUFJQTs7QUFFQSxRQUFBLG1CQUFBLEVBQUEsRUFBQSxDQUFBLE9BQUEsRUFBQSxXQUFBOzs7QUFHQSxRQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTs7QUFFQSxZQUFBLFlBQUEsRUFBQSxXQUFBLENBQUE7QUFDQSxrQkFBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLFVBQUEsY0FBQSxFQUFBLE1BQUEsQ0FBQSxTQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsUUFBQSxHQUFBLFdBQUEsQ0FBQSxVQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxVQUFBO0FBQ0EsZ0JBQUEsRUFBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7O0FBRUEsVUFBQSxjQUFBLEVBQUEsSUFBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLENBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsR0FBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxFQUFBLFNBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsSUFBQSxHQUFBLENB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QkFBQSx3QkFMQTtBQU1BLG1CQUFBO0FBTkEsR0FBQTs7QUFTQSxNQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxRQUFBLGFBQUE7QUFDQSxXQUFBLFlBQUEsZ0JBREE7QUFFQSxXQUFBLFlBQUEsYUFGQTtBQUdBLFdBQUEsWUFBQSxjQUhBO0FBSUEsV0FBQSxZQUFBO0FBSkEsS0FBQTtBQU1BLFdBQUE7QUFDQSxxQkFBQSx1QkFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxVQUFBLENBQUEsV0FBQSxTQUFBLE1BQUEsQ0FBQSxFQUFBLFFBQUE7QUFDQSxlQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQTtBQUNBO0FBSkEsS0FBQTtBQU1BLEdBYkE7O0FBZUEsTUFBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxrQkFBQSxZQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsV0FEQSxFQUVBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsYUFBQSxVQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsS0FKQSxDQUFBO0FBTUEsR0FQQTs7QUFTQSxNQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGFBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxVQUFBLE9BQUEsU0FBQSxJQUFBO0FBQ0EsY0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBQSxJQUFBO0FBQ0EsaUJBQUEsVUFBQSxDQUFBLFlBQUEsWUFBQTtBQUNBLGFBQUEsS0FBQSxJQUFBO0FBQ0E7Ozs7QUFJQSxTQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsYUFBQSxDQUFBLENBQUEsUUFBQSxJQUFBO0FBQ0EsS0FGQTs7QUFJQSxTQUFBLGVBQUEsR0FBQSxVQUFBLFVBQUEsRUFBQTs7Ozs7Ozs7OztBQVVBLFVBQUEsS0FBQSxlQUFBLE1BQUEsZUFBQSxJQUFBLEVB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QUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsU0FBQSxPQUFBLEdBQUEsV0FBQTtBQUNBLENBRkE7O0FBS0EsSUFBQSxVQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxXQUFBLEVBQUE7Ozs7QUFJQSxDQUpBOztBQ0xBLElBQUEsU0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUE7O0FBRUEsU0FBQTtBQUNBLGNBQUEsR0FEQTtBQUVBLFdBQUEsRUFGQTtBQUdBLGlCQUFBLHVCQUhBO0FBSUEsVUFBQSxjQUFBLEtBQUEsRUFBQTs7QUFFQSxZQUFBLE1BQUEsR0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLFlBQUEsT0FBQTtBQUNBLG9CQUFBLEtBQUEsU0FEQTtBQUVBLGNBQUEsS0FBQTtBQUZBLFNBQUE7QUFJQSxlQUFBLGFBQUEsVUFBQSxDQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxNQUFBLEVBQUE7QUFDQSxlQUFBLFFBQUEsR0FBQSxLQUFBLFNBQUE7QUFDQSxlQUFBLFNBQUEsR0FBQSxJQUFBO0FBQ0EsU0FKQSxFQUtBLElBTEEsQ0FLQSxZQUFBO0FBQ0EsZ0JBQUEsU0FBQTtBQUNBLFNBUEEsQ0FBQTtBQVFBLE9BYkE7O0FBZUEsWUFBQSxNQUFBLEdBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxZQUFBLFdBQUEsRUFBQSxNQUFBLElBQUEsRUFBQTtBQUNBLHFCQUFBLFVBQUEsQ0FBQSxTQUFBLElBQUEsQ0FBQSxFQUFBO0FBQ0EsT0FIQTs7QUFLQSxZQUFBLGNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLGVBQUEsRUFBQSxDQUFBLGdCQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUNBLE9BRkE7O0FBSUEsWUFBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsYUFBQSxjQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFNBQUEsRUFBQTtBQUFBLGdCQUFBLEtBQUEsR0FBQSxTQUFBO0FBQUEsU0FEQSxDQUFBO0FBRUEsT0FIQTs7QUFLQSxZQUFBLFNBQUEsR0FDQSxJQURBLENBQ0EsWUFBQTtBQUNBLGdCQUFBLEdBQUEsQ0FBQSxNQUFBLEtBQUE7QUFDQSxPQUhBOztBQUtBLGFBQUEsYUFBQSxRQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE9BQUEsRUFBQTtBQUFBLGNBQUEsV0FBQSxHQUFBLE9BQUE7QUFBQSxPQURBLENBQUE7QUFFQTtBQTFDQSxHQUFBO0FBNENBLENBOUNBOztBQWdEQSxJQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBOztBQUVBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxXQUFBLEVBRkE7QUFHQSxpQkFBQSx1QkFIQTtBQUlBLFVBQUEsY0FBQSxLQUFBLEVBQUE7O0FBRUEsWUFBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsYUFBQSxjQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFNBQUEsRUFBQTtBQUFBLGdCQUFBLFVBQUEsR0FBQSxTQUFBO0FBQUEsU0FEQSxDQUFBO0FBRUEsT0FIQTs7QUFLQSxZQUFBLFNBQUEsR0FDQSxJQURBLENBQ0EsWUFBQTtBQUFBLGdCQUFBLEdBQUEsQ0FBQSxNQUFBLFVBQUE7QUFBQSxPQURBOztBQUdBLGFBQUEsYUFBQSxRQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE9BQUEsRUFBQTtBQUFBLGNBQUEsV0FBQSxHQUFBLE9BQUE7QUFBQSxPQURBLENBQUE7QUFFQTtBQWhCQSxHQUFBO0FBbUJBLENBckJBOztBQy9DQSxJQUFBLE9BQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxNQUFBLGFBQUEsRUFBQTtBQUNBLE1BQUEsWUFBQSxTQUFBLFNBQUEsQ0FBQSxHQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxJQUFBLEdBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUFBLGFBQUEsS0FBQSxNQUFBO0FBQUEsS0FBQSxFQUFBLE9BQUEsQ0FBQSxJQUFBLE1BQUEsTUFBQSxDQUFBLENBQUEsR0FBQSxLQUFBLEdBQUEsSUFBQTtBQUNBLEdBRkE7QUFHQSxTQUFBO0FBQ0EsZUFBQSxtQkFBQSxHQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQSxDQUFBLG9CQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQUEsZUFBQSxVQUFBLEdBQUEsRUFBQSxJQUFBLElBQUEsQ0FBQTtBQUFBLE9BREEsRUFFQSxJQUZBLENBRUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxZQUFBLE1BQUEsRUFBQTtBQUNBLGlCQUFBLGtCQUFBO0FBQ0EsU0FGQSxNQUVBO0FBQ0EsaUJBQUEsTUFBQSxJQUFBLENBQUEsYUFBQSxFQUFBLEdBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFBQSxtQkFBQSxJQUFBLElBQUE7QUFBQSxXQURBLENBQUE7QUFFQTtBQUNBLE9BVEEsQ0FBQTtBQVVBLEtBWkE7QUFhQSxjQUFBLGtCQUFBLElBQUEsRUFBQTs7QUFFQSxhQUFBLE1BQUEsR0FBQSxDQUFBLGdCQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxLQUFBLEVBQUE7QUFDQSxxQkFBQSxNQUFBLElBQUE7QUFDQSxlQUFBLGNBQUEsRUFBQTtBQUNBLE9BSkEsQ0FBQTtBQUtBLEtBcEJBO0FBcUJBLG9CQUFBLHdCQUFBLElBQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsZ0JBQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHFCQUFBLE1BQUEsSUFBQTtBQUNBLGVBQUEsY0FBQSxFQUFBO0FBQ0EsT0FKQSxFQUtBLElBTEEsQ0FLQSxVQUFBLElBQUEsRUFBQTtBQUNBLFlBQUEsU0FBQSxTQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUEsRUFBQSxJQUFBLEVBQUE7QUFBQSxtQkFBQSxJQUNBLEtBQUEsSUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLFFBREE7QUFDQSxXQURBLEVBQ0EsQ0FEQSxDQUFBO0FBRUEsU0FIQSxNQUdBO0FBQ0EsaUJBQUEsS0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBO0FBQ0EsbUJBQUEsSUFBQSxNQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EscUJBQUEsSUFBQSxLQUFBLElBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxRQUFBO0FBQUEsYUFEQSxFQUNBLENBREEsQ0FBQTtBQUVBLFdBSEEsRUFHQSxDQUhBLENBQUE7QUFJQTtBQUNBLE9BZkEsQ0FBQTtBQWdCQSxLQXRDQTtBQXVDQSxnQkFBQSxvQkFBQSxHQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxHQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsSUFBQSxFQUFBO0FBQUEsZUFBQSxLQUFBLElBQUE7QUFBQSxPQURBLENBQUE7QUFFQSxLQTFDQTtBQTJDQSxnQkFBQSxvQkFBQSxNQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsTUFBQSxDQUFBLGdCQUFBLE1BQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxNQUFBLENBQUEsV0FBQSxHQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFBQSxpQkFBQSxLQUFBLEVBQUE7QUFBQSxTQUFBLEVBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLENBQUE7QUFDQSxlQUFBLFVBQUE7QUFDQSxPQUpBLENBQUE7QUFLQSxLQWpEQTtBQWtEQSxnQkFBQSxzQkFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsdUJBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLEVBQUEsUUFBQSxNQUFBLElBQUEsRUFBQTtBQUNBLE9BSEEsQ0FBQTtBQUlBOztBQXZEQSxHQUFBO0FBMERBLENBL0RBOztBQ0RBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLFNBQUEsZUFEQTtBQUVBLGlCQUFBLHFCQUZBO0FBR0EsZ0JBQUEsYUFIQTtBQUlBLGFBQUE7QUFDQSxtQkFBQSxxQkFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLGFBQUEsUUFBQSxDQUFBLFNBQUEsQ0FBQTtBQUNBO0FBSEE7QUFKQSxHQUFBOztBQVdBLGlCQUFBLEtBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxTQUFBLGVBREE7QUFFQSxpQkFBQSxxQkFGQTtBQUdBLGdCQUFBLGFBSEE7QUFJQSxhQUFBO0FBQ0EsbUJBQUEscUJBQUEsWUFBQSxFQUFBO0FBQ0EsZUFBQSxhQUFBLFFBQUEsQ0FBQSxTQUFBLENBQUE7QUFDQTtBQUhBO0FBSkEsR0FBQTtBQVdBLENBdkJBOztBQ0FBLElBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLEVBQUEsbUJBQUEsRUFBQTs7QUFFQSxTQUFBLE1BQUEsR0FBQSxRQUFBLEVBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxRQUFBLFFBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxRQUFBLFFBQUE7QUFDQSxTQUFBLEdBQUEsR0FBQSxRQUFBLEdBQUE7QUFDQSxTQUFBLEtBQUEsR0FBQSxRQUFBLEtBQUE7QUFDQSxTQUFBLE9BQUEsR0FBQSxRQUFBLE9BQUE7QUFDQSxTQUFBLEtBQUEsR0FBQSxRQUFBLEtBQUE7QUFDQSxTQUFBLFlBQUEsR0FBQSxLQUFBOzs7Ozs7Ozs7Ozs7OztBQWNBLFVBQUEsR0FBQSxDQUFBLFlBQUE7O0FBRUEsU0FBQSxjQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxRQUFBLENBQUEsT0FBQSxPQUFBLEtBQUEsZUFBQSxJQUFBLE9BQUEsT0FBQSxLQUFBLFFBQUEsS0FBQSxPQUFBLEtBQUEsS0FBQSxFQUFBLEVBQUE7QUFDQSxhQUFBLFlBQUEsR0FBQSxJQUFBO0FBQ0EsYUFBQSxPQUFBLFlBQUEsR0FBQSxpREFBQTtBQUNBOztBQUVBLFFBQUEsV0FBQTtBQUNBLGdCQUFBLE9BQUEs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QUEsSUFBQSxJQUFBO0FBQ0EsT0FIQSxDQUFBO0FBSUEsS0EvQ0E7O0FBaURBLFlBQUEsaUJBQUEsRUFBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLElBQUEsQ0FBQSxzQkFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLE9BQUEsRUFBQSxDQUFBLE1BQUEsQ0FEQSxDQUFBO0FBRUE7O0FBcERBLEdBQUE7QUF3REEsQ0ExREE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN1RUEsSUFBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQTs7QUFJQSxTQUFBLGdCQUFBLEdBQUEsS0FBQTtBQUNBLFNBQUEsSUFBQSxHQUFBLE9BQUE7QUFDQSxTQUFBLE9BQUEsR0FBQSxVQUFBOztBQUVBLFNBQUEsS0FBQSxHQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxPQUFBLEdBQUEsT0FBQTtBQUNBLFdBQUEsUUFBQSxHQUFBLENBQUEsT0FBQSxRQUFBO0FBQ0EsZUFBQSxZQUFBO0FBQ0EsYUFBQSxRQUFBLEdBQUEsQ0FBQSxPQUFBLFFBQUE7QUFDQSxhQUFBLE9BQUE7QUFDQSxLQUhBLEVBR0EsSUFIQTs7QUFLQSxHQVJBOztBQVVBLFNBQUEsWUFBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsTUFBQSxFQUFBLEVBQUEsUUFBQSxNQUFBLEVBQUE7QUFDQSxHQUZBOztBQUlBLFNBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxRQUFBLE9BQUEsRUFBQTtBQUNBLFNBQUEsTUFBQSxHQUFBLE9BQUEsSUFBQSxDQUFBLEVBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxDQUFBLE9BQUEsUUFBQTtBQUNBLFNBQUEsYUFBQSxHQUFBLENBQUEsT0FBQSxJQUFBLENBQUEsS0FBQTtBQUNBLFFBQUEsS0FBQSxRQUFBLEdBQUEsQ0FBQSxFQUFBO0FBQ0EsbUJBQUEsU0FBQSxDQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsUUFBQSx5Q0FBQSxRQUFBLE9BQUEsUUFBQSxFQUFBLE9BQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxLQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUE7QUFDQSxPQUpBO0FBS0EsS0FOQSxNQU9BLE9BQUEsS0FBQSxDQUFBLG9DQUFBO0FBQ0EsR0FiQTs7QUFlQSxTQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxPQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUE7QUFDQSxLQUZBLEVBRUEsSUFGQSxDQUVBLElBRkEsQ0FBQTtBQUdBLEdBSkE7O0FBTUEsU0FBQSxXQUFBOztBQUVBLFNBQUEsaUJBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxZQUFBLGVBQUEsR0FDQSxJQURBLENBQ0EsVUFBQSxJQUFBLEVBQUE7QUFDQSxjQUFBLEdBQUEsQ0FBQSxJQUFBO0FBQ0EsVUFBQSxDQUFBLElBQUEsRUFBQTtBQUNBLGVBQUEsY0FBQSxHQUFBLE1BQUE7QUFDQSxPQUZBLE1BRUE7QUFDQSxlQUFBLGNBQUEsR0FBQSxLQUFBLEVBQUE7QUFDQTtBQUNBLEtBUkEsQ0FBQTtBQVNBLEdBVkE7O0FBWUEsU0FBQSxpQkFBQTs7QUFFQSxTQUFBLG9CQUFBLEdBQUEsWUFBQTtBQUNBLFdBQUEsT0FBQSxnQkFBQTtBQUNBLEdBRkE7O0FBSUEsU0FBQSxvQkFBQTs7QUFFQSxTQUFBLFNBQUEsR0FBQSxZQUFBOzs7QUFHQSxRQUFBLHVCQUFBLE9BQUEsT0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsT0FBQSxNQUFBO0FBQ0EsS0FGQSxDQUFBOztBQUlBLFFBQUEsT0FBQSxjQUFBLEtBQUEsTUFBQSxFQUFBO0FBQ0EsYUFBQSxrQkFBQSxHQUFBLHlDQUFBO0FBQ0EsYUFBQSxnQkFBQSxHQUFBLElBQUE7QUFDQSxLQUhBLE1BR0EsSUFBQSxxQkFBQSxPQUFBLENBQUEsT0FBQSxjQUFBLE1BQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSxhQUFBLGtCQUFBLEdBQUEsK0RBQUE7QUFDQSxhQUFBLGdCQUFBLEdBQUEsSUFBQTs7QUFFQSxLQUpBLE1BSUEsSUFBQSxPQUFBLGNBQUEsS0FBQSxPQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsRUFBQSxFQUFBO0FBQ0EsZUFBQSxrQkFBQSxHQUFBLGlDQUFBO0FBQ0EsZUFBQSxnQkFBQSxHQUFBLElBQUE7QUFDQSxPQUhBLE1BR0E7O0FBRUEsWUFBQSxZQUFBO0FBQ0EsZ0JBQUEsT0FBQSxVQURBO0FBRUEsa0JBQUEsT0FBQSxJQUFBLENBQUE7QUFGQSxTQUFBO0FBSUEsZUFBQSxjQUFBLFVBQUEsQ0FBQSxTQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsY0FBQSxTQUFBLEVBQUE7QUFDQSxpQkFBQSxJQUFBLEdBQUEsRUFBQTs7QUFFQSxpQkFBQSxJQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFVBQUE7QUFDQSxpQkFBQSxJQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFNBQUE7QUFDQSxpQkFBQSxJQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFdBQUE7QUFDQSxpQkFBQSxJQUFBLENBQUEsUUFBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFFBQUE7QUFDQSxpQkFBQSxJQUFBLEdBQUEsVUFBQSxNQUFBLENBQUEsSUFBQTs7QUFFQSxpQkFBQSxPQUFBLENBQUEsSUFBQSxDQUFBLE1BQUE7QUFDQSxpQkFBQSxVQUFBLEdBQUEsSUFBQTtBQUNBLFNBYkEsQ0FBQTtBQWNBO0FBQ0EsR0F0Q0E7O0FBd0NBLFNBQUEsTUFBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxZQUFBLE1BQUEsQ0FBQSxNQUFBLEVB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QUEsRUFBQTtBQUNBLGlCQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxTQUFBLFNBREE7QUFFQSxnQkFBQSxZQUZBO0FBR0EsaUJBQUE7QUFIQSxHQUFBO0FBTUEsQ0FQQTtBQ0FBLElBQUEsVUFBQSxDQUFBLFVBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsVUFBQSxHQUFBLENBQUEsWUFBQSxFQUFBLFlBQUE7QUFDQSxTQUFBLElBQUEsR0FBQSxPQUFBO0FBQ0EsU0FBQSxLQUFBLEdBQUEsWUFBQTs7QUFFQSxTQUFBLGNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxFQUFBO0FBQ0EsR0FGQTs7QUFJQSxTQUFBLFVBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLGdCQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUNBLEdBRkE7O0FBSUEsY0FBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsV0FBQSxLQUFBLEVBQUEsSUFBQSxPQUFBLElBQUEsQ0FBQSxFQUFBLElBQUEsS0FBQSxPQUFBLEdBQUEsSUFBQSxHQUFBLEtBQUE7QUFDQSxHQUZBLEVBR0EsSUFIQSxDQUdBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsWUFBQSxHQUFBLENBQUEsTUFBQTtBQUNBLFdBQUEsVUFBQSxHQUFBLE1BQUE7QUFDQSxHQU5BOztBQVFBLFNBQUEsTUFBQSxHQUFBLFlBQUEsTUFBQTtBQUNBLENBdEJBOztBQ0FBLElBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxNQUFBLGNBQUEsRUFBQTs7QUFFQSxjQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsTUFBQSxHQUFBLENBQUEsZUFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsY0FBQSxHQUFBLENBQUEsU0FBQSxFQUFBLFNBQUEsSUFBQTtBQUNBLGFBQUEsU0FBQSxJQUFBO0FBQ0EsS0FKQSxDQUFBO0FBS0EsR0FOQTs7QUFRQSxjQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxNQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxTQUFBLElBQUE7QUFDQSxLQUhBLENBQUE7QUFJQSxHQUxBOztBQU9BLGNBQUEsTUFBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsV0FBQSxNQUFBLElBQUEsQ0FBQSxzQkFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLE9BQUEsRUFBQSxDQUFBLE1BQUEsQ0FEQSxDQUFBO0FBRUEsR0FIQTs7QUFLQSxTQUFBLFdBQUE7QUFDQSxDQXhCQTs7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGlCQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxTQUFBLGVBREE7QUFFQSxpQkFBQSw0QkFGQTtBQUdBLGdCQUFBLFVBSEE7QUFJQSxhQUFBO0FBQ0EsZUFBQSxpQkFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsZUFBQSxZQUFBLFNBQUEsQ0FBQSxhQUFBLE1BQUEsQ0FBQTtBQUNBLE9BSEE7QUFJQSxvQkFBQSxzQkFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsZUFBQSxZQUFBLFlBQUEsQ0FBQSxhQUFBLE1BQUEsQ0FBQTtBQUNBO0FBTkE7QUFKQSxHQUFBO0FBYUEsQ0FkQTs7QUNBQSxJQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQTs7QUFFQSxTQUFBLE1BQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTs7Ozs7QUFLQSxXQUFBLE9BQUEsRUFBQSxDQUFBLGVBQUEsRUFBQSxFQUFBLGFBQUEsV0FBQSxFQUFBLENBQUE7O0FBRUEsR0FQQTtBQVFBLENBVkE7O0FBWUEs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QSxPQUZBOztBQUlBLFlBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLFlBQUEsTUFBQSxHQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsaUJBQUEsRUFBQSxDQUFBLE1BQUE7QUFDQSxTQUZBLENBQUE7QUFHQSxPQUpBOztBQU1BLFVBQUEsVUFBQSxTQUFBLE9BQUEsR0FBQTtBQUNBLGVBQUEsWUFBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxTQUZBLENBQUE7QUFHQSxPQUpBOztBQU1BOztBQUVBLFVBQUEsYUFBQSxTQUFBLFVBQUEsR0FBQTtBQUNBLGNBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxPQUZBOztBQUlBLGlCQUFBLEdBQUEsQ0FBQSxZQUFBLFlBQUEsRUFBQSxPQUFBO0FBQ0EsaUJBQUEsR0FBQSxDQUFBLFlBQUEsYUFBQSxFQUFBLFVBQUE7QUFDQSxpQkFBQSxHQUFBLENBQUEsWUFBQSxjQUFBLEVBQUEsVUFBQTtBQUVBOztBQWhEQSxHQUFBO0FBb0RBLENBdERBOztBQ0FBOztBQUVBLElBQUEsU0FBQSxDQUFBLGFBQUEsRUFBQSxZQUFBO0FBQ0EsU0FBQTtBQUNBLFdBQUE7QUFDQSxvQkFBQTtBQURBLEtBREE7QUFJQSxjQUFBLEdBSkE7QUFLQSxpQkFBQTtBQUxBLEdBQUE7QUFPQSxDQVJBOztBQ0ZBLElBQUEsU0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBLGVBQUEsRUFBQTs7QUFFQSxTQUFBO0FBQ0EsY0FBQSxHQURBO0FBRUEsaUJBQUEseURBRkE7QUFHQSxVQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0EsWUFBQSxRQUFBLEdBQUEsZ0JBQUEsaUJBQUEsRUFBQTtBQUNBO0FBTEEsR0FBQTtBQVFBLENBVkEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnc29ja21hcmtldCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWJvdXQnLCB7XG4gICAgICAgIHVybDogJy9hYm91dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBYm91dENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Fib3V0L2Fib3V0Lmh0bWwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignQWJvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgRnVsbHN0YWNrUGljcykge1xuXG4gICAgLy8gSW1hZ2VzIG9mIGJlYXV0aWZ1bCBGdWxsc3RhY2sgcGVvcGxlLlxuICAgICRzY29wZS5pbWFnZXMgPSBfLnNodWZmbGUoRnVsbHN0YWNrUGljcyk7XG5cbn0pO1xuXG4iLCJhcHAuY29udHJvbGxlcignY2hlY2tvdXQnLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGN1cnJlbnRDYXJ0KSB7XG5cbn0pXG4iLCJhcHAuZGlyZWN0aXZlKCdkZXNpZ25WaWV3JywgZnVuY3Rpb24gKFNvY2tGYWN0b3J5LCAkc3RhdGUpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvZGVzaWduL2Rlc2lnbi12aWV3Lmh0bWwnLFxuXHRcdC8vIHNjb3BlOiB7XG5cdFx0Ly8gXHR0aGVTb2NrOiAnPSdcblx0XHQvLyB9LFxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIGRlc2lnblZpZXdDdHJsKSB7XG5cdFx0XHRcblx0XHRcdHZhciB0aXRsZSA9IHNjb3BlLnRpdGxlO1xuXHRcdFx0dmFyIGRlc2NyaXB0aW9uID0gc2NvcGUuZGVzY3JpcHRpb247XG5cdFx0XHR2YXIgdGFncyA9IHNjb3BlLnRhZ3M7XG5cdFx0XHR2YXIgY2FudmFzID0gZWxlbWVudC5maW5kKCdjYW52YXMnKVswXTtcblx0XHRcdHNjb3BlLnNhdmVEZXNpZ24gPSBmdW5jdGlvbiAodGl0bGUsIGRlc2NyaXB0aW9uLCB0YWdzKSB7XG5cdFx0XHRcdHZhciB0YWdzQXJyID0gU29ja0ZhY3RvcnkucHJlcGFyZVRhZ3ModGFncylcblx0XHRcdFx0Y29uc29sZS5sb2coJ1RBR1M6JywgdGFnc0Fycik7XG5cdFx0XHRcdHZhciBkYXRhVVJMID0gY2FudmFzLnRvRGF0YVVSTCgpXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKGRlc2NyaXB0aW9uKVxuXHRcdFx0XHR2YXIgbmV3U29ja0RhdGFPYmogPSB7XG5cdFx0XHRcdFx0dGl0bGU6IHRpdGxlLFxuXHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbixcblx0XHRcdFx0XHR0YWdzOiB0YWdzQXJyLFxuXHRcdFx0XHRcdGltYWdlOiBkYXRhVVJMXG5cdFx0XHRcdH07XG5cdFx0XHRcdHJldHVybiBTb2NrRmFjdG9yeS5zYXZlRGVzaWduKG5ld1NvY2tEYXRhT2JqKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRcdFx0aWYgKHJlc3VsdCkgJHN0YXRlLmdvKCd1c2VyJywge3VzZXJJZDogcmVzdWx0LmRhdGEudXNlcklkfSlcblx0XHRcdFx0fSlcblx0XHRcdH07XG5cblxuXHRcdFx0dmFyIGNvbG9yID0gJChcIi5zZWxlY3RlZFwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0dmFyIGNvbnRleHQgPSAkKFwiY2FudmFzXCIpWzBdLmdldENvbnRleHQoXCIyZFwiKTtcblx0XHRcdHZhciAkY2FudmFzID0gJChcImNhbnZhc1wiKTtcblx0XHRcdHZhciBsYXN0RXZlbnQ7XG5cdFx0XHR2YXIgbW91c2VEb3duID0gZmFsc2U7XG5cblx0XHRcdHZhciBiYWNrZ3JvdW5kID0gbmV3IEltYWdlKCk7XG5cblx0XHRcdC8vIGNvbnRleHQuZmlsbFN0eWxlID0gJyNmOGY4ZmYnO1xuXHRcdFx0Ly8gY29udGV4dC5vcGFjaXR5ID0gMDtcblx0XHRcdC8vIGNvbnRleHQuZmlsbCgpXG5cblx0XHRcdC8vIGZ1bmN0aW9uIGdlbmVyYXRlU29ja1VSTCgpe1xuXHRcdFx0Ly8gICBmdW5jdGlvbiBnZW5lcmF0ZVJhbmRvbU51bWJlcigpIHtcblx0XHRcdC8vICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMykgKyAxO1xuXHRcdFx0Ly8gICB9XG5cdFx0XHQvLyAgIHZhciBudW0gPSBnZW5lcmF0ZVJhbmRvbU51bWJlcigpO1xuXG5cdFx0XHQvLyAgIGlmIChudW0gPT09IDEpIHJldHVybiAnL3NvY2stYmcvJyArIG51bSArICcucG5nJ1xuXHRcdFx0Ly8gICBlbHNlIHJldHVybiAnL3NvY2stYmcvJyArIG51bSArICcuanBnJztcblx0XHRcdC8vIH1cblxuXHRcdFx0YmFja2dyb3VuZC5zcmMgPSAnL3NvY2stYmcvMS5wbmcnO1xuXG5cdFx0XHRiYWNrZ3JvdW5kLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ICBjb250ZXh0LmRyYXdJbWFnZShiYWNrZ3JvdW5kLCAwLCAwKTtcblx0XHRcdH07XG5cblx0XHRcdC8vV2hlbiBjbGlja2luZyBvbiBjb250cm9sIGxpc3QgaXRlbXNcblx0XHRcdCAgJChcIi5jb250cm9sc1wiKS5vbihcImNsaWNrXCIsIFwibGlcIiAsIGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgIC8vRGVzbGVjdCBzaWJsaW5nIGVsZW1lbnRzXG5cdFx0XHQgICAgICQodGhpcykuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAgICAvL1NlbGVjdCBjbGlja2VkIGVsZW1lbnRcblx0XHRcdCAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAgICAvL3N0b3JlIHRoZSBjb2xvclxuXHRcdFx0ICAgICBjb2xvciA9ICQodGhpcykuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdCAgfSk7XG5cblx0XHRcdC8vV2hlbiBcIkFkZCBDb2xvclwiIGJ1dHRvbiBpcyBwcmVzc2VkXG5cdFx0XHQgICQoXCIjcmV2ZWFsQ29sb3JTZWxlY3RcIikuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgIC8vU2hvdyBjb2xvciBzZWxlY3Qgb3IgaGlkZSB0aGUgY29sb3Igc2VsZWN0XG5cdFx0XHQgICAgY2hhbmdlQ29sb3IoKTtcblx0XHRcdCAgXHQkKFwiI2NvbG9yU2VsZWN0XCIpLnRvZ2dsZSgpO1xuXHRcdFx0ICB9KTtcblxuXHRcdFx0Ly9VcGRhdGUgdGhlIG5ldyBjb2xvciBzcGFuXG5cdFx0XHRmdW5jdGlvbiBjaGFuZ2VDb2xvcigpe1xuXHRcdFx0XHR2YXIgciA9ICQoXCIjcmVkXCIpLnZhbCgpO1xuXHRcdFx0XHR2YXIgZyA9ICQoXCIjZ3JlZW5cIikudmFsKCk7XG5cdFx0XHRcdHZhciBiID0gJChcIiNibHVlXCIpLnZhbCgpO1xuXHRcdFx0XHQkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2IoXCIgKyByICsgXCIsIFwiICsgZyArIFwiLCBcIiArIGIgKyBcIilcIik7XG5cdFx0XHQgIC8vV2hlbiBjb2xvciBzbGlkZXJzIGNoYW5nZVxuXG5cblx0XHRcdH1cblxuXHRcdFx0JChcImlucHV0W3R5cGU9cmFuZ2VdXCIpLm9uKFwiaW5wdXRcIiwgY2hhbmdlQ29sb3IpO1xuXG5cdFx0XHQvL3doZW4gXCJBZGQgQ29sb3JcIiBpcyBwcmVzc2VkXG5cdFx0XHQkKFwiI2FkZE5ld0NvbG9yXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0XHQgIC8vYXBwZW5kIHRoZSBjb2xvciB0byB0aGUgY29udHJvbHMgdWxcblx0XHRcdCAgdmFyICRuZXdDb2xvciA9ICQoXCI8bGk+PC9saT5cIik7XG5cdFx0XHQgICRuZXdDb2xvci5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsICQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKSk7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgdWxcIikuYXBwZW5kKCRuZXdDb2xvcik7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgbGlcIikuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzIGxpXCIpLmxhc3QoKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICBjb2xvciA9ICQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdCAgLy93aGVuIGFkZGVkLCByZXN0b3JlIHNsaWRlcnMgYW5kIHByZXZpZXcgY29sb3IgdG8gZGVmYXVsdFxuXHRcdFx0ICAkKFwiI2NvbG9yU2VsZWN0XCIpLmhpZGUoKTtcblx0XHRcdFx0dmFyIHIgPSAkKFwiI3JlZFwiKS52YWwoMCk7XG5cdFx0XHRcdHZhciBnID0gJChcIiNncmVlblwiKS52YWwoMCk7XG5cdFx0XHRcdHZhciBiID0gJChcIiNibHVlXCIpLnZhbCgwKTtcblx0XHRcdFx0JChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiKFwiICsgciArIFwiLCBcIiArIGcgKyBcIiwgXCIgKyBiICsgXCIpXCIpO1xuXG5cdFx0XHR9KVxuXG5cdFx0XHQvL09uIG1vdXNlIGV2ZW50cyBvbiB0aGUgY2FudmFzXG5cdFx0XHQkY2FudmFzLm1vdXNlZG93bihmdW5jdGlvbihlKXtcblx0XHRcdCAgbGFzdEV2ZW50ID0gZTtcblx0XHRcdCAgbW91c2VEb3duID0gdHJ1ZTtcblx0XHRcdH0pLm1vdXNlbW92ZShmdW5jdGlvbihlKXtcblx0XHRcdCAgLy9kcmF3IGxpbmVzXG5cdFx0XHQgIGlmIChtb3VzZURvd24pe1xuXHRcdFx0ICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0XHQgICAgY29udGV4dC5tb3ZlVG8obGFzdEV2ZW50Lm9mZnNldFgsbGFzdEV2ZW50Lm9mZnNldFkpO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZVRvKGUub2Zmc2V0WCwgZS5vZmZzZXRZKTtcblx0XHRcdCAgICBjb250ZXh0LnN0cm9rZVN0eWxlID0gY29sb3I7XG5cdFx0XHQgICAgY29udGV4dC5zdHJva2UoKTtcblx0XHRcdCAgICBjb250ZXh0LmxpbmVDYXAgPSAncm91bmQnO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZVdpZHRoID0gMjA7XG5cblx0XHRcdCAgICBsYXN0RXZlbnQgPSBlO1xuXHRcdFx0ICB9XG5cdFx0XHR9KS5tb3VzZXVwKGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgbW91c2VEb3duID0gZmFsc2U7XG5cdFx0XHR9KS5tb3VzZWxlYXZlKGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgJGNhbnZhcy5tb3VzZXVwKCk7XG5cdFx0XHR9KTtcblxuXG5cblxuXHRcdFx0Ly8gdmFyIHNrZXRjaCA9IGVsZW1lbnQuZmluZCgnI3NrZXRjaCcpO1xuXHRcdFx0Ly8gY29uc29sZS5sb2coc2tldGNoKTtcblx0XHRcdC8vIHZhciBza2V0Y2hTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoc2tldGNoKVxuXHRcdCAgICAvLyBjYW52YXMud2lkdGggPSBwYXJzZUludChza2V0Y2hTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpKTtcblx0XHQgICAgLy8gY2FudmFzLmhlaWdodCA9IHBhcnNlSW50KHNrZXRjaFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2hlaWdodCcpKTtcblxuXG5cblx0ICAgIFx0Ly8gdmFyIGNvbG9yID0gJ2JsYWNrJztcblx0XHQgICAgLy8gc2NvcGUuY2hhbmdlQ29sb3IgPSBmdW5jdGlvbiAoY2hvc2VuQ29sb3IpIHtcblx0XHQgICAgLy8gXHRjb2xvciA9IGNob3NlbkNvbG9yO1xuXHRcdCAgICAvLyBcdGNvbnNvbGUubG9nKCdDT0xPUicsIGNvbG9yKVxuXHRcdCAgICAvLyB9XHRcdCAgICBcblxuXHRcdCAgICAvLyB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cblx0XHQgICAgLy8gY3R4LmxpbmVXaWR0aCA9IDIwO1xuXHRcdCAgICAvLyBjdHgubGluZUpvaW4gPSAncm91bmQnO1xuXHRcdCAgICAvLyBjdHgubGluZUNhcCA9ICdyb3VuZCc7XG5cblx0XHQgICAgLy8gdmFyIGN1cnJlbnRNb3VzZVBvc2l0aW9uID0ge1xuXHRcdCAgICAvLyAgICAgeDogMCxcblx0XHQgICAgLy8gICAgIHk6IDBcblx0XHQgICAgLy8gfTtcblxuXHRcdCAgICAvLyB2YXIgbGFzdE1vdXNlUG9zaXRpb24gPSB7XG5cdFx0ICAgIC8vICAgICB4OiAwLFxuXHRcdCAgICAvLyAgICAgeTogMFxuXHRcdCAgICAvLyB9O1xuXG5cdFx0ICAgIC8vIHZhciBkcmF3aW5nID0gZmFsc2U7XG5cblx0XHQgICAgLy8gY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uIChlKSB7XG5cdFx0ICAgIC8vICAgICBkcmF3aW5nID0gdHJ1ZTtcblx0XHQgICAgLy8gICAgIGN1cnJlbnRNb3VzZVBvc2l0aW9uLnggPSBlLm9mZnNldFg7XG5cdFx0ICAgIC8vICAgICBjdXJyZW50TW91c2VQb3NpdGlvbi55ID0gZS5vZmZzZXRZO1xuXHRcdCAgICAvLyB9KTtcblxuXHRcdCAgICAvLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGZ1bmN0aW9uICgpIHtcblx0XHQgICAgLy8gICAgIGRyYXdpbmcgPSBmYWxzZTtcblx0XHQgICAgLy8gfSk7XG5cblx0XHQgICAgLy8gY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChlKSB7XG5cdFx0ICAgIC8vICAgICBpZiAoIWRyYXdpbmcpIHJldHVybjtcblxuXHRcdCAgICAvLyAgICAgbGFzdE1vdXNlUG9zaXRpb24ueCA9IGN1cnJlbnRNb3VzZVBvc2l0aW9uLng7XG5cdFx0ICAgIC8vICAgICBsYXN0TW91c2VQb3NpdGlvbi55ID0gY3VycmVudE1vdXNlUG9zaXRpb24ueTtcblxuXHRcdCAgICAvLyAgICAgY3VycmVudE1vdXNlUG9zaXRpb24ueCA9IGUub2Zmc2V0WDtcblx0XHQgICAgLy8gICAgIGN1cnJlbnRNb3VzZVBvc2l0aW9uLnkgPSBlLm9mZnNldFk7XG5cblx0XHQgICAgLy8gICAgIGNvbnNvbGUubG9nKCdQT1NJVElPTicsIGN1cnJlbnRNb3VzZVBvc2l0aW9uKVxuXG5cdFx0ICAgIC8vICAgICBkcmF3KGxhc3RNb3VzZVBvc2l0aW9uLCBjdXJyZW50TW91c2VQb3NpdGlvbiwgY29sb3IsIHRydWUpO1xuXG5cdFx0ICAgIC8vIH0pO1xuXG5cdFx0ICAgIC8vIHZhciBkcmF3ID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQsIHN0cm9rZUNvbG9yKSB7XG5cblx0XHQgICAgLy8gICAgIC8vIERyYXcgdGhlIGxpbmUgYmV0d2VlbiB0aGUgc3RhcnQgYW5kIGVuZCBwb3NpdGlvbnNcblx0XHQgICAgLy8gICAgIC8vIHRoYXQgaXMgY29sb3JlZCB3aXRoIHRoZSBnaXZlbiBjb2xvci5cblx0XHQgICAgLy8gICAgIGN0eC5iZWdpblBhdGgoKTtcblx0XHQgICAgLy8gICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZUNvbG9yIHx8ICdibGFjayc7XG5cdFx0ICAgIC8vICAgICBjdHgubW92ZVRvKHN0YXJ0LngsIHN0YXJ0LnkpO1xuXHRcdCAgICAvLyAgICAgY3R4LmxpbmVUbyhlbmQueCwgZW5kLnkpO1xuXHRcdCAgICAvLyAgICAgY3R4LmNsb3NlUGF0aCgpO1xuXHRcdCAgICAvLyAgICAgY3R4LnN0cm9rZSgpO1xuXG5cdFx0ICAgIC8vIH07XG5cblx0XHR9XG5cdH1cbn0pIiwiYXBwLmNvbnRyb2xsZXIoJ0Rlc2lnbkNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cbiAgJHNjb3BlLmhpID0gXCJoaVwiO1xuXG59KTsiLCJhcHAuZGlyZWN0aXZlKCdkZXNpZ25Tb2NrJywgZnVuY3Rpb24gKCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICBjb250cm9sbGVyOiAnRGVzaWduQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZGVzaWduL2Rlc2lnbi52aWV3Lmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkZXNpZ25WaWV3Jywge1xuICAgICAgdXJsOicvc29ja3MvZGVzaWduLzppZCcsXG4gICAgICBzY29wZToge1xuICAgICAgICB0aGVTb2NrOiAnPSdcbiAgICAgIH0sXG4gICAgICBjb250cm9sbGVyOiAnZGVzaWduVmlld0N0cmwnLFxuICAgICAgdGVtcGxhdGU6ICc8ZGVzaWduLXZpZXc+PC9kZXNpZ24tdmlldz4nLFxuICAgIH0pXG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignZGVzaWduVmlld0N0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCkge1xuXG4gICRodHRwLnBvc3QoJy9hcGkvdXNlci9tYXRjaElkJylcbiAgICAudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICByZXR1cm4gJHNjb3BlLnNob3dWaWV3ID0gcmVzXG4gICAgfSlcblxuXHQvLyAvLyAkc2NvcGUuZGVzY3JpcHRpb247XG5cdC8vICRzY29wZS50YWdzO1xuXHQvLyAkc2NvcGUudGl0bGU7XG5cdC8vIGNvbnNvbGUubG9nKCRzY29wZS5kZXNjcmlwdGlvbik7XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rlc2lnbicsIHtcbiAgICAgIHVybDonL2Rlc2lnbicsXG4gICAgICBjb250cm9sbGVyOiAnRGVzaWduQ29udHJvbGxlcicsXG4gICAgICB0ZW1wbGF0ZVVybDogJzxkZXNpZ24tc29jaz48L2Rlc2lnbi1zb2NrPidcbiAgICB9KVxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZG9jcycsIHtcbiAgICAgICAgdXJsOiAnL2RvY3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2RvY3MvZG9jcy5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ2hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdG1vc3RSZWNlbnRTb2NrczogZnVuY3Rpb24gKFNvY2tGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU29ja0ZhY3RvcnkubW9zdFJlY2VudFNvY2tzKClcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignaG9tZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBtb3N0UmVjZW50U29ja3MsICRzdGF0ZSwgJHN0YXRlUGFyYW1zKSB7XG5cbiAgJHNjb3BlLm1vc3RSZWNlbnRTb2NrcyA9IG1vc3RSZWNlbnRTb2Nrc1xuICAkc2NvcGUuc2VlU29jayA9IGZ1bmN0aW9uIChpZCkge1xuICAgICRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcbiAgfVxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcbiAgICAgICAgICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTtcblxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICB2YXIgZ2V0U3Rhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcbiAgICB9O1xuXG59KTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbicsIHtcbiAgICAgICAgdXJsOiAnL2FkbWluJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ2NhcnRDdXJyZW50JywgZnVuY3Rpb24gKCRzY29wZSwgT3JkZXJGYWN0b3J5LCBjdXJyZW50Q2FydCkge1xuICAkc2NvcGUuY3VycmVudCA9IGN1cnJlbnRDYXJ0XG59KVxuXG5cbmFwcC5jb250cm9sbGVyKCdjYXJ0SGlzdG9yeScsIGZ1bmN0aW9uICgkc2NvcGUsIE9yZGVyRmFjdG9yeSwgY2FydEhpc3RvcnkpIHtcblxuICAvLyAkc2NvcGUuY2FydEhpc3RvcnkgPSBjYXJ0SGlzdG9yeVxuXG59KVxuIiwiYXBwLmRpcmVjdGl2ZSgnY3VycmVudENhcnQnLCBmdW5jdGlvbiAoJHN0YXRlLCBPcmRlckZhY3RvcnkpIHtcblxuICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHNjb3BlOiB7fSxcbiAgICAgIHRlbXBsYXRlVXJsOiAnanMvb3JkZXIvY3VycmVudC5odG1sJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XG5cbiAgICAgICAgc2NvcGUudXBkYXRlID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgIHZhciBzb2NrID0ge1xuICAgICAgICAgICAgcXVhbnRpdHk6IGl0ZW0ubmV3QW1vdW50LFxuICAgICAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS51cGRhdGVJdGVtKHNvY2spXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24odXBkYXRlKXtcbiAgICAgICAgICAgIGl0ZW0ucXVhbnRpdHkgPSBpdGVtLm5ld0Ftb3VudDtcbiAgICAgICAgICAgIGl0ZW0ubmV3QW1vdW50ID0gbnVsbDtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2NvcGUuY2FsY1RvdGFsKClcbiAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuZGVsZXRlID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgIHZhciB0b2RlbGV0ZSA9IHsgaXRlbTogaXRlbSB9XG4gICAgICAgICAgT3JkZXJGYWN0b3J5LmRlbGV0ZUl0ZW0odG9kZWxldGUuaXRlbS5pZClcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLnNpbmdsZVNvY2tWaWV3ID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5jYWxjVG90YWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LmNhbGN1bGF0ZVRvdGFsKCdjdXJyZW50JylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihjYXJ0VG90YWwpIHsgc2NvcGUudG90YWwgPSBjYXJ0VG90YWwgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmNhbGNUb3RhbCgpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHNjb3BlLnRvdGFsKVxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuICAgICAgICAudGhlbihmdW5jdGlvbihjdXJyZW50KSB7IHNjb3BlLmN1cnJlbnRDYXJ0ID0gY3VycmVudCB9KVxuICAgIH1cbiAgfVxufSlcblxuYXBwLmRpcmVjdGl2ZSgnY2FydEhpc3RvcnknLCBmdW5jdGlvbigkc3RhdGUsIE9yZGVyRmFjdG9yeSkge1xuXG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICBzY29wZToge30sXG4gICAgdGVtcGxhdGVVcmw6ICdqcy9vcmRlci9oaXN0b3J5Lmh0bWwnLFxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICBzY29wZS5jYWxjVG90YWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5jYWxjdWxhdGVUb3RhbCgnaGlzdG9yeScpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGNhcnRUb3RhbCkgeyBzY29wZS50b3RhbFNwZW50ID0gY2FydFRvdGFsIH0pXG4gICAgICB9XG5cbiAgICAgIHNjb3BlLmNhbGNUb3RhbCgpXG4gICAgICAudGhlbihmdW5jdGlvbigpIHsgY29uc29sZS5sb2coc2NvcGUudG90YWxTcGVudCkgfSlcblxuICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnaGlzdG9yeScpXG4gICAgICAudGhlbihmdW5jdGlvbihoaXN0b3J5KSB7IHNjb3BlLmNhcnRIaXN0b3J5ID0gaGlzdG9yeSB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiXG5hcHAuZmFjdG9yeSgnT3JkZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApIHtcbiAgdmFyIGNhY2hlZENhcnQgPSBbXVxuICB2YXIgY2hlY2tDYXJ0ID0gZnVuY3Rpb24ob2JqLCBhcnIpIHtcbiAgICByZXR1cm4gYXJyLm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLnNvY2tJZCB9KS5pbmRleE9mKG9iai5zb2NrSWQpID09PSAtMSA/IGZhbHNlIDogdHJ1ZVxuICB9XG4gIHJldHVybiB7XG4gICAgYWRkVG9DYXJ0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvY3VycmVudCcpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHsgcmV0dXJuIGNoZWNrQ2FydChvYmosIHJlcy5kYXRhKSB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oaW5DYXJ0KSB7XG4gICAgICAgIGlmIChpbkNhcnQpIHtcbiAgICAgICAgICByZXR1cm4gXCJBbHJlYWR5IGluIENhcnQhXCJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9vcmRlci8nLCBvYmopXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7IHJldHVybiByZXMuZGF0YSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gICAgc2hvd0NhcnQ6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIC8vdHlwZSA9ICdjdXJyZW50JyB8fCB0eXBlID0gJ2hpc3RvcnknXG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyLycrdHlwZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKSB7XG4gICAgICAgIGNhY2hlZENhcnQgPSBvcmRlci5kYXRhXG4gICAgICAgIHJldHVybiBjYWNoZWRDYXJ0IHx8IFtdXG4gICAgICB9KVxuICAgIH0sXG4gICAgY2FsY3VsYXRlVG90YWw6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvJyt0eXBlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgY2FjaGVkQ2FydCA9IG9yZGVyLmRhdGFcbiAgICAgICAgcmV0dXJuIGNhY2hlZENhcnQgfHwgW11cbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihjYXJ0KSB7XG4gICAgICAgIGlmICh0eXBlPT09J2N1cnJlbnQnKSB7XG4gICAgICAgICAgcmV0dXJuIGNhcnQucmVkdWNlKGZ1bmN0aW9uKG8sIGl0ZW0pIHtyZXR1cm4gbyArIChcbiAgICAgICAgICAgIGl0ZW0uc29jay5wcmljZSppdGVtLnF1YW50aXR5KX0sIDApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGNhcnQucmVkdWNlKGZ1bmN0aW9uKG8sIG9yZGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbyArIG9yZGVyLml0ZW1zLnJlZHVjZShmdW5jdGlvbihvLCBpdGVtKSB7XG4gICAgICAgICAgICAgIHJldHVybiBvICsgKGl0ZW0uc29jay5wcmljZSppdGVtLnF1YW50aXR5KX0sIDApXG4gICAgICAgICAgfSwgMClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9LFxuICAgIHVwZGF0ZUl0ZW06IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICRodHRwLnB1dCgnL2FwaS9vcmRlcicsIG9iailcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uZGF0YSB9KVxuICAgIH0sXG4gICAgZGVsZXRlSXRlbTogZnVuY3Rpb24oaXRlbUlkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZGVsZXRlKCcvYXBpL29yZGVyLycraXRlbUlkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24odG9SZW1vdmUpIHtcbiAgICAgICAgY2FjaGVkQ2FydC5zcGxpY2UoY2FjaGVkQ2FydC5tYXAoZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5pZCB9KS5pbmRleE9mKGl0ZW1JZCksMSlcbiAgICAgICAgcmV0dXJuIGNhY2hlZENhcnRcbiAgICAgIH0pXG4gICAgfSxcbiAgICBlbnN1cmVDYXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvY3JlYXRlY2FydCcpXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICByZXR1cm4ge2V4aXN0czogb3JkZXIuZGF0YX1cbiAgICAgIH0pXG4gICAgfSxcblxuICB9XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2N1cnJlbnRDYXJ0Jywge1xuICAgIHVybDogJy9jYXJ0L2N1cnJlbnQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL29yZGVyL2NhcnQuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ2NhcnRDdXJyZW50Jyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRjdXJyZW50Q2FydDogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuXHRcdFx0XHRyZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdjdXJyZW50Jylcblx0XHRcdH1cblx0XHR9XG4gIH0pXG5cbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnRIaXN0b3J5Jywge1xuICAgIHVybDogJy9jYXJ0L2hpc3RvcnknLFxuICAgIHRlbXBsYXRlVXJsOiAnL2pzL29yZGVyL3Bhc3QuaHRtbCcsXG4gICAgY29udHJvbGxlcjogJ2NhcnRIaXN0b3J5JyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBjYXJ0SGlzdG9yeTogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdoaXN0b3J5Jyk7XG4gICAgICB9XG4gICAgfVxuICB9KVxuXG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ1BlcnNvbmFsSW5mb0N0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlLCB0aGVVc2VyLCBQZXJzb25hbEluZm9GYWN0b3J5KSB7XG5cblx0JHNjb3BlLnVzZXJJZCA9IHRoZVVzZXIuaWQ7XG5cdCRzY29wZS5hZGRyZXNzMSA9IHRoZVVzZXIuYWRkcmVzczE7XG5cdCRzY29wZS5hZGRyZXNzMiA9IHRoZVVzZXIuYWRkcmVzczI7XG5cdCRzY29wZS56aXAgPSB0aGVVc2VyLnppcDtcblx0JHNjb3BlLnN0YXRlID0gdGhlVXNlci5zdGF0ZTtcblx0JHNjb3BlLmNvdW50cnkgPSB0aGVVc2VyLmNvdW50cnk7XG5cdCRzY29wZS5waG9uZSA9IHRoZVVzZXIucGhvbmU7XG5cdCRzY29wZS5kaXNwbGF5RXJyb3IgPSBmYWxzZTtcblxuXHQvL29ubHkgYSB0ZW1wb3Jhcnkgc29sdXRpb24gLS0gY2hlY2tzIHRvIHNlZSBpZiB1c2VyIGlzIGEgbmV3IHVzZXIgYnkgc2VlaW5nIGlmIHRoZXkncmUgbG9nZ2VkIGluXG5cblx0Ly8gJHNjb3BlLmN1cnJlbnRVc2VySXNOZXcgPSBmdW5jdGlvbigpIHtcbiAvLyAgIFx0XHQgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpXG4gLy8gICBcdFx0LnRoZW4oZnVuY3Rpb24odXNlcil7XG4gLy8gICAgXHRcdGlmICghdXNlcikgcmV0dXJuICRzY29wZS5uZXdVc2VyID0gdHJ1ZTtcbiAvLyAgXHRcdFx0ZWxzZSByZXR1cm4gJHNjb3BlLm5ld1VzZXIgPSBmYWxzZTtcbiAvLyAgICBcdH0pXG4gLy8gXHR9XG5cbiAvLyBcdCRzY29wZS5jdXJyZW50VXNlcklzTmV3KCk7XG5cbiBcdGNvbnNvbGUubG9nKFwiaGVlZWVlZWVleVwiKTtcblxuXHQkc2NvcGUuc3VibWl0UGVyc29uYWwgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRpZiAoKCRzY29wZS5jb3VudHJ5ID09PSBcIlVuaXRlZCBTdGF0ZXNcIiB8fCAkc2NvcGUuY291bnRyeSA9PT0gXCJDYW5hZGFcIikgJiYgJHNjb3BlLnN0YXRlID09PSBcIlwiKSB7XG5cdFx0XHQkc2NvcGUuZGlzcGxheUVycm9yID0gdHJ1ZTtcblx0XHRcdHJldHVybiAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJJZiBpbiBVUyBvciBDYW5hZGEsIG11c3QgaW5jbHVkZSBTdGF0ZS9Qcm92aW5jZVwiO1xuXHRcdH1cblxuXHRcdHZhciB1c2VySW5mbyA9IHtcblx0XHRcdGFkZHJlc3MxIDogJHNjb3BlLmFkZHJlc3MxLFxuXHRcdFx0YWRkcmVzczIgOiAkc2NvcGUuYWRkcmVzczIsXG5cdFx0XHR6aXAgOiAkc2NvcGUuemlwLFxuXHRcdFx0c3RhdGUgOiAkc2NvcGUuc3RhdGUsXG5cdFx0XHRjb3VudHJ5IDogJHNjb3BlLmNvdW50cnksXG5cdFx0XHRwaG9uZSA6ICRzY29wZS5waG9uZVxuXHRcdH1cblxuXHRcdHJldHVybiBQZXJzb25hbEluZm9GYWN0b3J5LnN1Ym1pdCgkc2NvcGUudXNlcklkLCB1c2VySW5mbylcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHQvLyBpZiAoJHNjb3BlLm5ld1VzZXIpIFxuXHRcdFx0cmV0dXJuICRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdFx0Ly8gZWxzZSByZXR1cm4gJHN0YXRlLmdvKCd1c2VyJywge3VzZXJJZDogJHNjb3BlLnVzZXJJZH0pO1xuXHRcdH0pXG5cdH1cblxufSk7IiwiYXBwLmZhY3RvcnkoJ1BlcnNvbmFsSW5mb0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAvLyBQZXJzb25hbEZhY3RvcnkgPSB7fTtcblxuICByZXR1cm4ge1xuICAgIHN1Ym1pdCA6IGZ1bmN0aW9uKGlkLCB1c2VySW5mbyl7XG4gICAgICByZXR1cm4gJGh0dHAucHV0KCcvYXBpL3VzZXIvJyArIGlkLCB1c2VySW5mbylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncGVyc29uYWwnLCB7XG5cdFx0dXJsOiAnL3BlcnNvbmFsLzppZCcsXG5cdFx0Y29udHJvbGxlcjogJ1BlcnNvbmFsSW5mb0N0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3BlcnNvbmFsaW5mby9wZXJzb25hbGluZm8udmlldy5odG1sJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR0aGVVc2VyOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBVc2VyRmFjdG9yeSl7XG5cdFx0XHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLmlkKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufSk7IiwiYXBwLmZhY3RvcnkoJ1NvY2tGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwLCAkc3RhdGUpIHtcblxuICByZXR1cm4ge1xuICAgIHNpbmdsZVNvY2s6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrLycrc29ja0lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgc29ja0J5VXNlcklkOiBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay9ieVVzZXIvJyArIHVzZXJJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIG1vc3RSZWNlbnRTb2NrczogZnVuY3Rpb24gKCkge1xuICAgIFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL3JlY2VudCcpXG4gICAgXHQudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICBcdFx0cmV0dXJuIHJlcy5kYXRhXG4gICAgXHR9KVxuICAgIH0sXG5cbiAgICBzYXZlRGVzaWduOiBmdW5jdGlvbiAobmV3U29ja0RhdGFPYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svJywgbmV3U29ja0RhdGFPYmopXG4gICAgfSxcblxuICAgIHByZXBhcmVUYWdzOiBmdW5jdGlvbiAodGFnSW5wdXQpIHtcbiAgICAgIHJldHVybiB0YWdJbnB1dC5zcGxpdCgnICcpLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgIGUgPSBlLnJlcGxhY2UoLywvaSwgXCJcIik7XG4gICAgICAgIGUgPSBlLnN1YnN0cmluZygxKTtcbiAgICAgICAgcmV0dXJuIGVcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB1cHZvdGU6IGZ1bmN0aW9uIChzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svdXB2b3RlJywge2lkOiBzb2NrSWR9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlcy5kYXRhKVxuICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBkb3dudm90ZTogZnVuY3Rpb24gKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay9kb3dudm90ZScsIHtpZDogc29ja0lkfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBkZWxldGU6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay9kZWxldGUvJyArIGlkKVxuICAgICAgLnRoZW4oJHN0YXRlLmdvKCdob21lJykpXG4gICAgfVxuXG4gIH1cblxufSlcbiIsIi8vIGFwcC5jb250cm9sbGVyKCdzb2NrVmlld0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBTb2NrRmFjdG9yeSwgUmV2aWV3RmFjdG9yeSkge1xuXG4vLyAgICRzY29wZS5zZXRTb2NrID0gZnVuY3Rpb24oc29ja0lkKSB7XG4vLyAgICAgcmV0dXJuIFNvY2tGYWN0b3J5LnNpbmdsZVNvY2soc29ja0lkKSAvLyByZXR1cm4/XG4vLyAgICAgLnRoZW4oZnVuY3Rpb24oc29jaykge1xuLy8gICAgICAgJHNjb3BlLnNvY2sgPSBzb2NrXG4vLyAgICAgfSlcbi8vICAgfVxuXG4vLyAgICRzY29wZS5zZXRSZXZpZXdzID0gZnVuY3Rpb24oc29ja0lkKSB7XG4vLyAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucHJvZHVjdFJldmlld3Moc29ja0lkKVxuLy8gICAgIC50aGVuKGZ1bmN0aW9uKHJldmlld3MpIHtcbi8vICAgICAgICRzY29wZS5yZXZpZXdzID0gcmV2aWV3c1xuLy8gICAgIH0pXG4vLyAgIH1cblxuLy8gICAkc2NvcGUuc2V0U29jaygxKTtcbi8vICAgJHNjb3BlLnNldFJldmlld3MoMSk7XG5cbi8vICAgJHNjb3BlLm5ld1JldmlldyA9IGZ1bmN0aW9uKCkge1xuLy8gICAgIHZhciBuZXdSZXZpZXcgPSB7XG4vLyAgICAgICB0ZXh0OiAkc2NvcGUucmV2aWV3VGV4dCxcbi8vICAgICAgIHNvY2tJZDogJHNjb3BlLnNvY2suaWRcbi8vICAgICB9XG4vLyAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucG9zdFJldmlldyhuZXdSZXZpZXcpXG4vLyAgICAgLnRoZW4oZnVuY3Rpb24obmV3UmV2aWV3KXtcbi8vICAgICAgIHZhciByZXZpZXcgPSB7fTtcbi8vICAgICAgIHJldmlldy51c2VyID0ge307XG5cbi8vICAgICAgICAgcmV2aWV3LnVzZXIuZmlyc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmZpcnN0X25hbWU7XG4vLyAgICAgICAgIHJldmlldy51c2VyLmxhc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmxhc3RfbmFtZTtcbi8vICAgICAgICAgcmV2aWV3LnVzZXIucHJvZmlsZV9waWMgPSBuZXdSZXZpZXcudXNlci5wcm9maWxlX3BpYztcbi8vICAgICAgICAgcmV2aWV3LnVzZXIudXNlcm5hbWUgPSBuZXdSZXZpZXcudXNlci51c2VybmFtZTtcbi8vICAgICAgICAgcmV2aWV3LnRleHQgPSBuZXdSZXZpZXcucmV2aWV3LnRleHQ7XG5cbi8vICAgICAgICRzY29wZS5yZXZpZXdzLnB1c2gocmV2aWV3KTtcbi8vICAgICAgICRzY29wZS5yZXZpZXdUZXh0ID0gbnVsbDtcbi8vICAgICB9KVxuLy8gICB9XG5cbi8vICAgJHNjb3BlLmFscmVhZHlQb3N0ZWQgPSBmdW5jdGlvbigpIHtcbi8vICAgICAvLyBhZGQgaW4gYWZ0ZXIgZmluaXNoaW5nIG90aGVyIHN0dWZmXG4vLyAgIH1cblxuLy8gfSk7XG5cbi8vIGFwcC5jb250cm9sbGVyKCdzb2NrSWRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMsIHRoZVNvY2ssIHRoZVJldmlld3MsIFJldmlld0ZhY3RvcnksIE9yZGVyRmFjdG9yeSwgQXV0aFNlcnZpY2UpIHtcblxuLy8gICAvLyAkc2NvcGUuZGF0ZVBhcnNlciA9IGZ1bmN0aW9uKGRhdGUpe1xuXG4vLyAgIC8vICAgLy9yZXR1cm4gdG8gdGhpcyBsYXRlci4gV291bGQgYmUgZ29vZCBpZiBzb2NrcyBhbmQgcmV2aWV3cyBzdGF0ZWQgd2hlbiB0aGV5IHdlcmUgcG9zdGVkXG5cbiAgLy8gICAvL3Nob3VsZCBhZGQgaXQgdG8gYSBmYWN0b3J5LCBiZWNhdXNlIG1hbnkgcGFnZXMgY2FuIG1ha2UgdXNlIG9mIGl0XG5cbiAgLy8gICB2YXIgbW9udGhPYmogPSB7XG4gIC8vICAgICAnMDEnOiBcIkphbnVhcnlcIixcbiAgLy8gICAgICcwMic6IFwiRmVicnVhcnlcIixcbiAgLy8gICAgICcwMyc6IFwiTWFyY2hcIixcbiAgLy8gICAgICcwNCc6IFwiQXByaWxcIixcbiAgLy8gICAgICcwNSc6IFwiTWF5XCIsXG4gIC8vICAgICAnMDYnOiBcIkp1bmVcIixcbiAgLy8gICAgICcwNyc6IFwiSnVseVwiLFxuICAvLyAgICAgJzA4JzogXCJBdWd1c3RcIixcbiAgLy8gICAgICcwOSc6IFwiU2VwdGVtYmVyXCIsXG4gIC8vICAgICAnMTAnOiBcIk9jdG9iZXJcIixcbiAgLy8gICAgICcxMSc6IFwiTm92ZW1iZXJcIixcbiAgLy8gICAgICcxMic6IFwiRGVjZW1iZXJcIlxuICAvLyAgIH1cblxuICAvLyB9XG5cbmFwcC5jb250cm9sbGVyKCdzb2NrSWRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBBdXRoU2VydmljZSwgJHN0YXRlUGFyYW1zLCB0aGVTb2NrLCB0aGVSZXZpZXdzLCBSZXZpZXdGYWN0b3J5LCBPcmRlckZhY3RvcnksIFNvY2tGYWN0b3J5LCBVc2VyRmFjdG9yeSkge1xuXG5cblxuICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IGZhbHNlO1xuICAkc2NvcGUuc29jayA9IHRoZVNvY2s7XG4gICRzY29wZS5yZXZpZXdzID0gdGhlUmV2aWV3cztcblxuICAkc2NvcGUuYWxlcnQgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICRzY29wZS5hbGVydGluZyA9ICEkc2NvcGUuYWxlcnRpbmc7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICRzY29wZS5hbGVydGluZyA9ICEkc2NvcGUuYWxlcnRpbmdcbiAgICAgICRzY29wZS4kZGlnZXN0KClcbiAgICB9LCAzMDAwKVxuICAgIC8vIGlmICghJHNjb3BlLmFsZXJ0aW5nKSAkc2NvcGUubWVzc2FnZSA9PT0gbnVsbFxuICB9XG5cbiAgJHNjb3BlLmdvVG9Vc2VyUGFnZSA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICRzdGF0ZS5nbygndXNlcicsIHt1c2VySWQ6IHVzZXJJZH0pO1xuICB9XG5cbiAgJHNjb3BlLmFkZEl0ZW0gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbSA9IHt9O1xuICAgIGl0ZW0uc29ja0lkID0gJHNjb3BlLnNvY2suaWQ7XG4gICAgaXRlbS5xdWFudGl0eSA9ICskc2NvcGUucXVhbnRpdHk7XG4gICAgaXRlbS5vcmlnaW5hbFByaWNlID0gKyRzY29wZS5zb2NrLnByaWNlO1xuICAgIGlmIChpdGVtLnF1YW50aXR5ID4gMCkge1xuICAgICAgT3JkZXJGYWN0b3J5LmFkZFRvQ2FydChpdGVtKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXNwb25zZSAhPT0gXCJvYmplY3RcIikgJHNjb3BlLmFsZXJ0KHJlc3BvbnNlKTtcbiAgICAgICAgZWxzZSAkc3RhdGUuZ28oJ2N1cnJlbnRDYXJ0Jyk7XG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlICRzY29wZS5hbGVydCgnWW91IGhhdmUgdG8gYWRkIGF0IGxlYXN0IG9uZSBzb2NrIScpO1xuICB9XG5cbiAgJHNjb3BlLmRpc3BsYXlUYWdzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICRzY29wZS5zb2NrLnRhZ3MubWFwKGZ1bmN0aW9uKHRhZyl7XG4gICAgICByZXR1cm4gJyMnICsgdGFnO1xuICAgIH0pLmpvaW4oXCIsIFwiKTtcbiAgfVxuXG4gICRzY29wZS5kaXNwbGF5VGFncygpO1xuXG4gICRzY29wZS5nZXRMb2dnZWRJblVzZXJJZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKVxuICAgIC50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgY29uc29sZS5sb2codXNlcik7XG4gICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgJHNjb3BlLmxvZ2dlZEluVXNlcklkID0gJ25vbmUnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmxvZ2dlZEluVXNlcklkID0gdXNlci5pZDtcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgJHNjb3BlLmdldExvZ2dlZEluVXNlcklkKCk7XG5cbiAgJHNjb3BlLnVzZXJDYW5ub3RQb3N0UmV2aWV3ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZDtcbiAgfVxuXG4gICRzY29wZS51c2VyQ2Fubm90UG9zdFJldmlldygpO1xuXG4gICRzY29wZS5uZXdSZXZpZXcgPSBmdW5jdGlvbigpIHtcblxuICAvL2lmIHVzZXIgaGFzIGFscmVhZHkgcmV2aWV3IHNvY2ssIGRvbid0IGFsbG93IHVzZXIgdG8gcmV2aWV3IGl0IGFnYWluXG4gICAgdmFyIHVzZXJzV2hvUmV2aWV3ZWRTb2NrID0gJHNjb3BlLnJldmlld3MubWFwKGZ1bmN0aW9uKHJldmlldyl7XG4gICAgICByZXR1cm4gcmV2aWV3LnVzZXJJZDtcbiAgICB9KVxuXG4gICAgaWYgKCRzY29wZS5sb2dnZWRJblVzZXJJZCA9PT0gJ25vbmUnKSB7XG4gICAgICAkc2NvcGUucmV2aWV3RXJyb3JNZXNzYWdlID0gXCJZb3UgbXVzdCBiZSBsb2dnZWQgaW4gdG8gcmV2aWV3IGEgc29jayFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHVzZXJzV2hvUmV2aWV3ZWRTb2NrLmluZGV4T2YoJHNjb3BlLmxvZ2dlZEluVXNlcklkKSAhPT0gLTEpIHtcbiAgICAgICRzY29wZS5yZXZpZXdFcnJvck1lc3NhZ2UgPSBcIllvdSd2ZSBhbHJlYWR5IHJldmlld2VkIHRoaXMgc29jayEgWW91IGNhbid0IHJldmlldyBpdCBhZ2FpbiFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgLy9pZiBzb2NrIGlkIG1hdGNoZXMgdXNlciBpZCwgdXNlciBkb24ndCBhbGxvdyB1c2VyIHRvIHBvc3QgYSByZXZpZXdcbiAgICB9IGVsc2UgaWYgKCRzY29wZS5sb2dnZWRJblVzZXJJZCA9PT0gJHNjb3BlLnNvY2sudXNlci5pZCkge1xuICAgICAgJHNjb3BlLnJldmlld0Vycm9yTWVzc2FnZSA9IFwiWW91IGNhbid0IHJldmlldyB5b3VyIG93biBzb2NrIVwiO1xuICAgICAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIHZhciBuZXdSZXZpZXcgPSB7XG4gICAgICAgIHRleHQ6ICRzY29wZS5yZXZpZXdUZXh0LFxuICAgICAgICBzb2NrSWQ6ICRzY29wZS5zb2NrLmlkXG4gICAgICB9XG4gICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wb3N0UmV2aWV3KG5ld1JldmlldylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG5ld1Jldmlldyl7XG4gICAgICAgIHZhciByZXZpZXcgPSB7fTtcbiAgICAgICAgcmV2aWV3LnVzZXIgPSB7fTtcblxuICAgICAgICAgIHJldmlldy51c2VyLmZpcnN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5maXJzdF9uYW1lO1xuICAgICAgICAgIHJldmlldy51c2VyLmxhc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmxhc3RfbmFtZTtcbiAgICAgICAgICByZXZpZXcudXNlci5wcm9maWxlX3BpYyA9IG5ld1Jldmlldy51c2VyLnByb2ZpbGVfcGljO1xuICAgICAgICAgIHJldmlldy51c2VyLnVzZXJuYW1lID0gbmV3UmV2aWV3LnVzZXIudXNlcm5hbWU7XG4gICAgICAgICAgcmV2aWV3LnRleHQgPSBuZXdSZXZpZXcucmV2aWV3LnRleHQ7XG5cbiAgICAgICAgJHNjb3BlLnJldmlld3MucHVzaChyZXZpZXcpO1xuICAgICAgICAkc2NvcGUucmV2aWV3VGV4dCA9IG51bGw7XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gICRzY29wZS51cHZvdGUgPSBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICByZXR1cm4gU29ja0ZhY3RvcnkudXB2b3RlKHNvY2tJZClcbiAgICAudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAkc2NvcGUuc29jay51cHZvdGVzKytcbiAgICB9KVxuICB9XG4gIFxuICAkc2NvcGUuZG93bnZvdGUgPSBmdW5jdGlvbiAoc29ja0lkKSB7XG4gICAgcmV0dXJuIFNvY2tGYWN0b3J5LmRvd252b3RlKHNvY2tJZClcbiAgICAudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAkc2NvcGUuc29jay5kb3dudm90ZXMrK1xuICAgIH0pXG4gIH1cblxuICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiB1c2VyLmlkID09ICRzY29wZS5zb2NrLlVzZXJJZCB8fCB1c2VyLmlzQWRtaW4/IHRydWUgOiBmYWxzZVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgJHNjb3BlLnZlcmlmeVVzZXIgPSByZXN1bHRcbiAgICB9KTtcblxuICAkc2NvcGUuZGVsZXRlID0gU29ja0ZhY3RvcnkuZGVsZXRlXG5cbn0pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgLy8gJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NvY2tzJywge1xuICAgIC8vICAgICB1cmw6ICcvc29ja3MnLFxuICAgIC8vICAgICBjb250cm9sbGVyOiAnc29ja1ZpZXdDb250cm9sbGVyJyxcbiAgICAvLyAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0dmlldy9wcm9kdWN0dmlldy5odG1sJ1xuICAgIC8vIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpbmdsZVNvY2tWaWV3Jywge1xuICAgICAgdXJsOicvc29ja3MvOmlkJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdzb2NrSWRDb250cm9sbGVyJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuaHRtbCcsXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIHRoZVNvY2s6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFNvY2tGYWN0b3J5KSB7XG4gICAgICAgICAgcmV0dXJuIFNvY2tGYWN0b3J5LnNpbmdsZVNvY2soJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICB9LFxuICAgICAgICB0aGVSZXZpZXdzOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBSZXZpZXdGYWN0b3J5KSB7XG4gICAgICAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucHJvZHVjdFJldmlld3MoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmV2aWV3RmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gIHJldHVybiB7XG4gICAgcG9zdFJldmlldzogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9yZXZpZXcvJywgb2JqKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9LFxuICAgIHByb2R1Y3RSZXZpZXdzOiBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcmV2aWV3L3NvY2svJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NlYXJjaFJlc3VsdHMnLCB7XG5cdFx0dXJsOiAnL3NlYXJjaC86c2VhcmNoVGVybXMnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3NlYXJjaHJlc3VsdHMvc2VhcmNoLnZpZXcuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogXCJzZWFyY2hDdHJsXCIsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0YWxsUmVzdWx0czogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgU2VhcmNoRmFjdG9yeSkge1xuXHRcdFx0XHRyZXR1cm4gU2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0KCRzdGF0ZVBhcmFtcy5zZWFyY2hUZXJtcylcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIGFsbFJlc3VsdHMpIHtcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gYWxsUmVzdWx0cztcblx0XHQvLyBcdGNvbnNvbGUubG9nKFwiQWxsIFJlc3VsdHMhIVwiLCBhbGxSZXN1bHRzKTtcblx0XHQvLyBcdCRzY29wZS5udW1iZXIgPSAxMjM7XG5cdFx0Ly8gfVxuXHRcdC8vIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcykge1xuXHRcdC8vIFx0Y29uc29sZS5sb2coXCJIRVJFRUVFRVwiLCAkc3RhdGVQYXJhbXMucmVzdWx0cylcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gJHN0YXRlUGFyYW1zLnJlc3VsdHNcblx0XHQvLyB9XG5cdH0pXG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ1NpZ251cEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBTaWdudXBGYWN0b3J5LCAkc3RhdGUpIHtcblxuICBmdW5jdGlvbiBwYXNzd29yZFZhbGlkIChwYXNzd29yZCkge1xuICAgIGlmIChwYXNzd29yZC5sZW5ndGggPCA2KSB7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlBhc3N3b3JkIG11c3QgYmUgNiBjaGFyYWN0ZXJzIGxvbmchXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChwYXNzd29yZCAhPT0gJHNjb3BlLnB3Mikge1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJUaGUgcGFzc3dvcmQgZmllbGRzIGRvbid0IG1hdGNoIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoL1xcVy8udGVzdChwYXNzd29yZCkpe1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJQYXNzd29yZCBjYW5ub3QgY29udGFpbiBzcGVjaWFsIGNoYXJhY3RlcnMhXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gICRzY29wZS5zaG93RXJyb3IgPSBmYWxzZTtcblxuICAkc2NvcGUuZGlzcGxheUVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICRzY29wZS5zaG93RXJyb3I7XG4gIH1cblxuICAkc2NvcGUuc3VibWl0U2lnbnVwID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChwYXNzd29yZFZhbGlkKCRzY29wZS5wYXNzd29yZCkpe1xuICAgICAgY29uc29sZS5sb2coXCJub3cgSSBkb24ndCB3b3JrIVwiKTtcbiAgICAgIHJldHVybiBTaWdudXBGYWN0b3J5LnN1Ym1pdCh7XG4gICAgICAgZW1haWw6ICRzY29wZS5lbWFpbCxcbiAgICAgICB1c2VybmFtZTogJHNjb3BlLnVzZXJuYW1lLFxuICAgICAgIHBhc3N3b3JkOiAkc2NvcGUucGFzc3dvcmQsXG4gICAgICAgZmlyc3RfbmFtZTogJHNjb3BlLmZpcnN0bmFtZSxcbiAgICAgICBsYXN0X25hbWU6ICRzY29wZS5sYXN0bmFtZSxcbiAgICAgICBpc0FkbWluOiBmYWxzZSxcbiAgICAgICBuZXdVc2VyOiB0cnVlXG4gICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAvLyByZXNwb25zZS5uZXdVc2VyID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuICRzdGF0ZS5nbygncGVyc29uYWwnLCB7aWQ6IHJlc3BvbnNlLmlkfSk7XG4gICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbn0pOyIsIi8vIGFwcC5mYWN0b3J5KCdTaWdudXBGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbi8vICAgdmFyIFNpZ251cEZhY3RvcnkgPSB7fTtcblxuLy8gICBTaWdudXBGYWN0b3J5LnN1Ym1pdCA9IGZ1bmN0aW9uKHVzZXJJbmZvKXtcbi8vICAgXHRjb25zb2xlLmxvZyh1c2VySW5mbyk7XG4vLyAgIFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci8nLCB1c2VySW5mbylcbi8vICAgXHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4vLyAgIFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcbi8vICAgXHR9KVxuLy8gICB9XG5cbi8vICAgcmV0dXJuIFNpZ251cEZhY3Rvcnk7XG5cbi8vIH0pXG5cbmFwcC5mYWN0b3J5KCdTaWdudXBGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBTaWdudXBGYWN0b3J5ID0ge307XG5cblx0U2lnbnVwRmFjdG9yeS5zdWJtaXQgPSBmdW5jdGlvbiAodXNlckluZm8pIHtcblx0XHRjb25zb2xlLmxvZyhcIkZyb20gU2lnbnVwIEZhY3RvcnlcIiwgdXNlckluZm8pO1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvJywgdXNlckluZm8pXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0fSlcblx0fVxuXHRyZXR1cm4gU2lnbnVwRmFjdG9yeTtcbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnbnVwJywge1xuXHRcdHVybDogJy9zaWdudXAnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDdHJsJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9zaWdudXAvc2lnbnVwLnZpZXcuaHRtbCdcblx0fSk7XG5cbn0pOyIsImFwcC5jb250cm9sbGVyKCdVc2VyQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgdGhlVXNlciwgdGhlVXNlclNvY2tzLCBBdXRoU2VydmljZSwgVXNlckZhY3RvcnkpIHtcbiAgICBjb25zb2xlLmxvZyhcImNvbnRyb2xsZXJcIiwgdGhlVXNlclNvY2tzKTtcblx0JHNjb3BlLnVzZXIgPSB0aGVVc2VyO1xuXHQkc2NvcGUuc29ja3MgPSB0aGVVc2VyU29ja3M7XG5cblx0JHNjb3BlLnRvU2hpcHBpbmdJbmZvID0gZnVuY3Rpb24oaWQpe1xuXHRcdCRzdGF0ZS5nbygncGVyc29uYWwnLCB7aWQ6IGlkfSk7XG5cdH07XG5cblx0JHNjb3BlLnRvU29ja1ZpZXcgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHQkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG5cdH07XG5cblx0QXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gdXNlci5pZCA9PSAkc2NvcGUudXNlci5pZCB8fCB1c2VyLmlzQWRtaW4gPyB0cnVlIDogZmFsc2VcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICBcdGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICBcdCRzY29wZS52ZXJpZnlVc2VyID0gcmVzdWx0XG4gICAgfSk7XG5cbiAgICAkc2NvcGUuZGVsZXRlID0gVXNlckZhY3RvcnkuZGVsZXRlXG59KVxuIiwiYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwLCAkc3RhdGUpIHtcblx0dmFyIFVzZXJGYWN0b3J5ID0ge307XG5cblx0VXNlckZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS91c2VyLycgKyBpZClcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZmFjdG9yeVwiLCByZXNwb25zZS5kYXRhKVxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGFcblx0XHR9KVxuXHR9XG5cblx0VXNlckZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS91c2VycycpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YVxuXHRcdH0pXG5cdH1cblxuXHRVc2VyRmFjdG9yeS5kZWxldGUgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2VyL2RlbGV0ZS8nICsgaWQpXG5cdFx0LnRoZW4oJHN0YXRlLmdvKCdob21lJykpXG5cdH1cblxuXHRyZXR1cm4gVXNlckZhY3Rvcnk7XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VzZXInLCB7XG5cdFx0dXJsOiAnL3VzZXIvOnVzZXJJZCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvdXNlci91c2VyLXByb2ZpbGUuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1VzZXJDdHJsJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR0aGVVc2VyOiBmdW5jdGlvbiAoVXNlckZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuXHRcdFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy51c2VySWQpO1xuXHRcdFx0fSxcblx0XHRcdHRoZVVzZXJTb2NrczogZnVuY3Rpb24gKFNvY2tGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0cmV0dXJuIFNvY2tGYWN0b3J5LnNvY2tCeVVzZXJJZCgkc3RhdGVQYXJhbXMudXNlcklkKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pXG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ25hdmJhckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIFNlYXJjaEZhY3RvcnkpIHtcblxuXHQkc2NvcGUuc2VhcmNoID0gZnVuY3Rpb24oc2VhcmNoVGVybXMpe1xuXHRcdC8vIFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dChzZWFyY2hUZXJtcylcblx0XHQvLyAudGhlbihmdW5jdGlvbihyZXN1bHRzKXtcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gcmVzdWx0cztcblx0XHQvLyBcdGNvbnNvbGUubG9nKHJlc3VsdHMpO1xuXHRcdFx0cmV0dXJuICRzdGF0ZS5nbygnc2VhcmNoUmVzdWx0cycsIHtzZWFyY2hUZXJtczogc2VhcmNoVGVybXN9KTtcblx0XHQvLyB9KVxuXHR9XG59KVxuXG5hcHAuY29udHJvbGxlcignc2VhcmNoQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgYWxsUmVzdWx0cywgJHN0YXRlUGFyYW1zKSB7XG5cdCRzY29wZS5yZXN1bHRzID0gYWxsUmVzdWx0cztcblx0JHNjb3BlLnNlZVNvY2sgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHQkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG5cdH1cbn0pIiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmZhY3RvcnkoXCJTZWFyY2hGYWN0b3J5XCIsIGZ1bmN0aW9uICgkaHR0cCkge1xuXHR2YXIgU2VhcmNoRmFjdG9yeSA9IHt9O1xuXG5cdFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dCA9IGZ1bmN0aW9uICh0ZXh0KSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9zZWFyY2gvP3E9JyArIHRleHQpXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzdWx0cykge1xuXHRcdFx0cmV0dXJuIHJlc3VsdHMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0cmV0dXJuIFNlYXJjaEZhY3Rvcnk7XG59KSIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUsIE9yZGVyRmFjdG9yeSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBPcmRlckZhY3RvcnkuZW5zdXJlQ2FydCgpXG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNeSBQcm9maWxlJywgc3RhdGU6ICd1c2VyKHt1c2VySWQ6dXNlci5pZH0pJywgYXV0aDogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIC8vIHsgbGFiZWw6ICdBYm91dCcsIHN0YXRlOiAnYWJvdXQnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0Rlc2lnbiBhIFNvY2snLCBzdGF0ZTogJ2Rlc2lnblZpZXcnIH0sXG4gICAgICAgICAgICAgICAgLy8geyBsYWJlbDogJ0FkbWluIERhc2hib2FyZCcsIHN0YXRlOiAnYWRtaW4nfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUuYWRtaW5JdGVtcyA9IFtcbiAgICAgICAgICAgICAgICB7bGFiZWw6ICdBZG1pbiBEYXNoYm9hcmQnLCBzdGF0ZTogJ2FkbWluJ31cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpXG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdvYXV0aEJ1dHRvbicsIGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICBzY29wZToge1xuICAgICAgcHJvdmlkZXJOYW1lOiAnQCdcbiAgICB9LFxuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmh0bWwnXG4gIH1cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
>>>>>>> master
