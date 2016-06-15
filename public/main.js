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

app.controller('checkoutController', function ($scope, OrderFactory, currentCart, CheckoutFactory, $state) {
  $scope.currentCart = currentCart;

  $scope.calcTotal = function () {
    return OrderFactory.calculateTotal('current').then(function (cartTotal) {
      $scope.total = cartTotal;
    });
  };
  $scope.calcTotal();

  $scope.charge = function (status, response) {
    console.log(response);
    CheckoutFactory.chargeCard({
      token: response.id,
      amount: parseInt($scope.total * 100)
    }).then(function (res) {
      return OrderFactory.ensureCart();
    }).then(function (res) {
      $state.go('cartHistory');
    });
  };
});

app.factory('CheckoutFactory', function ($http, $state) {

  return {
    chargeCard: function chargeCard(obj) {
      return $http.post('/checkout', obj).then(function (order) {
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

app.directive('designView', function (SockFactory, $state, $http) {
  return {
    restrict: 'E',
    templateUrl: 'js/design/design-view.html',
    link: function link(scope, element, attrs, designViewCtrl) {

      var title = scope.title;
      var description = scope.description;
      var tags = scope.tags;
      var canvas = element.find('canvas')[0];

      scope.saveDesign = function (title, description, tags) {

        var tagsArr = SockFactory.prepareTags(tags);

        var newSockDataObj = {
          title: title,
          description: description,
          tags: tagsArr
        };

        function dataURItoBlob(dataURI) {
          var binary = atob(dataURI.split(',')[1]);
          var array = [];
          for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          }
          return new Blob([new Uint8Array(array)], { type: 'image/png' });
        }

        var dataUrl = canvas.toDataURL("image/png");
        var blobData = dataURItoBlob(dataUrl);

        SockFactory.getUnsignedURL().then(function (res) {
          var imageUrl = res.url.split('?')[0];

          $http.put(res.url, blobData, { headers: {
              'Content-Type': 'image/png',
              Key: 'ani_ben.png'
            } }).then(function (res) {
            newSockDataObj.image = imageUrl;
            SockFactory.saveDesign(newSockDataObj).then(function (result) {
              $state.go('user', { userId: result.data.userId });
            });
          });
        });
      };

      var color = $(".selected").css("background-color");
      var context = $("canvas")[0].getContext("2d");
      var $canvas = $("canvas");
      var lastEvent;
      var mouseDown = false;

      var background = new Image();

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
    }
  };
});

app.controller('DesignController', function ($scope) {

  var bucket = new AWS.S3({ params: { Bucket: 'myBucket' } });
  bucket.listObjects(function (err, data) {
    if (err) {
      document.getElementById('status').innerHTML = 'Could not load objects from S3';
    } else {
      document.getElementById('status').innerHTML = 'Loaded ' + data.Contents.length + ' items from S3';
      for (var i = 0; i < data.Contents.length; i++) {
        document.getElementById('objects').innerHTML += '<li>' + data.Contents[i].Key + '</li>';
      }
    }
  });
  $scope.hi = "hi";
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
app.controller('cartCurrent', function ($scope, OrderFactory, currentCart) {
  $scope.current = currentCart;
});

app.controller('cartHistory', function ($scope, OrderFactory, cartHistory) {

  $scope.cartHistory = cartHistory;
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

    getUnsignedURL: function getUnsignedURL() {
      return $http.get('/api/sock/unsignedURL').then(function (res) {
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
        console.log("AM I WHAT YOU THINK I AM?", response);
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
    $scope.verifyUser = result;
  });

  AuthService.getLoggedInUser().then(function (user) {
    return user.isAdmin ? true : false;
  }).then(function (result) {
    $scope.isAdmin = result;
  });

  if ($scope.user.isAdmin) $scope.adminButton = "Make Non-Admin";
  if (!$scope.user.isAdmin) $scope.adminButton = "Make Admin";

  $scope.delete = UserFactory.delete;

  $scope.makeAdmin = function (id) {
    return UserFactory.makeAdmin(id).then(function (res) {
      if ($scope.user.isAdmin) {
        $scope.user.isAdmin = false;
        $scope.adminButton = "Make Admin";
      } else if (!$scope.user.isAdmin) {
        $scope.user.isAdmin = true;
        $scope.adminButton = "Make Non-Admin";
      }
    });
  };
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

  UserFactory.makeAdmin = function (id) {
    return $http.put('/api/user/makeAdmin/' + id);
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

  return OrderFactory.ensureCart();
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

app.directive('randoGreeting', function (RandomGreetings) {

  return {
    restrict: 'E',
    templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
    link: function link(scope) {
      scope.greeting = RandomGreetings.getRandomGreeting();
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNoZWNrb3V0L2NoZWNrb3V0LmNvbnRyb2xsZXIuanMiLCJjaGVja291dC9jaGVja291dC5mYWN0b3J5LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuc3RhdGUuanMiLCJkZXNpZ24vZGVzaWduLWRpcmVjdGl2ZS5qcyIsImRlc2lnbi9kZXNpZ24uY29udHJvbGxlci5qcyIsImRlc2lnbi9kZXNpZ24uanMiLCJkZXNpZ24vZGVzaWduLnN0YXRlLmpzIiwiZG9jcy9kb2NzLmpzIiwiYWJvdXQvYWJvdXQuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm9yZGVyL29yZGVyLmNvbnRyb2xsZXIuanMiLCJvcmRlci9vcmRlci5kaXJlY3RpdmUuanMiLCJvcmRlci9vcmRlci5mYWN0b3J5LmpzIiwib3JkZXIvb3JkZXIuc3RhdGUuanMiLCJwZXJzb25hbGluZm8vcGVyc29uYWxpbmZvLmNvbnRyb2xsZXIuanMiLCJwZXJzb25hbGluZm8vcGVyc29uYWxpbmZvLmZhY3RvcnkuanMiLCJwZXJzb25hbGluZm8vcGVyc29uYWxpbmZvLnN0YXRlLmpzIiwicmV2aWV3L3Jldmlldy5mYWN0b3J5LmpzIiwicHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuZmFjdG9yeS5qcyIsInByb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3LmpzIiwic2VhcmNocmVzdWx0cy9zZWFyY2guc3RhdGUuanMiLCJzaWdudXAvc2lnbnVwLmNvbnRyb2xsZXIuanMiLCJzaWdudXAvc2lnbnVwLmZhY3RvcnkuanMiLCJzaWdudXAvc2lnbnVwLnN0YXRlLmpzIiwiaG9tZS9ob21lLmpzIiwidXNlci91c2VyLWNvbnRyb2xsZXIuanMiLCJ1c2VyL3VzZXItZmFjdG9yeS5qcyIsInVzZXIvdXNlci1zdGF0ZXMuanMiLCJjb21tb24vY29udHJvbGxlcnMvbmF2YmFyLmNvbnRyb2xsZXIuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvc2VhcmNoLmZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmRpcmVjdGl2ZS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsWUFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLFFBQUEsQ0FBQSxDQUFBOztBQUVBLElBQUEsTUFBQSxDQUFBLFVBQUEsa0JBQUEsRUFBQSxpQkFBQSxFQUFBOztBQUVBLG9CQUFBLFNBQUEsQ0FBQSxJQUFBOztBQUVBLHFCQUFBLFNBQUEsQ0FBQSxHQUFBOztBQUVBLHFCQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBLFFBQUEsQ0FBQSxNQUFBO0FBQ0EsR0FGQTtBQUdBLFNBQUEsaUJBQUEsQ0FBQSxrQ0FBQTtBQUNBLENBVkE7OztBQWFBLElBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7OztBQUdBLE1BQUEsK0JBQUEsU0FBQSw0QkFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLFdBQUEsTUFBQSxJQUFBLElBQUEsTUFBQSxJQUFBLENBQUEsWUFBQTtBQUNBLEdBRkE7Ozs7QUFNQSxhQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsUUFBQSxDQUFBLDZCQUFBLE9B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Q0FBQTtBQUNBLFVBQUEsU0FBQTtBQUNBLFVBQUEsWUFBQSxLQUFBOztBQUVBLFVBQUEsYUFBQSxJQUFBLEtBQUEsRUFBQTs7QUFFQSxpQkFBQSxHQUFBLEdBQUEsZ0JBQUE7O0FBRUEsaUJBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxTQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsRUFBQSxDQUFBO0FBQ0EsT0FGQTs7O0FBS0EsUUFBQSxXQUFBLEVBQUEsRUFBQSxDQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsWUFBQTs7QUFFQSxVQUFBLElBQUEsRUFBQSxRQUFBLEdBQUEsV0FBQSxDQUFBLFVBQUE7O0FBRUEsVUFBQSxJQUFBLEVBQUEsUUFBQSxDQUFBLFVBQUE7O0FBRUEsZ0JBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7QUFDQSxPQVBBOzs7QUFVQSxRQUFBLG9CQUFBLEVBQUEsS0FBQSxDQUFBLFlBQUE7O0FBRUE7QUFDQSxVQUFBLGNBQUEsRUFBQSxNQUFBO0FBQ0EsT0FKQTs7O0FBT0EsZUFBQSxXQUFBLEdBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxVQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxTQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsR0FBQTs7QUFJQTs7QUFFQSxRQUFBLG1CQUFBLEVBQUEsRUFBQSxDQUFBLE9BQUEsRUFBQSxXQUFBOzs7QUFHQSxRQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTs7QUFFQSxZQUFBLFlBQUEsRUFBQSxXQUFBLENBQUE7QUFDQSxrQkFBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLFVBQUEsY0FBQSxFQUFBLE1BQUEsQ0FBQSxTQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsUUFBQSxHQUFBLFdBQUEsQ0FBQSxVQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxVQUFBO0FBQ0EsZ0JBQUEsRUFBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7O0FBRUEsVUFBQSxjQUFBLEVBQUEsSUFBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLENBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsR0FBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxFQUFBLFNBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsSUFBQSxHQUFBLENBQUEsR0FBQSxHQUFBO0FBRUEsT0FmQTs7O0FBa0JBLGNBQUEsU0FBQSxDQUFBLFVBQUEsQ0FBQSxFQUFBO0FBQ0Esb0JBQUEsQ0FBQTtBQUNBLG9CQUFBLElBQUE7QUFDQSxPQUhBLEVBR0EsU0FIQSxDQUdBLFVBQUEsQ0FBQSxFQUFBOztBQUVBLFlBQUEsU0FBQSxFQUFBO0FBQ0Esa0JBQUEsU0FBQTtBQUNBLGtCQUFBLE1BQUEsQ0FBQSxVQUFBLE9BQUEsRUFBQSxVQUFBLE9BQUE7QUFDQSxrQkFBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsRUFBQSxPQUFBO0FBQ0Esa0JBQUEsV0FBQSxHQUFBLEtBQUE7QUFDQSxrQkFBQSxNQUFBO0FBQ0Esa0JBQUEsT0FBQSxHQUFBLE9BQUE7QUFDQSxrQkFBQSxTQUFBLEdBQUEsRUFBQTs7QUFFQSxzQkFBQSxDQUFBO0FBQ0E7QUFDQSxPQWhCQSxFQWdCQSxPQWhCQSxDQWdCQSxZQUFBO0FBQ0Esb0JBQUEsS0FBQTtBQUNBLE9BbEJBLEVBa0JBLFVBbEJBLENBa0JBLFlBQUE7QUFDQSxnQkFBQSxPQUFBO0FBQ0EsT0FwQkE7QUF1QkE7QUExSUEsR0FBQTtBQTRJQSxDQTdJQTs7QUNBQSxJQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBOztBQUVBLE1BQUEsU0FBQSxJQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsUUFBQSxFQUFBLFFBQUEsVUFBQSxFQUFBLEVBQUEsQ0FBQTtBQUNBLFNBQUEsV0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLFFBQUEsR0FBQSxFQUFBO0FBQ0EsZUFBQSxjQUFBLENBQUEsUUFBQSxFQUFBLFNBQUEsR0FDQSxnQ0FEQTtBQUVBLEtBSEEsTUFHQTtBQUNBLGVBQUEsY0FBQSxDQUFBLFFBQUEsRUFBQSxTQUFBLEdBQ0EsWUFBQSxLQUFBLFFBQUEsQ0FBQSxNQUFBLEdBQUEsZ0JBREE7QUFFQSxXQUFBLElBQUEsSUFBQSxDQUFBLEVBQUEsSUFBQSxLQUFBLFFBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsaUJBQUEsY0FBQSxDQUFBLFNBQUEsRUFBQSxTQUFBLElBQ0EsU0FBQSxLQUFBLFFBQUEsQ0FBQSxDQUFBLEVBQUEsR0FBQSxHQUFBLE9BREE7QUFFQTtBQUNBO0FBQ0EsR0FaQTtBQWFBLFNBQUEsRUFBQSxHQUFBLElBQUE7QUFFQSxDQWxCQTs7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGlCQUFBLEtBQUEsQ0FBQSxZQUFBLEVBQUE7QUFDQSxTQUFBLG1CQURBO0FBRUEsV0FBQTtBQUNBLGVBQUE7QUFEQSxLQUZBO0FBS0EsZ0JBQUEsZ0JBTEE7QUFNQSxjQUFBO0FBTkEsR0FBQTtBQVNBLENBVkE7O0FBWUEsSUFBQSxVQUFBLENBQUEsZ0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUE7O0FBRUEsUUFBQSxJQUFBLENBQUEsbUJBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFDQSxXQUFBLE9BQUEsUUFBQSxHQUFBLEdBQUE7QUFDQSxHQUhBOzs7Ozs7QUFTQSxDQVhBO0FDWkEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsU0FBQSxTQURBO0FBRUEsZ0JBQUEsa0JBRkE7QUFHQSxpQkFBQTtBQUhBLEdBQUE7QUFLQSxDQU5BO0FDQUEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsU0FBQSxPQURBO0FBRUEsaUJBQUE7QUFGQSxHQUFBO0FBSUEsQ0FMQTs7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7O0FBR0EsaUJBQUEsS0FBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLFNBQUEsUUFEQTtBQUVBLGdCQUFBLGlCQUZBO0FBR0EsaUJBQUE7QUFIQSxHQUFBO0FBTUEsQ0FUQTs7QUFXQSxJQUFBLFVBQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQTs7O0FBR0EsU0FBQSxNQUFBLEdBQUEsRUFBQSxPQUFBLENBQUEsYUFBQSxDQUFBO0FBRUEsQ0FMQTs7QUNYQSxDQUFBLFlBQUE7O0FBRUE7Ozs7QUFHQSxNQUFBLENBQUEsT0FBQSxPQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSx3QkFBQSxDQUFBOztBQUVBLE1BQUEsTUFBQSxRQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxDQUFBOztBQUVBLE1BQUEsT0FBQSxDQUFBLFFBQUEsRUFBQSxZQUFBO0FBQ0EsUUFBQSxDQUFBLE9BQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQTtBQUNBLFdBQUEsT0FBQSxFQUFBLENBQUEsT0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBO0FBQ0EsR0FIQTs7Ozs7QUFRQSxNQUFBLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxrQkFBQSxvQkFEQTtBQUVBLGlCQUFBLG1CQUZBO0FBR0EsbUJBQUEscUJBSEE7QUFJQSxvQkFBQSxzQkFKQTtBQUtBLHNCQUFBLHdCQUxBO0FBTUEsbUJBQUE7QUFOQSxHQUFBOztBQVNBLE1BQUEsT0FBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFFBQUEsYUFBQTtBQUNBLFdBQUEsWUFBQSxnQkFEQTtBQUVBLFdBQUEsWUFBQSxhQUZBO0FBR0EsV0FBQSxZQUFBLGNBSEE7QUFJQSxXQUFBLFlBQUE7QUFKQSxLQUFBO0FBTUEsV0FBQTtBQUNBLHFCQUFBLHVCQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLFVBQUEsQ0FBQSxXQUFBLFNBQUEsTUFBQSxDQUFBLEVBQUEsUUFBQTtBQUNBLGVBQUEsR0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBO0FBQ0E7QUFKQSxLQUFBO0FBTUEsR0FiQTs7QUFlQSxNQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLGtCQUFBLFlBQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxXQURBLEVBRUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxhQUFBLFVBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUE7QUFDQSxLQUpBLENBQUE7QUFNQSxHQVBBOztBQVNBLE1BQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxFQUFBLEVBQUE7O0FBRUEsYUFBQSxpQkFBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFVBQUEsT0FBQSxTQUFBLElBQUE7QUFDQSxjQUFBLE1BQUEsQ0FBQSxLQUFBLEVBQUEsRUFBQSxLQUFBLElBQUE7QUFDQSxpQkFBQSxVQUFBLENBQUEsWUFBQSxZQUFBO0FBQ0EsYUFBQSxLQUFBLElBQUE7QUFDQTs7OztBQUlBLFNBQUEsZUFBQSxHQUFBLFlBQUE7QUFDQSxhQUFBLENBQUEsQ0FBQSxRQUFBLElBQUE7QUFDQSxLQUZBOztBQUlBLFNBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsVUFBQSxLQUFBLGVBQUEsTUFBQSxlQUFBLElBQUEsRUFBQTtBQUNBLGVBQUEsR0FBQSxJQUFBLENBQUEsUUFBQSxJQUFBLENBQUE7QUFDQTs7Ozs7QUFLQSxhQUFBLE1BQUEsR0FBQSxDQUFBLFVBQUEsRUFBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTtBQUNBLGVBQUEsSUFBQTtBQUNBLE9BRkEsQ0FBQTtBQUlBLEtBckJBOztBQXVCQSxTQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsRUFDQSxJQURBLENBQ0EsaUJBREEsRUFFQSxLQUZBLENBRUEsWUFBQTtBQUNBLGVBQUEsR0FBQSxNQUFBLENBQUEsRUFBQSxTQUFBLDRCQUFBLEVBQUEsQ0FBQTtBQUNBLE9BSkEsQ0FBQTtBQUtBLEtBTkE7O0FBUUEsU0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsU0FBQSxFQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsZ0JBQUEsT0FBQTtBQUNBLG1CQUFBLFVBQUEsQ0FBQSxZQUFBLGFBQUE7QUFDQSxPQUhBLENBQUE7QUFJQSxLQUxBO0FBT0EsR0FyREE7O0FBdURBLE1BQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsUUFBQSxPQUFBLElBQUE7O0FBRUEsZUFBQSxHQUFBLENBQUEsWUFBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBLE9BQUE7QUFDQSxLQUZBOztBQUlBLGVBQUEsR0FBQSxDQUFBLFlBQUEsY0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBLE9BQUE7QUFDQSxLQUZBOztBQUlBLFNBQUEsRUFBQSxHQUFBLElBQUE7QUFDQSxTQUFBLElBQUEsR0FBQSxJQUFBOztBQUVBLFNBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxHQUFBLFNBQUE7QUFDQSxXQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsS0FIQTs7QUFLQSxTQUFBLE9BQUEs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QUFBLEVBQUE7O0FBRUEsU0FBQTtBQUNBLGNBQUEsR0FEQTtBQUVBLFdBQUEsRUFGQTtBQUdBLGlCQUFBLHVCQUhBO0FBSUEsVUFBQSxjQUFBLEtBQUEsRUFBQTs7QUFFQSxZQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxhQUFBLGNBQUEsQ0FBQSxTQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsU0FBQSxFQUFBO0FBQUEsZ0JBQUEsVUFBQSxHQUFBLFNBQUE7QUFBQSxTQURBLENBQUE7QUFFQSxPQUhBOztBQUtBLFlBQUEsU0FBQSxHQUNBLElBREEsQ0FDQSxZQUFBO0FBQUEsZ0JBQUEsR0FBQSxDQUFBLE1BQUEsVUFBQTtBQUFBLE9BREE7O0FBR0EsYUFBQSxhQUFBLFFBQUEsQ0FBQSxTQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsT0FBQSxFQUFBO0FBQUEsY0FBQSxXQUFBLEdBQUEsT0FBQTtBQUFBLE9BREEsQ0FBQTtBQUVBO0FBaEJBLEdBQUE7QUFtQkEsQ0FyQkE7O0FDaERBLElBQUEsT0FBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLE1BQUEsYUFBQSxFQUFBO0FBQ0EsTUFBQSxZQUFBLFNBQUEsU0FBQSxDQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxXQUFBLElBQUEsR0FBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQUEsYUFBQSxLQUFBLE1BQUE7QUFBQSxLQUFBLEVBQUEsT0FBQSxDQUFBLElBQUEsTUFBQSxNQUFBLENBQUEsQ0FBQSxHQUFBLEtBQUEsR0FBQSxJQUFBO0FBQ0EsR0FGQTtBQUdBLFNBQUE7QUFDQSxlQUFBLG1CQUFBLEdBQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsb0JBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFBQSxlQUFBLFVBQUEsR0FBQSxFQUFBLElBQUEsSUFBQSxDQUFBO0FBQUEsT0FEQSxFQUVBLElBRkEsQ0FFQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFlBQUEsTUFBQSxFQUFBO0FBQ0EsaUJBQUEs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QUEsUUFBQSxDQUFBLFNBQUEsQ0FBQTtBQUNBO0FBSEE7QUFKQSxHQUFBO0FBV0EsQ0F2QkE7O0FDQUEsSUFBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLE9BQUEsRUFBQSxtQkFBQSxFQUFBOztBQUVBLFNBQUEsTUFBQSxHQUFBLFFBQUEsRUFBQTtBQUNBLFNBQUEsUUFBQSxHQUFBLFFBQUEsUUFBQTtBQUNBLFNBQUEsUUFBQSxHQUFBLFFBQUEsUUFBQTtBQUNBLFNBQUEsR0FBQSxHQUFBLFFBQUEsR0FBQTtBQUNBLFNBQUEsS0FBQSxHQUFBLFFBQUEsS0FBQTtBQUNBLFNBQUEsT0FBQSxHQUFBLFFBQUEsT0FBQTtBQUNBLFNBQUEsS0FBQSxHQUFBLFFBQUEsS0FBQTtBQUNBLFNBQUEsWUFBQSxHQUFBLEtBQUE7Ozs7Ozs7Ozs7Ozs7O0FBY0EsVUFBQSxHQUFBLENBQUEsWUFBQTs7QUFFQSxTQUFBLGNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFFBQUEsQ0FBQSxPQUFBLE9BQUEsS0FBQSxlQUFBLElBQUEsT0FBQSxPQUFBLEtBQUEsUUFBQSxLQUFBLE9BQUEsS0FBQSxLQUFBLEVBQUEsRUFBQTtBQUNBLGFBQUEsWUFBQSxHQUFBLElBQUE7QUFDQSxhQUFBLE9BQUEsWUFBQSxHQUFBLGlEQUFBO0FBQ0E7O0FBRUEsUUFBQSxXQUFBO0FBQ0EsZ0JBQUEsT0FBQSxRQURBO0FBRUEsZ0JBQUEsT0FBQSxRQUZBO0FBR0EsV0FBQSxPQUFBLEdBSEE7QUFJQSxhQUFBLE9BQUEsS0FKQTtBQUtBLGVBQUEsT0FBQSxPQUxBO0FBTUEsYUFBQSxPQUFBO0FBTkEsS0FBQTs7QUFTQSxXQUFBLG9CQUFBLE1BQUEsQ0FBQSxPQUFBLE1BQUEsRUFBQSxRQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBOztBQUVBLGFBQUEsT0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBOztBQUVBLEtBTEEsQ0FBQTtBQU1BLEdBckJBO0FBdUJBLENBaERBO0FD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QUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsTUFBQSxFQUFBLEVBQUEsUUFBQSxNQUFBLEVBQUE7QUFDQSxHQUZBOztBQUlBLFNBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxRQUFBLE9BQUEsRUFBQTtBQUNBLFNBQUEsTUFBQSxHQUFBLE9BQUEsSUFBQSxDQUFBLEVBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxDQUFBLE9BQUEsUUFBQTtBQUNBLFNBQUEsYUFBQSxHQUFBLENBQUEsT0FBQSxJQUFBLENBQUEsS0FBQTtBQUNBLFFBQUEsS0FBQSxRQUFBLEdBQUEsQ0FBQSxFQUFBO0FBQ0EsbUJBQUEsU0FBQSxDQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsUUFBQSx5Q0FBQSxRQUFBLE9BQUEsUUFBQSxFQUFBLE9BQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxLQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUE7QUFDQSxPQUpBO0FBS0EsS0FOQSxNQU9BLE9BQUEsS0FBQSxDQUFBLG9DQUFBO0FBQ0EsR0FiQTs7QUFlQSxTQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxPQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUE7QUFDQSxLQUZBLEVBRUEsSUFGQSxDQUVBLElBRkEsQ0FBQTtBQUdBLEdBSkE7O0FBTUEsU0FBQSxXQUFBOztBQUVBLFNBQUEsaUJBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxZQUFBLGVBQUEsR0FDQSxJQURBLENBQ0EsVUFBQSxJQUFBLEVBQUE7QUFDQSxjQUFBLEdBQUEsQ0FBQSxJQUFBO0FBQ0EsVUFBQSxDQUFBLElBQUEsRUFBQTtBQUNBLGVBQUEsY0FBQSxHQUFBLE1BQUE7QUFDQSxPQUZBLE1BRUE7QUFDQSxlQUFBLGNBQUEsR0FBQSxLQUFBLEVBQUE7QUFDQTtBQUNBLEtBUkEsQ0FBQTtBQVNBLEdBVkE7O0FBWUEsU0FBQSxpQkFBQTs7QUFFQSxTQUFBLG9CQUFB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LEdBQUEsS0FBQTtBQUNBLEdBRkEsRUFHQSxJQUhBLENBR0EsVUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLFVBQUEsR0FBQSxNQUFBO0FBQ0EsR0FMQTs7QUFPQSxjQUFBLGVBQUEsR0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxXQUFBLEtBQUEsT0FBQSxHQUFBLElBQUEsR0FBQSxLQUFBO0FBQ0EsR0FGQSxFQUdBLElBSEEsQ0FHQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsT0FBQSxHQUFBLE1BQUE7QUFDQSxHQUxBOztBQU9BLE1BQUEsT0FBQSxJQUFBLENBQUEsT0FBQSxFQUFBLE9BQUEsV0FBQSxHQUFBLGdCQUFBO0FBQ0EsTUFBQSxDQUFBLE9BQUEsSUFBQSxDQUFBLE9BQUEsRUFBQSxPQUFBLFdBQUEsR0FBQSxZQUFBOztBQUVBLFNBQUEsTUFBQSxHQUFBLFlBQUEsTUFBQTs7QUFFQSxTQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsWUFBQSxTQUFBLENBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEdBQUEsRUFBQTtBQUNBLFVBQUEsT0FBQSxJQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsZUFBQSxJQUFBLENBQUEsT0FBQSxHQUFBLEtBQUE7QUFDQSxlQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsT0FIQSxNQUlBLElBQUEsQ0FBQSxPQUFBLElBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxlQUFBLElBQUEsQ0FBQSxPQUFBLEdBQUEsSUFBQTtBQUNBLGVBQUEsV0FBQSxHQUFBLGdCQUFBO0FBQ0E7QUFDQSxLQVZBLENBQUE7QUFXQSxHQVpBO0FBYUEsQ0E3Q0E7O0FDQUEsSUFBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLE1BQUEsY0FBQSxFQUFBOztBQUVBLGNBQUEsU0FBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsV0FBQSxNQUFBLEdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxjQUFBLEdBQUEsQ0FBQSxTQUFBLEVBQUEsU0FBQSxJQUFBO0FBQ0EsYUFBQSxTQUFBLElBQUE7QUFDQSxLQUpBLENBQUE7QUFLQSxHQU5BOztBQVFBLGNBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxXQUFBLE1BQUEsR0FBQSxDQUFBLFlBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxhQUFBLFNBQUEsSUFBQTtBQUNBLEtBSEEsQ0FBQTtBQUlBLEdBTEE7O0FBT0EsY0FBQSxNQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxXQUFBLE1BQUEsSUFBQSxDQUFBLHNCQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsT0FBQSxFQUFBLENBQUEsTUFBQSxDQURBLENBQUE7QUFFQSxHQUhBOztBQUtBLGNBQUEsU0FBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsV0FBQSxNQUFBLEdBQUEsQ0FBQSx5QkFBQSxFQUFBLENBQUE7QUFDQSxHQUZBOztBQUlBLFNBQUEsV0FBQTtBQUNBLENBNUJBOztBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFNBQUEsZUFEQTtBQUVBLGlCQUFBLDRCQUZBO0FBR0EsZ0JBQUEsVUFIQTtBQUlBLGFBQUE7QUFDQSxlQUFBLGlCQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLFlBQUEsU0FBQSxDQUFBLGFBQUEsTUFBQSxDQUFBO0FBQ0EsT0FIQTtBQUlBLG9CQUFBLHNCQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLFlBQUEsWUFBQSxDQUFBLGFBQUEsTUFBQSxDQUFBO0FBQ0E7QUFOQTtBQUpBLEdBQUE7QUFhQSxDQWRBOztBQ0FBLElBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBLFlBQUEsRUFBQTs7QUFFQSxTQUFBLE1BQUEsR0FBQSxVQUFBLFdBQUEsRUFB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QUFBLE9BQUEsaUJBQUEsRUFBQSxPQUFBLE9BQUEsRUFEQSxDQUFBOztBQUlBLFlBQUEsSUFBQSxHQUFBLElBQUE7O0FBRUEsWUFBQSxVQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsWUFBQSxlQUFBLEVBQUE7QUFDQSxPQUZBOztBQUlBLFlBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLFlBQUEsTUFBQSxHQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsaUJBQUEsRUFBQSxDQUFBLE1BQUE7QUFDQSxTQUZBLENBQUE7QUFHQSxPQUpBOztBQU1BLFVBQUEsVUFBQSxTQUFBLE9BQUEsR0FBQTtBQUNBLGVBQUEsWUFBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxTQUZBLENBQUE7QUFHQSxPQUpBOztBQU1BOztBQUVBLFVBQUEsYUFBQSxTQUFBLFVBQUEsR0FBQTtBQUNBLGNBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxPQUZBOztBQUlBLGlCQUFBLEdBQUEsQ0FBQSxZQUFBLFlBQUEsRUFBQSxPQUFBO0FBQ0EsaUJBQUEsR0FBQSxDQUFBLFlBQUEsYUFBQSxFQUFBLFVBQUE7QUFDQSxpQkFBQSxHQUFBLENBQUEsWUFBQSxjQUFBLEVBQUEsVUFBQTtBQUVBOztBQWhEQSxHQUFBO0FBb0RBLENBdERBOztBQ0FBOztBQUVBLElBQUEsU0FBQSxDQUFBLGFBQUEsRUFBQSxZQUFBO0FBQ0EsU0FBQTtBQUNBLFdBQUE7QUFDQSxvQkFBQTtBQURBLEtBREE7QUFJQSxjQUFBLEdBSkE7QUFLQSxpQkFBQTtBQUxBLEdBQUE7QUFPQSxDQVJBOztBQ0ZBLElBQUEsU0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBLGVBQUEsRUFBQTs7QUFFQSxTQUFBO0FBQ0EsY0FBQSxHQURBO0FBRUEsaUJBQUEseURBRkE7QUFHQSxVQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0EsWUFBQSxRQUFBLEdBQUEsZ0JBQUEsaUJBQUEsRUFBQTtBQUNBO0FBTEEsR0FBQTtBQVFBLENBVkEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnc29ja21hcmtldCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnLCAnc3RyaXBlJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG4gICAgU3RyaXBlLnNldFB1Ymxpc2hhYmxlS2V5KCdwa190ZXN0X1JkN25NcFNaTXFSTnVCNHpqRWVaSHQxZCcpO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2NoZWNrb3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIE9yZGVyRmFjdG9yeSwgY3VycmVudENhcnQsIENoZWNrb3V0RmFjdG9yeSwgJHN0YXRlKSB7XG4gICRzY29wZS5jdXJyZW50Q2FydCA9IGN1cnJlbnRDYXJ0XG5cbiAgJHNjb3BlLmNhbGNUb3RhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBPcmRlckZhY3RvcnkuY2FsY3VsYXRlVG90YWwoJ2N1cnJlbnQnKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnRUb3RhbCkgeyAkc2NvcGUudG90YWwgPSBjYXJ0VG90YWwgfSlcbiAgfVxuICAkc2NvcGUuY2FsY1RvdGFsKClcblxuICAkc2NvcGUuY2hhcmdlID0gZnVuY3Rpb24oc3RhdHVzLCByZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgIENoZWNrb3V0RmFjdG9yeS5jaGFyZ2VDYXJkKHtcbiAgICAgIHRva2VuOiByZXNwb25zZS5pZCxcbiAgICAgIGFtb3VudDogcGFyc2VJbnQoJHNjb3BlLnRvdGFsKjEwMClcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5lbnN1cmVDYXJ0KClcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgJHN0YXRlLmdvKCdjYXJ0SGlzdG9yeScpXG4gICAgfSlcbiAgfVxuXG59KVxuIiwiYXBwLmZhY3RvcnkoJ0NoZWNrb3V0RmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBjaGFyZ2VDYXJkOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvY2hlY2tvdXQnLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICByZXR1cm4gb3JkZXIuZGF0YVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hlY2tvdXQnLCB7XG4gICAgdXJsOiAnL2NhcnQvY2hlY2tvdXQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL2NoZWNrb3V0L2NoZWNrb3V0Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdjaGVja291dENvbnRyb2xsZXInLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGN1cnJlbnRDYXJ0OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuXHRcdFx0fVxuXHRcdH1cbiAgfSlcbn0pXG4iLCJhcHAuZGlyZWN0aXZlKCdkZXNpZ25WaWV3JywgZnVuY3Rpb24gKFNvY2tGYWN0b3J5LCAkc3RhdGUsICRodHRwKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2Rlc2lnbi9kZXNpZ24tdmlldy5odG1sJyxcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBkZXNpZ25WaWV3Q3RybCkge1xuXG5cdFx0XHR2YXIgdGl0bGUgPSBzY29wZS50aXRsZTtcblx0XHRcdHZhciBkZXNjcmlwdGlvbiA9IHNjb3BlLmRlc2NyaXB0aW9uO1xuXHRcdFx0dmFyIHRhZ3MgPSBzY29wZS50YWdzO1xuXHRcdFx0dmFyIGNhbnZhcyA9IGVsZW1lbnQuZmluZCgnY2FudmFzJylbMF07XG5cblx0XHRcdHNjb3BlLnNhdmVEZXNpZ24gPSBmdW5jdGlvbiAodGl0bGUsIGRlc2NyaXB0aW9uLCB0YWdzKSB7XG5cblx0XHRcdFx0dmFyIHRhZ3NBcnIgPSBTb2NrRmFjdG9yeS5wcmVwYXJlVGFncyh0YWdzKTtcblxuICAgICAgICB2YXIgbmV3U29ja0RhdGFPYmogPSB7XG4gICAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbixcbiAgICAgICAgICB0YWdzOiB0YWdzQXJyXG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gZGF0YVVSSXRvQmxvYihkYXRhVVJJKSB7XG4gICAgICAgICAgdmFyIGJpbmFyeSA9IGF0b2IoZGF0YVVSSS5zcGxpdCgnLCcpWzFdKTtcbiAgICAgICAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgYmluYXJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcnJheS5wdXNoKGJpbmFyeS5jaGFyQ29kZUF0KGkpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBCbG9iKFtuZXcgVWludDhBcnJheShhcnJheSldLCB7dHlwZTogJ2ltYWdlL3BuZyd9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkYXRhVXJsID0gY2FudmFzLnRvRGF0YVVSTChcImltYWdlL3BuZ1wiKTtcbiAgICAgICAgdmFyIGJsb2JEYXRhID0gZGF0YVVSSXRvQmxvYihkYXRhVXJsKTtcblxuICAgICAgICBTb2NrRmFjdG9yeS5nZXRVbnNpZ25lZFVSTCgpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICAgIHZhciBpbWFnZVVybCA9IHJlcy51cmwuc3BsaXQoJz8nKVswXTtcblxuICAgICAgICAgICAgJGh0dHAucHV0KHJlcy51cmwsIGJsb2JEYXRhLFxuICAgICAgICAgICAgICB7aGVhZGVyczoge1xuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICAgICAgS2V5IDogJ2FuaV9iZW4ucG5nJ1xuICAgICAgICAgICAgfX0pXG4gICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgICAgICAgbmV3U29ja0RhdGFPYmouaW1hZ2UgPSBpbWFnZVVybDtcbiAgICAgICAgICAgICAgICBTb2NrRmFjdG9yeS5zYXZlRGVzaWduKG5ld1NvY2tEYXRhT2JqKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygndXNlcicsIHt1c2VySWQ6IHJlc3VsdC5kYXRhLnVzZXJJZH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuXHRcdFx0fTtcblxuXG5cdFx0XHR2YXIgY29sb3IgPSAkKFwiLnNlbGVjdGVkXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XG5cdFx0XHR2YXIgY29udGV4dCA9ICQoXCJjYW52YXNcIilbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXHRcdFx0dmFyICRjYW52YXMgPSAkKFwiY2FudmFzXCIpO1xuXHRcdFx0dmFyIGxhc3RFdmVudDtcblx0XHRcdHZhciBtb3VzZURvd24gPSBmYWxzZTtcblxuXHRcdFx0dmFyIGJhY2tncm91bmQgPSBuZXcgSW1hZ2UoKTtcblxuXHRcdFx0YmFja2dyb3VuZC5zcmMgPSAnL3NvY2stYmcvMS5wbmcnO1xuXG5cdFx0XHRiYWNrZ3JvdW5kLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ICBjb250ZXh0LmRyYXdJbWFnZShiYWNrZ3JvdW5kLCAwLCAwKTtcblx0XHRcdH07XG5cblx0XHRcdC8vV2hlbiBjbGlja2luZyBvbiBjb250cm9sIGxpc3QgaXRlbXNcblx0XHRcdCAgJChcIi5jb250cm9sc1wiKS5vbihcImNsaWNrXCIsIFwibGlcIiAsIGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgIC8vRGVzbGVjdCBzaWJsaW5nIGVsZW1lbnRzXG5cdFx0XHQgICAgICQodGhpcykuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAgICAvL1NlbGVjdCBjbGlja2VkIGVsZW1lbnRcblx0XHRcdCAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAgICAvL3N0b3JlIHRoZSBjb2xvclxuXHRcdFx0ICAgICBjb2xvciA9ICQodGhpcykuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdCAgfSk7XG5cblx0XHRcdC8vV2hlbiBcIkFkZCBDb2xvclwiIGJ1dHRvbiBpcyBwcmVzc2VkXG5cdFx0XHQgICQoXCIjcmV2ZWFsQ29sb3JTZWxlY3RcIikuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgIC8vU2hvdyBjb2xvciBzZWxlY3Qgb3IgaGlkZSB0aGUgY29sb3Igc2VsZWN0XG5cdFx0XHQgICAgY2hhbmdlQ29sb3IoKTtcblx0XHRcdCAgXHQkKFwiI2NvbG9yU2VsZWN0XCIpLnRvZ2dsZSgpO1xuXHRcdFx0ICB9KTtcblxuXHRcdFx0Ly9VcGRhdGUgdGhlIG5ldyBjb2xvciBzcGFuXG5cdFx0XHRmdW5jdGlvbiBjaGFuZ2VDb2xvcigpe1xuXHRcdFx0XHR2YXIgciA9ICQoXCIjcmVkXCIpLnZhbCgpO1xuXHRcdFx0XHR2YXIgZyA9ICQoXCIjZ3JlZW5cIikudmFsKCk7XG5cdFx0XHRcdHZhciBiID0gJChcIiNibHVlXCIpLnZhbCgpO1xuXHRcdFx0XHQkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2IoXCIgKyByICsgXCIsIFwiICsgZyArIFwiLCBcIiArIGIgKyBcIilcIik7XG5cdFx0XHQgIC8vV2hlbiBjb2xvciBzbGlkZXJzIGNoYW5nZVxuXG5cblx0XHRcdH1cblxuXHRcdFx0JChcImlucHV0W3R5cGU9cmFuZ2VdXCIpLm9uKFwiaW5wdXRcIiwgY2hhbmdlQ29sb3IpO1xuXG5cdFx0XHQvL3doZW4gXCJBZGQgQ29sb3JcIiBpcyBwcmVzc2VkXG5cdFx0XHQkKFwiI2FkZE5ld0NvbG9yXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0XHQgIC8vYXBwZW5kIHRoZSBjb2xvciB0byB0aGUgY29udHJvbHMgdWxcblx0XHRcdCAgdmFyICRuZXdDb2xvciA9ICQoXCI8bGk+PC9saT5cIik7XG5cdFx0XHQgICRuZXdDb2xvci5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsICQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKSk7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgdWxcIikuYXBwZW5kKCRuZXdDb2xvcik7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgbGlcIikuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzIGxpXCIpLmxhc3QoKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICBjb2xvciA9ICQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdCAgLy93aGVuIGFkZGVkLCByZXN0b3JlIHNsaWRlcnMgYW5kIHByZXZpZXcgY29sb3IgdG8gZGVmYXVsdFxuXHRcdFx0ICAkKFwiI2NvbG9yU2VsZWN0XCIpLmhpZGUoKTtcblx0XHRcdFx0dmFyIHIgPSAkKFwiI3JlZFwiKS52YWwoMCk7XG5cdFx0XHRcdHZhciBnID0gJChcIiNncmVlblwiKS52YWwoMCk7XG5cdFx0XHRcdHZhciBiID0gJChcIiNibHVlXCIpLnZhbCgwKTtcblx0XHRcdFx0JChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiKFwiICsgciArIFwiLCBcIiArIGcgKyBcIiwgXCIgKyBiICsgXCIpXCIpO1xuXG5cdFx0XHR9KVxuXG5cdFx0XHQvL09uIG1vdXNlIGV2ZW50cyBvbiB0aGUgY2FudmFzXG5cdFx0XHQkY2FudmFzLm1vdXNlZG93bihmdW5jdGlvbihlKXtcblx0XHRcdCAgbGFzdEV2ZW50ID0gZTtcblx0XHRcdCAgbW91c2VEb3duID0gdHJ1ZTtcblx0XHRcdH0pLm1vdXNlbW92ZShmdW5jdGlvbihlKXtcblx0XHRcdCAgLy9kcmF3IGxpbmVzXG5cdFx0XHQgIGlmIChtb3VzZURvd24pe1xuXHRcdFx0ICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0XHQgICAgY29udGV4dC5tb3ZlVG8obGFzdEV2ZW50Lm9mZnNldFgsbGFzdEV2ZW50Lm9mZnNldFkpO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZVRvKGUub2Zmc2V0WCwgZS5vZmZzZXRZKTtcblx0XHRcdCAgICBjb250ZXh0LnN0cm9rZVN0eWxlID0gY29sb3I7XG5cdFx0XHQgICAgY29udGV4dC5zdHJva2UoKTtcblx0XHRcdCAgICBjb250ZXh0LmxpbmVDYXAgPSAncm91bmQnO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZVdpZHRoID0gMjA7XG5cblx0XHRcdCAgICBsYXN0RXZlbnQgPSBlO1xuXHRcdFx0ICB9XG5cdFx0XHR9KS5tb3VzZXVwKGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgbW91c2VEb3duID0gZmFsc2U7XG5cdFx0XHR9KS5tb3VzZWxlYXZlKGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgJGNhbnZhcy5tb3VzZXVwKCk7XG5cdFx0XHR9KTtcblxuXG5cdFx0fVxuXHR9XG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ0Rlc2lnbkNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cbiAgdmFyIGJ1Y2tldCA9IG5ldyBBV1MuUzMoe3BhcmFtczoge0J1Y2tldDogJ215QnVja2V0J319KTtcbiAgYnVja2V0Lmxpc3RPYmplY3RzKGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzJykuaW5uZXJIVE1MID1cbiAgICAgICAgJ0NvdWxkIG5vdCBsb2FkIG9iamVjdHMgZnJvbSBTMyc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGF0dXMnKS5pbm5lckhUTUwgPVxuICAgICAgICAnTG9hZGVkICcgKyBkYXRhLkNvbnRlbnRzLmxlbmd0aCArICcgaXRlbXMgZnJvbSBTMyc7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEuQ29udGVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29iamVjdHMnKS5pbm5lckhUTUwgKz1cbiAgICAgICAgICAnPGxpPicgKyBkYXRhLkNvbnRlbnRzW2ldLktleSArICc8L2xpPic7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgJHNjb3BlLmhpID0gXCJoaVwiO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rlc2lnblZpZXcnLCB7XG4gICAgICB1cmw6Jy9zb2Nrcy9kZXNpZ24vOmlkJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIHRoZVNvY2s6ICc9J1xuICAgICAgfSxcbiAgICAgIGNvbnRyb2xsZXI6ICdkZXNpZ25WaWV3Q3RybCcsXG4gICAgICB0ZW1wbGF0ZTogJzxkZXNpZ24tdmlldz48L2Rlc2lnbi12aWV3PicsXG4gICAgfSlcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdkZXNpZ25WaWV3Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwKSB7XG5cbiAgJGh0dHAucG9zdCgnL2FwaS91c2VyL21hdGNoSWQnKVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIHJldHVybiAkc2NvcGUuc2hvd1ZpZXcgPSByZXNcbiAgICB9KVxuXG5cdC8vIC8vICRzY29wZS5kZXNjcmlwdGlvbjtcblx0Ly8gJHNjb3BlLnRhZ3M7XG5cdC8vICRzY29wZS50aXRsZTtcblx0Ly8gY29uc29sZS5sb2coJHNjb3BlLmRlc2NyaXB0aW9uKTtcbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGVzaWduJywge1xuICAgICAgdXJsOicvZGVzaWduJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdEZXNpZ25Db250cm9sbGVyJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnPGRlc2lnbi1zb2NrPjwvZGVzaWduLXNvY2s+J1xuICAgIH0pXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkb2NzJywge1xuICAgICAgICB1cmw6ICcvZG9jcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZG9jcy9kb2NzLmh0bWwnXG4gICAgfSk7XG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWJvdXQnLCB7XG4gICAgICAgIHVybDogJy9hYm91dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBYm91dENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Fib3V0L2Fib3V0Lmh0bWwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignQWJvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgRnVsbHN0YWNrUGljcykge1xuXG4gICAgLy8gSW1hZ2VzIG9mIGJlYXV0aWZ1bCBGdWxsc3RhY2sgcGVvcGxlLlxuICAgICRzY29wZS5pbWFnZXMgPSBfLnNodWZmbGUoRnVsbHN0YWNrUGljcyk7XG5cbn0pO1xuXG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcbiAgICAgICAgICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTtcblxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICB2YXIgZ2V0U3Rhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcbiAgICB9O1xuXG59KTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbicsIHtcbiAgICAgICAgdXJsOiAnL2FkbWluJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29udHJvbGxlcignY2FydEN1cnJlbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGN1cnJlbnRDYXJ0KSB7XG4gICRzY29wZS5jdXJyZW50ID0gY3VycmVudENhcnRcbn0pXG5cblxuYXBwLmNvbnRyb2xsZXIoJ2NhcnRIaXN0b3J5JywgZnVuY3Rpb24gKCRzY29wZSwgT3JkZXJGYWN0b3J5LCBjYXJ0SGlzdG9yeSkge1xuXG4gICRzY29wZS5jYXJ0SGlzdG9yeSA9IGNhcnRIaXN0b3J5XG5cbn0pXG4iLCJhcHAuZGlyZWN0aXZlKCdjdXJyZW50Q2FydCcsIGZ1bmN0aW9uICgkc3RhdGUsIE9yZGVyRmFjdG9yeSkge1xuXG4gIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgc2NvcGU6IHt9LFxuICAgICAgdGVtcGxhdGVVcmw6ICdqcy9vcmRlci9jdXJyZW50Lmh0bWwnLFxuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUpIHtcblxuICAgICAgICBzY29wZS51cGRhdGUgPSBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgdmFyIHNvY2sgPSB7XG4gICAgICAgICAgICBxdWFudGl0eTogaXRlbS5uZXdBbW91bnQsXG4gICAgICAgICAgICBpZDogaXRlbS5pZFxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnVwZGF0ZUl0ZW0oc29jaylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbigpe1xuICAgICAgICAgICAgaXRlbS5xdWFudGl0eSA9IGl0ZW0ubmV3QW1vdW50O1xuICAgICAgICAgICAgaXRlbS5uZXdBbW91bnQgPSBudWxsO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzY29wZS5jYWxjVG90YWwoKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5kZWxldGUgPSBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgdmFyIHRvZGVsZXRlID0geyBpdGVtOiBpdGVtIH1cbiAgICAgICAgICBPcmRlckZhY3RvcnkuZGVsZXRlSXRlbSh0b2RlbGV0ZS5pdGVtLmlkKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkgeyByZXR1cm4gc2NvcGUuY2FsY1RvdGFsKCkgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihuZXdUb3RhbCkgeyBzY29wZS50b3RhbCA9IG5ld1RvdGFsIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5zaW5nbGVTb2NrVmlldyA9IGZ1bmN0aW9uKGlkKSB7ICRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSkgfVxuICAgICAgICBzY29wZS50b0NoZWNrb3V0ID0gZnVuY3Rpb24oKSB7ICRzdGF0ZS5nbygnY2hlY2tvdXQnKSB9XG5cbiAgICAgICAgc2NvcGUuY2FsY1RvdGFsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5jYWxjdWxhdGVUb3RhbCgnY3VycmVudCcpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oY2FydFRvdGFsKSB7XG4gICAgICAgICAgICBzY29wZS50b3RhbCA9IGNhcnRUb3RhbFxuICAgICAgICAgICAgcmV0dXJuIGNhcnRUb3RhbFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5jYWxjVG90YWwoKVxuXG4gICAgICAgIHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuICAgICAgICAudGhlbihmdW5jdGlvbihjdXJyZW50KSB7IHNjb3BlLmN1cnJlbnRDYXJ0ID0gY3VycmVudCB9KVxuICAgIH1cbiAgfVxufSlcblxuYXBwLmRpcmVjdGl2ZSgnY2FydEhpc3RvcnknLCBmdW5jdGlvbigkc3RhdGUsIE9yZGVyRmFjdG9yeSkge1xuXG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICBzY29wZToge30sXG4gICAgdGVtcGxhdGVVcmw6ICdqcy9vcmRlci9oaXN0b3J5Lmh0bWwnLFxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICBzY29wZS5jYWxjVG90YWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5jYWxjdWxhdGVUb3RhbCgnaGlzdG9yeScpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGNhcnRUb3RhbCkgeyBzY29wZS50b3RhbFNwZW50ID0gY2FydFRvdGFsIH0pXG4gICAgICB9XG5cbiAgICAgIHNjb3BlLmNhbGNUb3RhbCgpXG4gICAgICAudGhlbihmdW5jdGlvbigpIHsgY29uc29sZS5sb2coc2NvcGUudG90YWxTcGVudCkgfSlcblxuICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnaGlzdG9yeScpXG4gICAgICAudGhlbihmdW5jdGlvbihoaXN0b3J5KSB7IHNjb3BlLmNhcnRIaXN0b3J5ID0gaGlzdG9yeSB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiXG5hcHAuZmFjdG9yeSgnT3JkZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApIHtcbiAgdmFyIGNhY2hlZENhcnQgPSBbXVxuICB2YXIgY2hlY2tDYXJ0ID0gZnVuY3Rpb24ob2JqLCBhcnIpIHtcbiAgICByZXR1cm4gYXJyLm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLnNvY2tJZCB9KS5pbmRleE9mKG9iai5zb2NrSWQpID09PSAtMSA/IGZhbHNlIDogdHJ1ZVxuICB9XG4gIHJldHVybiB7XG4gICAgYWRkVG9DYXJ0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvY3VycmVudCcpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHsgcmV0dXJuIGNoZWNrQ2FydChvYmosIHJlcy5kYXRhKSB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oaW5DYXJ0KSB7XG4gICAgICAgIGlmIChpbkNhcnQpIHtcbiAgICAgICAgICByZXR1cm4gXCJBbHJlYWR5IGluIENhcnQhXCJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9vcmRlci8nLCBvYmopXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7IHJldHVybiByZXMuZGF0YSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gICAgc2hvd0NhcnQ6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIC8vdHlwZSA9ICdjdXJyZW50JyB8fCB0eXBlID0gJ2hpc3RvcnknXG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyLycrdHlwZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKSB7XG4gICAgICAgIGNhY2hlZENhcnQgPSBvcmRlci5kYXRhXG4gICAgICAgIHJldHVybiBjYWNoZWRDYXJ0IHx8IFtdXG4gICAgICB9KVxuICAgIH0sXG4gICAgY2FsY3VsYXRlVG90YWw6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvJyt0eXBlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgY2FjaGVkQ2FydCA9IG9yZGVyLmRhdGFcbiAgICAgICAgcmV0dXJuIGNhY2hlZENhcnQgfHwgW11cbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihjYXJ0KSB7XG4gICAgICAgIGlmICh0eXBlPT09J2N1cnJlbnQnKSB7XG4gICAgICAgICAgcmV0dXJuIGNhcnQucmVkdWNlKGZ1bmN0aW9uKG8sIGl0ZW0pIHtyZXR1cm4gbyArIChcbiAgICAgICAgICAgIGl0ZW0uc29jay5wcmljZSppdGVtLnF1YW50aXR5KX0sIDApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGNhcnQucmVkdWNlKGZ1bmN0aW9uKG8sIG9yZGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbyArIG9yZGVyLml0ZW1zLnJlZHVjZShmdW5jdGlvbihvLCBpdGVtKSB7XG4gICAgICAgICAgICAgIHJldHVybiBvICsgKGl0ZW0uc29jay5wcmljZSppdGVtLnF1YW50aXR5KX0sIDApXG4gICAgICAgICAgfSwgMClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9LFxuICAgIHVwZGF0ZUl0ZW06IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICRodHRwLnB1dCgnL2FwaS9vcmRlcicsIG9iailcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uZGF0YSB9KVxuICAgIH0sXG4gICAgZGVsZXRlSXRlbTogZnVuY3Rpb24oaXRlbUlkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZGVsZXRlKCcvYXBpL29yZGVyLycraXRlbUlkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24odG9SZW1vdmUpIHtcbiAgICAgICAgY2FjaGVkQ2FydC5zcGxpY2UoY2FjaGVkQ2FydC5tYXAoZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5pZCB9KS5pbmRleE9mKGl0ZW1JZCksMSlcbiAgICAgICAgcmV0dXJuIGNhY2hlZENhcnRcbiAgICAgIH0pXG4gICAgfSxcbiAgICBlbnN1cmVDYXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvY3JlYXRlY2FydCcpXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICByZXR1cm4ge2V4aXN0czogb3JkZXIuZGF0YX1cbiAgICAgIH0pXG4gICAgfSxcblxuICB9XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2N1cnJlbnRDYXJ0Jywge1xuICAgIHVybDogJy9jYXJ0L2N1cnJlbnQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL29yZGVyL2NhcnQuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ2NhcnRDdXJyZW50Jyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRjdXJyZW50Q2FydDogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuXHRcdFx0XHRyZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdjdXJyZW50Jylcblx0XHRcdH1cblx0XHR9XG4gIH0pXG5cbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnRIaXN0b3J5Jywge1xuICAgIHVybDogJy9jYXJ0L2hpc3RvcnknLFxuICAgIHRlbXBsYXRlVXJsOiAnL2pzL29yZGVyL3Bhc3QuaHRtbCcsXG4gICAgY29udHJvbGxlcjogJ2NhcnRIaXN0b3J5JyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBjYXJ0SGlzdG9yeTogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdoaXN0b3J5Jyk7XG4gICAgICB9XG4gICAgfVxuICB9KVxuXG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ1BlcnNvbmFsSW5mb0N0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlLCB0aGVVc2VyLCBQZXJzb25hbEluZm9GYWN0b3J5KSB7XG5cblx0JHNjb3BlLnVzZXJJZCA9IHRoZVVzZXIuaWQ7XG5cdCRzY29wZS5hZGRyZXNzMSA9IHRoZVVzZXIuYWRkcmVzczE7XG5cdCRzY29wZS5hZGRyZXNzMiA9IHRoZVVzZXIuYWRkcmVzczI7XG5cdCRzY29wZS56aXAgPSB0aGVVc2VyLnppcDtcblx0JHNjb3BlLnN0YXRlID0gdGhlVXNlci5zdGF0ZTtcblx0JHNjb3BlLmNvdW50cnkgPSB0aGVVc2VyLmNvdW50cnk7XG5cdCRzY29wZS5waG9uZSA9IHRoZVVzZXIucGhvbmU7XG5cdCRzY29wZS5kaXNwbGF5RXJyb3IgPSBmYWxzZTtcblxuXHQvL29ubHkgYSB0ZW1wb3Jhcnkgc29sdXRpb24gLS0gY2hlY2tzIHRvIHNlZSBpZiB1c2VyIGlzIGEgbmV3IHVzZXIgYnkgc2VlaW5nIGlmIHRoZXkncmUgbG9nZ2VkIGluXG5cblx0Ly8gJHNjb3BlLmN1cnJlbnRVc2VySXNOZXcgPSBmdW5jdGlvbigpIHtcbiAvLyAgIFx0XHQgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpXG4gLy8gICBcdFx0LnRoZW4oZnVuY3Rpb24odXNlcil7XG4gLy8gICAgXHRcdGlmICghdXNlcikgcmV0dXJuICRzY29wZS5uZXdVc2VyID0gdHJ1ZTtcbiAvLyAgXHRcdFx0ZWxzZSByZXR1cm4gJHNjb3BlLm5ld1VzZXIgPSBmYWxzZTtcbiAvLyAgICBcdH0pXG4gLy8gXHR9XG5cbiAvLyBcdCRzY29wZS5jdXJyZW50VXNlcklzTmV3KCk7XG5cbiBcdGNvbnNvbGUubG9nKFwiaGVlZWVlZWVleVwiKTtcblxuXHQkc2NvcGUuc3VibWl0UGVyc29uYWwgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRpZiAoKCRzY29wZS5jb3VudHJ5ID09PSBcIlVuaXRlZCBTdGF0ZXNcIiB8fCAkc2NvcGUuY291bnRyeSA9PT0gXCJDYW5hZGFcIikgJiYgJHNjb3BlLnN0YXRlID09PSBcIlwiKSB7XG5cdFx0XHQkc2NvcGUuZGlzcGxheUVycm9yID0gdHJ1ZTtcblx0XHRcdHJldHVybiAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJJZiBpbiBVUyBvciBDYW5hZGEsIG11c3QgaW5jbHVkZSBTdGF0ZS9Qcm92aW5jZVwiO1xuXHRcdH1cblxuXHRcdHZhciB1c2VySW5mbyA9IHtcblx0XHRcdGFkZHJlc3MxIDogJHNjb3BlLmFkZHJlc3MxLFxuXHRcdFx0YWRkcmVzczIgOiAkc2NvcGUuYWRkcmVzczIsXG5cdFx0XHR6aXAgOiAkc2NvcGUuemlwLFxuXHRcdFx0c3RhdGUgOiAkc2NvcGUuc3RhdGUsXG5cdFx0XHRjb3VudHJ5IDogJHNjb3BlLmNvdW50cnksXG5cdFx0XHRwaG9uZSA6ICRzY29wZS5waG9uZVxuXHRcdH1cblxuXHRcdHJldHVybiBQZXJzb25hbEluZm9GYWN0b3J5LnN1Ym1pdCgkc2NvcGUudXNlcklkLCB1c2VySW5mbylcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHQvLyBpZiAoJHNjb3BlLm5ld1VzZXIpIFxuXHRcdFx0cmV0dXJuICRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdFx0Ly8gZWxzZSByZXR1cm4gJHN0YXRlLmdvKCd1c2VyJywge3VzZXJJZDogJHNjb3BlLnVzZXJJZH0pO1xuXHRcdH0pXG5cdH1cblxufSk7IiwiYXBwLmZhY3RvcnkoJ1BlcnNvbmFsSW5mb0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAvLyBQZXJzb25hbEZhY3RvcnkgPSB7fTtcblxuICByZXR1cm4ge1xuICAgIHN1Ym1pdCA6IGZ1bmN0aW9uKGlkLCB1c2VySW5mbyl7XG4gICAgICByZXR1cm4gJGh0dHAucHV0KCcvYXBpL3VzZXIvJyArIGlkLCB1c2VySW5mbylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncGVyc29uYWwnLCB7XG5cdFx0dXJsOiAnL3BlcnNvbmFsLzppZCcsXG5cdFx0Y29udHJvbGxlcjogJ1BlcnNvbmFsSW5mb0N0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3BlcnNvbmFsaW5mby9wZXJzb25hbGluZm8udmlldy5odG1sJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR0aGVVc2VyOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBVc2VyRmFjdG9yeSl7XG5cdFx0XHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLmlkKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufSk7IiwiYXBwLmZhY3RvcnkoJ1Jldmlld0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICByZXR1cm4ge1xuICAgIHBvc3RSZXZpZXc6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvcmV2aWV3LycsIG9iailcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcbiAgICBwcm9kdWN0UmV2aWV3czogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Jldmlldy9zb2NrLycrc29ja0lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxufSlcbiIsImFwcC5mYWN0b3J5KCdTb2NrRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBzaW5nbGVTb2NrOiBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay8nK3NvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIHNvY2tCeVVzZXJJZDogZnVuY3Rpb24odXNlcklkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svYnlVc2VyLycgKyB1c2VySWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBtb3N0UmVjZW50U29ja3M6IGZ1bmN0aW9uICgpIHtcbiAgICBcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay9yZWNlbnQnKVxuICAgIFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgXHRcdHJldHVybiByZXMuZGF0YVxuICAgIFx0fSlcbiAgICB9LFxuXG4gICAgc2F2ZURlc2lnbjogZnVuY3Rpb24gKG5ld1NvY2tEYXRhT2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9zb2NrLycsIG5ld1NvY2tEYXRhT2JqKVxuICAgIH0sXG5cbiAgICBwcmVwYXJlVGFnczogZnVuY3Rpb24gKHRhZ0lucHV0KSB7XG4gICAgICByZXR1cm4gdGFnSW5wdXQuc3BsaXQoJyAnKS5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICBlID0gZS5yZXBsYWNlKC8sL2ksIFwiXCIpO1xuICAgICAgICBlID0gZS5zdWJzdHJpbmcoMSk7XG4gICAgICAgIHJldHVybiBlXG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgdXB2b3RlOiBmdW5jdGlvbiAoc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9zb2NrL3Vwdm90ZScsIHtpZDogc29ja0lkfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXMuZGF0YSlcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgfSlcbiAgICB9LFxuXG4gICAgZG93bnZvdGU6IGZ1bmN0aW9uIChzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svZG93bnZvdGUnLCB7aWQ6IHNvY2tJZH0pXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgfSlcbiAgICB9LFxuXG4gICAgZ2V0VW5zaWduZWRVUkw6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay91bnNpZ25lZFVSTCcpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBkZWxldGU6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay9kZWxldGUvJyArIGlkKVxuICAgICAgLnRoZW4oJHN0YXRlLmdvKCdob21lJykpXG4gICAgfVxuXG4gIH1cblxufSlcbiIsIi8vIGFwcC5jb250cm9sbGVyKCdzb2NrVmlld0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBTb2NrRmFjdG9yeSwgUmV2aWV3RmFjdG9yeSkge1xuXG4vLyAgICRzY29wZS5zZXRTb2NrID0gZnVuY3Rpb24oc29ja0lkKSB7XG4vLyAgICAgcmV0dXJuIFNvY2tGYWN0b3J5LnNpbmdsZVNvY2soc29ja0lkKSAvLyByZXR1cm4/XG4vLyAgICAgLnRoZW4oZnVuY3Rpb24oc29jaykge1xuLy8gICAgICAgJHNjb3BlLnNvY2sgPSBzb2NrXG4vLyAgICAgfSlcbi8vICAgfVxuXG4vLyAgICRzY29wZS5zZXRSZXZpZXdzID0gZnVuY3Rpb24oc29ja0lkKSB7XG4vLyAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucHJvZHVjdFJldmlld3Moc29ja0lkKVxuLy8gICAgIC50aGVuKGZ1bmN0aW9uKHJldmlld3MpIHtcbi8vICAgICAgICRzY29wZS5yZXZpZXdzID0gcmV2aWV3c1xuLy8gICAgIH0pXG4vLyAgIH1cblxuLy8gICAkc2NvcGUuc2V0U29jaygxKTtcbi8vICAgJHNjb3BlLnNldFJldmlld3MoMSk7XG5cbi8vICAgJHNjb3BlLm5ld1JldmlldyA9IGZ1bmN0aW9uKCkge1xuLy8gICAgIHZhciBuZXdSZXZpZXcgPSB7XG4vLyAgICAgICB0ZXh0OiAkc2NvcGUucmV2aWV3VGV4dCxcbi8vICAgICAgIHNvY2tJZDogJHNjb3BlLnNvY2suaWRcbi8vICAgICB9XG4vLyAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucG9zdFJldmlldyhuZXdSZXZpZXcpXG4vLyAgICAgLnRoZW4oZnVuY3Rpb24obmV3UmV2aWV3KXtcbi8vICAgICAgIHZhciByZXZpZXcgPSB7fTtcbi8vICAgICAgIHJldmlldy51c2VyID0ge307XG5cbi8vICAgICAgICAgcmV2aWV3LnVzZXIuZmlyc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmZpcnN0X25hbWU7XG4vLyAgICAgICAgIHJldmlldy51c2VyLmxhc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmxhc3RfbmFtZTtcbi8vICAgICAgICAgcmV2aWV3LnVzZXIucHJvZmlsZV9waWMgPSBuZXdSZXZpZXcudXNlci5wcm9maWxlX3BpYztcbi8vICAgICAgICAgcmV2aWV3LnVzZXIudXNlcm5hbWUgPSBuZXdSZXZpZXcudXNlci51c2VybmFtZTtcbi8vICAgICAgICAgcmV2aWV3LnRleHQgPSBuZXdSZXZpZXcucmV2aWV3LnRleHQ7XG5cbi8vICAgICAgICRzY29wZS5yZXZpZXdzLnB1c2gocmV2aWV3KTtcbi8vICAgICAgICRzY29wZS5yZXZpZXdUZXh0ID0gbnVsbDtcbi8vICAgICB9KVxuLy8gICB9XG5cbi8vICAgJHNjb3BlLmFscmVhZHlQb3N0ZWQgPSBmdW5jdGlvbigpIHtcbi8vICAgICAvLyBhZGQgaW4gYWZ0ZXIgZmluaXNoaW5nIG90aGVyIHN0dWZmXG4vLyAgIH1cblxuLy8gfSk7XG5cbi8vIGFwcC5jb250cm9sbGVyKCdzb2NrSWRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMsIHRoZVNvY2ssIHRoZVJldmlld3MsIFJldmlld0ZhY3RvcnksIE9yZGVyRmFjdG9yeSwgQXV0aFNlcnZpY2UpIHtcblxuLy8gICAvLyAkc2NvcGUuZGF0ZVBhcnNlciA9IGZ1bmN0aW9uKGRhdGUpe1xuXG4vLyAgIC8vICAgLy9yZXR1cm4gdG8gdGhpcyBsYXRlci4gV291bGQgYmUgZ29vZCBpZiBzb2NrcyBhbmQgcmV2aWV3cyBzdGF0ZWQgd2hlbiB0aGV5IHdlcmUgcG9zdGVkXG5cbiAgLy8gICAvL3Nob3VsZCBhZGQgaXQgdG8gYSBmYWN0b3J5LCBiZWNhdXNlIG1hbnkgcGFnZXMgY2FuIG1ha2UgdXNlIG9mIGl0XG5cbiAgLy8gICB2YXIgbW9udGhPYmogPSB7XG4gIC8vICAgICAnMDEnOiBcIkphbnVhcnlcIixcbiAgLy8gICAgICcwMic6IFwiRmVicnVhcnlcIixcbiAgLy8gICAgICcwMyc6IFwiTWFyY2hcIixcbiAgLy8gICAgICcwNCc6IFwiQXByaWxcIixcbiAgLy8gICAgICcwNSc6IFwiTWF5XCIsXG4gIC8vICAgICAnMDYnOiBcIkp1bmVcIixcbiAgLy8gICAgICcwNyc6IFwiSnVseVwiLFxuICAvLyAgICAgJzA4JzogXCJBdWd1c3RcIixcbiAgLy8gICAgICcwOSc6IFwiU2VwdGVtYmVyXCIsXG4gIC8vICAgICAnMTAnOiBcIk9jdG9iZXJcIixcbiAgLy8gICAgICcxMSc6IFwiTm92ZW1iZXJcIixcbiAgLy8gICAgICcxMic6IFwiRGVjZW1iZXJcIlxuICAvLyAgIH1cblxuICAvLyB9XG5cbmFwcC5jb250cm9sbGVyKCdzb2NrSWRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBBdXRoU2VydmljZSwgJHN0YXRlUGFyYW1zLCB0aGVTb2NrLCB0aGVSZXZpZXdzLCBSZXZpZXdGYWN0b3J5LCBPcmRlckZhY3RvcnksIFNvY2tGYWN0b3J5LCBVc2VyRmFjdG9yeSkge1xuXG5cblxuICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IGZhbHNlO1xuICAkc2NvcGUuc29jayA9IHRoZVNvY2s7XG4gICRzY29wZS5yZXZpZXdzID0gdGhlUmV2aWV3cztcblxuICAkc2NvcGUuYWxlcnQgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICRzY29wZS5hbGVydGluZyA9ICEkc2NvcGUuYWxlcnRpbmc7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICRzY29wZS5hbGVydGluZyA9ICEkc2NvcGUuYWxlcnRpbmdcbiAgICAgICRzY29wZS4kZGlnZXN0KClcbiAgICB9LCAzMDAwKVxuICAgIC8vIGlmICghJHNjb3BlLmFsZXJ0aW5nKSAkc2NvcGUubWVzc2FnZSA9PT0gbnVsbFxuICB9XG5cbiAgJHNjb3BlLmdvVG9Vc2VyUGFnZSA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICRzdGF0ZS5nbygndXNlcicsIHt1c2VySWQ6IHVzZXJJZH0pO1xuICB9XG5cbiAgJHNjb3BlLmFkZEl0ZW0gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbSA9IHt9O1xuICAgIGl0ZW0uc29ja0lkID0gJHNjb3BlLnNvY2suaWQ7XG4gICAgaXRlbS5xdWFudGl0eSA9ICskc2NvcGUucXVhbnRpdHk7XG4gICAgaXRlbS5vcmlnaW5hbFByaWNlID0gKyRzY29wZS5zb2NrLnByaWNlO1xuICAgIGlmIChpdGVtLnF1YW50aXR5ID4gMCkge1xuICAgICAgT3JkZXJGYWN0b3J5LmFkZFRvQ2FydChpdGVtKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXNwb25zZSAhPT0gXCJvYmplY3RcIikgJHNjb3BlLmFsZXJ0KHJlc3BvbnNlKTtcbiAgICAgICAgZWxzZSAkc3RhdGUuZ28oJ2N1cnJlbnRDYXJ0Jyk7XG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlICRzY29wZS5hbGVydCgnWW91IGhhdmUgdG8gYWRkIGF0IGxlYXN0IG9uZSBzb2NrIScpO1xuICB9XG5cbiAgJHNjb3BlLmRpc3BsYXlUYWdzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICRzY29wZS5zb2NrLnRhZ3MubWFwKGZ1bmN0aW9uKHRhZyl7XG4gICAgICByZXR1cm4gJyMnICsgdGFnO1xuICAgIH0pLmpvaW4oXCIsIFwiKTtcbiAgfVxuXG4gICRzY29wZS5kaXNwbGF5VGFncygpO1xuXG4gICRzY29wZS5nZXRMb2dnZWRJblVzZXJJZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKVxuICAgIC50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgY29uc29sZS5sb2codXNlcik7XG4gICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgJHNjb3BlLmxvZ2dlZEluVXNlcklkID0gJ25vbmUnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmxvZ2dlZEluVXNlcklkID0gdXNlci5pZDtcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgJHNjb3BlLmdldExvZ2dlZEluVXNlcklkKCk7XG5cbiAgJHNjb3BlLnVzZXJDYW5ub3RQb3N0UmV2aWV3ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZDtcbiAgfVxuXG4gICRzY29wZS51c2VyQ2Fubm90UG9zdFJldmlldygpO1xuXG4gICRzY29wZS5uZXdSZXZpZXcgPSBmdW5jdGlvbigpIHtcblxuICAvL2lmIHVzZXIgaGFzIGFscmVhZHkgcmV2aWV3IHNvY2ssIGRvbid0IGFsbG93IHVzZXIgdG8gcmV2aWV3IGl0IGFnYWluXG4gICAgdmFyIHVzZXJzV2hvUmV2aWV3ZWRTb2NrID0gJHNjb3BlLnJldmlld3MubWFwKGZ1bmN0aW9uKHJldmlldyl7XG4gICAgICByZXR1cm4gcmV2aWV3LnVzZXJJZDtcbiAgICB9KVxuXG4gICAgaWYgKCRzY29wZS5sb2dnZWRJblVzZXJJZCA9PT0gJ25vbmUnKSB7XG4gICAgICAkc2NvcGUucmV2aWV3RXJyb3JNZXNzYWdlID0gXCJZb3UgbXVzdCBiZSBsb2dnZWQgaW4gdG8gcmV2aWV3IGEgc29jayFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHVzZXJzV2hvUmV2aWV3ZWRTb2NrLmluZGV4T2YoJHNjb3BlLmxvZ2dlZEluVXNlcklkKSAhPT0gLTEpIHtcbiAgICAgICRzY29wZS5yZXZpZXdFcnJvck1lc3NhZ2UgPSBcIllvdSd2ZSBhbHJlYWR5IHJldmlld2VkIHRoaXMgc29jayEgWW91IGNhbid0IHJldmlldyBpdCBhZ2FpbiFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgLy9pZiBzb2NrIGlkIG1hdGNoZXMgdXNlciBpZCwgdXNlciBkb24ndCBhbGxvdyB1c2VyIHRvIHBvc3QgYSByZXZpZXdcbiAgICB9IGVsc2UgaWYgKCRzY29wZS5sb2dnZWRJblVzZXJJZCA9PT0gJHNjb3BlLnNvY2sudXNlci5pZCkge1xuICAgICAgJHNjb3BlLnJldmlld0Vycm9yTWVzc2FnZSA9IFwiWW91IGNhbid0IHJldmlldyB5b3VyIG93biBzb2NrIVwiO1xuICAgICAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIHZhciBuZXdSZXZpZXcgPSB7XG4gICAgICAgIHRleHQ6ICRzY29wZS5yZXZpZXdUZXh0LFxuICAgICAgICBzb2NrSWQ6ICRzY29wZS5zb2NrLmlkXG4gICAgICB9XG4gICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wb3N0UmV2aWV3KG5ld1JldmlldylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG5ld1Jldmlldyl7XG4gICAgICAgIHZhciByZXZpZXcgPSB7fTtcbiAgICAgICAgcmV2aWV3LnVzZXIgPSB7fTtcblxuICAgICAgICAgIHJldmlldy51c2VyLmZpcnN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5maXJzdF9uYW1lO1xuICAgICAgICAgIHJldmlldy51c2VyLmxhc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmxhc3RfbmFtZTtcbiAgICAgICAgICByZXZpZXcudXNlci5wcm9maWxlX3BpYyA9IG5ld1Jldmlldy51c2VyLnByb2ZpbGVfcGljO1xuICAgICAgICAgIHJldmlldy51c2VyLnVzZXJuYW1lID0gbmV3UmV2aWV3LnVzZXIudXNlcm5hbWU7XG4gICAgICAgICAgcmV2aWV3LnRleHQgPSBuZXdSZXZpZXcucmV2aWV3LnRleHQ7XG5cbiAgICAgICAgJHNjb3BlLnJldmlld3MucHVzaChyZXZpZXcpO1xuICAgICAgICAkc2NvcGUucmV2aWV3VGV4dCA9IG51bGw7XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gICRzY29wZS51cHZvdGUgPSBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICByZXR1cm4gU29ja0ZhY3RvcnkudXB2b3RlKHNvY2tJZClcbiAgICAudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAkc2NvcGUuc29jay51cHZvdGVzKytcbiAgICB9KVxuICB9XG4gIFxuICAkc2NvcGUuZG93bnZvdGUgPSBmdW5jdGlvbiAoc29ja0lkKSB7XG4gICAgcmV0dXJuIFNvY2tGYWN0b3J5LmRvd252b3RlKHNvY2tJZClcbiAgICAudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAkc2NvcGUuc29jay5kb3dudm90ZXMrK1xuICAgIH0pXG4gIH1cblxuICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiB1c2VyLmlkID09ICRzY29wZS5zb2NrLlVzZXJJZCB8fCB1c2VyLmlzQWRtaW4/IHRydWUgOiBmYWxzZVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgJHNjb3BlLnZlcmlmeVVzZXIgPSByZXN1bHRcbiAgICB9KTtcblxuICAkc2NvcGUuZGVsZXRlID0gU29ja0ZhY3RvcnkuZGVsZXRlXG5cbn0pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgLy8gJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NvY2tzJywge1xuICAgIC8vICAgICB1cmw6ICcvc29ja3MnLFxuICAgIC8vICAgICBjb250cm9sbGVyOiAnc29ja1ZpZXdDb250cm9sbGVyJyxcbiAgICAvLyAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0dmlldy9wcm9kdWN0dmlldy5odG1sJ1xuICAgIC8vIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpbmdsZVNvY2tWaWV3Jywge1xuICAgICAgdXJsOicvc29ja3MvOmlkJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdzb2NrSWRDb250cm9sbGVyJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuaHRtbCcsXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIHRoZVNvY2s6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFNvY2tGYWN0b3J5KSB7XG4gICAgICAgICAgcmV0dXJuIFNvY2tGYWN0b3J5LnNpbmdsZVNvY2soJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICB9LFxuICAgICAgICB0aGVSZXZpZXdzOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBSZXZpZXdGYWN0b3J5KSB7XG4gICAgICAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucHJvZHVjdFJldmlld3MoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2VhcmNoUmVzdWx0cycsIHtcblx0XHR1cmw6ICcvc2VhcmNoLzpzZWFyY2hUZXJtcycsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvc2VhcmNocmVzdWx0cy9zZWFyY2gudmlldy5odG1sJyxcblx0XHRjb250cm9sbGVyOiBcInNlYXJjaEN0cmxcIixcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRhbGxSZXN1bHRzOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBTZWFyY2hGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBTZWFyY2hGYWN0b3J5LmZpbmRCeVNlYXJjaFRleHQoJHN0YXRlUGFyYW1zLnNlYXJjaFRlcm1zKVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgYWxsUmVzdWx0cykge1xuXHRcdC8vIFx0JHNjb3BlLnJlc3VsdHMgPSBhbGxSZXN1bHRzO1xuXHRcdC8vIFx0Y29uc29sZS5sb2coXCJBbGwgUmVzdWx0cyEhXCIsIGFsbFJlc3VsdHMpO1xuXHRcdC8vIFx0JHNjb3BlLm51bWJlciA9IDEyMztcblx0XHQvLyB9XG5cdFx0Ly8gY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhcIkhFUkVFRUVFXCIsICRzdGF0ZVBhcmFtcy5yZXN1bHRzKVxuXHRcdC8vIFx0JHNjb3BlLnJlc3VsdHMgPSAkc3RhdGVQYXJhbXMucmVzdWx0c1xuXHRcdC8vIH1cblx0fSlcbn0pXG4iLCJhcHAuY29udHJvbGxlcignU2lnbnVwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIFNpZ251cEZhY3RvcnksICRzdGF0ZSkge1xuXG4gIGZ1bmN0aW9uIHBhc3N3b3JkVmFsaWQgKHBhc3N3b3JkKSB7XG4gICAgaWYgKHBhc3N3b3JkLmxlbmd0aCA8IDYpIHtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiUGFzc3dvcmQgbXVzdCBiZSA2IGNoYXJhY3RlcnMgbG9uZyFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHBhc3N3b3JkICE9PSAkc2NvcGUucHcyKSB7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlRoZSBwYXNzd29yZCBmaWVsZHMgZG9uJ3QgbWF0Y2ghXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmICgvXFxXLy50ZXN0KHBhc3N3b3JkKSl7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlBhc3N3b3JkIGNhbm5vdCBjb250YWluIHNwZWNpYWwgY2hhcmFjdGVycyFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLnNob3dFcnJvciA9IGZhbHNlO1xuXG4gICRzY29wZS5kaXNwbGF5RXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJHNjb3BlLnNob3dFcnJvcjtcbiAgfVxuXG4gICRzY29wZS5zdWJtaXRTaWdudXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHBhc3N3b3JkVmFsaWQoJHNjb3BlLnBhc3N3b3JkKSl7XG4gICAgICBjb25zb2xlLmxvZyhcIm5vdyBJIGRvbid0IHdvcmshXCIpO1xuICAgICAgcmV0dXJuIFNpZ251cEZhY3Rvcnkuc3VibWl0KHtcbiAgICAgICBlbWFpbDogJHNjb3BlLmVtYWlsLFxuICAgICAgIHVzZXJuYW1lOiAkc2NvcGUudXNlcm5hbWUsXG4gICAgICAgcGFzc3dvcmQ6ICRzY29wZS5wYXNzd29yZCxcbiAgICAgICBmaXJzdF9uYW1lOiAkc2NvcGUuZmlyc3RuYW1lLFxuICAgICAgIGxhc3RfbmFtZTogJHNjb3BlLmxhc3RuYW1lLFxuICAgICAgIGlzQWRtaW46IGZhbHNlLFxuICAgICAgIG5ld1VzZXI6IHRydWVcbiAgICAgfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQU0gSSBXSEFUIFlPVSBUSElOSyBJIEFNP1wiLCByZXNwb25zZSlcbiAgICAgICAgcmV0dXJuICRzdGF0ZS5nbygncGVyc29uYWwnLCB7aWQ6IHJlc3BvbnNlLmlkfSk7XG4gICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbn0pO1xuIiwiLy8gYXBwLmZhY3RvcnkoJ1NpZ251cEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuLy8gICB2YXIgU2lnbnVwRmFjdG9yeSA9IHt9O1xuXG4vLyAgIFNpZ251cEZhY3Rvcnkuc3VibWl0ID0gZnVuY3Rpb24odXNlckluZm8pe1xuLy8gICBcdGNvbnNvbGUubG9nKHVzZXJJbmZvKTtcbi8vICAgXHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2VyLycsIHVzZXJJbmZvKVxuLy8gICBcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbi8vICAgXHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuLy8gICBcdH0pXG4vLyAgIH1cblxuLy8gICByZXR1cm4gU2lnbnVwRmFjdG9yeTtcblxuLy8gfSlcblxuYXBwLmZhY3RvcnkoJ1NpZ251cEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0dmFyIFNpZ251cEZhY3RvcnkgPSB7fTtcblxuXHRTaWdudXBGYWN0b3J5LnN1Ym1pdCA9IGZ1bmN0aW9uICh1c2VySW5mbykge1xuXHRcdGNvbnNvbGUubG9nKFwiRnJvbSBTaWdudXAgRmFjdG9yeVwiLCB1c2VySW5mbyk7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci8nLCB1c2VySW5mbylcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuXHR9XG5cdHJldHVybiBTaWdudXBGYWN0b3J5O1xufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0Y29udHJvbGxlcjogJ1NpZ251cEN0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3NpZ251cC9zaWdudXAudmlldy5odG1sJ1xuXHR9KTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0bW9zdFJlY2VudFNvY2tzOiBmdW5jdGlvbiAoU29ja0ZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBTb2NrRmFjdG9yeS5tb3N0UmVjZW50U29ja3MoKVxuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdob21lQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIG1vc3RSZWNlbnRTb2NrcywgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcblxuICAkc2NvcGUubW9zdFJlY2VudFNvY2tzID0gbW9zdFJlY2VudFNvY2tzXG4gICRzY29wZS5zZWVTb2NrID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgJHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KVxuICB9XG59KSIsImFwcC5jb250cm9sbGVyKCdVc2VyQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgdGhlVXNlciwgdGhlVXNlclNvY2tzLCBBdXRoU2VydmljZSwgVXNlckZhY3RvcnkpIHtcbiAgICBjb25zb2xlLmxvZyhcImNvbnRyb2xsZXJcIiwgdGhlVXNlclNvY2tzKTtcblx0JHNjb3BlLnVzZXIgPSB0aGVVc2VyO1xuXHQkc2NvcGUuc29ja3MgPSB0aGVVc2VyU29ja3M7XG5cblx0JHNjb3BlLnRvU2hpcHBpbmdJbmZvID0gZnVuY3Rpb24oaWQpe1xuXHRcdCRzdGF0ZS5nbygncGVyc29uYWwnLCB7aWQ6IGlkfSk7XG5cdH07XG5cblx0JHNjb3BlLnRvU29ja1ZpZXcgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHQkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG5cdH07XG5cblx0QXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gdXNlci5pZCA9PSAkc2NvcGUudXNlci5pZCB8fCB1c2VyLmlzQWRtaW4gPyB0cnVlIDogZmFsc2VcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICBcdCRzY29wZS52ZXJpZnlVc2VyID0gcmVzdWx0XG4gICAgfSk7XG5cblx0QXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gdXNlci5pc0FkbWluID8gdHJ1ZSA6IGZhbHNlXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgXHQkc2NvcGUuaXNBZG1pbiA9IHJlc3VsdFxuICAgIH0pO1xuXG4gICAgaWYgKCRzY29wZS51c2VyLmlzQWRtaW4pICRzY29wZS5hZG1pbkJ1dHRvbiA9IFwiTWFrZSBOb24tQWRtaW5cIlxuICAgIGlmICghJHNjb3BlLnVzZXIuaXNBZG1pbikgJHNjb3BlLmFkbWluQnV0dG9uID0gXCJNYWtlIEFkbWluXCJcblxuICAgICRzY29wZS5kZWxldGUgPSBVc2VyRmFjdG9yeS5kZWxldGU7XG4gICAgXG4gICAgJHNjb3BlLm1ha2VBZG1pbiA9IGZ1bmN0aW9uIChpZCkge1xuICAgIFx0cmV0dXJuIFVzZXJGYWN0b3J5Lm1ha2VBZG1pbihpZClcbiAgICBcdC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICBcdFx0aWYgKCRzY29wZS51c2VyLmlzQWRtaW4pIHtcbiAgICBcdFx0XHQkc2NvcGUudXNlci5pc0FkbWluID0gZmFsc2VcbiAgICBcdFx0XHQkc2NvcGUuYWRtaW5CdXR0b24gPSBcIk1ha2UgQWRtaW5cIlxuICAgIFx0XHR9XG4gICAgXHRcdGVsc2UgaWYgKCEkc2NvcGUudXNlci5pc0FkbWluKSB7XG4gICAgXHRcdFx0JHNjb3BlLnVzZXIuaXNBZG1pbiA9IHRydWVcbiAgICBcdFx0XHQkc2NvcGUuYWRtaW5CdXR0b24gPSBcIk1ha2UgTm9uLUFkbWluXCJcbiAgICBcdFx0fVxuICAgIFx0fSk7XG4gICAgfVxufSlcbiIsImFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlKSB7XG5cdHZhciBVc2VyRmFjdG9yeSA9IHt9O1xuXG5cdFVzZXJGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlci8nICsgaWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImZhY3RvcnlcIiwgcmVzcG9uc2UuZGF0YSlcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhXG5cdFx0fSlcblx0fVxuXG5cdFVzZXJGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlcnMnKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGFcblx0XHR9KVxuXHR9XG5cblx0VXNlckZhY3RvcnkuZGVsZXRlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci9kZWxldGUvJyArIGlkKVxuXHRcdC50aGVuKCRzdGF0ZS5nbygnaG9tZScpKVxuXHR9XG5cblx0VXNlckZhY3RvcnkubWFrZUFkbWluID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0cmV0dXJuICRodHRwLnB1dCgnL2FwaS91c2VyL21ha2VBZG1pbi8nICsgaWQpXG5cdH1cblxuXHRyZXR1cm4gVXNlckZhY3Rvcnk7XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VzZXInLCB7XG5cdFx0dXJsOiAnL3VzZXIvOnVzZXJJZCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvdXNlci91c2VyLXByb2ZpbGUuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1VzZXJDdHJsJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR0aGVVc2VyOiBmdW5jdGlvbiAoVXNlckZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuXHRcdFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy51c2VySWQpO1xuXHRcdFx0fSxcblx0XHRcdHRoZVVzZXJTb2NrczogZnVuY3Rpb24gKFNvY2tGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0cmV0dXJuIFNvY2tGYWN0b3J5LnNvY2tCeVVzZXJJZCgkc3RhdGVQYXJhbXMudXNlcklkKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pXG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ25hdmJhckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIFNlYXJjaEZhY3RvcnksIE9yZGVyRmFjdG9yeSkge1xuXG5cdCRzY29wZS5zZWFyY2ggPSBmdW5jdGlvbihzZWFyY2hUZXJtcyl7XG5cdFx0Ly8gU2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0KHNlYXJjaFRlcm1zKVxuXHRcdC8vIC50aGVuKGZ1bmN0aW9uKHJlc3VsdHMpe1xuXHRcdC8vIFx0JHNjb3BlLnJlc3VsdHMgPSByZXN1bHRzO1xuXHRcdC8vIFx0Y29uc29sZS5sb2cocmVzdWx0cyk7XG5cdFx0XHRyZXR1cm4gJHN0YXRlLmdvKCdzZWFyY2hSZXN1bHRzJywge3NlYXJjaFRlcm1zOiBzZWFyY2hUZXJtc30pO1xuXHRcdC8vIH0pXG5cdH1cblxuXHRyZXR1cm4gT3JkZXJGYWN0b3J5LmVuc3VyZUNhcnQoKVxuXG59KVxuXG5hcHAuY29udHJvbGxlcignc2VhcmNoQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgYWxsUmVzdWx0cywgJHN0YXRlUGFyYW1zKSB7XG5cdCRzY29wZS5yZXN1bHRzID0gYWxsUmVzdWx0cztcblx0JHNjb3BlLnNlZVNvY2sgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHQkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG5cdH1cbn0pXG4iLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZmFjdG9yeShcIlNlYXJjaEZhY3RvcnlcIiwgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBTZWFyY2hGYWN0b3J5ID0ge307XG5cblx0U2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0ID0gZnVuY3Rpb24gKHRleHQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NlYXJjaC8/cT0nICsgdGV4dClcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHRzKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0cy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gU2VhcmNoRmFjdG9yeTtcbn0pIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSwgT3JkZXJGYWN0b3J5KSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIE9yZGVyRmFjdG9yeS5lbnN1cmVDYXJ0KClcblxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ015IFByb2ZpbGUnLCBzdGF0ZTogJ3VzZXIoe3VzZXJJZDp1c2VyLmlkfSknLCBhdXRoOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgLy8geyBsYWJlbDogJ0Fib3V0Jywgc3RhdGU6ICdhYm91dCcgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnRGVzaWduIGEgU29jaycsIHN0YXRlOiAnZGVzaWduVmlldycgfSxcbiAgICAgICAgICAgICAgICAvLyB7IGxhYmVsOiAnQWRtaW4gRGFzaGJvYXJkJywgc3RhdGU6ICdhZG1pbid9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS5hZG1pbkl0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHtsYWJlbDogJ0FkbWluIERhc2hib2FyZCcsIHN0YXRlOiAnYWRtaW4nfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKClcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ29hdXRoQnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICBwcm92aWRlck5hbWU6ICdAJ1xuICAgIH0sXG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uaHRtbCdcbiAgfVxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
