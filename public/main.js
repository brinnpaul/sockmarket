'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

window.app = angular.module('sockmarket', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'stripe']);

app.config(function ($urlRouterProvider, $locationProvider) {
  // This turns off hashbang urls (/#about) and changes it to something normal (/about)
  $locationProvider.html5Mode(true);
  // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
  $urlRouterProvider.otherwise('/');
  // Trigger page refresh when accessing an OAuth route
  $urlRouterProvider.when('/auth/:provider', function () {
    window.location.reload();
  });
  Stripe.setPublishableKey('pk_test_Rd7nMpSZMqRNuB4zjEeZHt1d');
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

app.controller('checkoutController', function ($scope, OrderFactory, currentCart, CheckoutFactory) {
  $scope.currentCart = currentCart;

  $scope.calcTotal = function () {
    return OrderFactory.calculateTotal('current').then(function (cartTotal) {
      $scope.total = cartTotal;
    });
  };

  $scope.calcTotal();

  $scope.charge = function (status, repsonse) {
    CheckoutFactory.chargeCard({ token: response.id }).then(function (res) {
      console.log(res);
    });
  };
});

app.factory('CheckoutFactory', function ($http, $state) {

  return {
    chargeCard: function chargeCard(obj) {
      $http.post('/checkout', obj).then(function (order) {
        return order.data;
      });
    }
  };
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

app.config(function ($stateProvider) {
  $stateProvider.state('docs', {
    url: '/docs',
    templateUrl: 'js/docs/docs.html'
  });
});

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

app.controller('navbarCtrl', function ($scope, $state, SearchFactory, OrderFactory) {

  $scope.search = function (searchTerms) {
    // SearchFactory.findBySearchText(searchTerms)
    // .then(function(results){
    // 	$scope.results = results;
    // 	console.log(results);
    return $state.go('searchResults', { searchTerms: searchTerms });
    // })
  };

  return OrderFactory.ensureCart().then(function (id) {
    console.log(id);
  });
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
app.directive('randoGreeting', function (RandomGreetings) {

  return {
    restrict: 'E',
    templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
    link: function link(scope) {
      scope.greeting = RandomGreetings.getRandomGreeting();
    }
  };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuY29udHJvbGxlci5qcyIsImNoZWNrb3V0L2NoZWNrb3V0LmZhY3RvcnkuanMiLCJjaGVja291dC9jaGVja291dC5zdGF0ZS5qcyIsImRvY3MvZG9jcy5qcyIsImRlc2lnbi9kZXNpZ24tZGlyZWN0aXZlLmpzIiwiZGVzaWduL2Rlc2lnbi5jb250cm9sbGVyLmpzIiwiZGVzaWduL2Rlc2lnbi5kaXJlY3RpdmUuanMiLCJkZXNpZ24vZGVzaWduLmpzIiwiZGVzaWduL2Rlc2lnbi5zdGF0ZS5qcyIsImZzYS9mc2EtcHJlLWJ1aWx0LmpzIiwiaG9tZS9ob21lLmpzIiwibG9naW4vbG9naW4uanMiLCJtZW1iZXJzLW9ubHkvbWVtYmVycy1vbmx5LmpzIiwib3JkZXIvb3JkZXIuY29udHJvbGxlci5qcyIsIm9yZGVyL29yZGVyLmRpcmVjdGl2ZS5qcyIsIm9yZGVyL29yZGVyLmZhY3RvcnkuanMiLCJvcmRlci9vcmRlci5zdGF0ZS5qcyIsInByb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3LmZhY3RvcnkuanMiLCJwcm9kdWN0dmlldy9wcm9kdWN0dmlldy5qcyIsInBlcnNvbmFsaW5mby9wZXJzb25hbGluZm8uY29udHJvbGxlci5qcyIsInBlcnNvbmFsaW5mby9wZXJzb25hbGluZm8uZmFjdG9yeS5qcyIsInBlcnNvbmFsaW5mby9wZXJzb25hbGluZm8uc3RhdGUuanMiLCJyZXZpZXcvcmV2aWV3LmZhY3RvcnkuanMiLCJzZWFyY2hyZXN1bHRzL3NlYXJjaC5zdGF0ZS5qcyIsInNpZ251cC9zaWdudXAuY29udHJvbGxlci5qcyIsInNpZ251cC9zaWdudXAuZmFjdG9yeS5qcyIsInNpZ251cC9zaWdudXAuc3RhdGUuanMiLCJ1c2VyL3VzZXItY29udHJvbGxlci5qcyIsInVzZXIvdXNlci1mYWN0b3J5LmpzIiwidXNlci91c2VyLXN0YXRlcy5qcyIsImNvbW1vbi9jb250cm9sbGVycy9uYXZiYXIuY29udHJvbGxlci5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9zZWFyY2guZmFjdG9yeS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvb2F1dGgtYnV0dG9uL29hdXRoLWJ1dHRvbi5kaXJlY3RpdmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFDQSxPQUFBLEdBQUEsR0FBQSxRQUFBLE1BQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEsb0JBQUEsU0FBQSxDQUFBLElBQUE7O0FBRUEscUJBQUEsU0FBQSxDQUFBLEdBQUE7O0FBRUEscUJBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUEsUUFBQSxDQUFBLE1BQUE7QUFDQSxHQUZBO0FBR0EsU0FBQSxpQkFBQSxDQUFBLGtDQUFBO0FBQ0EsQ0FWQTs7O0FBYUEsSUFBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsTUFBQSwrQkFBQSxTQUFBLDRCQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQSxNQUFBLElBQUEsSUFBQSxNQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsR0FGQTs7OztBQU1BLGFBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFFQSxRQUFBLENBQUEsNkJBQUEsT0FBQSxDQUFBLEVBQUE7OztBQUdBO0FBQ0E7O0FBRUEsUUFBQSxZQUFBLGVBQUEsRUFBQSxFQUFBOzs7QUFHQTtBQUNBOzs7QUFHQSxVQUFBLGNBQUE7O0FBRUEsZ0JBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7OztBQUlBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZUFBQSxFQUFBLENBQUEsUUFBQSxJQUFBLEVBQUEsUUFBQTtBQUNBLE9BRkEsTUFFQTtBQUNBLGVBQUEsRUFBQSxDQUFBLE9BQUE7QUFDQTtBQUNBLEtBVEE7QUFXQSxHQTVCQTtBQThCQSxDQXZDQTs7QUNoQkEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7OztBQUdBLGlCQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxTQUFBLFFBREE7QUFFQSxnQkFBQSxpQkFGQTtBQUdBLGlCQUFBO0FBSEEsR0FBQTtBQU1BLENBVEE7O0FBV0EsSUFBQSxVQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUE7OztBQUdBLFNBQUEsTUFBQSxHQUFBLEVBQUEsT0FBQSxDQUFBLGFBQUEsQ0FBQTtBQUVBLENBTEE7O0FDWEEsSUFBQSxVQUFBLENBQUEsb0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLGVBQUEsRUFBQTtBQUNBLFNBQUEsV0FBQSxHQUFBLFdBQUE7O0FBRUEsU0FBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLFdBQUEsYUFBQSxjQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFNBQUEsRUFBQTtBQUFBLGFBQUEsS0FBQSxHQUFBLFNBQUE7QUFBQSxLQURBLENBQUE7QUFFQSxHQUhBOztBQUtBLFNBQUEsU0FBQTs7QUFFQSxTQUFBLE1BQUEsR0FBQSxVQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxvQkFBQSxVQUFBLENBQUEsRUFBQSxPQUFBLFNBQUEsRUFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsY0FBQSxHQUFBLENBQUEsR0FBQTtBQUNBLEtBSEE7QUFJQSxHQUxBO0FBT0EsQ0FqQkE7O0FDQUEsSUFBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsU0FBQTtBQUNBLGdCQUFBLG9CQUFBLEdBQUEsRUFBQTtBQUNBLFlBQUEsSUFBQSxDQUFBLFdBQUEsRUFBQSxHQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsZUFBQSxNQUFBLElBQUE7QUFDQSxPQUhBO0FBSUE7QUFOQSxHQUFBO0FBUUEsQ0FWQTs7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGlCQUFBLEtBQUEsQ0FBQSxVQUFBLEVBQUE7QUFDQSxTQUFBLGdCQURBO0FBRUEsaUJBQUEsNEJBRkE7QUFHQSxnQkFBQSxvQkFIQTtBQUlBLGFBQUE7QUFDQSxtQkFBQSxxQkFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLGFBQUEsUUFBQSxDQUFBLFNBQUEsQ0FBQTtBQUNBO0FBSEE7QUFKQSxHQUFBO0FBVUEsQ0FYQTs7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGlCQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxTQUFBLE9BREE7QUFFQSxpQkFBQTtBQUZBLEdBQUE7QUFJQSxDQUxBOztBQ0FBLElBQUEsU0FBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxTQUFBO0FBQ0EsY0FBQSxHQURBO0FBRUEsaUJBQUEsNEJBRkE7Ozs7QUFNQSxVQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUEsY0FBQSxFQUFBOztBQUVBLFVBQUEsUUFBQSxNQUFBLEtBQUE7QUFDQSxVQUFBLGNBQUEsTUFBQSxXQUFBO0FBQ0EsVUFBQSxPQUFBLE1BQUEsSUFBQTtBQUNBLFVBQUEsU0FBQSxRQUFBLElBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUEsV0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLFlBQUEsVUFBQSxZQUFBLFdBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxnQkFBQSxHQUFBLENBQUEsT0FBQSxFQUFBLE9BQUE7QUFDQSxZQUFBLFVBQUEsT0FBQSxTQUFBLEVBQUE7O0FBRUEsWUFBQSxpQkFBQTtBQUNBLGlCQUFBLEtBREE7QUFFQSx1QkFBQSxXQUZBO0FBR0EsZ0JBQUEsT0FIQTtBQUlBLGlCQUFBO0FBSkEsU0FBQTtBQU1BLGVBQUEsWUFBQSxVQUFBLENBQUEsY0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGNBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxDQUFBLE1BQUEsRUFBQSxFQUFBLFFBQUEsT0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsU0FIQSxDQUFBO0FBSUEsT0FmQTs7QUFrQkEsVUFBQSxRQUFBLEVBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxDQUFBO0FBQ0EsVUFBQSxVQUFBLEVBQUEsUUFBQSxFQUFBLENBQUEsRUFBQSxVQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQSxVQUFBLEVBQUEsUUFBQSxDQUFBO0FBQ0EsVUFBQSxTQUFBO0FBQ0EsVUFBQSxZQUFBLEtBQUE7O0FBRUEsVUFBQSxhQUFBLElBQUEsS0FBQSxFQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBLGlCQUFBLEdBQUEsR0FBQSxnQkFBQTs7QUFFQSxpQkFBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLGdCQUFBLFNBQUEsQ0FBQSxVQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUE7QUFDQSxPQUZBOzs7QUFLQSxRQUFBLFdBQUEsRUFBQSxFQUFBLENBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxZQUFBOztBQUVBLFVBQUEsSUFBQSxFQUFBLFFBQUEsR0FBQSxXQUFBLENBQUEsVUFBQTs7QUFFQSxVQUFBLElBQUEsRUFBQSxRQUFBLENBQUEsVUFBQTs7QUFFQSxnQkFBQSxFQUFBLElBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLE9BUEE7OztBQVVBLFFBQUEsb0JBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTs7QUFFQTtBQUNBLFVBQUEsY0FBQSxFQUFBLE1BQUE7QUFDQSxPQUpBOzs7QUFPQSxlQUFBLFdBQUEsR0FBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxRQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsT0FBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLFVBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxFQUFBLFNBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsSUFBQSxHQUFBLENBQUEsR0FBQSxHQUFBOztBQUlBOztBQUVBLFFBQUEsbUJBQUEsRUFBQSxFQUFBLENBQUEsT0FBQSxFQUFBLFdBQUE7OztBQUdBLFFBQUEsY0FBQSxFQUFBLEtBQUEsQ0FBQSxZQUFBOztBQUVBLFlBQUEsWUFBQSxFQUFBLFdBQUEsQ0FBQTtBQUNBLGtCQUFBLEdBQUEsQ0FBQSxrQkFBQSxFQUFBLEVBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxDQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsTUFBQSxDQUFBLFNBQUE7QUFDQSxVQUFBLGNBQUEsRUFBQSxRQUFBLEdBQUEsV0FBQSxDQUFBLFVBQUE7QUFDQSxVQUFBLGNBQUEsRUFBQSxJQUFBLEdBQUEsUUFBQSxDQUFBLFVBQUE7QUFDQSxnQkFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTs7QUFFQSxVQUFBLGNBQUEsRUFBQSxJQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxRQUFBLEVBQUEsR0FBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLENBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLEVBQUEsU0FBQSxDQUFBLEdBQUEsSUFBQSxHQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLEdBQUE7QUFFQSxPQWZBOzs7QUFrQkEsY0FBQSxTQUFBLENBQUEsVUFBQSxDQUFBLEVBQUE7QUFDQSxvQkFBQSxDQUFBO0FBQ0Esb0JBQUEsSUFBQTtBQUNBLE9BSEEsRUFHQSxTQUhBLENBR0EsVUFBQSxDQUFBLEVBQUE7O0FBRUEsWUFBQSxTQUFBLEVBQUE7QUFDQSxrQkFBQSxTQUFBO0FBQ0Esa0JBQUEsTUFBQSxDQUFBLFVBQUEsT0FBQSxFQUFBLFVBQUEsT0FBQTtBQUNBLGtCQUFBLE1BQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQSxFQUFBLE9BQUE7QUFDQSxrQkFBQSxXQUFBLEdBQUEsS0FBQTtBQUNBLGtCQUFBLE1BQUE7QUFDQSxrQkFBQSxPQUFBLEdBQUEsT0FBQTtBQUNBLGtCQUFBLFNBQUEsR0FBQSxFQUFBOztBQUVBLHNCQUFBLENBQUE7QUFDQTtBQUNBLE9BaEJBLEVBZ0JBLE9BaEJBLENBZ0JBLFlBQUE7QUFDQSxvQkFBQSxLQUFBO0FBQ0EsT0FsQkEsRUFrQkEsVUFsQkEsQ0FrQkEsWUFBQTtBQUNBLGdCQUFBLE9BQUE7QUFDQSxPQXBCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBK0ZBO0FBMU1BLEdBQUE7QUE0TUEsQ0E3TUE7QUNBQSxJQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBOztBQUVBLFNBQUEsRUFBQSxHQUFBLElBQUE7QUFFQSxDQUpBO0FDQUEsSUFBQSxTQUFBLENBQUEsWUFBQSxFQUFBLFlBQUE7O0FBRUEsU0FBQTtBQUNBLGNBQUEsR0FEQTtBQUVBLFdBQUEsRUFGQTtBQUdBLGdCQUFBLGtCQUhBO0FBSUEsaUJBQUEsNEJBSkE7QUFLQSxVQUFBLGNBQUEsS0FBQSxFQUFBLENBRUE7O0FBUEEsR0FBQTtBQVdBLENBYkE7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGlCQUFBLEtBQUEsQ0FBQSxZQUFBLEVBQUE7QUFDQSxTQUFBLG1CQURBO0FBRUEsV0FBQTtBQUNBLGVBQUE7QUFEQSxLQUZBO0FBS0EsZ0JBQUEsZ0JBTEE7QUFNQSxjQUFBO0FBTkEsR0FBQTtBQVNBLENBVkE7O0FBWUEsSUFBQSxVQUFBLENBQUEsZ0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUE7O0FBRUEsUUFBQSxJQUFBLENBQUEsbUJBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFDQSxXQUFBLE9BQUEsUUFBQSxHQUFBLEdBQUE7QUFDQSxHQUhBOzs7Ozs7QUFTQSxDQVhBO0FDWkEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsU0FBQSxTQURBO0FBRUEsZ0JBQUEsa0JBRkE7QUFHQSxpQkFBQTtBQUhBLEdBQUE7QUFLQSxDQU5BO0FDQUEsQ0FBQSxZQUFBOztBQUVBOzs7O0FBR0EsTUFBQSxDQUFBLE9BQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsd0JBQUEsQ0FBQTs7QUFFQSxNQUFBLE1BQUEsUUFBQSxNQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsQ0FBQTs7QUFFQSxNQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUEsQ0FBQSxPQUFBLEVBQUEsRUFBQSxNQUFBLElBQUEsS0FBQSxDQUFBLHNCQUFBLENBQUE7QUFDQSxXQUFBLE9BQUEsRUFBQSxDQUFBLE9BQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQTtBQUNBLEdBSEE7Ozs7O0FBUUEsTUFBQSxRQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0Esa0JBQUEsb0JBREE7QUFFQSxpQkFBQSxtQkFGQTtBQUdBLG1CQUFBLHFCQUhBO0FBSUEsb0JBQUEsc0JBSkE7QUFLQSxzQkFBQSx3QkFMQTtBQU1BLG1CQUFBO0FBTkEsR0FBQTs7QUFTQSxNQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxRQUFBLGFBQUE7QUFDQSxXQUFBLFlBQUEsZ0JBREE7QUFFQSxXQUFBLFlBQUEsYUFGQTtBQUdBLFdBQUEsWUFBQSxjQUhBO0FBSUEsV0FBQSxZQUFBO0FBSkEsS0FBQTtBQU1BLFdBQUE7QUFDQSxxQkFBQSx1QkFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxVQUFBLENBQUEsV0FBQSxTQUFBLE1BQUEsQ0FBQSxFQUFBLFFBQUE7QUFDQSxlQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQTtBQUNBO0FBSkEsS0FBQTtBQU1BLEdBYkE7O0FBZUEsTUFBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxrQkFBQSxZQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsV0FEQSxFQUVBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsYUFBQSxVQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsS0FKQSxDQUFBO0FBTUEsR0FQQTs7QUFTQSxNQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGFBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxVQUFBLE9BQUEsU0FBQSxJQUFBO0FBQ0EsY0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBQSxJQUFBO0FBQ0EsaUJBQUEsVUFBQSxDQUFBLFlBQUEsWUFBQTtBQUNBLGFBQUEsS0FBQSxJQUFBO0FBQ0E7Ozs7QUFJQSxTQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsYUFBQSxDQUFBLENBQUEsUUFBQSxJQUFBO0FBQ0EsS0FGQTs7QUFJQSxTQUFBLGVBQUEsR0FBQSxVQUFBLFVBQUEsRUFBQTs7Ozs7Ozs7OztBQVVBLFVBQUEsS0FBQSxlQUFBLE1BQUEsZUFBQSxJQUFBLEVBQUE7QUFDQSxlQUFB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RUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQTs7QUFJQSxTQUFBLGdCQUFBLEdBQUEsS0FBQTtBQUNBLFNBQUEsSUFBQSxHQUFBLE9BQUE7QUFDQSxTQUFBLE9BQUEsR0FBQSxVQUFBOztBQUVBLFNBQUEsS0FBQSxHQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxPQUFBLEdBQUEsT0FBQTtBQUNBLFdBQUEsUUFBQSxHQUFBLENBQUEsT0FBQSxRQUFBO0FBQ0EsZUFBQSxZQUFBO0FBQ0EsYUFBQSxRQUFBLEdBQUEsQ0FBQSxPQUFBLFFBQUE7QUFDQSxhQUFBLE9BQUE7QUFDQSxLQUhBLEVBR0EsSUFIQTs7QUFLQSxHQVJBOztBQVVBLFNBQUEsWUFBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsTUFBQSxFQUFBLEVBQUEsUUFBQSxNQUFBLEVBQUE7QUFDQSxHQUZBOztBQUlBLFNBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxRQUFBLE9BQUEsRUFBQTtBQUNBLFNBQUEsTUFBQSxHQUFBLE9BQUEsSUFBQSxDQUFBLEVBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxDQUFBLE9BQUEsUUFBQTtBQUNBLFNBQUEsYUFBQSxHQUFBLENBQUEsT0FBQSxJQUFBLENBQUEsS0FBQTtBQUNBLFFBQUEsS0FBQSxRQUFBLEdBQUEsQ0FBQSxFQUFBO0FBQ0EsbUJBQUEsU0FBQSxDQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsUUFBQSx5Q0FBQSxRQUFBLE9BQUEsUUFBQSxFQUFBLE9BQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxLQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUE7QUFDQSxPQUpBO0FBS0EsS0FOQSxNQU9BLE9BQUEsS0FBQSxDQUFBLG9DQUFBO0FBQ0EsR0FiQTs7QUFlQSxTQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxPQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUE7QUFDQSxLQUZBLEVBRUEsSUFGQSxDQUVBLElBRkEsQ0FBQTtBQUdBLEdBSkE7O0FBTUEsU0FBQSxXQUFBOztBQUVBLFNBQUEsaUJBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxZQUFBLGVBQUEsR0FDQSxJQURBLENBQ0EsVUFBQSxJQUFBLEVBQUE7QUFDQSxjQUFBLEdBQUEsQ0FBQSxJQUFBO0FBQ0EsVUFBQSxDQUFBLElBQUEsRUFBQTtBQUNBLGVBQUEsY0FBQSxHQUFBLE1BQUE7QUFDQSxPQUZBLE1BRUE7QUFDQSxlQUFBLGNBQUEsR0FBQSxLQUFBLEVBQUE7QUFDQTtBQUNBLEtBUkEsQ0FBQTtBQVNBLEdBVkE7O0FBWUEsU0FBQSxpQkFBQTs7QUFFQSxTQUFBLG9CQUFBLEdBQUEsWUFBQTtBQUNBLFdBQUEsT0FBQSxnQkFBQTtBQUNBLEdBRkE7O0FBSUEsU0FBQSxvQkFBQTs7QUFFQSxTQUFBLFNBQUEsR0FBQSxZQUFBOzs7QUFHQSxRQUFBLHVCQUFBLE9BQUEsT0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsT0FBQSxNQUFBO0FBQ0EsS0FGQSxDQUFBOztBQUlBLFFBQUEsT0FBQSxjQUFBLEtBQUEsTUFBQSxFQUFBO0FBQ0EsYUFBQSxrQkFBQSxHQUFBLHlDQUFBO0FBQ0EsYUFBQSxnQkFBQSxHQUFBLElBQUE7QUFDQSxLQUhBLE1BR0EsSUFBQSxxQkFBQSxPQUFBLENBQUEsT0FBQSxjQUFBLE1BQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSxhQUFBLGtCQUFBLEdBQUEsK0RBQUE7QUFDQSxhQUFBLGdCQUFBLEdBQUEsSUFBQTs7QUFFQSxLQUpBLE1BSUEsSUFBQSxPQUFBLGNBQUEsS0FBQSxPQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsRUFBQSxFQUFBO0FBQ0EsZUFBQSxrQkFBQSxHQUFBLGlDQUFBO0FBQ0EsZUFBQSxnQkFBQSxHQUFBLElBQUE7QUFDQSxPQUhBLE1BR0E7O0FBRUEsWUFBQSxZQUFBO0FBQ0EsZ0JBQUEsT0FBQSxVQURBO0FBRUEsa0JBQUEsT0FBQSxJQUFBLENBQUE7QUFGQSxTQUFBO0FBSUEsZUFBQSxjQUFBLFVBQUEsQ0FBQSxTQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsY0FBQSxTQUFBLEVBQUE7QUFDQSxpQkFBQSxJQUFBLEdBQUEsRUFBQTs7QUFFQSxpQkFBQSxJQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFVBQUE7QUFDQSxpQkFBQSxJQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFNBQUE7QUFDQSxpQkFBQSxJQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFdBQUE7QUFDQSxpQkFBQSxJQUFBLENBQUEsUUFBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFFBQUE7QUFDQSxpQkFBQSxJQUFBLEdBQUEsVUFBQSxNQUFBLENBQUEsSUFBQTs7QUFFQSxpQkFBQSxPQUFBLENBQUEsSUFBQSxDQUFBLE1BQUE7QUFDQSxpQkFBQSxVQUFBLEdBQUEsSUFBQTtBQUNBLFNBYkEsQ0FBQTtBQWNBO0FBQ0EsR0F0Q0E7O0FBd0NBLFNBQUEsTUFBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxZQUFBLE1BQUEsQ0FBQSxNQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsYUFBQSxJQUFBLENBQUEsT0FBQTtBQUNBLEtBSEEsQ0FBQTtBQUlBLEdBTEE7O0FBT0EsU0FBQSxRQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLFlBQUEsUUFBQSxDQUFBLE1BQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFDQSxhQUFBLElBQUEsQ0FBQSxTQUFBO0FBQ0EsS0FIQSxDQUFBO0FBSUEsR0FMQTs7QUFPQSxjQUFBLGVBQUEsR0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxXQUFBLEtBQUEsRUFBQSxJ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LFVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxTQUFBLElBQUE7QUFDQSxLQUhBLENBQUE7QUFJQSxHQU5BO0FBT0EsU0FBQSxhQUFBO0FBQ0EsQ0FYQTs7QUNoQkEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsU0FBQSxTQURBO0FBRUEsZ0JBQUEsWUFGQTtBQUdBLGlCQUFBO0FBSEEsR0FBQTtBQU1BLENBUEE7QUNBQSxJQUFBLFVBQUEsQ0FBQSxVQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFVBQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxZQUFBO0FBQ0EsU0FBQSxJQUFBLEdBQUEsT0FBQTtBQUNBLFNBQUEsS0FBQSxHQUFBLFlBQUE7O0FBRUEsU0FBQSxjQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxVQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUNBLEdBRkE7O0FBSUEsU0FBQSxVQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxnQkFBQSxFQUFBLEVBQUEsSUFBQSxFQUFBLEVBQUE7QUFDQSxHQUZBOztBQUlBLGNBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLFdBQUEsS0FBQSxFQUFBLElBQUEsT0FBQSxJQUFBLENBQUEsRUFBQSxJQUFBLEtBQUEsT0FBQSxHQUFBLElBQUEsR0FBQSxLQUFBO0FBQ0EsR0FGQSxFQUdBLElBSEEsQ0FHQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFlBQUEsR0FBQSxDQUFBLE1BQUE7QUFDQSxXQUFBLFVBQUEsR0FBQSxNQUFBO0FBQ0EsR0FOQTs7QUFRQSxTQUFBLE1BQUEsR0FBQSxZQUFBLE1BQUE7QUFDQSxDQXRCQTs7QUNBQSxJQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVB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QSxhQUFBLEVBQUEsWUFBQTtBQUNBLFNBQUE7QUFDQSxXQUFBO0FBQ0Esb0JBQUE7QUFEQSxLQURBO0FBSUEsY0FBQSxHQUpBO0FBS0EsaUJBQUE7QUFMQSxHQUFBO0FBT0EsQ0FSQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdzb2NrbWFya2V0JywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICdzdHJpcGUnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbiAgICBTdHJpcGUuc2V0UHVibGlzaGFibGVLZXkoJ3BrX3Rlc3RfUmQ3bk1wU1pNcVJOdUI0empFZVpIdDFkJyk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Fib3V0Jywge1xuICAgICAgICB1cmw6ICcvYWJvdXQnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWJvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hYm91dC9hYm91dC5odG1sJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Fib3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEZ1bGxzdGFja1BpY3MpIHtcblxuICAgIC8vIEltYWdlcyBvZiBiZWF1dGlmdWwgRnVsbHN0YWNrIHBlb3BsZS5cbiAgICAkc2NvcGUuaW1hZ2VzID0gXy5zaHVmZmxlKEZ1bGxzdGFja1BpY3MpO1xuXG59KTtcblxuIiwiYXBwLmNvbnRyb2xsZXIoJ2NoZWNrb3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIE9yZGVyRmFjdG9yeSwgY3VycmVudENhcnQsIENoZWNrb3V0RmFjdG9yeSkge1xuICAkc2NvcGUuY3VycmVudENhcnQgPSBjdXJyZW50Q2FydFxuXG4gICRzY29wZS5jYWxjVG90YWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gT3JkZXJGYWN0b3J5LmNhbGN1bGF0ZVRvdGFsKCdjdXJyZW50JylcbiAgICAudGhlbihmdW5jdGlvbihjYXJ0VG90YWwpIHsgJHNjb3BlLnRvdGFsID0gY2FydFRvdGFsIH0pXG4gIH1cblxuICAkc2NvcGUuY2FsY1RvdGFsKClcblxuICAkc2NvcGUuY2hhcmdlID0gZnVuY3Rpb24oc3RhdHVzLCByZXBzb25zZSkge1xuICAgIENoZWNrb3V0RmFjdG9yeS5jaGFyZ2VDYXJkKHt0b2tlbjogcmVzcG9uc2UuaWR9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgY29uc29sZS5sb2cocmVzKVxuICAgIH0pXG4gIH1cblxufSlcbiIsImFwcC5mYWN0b3J5KCdDaGVja291dEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHAsICRzdGF0ZSkge1xuXG4gIHJldHVybiB7XG4gICAgY2hhcmdlQ2FyZDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICAkaHR0cC5wb3N0KCcvY2hlY2tvdXQnLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICByZXR1cm4gb3JkZXIuZGF0YVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hlY2tvdXQnLCB7XG4gICAgdXJsOiAnL2NhcnQvY2hlY2tvdXQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL2NoZWNrb3V0L2NoZWNrb3V0Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdjaGVja291dENvbnRyb2xsZXInLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGN1cnJlbnRDYXJ0OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuXHRcdFx0fVxuXHRcdH1cbiAgfSlcbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkb2NzJywge1xuICAgICAgICB1cmw6ICcvZG9jcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZG9jcy9kb2NzLmh0bWwnXG4gICAgfSk7XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Rlc2lnblZpZXcnLCBmdW5jdGlvbiAoU29ja0ZhY3RvcnksICRzdGF0ZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9kZXNpZ24vZGVzaWduLXZpZXcuaHRtbCcsXG5cdFx0Ly8gc2NvcGU6IHtcblx0XHQvLyBcdHRoZVNvY2s6ICc9J1xuXHRcdC8vIH0sXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgZGVzaWduVmlld0N0cmwpIHtcblx0XHRcdFxuXHRcdFx0dmFyIHRpdGxlID0gc2NvcGUudGl0bGU7XG5cdFx0XHR2YXIgZGVzY3JpcHRpb24gPSBzY29wZS5kZXNjcmlwdGlvbjtcblx0XHRcdHZhciB0YWdzID0gc2NvcGUudGFncztcblx0XHRcdHZhciBjYW52YXMgPSBlbGVtZW50LmZpbmQoJ2NhbnZhcycpWzBdO1xuXHRcdFx0c2NvcGUuc2F2ZURlc2lnbiA9IGZ1bmN0aW9uICh0aXRsZSwgZGVzY3JpcHRpb24sIHRhZ3MpIHtcblx0XHRcdFx0dmFyIHRhZ3NBcnIgPSBTb2NrRmFjdG9yeS5wcmVwYXJlVGFncyh0YWdzKVxuXHRcdFx0XHRjb25zb2xlLmxvZygnVEFHUzonLCB0YWdzQXJyKTtcblx0XHRcdFx0dmFyIGRhdGFVUkwgPSBjYW52YXMudG9EYXRhVVJMKClcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coZGVzY3JpcHRpb24pXG5cdFx0XHRcdHZhciBuZXdTb2NrRGF0YU9iaiA9IHtcblx0XHRcdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuXHRcdFx0XHRcdHRhZ3M6IHRhZ3NBcnIsXG5cdFx0XHRcdFx0aW1hZ2U6IGRhdGFVUkxcblx0XHRcdFx0fTtcblx0XHRcdFx0cmV0dXJuIFNvY2tGYWN0b3J5LnNhdmVEZXNpZ24obmV3U29ja0RhdGFPYmopXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0XHRcdFx0XHRpZiAocmVzdWx0KSAkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiByZXN1bHQuZGF0YS51c2VySWR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fTtcblxuXG5cdFx0XHR2YXIgY29sb3IgPSAkKFwiLnNlbGVjdGVkXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XG5cdFx0XHR2YXIgY29udGV4dCA9ICQoXCJjYW52YXNcIilbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXHRcdFx0dmFyICRjYW52YXMgPSAkKFwiY2FudmFzXCIpO1xuXHRcdFx0dmFyIGxhc3RFdmVudDtcblx0XHRcdHZhciBtb3VzZURvd24gPSBmYWxzZTtcblxuXHRcdFx0dmFyIGJhY2tncm91bmQgPSBuZXcgSW1hZ2UoKTtcblxuXHRcdFx0Ly8gY29udGV4dC5maWxsU3R5bGUgPSAnI2Y4ZjhmZic7XG5cdFx0XHQvLyBjb250ZXh0Lm9wYWNpdHkgPSAwO1xuXHRcdFx0Ly8gY29udGV4dC5maWxsKClcblxuXHRcdFx0Ly8gZnVuY3Rpb24gZ2VuZXJhdGVTb2NrVVJMKCl7XG5cdFx0XHQvLyAgIGZ1bmN0aW9uIGdlbmVyYXRlUmFuZG9tTnVtYmVyKCkge1xuXHRcdFx0Ly8gICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzKSArIDE7XG5cdFx0XHQvLyAgIH1cblx0XHRcdC8vICAgdmFyIG51bSA9IGdlbmVyYXRlUmFuZG9tTnVtYmVyKCk7XG5cblx0XHRcdC8vICAgaWYgKG51bSA9PT0gMSkgcmV0dXJuICcvc29jay1iZy8nICsgbnVtICsgJy5wbmcnXG5cdFx0XHQvLyAgIGVsc2UgcmV0dXJuICcvc29jay1iZy8nICsgbnVtICsgJy5qcGcnO1xuXHRcdFx0Ly8gfVxuXG5cdFx0XHRiYWNrZ3JvdW5kLnNyYyA9ICcvc29jay1iZy8xLnBuZyc7XG5cblx0XHRcdGJhY2tncm91bmQub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQgIGNvbnRleHQuZHJhd0ltYWdlKGJhY2tncm91bmQsIDAsIDApO1xuXHRcdFx0fTtcblxuXHRcdFx0Ly9XaGVuIGNsaWNraW5nIG9uIGNvbnRyb2wgbGlzdCBpdGVtc1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzXCIpLm9uKFwiY2xpY2tcIiwgXCJsaVwiICwgZnVuY3Rpb24oKXtcblx0XHRcdCAgICAgLy9EZXNsZWN0IHNpYmxpbmcgZWxlbWVudHNcblx0XHRcdCAgICAgJCh0aGlzKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vU2VsZWN0IGNsaWNrZWQgZWxlbWVudFxuXHRcdFx0ICAgICAkKHRoaXMpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vc3RvcmUgdGhlIGNvbG9yXG5cdFx0XHQgICAgIGNvbG9yID0gJCh0aGlzKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICB9KTtcblxuXHRcdFx0Ly9XaGVuIFwiQWRkIENvbG9yXCIgYnV0dG9uIGlzIHByZXNzZWRcblx0XHRcdCAgJChcIiNyZXZlYWxDb2xvclNlbGVjdFwiKS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCAgLy9TaG93IGNvbG9yIHNlbGVjdCBvciBoaWRlIHRoZSBjb2xvciBzZWxlY3Rcblx0XHRcdCAgICBjaGFuZ2VDb2xvcigpO1xuXHRcdFx0ICBcdCQoXCIjY29sb3JTZWxlY3RcIikudG9nZ2xlKCk7XG5cdFx0XHQgIH0pO1xuXG5cdFx0XHQvL1VwZGF0ZSB0aGUgbmV3IGNvbG9yIHNwYW5cblx0XHRcdGZ1bmN0aW9uIGNoYW5nZUNvbG9yKCl7XG5cdFx0XHRcdHZhciByID0gJChcIiNyZWRcIikudmFsKCk7XG5cdFx0XHRcdHZhciBnID0gJChcIiNncmVlblwiKS52YWwoKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKCk7XG5cdFx0XHRcdCQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYihcIiArIHIgKyBcIiwgXCIgKyBnICsgXCIsIFwiICsgYiArIFwiKVwiKTtcblx0XHRcdCAgLy9XaGVuIGNvbG9yIHNsaWRlcnMgY2hhbmdlXG5cblxuXHRcdFx0fVxuXG5cdFx0XHQkKFwiaW5wdXRbdHlwZT1yYW5nZV1cIikub24oXCJpbnB1dFwiLCBjaGFuZ2VDb2xvcik7XG5cblx0XHRcdC8vd2hlbiBcIkFkZCBDb2xvclwiIGlzIHByZXNzZWRcblx0XHRcdCQoXCIjYWRkTmV3Q29sb3JcIikuY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdCAgLy9hcHBlbmQgdGhlIGNvbG9yIHRvIHRoZSBjb250cm9scyB1bFxuXHRcdFx0ICB2YXIgJG5ld0NvbG9yID0gJChcIjxsaT48L2xpPlwiKTtcblx0XHRcdCAgJG5ld0NvbG9yLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpKTtcblx0XHRcdCAgJChcIi5jb250cm9scyB1bFwiKS5hcHBlbmQoJG5ld0NvbG9yKTtcblx0XHRcdCAgJChcIi5jb250cm9scyBsaVwiKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgbGlcIikubGFzdCgpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgIGNvbG9yID0gJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICAvL3doZW4gYWRkZWQsIHJlc3RvcmUgc2xpZGVycyBhbmQgcHJldmlldyBjb2xvciB0byBkZWZhdWx0XG5cdFx0XHQgICQoXCIjY29sb3JTZWxlY3RcIikuaGlkZSgpO1xuXHRcdFx0XHR2YXIgciA9ICQoXCIjcmVkXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGcgPSAkKFwiI2dyZWVuXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKDApO1xuXHRcdFx0XHQkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2IoXCIgKyByICsgXCIsIFwiICsgZyArIFwiLCBcIiArIGIgKyBcIilcIik7XG5cblx0XHRcdH0pXG5cblx0XHRcdC8vT24gbW91c2UgZXZlbnRzIG9uIHRoZSBjYW52YXNcblx0XHRcdCRjYW52YXMubW91c2Vkb3duKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICBsYXN0RXZlbnQgPSBlO1xuXHRcdFx0ICBtb3VzZURvd24gPSB0cnVlO1xuXHRcdFx0fSkubW91c2Vtb3ZlKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICAvL2RyYXcgbGluZXNcblx0XHRcdCAgaWYgKG1vdXNlRG93bil7XG5cdFx0XHQgICAgY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdCAgICBjb250ZXh0Lm1vdmVUbyhsYXN0RXZlbnQub2Zmc2V0WCxsYXN0RXZlbnQub2Zmc2V0WSk7XG5cdFx0XHQgICAgY29udGV4dC5saW5lVG8oZS5vZmZzZXRYLCBlLm9mZnNldFkpO1xuXHRcdFx0ICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBjb2xvcjtcblx0XHRcdCAgICBjb250ZXh0LnN0cm9rZSgpO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZUNhcCA9ICdyb3VuZCc7XG5cdFx0XHQgICAgY29udGV4dC5saW5lV2lkdGggPSAyMDtcblxuXHRcdFx0ICAgIGxhc3RFdmVudCA9IGU7XG5cdFx0XHQgIH1cblx0XHRcdH0pLm1vdXNldXAoZnVuY3Rpb24oKXtcblx0XHRcdCAgICBtb3VzZURvd24gPSBmYWxzZTtcblx0XHRcdH0pLm1vdXNlbGVhdmUoZnVuY3Rpb24oKXtcblx0XHRcdCAgICAkY2FudmFzLm1vdXNldXAoKTtcblx0XHRcdH0pO1xuXG5cblxuXG5cdFx0XHQvLyB2YXIgc2tldGNoID0gZWxlbWVudC5maW5kKCcjc2tldGNoJyk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhza2V0Y2gpO1xuXHRcdFx0Ly8gdmFyIHNrZXRjaFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShza2V0Y2gpXG5cdFx0ICAgIC8vIGNhbnZhcy53aWR0aCA9IHBhcnNlSW50KHNrZXRjaFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3dpZHRoJykpO1xuXHRcdCAgICAvLyBjYW52YXMuaGVpZ2h0ID0gcGFyc2VJbnQoc2tldGNoU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JykpO1xuXG5cblxuXHQgICAgXHQvLyB2YXIgY29sb3IgPSAnYmxhY2snO1xuXHRcdCAgICAvLyBzY29wZS5jaGFuZ2VDb2xvciA9IGZ1bmN0aW9uIChjaG9zZW5Db2xvcikge1xuXHRcdCAgICAvLyBcdGNvbG9yID0gY2hvc2VuQ29sb3I7XG5cdFx0ICAgIC8vIFx0Y29uc29sZS5sb2coJ0NPTE9SJywgY29sb3IpXG5cdFx0ICAgIC8vIH1cdFx0ICAgIFxuXG5cdFx0ICAgIC8vIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRcdCAgICAvLyBjdHgubGluZVdpZHRoID0gMjA7XG5cdFx0ICAgIC8vIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG5cdFx0ICAgIC8vIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcblxuXHRcdCAgICAvLyB2YXIgY3VycmVudE1vdXNlUG9zaXRpb24gPSB7XG5cdFx0ICAgIC8vICAgICB4OiAwLFxuXHRcdCAgICAvLyAgICAgeTogMFxuXHRcdCAgICAvLyB9O1xuXG5cdFx0ICAgIC8vIHZhciBsYXN0TW91c2VQb3NpdGlvbiA9IHtcblx0XHQgICAgLy8gICAgIHg6IDAsXG5cdFx0ICAgIC8vICAgICB5OiAwXG5cdFx0ICAgIC8vIH07XG5cblx0XHQgICAgLy8gdmFyIGRyYXdpbmcgPSBmYWxzZTtcblxuXHRcdCAgICAvLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcblx0XHQgICAgLy8gICAgIGRyYXdpbmcgPSB0cnVlO1xuXHRcdCAgICAvLyAgICAgY3VycmVudE1vdXNlUG9zaXRpb24ueCA9IGUub2Zmc2V0WDtcblx0XHQgICAgLy8gICAgIGN1cnJlbnRNb3VzZVBvc2l0aW9uLnkgPSBlLm9mZnNldFk7XG5cdFx0ICAgIC8vIH0pO1xuXG5cdFx0ICAgIC8vIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZnVuY3Rpb24gKCkge1xuXHRcdCAgICAvLyAgICAgZHJhd2luZyA9IGZhbHNlO1xuXHRcdCAgICAvLyB9KTtcblxuXHRcdCAgICAvLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24gKGUpIHtcblx0XHQgICAgLy8gICAgIGlmICghZHJhd2luZykgcmV0dXJuO1xuXG5cdFx0ICAgIC8vICAgICBsYXN0TW91c2VQb3NpdGlvbi54ID0gY3VycmVudE1vdXNlUG9zaXRpb24ueDtcblx0XHQgICAgLy8gICAgIGxhc3RNb3VzZVBvc2l0aW9uLnkgPSBjdXJyZW50TW91c2VQb3NpdGlvbi55O1xuXG5cdFx0ICAgIC8vICAgICBjdXJyZW50TW91c2VQb3NpdGlvbi54ID0gZS5vZmZzZXRYO1xuXHRcdCAgICAvLyAgICAgY3VycmVudE1vdXNlUG9zaXRpb24ueSA9IGUub2Zmc2V0WTtcblxuXHRcdCAgICAvLyAgICAgY29uc29sZS5sb2coJ1BPU0lUSU9OJywgY3VycmVudE1vdXNlUG9zaXRpb24pXG5cblx0XHQgICAgLy8gICAgIGRyYXcobGFzdE1vdXNlUG9zaXRpb24sIGN1cnJlbnRNb3VzZVBvc2l0aW9uLCBjb2xvciwgdHJ1ZSk7XG5cblx0XHQgICAgLy8gfSk7XG5cblx0XHQgICAgLy8gdmFyIGRyYXcgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCwgc3Ryb2tlQ29sb3IpIHtcblxuXHRcdCAgICAvLyAgICAgLy8gRHJhdyB0aGUgbGluZSBiZXR3ZWVuIHRoZSBzdGFydCBhbmQgZW5kIHBvc2l0aW9uc1xuXHRcdCAgICAvLyAgICAgLy8gdGhhdCBpcyBjb2xvcmVkIHdpdGggdGhlIGdpdmVuIGNvbG9yLlxuXHRcdCAgICAvLyAgICAgY3R4LmJlZ2luUGF0aCgpO1xuXHRcdCAgICAvLyAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlQ29sb3IgfHwgJ2JsYWNrJztcblx0XHQgICAgLy8gICAgIGN0eC5tb3ZlVG8oc3RhcnQueCwgc3RhcnQueSk7XG5cdFx0ICAgIC8vICAgICBjdHgubGluZVRvKGVuZC54LCBlbmQueSk7XG5cdFx0ICAgIC8vICAgICBjdHguY2xvc2VQYXRoKCk7XG5cdFx0ICAgIC8vICAgICBjdHguc3Ryb2tlKCk7XG5cblx0XHQgICAgLy8gfTtcblxuXHRcdH1cblx0fVxufSkiLCJhcHAuY29udHJvbGxlcignRGVzaWduQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUpIHtcblxuICAkc2NvcGUuaGkgPSBcImhpXCI7XG5cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2Rlc2lnblNvY2snLCBmdW5jdGlvbiAoKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIGNvbnRyb2xsZXI6ICdEZXNpZ25Db250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9kZXNpZ24vZGVzaWduLnZpZXcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rlc2lnblZpZXcnLCB7XG4gICAgICB1cmw6Jy9zb2Nrcy9kZXNpZ24vOmlkJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIHRoZVNvY2s6ICc9J1xuICAgICAgfSxcbiAgICAgIGNvbnRyb2xsZXI6ICdkZXNpZ25WaWV3Q3RybCcsXG4gICAgICB0ZW1wbGF0ZTogJzxkZXNpZ24tdmlldz48L2Rlc2lnbi12aWV3PicsXG4gICAgfSlcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdkZXNpZ25WaWV3Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwKSB7XG5cbiAgJGh0dHAucG9zdCgnL2FwaS91c2VyL21hdGNoSWQnKVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIHJldHVybiAkc2NvcGUuc2hvd1ZpZXcgPSByZXNcbiAgICB9KVxuXG5cdC8vIC8vICRzY29wZS5kZXNjcmlwdGlvbjtcblx0Ly8gJHNjb3BlLnRhZ3M7XG5cdC8vICRzY29wZS50aXRsZTtcblx0Ly8gY29uc29sZS5sb2coJHNjb3BlLmRlc2NyaXB0aW9uKTtcbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGVzaWduJywge1xuICAgICAgdXJsOicvZGVzaWduJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdEZXNpZ25Db250cm9sbGVyJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnPGRlc2lnbi1zb2NrPjwvZGVzaWduLXNvY2s+J1xuICAgIH0pXG59KTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ2hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdG1vc3RSZWNlbnRTb2NrczogZnVuY3Rpb24gKFNvY2tGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU29ja0ZhY3RvcnkubW9zdFJlY2VudFNvY2tzKClcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignaG9tZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBtb3N0UmVjZW50U29ja3MsICRzdGF0ZSwgJHN0YXRlUGFyYW1zKSB7XG5cbiAgJHNjb3BlLm1vc3RSZWNlbnRTb2NrcyA9IG1vc3RSZWNlbnRTb2Nrc1xuICAkc2NvcGUuc2VlU29jayA9IGZ1bmN0aW9uIChpZCkge1xuICAgICRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcbiAgfVxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcbiAgICAgICAgICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTtcblxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICB2YXIgZ2V0U3Rhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcbiAgICB9O1xuXG59KTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbicsIHtcbiAgICAgICAgdXJsOiAnL2FkbWluJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ2NhcnRDdXJyZW50JywgZnVuY3Rpb24gKCRzY29wZSwgT3JkZXJGYWN0b3J5LCBjdXJyZW50Q2FydCkge1xuICAkc2NvcGUuY3VycmVudCA9IGN1cnJlbnRDYXJ0XG59KVxuXG5cbmFwcC5jb250cm9sbGVyKCdjYXJ0SGlzdG9yeScsIGZ1bmN0aW9uICgkc2NvcGUsIE9yZGVyRmFjdG9yeSwgY2FydEhpc3RvcnkpIHtcblxuICAvLyAkc2NvcGUuY2FydEhpc3RvcnkgPSBjYXJ0SGlzdG9yeVxuXG59KVxuIiwiYXBwLmRpcmVjdGl2ZSgnY3VycmVudENhcnQnLCBmdW5jdGlvbiAoJHN0YXRlLCBPcmRlckZhY3RvcnkpIHtcblxuICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHNjb3BlOiB7fSxcbiAgICAgIHRlbXBsYXRlVXJsOiAnanMvb3JkZXIvY3VycmVudC5odG1sJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XG5cbiAgICAgICAgc2NvcGUudXBkYXRlID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgIHZhciBzb2NrID0ge1xuICAgICAgICAgICAgcXVhbnRpdHk6IGl0ZW0ubmV3QW1vdW50LFxuICAgICAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS51cGRhdGVJdGVtKHNvY2spXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGl0ZW0ucXVhbnRpdHkgPSBpdGVtLm5ld0Ftb3VudDtcbiAgICAgICAgICAgIGl0ZW0ubmV3QW1vdW50ID0gbnVsbDtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2NvcGUuY2FsY1RvdGFsKClcbiAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuZGVsZXRlID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgIHZhciB0b2RlbGV0ZSA9IHsgaXRlbTogaXRlbSB9XG4gICAgICAgICAgT3JkZXJGYWN0b3J5LmRlbGV0ZUl0ZW0odG9kZWxldGUuaXRlbS5pZClcbiAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHsgcmV0dXJuIHNjb3BlLmNhbGNUb3RhbCgpIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24obmV3VG90YWwpIHsgc2NvcGUudG90YWwgPSBuZXdUb3RhbCB9KVxuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuc2luZ2xlU29ja1ZpZXcgPSBmdW5jdGlvbihpZCkgeyAkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pIH1cbiAgICAgICAgc2NvcGUudG9DaGVja291dCA9IGZ1bmN0aW9uKCkgeyAkc3RhdGUuZ28oJ2NoZWNrb3V0JykgfVxuXG4gICAgICAgIHNjb3BlLmNhbGNUb3RhbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBPcmRlckZhY3RvcnkuY2FsY3VsYXRlVG90YWwoJ2N1cnJlbnQnKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGNhcnRUb3RhbCkge1xuICAgICAgICAgICAgc2NvcGUudG90YWwgPSBjYXJ0VG90YWxcbiAgICAgICAgICAgIHJldHVybiBjYXJ0VG90YWxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuY2FsY1RvdGFsKClcblxuICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdjdXJyZW50JylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY3VycmVudCkgeyBzY29wZS5jdXJyZW50Q2FydCA9IGN1cnJlbnQgfSlcbiAgICB9XG4gIH1cbn0pXG5cbmFwcC5kaXJlY3RpdmUoJ2NhcnRIaXN0b3J5JywgZnVuY3Rpb24oJHN0YXRlLCBPcmRlckZhY3RvcnkpIHtcblxuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgc2NvcGU6IHt9LFxuICAgIHRlbXBsYXRlVXJsOiAnanMvb3JkZXIvaGlzdG9yeS5odG1sJyxcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgc2NvcGUuY2FsY1RvdGFsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBPcmRlckZhY3RvcnkuY2FsY3VsYXRlVG90YWwoJ2hpc3RvcnknKVxuICAgICAgICAudGhlbihmdW5jdGlvbihjYXJ0VG90YWwpIHsgc2NvcGUudG90YWxTcGVudCA9IGNhcnRUb3RhbCB9KVxuICAgICAgfVxuXG4gICAgICBzY29wZS5jYWxjVG90YWwoKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7IGNvbnNvbGUubG9nKHNjb3BlLnRvdGFsU3BlbnQpIH0pXG5cbiAgICAgIHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2hpc3RvcnknKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oaGlzdG9yeSkgeyBzY29wZS5jYXJ0SGlzdG9yeSA9IGhpc3RvcnkgfSlcbiAgICB9XG4gIH1cblxufSlcbiIsIlxuYXBwLmZhY3RvcnkoJ09yZGVyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKSB7XG4gIHZhciBjYWNoZWRDYXJ0ID0gW11cbiAgdmFyIGNoZWNrQ2FydCA9IGZ1bmN0aW9uKG9iaiwgYXJyKSB7XG4gICAgcmV0dXJuIGFyci5tYXAoZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5zb2NrSWQgfSkuaW5kZXhPZihvYmouc29ja0lkKSA9PT0gLTEgPyBmYWxzZSA6IHRydWVcbiAgfVxuICByZXR1cm4ge1xuICAgIGFkZFRvQ2FydDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyL2N1cnJlbnQnKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7IHJldHVybiBjaGVja0NhcnQob2JqLCByZXMuZGF0YSkgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGluQ2FydCkge1xuICAgICAgICBpZiAoaW5DYXJ0KSB7XG4gICAgICAgICAgcmV0dXJuIFwiQWxyZWFkeSBpbiBDYXJ0IVwiXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvb3JkZXIvJywgb2JqKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykgeyByZXR1cm4gcmVzLmRhdGEgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9LFxuICAgIHNob3dDYXJ0OiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAvL3R5cGUgPSAnY3VycmVudCcgfHwgdHlwZSA9ICdoaXN0b3J5J1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci8nK3R5cGUpXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICBjYWNoZWRDYXJ0ID0gb3JkZXIuZGF0YVxuICAgICAgICByZXR1cm4gY2FjaGVkQ2FydCB8fCBbXVxuICAgICAgfSlcbiAgICB9LFxuICAgIGNhbGN1bGF0ZVRvdGFsOiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyLycrdHlwZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKSB7XG4gICAgICAgIGNhY2hlZENhcnQgPSBvcmRlci5kYXRhXG4gICAgICAgIHJldHVybiBjYWNoZWRDYXJ0IHx8IFtdXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oY2FydCkge1xuICAgICAgICBpZiAodHlwZT09PSdjdXJyZW50Jykge1xuICAgICAgICAgIHJldHVybiBjYXJ0LnJlZHVjZShmdW5jdGlvbihvLCBpdGVtKSB7cmV0dXJuIG8gKyAoXG4gICAgICAgICAgICBpdGVtLnNvY2sucHJpY2UqaXRlbS5xdWFudGl0eSl9LCAwKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBjYXJ0LnJlZHVjZShmdW5jdGlvbihvLCBvcmRlcikge1xuICAgICAgICAgICAgcmV0dXJuIG8gKyBvcmRlci5pdGVtcy5yZWR1Y2UoZnVuY3Rpb24obywgaXRlbSkge1xuICAgICAgICAgICAgICByZXR1cm4gbyArIChpdGVtLnNvY2sucHJpY2UqaXRlbS5xdWFudGl0eSl9LCAwKVxuICAgICAgICAgIH0sIDApXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSxcbiAgICB1cGRhdGVJdGVtOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wdXQoJy9hcGkvb3JkZXInLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLmRhdGEgfSlcbiAgICB9LFxuICAgIGRlbGV0ZUl0ZW06IGZ1bmN0aW9uKGl0ZW1JZCkge1xuICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9vcmRlci8nK2l0ZW1JZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHRvUmVtb3ZlKSB7XG4gICAgICAgIGNhY2hlZENhcnQuc3BsaWNlKGNhY2hlZENhcnQubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uaWQgfSkuaW5kZXhPZihpdGVtSWQpLDEpXG4gICAgICAgIHJldHVybiBjYWNoZWRDYXJ0XG4gICAgICB9KVxuICAgIH0sXG4gICAgZW5zdXJlQ2FydDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyL2NyZWF0ZWNhcnQnKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgcmV0dXJuIHtleGlzdHM6IG9yZGVyLmRhdGF9XG4gICAgICB9KVxuICAgIH0sXG5cbiAgfVxufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjdXJyZW50Q2FydCcsIHtcbiAgICB1cmw6ICcvY2FydC9jdXJyZW50Jyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9vcmRlci9jYXJ0Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdjYXJ0Q3VycmVudCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0Y3VycmVudENhcnQ6IGZ1bmN0aW9uIChPcmRlckZhY3RvcnkpIHtcblx0XHRcdFx0cmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnY3VycmVudCcpXG5cdFx0XHR9XG5cdFx0fVxuICB9KVxuXG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjYXJ0SGlzdG9yeScsIHtcbiAgICB1cmw6ICcvY2FydC9oaXN0b3J5JyxcbiAgICB0ZW1wbGF0ZVVybDogJy9qcy9vcmRlci9wYXN0Lmh0bWwnLFxuICAgIGNvbnRyb2xsZXI6ICdjYXJ0SGlzdG9yeScsXG4gICAgcmVzb2x2ZToge1xuICAgICAgY2FydEhpc3Rvcnk6IGZ1bmN0aW9uIChPcmRlckZhY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnaGlzdG9yeScpO1xuICAgICAgfVxuICAgIH1cbiAgfSlcblxufSlcbiIsImFwcC5mYWN0b3J5KCdTb2NrRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBzaW5nbGVTb2NrOiBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay8nK3NvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIHNvY2tCeVVzZXJJZDogZnVuY3Rpb24odXNlcklkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svYnlVc2VyLycgKyB1c2VySWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBtb3N0UmVjZW50U29ja3M6IGZ1bmN0aW9uICgpIHtcbiAgICBcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay9yZWNlbnQnKVxuICAgIFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgXHRcdHJldHVybiByZXMuZGF0YVxuICAgIFx0fSlcbiAgICB9LFxuXG4gICAgc2F2ZURlc2lnbjogZnVuY3Rpb24gKG5ld1NvY2tEYXRhT2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9zb2NrLycsIG5ld1NvY2tEYXRhT2JqKVxuICAgIH0sXG5cbiAgICBwcmVwYXJlVGFnczogZnVuY3Rpb24gKHRhZ0lucHV0KSB7XG4gICAgICByZXR1cm4gdGFnSW5wdXQuc3BsaXQoJyAnKS5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICBlID0gZS5yZXBsYWNlKC8sL2ksIFwiXCIpO1xuICAgICAgICBlID0gZS5zdWJzdHJpbmcoMSk7XG4gICAgICAgIHJldHVybiBlXG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgdXB2b3RlOiBmdW5jdGlvbiAoc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9zb2NrL3Vwdm90ZScsIHtpZDogc29ja0lkfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXMuZGF0YSlcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgfSlcbiAgICB9LFxuXG4gICAgZG93bnZvdGU6IGZ1bmN0aW9uIChzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svZG93bnZvdGUnLCB7aWQ6IHNvY2tJZH0pXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgfSlcbiAgICB9LFxuXG4gICAgZGVsZXRlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svZGVsZXRlLycgKyBpZClcbiAgICAgIC50aGVuKCRzdGF0ZS5nbygnaG9tZScpKVxuICAgIH1cblxuICB9XG5cbn0pXG4iLCIvLyBhcHAuY29udHJvbGxlcignc29ja1ZpZXdDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgU29ja0ZhY3RvcnksIFJldmlld0ZhY3RvcnkpIHtcblxuLy8gICAkc2NvcGUuc2V0U29jayA9IGZ1bmN0aW9uKHNvY2tJZCkge1xuLy8gICAgIHJldHVybiBTb2NrRmFjdG9yeS5zaW5nbGVTb2NrKHNvY2tJZCkgLy8gcmV0dXJuP1xuLy8gICAgIC50aGVuKGZ1bmN0aW9uKHNvY2spIHtcbi8vICAgICAgICRzY29wZS5zb2NrID0gc29ja1xuLy8gICAgIH0pXG4vLyAgIH1cblxuLy8gICAkc2NvcGUuc2V0UmV2aWV3cyA9IGZ1bmN0aW9uKHNvY2tJZCkge1xuLy8gICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LnByb2R1Y3RSZXZpZXdzKHNvY2tJZClcbi8vICAgICAudGhlbihmdW5jdGlvbihyZXZpZXdzKSB7XG4vLyAgICAgICAkc2NvcGUucmV2aWV3cyA9IHJldmlld3Ncbi8vICAgICB9KVxuLy8gICB9XG5cbi8vICAgJHNjb3BlLnNldFNvY2soMSk7XG4vLyAgICRzY29wZS5zZXRSZXZpZXdzKDEpO1xuXG4vLyAgICRzY29wZS5uZXdSZXZpZXcgPSBmdW5jdGlvbigpIHtcbi8vICAgICB2YXIgbmV3UmV2aWV3ID0ge1xuLy8gICAgICAgdGV4dDogJHNjb3BlLnJldmlld1RleHQsXG4vLyAgICAgICBzb2NrSWQ6ICRzY29wZS5zb2NrLmlkXG4vLyAgICAgfVxuLy8gICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LnBvc3RSZXZpZXcobmV3UmV2aWV3KVxuLy8gICAgIC50aGVuKGZ1bmN0aW9uKG5ld1Jldmlldyl7XG4vLyAgICAgICB2YXIgcmV2aWV3ID0ge307XG4vLyAgICAgICByZXZpZXcudXNlciA9IHt9O1xuXG4vLyAgICAgICAgIHJldmlldy51c2VyLmZpcnN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5maXJzdF9uYW1lO1xuLy8gICAgICAgICByZXZpZXcudXNlci5sYXN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5sYXN0X25hbWU7XG4vLyAgICAgICAgIHJldmlldy51c2VyLnByb2ZpbGVfcGljID0gbmV3UmV2aWV3LnVzZXIucHJvZmlsZV9waWM7XG4vLyAgICAgICAgIHJldmlldy51c2VyLnVzZXJuYW1lID0gbmV3UmV2aWV3LnVzZXIudXNlcm5hbWU7XG4vLyAgICAgICAgIHJldmlldy50ZXh0ID0gbmV3UmV2aWV3LnJldmlldy50ZXh0O1xuXG4vLyAgICAgICAkc2NvcGUucmV2aWV3cy5wdXNoKHJldmlldyk7XG4vLyAgICAgICAkc2NvcGUucmV2aWV3VGV4dCA9IG51bGw7XG4vLyAgICAgfSlcbi8vICAgfVxuXG4vLyAgICRzY29wZS5hbHJlYWR5UG9zdGVkID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgLy8gYWRkIGluIGFmdGVyIGZpbmlzaGluZyBvdGhlciBzdHVmZlxuLy8gICB9XG5cbi8vIH0pO1xuXG4vLyBhcHAuY29udHJvbGxlcignc29ja0lkQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCB0aGVTb2NrLCB0aGVSZXZpZXdzLCBSZXZpZXdGYWN0b3J5LCBPcmRlckZhY3RvcnksIEF1dGhTZXJ2aWNlKSB7XG5cbi8vICAgLy8gJHNjb3BlLmRhdGVQYXJzZXIgPSBmdW5jdGlvbihkYXRlKXtcblxuLy8gICAvLyAgIC8vcmV0dXJuIHRvIHRoaXMgbGF0ZXIuIFdvdWxkIGJlIGdvb2QgaWYgc29ja3MgYW5kIHJldmlld3Mgc3RhdGVkIHdoZW4gdGhleSB3ZXJlIHBvc3RlZFxuXG4gIC8vICAgLy9zaG91bGQgYWRkIGl0IHRvIGEgZmFjdG9yeSwgYmVjYXVzZSBtYW55IHBhZ2VzIGNhbiBtYWtlIHVzZSBvZiBpdFxuXG4gIC8vICAgdmFyIG1vbnRoT2JqID0ge1xuICAvLyAgICAgJzAxJzogXCJKYW51YXJ5XCIsXG4gIC8vICAgICAnMDInOiBcIkZlYnJ1YXJ5XCIsXG4gIC8vICAgICAnMDMnOiBcIk1hcmNoXCIsXG4gIC8vICAgICAnMDQnOiBcIkFwcmlsXCIsXG4gIC8vICAgICAnMDUnOiBcIk1heVwiLFxuICAvLyAgICAgJzA2JzogXCJKdW5lXCIsXG4gIC8vICAgICAnMDcnOiBcIkp1bHlcIixcbiAgLy8gICAgICcwOCc6IFwiQXVndXN0XCIsXG4gIC8vICAgICAnMDknOiBcIlNlcHRlbWJlclwiLFxuICAvLyAgICAgJzEwJzogXCJPY3RvYmVyXCIsXG4gIC8vICAgICAnMTEnOiBcIk5vdmVtYmVyXCIsXG4gIC8vICAgICAnMTInOiBcIkRlY2VtYmVyXCJcbiAgLy8gICB9XG5cbiAgLy8gfVxuXG5hcHAuY29udHJvbGxlcignc29ja0lkQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UsICRzdGF0ZVBhcmFtcywgdGhlU29jaywgdGhlUmV2aWV3cywgUmV2aWV3RmFjdG9yeSwgT3JkZXJGYWN0b3J5LCBTb2NrRmFjdG9yeSwgVXNlckZhY3RvcnkpIHtcblxuXG5cbiAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSBmYWxzZTtcbiAgJHNjb3BlLnNvY2sgPSB0aGVTb2NrO1xuICAkc2NvcGUucmV2aWV3cyA9IHRoZVJldmlld3M7XG5cbiAgJHNjb3BlLmFsZXJ0ID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICRzY29wZS5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nXG4gICAgICAkc2NvcGUuJGRpZ2VzdCgpXG4gICAgfSwgMzAwMClcbiAgICAvLyBpZiAoISRzY29wZS5hbGVydGluZykgJHNjb3BlLm1lc3NhZ2UgPT09IG51bGxcbiAgfVxuXG4gICRzY29wZS5nb1RvVXNlclBhZ2UgPSBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiB1c2VySWR9KTtcbiAgfVxuXG4gICRzY29wZS5hZGRJdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW0gPSB7fTtcbiAgICBpdGVtLnNvY2tJZCA9ICRzY29wZS5zb2NrLmlkO1xuICAgIGl0ZW0ucXVhbnRpdHkgPSArJHNjb3BlLnF1YW50aXR5O1xuICAgIGl0ZW0ub3JpZ2luYWxQcmljZSA9ICskc2NvcGUuc29jay5wcmljZTtcbiAgICBpZiAoaXRlbS5xdWFudGl0eSA+IDApIHtcbiAgICAgIE9yZGVyRmFjdG9yeS5hZGRUb0NhcnQoaXRlbSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzcG9uc2UgIT09IFwib2JqZWN0XCIpICRzY29wZS5hbGVydChyZXNwb25zZSk7XG4gICAgICAgIGVsc2UgJHN0YXRlLmdvKCdjdXJyZW50Q2FydCcpO1xuICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSAkc2NvcGUuYWxlcnQoJ1lvdSBoYXZlIHRvIGFkZCBhdCBsZWFzdCBvbmUgc29jayEnKTtcbiAgfVxuXG4gICRzY29wZS5kaXNwbGF5VGFncyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkc2NvcGUuc29jay50YWdzLm1hcChmdW5jdGlvbih0YWcpe1xuICAgICAgcmV0dXJuICcjJyArIHRhZztcbiAgICB9KS5qb2luKFwiLCBcIik7XG4gIH1cblxuICAkc2NvcGUuZGlzcGxheVRhZ3MoKTtcblxuICAkc2NvcGUuZ2V0TG9nZ2VkSW5Vc2VySWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcbiAgICAudGhlbihmdW5jdGlvbih1c2VyKXtcbiAgICAgIGNvbnNvbGUubG9nKHVzZXIpO1xuICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICRzY29wZS5sb2dnZWRJblVzZXJJZCA9ICdub25lJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5sb2dnZWRJblVzZXJJZCA9IHVzZXIuaWQ7XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gICRzY29wZS5nZXRMb2dnZWRJblVzZXJJZCgpO1xuXG4gICRzY29wZS51c2VyQ2Fubm90UG9zdFJldmlldyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJHNjb3BlLnJldmlld05vdEFsbG93ZWQ7XG4gIH1cblxuICAkc2NvcGUudXNlckNhbm5vdFBvc3RSZXZpZXcoKTtcblxuICAkc2NvcGUubmV3UmV2aWV3ID0gZnVuY3Rpb24oKSB7XG5cbiAgLy9pZiB1c2VyIGhhcyBhbHJlYWR5IHJldmlldyBzb2NrLCBkb24ndCBhbGxvdyB1c2VyIHRvIHJldmlldyBpdCBhZ2FpblxuICAgIHZhciB1c2Vyc1dob1Jldmlld2VkU29jayA9ICRzY29wZS5yZXZpZXdzLm1hcChmdW5jdGlvbihyZXZpZXcpe1xuICAgICAgcmV0dXJuIHJldmlldy51c2VySWQ7XG4gICAgfSlcblxuICAgIGlmICgkc2NvcGUubG9nZ2VkSW5Vc2VySWQgPT09ICdub25lJykge1xuICAgICAgJHNjb3BlLnJldmlld0Vycm9yTWVzc2FnZSA9IFwiWW91IG11c3QgYmUgbG9nZ2VkIGluIHRvIHJldmlldyBhIHNvY2shXCI7XG4gICAgICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh1c2Vyc1dob1Jldmlld2VkU29jay5pbmRleE9mKCRzY29wZS5sb2dnZWRJblVzZXJJZCkgIT09IC0xKSB7XG4gICAgICAkc2NvcGUucmV2aWV3RXJyb3JNZXNzYWdlID0gXCJZb3UndmUgYWxyZWFkeSByZXZpZXdlZCB0aGlzIHNvY2shIFlvdSBjYW4ndCByZXZpZXcgaXQgYWdhaW4hXCI7XG4gICAgICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IHRydWU7XG4gIC8vaWYgc29jayBpZCBtYXRjaGVzIHVzZXIgaWQsIHVzZXIgZG9uJ3QgYWxsb3cgdXNlciB0byBwb3N0IGEgcmV2aWV3XG4gICAgfSBlbHNlIGlmICgkc2NvcGUubG9nZ2VkSW5Vc2VySWQgPT09ICRzY29wZS5zb2NrLnVzZXIuaWQpIHtcbiAgICAgICRzY29wZS5yZXZpZXdFcnJvck1lc3NhZ2UgPSBcIllvdSBjYW4ndCByZXZpZXcgeW91ciBvd24gc29jayFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICB2YXIgbmV3UmV2aWV3ID0ge1xuICAgICAgICB0ZXh0OiAkc2NvcGUucmV2aWV3VGV4dCxcbiAgICAgICAgc29ja0lkOiAkc2NvcGUuc29jay5pZFxuICAgICAgfVxuICAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucG9zdFJldmlldyhuZXdSZXZpZXcpXG4gICAgICAudGhlbihmdW5jdGlvbihuZXdSZXZpZXcpe1xuICAgICAgICB2YXIgcmV2aWV3ID0ge307XG4gICAgICAgIHJldmlldy51c2VyID0ge307XG5cbiAgICAgICAgICByZXZpZXcudXNlci5maXJzdF9uYW1lID0gbmV3UmV2aWV3LnVzZXIuZmlyc3RfbmFtZTtcbiAgICAgICAgICByZXZpZXcudXNlci5sYXN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5sYXN0X25hbWU7XG4gICAgICAgICAgcmV2aWV3LnVzZXIucHJvZmlsZV9waWMgPSBuZXdSZXZpZXcudXNlci5wcm9maWxlX3BpYztcbiAgICAgICAgICByZXZpZXcudXNlci51c2VybmFtZSA9IG5ld1Jldmlldy51c2VyLnVzZXJuYW1lO1xuICAgICAgICAgIHJldmlldy50ZXh0ID0gbmV3UmV2aWV3LnJldmlldy50ZXh0O1xuXG4gICAgICAgICRzY29wZS5yZXZpZXdzLnB1c2gocmV2aWV3KTtcbiAgICAgICAgJHNjb3BlLnJldmlld1RleHQgPSBudWxsO1xuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAkc2NvcGUudXB2b3RlID0gZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgcmV0dXJuIFNvY2tGYWN0b3J5LnVwdm90ZShzb2NrSWQpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgJHNjb3BlLnNvY2sudXB2b3RlcysrXG4gICAgfSlcbiAgfVxuICBcbiAgJHNjb3BlLmRvd252b3RlID0gZnVuY3Rpb24gKHNvY2tJZCkge1xuICAgIHJldHVybiBTb2NrRmFjdG9yeS5kb3dudm90ZShzb2NrSWQpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgJHNjb3BlLnNvY2suZG93bnZvdGVzKytcbiAgICB9KVxuICB9XG5cbiAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gdXNlci5pZCA9PSAkc2NvcGUuc29jay5Vc2VySWQgfHwgdXNlci5pc0FkbWluPyB0cnVlIDogZmFsc2VcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICRzY29wZS52ZXJpZnlVc2VyID0gcmVzdWx0XG4gICAgfSk7XG5cbiAgJHNjb3BlLmRlbGV0ZSA9IFNvY2tGYWN0b3J5LmRlbGV0ZVxuXG59KTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgIC8vIFJlZ2lzdGVyIG91ciAqYWJvdXQqIHN0YXRlLlxuICAgIC8vICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzb2NrcycsIHtcbiAgICAvLyAgICAgdXJsOiAnL3NvY2tzJyxcbiAgICAvLyAgICAgY29udHJvbGxlcjogJ3NvY2tWaWV3Q29udHJvbGxlcicsXG4gICAgLy8gICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuaHRtbCdcbiAgICAvLyB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVTb2NrVmlldycsIHtcbiAgICAgIHVybDonL3NvY2tzLzppZCcsXG4gICAgICBjb250cm9sbGVyOiAnc29ja0lkQ29udHJvbGxlcicsXG4gICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3Lmh0bWwnLFxuICAgICAgcmVzb2x2ZToge1xuICAgICAgICB0aGVTb2NrOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBTb2NrRmFjdG9yeSkge1xuICAgICAgICAgIHJldHVybiBTb2NrRmFjdG9yeS5zaW5nbGVTb2NrKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgfSxcbiAgICAgICAgdGhlUmV2aWV3czogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgUmV2aWV3RmFjdG9yeSkge1xuICAgICAgICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LnByb2R1Y3RSZXZpZXdzKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG5cbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ1BlcnNvbmFsSW5mb0N0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlLCB0aGVVc2VyLCBQZXJzb25hbEluZm9GYWN0b3J5KSB7XG5cblx0JHNjb3BlLnVzZXJJZCA9IHRoZVVzZXIuaWQ7XG5cdCRzY29wZS5hZGRyZXNzMSA9IHRoZVVzZXIuYWRkcmVzczE7XG5cdCRzY29wZS5hZGRyZXNzMiA9IHRoZVVzZXIuYWRkcmVzczI7XG5cdCRzY29wZS56aXAgPSB0aGVVc2VyLnppcDtcblx0JHNjb3BlLnN0YXRlID0gdGhlVXNlci5zdGF0ZTtcblx0JHNjb3BlLmNvdW50cnkgPSB0aGVVc2VyLmNvdW50cnk7XG5cdCRzY29wZS5waG9uZSA9IHRoZVVzZXIucGhvbmU7XG5cdCRzY29wZS5kaXNwbGF5RXJyb3IgPSBmYWxzZTtcblxuXHQvL29ubHkgYSB0ZW1wb3Jhcnkgc29sdXRpb24gLS0gY2hlY2tzIHRvIHNlZSBpZiB1c2VyIGlzIGEgbmV3IHVzZXIgYnkgc2VlaW5nIGlmIHRoZXkncmUgbG9nZ2VkIGluXG5cblx0Ly8gJHNjb3BlLmN1cnJlbnRVc2VySXNOZXcgPSBmdW5jdGlvbigpIHtcbiAvLyAgIFx0XHQgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpXG4gLy8gICBcdFx0LnRoZW4oZnVuY3Rpb24odXNlcil7XG4gLy8gICAgXHRcdGlmICghdXNlcikgcmV0dXJuICRzY29wZS5uZXdVc2VyID0gdHJ1ZTtcbiAvLyAgXHRcdFx0ZWxzZSByZXR1cm4gJHNjb3BlLm5ld1VzZXIgPSBmYWxzZTtcbiAvLyAgICBcdH0pXG4gLy8gXHR9XG5cbiAvLyBcdCRzY29wZS5jdXJyZW50VXNlcklzTmV3KCk7XG5cbiBcdGNvbnNvbGUubG9nKFwiaGVlZWVlZWVleVwiKTtcblxuXHQkc2NvcGUuc3VibWl0UGVyc29uYWwgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRpZiAoKCRzY29wZS5jb3VudHJ5ID09PSBcIlVuaXRlZCBTdGF0ZXNcIiB8fCAkc2NvcGUuY291bnRyeSA9PT0gXCJDYW5hZGFcIikgJiYgJHNjb3BlLnN0YXRlID09PSBcIlwiKSB7XG5cdFx0XHQkc2NvcGUuZGlzcGxheUVycm9yID0gdHJ1ZTtcblx0XHRcdHJldHVybiAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJJZiBpbiBVUyBvciBDYW5hZGEsIG11c3QgaW5jbHVkZSBTdGF0ZS9Qcm92aW5jZVwiO1xuXHRcdH1cblxuXHRcdHZhciB1c2VySW5mbyA9IHtcblx0XHRcdGFkZHJlc3MxIDogJHNjb3BlLmFkZHJlc3MxLFxuXHRcdFx0YWRkcmVzczIgOiAkc2NvcGUuYWRkcmVzczIsXG5cdFx0XHR6aXAgOiAkc2NvcGUuemlwLFxuXHRcdFx0c3RhdGUgOiAkc2NvcGUuc3RhdGUsXG5cdFx0XHRjb3VudHJ5IDogJHNjb3BlLmNvdW50cnksXG5cdFx0XHRwaG9uZSA6ICRzY29wZS5waG9uZVxuXHRcdH1cblxuXHRcdHJldHVybiBQZXJzb25hbEluZm9GYWN0b3J5LnN1Ym1pdCgkc2NvcGUudXNlcklkLCB1c2VySW5mbylcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHQvLyBpZiAoJHNjb3BlLm5ld1VzZXIpIFxuXHRcdFx0cmV0dXJuICRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdFx0Ly8gZWxzZSByZXR1cm4gJHN0YXRlLmdvKCd1c2VyJywge3VzZXJJZDogJHNjb3BlLnVzZXJJZH0pO1xuXHRcdH0pXG5cdH1cblxufSk7IiwiYXBwLmZhY3RvcnkoJ1BlcnNvbmFsSW5mb0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAvLyBQZXJzb25hbEZhY3RvcnkgPSB7fTtcblxuICByZXR1cm4ge1xuICAgIHN1Ym1pdCA6IGZ1bmN0aW9uKGlkLCB1c2VySW5mbyl7XG4gICAgICByZXR1cm4gJGh0dHAucHV0KCcvYXBpL3VzZXIvJyArIGlkLCB1c2VySW5mbylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncGVyc29uYWwnLCB7XG5cdFx0dXJsOiAnL3BlcnNvbmFsLzppZCcsXG5cdFx0Y29udHJvbGxlcjogJ1BlcnNvbmFsSW5mb0N0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3BlcnNvbmFsaW5mby9wZXJzb25hbGluZm8udmlldy5odG1sJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR0aGVVc2VyOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBVc2VyRmFjdG9yeSl7XG5cdFx0XHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLmlkKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufSk7IiwiYXBwLmZhY3RvcnkoJ1Jldmlld0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICByZXR1cm4ge1xuICAgIHBvc3RSZXZpZXc6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvcmV2aWV3LycsIG9iailcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcbiAgICBwcm9kdWN0UmV2aWV3czogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Jldmlldy9zb2NrLycrc29ja0lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZWFyY2hSZXN1bHRzJywge1xuXHRcdHVybDogJy9zZWFyY2gvOnNlYXJjaFRlcm1zJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9zZWFyY2hyZXN1bHRzL3NlYXJjaC52aWV3Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6IFwic2VhcmNoQ3RybFwiLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGFsbFJlc3VsdHM6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFNlYXJjaEZhY3RvcnkpIHtcblx0XHRcdFx0cmV0dXJuIFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dCgkc3RhdGVQYXJhbXMuc2VhcmNoVGVybXMpXG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvLyBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBhbGxSZXN1bHRzKSB7XG5cdFx0Ly8gXHQkc2NvcGUucmVzdWx0cyA9IGFsbFJlc3VsdHM7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhcIkFsbCBSZXN1bHRzISFcIiwgYWxsUmVzdWx0cyk7XG5cdFx0Ly8gXHQkc2NvcGUubnVtYmVyID0gMTIzO1xuXHRcdC8vIH1cblx0XHQvLyBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMpIHtcblx0XHQvLyBcdGNvbnNvbGUubG9nKFwiSEVSRUVFRUVcIiwgJHN0YXRlUGFyYW1zLnJlc3VsdHMpXG5cdFx0Ly8gXHQkc2NvcGUucmVzdWx0cyA9ICRzdGF0ZVBhcmFtcy5yZXN1bHRzXG5cdFx0Ly8gfVxuXHR9KVxufSlcbiIsImFwcC5jb250cm9sbGVyKCdTaWdudXBDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgU2lnbnVwRmFjdG9yeSwgJHN0YXRlKSB7XG5cbiAgZnVuY3Rpb24gcGFzc3dvcmRWYWxpZCAocGFzc3dvcmQpIHtcbiAgICBpZiAocGFzc3dvcmQubGVuZ3RoIDwgNikge1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJQYXNzd29yZCBtdXN0IGJlIDYgY2hhcmFjdGVycyBsb25nIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAocGFzc3dvcmQgIT09ICRzY29wZS5wdzIpIHtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiVGhlIHBhc3N3b3JkIGZpZWxkcyBkb24ndCBtYXRjaCFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKC9cXFcvLnRlc3QocGFzc3dvcmQpKXtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiUGFzc3dvcmQgY2Fubm90IGNvbnRhaW4gc3BlY2lhbCBjaGFyYWN0ZXJzIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAkc2NvcGUuc2hvd0Vycm9yID0gZmFsc2U7XG5cbiAgJHNjb3BlLmRpc3BsYXlFcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkc2NvcGUuc2hvd0Vycm9yO1xuICB9XG5cbiAgJHNjb3BlLnN1Ym1pdFNpZ251cCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAocGFzc3dvcmRWYWxpZCgkc2NvcGUucGFzc3dvcmQpKXtcbiAgICAgIGNvbnNvbGUubG9nKFwibm93IEkgZG9uJ3Qgd29yayFcIik7XG4gICAgICByZXR1cm4gU2lnbnVwRmFjdG9yeS5zdWJtaXQoe1xuICAgICAgIGVtYWlsOiAkc2NvcGUuZW1haWwsXG4gICAgICAgdXNlcm5hbWU6ICRzY29wZS51c2VybmFtZSxcbiAgICAgICBwYXNzd29yZDogJHNjb3BlLnBhc3N3b3JkLFxuICAgICAgIGZpcnN0X25hbWU6ICRzY29wZS5maXJzdG5hbWUsXG4gICAgICAgbGFzdF9uYW1lOiAkc2NvcGUubGFzdG5hbWUsXG4gICAgICAgaXNBZG1pbjogZmFsc2UsXG4gICAgICAgbmV3VXNlcjogdHJ1ZVxuICAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgLy8gcmVzcG9uc2UubmV3VXNlciA9IHRydWU7XG4gICAgICAgIHJldHVybiAkc3RhdGUuZ28oJ3BlcnNvbmFsJywge2lkOiByZXNwb25zZS5pZH0pO1xuICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG59KTsiLCIvLyBhcHAuZmFjdG9yeSgnU2lnbnVwRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4vLyAgIHZhciBTaWdudXBGYWN0b3J5ID0ge307XG5cbi8vICAgU2lnbnVwRmFjdG9yeS5zdWJtaXQgPSBmdW5jdGlvbih1c2VySW5mbyl7XG4vLyAgIFx0Y29uc29sZS5sb2codXNlckluZm8pO1xuLy8gICBcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvJywgdXNlckluZm8pXG4vLyAgIFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuLy8gICBcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4vLyAgIFx0fSlcbi8vICAgfVxuXG4vLyAgIHJldHVybiBTaWdudXBGYWN0b3J5O1xuXG4vLyB9KVxuXG5hcHAuZmFjdG9yeSgnU2lnbnVwRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXHR2YXIgU2lnbnVwRmFjdG9yeSA9IHt9O1xuXG5cdFNpZ251cEZhY3Rvcnkuc3VibWl0ID0gZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG5cdFx0Y29uc29sZS5sb2coXCJGcm9tIFNpZ251cCBGYWN0b3J5XCIsIHVzZXJJbmZvKTtcblx0XHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2VyLycsIHVzZXJJbmZvKVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuXHRcdH0pXG5cdH1cblx0cmV0dXJuIFNpZ251cEZhY3Rvcnk7XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ251cCcsIHtcblx0XHR1cmw6ICcvc2lnbnVwJyxcblx0XHRjb250cm9sbGVyOiAnU2lnbnVwQ3RybCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvc2lnbnVwL3NpZ251cC52aWV3Lmh0bWwnXG5cdH0pO1xuXG59KTsiLCJhcHAuY29udHJvbGxlcignVXNlckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIHRoZVVzZXIsIHRoZVVzZXJTb2NrcywgQXV0aFNlcnZpY2UsIFVzZXJGYWN0b3J5KSB7XG4gICAgY29uc29sZS5sb2coXCJjb250cm9sbGVyXCIsIHRoZVVzZXJTb2Nrcyk7XG5cdCRzY29wZS51c2VyID0gdGhlVXNlcjtcblx0JHNjb3BlLnNvY2tzID0gdGhlVXNlclNvY2tzO1xuXG5cdCRzY29wZS50b1NoaXBwaW5nSW5mbyA9IGZ1bmN0aW9uKGlkKXtcblx0XHQkc3RhdGUuZ28oJ3BlcnNvbmFsJywge2lkOiBpZH0pO1xuXHR9O1xuXG5cdCRzY29wZS50b1NvY2tWaWV3ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0JHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KVxuXHR9O1xuXG5cdEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIHVzZXIuaWQgPT0gJHNjb3BlLnVzZXIuaWQgfHwgdXNlci5pc0FkbWluID8gdHJ1ZSA6IGZhbHNlXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgXHRjb25zb2xlLmxvZyhyZXN1bHQpXG4gICAgXHQkc2NvcGUudmVyaWZ5VXNlciA9IHJlc3VsdFxuICAgIH0pO1xuXG4gICAgJHNjb3BlLmRlbGV0ZSA9IFVzZXJGYWN0b3J5LmRlbGV0ZVxufSlcbiIsImFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlKSB7XG5cdHZhciBVc2VyRmFjdG9yeSA9IHt9O1xuXG5cdFVzZXJGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlci8nICsgaWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImZhY3RvcnlcIiwgcmVzcG9uc2UuZGF0YSlcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhXG5cdFx0fSlcblx0fVxuXG5cdFVzZXJGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlcnMnKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGFcblx0XHR9KVxuXHR9XG5cblx0VXNlckZhY3RvcnkuZGVsZXRlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci9kZWxldGUvJyArIGlkKVxuXHRcdC50aGVuKCRzdGF0ZS5nbygnaG9tZScpKVxuXHR9XG5cblx0cmV0dXJuIFVzZXJGYWN0b3J5O1xufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1c2VyJywge1xuXHRcdHVybDogJy91c2VyLzp1c2VySWQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3VzZXIvdXNlci1wcm9maWxlLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdVc2VyQ3RybCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0dGhlVXNlcjogZnVuY3Rpb24gKFVzZXJGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMudXNlcklkKTtcblx0XHRcdH0sXG5cdFx0XHR0aGVVc2VyU29ja3M6IGZ1bmN0aW9uIChTb2NrRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHJldHVybiBTb2NrRmFjdG9yeS5zb2NrQnlVc2VySWQoJHN0YXRlUGFyYW1zLnVzZXJJZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxufSlcbiIsImFwcC5jb250cm9sbGVyKCduYXZiYXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBTZWFyY2hGYWN0b3J5LCBPcmRlckZhY3RvcnkpIHtcblxuXHQkc2NvcGUuc2VhcmNoID0gZnVuY3Rpb24oc2VhcmNoVGVybXMpe1xuXHRcdC8vIFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dChzZWFyY2hUZXJtcylcblx0XHQvLyAudGhlbihmdW5jdGlvbihyZXN1bHRzKXtcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gcmVzdWx0cztcblx0XHQvLyBcdGNvbnNvbGUubG9nKHJlc3VsdHMpO1xuXHRcdFx0cmV0dXJuICRzdGF0ZS5nbygnc2VhcmNoUmVzdWx0cycsIHtzZWFyY2hUZXJtczogc2VhcmNoVGVybXN9KTtcblx0XHQvLyB9KVxuXHR9XG5cblx0cmV0dXJuIE9yZGVyRmFjdG9yeS5lbnN1cmVDYXJ0KClcblx0LnRoZW4oZnVuY3Rpb24oaWQpIHtcblx0XHRjb25zb2xlLmxvZyhpZClcblx0fSlcbn0pXG5cbmFwcC5jb250cm9sbGVyKCdzZWFyY2hDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBhbGxSZXN1bHRzLCAkc3RhdGVQYXJhbXMpIHtcblx0JHNjb3BlLnJlc3VsdHMgPSBhbGxSZXN1bHRzO1xuXHQkc2NvcGUuc2VlU29jayA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdCRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcblx0fVxufSlcbiIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5mYWN0b3J5KFwiU2VhcmNoRmFjdG9yeVwiLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0dmFyIFNlYXJjaEZhY3RvcnkgPSB7fTtcblxuXHRTZWFyY2hGYWN0b3J5LmZpbmRCeVNlYXJjaFRleHQgPSBmdW5jdGlvbiAodGV4dCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc2VhcmNoLz9xPScgKyB0ZXh0KVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdHMpIHtcblx0XHRcdHJldHVybiByZXN1bHRzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiBTZWFyY2hGYWN0b3J5O1xufSkiLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSwgT3JkZXJGYWN0b3J5KSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIE9yZGVyRmFjdG9yeS5lbnN1cmVDYXJ0KClcblxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ015IFByb2ZpbGUnLCBzdGF0ZTogJ3VzZXIoe3VzZXJJZDp1c2VyLmlkfSknLCBhdXRoOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgLy8geyBsYWJlbDogJ0Fib3V0Jywgc3RhdGU6ICdhYm91dCcgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnRGVzaWduIGEgU29jaycsIHN0YXRlOiAnZGVzaWduVmlldycgfSxcbiAgICAgICAgICAgICAgICAvLyB7IGxhYmVsOiAnQWRtaW4gRGFzaGJvYXJkJywgc3RhdGU6ICdhZG1pbid9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS5hZG1pbkl0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHtsYWJlbDogJ0FkbWluIERhc2hib2FyZCcsIHN0YXRlOiAnYWRtaW4nfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKClcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ29hdXRoQnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICBwcm92aWRlck5hbWU6ICdAJ1xuICAgIH0sXG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uaHRtbCdcbiAgfVxufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
