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

app.controller('checkout', function ($scope, OrderFactory, currentCart) {});

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
        return OrderFactory.updateItem(sock).then(function (update) {
          item.quantity = item.newAmount;
          item.newAmount = null;
        }).then(function () {
          scope.calcTotal();
        });
      };

      scope.delete = function (item) {
        var todelete = { item: item };
        OrderFactory.deleteItem(todelete.item.id);
      };

      scope.singleSockView = function (id) {
        $state.go('singleSockView', { id: id });
      };

      scope.calcTotal = function () {
        return OrderFactory.calculateTotal('current').then(function (cartTotal) {
          scope.total = cartTotal;
        });
      };

      scope.calcTotal().then(function () {
        console.log(scope.total);
      });

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

app.controller('sockIdController', function ($scope, $state, AuthService, $stateParams, theSock, theReviews, ReviewFactory, OrderFactory, SockFactory) {

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
app.controller('UserCtrl', function ($scope, $state, theUser, theUserSocks, AuthService) {
  console.log("controller", theUserSocks);
  $scope.user = theUser;
  $scope.socks = theUserSocks;

  $scope.toShippingInfo = function (id) {
    $state.go('personal', { id: id });
  };

  $scope.toSockView = function (id) {
    $state.go('singleSockView', { id: id });
  };

  $scope.verifyUser = function () {
    if (AuthService.isAuthenticated()) {
      return AuthService.getLoggedInUser().then(function (user) {
        return user == $scope.user;
      });
    }
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
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state, OrderFactory) {

  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'js/common/directives/navbar/navbar.html',
    link: function link(scope) {

      OrderFactory.ensureCart();

      scope.items = [{ label: 'Home', state: 'home' }, { label: 'My Profile', state: 'user({userId:user.id})', auth: true },
      // { label: 'About', state: 'about' },
      { label: 'Design a Sock', state: 'designView' }, { label: 'Admin Dashboard', state: 'admin' }];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuY29udHJvbGxlci5qcyIsImRlc2lnbi9kZXNpZ24tZGlyZWN0aXZlLmpzIiwiZGVzaWduL2Rlc2lnbi5jb250cm9sbGVyLmpzIiwiZGVzaWduL2Rlc2lnbi5kaXJlY3RpdmUuanMiLCJkZXNpZ24vZGVzaWduLmpzIiwiZGVzaWduL2Rlc2lnbi5zdGF0ZS5qcyIsImRvY3MvZG9jcy5qcyIsImZzYS9mc2EtcHJlLWJ1aWx0LmpzIiwiaG9tZS9ob21lLmpzIiwibG9naW4vbG9naW4uanMiLCJtZW1iZXJzLW9ubHkvbWVtYmVycy1vbmx5LmpzIiwib3JkZXIvb3JkZXIuY29udHJvbGxlci5qcyIsIm9yZGVyL29yZGVyLmRpcmVjdGl2ZS5qcyIsIm9yZGVyL29yZGVyLmZhY3RvcnkuanMiLCJvcmRlci9vcmRlci5zdGF0ZS5qcyIsInBlcnNvbmFsaW5mby9wZXJzb25hbGluZm8uY29udHJvbGxlci5qcyIsInBlcnNvbmFsaW5mby9wZXJzb25hbGluZm8uZmFjdG9yeS5qcyIsInBlcnNvbmFsaW5mby9wZXJzb25hbGluZm8uc3RhdGUuanMiLCJwcm9kdWN0dmlldy9wcm9kdWN0dmlldy5mYWN0b3J5LmpzIiwicHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuanMiLCJyZXZpZXcvcmV2aWV3LmZhY3RvcnkuanMiLCJzZWFyY2hyZXN1bHRzL3NlYXJjaC5zdGF0ZS5qcyIsInNpZ251cC9zaWdudXAuY29udHJvbGxlci5qcyIsInNpZ251cC9zaWdudXAuZmFjdG9yeS5qcyIsInNpZ251cC9zaWdudXAuc3RhdGUuanMiLCJ1c2VyL3VzZXItY29udHJvbGxlci5qcyIsInVzZXIvdXNlci1mYWN0b3J5LmpzIiwidXNlci91c2VyLXN0YXRlcy5qcyIsImNvbW1vbi9jb250cm9sbGVycy9uYXZiYXIuY29udHJvbGxlci5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9zZWFyY2guZmFjdG9yeS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uZGlyZWN0aXZlLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFDQSxPQUFBLEdBQUEsR0FBQSxRQUFBLE1BQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEsaUJBQUEsRUFBQTs7QUFFQSxvQkFBQSxTQUFBLENBQUEsSUFBQTs7QUFFQSxxQkFBQSxTQUFBLENBQUEsR0FBQTs7QUFFQSxxQkFBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQSxRQUFBLENBQUEsTUFBQTtBQUNBLEdBRkE7QUFHQSxDQVRBOzs7QUFZQSxJQUFBLEdBQUEsQ0FBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOzs7QUFHQSxNQUFBLCtCQUFBLFNBQUEsNEJBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxXQUFBLE1BQUEsSUFBQSxJQUFBLE1BQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxHQUZBOzs7O0FBTUEsYUFBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsUUFBQSxFQUFBOztBQUVBLFFBQUEsQ0FBQSw2QkFBQSxPQUFBLENBQUEsRUFBQTs7O0FBR0E7QUFDQTs7QUFFQSxRQUFBLFlBQUEsZUFBQSxFQUFBLEVBQUE7OztBQUdBO0FBQ0E7OztBQUdBLFVBQUEsY0FBQTs7QUFFQSxnQkFBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBOzs7O0FBSUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxlQUFBLEVBQUEsQ0FBQSxRQUFBLElBQUEsRUFBQSxRQUFBO0FBQ0EsT0FGQSxNQUVBO0FBQ0EsZUFBQSxFQUFBLENBQUEsT0FBQTtBQUNBO0FBQ0EsS0FUQTtBQVdBLEdBNUJBO0FBOEJBLENBdkNBOztBQ2ZBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOzs7QUFHQSxpQkFBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsU0FBQSxRQURBO0FBRUEsZ0JBQUEsaUJBRkE7QUFHQSxpQkFBQTtBQUhBLEdBQUE7QUFNQSxDQVRBOztBQVdBLElBQUEsVUFBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBOzs7QUFHQSxTQUFBLE1BQUEsR0FBQSxFQUFBLE9BQUEsQ0FBQSxhQUFBLENBQUE7QUFFQSxDQUxBOztBQ1hBLElBQUEsVUFBQSxDQUFBLFVBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLENBRUEsQ0FGQTs7QUNBQSxJQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsU0FBQTtBQUNBLGNBQUEsR0FEQTtBQUVBLGlCQUFBLDRCQUZBOzs7O0FBTUEsVUFBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBLGNBQUEsRUFBQTs7QUFFQSxVQUFBLFFBQUEsTUFBQSxLQUFBO0FBQ0EsVUFBQSxjQUFBLE1BQUEsV0FBQTtBQUNBLFVBQUEsT0FBQSxNQUFBLElBQUE7QUFDQSxVQUFBLFNBQUEsUUFBQSxJQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsVUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBLFdBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsWUFBQSxXQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsR0FBQSxDQUFBLE9BQUEsRUFBQSxPQUFBO0FBQ0EsWUFBQSxVQUFBLE9BQUEsU0FBQSxFQUFBOztBQUVBLFlBQUEsaUJBQUE7QUFDQSxpQkFBQSxLQURBO0FBRUEsdUJBQUEsV0FGQTtBQUdBLGdCQUFBLE9BSEE7QUFJQSxpQkFBQTtBQUpBLFNBQUE7QUFNQSxlQUFBLFlBQUEsVUFBQSxDQUFBLGNBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUEsQ0FBQSxNQUFBLEVBQUEsRUFBQSxRQUFBLE9BQUEsSUFBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFNBSEEsQ0FBQTtBQUlBLE9BZkE7O0FBa0JBLFVBQUEsUUFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLFVBQUEsVUFBQSxFQUFBLFFBQUEsRUFBQSxDQUFBLEVBQUEsVUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUEsVUFBQSxFQUFBLFFBQUEsQ0FBQTtBQUNBLFVBQUEsU0FBQTtBQUNBLFVBQUEsWUFBQSxLQUFBOztBQUVBLFVBQUEsYUFBQSxJQUFBLEtBQUEsRUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQWdCQSxpQkFBQSxHQUFBLEdBQUEsZ0JBQUE7O0FBRUEsaUJBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxTQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsRUFBQSxDQUFBO0FBQ0EsT0FGQTs7O0FBS0EsUUFBQSxXQUFBLEVBQUEsRUFBQSxDQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsWUFBQTs7QUFFQSxVQUFBLElBQUEsRUFBQSxRQUFBLEdBQUEsV0FBQSxDQUFBLFVBQUE7O0FBRUEsVUFBQSxJQUFBLEVBQUEsUUFBQSxDQUFBLFVBQUE7O0FBRUEsZ0JBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7QUFDQSxPQVBBOzs7QUFVQSxRQUFBLG9CQUFBLEVBQUEsS0FBQSxDQUFBLFlBQUE7O0FBRUE7QUFDQSxVQUFBLGNBQUEsRUFBQSxNQUFBO0FBQ0EsT0FKQTs7O0FBT0EsZUFBQSxXQUFBLEdBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxVQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxTQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsR0FBQTs7QUFJQTs7QUFFQSxRQUFBLG1CQUFBLEVBQUEsRUFBQSxDQUFBLE9BQUEsRUFBQSxXQUFBOzs7QUFHQSxRQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTs7QUFFQSxZQUFBLFlBQUEsRUFBQSxXQUFBLENBQUE7QUFDQSxrQkFBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLFVBQUEsY0FBQSxFQUFBLE1BQUEsQ0FBQSxTQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsUUFBQSxHQUFBLFdBQUEsQ0FBQSxVQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxVQUFBO0FBQ0EsZ0JBQUEsRUFBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7O0FBRUEsVUFBQSxjQUFBLEVBQUEsSUFBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLENBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsR0FBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxFQUFBLFNBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsSUFBQSxHQUFBLENB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QkFBQSx3QkFMQTtBQU1BLG1CQUFBO0FBTkEsR0FBQTs7QUFTQSxNQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxRQUFBLGFBQUE7QUFDQSxXQUFBLFlBQUEsZ0JBREE7QUFFQSxXQUFBLFlBQUEsYUFGQTtBQUdBLFdBQUEsWUFBQSxjQUhBO0FBSUEsV0FBQSxZQUFBO0FBSkEsS0FBQTtBQU1BLFdBQUE7QUFDQSxxQkFBQSx1QkFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxVQUFBLENBQUEsV0FBQSxTQUFBLE1BQUEsQ0FBQSxFQUFBLFFBQUE7QUFDQSxlQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQTtBQUNBO0FBSkEsS0FBQTtBQU1BLEdBYkE7O0FBZUEsTUFBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxrQkFBQSxZQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsV0FEQSxFQUVBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsYUFBQSxVQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsS0FKQSxDQUFBO0FBTUEsR0FQQTs7QUFTQSxNQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGFBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxVQUFBLE9BQUEsU0FBQSxJQUFBO0FBQ0EsY0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBQSxJQUFBO0FBQ0EsaUJBQUEsVUFBQSxDQUFBLFlBQUEsWUFBQTtBQUNBLGFBQUEsS0FBQSxJQUFBO0FBQ0E7Ozs7QUFJQSxTQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsYUFBQSxDQUFBLENBQUEsUUFBQSxJQUFBO0FBQ0EsS0FGQTs7QUFJQSxTQUFBLGVBQUEsR0FBQSxVQUFBLFVBQUEsRUFBQTs7Ozs7Ozs7OztBQVVBLFVBQUEsS0FBQSxlQUFBLE1BQUEsZUFBQSxJQUFBLEVB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QSxZQUFBLE1BQUEsR0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLFlBQUEsT0FBQTtBQUNBLG9CQUFBLEtBQUEsU0FEQTtBQUVBLGNBQUEsS0FBQTtBQUZBLFNBQUE7QUFJQSxlQUFBLGFBQUEsVUFBQSxDQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxNQUFBLEVBQUE7QUFDQSxlQUFBLFFBQUEsR0FBQSxLQUFBLFNBQUE7QUFDQSxlQUFBLFNBQUEsR0FBQSxJQUFBO0FBQ0EsU0FKQSxFQUtBLElBTEEsQ0FLQSxZQUFBO0FBQ0EsZ0JBQUEsU0FBQTtBQUNBLFNBUEEsQ0FBQTtBQVFBLE9BYkE7O0FBZUEsWUFBQSxNQUFBLEdBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxZQUFBLFdBQUEsRUFBQSxNQUFBLElBQUEsRUFBQTtBQUNBLHFCQUFBLFVBQUEsQ0FBQSxTQUFBLElBQUEsQ0FBQSxFQUFBO0FBQ0EsT0FIQTs7QUFLQSxZQUFBLGNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLGVBQUEsRUFBQSxDQUFBLGdCQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUNBLE9BRkE7O0FBSUEsWUFBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsYUFBQSxjQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFNBQUEsRUFBQTtBQUFBLGdCQUFBLEtBQUEsR0FBQSxTQUFBO0FBQUEsU0FEQSxDQUFBO0FBRUEsT0FIQTs7QUFLQSxZQUFBLFNBQUEsR0FDQSxJQURBLENBQ0EsWUFBQTtBQUNBLGdCQUFBLEdBQUEsQ0FBQSxNQUFBLEtBQUE7QUFDQSxPQUhBOztBQUtBLGFBQUEsYUFBQSxRQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE9BQUEsRUFBQTtBQUFBLGNBQUEsV0FBQSxHQUFBLE9BQUE7QUFBQSxPQURBLENBQUE7QUFFQTtBQTFDQSxHQUFBO0FBNENBLENBOUNBOztBQWdEQSxJQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBOztBQUVBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxXQUFBLEVBRkE7QUFHQSxpQkFBQSx1QkFIQTtBQUlBLFVBQUEsY0FBQSxLQUFBLEVBQUE7O0FBRUEsWUFBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsYUFBQSxjQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFNBQUEsRUFBQTtBQUFBLGdCQUFBLFVBQUEsR0FBQSxTQUFBO0FBQUEsU0FEQSxDQUFBO0FBRUEsT0FIQTs7QUFLQSxZQUFBLFNBQUEsR0FDQSxJQURBLENBQ0EsWUFBQTtBQUFBLGdCQUFBLEdBQUEsQ0FBQSxNQUFBLFVBQUE7QUFBQSxPQURBOztBQUdBLGFBQUEsYUFBQSxRQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE9BQUEsRUFBQTtBQUFBLGNBQUEsV0FBQSxHQUFBLE9BQUE7QUFBQSxPQURBLENBQUE7QUFFQTtBQWhCQSxHQUFBO0FBbUJBLENBckJBOztBQy9DQSxJQUFBLE9BQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxNQUFBLGFBQUEsRUFBQTtBQUNBLE1BQUEsWUFBQSxTQUFBLFNBQUEsQ0FBQSxHQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxJQUFBLEdBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUFBLGFBQUEsS0FBQSxNQUFBO0FBQUEsS0FBQSxFQUFBLE9BQUEsQ0FBQSxJQUFBLE1BQUEsTUFBQSxDQUFBLENBQUEsR0FBQSxLQUFBLEdBQUEsSUFBQTtBQUNBLEdBRkE7QUFHQSxTQUFBO0FBQ0EsZUFBQSxtQkFBQSxHQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQSxDQUFBLG9CQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQUEsZUFBQSxVQUFBLEdBQUEsRUFBQSxJQUFBLElBQUEsQ0FBQTtBQUFBLE9BREEsRUFFQSxJQUZBLENBRUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxZQUFBLE1BQUEsRUFBQTtBQUNBLGlCQUFBLGtCQUFBO0FBQ0EsU0FGQSxNQUVBO0FBQ0EsaUJBQUEsTUFBQSxJQUFBLENBQUEsYUFBQSxFQUFBLEdBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFBQSxtQkFBQSxJQUFBLElBQUE7QUFBQSxXQURBLENBQUE7QUFFQTtBQUNBLE9BVEEsQ0FBQTtBQVVBLEtBWkE7QUFhQSxjQUFBLGtCQUFBLElBQUEsRUFBQTs7QUFFQSxhQUFBLE1BQUEsR0FBQSxDQUFBLGdCQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxLQUFBLEVBQUE7QUFDQSxxQkFBQSxNQUFBLElBQUE7QUFDQSxlQUFBLGNBQUEsRUFBQTtBQUNBLE9BSkEsQ0FBQTtBQUtBLEtBcEJBO0FBcUJBLG9CQUFBLHdCQUFBLElBQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsZ0JBQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHFCQUFBLE1BQUEsSUFBQTtBQUNBLGVBQUEsY0FBQSxFQUFBO0FBQ0EsT0FKQSxFQUtBLElBTEEsQ0FLQSxVQUFBLElBQUEsRUFBQTtBQUNBLFlBQUEsU0FBQSxTQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUEsRUFBQSxJQUFBLEVBQUE7QUFBQSxtQkFBQSxJQUNBLEtBQUEsSUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLFFBREE7QUFDQSxXQURBLEVBQ0EsQ0FEQSxDQUFBO0FBRUEsU0FIQSxNQUdBO0FBQ0EsaUJBQUEsS0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBO0FBQ0EsbUJBQUEsSUFBQSxNQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EscUJBQUEsSUFBQSxLQUFBLElBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxRQUFBO0FBQUEsYUFEQSxFQUNBLENBREEsQ0FBQTtBQUVBLFdBSEEsRUFHQSxDQUhBLENBQUE7QUFJQTtBQUNBLE9BZkEsQ0FBQTtBQWdCQSxLQXRDQTtBQXVDQSxnQkFBQSxvQkFBQSxHQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxHQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsSUFBQSxFQUFBO0FBQUEsZUFBQSxLQUFBLElBQUE7QUFBQSxPQURBLENBQUE7QUFFQSxLQTFDQTtBQTJDQSxnQkFBQSxvQkFBQSxNQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsTUFBQSxDQUFBLGdCQUFBLE1BQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxNQUFBLENBQUEsV0FBQSxHQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFBQSxpQkFBQSxLQUFBLEVBQUE7QUFBQSxTQUFBLEVBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLENBQUE7QUFDQSxlQUFBLFVBQUE7QUFDQSxPQUpBLENBQUE7QUFLQSxLQWpEQTtBQWtEQSxnQkFBQSxzQkFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsdUJBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLEVBQUEsUUFBQSxNQUFBLElBQUEsRUFBQTtBQUNBLE9BSEEsQ0FBQTtBQUlBOztBQXZEQSxHQUFBO0FBMERBLENBL0RBOztBQ0RBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLFNBQUEsZUFEQTtBQUVBLGlCQUFBLHFCQUZBO0FBR0EsZ0JBQUEsYUFIQTtBQUlBLGFBQUE7QUFDQSxtQkFBQSxxQkFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLGFBQUEsUUFBQSxDQUFBLFNBQUEsQ0FBQTtBQUNBO0FBSEE7QUFKQSxHQUFBOztBQVdBLGlCQUFBLEtBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxTQUFBLGVBREE7QUFFQSxpQkFBQSxxQkFGQTtBQUdBLGdCQUFBLGFBSEE7QUFJQSxhQUFBO0FBQ0EsbUJBQUEscUJBQUEsWUFBQSxFQUFBO0FBQ0EsZUFBQSxhQUFBLFFBQUEsQ0FBQSxTQUFBLENBQUE7QUFDQTtBQUhBO0FBSkEsR0FBQTtBQVdBLENBdkJBOztBQ0FBLElBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLEVBQUEsbUJBQUEsRUFBQTs7QUFFQSxTQUFBLE1BQUEsR0FBQSxRQUFBLEVBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxRQUFBLFFBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxRQUFBLFFBQUE7QUFDQSxTQUFBLEdBQUEsR0FBQSxRQUFBLEdBQUE7QUFDQSxTQUFBLEtBQUEsR0FBQSxRQUFBLEtBQUE7QUFDQSxTQUFBLE9BQUEsR0FBQSxRQUFBLE9BQUE7QUFDQSxTQUFBLEtBQUEsR0FBQSxRQUFBLEtBQUE7QUFDQSxTQUFBLFlBQUEsR0FBQSxLQUFBOzs7Ozs7Ozs7Ozs7OztBQWNBLFVBQUEsR0FBQSxDQUFBLFlBQUE7O0FBRUEsU0FBQSxjQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxRQUFBLENBQUEsT0FBQSxPQUFBLEtBQUEsZUFBQSxJQUFBLE9BQUEsT0FBQSxLQUFBLFFBQUEsS0FBQSxPQUFBLEtBQUEsS0FBQSxFQUFBLEVBQUE7QUFDQSxhQUFBLFlBQUEsR0FBQSxJQUFBO0FBQ0EsYUFBQSxPQUFBLFlBQUEsR0FBQSxpREFBQTtBQUNBOztBQUVBLFFBQUEsV0FBQTtBQUNBLGdCQUFBLE9BQUEsUUFEQTtBQUVBLGdCQUFBLE9BQUEsUUFGQTtBQUdBLFdBQUEsT0FBQSxHQUhBO0FBSUEsYUFBQSxPQUFBLEtBSkE7QUFLQSxlQUFBLE9BQUEsT0FMQTtBQU1BLGFBQUEsT0FBQTtBQU5BLEtBQUE7O0FBU0EsV0FBQSxvQkFBQSxNQUFBLENBQUEsT0FBQSxNQUFBLEVBQUEsUUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTs7QUFFQSxhQUFBLE9BQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQTs7QUFFQSxLQUxBLENBQUE7QUFNQSxHQXJCQTtBQXVCQSxDQWhEQTtBQ0FBLElBQUEsT0FBQSxDQUFBLHFCQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7Ozs7QUFJQSxTQUFBO0FBQ0EsWUFBQSxnQkFBQSxFQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFBQSxRQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsZUFBQSxTQUFBLElBQUE7QUFDQSxPQUhBLENBQUE7QUFJQTtBQU5BLEdBQUE7QUFTQSxDQWJBOztBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGlCQUFBLEtBQUEsQ0FBQSxVQUFBLEVBQUE7QUFDQSxTQUFBLGVBREE7QUFFQSxnQkFBQSxrQkFGQTtBQUdBLGlCQUFBLHlDQUhBO0FBSUEsYUFBQTtBQUNBLGVBQUEsaUJBQUEsWUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLGVBQUEsWUFBQSxTQUFBLENBQUEsYUFBQSxFQUFBLENBQUE7QUFDQTtBQUhBO0FBSkEsR0FBQTtBQVVBLENBWkE7QUNBQSxJQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7O0FBRUEsU0FBQTtBQUNBLGdCQUFBLG9CQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsZUFBQSxNQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsZUFBQSxJQUFBLElBQUE7QUFDQSxPQUhBLENBQUE7QUFJQSxLQU5BOztBQVFBLGtCQUFBLHNCQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsc0JBQUEsTUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGVBQUEsSUFBQSxJQUFBO0FBQ0EsT0FIQSxDQUFBO0FBSUEsS0FiQTs7QUFlQSxxQkFBQSwyQkFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsa0JBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFDQSxlQUFBLElBQUEsSUFBQTtBQUNBLE9BSEEsQ0FBQTtBQUlBLEtBcEJBOztBQXNCQSxnQkFBQSxvQkFBQSxjQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsSUFBQSxDQUFBLFlBQUEsRUFBQSxjQUFBLENBQUE7QUFDQSxLQXhCQTs7QUEwQkEsaUJBQUEscUJBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxTQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxFQUFBO0FBQ0EsWUFBQSxFQUFBLE9BQUEsQ0FBQSxJQUFBLEVBQUEsRUFBQSxDQUFBO0FBQ0EsWUFBQSxFQUFBLFNBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxlQUFBLENBQUE7QUFDQSxPQUpBLENBQUE7QUFLQSxLQWhDQTs7QUFrQ0EsWUFBQSxnQkFBQSxNQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsSUFBQSxDQUFBLGtCQUFBLEVBQUEsRUFBQSxJQUFBLE1BQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsQ0FBQSxJQUFBLElBQUE7QUFDQSxlQUFBLElBQUEsSUFBQTtBQUNBLE9BSkEsQ0FBQTtBQUtBLEtBeENBOztBQTBDQSxjQUFBLGtCQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxJQUFBLENBQUEsb0JBQUEsRUFBQSxFQUFBLElBQUEsTUFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsZUFBQSxJQUFBLElBQUE7QUFDQSxPQUhBLENBQUE7QUFJQTs7QUEvQ0EsR0FBQTtBQW1EQSxDQXJEQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3VFQSxJQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLE9BQUEsRUFBQSxVQUFBLEVBQUEsYUFBQSxFQUFBLFlBQUEsRUFBQSxXQUFBLEVBQUE7O0FBSUEsU0FBQSxnQkFBQSxHQUFBLEtBQUE7QUFDQSxTQUFBLElBQUEsR0FBQSxPQUFBO0FBQ0EsU0FBQSxPQUFBLEdBQUEsVUFBQTs7QUFHQSxTQUFBLEtBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTtBQUNBLFdBQUEsT0FBQSxHQUFBLE9BQUE7QUFDQSxXQUFBLFFBQUEsR0FBQSxDQUFBLE9BQUEsUUFBQTtBQUNBLGVBQUEsWUFBQTtBQUNBLGFBQUEsUUFBQSxHQUFBLENBQUEsT0FBQSxRQUFBO0FBQ0EsYUFBQSxPQUFBO0FBQ0EsS0FIQSxFQUdBLElBSEE7O0FBS0EsR0FSQTs7QUFVQSxTQUFBLFlBQUEsR0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLE1BQUEsRUFBQSxFQUFBLFFBQUEsTUFBQSxFQUFBO0FBQ0EsR0FGQTs7QUFJQSxTQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsUUFBQSxPQUFBLEVBQUE7QUFDQSxTQUFBLE1BQUEsR0FBQSxPQUFBLElBQUEsQ0FBQSxFQUFBO0FBQ0EsU0FBQSxRQUFBLEdBQUEsQ0FBQSxPQUFBLFFBQUE7QUFDQSxTQUFBLGFBQUEsR0FBQSxDQUFBLE9BQUEsSUFBQSxDQUFBLEtBQUE7QUFDQSxRQUFBLEtBQUEsUUFBQSxHQUFBLENBQUEsRUFBQTtBQUNBLG1CQUFBLFNBQUEsQ0FBQSxJQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsWUFBQSxRQUFBLFFBQUEseUNBQUEsUUFBQSxPQUFBLFFBQUEsRUFBQSxPQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUEsS0FDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBO0FBQ0EsT0FKQTtBQUtBLEtBTkEsTUFPQSxPQUFBLEtBQUEsQ0FBQSxvQ0FBQTtBQUNBLEdBYkE7O0FBZUEsU0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLFdBQUEsT0FBQSxJQUFBLENBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBO0FBQ0EsS0FGQSxFQUVBLElBRkEsQ0FFQSxJQUZBLENBQUE7QUFHQSxHQUpBOztBQU1B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QUFBLEVBQUE7QUFDQSxNQUFBLGNBQUEsRUFBQTs7QUFFQSxjQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsTUFBQSxHQUFBLENBQUEsZUFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsY0FBQSxHQUFBLENBQUEsU0FBQSxFQUFBLFNBQUEsSUFBQTtBQUNBLGFBQUEsU0FBQSxJQUFBO0FBQ0EsS0FKQSxDQUFBO0FBS0EsR0FOQTs7QUFRQSxjQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxNQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxTQUFBLElBQUE7QUFDQSxLQUhBLENBQUE7QUFJQSxHQUxBOztBQU9BLFNBQUEsV0FBQTtBQUNBLENBbkJBOztBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFNBQUEsZUFEQTtBQUVBLGlCQUFBLDRCQUZBO0FBR0EsZ0JBQUEsVUFIQTtBQUlBLGFBQUE7QUFDQSxlQUFBLGlCQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLFlBQUEsU0FBQSxDQUFBLGFBQUEsTUFBQSxDQUFBO0FBQ0EsT0FIQTtBQUlBLG9CQUFBLHNCQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLFlBQUEsWUFBQSxDQUFBLGFBQUEsTUFBQSxDQUFBO0FBQ0E7QUFOQTtBQUpBLEdBQUE7QUFhQSxDQWRBOztBQ0FBLElBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBOztBQUVBLFNBQUEsTUFBQSxHQUFBLFVBQUEsV0FBQSxFQUFBOzs7OztBQUtBLFdBQUEsT0FBQSxFQUFBLENBQUEsZUFBQSxFQUFBLEVBQUEsYUFBQSxXQUFBLEVBQUEsQ0FBQTs7QUFFQSxHQVBBO0FBUUEsQ0FWQTs7QUFZQSxJQUFBLFVBQUEsQ0FBQSxZ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LE1BQUEsR0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLGlCQUFBLEVBQUEsQ0FBQSxNQUFBO0FBQ0EsU0FGQTtBQUdBLE9BSkE7O0FBTUEsVUFBQSxVQUFBLFNBQUEsT0FBQSxHQUFBO0FBQ0Esb0JBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsU0FGQTtBQUdBLE9BSkE7O0FBTUEsVUFBQSxhQUFBLFNBQUEsVUFBQSxHQUFBO0FBQ0EsY0FBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLE9BRkE7O0FBSUE7O0FBRUEsaUJBQUEsR0FBQSxDQUFBLFlBQUEsWUFBQSxFQUFBLE9BQUE7QUFDQSxpQkFBQSxHQUFBLENBQUEsWUFBQSxhQUFBLEVBQUEsVUFBQTtBQUNBLGlCQUFBLEdBQUEsQ0FBQSxZQUFBLGNBQUEsRUFBQSxVQUFBO0FBRUE7O0FBNUNBLEdBQUE7QUFnREEsQ0FsREE7O0FDQUE7O0FBRUEsSUFBQSxTQUFBLENBQUEsYUFBQSxFQUFBLFlBQUE7QUFDQSxTQUFBO0FBQ0EsV0FBQTtBQUNBLG9CQUFBO0FBREEsS0FEQTtBQUlBLGNBQUEsR0FKQTtBQUtBLGlCQUFBO0FBTEEsR0FBQTtBQU9BLENBUkE7O0FDRkEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsZUFBQSxFQUFBOztBQUVBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxpQkFBQSx5REFGQTtBQUdBLFVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsR0FBQSxnQkFBQSxpQkFBQSxFQUFBO0FBQ0E7QUFMQSxHQUFBO0FBUUEsQ0FWQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdzb2NrbWFya2V0JywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZSddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgIC8vIFJlZ2lzdGVyIG91ciAqYWJvdXQqIHN0YXRlLlxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhYm91dCcsIHtcbiAgICAgICAgdXJsOiAnL2Fib3V0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Fib3V0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWJvdXQvYWJvdXQuaHRtbCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdBYm91dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBGdWxsc3RhY2tQaWNzKSB7XG5cbiAgICAvLyBJbWFnZXMgb2YgYmVhdXRpZnVsIEZ1bGxzdGFjayBwZW9wbGUuXG4gICAgJHNjb3BlLmltYWdlcyA9IF8uc2h1ZmZsZShGdWxsc3RhY2tQaWNzKTtcblxufSk7XG5cbiIsImFwcC5jb250cm9sbGVyKCdjaGVja291dCcsIGZ1bmN0aW9uICgkc2NvcGUsIE9yZGVyRmFjdG9yeSwgY3VycmVudENhcnQpIHtcblxufSlcbiIsImFwcC5kaXJlY3RpdmUoJ2Rlc2lnblZpZXcnLCBmdW5jdGlvbiAoU29ja0ZhY3RvcnksICRzdGF0ZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9kZXNpZ24vZGVzaWduLXZpZXcuaHRtbCcsXG5cdFx0Ly8gc2NvcGU6IHtcblx0XHQvLyBcdHRoZVNvY2s6ICc9J1xuXHRcdC8vIH0sXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgZGVzaWduVmlld0N0cmwpIHtcblx0XHRcdFxuXHRcdFx0dmFyIHRpdGxlID0gc2NvcGUudGl0bGU7XG5cdFx0XHR2YXIgZGVzY3JpcHRpb24gPSBzY29wZS5kZXNjcmlwdGlvbjtcblx0XHRcdHZhciB0YWdzID0gc2NvcGUudGFncztcblx0XHRcdHZhciBjYW52YXMgPSBlbGVtZW50LmZpbmQoJ2NhbnZhcycpWzBdO1xuXHRcdFx0c2NvcGUuc2F2ZURlc2lnbiA9IGZ1bmN0aW9uICh0aXRsZSwgZGVzY3JpcHRpb24sIHRhZ3MpIHtcblx0XHRcdFx0dmFyIHRhZ3NBcnIgPSBTb2NrRmFjdG9yeS5wcmVwYXJlVGFncyh0YWdzKVxuXHRcdFx0XHRjb25zb2xlLmxvZygnVEFHUzonLCB0YWdzQXJyKTtcblx0XHRcdFx0dmFyIGRhdGFVUkwgPSBjYW52YXMudG9EYXRhVVJMKClcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coZGVzY3JpcHRpb24pXG5cdFx0XHRcdHZhciBuZXdTb2NrRGF0YU9iaiA9IHtcblx0XHRcdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuXHRcdFx0XHRcdHRhZ3M6IHRhZ3NBcnIsXG5cdFx0XHRcdFx0aW1hZ2U6IGRhdGFVUkxcblx0XHRcdFx0fTtcblx0XHRcdFx0cmV0dXJuIFNvY2tGYWN0b3J5LnNhdmVEZXNpZ24obmV3U29ja0RhdGFPYmopXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0XHRcdFx0XHRpZiAocmVzdWx0KSAkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiByZXN1bHQuZGF0YS51c2VySWR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fTtcblxuXG5cdFx0XHR2YXIgY29sb3IgPSAkKFwiLnNlbGVjdGVkXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XG5cdFx0XHR2YXIgY29udGV4dCA9ICQoXCJjYW52YXNcIilbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXHRcdFx0dmFyICRjYW52YXMgPSAkKFwiY2FudmFzXCIpO1xuXHRcdFx0dmFyIGxhc3RFdmVudDtcblx0XHRcdHZhciBtb3VzZURvd24gPSBmYWxzZTtcblxuXHRcdFx0dmFyIGJhY2tncm91bmQgPSBuZXcgSW1hZ2UoKTtcblxuXHRcdFx0Ly8gY29udGV4dC5maWxsU3R5bGUgPSAnI2Y4ZjhmZic7XG5cdFx0XHQvLyBjb250ZXh0Lm9wYWNpdHkgPSAwO1xuXHRcdFx0Ly8gY29udGV4dC5maWxsKClcblxuXHRcdFx0Ly8gZnVuY3Rpb24gZ2VuZXJhdGVTb2NrVVJMKCl7XG5cdFx0XHQvLyAgIGZ1bmN0aW9uIGdlbmVyYXRlUmFuZG9tTnVtYmVyKCkge1xuXHRcdFx0Ly8gICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzKSArIDE7XG5cdFx0XHQvLyAgIH1cblx0XHRcdC8vICAgdmFyIG51bSA9IGdlbmVyYXRlUmFuZG9tTnVtYmVyKCk7XG5cblx0XHRcdC8vICAgaWYgKG51bSA9PT0gMSkgcmV0dXJuICcvc29jay1iZy8nICsgbnVtICsgJy5wbmcnXG5cdFx0XHQvLyAgIGVsc2UgcmV0dXJuICcvc29jay1iZy8nICsgbnVtICsgJy5qcGcnO1xuXHRcdFx0Ly8gfVxuXG5cdFx0XHRiYWNrZ3JvdW5kLnNyYyA9ICcvc29jay1iZy8xLnBuZyc7XG5cblx0XHRcdGJhY2tncm91bmQub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQgIGNvbnRleHQuZHJhd0ltYWdlKGJhY2tncm91bmQsIDAsIDApO1xuXHRcdFx0fTtcblxuXHRcdFx0Ly9XaGVuIGNsaWNraW5nIG9uIGNvbnRyb2wgbGlzdCBpdGVtc1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzXCIpLm9uKFwiY2xpY2tcIiwgXCJsaVwiICwgZnVuY3Rpb24oKXtcblx0XHRcdCAgICAgLy9EZXNsZWN0IHNpYmxpbmcgZWxlbWVudHNcblx0XHRcdCAgICAgJCh0aGlzKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vU2VsZWN0IGNsaWNrZWQgZWxlbWVudFxuXHRcdFx0ICAgICAkKHRoaXMpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vc3RvcmUgdGhlIGNvbG9yXG5cdFx0XHQgICAgIGNvbG9yID0gJCh0aGlzKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICB9KTtcblxuXHRcdFx0Ly9XaGVuIFwiQWRkIENvbG9yXCIgYnV0dG9uIGlzIHByZXNzZWRcblx0XHRcdCAgJChcIiNyZXZlYWxDb2xvclNlbGVjdFwiKS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCAgLy9TaG93IGNvbG9yIHNlbGVjdCBvciBoaWRlIHRoZSBjb2xvciBzZWxlY3Rcblx0XHRcdCAgICBjaGFuZ2VDb2xvcigpO1xuXHRcdFx0ICBcdCQoXCIjY29sb3JTZWxlY3RcIikudG9nZ2xlKCk7XG5cdFx0XHQgIH0pO1xuXG5cdFx0XHQvL1VwZGF0ZSB0aGUgbmV3IGNvbG9yIHNwYW5cblx0XHRcdGZ1bmN0aW9uIGNoYW5nZUNvbG9yKCl7XG5cdFx0XHRcdHZhciByID0gJChcIiNyZWRcIikudmFsKCk7XG5cdFx0XHRcdHZhciBnID0gJChcIiNncmVlblwiKS52YWwoKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKCk7XG5cdFx0XHRcdCQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYihcIiArIHIgKyBcIiwgXCIgKyBnICsgXCIsIFwiICsgYiArIFwiKVwiKTtcblx0XHRcdCAgLy9XaGVuIGNvbG9yIHNsaWRlcnMgY2hhbmdlXG5cblxuXHRcdFx0fVxuXG5cdFx0XHQkKFwiaW5wdXRbdHlwZT1yYW5nZV1cIikub24oXCJpbnB1dFwiLCBjaGFuZ2VDb2xvcik7XG5cblx0XHRcdC8vd2hlbiBcIkFkZCBDb2xvclwiIGlzIHByZXNzZWRcblx0XHRcdCQoXCIjYWRkTmV3Q29sb3JcIikuY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdCAgLy9hcHBlbmQgdGhlIGNvbG9yIHRvIHRoZSBjb250cm9scyB1bFxuXHRcdFx0ICB2YXIgJG5ld0NvbG9yID0gJChcIjxsaT48L2xpPlwiKTtcblx0XHRcdCAgJG5ld0NvbG9yLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpKTtcblx0XHRcdCAgJChcIi5jb250cm9scyB1bFwiKS5hcHBlbmQoJG5ld0NvbG9yKTtcblx0XHRcdCAgJChcIi5jb250cm9scyBsaVwiKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgbGlcIikubGFzdCgpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgIGNvbG9yID0gJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICAvL3doZW4gYWRkZWQsIHJlc3RvcmUgc2xpZGVycyBhbmQgcHJldmlldyBjb2xvciB0byBkZWZhdWx0XG5cdFx0XHQgICQoXCIjY29sb3JTZWxlY3RcIikuaGlkZSgpO1xuXHRcdFx0XHR2YXIgciA9ICQoXCIjcmVkXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGcgPSAkKFwiI2dyZWVuXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKDApO1xuXHRcdFx0XHQkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2IoXCIgKyByICsgXCIsIFwiICsgZyArIFwiLCBcIiArIGIgKyBcIilcIik7XG5cblx0XHRcdH0pXG5cblx0XHRcdC8vT24gbW91c2UgZXZlbnRzIG9uIHRoZSBjYW52YXNcblx0XHRcdCRjYW52YXMubW91c2Vkb3duKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICBsYXN0RXZlbnQgPSBlO1xuXHRcdFx0ICBtb3VzZURvd24gPSB0cnVlO1xuXHRcdFx0fSkubW91c2Vtb3ZlKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICAvL2RyYXcgbGluZXNcblx0XHRcdCAgaWYgKG1vdXNlRG93bil7XG5cdFx0XHQgICAgY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdCAgICBjb250ZXh0Lm1vdmVUbyhsYXN0RXZlbnQub2Zmc2V0WCxsYXN0RXZlbnQub2Zmc2V0WSk7XG5cdFx0XHQgICAgY29udGV4dC5saW5lVG8oZS5vZmZzZXRYLCBlLm9mZnNldFkpO1xuXHRcdFx0ICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBjb2xvcjtcblx0XHRcdCAgICBjb250ZXh0LnN0cm9rZSgpO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZUNhcCA9ICdyb3VuZCc7XG5cdFx0XHQgICAgY29udGV4dC5saW5lV2lkdGggPSAyMDtcblxuXHRcdFx0ICAgIGxhc3RFdmVudCA9IGU7XG5cdFx0XHQgIH1cblx0XHRcdH0pLm1vdXNldXAoZnVuY3Rpb24oKXtcblx0XHRcdCAgICBtb3VzZURvd24gPSBmYWxzZTtcblx0XHRcdH0pLm1vdXNlbGVhdmUoZnVuY3Rpb24oKXtcblx0XHRcdCAgICAkY2FudmFzLm1vdXNldXAoKTtcblx0XHRcdH0pO1xuXG5cblxuXG5cdFx0XHQvLyB2YXIgc2tldGNoID0gZWxlbWVudC5maW5kKCcjc2tldGNoJyk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhza2V0Y2gpO1xuXHRcdFx0Ly8gdmFyIHNrZXRjaFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShza2V0Y2gpXG5cdFx0ICAgIC8vIGNhbnZhcy53aWR0aCA9IHBhcnNlSW50KHNrZXRjaFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3dpZHRoJykpO1xuXHRcdCAgICAvLyBjYW52YXMuaGVpZ2h0ID0gcGFyc2VJbnQoc2tldGNoU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JykpO1xuXG5cblxuXHQgICAgXHQvLyB2YXIgY29sb3IgPSAnYmxhY2snO1xuXHRcdCAgICAvLyBzY29wZS5jaGFuZ2VDb2xvciA9IGZ1bmN0aW9uIChjaG9zZW5Db2xvcikge1xuXHRcdCAgICAvLyBcdGNvbG9yID0gY2hvc2VuQ29sb3I7XG5cdFx0ICAgIC8vIFx0Y29uc29sZS5sb2coJ0NPTE9SJywgY29sb3IpXG5cdFx0ICAgIC8vIH1cdFx0ICAgIFxuXG5cdFx0ICAgIC8vIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRcdCAgICAvLyBjdHgubGluZVdpZHRoID0gMjA7XG5cdFx0ICAgIC8vIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG5cdFx0ICAgIC8vIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcblxuXHRcdCAgICAvLyB2YXIgY3VycmVudE1vdXNlUG9zaXRpb24gPSB7XG5cdFx0ICAgIC8vICAgICB4OiAwLFxuXHRcdCAgICAvLyAgICAgeTogMFxuXHRcdCAgICAvLyB9O1xuXG5cdFx0ICAgIC8vIHZhciBsYXN0TW91c2VQb3NpdGlvbiA9IHtcblx0XHQgICAgLy8gICAgIHg6IDAsXG5cdFx0ICAgIC8vICAgICB5OiAwXG5cdFx0ICAgIC8vIH07XG5cblx0XHQgICAgLy8gdmFyIGRyYXdpbmcgPSBmYWxzZTtcblxuXHRcdCAgICAvLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcblx0XHQgICAgLy8gICAgIGRyYXdpbmcgPSB0cnVlO1xuXHRcdCAgICAvLyAgICAgY3VycmVudE1vdXNlUG9zaXRpb24ueCA9IGUub2Zmc2V0WDtcblx0XHQgICAgLy8gICAgIGN1cnJlbnRNb3VzZVBvc2l0aW9uLnkgPSBlLm9mZnNldFk7XG5cdFx0ICAgIC8vIH0pO1xuXG5cdFx0ICAgIC8vIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZnVuY3Rpb24gKCkge1xuXHRcdCAgICAvLyAgICAgZHJhd2luZyA9IGZhbHNlO1xuXHRcdCAgICAvLyB9KTtcblxuXHRcdCAgICAvLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24gKGUpIHtcblx0XHQgICAgLy8gICAgIGlmICghZHJhd2luZykgcmV0dXJuO1xuXG5cdFx0ICAgIC8vICAgICBsYXN0TW91c2VQb3NpdGlvbi54ID0gY3VycmVudE1vdXNlUG9zaXRpb24ueDtcblx0XHQgICAgLy8gICAgIGxhc3RNb3VzZVBvc2l0aW9uLnkgPSBjdXJyZW50TW91c2VQb3NpdGlvbi55O1xuXG5cdFx0ICAgIC8vICAgICBjdXJyZW50TW91c2VQb3NpdGlvbi54ID0gZS5vZmZzZXRYO1xuXHRcdCAgICAvLyAgICAgY3VycmVudE1vdXNlUG9zaXRpb24ueSA9IGUub2Zmc2V0WTtcblxuXHRcdCAgICAvLyAgICAgY29uc29sZS5sb2coJ1BPU0lUSU9OJywgY3VycmVudE1vdXNlUG9zaXRpb24pXG5cblx0XHQgICAgLy8gICAgIGRyYXcobGFzdE1vdXNlUG9zaXRpb24sIGN1cnJlbnRNb3VzZVBvc2l0aW9uLCBjb2xvciwgdHJ1ZSk7XG5cblx0XHQgICAgLy8gfSk7XG5cblx0XHQgICAgLy8gdmFyIGRyYXcgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCwgc3Ryb2tlQ29sb3IpIHtcblxuXHRcdCAgICAvLyAgICAgLy8gRHJhdyB0aGUgbGluZSBiZXR3ZWVuIHRoZSBzdGFydCBhbmQgZW5kIHBvc2l0aW9uc1xuXHRcdCAgICAvLyAgICAgLy8gdGhhdCBpcyBjb2xvcmVkIHdpdGggdGhlIGdpdmVuIGNvbG9yLlxuXHRcdCAgICAvLyAgICAgY3R4LmJlZ2luUGF0aCgpO1xuXHRcdCAgICAvLyAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlQ29sb3IgfHwgJ2JsYWNrJztcblx0XHQgICAgLy8gICAgIGN0eC5tb3ZlVG8oc3RhcnQueCwgc3RhcnQueSk7XG5cdFx0ICAgIC8vICAgICBjdHgubGluZVRvKGVuZC54LCBlbmQueSk7XG5cdFx0ICAgIC8vICAgICBjdHguY2xvc2VQYXRoKCk7XG5cdFx0ICAgIC8vICAgICBjdHguc3Ryb2tlKCk7XG5cblx0XHQgICAgLy8gfTtcblxuXHRcdH1cblx0fVxufSkiLCJhcHAuY29udHJvbGxlcignRGVzaWduQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUpIHtcblxuICAkc2NvcGUuaGkgPSBcImhpXCI7XG5cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2Rlc2lnblNvY2snLCBmdW5jdGlvbiAoKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIGNvbnRyb2xsZXI6ICdEZXNpZ25Db250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9kZXNpZ24vZGVzaWduLnZpZXcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rlc2lnblZpZXcnLCB7XG4gICAgICB1cmw6Jy9zb2Nrcy9kZXNpZ24vOmlkJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIHRoZVNvY2s6ICc9J1xuICAgICAgfSxcbiAgICAgIGNvbnRyb2xsZXI6ICdkZXNpZ25WaWV3Q3RybCcsXG4gICAgICB0ZW1wbGF0ZTogJzxkZXNpZ24tdmlldz48L2Rlc2lnbi12aWV3PicsXG4gICAgfSlcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdkZXNpZ25WaWV3Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwKSB7XG5cbiAgJGh0dHAucG9zdCgnL2FwaS91c2VyL21hdGNoSWQnKVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIHJldHVybiAkc2NvcGUuc2hvd1ZpZXcgPSByZXNcbiAgICB9KVxuXG5cdC8vIC8vICRzY29wZS5kZXNjcmlwdGlvbjtcblx0Ly8gJHNjb3BlLnRhZ3M7XG5cdC8vICRzY29wZS50aXRsZTtcblx0Ly8gY29uc29sZS5sb2coJHNjb3BlLmRlc2NyaXB0aW9uKTtcbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGVzaWduJywge1xuICAgICAgdXJsOicvZGVzaWduJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdEZXNpZ25Db250cm9sbGVyJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnPGRlc2lnbi1zb2NrPjwvZGVzaWduLXNvY2s+J1xuICAgIH0pXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkb2NzJywge1xuICAgICAgICB1cmw6ICcvZG9jcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZG9jcy9kb2NzLmh0bWwnXG4gICAgfSk7XG59KTtcbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0bW9zdFJlY2VudFNvY2tzOiBmdW5jdGlvbiAoU29ja0ZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBTb2NrRmFjdG9yeS5tb3N0UmVjZW50U29ja3MoKVxuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdob21lQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIG1vc3RSZWNlbnRTb2NrcywgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcblxuICAkc2NvcGUubW9zdFJlY2VudFNvY2tzID0gbW9zdFJlY2VudFNvY2tzXG4gICRzY29wZS5zZWVTb2NrID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgJHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KVxuICB9XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pOyIsImFwcC5jb250cm9sbGVyKCdjYXJ0Q3VycmVudCcsIGZ1bmN0aW9uICgkc2NvcGUsIE9yZGVyRmFjdG9yeSwgY3VycmVudENhcnQpIHtcbiAgJHNjb3BlLmN1cnJlbnQgPSBjdXJyZW50Q2FydFxufSlcblxuXG5hcHAuY29udHJvbGxlcignY2FydEhpc3RvcnknLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGNhcnRIaXN0b3J5KSB7XG5cbiAgLy8gJHNjb3BlLmNhcnRIaXN0b3J5ID0gY2FydEhpc3RvcnlcblxufSlcbiIsImFwcC5kaXJlY3RpdmUoJ2N1cnJlbnRDYXJ0JywgZnVuY3Rpb24gKCRzdGF0ZSwgT3JkZXJGYWN0b3J5KSB7XG5cbiAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICBzY29wZToge30sXG4gICAgICB0ZW1wbGF0ZVVybDogJ2pzL29yZGVyL2N1cnJlbnQuaHRtbCcsXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSkge1xuXG4gICAgICAgIHNjb3BlLnVwZGF0ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICB2YXIgc29jayA9IHtcbiAgICAgICAgICAgIHF1YW50aXR5OiBpdGVtLm5ld0Ftb3VudCxcbiAgICAgICAgICAgIGlkOiBpdGVtLmlkXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBPcmRlckZhY3RvcnkudXBkYXRlSXRlbShzb2NrKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHVwZGF0ZSl7XG4gICAgICAgICAgICBpdGVtLnF1YW50aXR5ID0gaXRlbS5uZXdBbW91bnQ7XG4gICAgICAgICAgICBpdGVtLm5ld0Ftb3VudCA9IG51bGw7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNjb3BlLmNhbGNUb3RhbCgpXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICB2YXIgdG9kZWxldGUgPSB7IGl0ZW06IGl0ZW0gfVxuICAgICAgICAgIE9yZGVyRmFjdG9yeS5kZWxldGVJdGVtKHRvZGVsZXRlLml0ZW0uaWQpXG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5zaW5nbGVTb2NrVmlldyA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgJHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KVxuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuY2FsY1RvdGFsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5jYWxjdWxhdGVUb3RhbCgnY3VycmVudCcpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oY2FydFRvdGFsKSB7IHNjb3BlLnRvdGFsID0gY2FydFRvdGFsIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5jYWxjVG90YWwoKVxuICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhzY29wZS50b3RhbClcbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdjdXJyZW50JylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY3VycmVudCkgeyBzY29wZS5jdXJyZW50Q2FydCA9IGN1cnJlbnQgfSlcbiAgICB9XG4gIH1cbn0pXG5cbmFwcC5kaXJlY3RpdmUoJ2NhcnRIaXN0b3J5JywgZnVuY3Rpb24oJHN0YXRlLCBPcmRlckZhY3RvcnkpIHtcblxuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgc2NvcGU6IHt9LFxuICAgIHRlbXBsYXRlVXJsOiAnanMvb3JkZXIvaGlzdG9yeS5odG1sJyxcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgc2NvcGUuY2FsY1RvdGFsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBPcmRlckZhY3RvcnkuY2FsY3VsYXRlVG90YWwoJ2hpc3RvcnknKVxuICAgICAgICAudGhlbihmdW5jdGlvbihjYXJ0VG90YWwpIHsgc2NvcGUudG90YWxTcGVudCA9IGNhcnRUb3RhbCB9KVxuICAgICAgfVxuXG4gICAgICBzY29wZS5jYWxjVG90YWwoKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7IGNvbnNvbGUubG9nKHNjb3BlLnRvdGFsU3BlbnQpIH0pXG5cbiAgICAgIHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2hpc3RvcnknKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oaGlzdG9yeSkgeyBzY29wZS5jYXJ0SGlzdG9yeSA9IGhpc3RvcnkgfSlcbiAgICB9XG4gIH1cblxufSlcbiIsIlxuYXBwLmZhY3RvcnkoJ09yZGVyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKSB7XG4gIHZhciBjYWNoZWRDYXJ0ID0gW11cbiAgdmFyIGNoZWNrQ2FydCA9IGZ1bmN0aW9uKG9iaiwgYXJyKSB7XG4gICAgcmV0dXJuIGFyci5tYXAoZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5zb2NrSWQgfSkuaW5kZXhPZihvYmouc29ja0lkKSA9PT0gLTEgPyBmYWxzZSA6IHRydWVcbiAgfVxuICByZXR1cm4ge1xuICAgIGFkZFRvQ2FydDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyL2N1cnJlbnQnKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7IHJldHVybiBjaGVja0NhcnQob2JqLCByZXMuZGF0YSkgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGluQ2FydCkge1xuICAgICAgICBpZiAoaW5DYXJ0KSB7XG4gICAgICAgICAgcmV0dXJuIFwiQWxyZWFkeSBpbiBDYXJ0IVwiXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvb3JkZXIvJywgb2JqKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykgeyByZXR1cm4gcmVzLmRhdGEgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9LFxuICAgIHNob3dDYXJ0OiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAvL3R5cGUgPSAnY3VycmVudCcgfHwgdHlwZSA9ICdoaXN0b3J5J1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci8nK3R5cGUpXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICBjYWNoZWRDYXJ0ID0gb3JkZXIuZGF0YVxuICAgICAgICByZXR1cm4gY2FjaGVkQ2FydCB8fCBbXVxuICAgICAgfSlcbiAgICB9LFxuICAgIGNhbGN1bGF0ZVRvdGFsOiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyLycrdHlwZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKSB7XG4gICAgICAgIGNhY2hlZENhcnQgPSBvcmRlci5kYXRhXG4gICAgICAgIHJldHVybiBjYWNoZWRDYXJ0IHx8IFtdXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oY2FydCkge1xuICAgICAgICBpZiAodHlwZT09PSdjdXJyZW50Jykge1xuICAgICAgICAgIHJldHVybiBjYXJ0LnJlZHVjZShmdW5jdGlvbihvLCBpdGVtKSB7cmV0dXJuIG8gKyAoXG4gICAgICAgICAgICBpdGVtLnNvY2sucHJpY2UqaXRlbS5xdWFudGl0eSl9LCAwKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBjYXJ0LnJlZHVjZShmdW5jdGlvbihvLCBvcmRlcikge1xuICAgICAgICAgICAgcmV0dXJuIG8gKyBvcmRlci5pdGVtcy5yZWR1Y2UoZnVuY3Rpb24obywgaXRlbSkge1xuICAgICAgICAgICAgICByZXR1cm4gbyArIChpdGVtLnNvY2sucHJpY2UqaXRlbS5xdWFudGl0eSl9LCAwKVxuICAgICAgICAgIH0sIDApXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSxcbiAgICB1cGRhdGVJdGVtOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wdXQoJy9hcGkvb3JkZXInLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLmRhdGEgfSlcbiAgICB9LFxuICAgIGRlbGV0ZUl0ZW06IGZ1bmN0aW9uKGl0ZW1JZCkge1xuICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9vcmRlci8nK2l0ZW1JZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHRvUmVtb3ZlKSB7XG4gICAgICAgIGNhY2hlZENhcnQuc3BsaWNlKGNhY2hlZENhcnQubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uaWQgfSkuaW5kZXhPZihpdGVtSWQpLDEpXG4gICAgICAgIHJldHVybiBjYWNoZWRDYXJ0XG4gICAgICB9KVxuICAgIH0sXG4gICAgZW5zdXJlQ2FydDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyL2NyZWF0ZWNhcnQnKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgcmV0dXJuIHtleGlzdHM6IG9yZGVyLmRhdGF9XG4gICAgICB9KVxuICAgIH0sXG5cbiAgfVxufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjdXJyZW50Q2FydCcsIHtcbiAgICB1cmw6ICcvY2FydC9jdXJyZW50Jyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9vcmRlci9jYXJ0Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdjYXJ0Q3VycmVudCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0Y3VycmVudENhcnQ6IGZ1bmN0aW9uIChPcmRlckZhY3RvcnkpIHtcblx0XHRcdFx0cmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnY3VycmVudCcpXG5cdFx0XHR9XG5cdFx0fVxuICB9KVxuXG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjYXJ0SGlzdG9yeScsIHtcbiAgICB1cmw6ICcvY2FydC9oaXN0b3J5JyxcbiAgICB0ZW1wbGF0ZVVybDogJy9qcy9vcmRlci9wYXN0Lmh0bWwnLFxuICAgIGNvbnRyb2xsZXI6ICdjYXJ0SGlzdG9yeScsXG4gICAgcmVzb2x2ZToge1xuICAgICAgY2FydEhpc3Rvcnk6IGZ1bmN0aW9uIChPcmRlckZhY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnaGlzdG9yeScpO1xuICAgICAgfVxuICAgIH1cbiAgfSlcblxufSlcbiIsImFwcC5jb250cm9sbGVyKCdQZXJzb25hbEluZm9DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBBdXRoU2VydmljZSwgdGhlVXNlciwgUGVyc29uYWxJbmZvRmFjdG9yeSkge1xuXG5cdCRzY29wZS51c2VySWQgPSB0aGVVc2VyLmlkO1xuXHQkc2NvcGUuYWRkcmVzczEgPSB0aGVVc2VyLmFkZHJlc3MxO1xuXHQkc2NvcGUuYWRkcmVzczIgPSB0aGVVc2VyLmFkZHJlc3MyO1xuXHQkc2NvcGUuemlwID0gdGhlVXNlci56aXA7XG5cdCRzY29wZS5zdGF0ZSA9IHRoZVVzZXIuc3RhdGU7XG5cdCRzY29wZS5jb3VudHJ5ID0gdGhlVXNlci5jb3VudHJ5O1xuXHQkc2NvcGUucGhvbmUgPSB0aGVVc2VyLnBob25lO1xuXHQkc2NvcGUuZGlzcGxheUVycm9yID0gZmFsc2U7XG5cblx0Ly9vbmx5IGEgdGVtcG9yYXJ5IHNvbHV0aW9uIC0tIGNoZWNrcyB0byBzZWUgaWYgdXNlciBpcyBhIG5ldyB1c2VyIGJ5IHNlZWluZyBpZiB0aGV5J3JlIGxvZ2dlZCBpblxuXG5cdC8vICRzY29wZS5jdXJyZW50VXNlcklzTmV3ID0gZnVuY3Rpb24oKSB7XG4gLy8gICBcdFx0IHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKVxuIC8vICAgXHRcdC50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuIC8vICAgIFx0XHRpZiAoIXVzZXIpIHJldHVybiAkc2NvcGUubmV3VXNlciA9IHRydWU7XG4gLy8gIFx0XHRcdGVsc2UgcmV0dXJuICRzY29wZS5uZXdVc2VyID0gZmFsc2U7XG4gLy8gICAgXHR9KVxuIC8vIFx0fVxuXG4gLy8gXHQkc2NvcGUuY3VycmVudFVzZXJJc05ldygpO1xuXG4gXHRjb25zb2xlLmxvZyhcImhlZWVlZWVlZXlcIik7XG5cblx0JHNjb3BlLnN1Ym1pdFBlcnNvbmFsID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0aWYgKCgkc2NvcGUuY291bnRyeSA9PT0gXCJVbml0ZWQgU3RhdGVzXCIgfHwgJHNjb3BlLmNvdW50cnkgPT09IFwiQ2FuYWRhXCIpICYmICRzY29wZS5zdGF0ZSA9PT0gXCJcIikge1xuXHRcdFx0JHNjb3BlLmRpc3BsYXlFcnJvciA9IHRydWU7XG5cdFx0XHRyZXR1cm4gJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiSWYgaW4gVVMgb3IgQ2FuYWRhLCBtdXN0IGluY2x1ZGUgU3RhdGUvUHJvdmluY2VcIjtcblx0XHR9XG5cblx0XHR2YXIgdXNlckluZm8gPSB7XG5cdFx0XHRhZGRyZXNzMSA6ICRzY29wZS5hZGRyZXNzMSxcblx0XHRcdGFkZHJlc3MyIDogJHNjb3BlLmFkZHJlc3MyLFxuXHRcdFx0emlwIDogJHNjb3BlLnppcCxcblx0XHRcdHN0YXRlIDogJHNjb3BlLnN0YXRlLFxuXHRcdFx0Y291bnRyeSA6ICRzY29wZS5jb3VudHJ5LFxuXHRcdFx0cGhvbmUgOiAkc2NvcGUucGhvbmVcblx0XHR9XG5cblx0XHRyZXR1cm4gUGVyc29uYWxJbmZvRmFjdG9yeS5zdWJtaXQoJHNjb3BlLnVzZXJJZCwgdXNlckluZm8pXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0Ly8gaWYgKCRzY29wZS5uZXdVc2VyKSBcblx0XHRcdHJldHVybiAkc3RhdGUuZ28oJ2hvbWUnKTtcblx0XHRcdC8vIGVsc2UgcmV0dXJuICRzdGF0ZS5nbygndXNlcicsIHt1c2VySWQ6ICRzY29wZS51c2VySWR9KTtcblx0XHR9KVxuXHR9XG5cbn0pOyIsImFwcC5mYWN0b3J5KCdQZXJzb25hbEluZm9GYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgLy8gUGVyc29uYWxGYWN0b3J5ID0ge307XG5cbiAgcmV0dXJuIHtcbiAgICBzdWJtaXQgOiBmdW5jdGlvbihpZCwgdXNlckluZm8pe1xuICAgICAgcmV0dXJuICRodHRwLnB1dCgnL2FwaS91c2VyLycgKyBpZCwgdXNlckluZm8pXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgfSlcbiAgICB9XG4gIH1cblxufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3BlcnNvbmFsJywge1xuXHRcdHVybDogJy9wZXJzb25hbC86aWQnLFxuXHRcdGNvbnRyb2xsZXI6ICdQZXJzb25hbEluZm9DdHJsJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9wZXJzb25hbGluZm8vcGVyc29uYWxpbmZvLnZpZXcuaHRtbCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0dGhlVXNlcjogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgVXNlckZhY3Rvcnkpe1xuXHRcdFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5pZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn0pOyIsImFwcC5mYWN0b3J5KCdTb2NrRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gIHJldHVybiB7XG4gICAgc2luZ2xlU29jazogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBzb2NrQnlVc2VySWQ6IGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL2J5VXNlci8nICsgdXNlcklkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgbW9zdFJlY2VudFNvY2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgXHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svcmVjZW50JylcbiAgICBcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgIFx0XHRyZXR1cm4gcmVzLmRhdGFcbiAgICBcdH0pXG4gICAgfSxcblxuICAgIHNhdmVEZXNpZ246IGZ1bmN0aW9uIChuZXdTb2NrRGF0YU9iaikge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay8nLCBuZXdTb2NrRGF0YU9iailcbiAgICB9LFxuXG4gICAgcHJlcGFyZVRhZ3M6IGZ1bmN0aW9uICh0YWdJbnB1dCkge1xuICAgICAgcmV0dXJuIHRhZ0lucHV0LnNwbGl0KCcgJykubWFwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZSA9IGUucmVwbGFjZSgvLC9pLCBcIlwiKTtcbiAgICAgICAgZSA9IGUuc3Vic3RyaW5nKDEpO1xuICAgICAgICByZXR1cm4gZVxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHVwdm90ZTogZnVuY3Rpb24gKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay91cHZvdGUnLCB7aWQ6IHNvY2tJZH0pXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzLmRhdGEpXG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGRvd252b3RlOiBmdW5jdGlvbiAoc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9zb2NrL2Rvd252b3RlJywge2lkOiBzb2NrSWR9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfVxuXG4gIH1cblxufSlcbiIsIi8vIGFwcC5jb250cm9sbGVyKCdzb2NrVmlld0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBTb2NrRmFjdG9yeSwgUmV2aWV3RmFjdG9yeSkge1xuXG4vLyAgICRzY29wZS5zZXRTb2NrID0gZnVuY3Rpb24oc29ja0lkKSB7XG4vLyAgICAgcmV0dXJuIFNvY2tGYWN0b3J5LnNpbmdsZVNvY2soc29ja0lkKSAvLyByZXR1cm4/XG4vLyAgICAgLnRoZW4oZnVuY3Rpb24oc29jaykge1xuLy8gICAgICAgJHNjb3BlLnNvY2sgPSBzb2NrXG4vLyAgICAgfSlcbi8vICAgfVxuXG4vLyAgICRzY29wZS5zZXRSZXZpZXdzID0gZnVuY3Rpb24oc29ja0lkKSB7XG4vLyAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucHJvZHVjdFJldmlld3Moc29ja0lkKVxuLy8gICAgIC50aGVuKGZ1bmN0aW9uKHJldmlld3MpIHtcbi8vICAgICAgICRzY29wZS5yZXZpZXdzID0gcmV2aWV3c1xuLy8gICAgIH0pXG4vLyAgIH1cblxuLy8gICAkc2NvcGUuc2V0U29jaygxKTtcbi8vICAgJHNjb3BlLnNldFJldmlld3MoMSk7XG5cbi8vICAgJHNjb3BlLm5ld1JldmlldyA9IGZ1bmN0aW9uKCkge1xuLy8gICAgIHZhciBuZXdSZXZpZXcgPSB7XG4vLyAgICAgICB0ZXh0OiAkc2NvcGUucmV2aWV3VGV4dCxcbi8vICAgICAgIHNvY2tJZDogJHNjb3BlLnNvY2suaWRcbi8vICAgICB9XG4vLyAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucG9zdFJldmlldyhuZXdSZXZpZXcpXG4vLyAgICAgLnRoZW4oZnVuY3Rpb24obmV3UmV2aWV3KXtcbi8vICAgICAgIHZhciByZXZpZXcgPSB7fTtcbi8vICAgICAgIHJldmlldy51c2VyID0ge307XG5cbi8vICAgICAgICAgcmV2aWV3LnVzZXIuZmlyc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmZpcnN0X25hbWU7XG4vLyAgICAgICAgIHJldmlldy51c2VyLmxhc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmxhc3RfbmFtZTtcbi8vICAgICAgICAgcmV2aWV3LnVzZXIucHJvZmlsZV9waWMgPSBuZXdSZXZpZXcudXNlci5wcm9maWxlX3BpYztcbi8vICAgICAgICAgcmV2aWV3LnVzZXIudXNlcm5hbWUgPSBuZXdSZXZpZXcudXNlci51c2VybmFtZTtcbi8vICAgICAgICAgcmV2aWV3LnRleHQgPSBuZXdSZXZpZXcucmV2aWV3LnRleHQ7XG5cbi8vICAgICAgICRzY29wZS5yZXZpZXdzLnB1c2gocmV2aWV3KTtcbi8vICAgICAgICRzY29wZS5yZXZpZXdUZXh0ID0gbnVsbDtcbi8vICAgICB9KVxuLy8gICB9XG5cbi8vICAgJHNjb3BlLmFscmVhZHlQb3N0ZWQgPSBmdW5jdGlvbigpIHtcbi8vICAgICAvLyBhZGQgaW4gYWZ0ZXIgZmluaXNoaW5nIG90aGVyIHN0dWZmXG4vLyAgIH1cblxuLy8gfSk7XG5cbi8vIGFwcC5jb250cm9sbGVyKCdzb2NrSWRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMsIHRoZVNvY2ssIHRoZVJldmlld3MsIFJldmlld0ZhY3RvcnksIE9yZGVyRmFjdG9yeSwgQXV0aFNlcnZpY2UpIHtcblxuLy8gICAvLyAkc2NvcGUuZGF0ZVBhcnNlciA9IGZ1bmN0aW9uKGRhdGUpe1xuXG4vLyAgIC8vICAgLy9yZXR1cm4gdG8gdGhpcyBsYXRlci4gV291bGQgYmUgZ29vZCBpZiBzb2NrcyBhbmQgcmV2aWV3cyBzdGF0ZWQgd2hlbiB0aGV5IHdlcmUgcG9zdGVkXG5cbiAgLy8gICAvL3Nob3VsZCBhZGQgaXQgdG8gYSBmYWN0b3J5LCBiZWNhdXNlIG1hbnkgcGFnZXMgY2FuIG1ha2UgdXNlIG9mIGl0XG5cbiAgLy8gICB2YXIgbW9udGhPYmogPSB7XG4gIC8vICAgICAnMDEnOiBcIkphbnVhcnlcIixcbiAgLy8gICAgICcwMic6IFwiRmVicnVhcnlcIixcbiAgLy8gICAgICcwMyc6IFwiTWFyY2hcIixcbiAgLy8gICAgICcwNCc6IFwiQXByaWxcIixcbiAgLy8gICAgICcwNSc6IFwiTWF5XCIsXG4gIC8vICAgICAnMDYnOiBcIkp1bmVcIixcbiAgLy8gICAgICcwNyc6IFwiSnVseVwiLFxuICAvLyAgICAgJzA4JzogXCJBdWd1c3RcIixcbiAgLy8gICAgICcwOSc6IFwiU2VwdGVtYmVyXCIsXG4gIC8vICAgICAnMTAnOiBcIk9jdG9iZXJcIixcbiAgLy8gICAgICcxMSc6IFwiTm92ZW1iZXJcIixcbiAgLy8gICAgICcxMic6IFwiRGVjZW1iZXJcIlxuICAvLyAgIH1cblxuICAvLyB9XG5cbmFwcC5jb250cm9sbGVyKCdzb2NrSWRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBBdXRoU2VydmljZSwgJHN0YXRlUGFyYW1zLCB0aGVTb2NrLCB0aGVSZXZpZXdzLCBSZXZpZXdGYWN0b3J5LCBPcmRlckZhY3RvcnksIFNvY2tGYWN0b3J5KSB7XG5cblxuXG4gICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gZmFsc2U7XG4gICRzY29wZS5zb2NrID0gdGhlU29jaztcbiAgJHNjb3BlLnJldmlld3MgPSB0aGVSZXZpZXdzO1xuXG5cbiAgJHNjb3BlLmFsZXJ0ID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICRzY29wZS5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nXG4gICAgICAkc2NvcGUuJGRpZ2VzdCgpXG4gICAgfSwgMzAwMClcbiAgICAvLyBpZiAoISRzY29wZS5hbGVydGluZykgJHNjb3BlLm1lc3NhZ2UgPT09IG51bGxcbiAgfVxuXG4gICRzY29wZS5nb1RvVXNlclBhZ2UgPSBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiB1c2VySWR9KTtcbiAgfVxuXG4gICRzY29wZS5hZGRJdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW0gPSB7fTtcbiAgICBpdGVtLnNvY2tJZCA9ICRzY29wZS5zb2NrLmlkO1xuICAgIGl0ZW0ucXVhbnRpdHkgPSArJHNjb3BlLnF1YW50aXR5O1xuICAgIGl0ZW0ub3JpZ2luYWxQcmljZSA9ICskc2NvcGUuc29jay5wcmljZTtcbiAgICBpZiAoaXRlbS5xdWFudGl0eSA+IDApIHtcbiAgICAgIE9yZGVyRmFjdG9yeS5hZGRUb0NhcnQoaXRlbSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzcG9uc2UgIT09IFwib2JqZWN0XCIpICRzY29wZS5hbGVydChyZXNwb25zZSk7XG4gICAgICAgIGVsc2UgJHN0YXRlLmdvKCdjdXJyZW50Q2FydCcpO1xuICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSAkc2NvcGUuYWxlcnQoJ1lvdSBoYXZlIHRvIGFkZCBhdCBsZWFzdCBvbmUgc29jayEnKTtcbiAgfVxuXG4gICRzY29wZS5kaXNwbGF5VGFncyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkc2NvcGUuc29jay50YWdzLm1hcChmdW5jdGlvbih0YWcpe1xuICAgICAgcmV0dXJuICcjJyArIHRhZztcbiAgICB9KS5qb2luKFwiLCBcIik7XG4gIH1cblxuICAkc2NvcGUuZGlzcGxheVRhZ3MoKTtcblxuICAkc2NvcGUuZ2V0TG9nZ2VkSW5Vc2VySWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcbiAgICAudGhlbihmdW5jdGlvbih1c2VyKXtcbiAgICAgIGNvbnNvbGUubG9nKHVzZXIpO1xuICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICRzY29wZS5sb2dnZWRJblVzZXJJZCA9ICdub25lJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5sb2dnZWRJblVzZXJJZCA9IHVzZXIuaWQ7XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gICRzY29wZS5nZXRMb2dnZWRJblVzZXJJZCgpO1xuXG4gICRzY29wZS51c2VyQ2Fubm90UG9zdFJldmlldyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJHNjb3BlLnJldmlld05vdEFsbG93ZWQ7XG4gIH1cblxuICAkc2NvcGUudXNlckNhbm5vdFBvc3RSZXZpZXcoKTtcblxuICAkc2NvcGUubmV3UmV2aWV3ID0gZnVuY3Rpb24oKSB7XG5cbiAgLy9pZiB1c2VyIGhhcyBhbHJlYWR5IHJldmlldyBzb2NrLCBkb24ndCBhbGxvdyB1c2VyIHRvIHJldmlldyBpdCBhZ2FpblxuICAgIHZhciB1c2Vyc1dob1Jldmlld2VkU29jayA9ICRzY29wZS5yZXZpZXdzLm1hcChmdW5jdGlvbihyZXZpZXcpe1xuICAgICAgcmV0dXJuIHJldmlldy51c2VySWQ7XG4gICAgfSlcblxuICAgIGlmICgkc2NvcGUubG9nZ2VkSW5Vc2VySWQgPT09ICdub25lJykge1xuICAgICAgJHNjb3BlLnJldmlld0Vycm9yTWVzc2FnZSA9IFwiWW91IG11c3QgYmUgbG9nZ2VkIGluIHRvIHJldmlldyBhIHNvY2shXCI7XG4gICAgICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh1c2Vyc1dob1Jldmlld2VkU29jay5pbmRleE9mKCRzY29wZS5sb2dnZWRJblVzZXJJZCkgIT09IC0xKSB7XG4gICAgICAkc2NvcGUucmV2aWV3RXJyb3JNZXNzYWdlID0gXCJZb3UndmUgYWxyZWFkeSByZXZpZXdlZCB0aGlzIHNvY2shIFlvdSBjYW4ndCByZXZpZXcgaXQgYWdhaW4hXCI7XG4gICAgICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IHRydWU7XG4gIC8vaWYgc29jayBpZCBtYXRjaGVzIHVzZXIgaWQsIHVzZXIgZG9uJ3QgYWxsb3cgdXNlciB0byBwb3N0IGEgcmV2aWV3XG4gICAgfSBlbHNlIGlmICgkc2NvcGUubG9nZ2VkSW5Vc2VySWQgPT09ICRzY29wZS5zb2NrLnVzZXIuaWQpIHtcbiAgICAgICRzY29wZS5yZXZpZXdFcnJvck1lc3NhZ2UgPSBcIllvdSBjYW4ndCByZXZpZXcgeW91ciBvd24gc29jayFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICB2YXIgbmV3UmV2aWV3ID0ge1xuICAgICAgICB0ZXh0OiAkc2NvcGUucmV2aWV3VGV4dCxcbiAgICAgICAgc29ja0lkOiAkc2NvcGUuc29jay5pZFxuICAgICAgfVxuICAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucG9zdFJldmlldyhuZXdSZXZpZXcpXG4gICAgICAudGhlbihmdW5jdGlvbihuZXdSZXZpZXcpe1xuICAgICAgICB2YXIgcmV2aWV3ID0ge307XG4gICAgICAgIHJldmlldy51c2VyID0ge307XG5cbiAgICAgICAgICByZXZpZXcudXNlci5maXJzdF9uYW1lID0gbmV3UmV2aWV3LnVzZXIuZmlyc3RfbmFtZTtcbiAgICAgICAgICByZXZpZXcudXNlci5sYXN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5sYXN0X25hbWU7XG4gICAgICAgICAgcmV2aWV3LnVzZXIucHJvZmlsZV9waWMgPSBuZXdSZXZpZXcudXNlci5wcm9maWxlX3BpYztcbiAgICAgICAgICByZXZpZXcudXNlci51c2VybmFtZSA9IG5ld1Jldmlldy51c2VyLnVzZXJuYW1lO1xuICAgICAgICAgIHJldmlldy50ZXh0ID0gbmV3UmV2aWV3LnJldmlldy50ZXh0O1xuXG4gICAgICAgICRzY29wZS5yZXZpZXdzLnB1c2gocmV2aWV3KTtcbiAgICAgICAgJHNjb3BlLnJldmlld1RleHQgPSBudWxsO1xuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAkc2NvcGUudXB2b3RlID0gZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgcmV0dXJuIFNvY2tGYWN0b3J5LnVwdm90ZShzb2NrSWQpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgJHNjb3BlLnNvY2sudXB2b3RlcysrXG4gICAgfSlcbiAgfVxuICBcbiAgJHNjb3BlLmRvd252b3RlID0gZnVuY3Rpb24gKHNvY2tJZCkge1xuICAgIHJldHVybiBTb2NrRmFjdG9yeS5kb3dudm90ZShzb2NrSWQpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgJHNjb3BlLnNvY2suZG93bnZvdGVzKytcbiAgICB9KVxuICB9XG5cbn0pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgLy8gJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NvY2tzJywge1xuICAgIC8vICAgICB1cmw6ICcvc29ja3MnLFxuICAgIC8vICAgICBjb250cm9sbGVyOiAnc29ja1ZpZXdDb250cm9sbGVyJyxcbiAgICAvLyAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0dmlldy9wcm9kdWN0dmlldy5odG1sJ1xuICAgIC8vIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpbmdsZVNvY2tWaWV3Jywge1xuICAgICAgdXJsOicvc29ja3MvOmlkJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdzb2NrSWRDb250cm9sbGVyJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuaHRtbCcsXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIHRoZVNvY2s6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFNvY2tGYWN0b3J5KSB7XG4gICAgICAgICAgcmV0dXJuIFNvY2tGYWN0b3J5LnNpbmdsZVNvY2soJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICB9LFxuICAgICAgICB0aGVSZXZpZXdzOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBSZXZpZXdGYWN0b3J5KSB7XG4gICAgICAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucHJvZHVjdFJldmlld3MoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmV2aWV3RmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gIHJldHVybiB7XG4gICAgcG9zdFJldmlldzogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9yZXZpZXcvJywgb2JqKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9LFxuICAgIHByb2R1Y3RSZXZpZXdzOiBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcmV2aWV3L3NvY2svJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NlYXJjaFJlc3VsdHMnLCB7XG5cdFx0dXJsOiAnL3NlYXJjaC86c2VhcmNoVGVybXMnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3NlYXJjaHJlc3VsdHMvc2VhcmNoLnZpZXcuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogXCJzZWFyY2hDdHJsXCIsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0YWxsUmVzdWx0czogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgU2VhcmNoRmFjdG9yeSkge1xuXHRcdFx0XHRyZXR1cm4gU2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0KCRzdGF0ZVBhcmFtcy5zZWFyY2hUZXJtcylcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIGFsbFJlc3VsdHMpIHtcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gYWxsUmVzdWx0cztcblx0XHQvLyBcdGNvbnNvbGUubG9nKFwiQWxsIFJlc3VsdHMhIVwiLCBhbGxSZXN1bHRzKTtcblx0XHQvLyBcdCRzY29wZS5udW1iZXIgPSAxMjM7XG5cdFx0Ly8gfVxuXHRcdC8vIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcykge1xuXHRcdC8vIFx0Y29uc29sZS5sb2coXCJIRVJFRUVFRVwiLCAkc3RhdGVQYXJhbXMucmVzdWx0cylcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gJHN0YXRlUGFyYW1zLnJlc3VsdHNcblx0XHQvLyB9XG5cdH0pXG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ1NpZ251cEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBTaWdudXBGYWN0b3J5LCAkc3RhdGUpIHtcblxuICBmdW5jdGlvbiBwYXNzd29yZFZhbGlkIChwYXNzd29yZCkge1xuICAgIGlmIChwYXNzd29yZC5sZW5ndGggPCA2KSB7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlBhc3N3b3JkIG11c3QgYmUgNiBjaGFyYWN0ZXJzIGxvbmchXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChwYXNzd29yZCAhPT0gJHNjb3BlLnB3Mikge1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJUaGUgcGFzc3dvcmQgZmllbGRzIGRvbid0IG1hdGNoIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoL1xcVy8udGVzdChwYXNzd29yZCkpe1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJQYXNzd29yZCBjYW5ub3QgY29udGFpbiBzcGVjaWFsIGNoYXJhY3RlcnMhXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gICRzY29wZS5zaG93RXJyb3IgPSBmYWxzZTtcblxuICAkc2NvcGUuZGlzcGxheUVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICRzY29wZS5zaG93RXJyb3I7XG4gIH1cblxuICAkc2NvcGUuc3VibWl0U2lnbnVwID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChwYXNzd29yZFZhbGlkKCRzY29wZS5wYXNzd29yZCkpe1xuICAgICAgY29uc29sZS5sb2coXCJub3cgSSBkb24ndCB3b3JrIVwiKTtcbiAgICAgIHJldHVybiBTaWdudXBGYWN0b3J5LnN1Ym1pdCh7XG4gICAgICAgZW1haWw6ICRzY29wZS5lbWFpbCxcbiAgICAgICB1c2VybmFtZTogJHNjb3BlLnVzZXJuYW1lLFxuICAgICAgIHBhc3N3b3JkOiAkc2NvcGUucGFzc3dvcmQsXG4gICAgICAgZmlyc3RfbmFtZTogJHNjb3BlLmZpcnN0bmFtZSxcbiAgICAgICBsYXN0X25hbWU6ICRzY29wZS5sYXN0bmFtZSxcbiAgICAgICBpc0FkbWluOiBmYWxzZSxcbiAgICAgICBuZXdVc2VyOiB0cnVlXG4gICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAvLyByZXNwb25zZS5uZXdVc2VyID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuICRzdGF0ZS5nbygncGVyc29uYWwnLCB7aWQ6IHJlc3BvbnNlLmlkfSk7XG4gICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbn0pOyIsIi8vIGFwcC5mYWN0b3J5KCdTaWdudXBGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbi8vICAgdmFyIFNpZ251cEZhY3RvcnkgPSB7fTtcblxuLy8gICBTaWdudXBGYWN0b3J5LnN1Ym1pdCA9IGZ1bmN0aW9uKHVzZXJJbmZvKXtcbi8vICAgXHRjb25zb2xlLmxvZyh1c2VySW5mbyk7XG4vLyAgIFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci8nLCB1c2VySW5mbylcbi8vICAgXHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4vLyAgIFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcbi8vICAgXHR9KVxuLy8gICB9XG5cbi8vICAgcmV0dXJuIFNpZ251cEZhY3Rvcnk7XG5cbi8vIH0pXG5cbmFwcC5mYWN0b3J5KCdTaWdudXBGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBTaWdudXBGYWN0b3J5ID0ge307XG5cblx0U2lnbnVwRmFjdG9yeS5zdWJtaXQgPSBmdW5jdGlvbiAodXNlckluZm8pIHtcblx0XHRjb25zb2xlLmxvZyhcIkZyb20gU2lnbnVwIEZhY3RvcnlcIiwgdXNlckluZm8pO1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvJywgdXNlckluZm8pXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0fSlcblx0fVxuXHRyZXR1cm4gU2lnbnVwRmFjdG9yeTtcbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnbnVwJywge1xuXHRcdHVybDogJy9zaWdudXAnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDdHJsJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9zaWdudXAvc2lnbnVwLnZpZXcuaHRtbCdcblx0fSk7XG5cbn0pOyIsImFwcC5jb250cm9sbGVyKCdVc2VyQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgdGhlVXNlciwgdGhlVXNlclNvY2tzLCBBdXRoU2VydmljZSkge1xuICAgIGNvbnNvbGUubG9nKFwiY29udHJvbGxlclwiLCB0aGVVc2VyU29ja3MpO1xuXHQkc2NvcGUudXNlciA9IHRoZVVzZXI7XG5cdCRzY29wZS5zb2NrcyA9IHRoZVVzZXJTb2NrcztcblxuXHQkc2NvcGUudG9TaGlwcGluZ0luZm8gPSBmdW5jdGlvbihpZCl7XG5cdFx0JHN0YXRlLmdvKCdwZXJzb25hbCcsIHtpZDogaWR9KTtcblx0fTtcblxuXHQkc2NvcGUudG9Tb2NrVmlldyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdCRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcblx0fTtcblxuICAgICRzY29wZS52ZXJpZnlVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZihBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgcmV0dXJuIHVzZXIgPT0gJHNjb3BlLnVzZXI7XG4gICAgICAgIH0pO1xuICAgIFx0fVxuICAgIH07XG5cbn0pXG4iLCJhcHAuZmFjdG9yeSgnVXNlckZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0dmFyIFVzZXJGYWN0b3J5ID0ge307XG5cblx0VXNlckZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS91c2VyLycgKyBpZClcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZmFjdG9yeVwiLCByZXNwb25zZS5kYXRhKVxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGFcblx0XHR9KVxuXHR9XG5cblx0VXNlckZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS91c2VycycpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YVxuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gVXNlckZhY3Rvcnk7XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VzZXInLCB7XG5cdFx0dXJsOiAnL3VzZXIvOnVzZXJJZCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvdXNlci91c2VyLXByb2ZpbGUuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1VzZXJDdHJsJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR0aGVVc2VyOiBmdW5jdGlvbiAoVXNlckZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuXHRcdFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy51c2VySWQpO1xuXHRcdFx0fSxcblx0XHRcdHRoZVVzZXJTb2NrczogZnVuY3Rpb24gKFNvY2tGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0cmV0dXJuIFNvY2tGYWN0b3J5LnNvY2tCeVVzZXJJZCgkc3RhdGVQYXJhbXMudXNlcklkKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pXG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ25hdmJhckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIFNlYXJjaEZhY3RvcnkpIHtcblxuXHQkc2NvcGUuc2VhcmNoID0gZnVuY3Rpb24oc2VhcmNoVGVybXMpe1xuXHRcdC8vIFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dChzZWFyY2hUZXJtcylcblx0XHQvLyAudGhlbihmdW5jdGlvbihyZXN1bHRzKXtcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gcmVzdWx0cztcblx0XHQvLyBcdGNvbnNvbGUubG9nKHJlc3VsdHMpO1xuXHRcdFx0cmV0dXJuICRzdGF0ZS5nbygnc2VhcmNoUmVzdWx0cycsIHtzZWFyY2hUZXJtczogc2VhcmNoVGVybXN9KTtcblx0XHQvLyB9KVxuXHR9XG59KVxuXG5hcHAuY29udHJvbGxlcignc2VhcmNoQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgYWxsUmVzdWx0cywgJHN0YXRlUGFyYW1zKSB7XG5cdCRzY29wZS5yZXN1bHRzID0gYWxsUmVzdWx0cztcblx0JHNjb3BlLnNlZVNvY2sgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHQkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG5cdH1cbn0pIiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmZhY3RvcnkoXCJTZWFyY2hGYWN0b3J5XCIsIGZ1bmN0aW9uICgkaHR0cCkge1xuXHR2YXIgU2VhcmNoRmFjdG9yeSA9IHt9O1xuXG5cdFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dCA9IGZ1bmN0aW9uICh0ZXh0KSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9zZWFyY2gvP3E9JyArIHRleHQpXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzdWx0cykge1xuXHRcdFx0cmV0dXJuIHJlc3VsdHMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0cmV0dXJuIFNlYXJjaEZhY3Rvcnk7XG59KSIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUsIE9yZGVyRmFjdG9yeSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBPcmRlckZhY3RvcnkuZW5zdXJlQ2FydCgpXG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNeSBQcm9maWxlJywgc3RhdGU6ICd1c2VyKHt1c2VySWQ6dXNlci5pZH0pJywgYXV0aDogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIC8vIHsgbGFiZWw6ICdBYm91dCcsIHN0YXRlOiAnYWJvdXQnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0Rlc2lnbiBhIFNvY2snLCBzdGF0ZTogJ2Rlc2lnblZpZXcnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0FkbWluIERhc2hib2FyZCcsIHN0YXRlOiAnYWRtaW4nfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ29hdXRoQnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICBwcm92aWRlck5hbWU6ICdAJ1xuICAgIH0sXG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uaHRtbCdcbiAgfVxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
