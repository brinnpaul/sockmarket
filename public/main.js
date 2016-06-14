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

  // See the Configuring section to configure credentials in the SDK
  AWS.config.update = { accessKey: 'AKIAIIE4D3RS5VQRJ23Q', secretAccessKey: 'iJ/1kQCPxXlR6GxWZLoedHHARQsyHwUkJlVa4iU5' };

  // Configure your region
  AWS.config.region = 'us-east-1';
  console.log("JUSTTEXT");

  var bucket = new AWS.S3({ params: { Bucket: 'myBucket' } });
  bucket.listObjects(function (err, data) {
    console.log("AMAMAZING", bucket);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuY29udHJvbGxlci5qcyIsImNoZWNrb3V0L2NoZWNrb3V0LnN0YXRlLmpzIiwiZGVzaWduL2Rlc2lnbi1kaXJlY3RpdmUuanMiLCJkZXNpZ24vZGVzaWduLmNvbnRyb2xsZXIuanMiLCJkZXNpZ24vZGVzaWduLmRpcmVjdGl2ZS5qcyIsImRlc2lnbi9kZXNpZ24uanMiLCJkZXNpZ24vZGVzaWduLnN0YXRlLmpzIiwiZG9jcy9kb2NzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJvcmRlci9vcmRlci5jb250cm9sbGVyLmpzIiwib3JkZXIvb3JkZXIuZGlyZWN0aXZlLmpzIiwib3JkZXIvb3JkZXIuZmFjdG9yeS5qcyIsIm9yZGVyL29yZGVyLnN0YXRlLmpzIiwicGVyc29uYWxpbmZvL3BlcnNvbmFsaW5mby5jb250cm9sbGVyLmpzIiwicGVyc29uYWxpbmZvL3BlcnNvbmFsaW5mby5mYWN0b3J5LmpzIiwicGVyc29uYWxpbmZvL3BlcnNvbmFsaW5mby5zdGF0ZS5qcyIsInByb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3LmZhY3RvcnkuanMiLCJwcm9kdWN0dmlldy9wcm9kdWN0dmlldy5qcyIsInJldmlldy9yZXZpZXcuZmFjdG9yeS5qcyIsInNlYXJjaHJlc3VsdHMvc2VhcmNoLnN0YXRlLmpzIiwic2lnbnVwL3NpZ251cC5jb250cm9sbGVyLmpzIiwic2lnbnVwL3NpZ251cC5mYWN0b3J5LmpzIiwic2lnbnVwL3NpZ251cC5zdGF0ZS5qcyIsInVzZXIvdXNlci1jb250cm9sbGVyLmpzIiwidXNlci91c2VyLWZhY3RvcnkuanMiLCJ1c2VyL3VzZXItc3RhdGVzLmpzIiwiY29tbW9uL2NvbnRyb2xsZXJzL25hdmJhci5jb250cm9sbGVyLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZmFjdG9yaWVzL3NlYXJjaC5mYWN0b3J5LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvb2F1dGgtYnV0dG9uL29hdXRoLWJ1dHRvbi5kaXJlY3RpdmUuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUNBLE9BQUEsR0FBQSxHQUFBLFFBQUEsTUFBQSxDQUFBLFlBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsQ0FBQSxDQUFBOztBQUVBLElBQUEsTUFBQSxDQUFBLFVBQUEsa0JBQUEsRUFBQSxpQkFBQSxFQUFBOztBQUVBLG9CQUFBLFNBQUEsQ0FBQSxJQUFBOztBQUVBLHFCQUFBLFNBQUEsQ0FBQSxHQUFBOztBQUVBLHFCQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBLFFBQUEsQ0FBQSxNQUFBO0FBQ0EsR0FGQTtBQUdBLENBVEE7OztBQVlBLElBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7OztBQUdBLE1BQUEsK0JBQUEsU0FBQSw0QkFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLFdBQUEsTUFBQSxJQUFBLElBQUEsTUFBQSxJQUFBLENBQUEsWUFBQTtBQUNBLEdBRkE7Ozs7QUFNQSxhQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsUUFBQSxDQUFBLDZCQUFBLE9BQUEsQ0FBQSxFQUFBOzs7QUFHQTtBQUNBOztBQUVBLFFBQUEsWUFB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QSxJQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7QUFDQSxPQVBBOzs7QUFVQSxRQUFBLG9CQUFBLEVBQUEsS0FBQSxDQUFBLFlBQUE7O0FBRUE7QUFDQSxVQUFBLGNBQUEsRUFBQSxNQUFBO0FBQ0EsT0FKQTs7O0FBT0EsZUFBQSxXQUFBLEdBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxVQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxTQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsR0FBQTs7QUFJQTs7QUFFQSxRQUFBLG1CQUFBLEVBQUEsRUFBQSxDQUFBLE9BQUEsRUFBQSxXQUFBOzs7QUFHQSxRQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTs7QUFFQSxZQUFBLFlBQUEsRUFBQSxXQUFBLENBQUE7QUFDQSxrQkFBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLFVBQUEsY0FBQSxFQUFBLE1BQUEsQ0FBQSxTQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsUUFBQSxHQUFBLFdBQUEsQ0FBQSxVQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxVQUFBO0FBQ0EsZ0JBQUEsRUFBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7O0FBRUEsVUFBQSxjQUFBLEVBQUEsSUFBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLENBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsR0FBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxFQUFBLFNBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsSUFBQSxHQUFBLENBQUEsR0FBQSxHQUFBO0FBRUEsT0FmQTs7O0FBa0JBLGNBQUEsU0FBQSxDQUFBLFVBQUEsQ0FBQSxFQUFBO0FBQ0Esb0JBQUEsQ0FBQTtBQUNBLG9CQUFBLElBQUE7QUFDQSxPQUhBLEVBR0EsU0FIQSxDQUdBLFVBQUEsQ0FBQSxFQUFBOztBQUVBLFlBQUEsU0FBQSxFQUFBO0FBQ0Esa0JBQUEsU0FBQTtBQUNBLGtCQUFBLE1BQUEsQ0FBQSxVQUFBLE9BQUEsRUFBQSxVQUFBLE9BQUE7QUFDQSxrQkFBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsRUFBQSxPQUFBO0FBQ0Esa0JBQUEsV0FBQSxHQUFBLEtBQUE7QUFDQSxrQkFBQSxNQUFBO0FBQ0Esa0JBQUEsT0FBQSxHQUFBLE9BQUE7QUFDQSxrQkFBQSxTQUFBLEdBQUEsRUFBQTs7QUFFQSxzQkFBQSxDQUFBO0FBQ0E7QUFDQSxPQWhCQSxFQWdCQSxPQWhCQSxDQWdCQSxZQUFBO0FBQ0Esb0JBQUEsS0FBQTtBQUNBLE9BbEJBLEVBa0JBLFVBbEJBLENBa0JBLFlBQUE7QUFDQSxnQkFBQSxPQUFBO0FBQ0EsT0FwQkE7QUF1QkE7QUExSUEsR0FBQTtBQTRJQSxDQTdJQTs7QUNBQSxJQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBOzs7QUFHQSxNQUFBLE1BQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxXQUFBLHNCQUFBLEVBQUEsaUJBQUEsMENBQUEsRUFBQTs7O0FBR0EsTUFBQSxNQUFBLENBQUEsTUFBQSxHQUFBLFdBQUE7QUFDQSxVQUFBLEdBQUEsQ0FBQSxVQUFBOztBQUVBLE1BQUEsU0FBQSxJQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsUUFBQSxFQUFBLFFBQUEsVUFBQSxFQUFBLEVBQUEsQ0FBQTtBQUNBLFNBQUEsV0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLFlBQUEsR0FBQSxDQUFBLFdBQUEsRUFBQSxNQUFBO0FBQ0EsUUFBQSxHQUFBLEVBQUE7QUFDQSxlQUFBLGNBQUEsQ0FBQSxRQUFBLEVBQUEsU0FBQSxHQUNBLGdDQURBO0FBRUEsS0FIQSxNQUdBO0FBQ0EsZUFBQSxjQUFBLENBQUEsUUFBQSxFQUFBLFNBQUEsR0FDQSxZQUFBLEtBQUEsUUFBQSxDQUFBLE1BQUEsR0FBQSxnQkFEQTtBQUVBLFdBQUEsSUFBQSxJQUFBLENBQUEsRUFBQSxJQUFBLEtBQUEsUUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxpQkFBQSxjQUFBLENBQUEsU0FBQSxFQUFBLFNBQUEsSUFDQSxTQUFBLEtBQUEsUUFBQSxDQUFBLENBQUEsRUFBQSxHQUFBLEdBQUEsT0FEQTtBQUVBO0FBQ0E7QUFDQSxHQWJBO0FBY0EsU0FBQSxFQUFBLEdBQUEsSUFBQTtBQUVBLENBMUJBOztBQ0FBLElBQUEsU0FBQSxDQUFBLFlBQUEsRUFBQSxZQUFBOztBQUVBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxXQUFBLEVBRkE7QUFHQSxnQkFBQSxrQkFIQTtBQUlBLGlCQUFBLDRCQUpBO0FBS0EsVUFBQSxjQUFBLEtBQUEsRUFBQSxDQUVBOztBQVBBLEdBQUE7QUFXQSxDQWJBO0FDQUEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLENBQUEsWUFBQSxFQUFBO0FBQ0EsU0FBQSxtQkFEQTtBQUVBLFdBQUE7QUFDQSxlQUFBO0FBREEsS0FGQTtBQUtBLGdCQUFBLGdCQUxBO0FBTUEsY0FBQTtBQU5BLEdBQUE7QUFTQSxDQVZBOztBQVlBLElBQUEsVUFBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBOztBQUVBLFFBQUEsSUFBQSxDQUFBLG1CQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxPQUFBLFFBQUEsR0FBQSxHQUFBO0FBQ0EsR0FIQTs7Ozs7O0FBU0EsQ0FYQTtBQ1pBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFNBQUEsU0FEQTtBQUVBLGdCQUFBLGtCQUZBO0FBR0EsaUJBQUE7QUFIQSxHQUFBO0FBS0EsQ0FOQTtBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFNBQUEsT0FEQTtBQUVBLGlCQUFBO0FBRkEsR0FBQTtBQUlBLENBTEE7O0FDQUEsQ0FBQSxZQUFBOztBQUVBOzs7O0FBR0EsTUFBQSxDQUFBLE9BQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsd0JBQUEsQ0FBQTs7QUFFQSxNQUFBLE1BQUEsUUFBQSxNQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsQ0FBQTs7QUFFQSxNQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUEsQ0FBQSxPQUFBLEVBQUEsRUFBQSxNQUFBLElBQUEsS0FBQSxDQUFBLHNCQUFBLENBQUE7QUFDQSxXQUFBLE9BQUEsRUFBQSxDQUFBLE9BQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQTtBQUNBLEdBSEE7Ozs7O0FBUUEsTUFBQSxRQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0Esa0JBQUEsb0JBREE7QUFFQSxpQkFBQSxtQkFGQTtBQUdBLG1CQUFBLHFCQUhBO0FBSUEsb0JBQUEsc0JBSkE7QUFLQSxzQkFBQSx3QkFMQTtBQU1BLG1CQUFBO0FBTkEsR0FBQTs7QUFTQSxNQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxRQUFBLGFBQUE7QUFDQSxXQUFBLFlBQUEsZ0JBREE7QUFFQSxXQUFBLFlBQUEsYUFGQTtBQUdBLFdBQUEsWUFBQSxjQUhBO0FBSUEsV0FBQSxZQUFBO0FBSkEsS0FBQTtBQU1BLFdBQUE7QUFDQSxxQkFBQSx1QkFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxVQUFBLENBQUEsV0FBQSxTQUFBLE1BQUEsQ0FBQSxFQUFBLFFBQUE7QUFDQSxlQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQTtBQUNBO0FBSkEsS0FBQTtBQU1BLEdBYkE7O0FBZUEsTUFBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxrQkFBQSxZQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsV0FEQSxFQUVBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsYUFBQSxVQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsS0FKQSxDQUFBO0FBTUEsR0FQQTs7QUFTQSxNQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGFBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxVQUFBLE9BQUEsU0FBQSxJQUFBO0FBQ0EsY0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBQSxJQUFBO0FBQ0EsaUJBQUEsVUFBQSxDQUFBLFlBQUEsWUFBQTtBQUNBLGFBQUEsS0FBQSxJQUFBO0FBQ0E7Ozs7QUFJQSxTQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsYUFBQSxDQUFBLENBQUEsUUFBQSxJQUFBO0FBQ0EsS0FGQTs7QUFJQSxTQUFBLGVBQUEsR0FBQSxVQUFBLFVBQUEsRUFBQTs7Ozs7Ozs7OztBQVVBLFVBQUEsS0FBQSxlQUFBLE1BQUEsZUFBQSxJQUFBLEVBQUE7QUFDQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFFBQUEsSUFBQSxDQUFBO0FBQ0E7Ozs7O0FBS0EsYUFBQSxNQUFBLEdBQUEsQ0FBQSxVQUFBLEVBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsS0FBQSxDQUFBLFlBQUE7QUFDQSxlQUFBLElBQUE7QUFDQSxPQUZBLENBQUE7QUFJQSxLQXJCQTs7QUF1QkEsU0FBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxXQUFBLEVBQ0EsSUFEQSxDQUNB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LElBQUEsSUFBQTtBQUNBLE9BSEEsQ0FBQTtBQUlBLEtBdERBO0FBdURBLFlBQUEsaUJBQUEsRUFBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLElBQUEsQ0FBQSxzQkFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLE9BQUEsRUFBQSxDQUFBLE1BQUEsQ0FEQSxDQUFBO0FBRUE7O0FBMURBLEdBQUE7QUE4REEsQ0FoRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN1RUEsSUFBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQTs7QUFJQSxTQUFBLGdCQUFBLEdBQUEsS0FBQTtBQUNBLFNBQUEsSUFBQSxHQUFBLE9BQUE7QUFDQSxTQUFBLE9BQUEsR0FBQSxVQUFBOztBQUVBLFNBQUEsS0FBQSxHQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxPQUFBLEdBQUEsT0FBQTtBQUNBLFdBQUEsUUFBQSxHQUFBLENBQUEsT0FBQSxRQUFBO0FBQ0EsZUFBQSxZQUFBO0FBQ0EsYUFBQSxRQUFBLEdBQUEsQ0FBQSxPQUFBLFFBQUE7QUFDQSxhQUFBLE9BQUE7QUFDQSxLQUhBLEVBR0EsSUFIQTs7QUFLQSxHQVJBOztBQVVBLFNBQUEsWUFBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsTUFBQSxFQUFBLEVBQUEsUUFBQSxNQUFBLEVBQUE7QUFDQSxHQUZBOztBQUlBLFNBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxRQUFBLE9BQUEsRUFBQTtBQUNBLFNBQUEsTUFBQSxHQUFBLE9BQUEsSUFBQSxDQUFBLEVBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxDQUFBLE9BQUEsUUFBQTtBQUNBLFNBQUEsYUFBQSxHQUFBLENBQUEsT0FBQSxJQUFBLENBQUEsS0FBQTtBQUNBLFFBQUEsS0FBQSxRQUFBLEdBQUEsQ0FBQSxFQUFBO0FBQ0EsbUJBQUEsU0FBQSxDQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsUUFBQSx5Q0FBQSxRQUFBLE9BQUEsUUFBQSxFQUFBLE9BQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxLQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUE7QUFDQSxPQUpBO0FBS0EsS0FOQSxNQU9BLE9BQUEsS0FBQSxDQUFBLG9DQUFBO0FBQ0EsR0FiQTs7QUFlQSxTQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxPQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUE7QUFDQSxLQUZBLEVBRUEsSUFGQSxDQUVBLElBRkEsQ0FBQTtBQUdBLEdBSkE7O0FBTUEsU0FBQSxXQUFBOztBQUVBLFNBQUEsaUJBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxZQUFBLGVBQUEsR0FDQSxJQURBLENBQ0EsVUFBQSxJQUFBLEVBQUE7QUFDQSxjQUFBLEdBQUEsQ0FBQSxJQUFBO0FBQ0EsVUFBQSxDQUFBLElBQUEsRUFBQTtBQUNBLGVBQUEsY0FBQSxHQUFBLE1BQUE7QUFDQSxPQUZBLE1BRUE7QUFDQSxlQUFBLGNBQUEsR0FBQSxLQUFBLEVBQUE7QUFDQTtBQUNBLEtBUkEsQ0FBQTtBQVNBLEdBVkE7O0FBWUEsU0FBQSxpQkFBQTs7QUFFQSxTQUFBLG9CQUFBLEdBQUEsWUFBQTtBQUNBLFdBQUEsT0FBQSxnQkFBQTtBQUNBLEdBRkE7O0FBSUEsU0FBQSxvQkFBQTs7QUFFQSxTQUFBLFNBQUEsR0FBQSxZQUFBOzs7QUFHQSxRQUFBLHVCQUFBLE9BQUEsT0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsT0FBQSxNQUFBO0FBQ0EsS0FGQSxDQUFBOztBQUlBLFFBQUEsT0FBQSxjQUFBLEtBQUEsTUFBQSxFQUFBO0FBQ0EsYUFBQSxrQkFBQSxHQUFBLHlDQUFBO0FBQ0EsYUFBQSxnQkFBQSxHQUFBLElBQUE7QUFDQSxLQUhBLE1BR0EsSUFBQSxxQkFBQSxPQUFBLENBQUEsT0FBQSxjQUFBLE1BQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSxhQUFBLGtCQUFBLEdBQUEsK0RBQUE7QUFDQSxhQUFBLGdCQUFBLEdBQUEsSUFBQTs7QUFFQSxLQUpBLE1BSUEsSUFBQSxPQUFBLGNBQUEsS0FBQSxPQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsRUFBQSxFQUFBO0FBQ0EsZUFBQSxrQkFBQSxHQUFBLGlDQUFBO0FBQ0EsZUFBQSxnQkFBQSxHQUFBLElBQUE7QUFDQSxPQUhBLE1BR0E7O0FBRUEsWUFBQSxZQUFBO0FBQ0EsZ0JBQUEsT0FBQSxVQURBO0FBRUEsa0JBQUEsT0FBQSxJQUFBLENBQUE7QUFGQSxTQUFBO0FBSUEsZUFBQSxjQUFBLFVBQUEsQ0FBQSxTQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsY0FBQSxTQUFBLEVBQUE7QUFDQSxpQkFBQSxJQUFBLEdBQUEsRUFBQTs7QUFFQSxpQkFBQSxJQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFVBQUE7QUFDQSxpQkFBQSxJQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFNBQUE7QUFDQSxpQkFBQSxJQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFdBQUE7QUFDQSxpQkFBQSxJQUFBLENBQUEsUUFBQSxHQUFBLFVBQUEsSUFBQSxDQUFBLFFBQUE7QUFDQSxpQkFBQSxJQUFBLEdBQUEsVUFBQSxNQUFBLENBQUEsSUFBQTs7QUFFQSxpQkFBQSxPQUFBLENBQUEsSUFBQSxDQUFBLE1BQUE7QUFDQSxpQkFBQSxVQUFBLEdBQUEsSUFBQTtBQUNBLFNBYkEsQ0FBQTtBQWNBO0FBQ0EsR0F0Q0E7O0FBd0NBLFNBQUEsTUFBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxZQUFBLE1BQUEsQ0FBQSxNQUFBLEVBQ0Es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RUFBQTtBQUNBLGlCQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxTQUFBLFNBREE7QUFFQSxnQkFBQSxZQUZBO0FBR0EsaUJBQUE7QUFIQSxHQUFBO0FBTUEsQ0FQQTtBQ0FBLElBQUEsVUFBQSxDQUFBLFVBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsVUFBQSxHQUFBLENBQUEsWUFBQSxFQUFBLFlBQUE7QUFDQSxTQUFBLElBQUEsR0FBQSxPQUFBO0FBQ0EsU0FBQSxLQUFBLEdBQUEsWUFBQTs7QUFFQSxTQUFBLGNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxFQUFBO0FBQ0EsR0FGQTs7QUFJQSxTQUFBLFVBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLGdCQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUNBLEdBRkE7O0FBSUEsY0FBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsV0FBQSxLQUFBLEVBQUEsSUFBQSxPQUFBLElBQUEsQ0FBQSxFQUFBLElBQUEsS0FBQSxPQUFBLEdBQUEsSUFBQSxHQUFBLEtBQUE7QUFDQSxHQUZBLEVBR0EsSUFIQSxDQUdBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsWUFBQSxHQUFBLENBQUEsTUFBQTtBQUNBLFdBQUEsVUFBQSxHQUFBLE1BQUE7QUFDQSxHQU5BOztBQVFBLFNBQUEsTUFBQSxHQUFBLFlBQUEsTUFBQTtBQUNBLENBdEJBOztBQ0FBLElBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxNQUFBLGNBQUEsRUFBQTs7QUFFQSxjQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsTUFBQSxHQUFBLENBQUEsZUFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsY0FBQSxHQUFBLENBQUEsU0FBQSxFQUFBLFNBQUEsSUFBQTtBQUNBLGFBQUEsU0FBQSxJQUFBO0FBQ0EsS0FKQSxDQUFBO0FBS0EsR0FOQTs7QUFRQSxjQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxNQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxTQUFBLElBQUE7QUFDQSxLQUhBLENBQUE7QUFJQSxHQUxBOztBQU9BLGNBQUEsTUFBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsV0FBQSxNQUFBLElBQUEsQ0FBQSxzQkFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLE9BQUEsRUFBQSxDQUFBLE1BQUEsQ0FEQSxDQUFBO0FBRUEsR0FIQTs7QUFLQSxTQUFBLFdBQUE7QUFDQSxDQXhCQTs7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGlCQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxTQUFBLGVBREE7QUFFQSxpQkFBQSw0QkFGQTtBQUdBLGdCQUFBLFVBSEE7QUFJQSxhQUFBO0FBQ0EsZUFBQSxpQkFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsZUFBQSxZQUFBLFNBQUEsQ0FBQSxhQUFBLE1BQUEsQ0FBQTtBQUNBLE9BSEE7QUFJQSxvQkFBQSxzQkFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsZUFBQSxZQUFBLFlBQUEsQ0FBQSxhQUFBLE1BQUEsQ0FBQTtBQUNBO0FBTkE7QUFKQSxHQUFBO0FBYUEsQ0FkQTs7QUNBQSxJQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQTs7QUFFQSxTQUFBLE1BQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTs7Ozs7QUFLQSxXQUFBLE9BQUEsRUFBQSxDQUFBLGVBQUEsRUFBQSxFQUFBLGFBQUEsV0FBQSxFQUFBLENBQUE7O0FBRUEsR0FQQTtBQVFBLENBVkE7O0FBWUEsSUFB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QUZBOztBQUlBLFlBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLFlBQUEsTUFBQSxHQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsaUJBQUEsRUFBQSxDQUFBLE1BQUE7QUFDQSxTQUZBLENBQUE7QUFHQSxPQUpBOztBQU1BLFVBQUEsVUFBQSxTQUFBLE9BQUEsR0FBQTtBQUNBLGVBQUEsWUFBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxTQUZBLENBQUE7QUFHQSxPQUpBOztBQU1BOztBQUVBLFVBQUEsYUFBQSxTQUFBLFVBQUEsR0FBQTtBQUNBLGNBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxPQUZBOztBQUlBLGlCQUFBLEdBQUEsQ0FBQSxZQUFBLFlBQUEsRUFBQSxPQUFBO0FBQ0EsaUJBQUEsR0FBQSxDQUFBLFlBQUEsYUFBQSxFQUFBLFVBQUE7QUFDQSxpQkFBQSxHQUFBLENBQUEsWUFBQSxjQUFBLEVBQUEsVUFBQTtBQUVBOztBQWhEQSxHQUFBO0FBb0RBLENBdERBOztBQ0FBOztBQUVBLElBQUEsU0FBQSxDQUFBLGFBQUEsRUFBQSxZQUFBO0FBQ0EsU0FBQTtBQUNBLFdBQUE7QUFDQSxvQkFBQTtBQURBLEtBREE7QUFJQSxjQUFBLEdBSkE7QUFLQSxpQkFBQTtBQUxBLEdBQUE7QUFPQSxDQVJBOztBQ0ZBLElBQUEsU0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBLGVBQUEsRUFBQTs7QUFFQSxTQUFBO0FBQ0EsY0FBQSxHQURBO0FBRUEsaUJBQUEseURBRkE7QUFHQSxVQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0EsWUFBQSxRQUFBLEdBQUEsZ0JBQUEsaUJBQUEsRUFBQTtBQUNBO0FBTEEsR0FBQTtBQVFBLENBVkEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnc29ja21hcmtldCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWJvdXQnLCB7XG4gICAgICAgIHVybDogJy9hYm91dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBYm91dENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Fib3V0L2Fib3V0Lmh0bWwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignQWJvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgRnVsbHN0YWNrUGljcykge1xuXG4gICAgLy8gSW1hZ2VzIG9mIGJlYXV0aWZ1bCBGdWxsc3RhY2sgcGVvcGxlLlxuICAgICRzY29wZS5pbWFnZXMgPSBfLnNodWZmbGUoRnVsbHN0YWNrUGljcyk7XG5cbn0pO1xuXG4iLCJhcHAuY29udHJvbGxlcignY2hlY2tvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgT3JkZXJGYWN0b3J5LCBjdXJyZW50Q2FydCkge1xuICAkc2NvcGUuY3VycmVudENhcnQgPSBjdXJyZW50Q2FydFxuXG4gICRzY29wZS5jYWxjVG90YWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gT3JkZXJGYWN0b3J5LmNhbGN1bGF0ZVRvdGFsKCdjdXJyZW50JylcbiAgICAudGhlbihmdW5jdGlvbihjYXJ0VG90YWwpIHsgJHNjb3BlLnRvdGFsID0gY2FydFRvdGFsIH0pXG4gIH1cblxuICAkc2NvcGUuY2FsY1RvdGFsKClcbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hlY2tvdXQnLCB7XG4gICAgdXJsOiAnL2NhcnQvY2hlY2tvdXQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL2NoZWNrb3V0L2NoZWNrb3V0Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdjaGVja291dENvbnRyb2xsZXInLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGN1cnJlbnRDYXJ0OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuXHRcdFx0fVxuXHRcdH1cbiAgfSlcbn0pXG4iLCJhcHAuZGlyZWN0aXZlKCdkZXNpZ25WaWV3JywgZnVuY3Rpb24gKFNvY2tGYWN0b3J5LCAkc3RhdGUsICRodHRwKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2Rlc2lnbi9kZXNpZ24tdmlldy5odG1sJyxcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBkZXNpZ25WaWV3Q3RybCkge1xuXG5cdFx0XHR2YXIgdGl0bGUgPSBzY29wZS50aXRsZTtcblx0XHRcdHZhciBkZXNjcmlwdGlvbiA9IHNjb3BlLmRlc2NyaXB0aW9uO1xuXHRcdFx0dmFyIHRhZ3MgPSBzY29wZS50YWdzO1xuXHRcdFx0dmFyIGNhbnZhcyA9IGVsZW1lbnQuZmluZCgnY2FudmFzJylbMF07XG5cblx0XHRcdHNjb3BlLnNhdmVEZXNpZ24gPSBmdW5jdGlvbiAodGl0bGUsIGRlc2NyaXB0aW9uLCB0YWdzKSB7XG5cblx0XHRcdFx0dmFyIHRhZ3NBcnIgPSBTb2NrRmFjdG9yeS5wcmVwYXJlVGFncyh0YWdzKTtcblxuICAgICAgICB2YXIgbmV3U29ja0RhdGFPYmogPSB7XG4gICAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbixcbiAgICAgICAgICB0YWdzOiB0YWdzQXJyXG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gZGF0YVVSSXRvQmxvYihkYXRhVVJJKSB7XG4gICAgICAgICAgdmFyIGJpbmFyeSA9IGF0b2IoZGF0YVVSSS5zcGxpdCgnLCcpWzFdKTtcbiAgICAgICAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgYmluYXJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcnJheS5wdXNoKGJpbmFyeS5jaGFyQ29kZUF0KGkpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBCbG9iKFtuZXcgVWludDhBcnJheShhcnJheSldLCB7dHlwZTogJ2ltYWdlL3BuZyd9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkYXRhVXJsID0gY2FudmFzLnRvRGF0YVVSTChcImltYWdlL3BuZ1wiKTtcbiAgICAgICAgdmFyIGJsb2JEYXRhID0gZGF0YVVSSXRvQmxvYihkYXRhVXJsKTtcblxuICAgICAgICBTb2NrRmFjdG9yeS5nZXRVbnNpZ25lZFVSTCgpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICAgIHZhciBpbWFnZVVybCA9IHJlcy51cmwuc3BsaXQoJz8nKVswXTtcblxuICAgICAgICAgICAgJGh0dHAucHV0KHJlcy51cmwsIGJsb2JEYXRhLFxuICAgICAgICAgICAgICB7aGVhZGVyczoge1xuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICAgICAgS2V5IDogJ2FuaV9iZW4ucG5nJ1xuICAgICAgICAgICAgfX0pXG4gICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgICAgICAgbmV3U29ja0RhdGFPYmouaW1hZ2UgPSBpbWFnZVVybDtcbiAgICAgICAgICAgICAgICBTb2NrRmFjdG9yeS5zYXZlRGVzaWduKG5ld1NvY2tEYXRhT2JqKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygndXNlcicsIHt1c2VySWQ6IHJlc3VsdC5kYXRhLnVzZXJJZH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuXHRcdFx0fTtcblxuXG5cdFx0XHR2YXIgY29sb3IgPSAkKFwiLnNlbGVjdGVkXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XG5cdFx0XHR2YXIgY29udGV4dCA9ICQoXCJjYW52YXNcIilbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXHRcdFx0dmFyICRjYW52YXMgPSAkKFwiY2FudmFzXCIpO1xuXHRcdFx0dmFyIGxhc3RFdmVudDtcblx0XHRcdHZhciBtb3VzZURvd24gPSBmYWxzZTtcblxuXHRcdFx0dmFyIGJhY2tncm91bmQgPSBuZXcgSW1hZ2UoKTtcblxuXHRcdFx0YmFja2dyb3VuZC5zcmMgPSAnL3NvY2stYmcvMS5wbmcnO1xuXG5cdFx0XHRiYWNrZ3JvdW5kLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ICBjb250ZXh0LmRyYXdJbWFnZShiYWNrZ3JvdW5kLCAwLCAwKTtcblx0XHRcdH07XG5cblx0XHRcdC8vV2hlbiBjbGlja2luZyBvbiBjb250cm9sIGxpc3QgaXRlbXNcblx0XHRcdCAgJChcIi5jb250cm9sc1wiKS5vbihcImNsaWNrXCIsIFwibGlcIiAsIGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgIC8vRGVzbGVjdCBzaWJsaW5nIGVsZW1lbnRzXG5cdFx0XHQgICAgICQodGhpcykuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAgICAvL1NlbGVjdCBjbGlja2VkIGVsZW1lbnRcblx0XHRcdCAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAgICAvL3N0b3JlIHRoZSBjb2xvclxuXHRcdFx0ICAgICBjb2xvciA9ICQodGhpcykuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdCAgfSk7XG5cblx0XHRcdC8vV2hlbiBcIkFkZCBDb2xvclwiIGJ1dHRvbiBpcyBwcmVzc2VkXG5cdFx0XHQgICQoXCIjcmV2ZWFsQ29sb3JTZWxlY3RcIikuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgIC8vU2hvdyBjb2xvciBzZWxlY3Qgb3IgaGlkZSB0aGUgY29sb3Igc2VsZWN0XG5cdFx0XHQgICAgY2hhbmdlQ29sb3IoKTtcblx0XHRcdCAgXHQkKFwiI2NvbG9yU2VsZWN0XCIpLnRvZ2dsZSgpO1xuXHRcdFx0ICB9KTtcblxuXHRcdFx0Ly9VcGRhdGUgdGhlIG5ldyBjb2xvciBzcGFuXG5cdFx0XHRmdW5jdGlvbiBjaGFuZ2VDb2xvcigpe1xuXHRcdFx0XHR2YXIgciA9ICQoXCIjcmVkXCIpLnZhbCgpO1xuXHRcdFx0XHR2YXIgZyA9ICQoXCIjZ3JlZW5cIikudmFsKCk7XG5cdFx0XHRcdHZhciBiID0gJChcIiNibHVlXCIpLnZhbCgpO1xuXHRcdFx0XHQkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2IoXCIgKyByICsgXCIsIFwiICsgZyArIFwiLCBcIiArIGIgKyBcIilcIik7XG5cdFx0XHQgIC8vV2hlbiBjb2xvciBzbGlkZXJzIGNoYW5nZVxuXG5cblx0XHRcdH1cblxuXHRcdFx0JChcImlucHV0W3R5cGU9cmFuZ2VdXCIpLm9uKFwiaW5wdXRcIiwgY2hhbmdlQ29sb3IpO1xuXG5cdFx0XHQvL3doZW4gXCJBZGQgQ29sb3JcIiBpcyBwcmVzc2VkXG5cdFx0XHQkKFwiI2FkZE5ld0NvbG9yXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0XHQgIC8vYXBwZW5kIHRoZSBjb2xvciB0byB0aGUgY29udHJvbHMgdWxcblx0XHRcdCAgdmFyICRuZXdDb2xvciA9ICQoXCI8bGk+PC9saT5cIik7XG5cdFx0XHQgICRuZXdDb2xvci5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsICQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKSk7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgdWxcIikuYXBwZW5kKCRuZXdDb2xvcik7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgbGlcIikuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzIGxpXCIpLmxhc3QoKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICBjb2xvciA9ICQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdCAgLy93aGVuIGFkZGVkLCByZXN0b3JlIHNsaWRlcnMgYW5kIHByZXZpZXcgY29sb3IgdG8gZGVmYXVsdFxuXHRcdFx0ICAkKFwiI2NvbG9yU2VsZWN0XCIpLmhpZGUoKTtcblx0XHRcdFx0dmFyIHIgPSAkKFwiI3JlZFwiKS52YWwoMCk7XG5cdFx0XHRcdHZhciBnID0gJChcIiNncmVlblwiKS52YWwoMCk7XG5cdFx0XHRcdHZhciBiID0gJChcIiNibHVlXCIpLnZhbCgwKTtcblx0XHRcdFx0JChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiKFwiICsgciArIFwiLCBcIiArIGcgKyBcIiwgXCIgKyBiICsgXCIpXCIpO1xuXG5cdFx0XHR9KVxuXG5cdFx0XHQvL09uIG1vdXNlIGV2ZW50cyBvbiB0aGUgY2FudmFzXG5cdFx0XHQkY2FudmFzLm1vdXNlZG93bihmdW5jdGlvbihlKXtcblx0XHRcdCAgbGFzdEV2ZW50ID0gZTtcblx0XHRcdCAgbW91c2VEb3duID0gdHJ1ZTtcblx0XHRcdH0pLm1vdXNlbW92ZShmdW5jdGlvbihlKXtcblx0XHRcdCAgLy9kcmF3IGxpbmVzXG5cdFx0XHQgIGlmIChtb3VzZURvd24pe1xuXHRcdFx0ICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0XHQgICAgY29udGV4dC5tb3ZlVG8obGFzdEV2ZW50Lm9mZnNldFgsbGFzdEV2ZW50Lm9mZnNldFkpO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZVRvKGUub2Zmc2V0WCwgZS5vZmZzZXRZKTtcblx0XHRcdCAgICBjb250ZXh0LnN0cm9rZVN0eWxlID0gY29sb3I7XG5cdFx0XHQgICAgY29udGV4dC5zdHJva2UoKTtcblx0XHRcdCAgICBjb250ZXh0LmxpbmVDYXAgPSAncm91bmQnO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZVdpZHRoID0gMjA7XG5cblx0XHRcdCAgICBsYXN0RXZlbnQgPSBlO1xuXHRcdFx0ICB9XG5cdFx0XHR9KS5tb3VzZXVwKGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgbW91c2VEb3duID0gZmFsc2U7XG5cdFx0XHR9KS5tb3VzZWxlYXZlKGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgJGNhbnZhcy5tb3VzZXVwKCk7XG5cdFx0XHR9KTtcblxuXG5cdFx0fVxuXHR9XG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ0Rlc2lnbkNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cbiAgICAvLyBTZWUgdGhlIENvbmZpZ3VyaW5nIHNlY3Rpb24gdG8gY29uZmlndXJlIGNyZWRlbnRpYWxzIGluIHRoZSBTREtcbiAgQVdTLmNvbmZpZy51cGRhdGUgPSh7YWNjZXNzS2V5OiAnQUtJQUlJRTREM1JTNVZRUkoyM1EnLCBzZWNyZXRBY2Nlc3NLZXk6J2lKLzFrUUNQeFhsUjZHeFdaTG9lZEhIQVJRc3lId1VrSmxWYTRpVTUnfSk7XG5cbiAgLy8gQ29uZmlndXJlIHlvdXIgcmVnaW9uXG4gIEFXUy5jb25maWcucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG4gIGNvbnNvbGUubG9nKFwiSlVTVFRFWFRcIik7XG5cbiAgdmFyIGJ1Y2tldCA9IG5ldyBBV1MuUzMoe3BhcmFtczoge0J1Y2tldDogJ215QnVja2V0J319KTtcbiAgYnVja2V0Lmxpc3RPYmplY3RzKGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICBjb25zb2xlLmxvZyhcIkFNQU1BWklOR1wiLCBidWNrZXQpO1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGF0dXMnKS5pbm5lckhUTUwgPVxuICAgICAgICAnQ291bGQgbm90IGxvYWQgb2JqZWN0cyBmcm9tIFMzJztcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXR1cycpLmlubmVySFRNTCA9XG4gICAgICAgICdMb2FkZWQgJyArIGRhdGEuQ29udGVudHMubGVuZ3RoICsgJyBpdGVtcyBmcm9tIFMzJztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5Db250ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb2JqZWN0cycpLmlubmVySFRNTCArPVxuICAgICAgICAgICc8bGk+JyArIGRhdGEuQ29udGVudHNbaV0uS2V5ICsgJzwvbGk+JztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICAkc2NvcGUuaGkgPSBcImhpXCI7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZGVzaWduU29jaycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgY29udHJvbGxlcjogJ0Rlc2lnbkNvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Rlc2lnbi9kZXNpZ24udmlldy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGVzaWduVmlldycsIHtcbiAgICAgIHVybDonL3NvY2tzL2Rlc2lnbi86aWQnLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgdGhlU29jazogJz0nXG4gICAgICB9LFxuICAgICAgY29udHJvbGxlcjogJ2Rlc2lnblZpZXdDdHJsJyxcbiAgICAgIHRlbXBsYXRlOiAnPGRlc2lnbi12aWV3PjwvZGVzaWduLXZpZXc+JyxcbiAgICB9KVxuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ2Rlc2lnblZpZXdDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHApIHtcblxuICAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvbWF0Y2hJZCcpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgcmV0dXJuICRzY29wZS5zaG93VmlldyA9IHJlc1xuICAgIH0pXG5cblx0Ly8gLy8gJHNjb3BlLmRlc2NyaXB0aW9uO1xuXHQvLyAkc2NvcGUudGFncztcblx0Ly8gJHNjb3BlLnRpdGxlO1xuXHQvLyBjb25zb2xlLmxvZygkc2NvcGUuZGVzY3JpcHRpb24pO1xufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkZXNpZ24nLCB7XG4gICAgICB1cmw6Jy9kZXNpZ24nLFxuICAgICAgY29udHJvbGxlcjogJ0Rlc2lnbkNvbnRyb2xsZXInLFxuICAgICAgdGVtcGxhdGVVcmw6ICc8ZGVzaWduLXNvY2s+PC9kZXNpZ24tc29jaz4nXG4gICAgfSlcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2RvY3MnLCB7XG4gICAgICAgIHVybDogJy9kb2NzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9kb2NzL2RvY3MuaHRtbCdcbiAgICB9KTtcbn0pO1xuIiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdob21lQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRtb3N0UmVjZW50U29ja3M6IGZ1bmN0aW9uIChTb2NrRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFNvY2tGYWN0b3J5Lm1vc3RSZWNlbnRTb2NrcygpXG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ2hvbWVDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgbW9zdFJlY2VudFNvY2tzLCAkc3RhdGUsICRzdGF0ZVBhcmFtcykge1xuXG4gICRzY29wZS5tb3N0UmVjZW50U29ja3MgPSBtb3N0UmVjZW50U29ja3NcbiAgJHNjb3BlLnNlZVNvY2sgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG4gIH1cbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21lbWJlcnNPbmx5Jywge1xuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXG4gICAgfTtcblxufSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4nLCB7XG4gICAgICAgIHVybDogJy9hZG1pbicsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pOyIsImFwcC5jb250cm9sbGVyKCdjYXJ0Q3VycmVudCcsIGZ1bmN0aW9uICgkc2NvcGUsIE9yZGVyRmFjdG9yeSwgY3VycmVudENhcnQpIHtcbiAgJHNjb3BlLmN1cnJlbnQgPSBjdXJyZW50Q2FydFxufSlcblxuXG5hcHAuY29udHJvbGxlcignY2FydEhpc3RvcnknLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGNhcnRIaXN0b3J5KSB7XG5cbiAgLy8gJHNjb3BlLmNhcnRIaXN0b3J5ID0gY2FydEhpc3RvcnlcblxufSlcbiIsImFwcC5kaXJlY3RpdmUoJ2N1cnJlbnRDYXJ0JywgZnVuY3Rpb24gKCRzdGF0ZSwgT3JkZXJGYWN0b3J5KSB7XG5cbiAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICBzY29wZToge30sXG4gICAgICB0ZW1wbGF0ZVVybDogJ2pzL29yZGVyL2N1cnJlbnQuaHRtbCcsXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSkge1xuXG4gICAgICAgIHNjb3BlLnVwZGF0ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICB2YXIgc29jayA9IHtcbiAgICAgICAgICAgIHF1YW50aXR5OiBpdGVtLm5ld0Ftb3VudCxcbiAgICAgICAgICAgIGlkOiBpdGVtLmlkXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBPcmRlckZhY3RvcnkudXBkYXRlSXRlbShzb2NrKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpdGVtLnF1YW50aXR5ID0gaXRlbS5uZXdBbW91bnQ7XG4gICAgICAgICAgICBpdGVtLm5ld0Ftb3VudCA9IG51bGw7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNjb3BlLmNhbGNUb3RhbCgpXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICB2YXIgdG9kZWxldGUgPSB7IGl0ZW06IGl0ZW0gfVxuICAgICAgICAgIE9yZGVyRmFjdG9yeS5kZWxldGVJdGVtKHRvZGVsZXRlLml0ZW0uaWQpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5jYWxjVG90YWwoKSB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKG5ld1RvdGFsKSB7IHNjb3BlLnRvdGFsID0gbmV3VG90YWwgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLnNpbmdsZVNvY2tWaWV3ID0gZnVuY3Rpb24oaWQpIHsgJHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KSB9XG4gICAgICAgIHNjb3BlLnRvQ2hlY2tvdXQgPSBmdW5jdGlvbigpIHsgJHN0YXRlLmdvKCdjaGVja291dCcpIH1cblxuICAgICAgICBzY29wZS5jYWxjVG90YWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LmNhbGN1bGF0ZVRvdGFsKCdjdXJyZW50JylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihjYXJ0VG90YWwpIHtcbiAgICAgICAgICAgIHNjb3BlLnRvdGFsID0gY2FydFRvdGFsXG4gICAgICAgICAgICByZXR1cm4gY2FydFRvdGFsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmNhbGNUb3RhbCgpXG5cbiAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnY3VycmVudCcpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGN1cnJlbnQpIHsgc2NvcGUuY3VycmVudENhcnQgPSBjdXJyZW50IH0pXG4gICAgfVxuICB9XG59KVxuXG5hcHAuZGlyZWN0aXZlKCdjYXJ0SGlzdG9yeScsIGZ1bmN0aW9uKCRzdGF0ZSwgT3JkZXJGYWN0b3J5KSB7XG5cbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHNjb3BlOiB7fSxcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL29yZGVyL2hpc3RvcnkuaHRtbCcsXG4gICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgIHNjb3BlLmNhbGNUb3RhbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LmNhbGN1bGF0ZVRvdGFsKCdoaXN0b3J5JylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY2FydFRvdGFsKSB7IHNjb3BlLnRvdGFsU3BlbnQgPSBjYXJ0VG90YWwgfSlcbiAgICAgIH1cblxuICAgICAgc2NvcGUuY2FsY1RvdGFsKClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkgeyBjb25zb2xlLmxvZyhzY29wZS50b3RhbFNwZW50KSB9KVxuXG4gICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdoaXN0b3J5JylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGhpc3RvcnkpIHsgc2NvcGUuY2FydEhpc3RvcnkgPSBoaXN0b3J5IH0pXG4gICAgfVxuICB9XG5cbn0pXG4iLCJcbmFwcC5mYWN0b3J5KCdPcmRlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuICB2YXIgY2FjaGVkQ2FydCA9IFtdXG4gIHZhciBjaGVja0NhcnQgPSBmdW5jdGlvbihvYmosIGFycikge1xuICAgIHJldHVybiBhcnIubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uc29ja0lkIH0pLmluZGV4T2Yob2JqLnNvY2tJZCkgPT09IC0xID8gZmFsc2UgOiB0cnVlXG4gIH1cbiAgcmV0dXJuIHtcbiAgICBhZGRUb0NhcnQ6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci9jdXJyZW50JylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykgeyByZXR1cm4gY2hlY2tDYXJ0KG9iaiwgcmVzLmRhdGEpIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihpbkNhcnQpIHtcbiAgICAgICAgaWYgKGluQ2FydCkge1xuICAgICAgICAgIHJldHVybiBcIkFscmVhZHkgaW4gQ2FydCFcIlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL29yZGVyLycsIG9iailcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHsgcmV0dXJuIHJlcy5kYXRhIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSxcbiAgICBzaG93Q2FydDogZnVuY3Rpb24odHlwZSkge1xuICAgICAgLy90eXBlID0gJ2N1cnJlbnQnIHx8IHR5cGUgPSAnaGlzdG9yeSdcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvJyt0eXBlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgY2FjaGVkQ2FydCA9IG9yZGVyLmRhdGFcbiAgICAgICAgcmV0dXJuIGNhY2hlZENhcnQgfHwgW11cbiAgICAgIH0pXG4gICAgfSxcbiAgICBjYWxjdWxhdGVUb3RhbDogZnVuY3Rpb24odHlwZSkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci8nK3R5cGUpXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICBjYWNoZWRDYXJ0ID0gb3JkZXIuZGF0YVxuICAgICAgICByZXR1cm4gY2FjaGVkQ2FydCB8fCBbXVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpIHtcbiAgICAgICAgaWYgKHR5cGU9PT0nY3VycmVudCcpIHtcbiAgICAgICAgICByZXR1cm4gY2FydC5yZWR1Y2UoZnVuY3Rpb24obywgaXRlbSkge3JldHVybiBvICsgKFxuICAgICAgICAgICAgaXRlbS5zb2NrLnByaWNlKml0ZW0ucXVhbnRpdHkpfSwgMClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gY2FydC5yZWR1Y2UoZnVuY3Rpb24obywgb3JkZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBvICsgb3JkZXIuaXRlbXMucmVkdWNlKGZ1bmN0aW9uKG8sIGl0ZW0pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG8gKyAoaXRlbS5zb2NrLnByaWNlKml0ZW0ucXVhbnRpdHkpfSwgMClcbiAgICAgICAgICB9LCAwKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gICAgdXBkYXRlSXRlbTogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucHV0KCcvYXBpL29yZGVyJywgb2JqKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5kYXRhIH0pXG4gICAgfSxcbiAgICBkZWxldGVJdGVtOiBmdW5jdGlvbihpdGVtSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5kZWxldGUoJy9hcGkvb3JkZXIvJytpdGVtSWQpXG4gICAgICAudGhlbihmdW5jdGlvbih0b1JlbW92ZSkge1xuICAgICAgICBjYWNoZWRDYXJ0LnNwbGljZShjYWNoZWRDYXJ0Lm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLmlkIH0pLmluZGV4T2YoaXRlbUlkKSwxKVxuICAgICAgICByZXR1cm4gY2FjaGVkQ2FydFxuICAgICAgfSlcbiAgICB9LFxuICAgIGVuc3VyZUNhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci9jcmVhdGVjYXJ0JylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKSB7XG4gICAgICAgIHJldHVybiB7ZXhpc3RzOiBvcmRlci5kYXRhfVxuICAgICAgfSlcbiAgICB9LFxuXG4gIH1cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY3VycmVudENhcnQnLCB7XG4gICAgdXJsOiAnL2NhcnQvY3VycmVudCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvb3JkZXIvY2FydC5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnY2FydEN1cnJlbnQnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGN1cnJlbnRDYXJ0OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuXHRcdFx0fVxuXHRcdH1cbiAgfSlcblxuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2FydEhpc3RvcnknLCB7XG4gICAgdXJsOiAnL2NhcnQvaGlzdG9yeScsXG4gICAgdGVtcGxhdGVVcmw6ICcvanMvb3JkZXIvcGFzdC5odG1sJyxcbiAgICBjb250cm9sbGVyOiAnY2FydEhpc3RvcnknLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGNhcnRIaXN0b3J5OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG4gICAgICAgIHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2hpc3RvcnknKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbn0pXG4iLCJhcHAuY29udHJvbGxlcignUGVyc29uYWxJbmZvQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UsIHRoZVVzZXIsIFBlcnNvbmFsSW5mb0ZhY3RvcnkpIHtcblxuXHQkc2NvcGUudXNlcklkID0gdGhlVXNlci5pZDtcblx0JHNjb3BlLmFkZHJlc3MxID0gdGhlVXNlci5hZGRyZXNzMTtcblx0JHNjb3BlLmFkZHJlc3MyID0gdGhlVXNlci5hZGRyZXNzMjtcblx0JHNjb3BlLnppcCA9IHRoZVVzZXIuemlwO1xuXHQkc2NvcGUuc3RhdGUgPSB0aGVVc2VyLnN0YXRlO1xuXHQkc2NvcGUuY291bnRyeSA9IHRoZVVzZXIuY291bnRyeTtcblx0JHNjb3BlLnBob25lID0gdGhlVXNlci5waG9uZTtcblx0JHNjb3BlLmRpc3BsYXlFcnJvciA9IGZhbHNlO1xuXG5cdC8vb25seSBhIHRlbXBvcmFyeSBzb2x1dGlvbiAtLSBjaGVja3MgdG8gc2VlIGlmIHVzZXIgaXMgYSBuZXcgdXNlciBieSBzZWVpbmcgaWYgdGhleSdyZSBsb2dnZWQgaW5cblxuXHQvLyAkc2NvcGUuY3VycmVudFVzZXJJc05ldyA9IGZ1bmN0aW9uKCkge1xuIC8vICAgXHRcdCByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcbiAvLyAgIFx0XHQudGhlbihmdW5jdGlvbih1c2VyKXtcbiAvLyAgICBcdFx0aWYgKCF1c2VyKSByZXR1cm4gJHNjb3BlLm5ld1VzZXIgPSB0cnVlO1xuIC8vICBcdFx0XHRlbHNlIHJldHVybiAkc2NvcGUubmV3VXNlciA9IGZhbHNlO1xuIC8vICAgIFx0fSlcbiAvLyBcdH1cblxuIC8vIFx0JHNjb3BlLmN1cnJlbnRVc2VySXNOZXcoKTtcblxuIFx0Y29uc29sZS5sb2coXCJoZWVlZWVlZWV5XCIpO1xuXG5cdCRzY29wZS5zdWJtaXRQZXJzb25hbCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdGlmICgoJHNjb3BlLmNvdW50cnkgPT09IFwiVW5pdGVkIFN0YXRlc1wiIHx8ICRzY29wZS5jb3VudHJ5ID09PSBcIkNhbmFkYVwiKSAmJiAkc2NvcGUuc3RhdGUgPT09IFwiXCIpIHtcblx0XHRcdCRzY29wZS5kaXNwbGF5RXJyb3IgPSB0cnVlO1xuXHRcdFx0cmV0dXJuICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIklmIGluIFVTIG9yIENhbmFkYSwgbXVzdCBpbmNsdWRlIFN0YXRlL1Byb3ZpbmNlXCI7XG5cdFx0fVxuXG5cdFx0dmFyIHVzZXJJbmZvID0ge1xuXHRcdFx0YWRkcmVzczEgOiAkc2NvcGUuYWRkcmVzczEsXG5cdFx0XHRhZGRyZXNzMiA6ICRzY29wZS5hZGRyZXNzMixcblx0XHRcdHppcCA6ICRzY29wZS56aXAsXG5cdFx0XHRzdGF0ZSA6ICRzY29wZS5zdGF0ZSxcblx0XHRcdGNvdW50cnkgOiAkc2NvcGUuY291bnRyeSxcblx0XHRcdHBob25lIDogJHNjb3BlLnBob25lXG5cdFx0fVxuXG5cdFx0cmV0dXJuIFBlcnNvbmFsSW5mb0ZhY3Rvcnkuc3VibWl0KCRzY29wZS51c2VySWQsIHVzZXJJbmZvKVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdC8vIGlmICgkc2NvcGUubmV3VXNlcikgXG5cdFx0XHRyZXR1cm4gJHN0YXRlLmdvKCdob21lJyk7XG5cdFx0XHQvLyBlbHNlIHJldHVybiAkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiAkc2NvcGUudXNlcklkfSk7XG5cdFx0fSlcblx0fVxuXG59KTsiLCJhcHAuZmFjdG9yeSgnUGVyc29uYWxJbmZvRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gIC8vIFBlcnNvbmFsRmFjdG9yeSA9IHt9O1xuXG4gIHJldHVybiB7XG4gICAgc3VibWl0IDogZnVuY3Rpb24oaWQsIHVzZXJJbmZvKXtcbiAgICAgIHJldHVybiAkaHR0cC5wdXQoJy9hcGkvdXNlci8nICsgaWQsIHVzZXJJbmZvKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwZXJzb25hbCcsIHtcblx0XHR1cmw6ICcvcGVyc29uYWwvOmlkJyxcblx0XHRjb250cm9sbGVyOiAnUGVyc29uYWxJbmZvQ3RybCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvcGVyc29uYWxpbmZvL3BlcnNvbmFsaW5mby52aWV3Lmh0bWwnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdHRoZVVzZXI6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFVzZXJGYWN0b3J5KXtcblx0XHRcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMuaWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59KTsiLCJhcHAuZmFjdG9yeSgnU29ja0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHAsICRzdGF0ZSkge1xuXG4gIHJldHVybiB7XG4gICAgc2luZ2xlU29jazogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBzb2NrQnlVc2VySWQ6IGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL2J5VXNlci8nICsgdXNlcklkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgbW9zdFJlY2VudFNvY2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgXHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svcmVjZW50JylcbiAgICBcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgIFx0XHRyZXR1cm4gcmVzLmRhdGFcbiAgICBcdH0pXG4gICAgfSxcblxuICAgIHNhdmVEZXNpZ246IGZ1bmN0aW9uIChuZXdTb2NrRGF0YU9iaikge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay8nLCBuZXdTb2NrRGF0YU9iailcbiAgICB9LFxuXG4gICAgcHJlcGFyZVRhZ3M6IGZ1bmN0aW9uICh0YWdJbnB1dCkge1xuICAgICAgcmV0dXJuIHRhZ0lucHV0LnNwbGl0KCcgJykubWFwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZSA9IGUucmVwbGFjZSgvLC9pLCBcIlwiKTtcbiAgICAgICAgZSA9IGUuc3Vic3RyaW5nKDEpO1xuICAgICAgICByZXR1cm4gZVxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHVwdm90ZTogZnVuY3Rpb24gKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay91cHZvdGUnLCB7aWQ6IHNvY2tJZH0pXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzLmRhdGEpXG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGRvd252b3RlOiBmdW5jdGlvbiAoc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9zb2NrL2Rvd252b3RlJywge2lkOiBzb2NrSWR9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGdldFVuc2lnbmVkVVJMOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svdW5zaWduZWRVUkwnKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICB9KVxuICAgIH0sXG4gICAgZGVsZXRlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svZGVsZXRlLycgKyBpZClcbiAgICAgIC50aGVuKCRzdGF0ZS5nbygnaG9tZScpKVxuICAgIH1cblxuICB9XG5cbn0pXG4iLCIvLyBhcHAuY29udHJvbGxlcignc29ja1ZpZXdDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgU29ja0ZhY3RvcnksIFJldmlld0ZhY3RvcnkpIHtcblxuLy8gICAkc2NvcGUuc2V0U29jayA9IGZ1bmN0aW9uKHNvY2tJZCkge1xuLy8gICAgIHJldHVybiBTb2NrRmFjdG9yeS5zaW5nbGVTb2NrKHNvY2tJZCkgLy8gcmV0dXJuP1xuLy8gICAgIC50aGVuKGZ1bmN0aW9uKHNvY2spIHtcbi8vICAgICAgICRzY29wZS5zb2NrID0gc29ja1xuLy8gICAgIH0pXG4vLyAgIH1cblxuLy8gICAkc2NvcGUuc2V0UmV2aWV3cyA9IGZ1bmN0aW9uKHNvY2tJZCkge1xuLy8gICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LnByb2R1Y3RSZXZpZXdzKHNvY2tJZClcbi8vICAgICAudGhlbihmdW5jdGlvbihyZXZpZXdzKSB7XG4vLyAgICAgICAkc2NvcGUucmV2aWV3cyA9IHJldmlld3Ncbi8vICAgICB9KVxuLy8gICB9XG5cbi8vICAgJHNjb3BlLnNldFNvY2soMSk7XG4vLyAgICRzY29wZS5zZXRSZXZpZXdzKDEpO1xuXG4vLyAgICRzY29wZS5uZXdSZXZpZXcgPSBmdW5jdGlvbigpIHtcbi8vICAgICB2YXIgbmV3UmV2aWV3ID0ge1xuLy8gICAgICAgdGV4dDogJHNjb3BlLnJldmlld1RleHQsXG4vLyAgICAgICBzb2NrSWQ6ICRzY29wZS5zb2NrLmlkXG4vLyAgICAgfVxuLy8gICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LnBvc3RSZXZpZXcobmV3UmV2aWV3KVxuLy8gICAgIC50aGVuKGZ1bmN0aW9uKG5ld1Jldmlldyl7XG4vLyAgICAgICB2YXIgcmV2aWV3ID0ge307XG4vLyAgICAgICByZXZpZXcudXNlciA9IHt9O1xuXG4vLyAgICAgICAgIHJldmlldy51c2VyLmZpcnN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5maXJzdF9uYW1lO1xuLy8gICAgICAgICByZXZpZXcudXNlci5sYXN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5sYXN0X25hbWU7XG4vLyAgICAgICAgIHJldmlldy51c2VyLnByb2ZpbGVfcGljID0gbmV3UmV2aWV3LnVzZXIucHJvZmlsZV9waWM7XG4vLyAgICAgICAgIHJldmlldy51c2VyLnVzZXJuYW1lID0gbmV3UmV2aWV3LnVzZXIudXNlcm5hbWU7XG4vLyAgICAgICAgIHJldmlldy50ZXh0ID0gbmV3UmV2aWV3LnJldmlldy50ZXh0O1xuXG4vLyAgICAgICAkc2NvcGUucmV2aWV3cy5wdXNoKHJldmlldyk7XG4vLyAgICAgICAkc2NvcGUucmV2aWV3VGV4dCA9IG51bGw7XG4vLyAgICAgfSlcbi8vICAgfVxuXG4vLyAgICRzY29wZS5hbHJlYWR5UG9zdGVkID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgLy8gYWRkIGluIGFmdGVyIGZpbmlzaGluZyBvdGhlciBzdHVmZlxuLy8gICB9XG5cbi8vIH0pO1xuXG4vLyBhcHAuY29udHJvbGxlcignc29ja0lkQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCB0aGVTb2NrLCB0aGVSZXZpZXdzLCBSZXZpZXdGYWN0b3J5LCBPcmRlckZhY3RvcnksIEF1dGhTZXJ2aWNlKSB7XG5cbi8vICAgLy8gJHNjb3BlLmRhdGVQYXJzZXIgPSBmdW5jdGlvbihkYXRlKXtcblxuLy8gICAvLyAgIC8vcmV0dXJuIHRvIHRoaXMgbGF0ZXIuIFdvdWxkIGJlIGdvb2QgaWYgc29ja3MgYW5kIHJldmlld3Mgc3RhdGVkIHdoZW4gdGhleSB3ZXJlIHBvc3RlZFxuXG4gIC8vICAgLy9zaG91bGQgYWRkIGl0IHRvIGEgZmFjdG9yeSwgYmVjYXVzZSBtYW55IHBhZ2VzIGNhbiBtYWtlIHVzZSBvZiBpdFxuXG4gIC8vICAgdmFyIG1vbnRoT2JqID0ge1xuICAvLyAgICAgJzAxJzogXCJKYW51YXJ5XCIsXG4gIC8vICAgICAnMDInOiBcIkZlYnJ1YXJ5XCIsXG4gIC8vICAgICAnMDMnOiBcIk1hcmNoXCIsXG4gIC8vICAgICAnMDQnOiBcIkFwcmlsXCIsXG4gIC8vICAgICAnMDUnOiBcIk1heVwiLFxuICAvLyAgICAgJzA2JzogXCJKdW5lXCIsXG4gIC8vICAgICAnMDcnOiBcIkp1bHlcIixcbiAgLy8gICAgICcwOCc6IFwiQXVndXN0XCIsXG4gIC8vICAgICAnMDknOiBcIlNlcHRlbWJlclwiLFxuICAvLyAgICAgJzEwJzogXCJPY3RvYmVyXCIsXG4gIC8vICAgICAnMTEnOiBcIk5vdmVtYmVyXCIsXG4gIC8vICAgICAnMTInOiBcIkRlY2VtYmVyXCJcbiAgLy8gICB9XG5cbiAgLy8gfVxuXG5hcHAuY29udHJvbGxlcignc29ja0lkQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UsICRzdGF0ZVBhcmFtcywgdGhlU29jaywgdGhlUmV2aWV3cywgUmV2aWV3RmFjdG9yeSwgT3JkZXJGYWN0b3J5LCBTb2NrRmFjdG9yeSwgVXNlckZhY3RvcnkpIHtcblxuXG5cbiAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSBmYWxzZTtcbiAgJHNjb3BlLnNvY2sgPSB0aGVTb2NrO1xuICAkc2NvcGUucmV2aWV3cyA9IHRoZVJldmlld3M7XG5cbiAgJHNjb3BlLmFsZXJ0ID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICRzY29wZS5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nXG4gICAgICAkc2NvcGUuJGRpZ2VzdCgpXG4gICAgfSwgMzAwMClcbiAgICAvLyBpZiAoISRzY29wZS5hbGVydGluZykgJHNjb3BlLm1lc3NhZ2UgPT09IG51bGxcbiAgfVxuXG4gICRzY29wZS5nb1RvVXNlclBhZ2UgPSBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiB1c2VySWR9KTtcbiAgfVxuXG4gICRzY29wZS5hZGRJdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW0gPSB7fTtcbiAgICBpdGVtLnNvY2tJZCA9ICRzY29wZS5zb2NrLmlkO1xuICAgIGl0ZW0ucXVhbnRpdHkgPSArJHNjb3BlLnF1YW50aXR5O1xuICAgIGl0ZW0ub3JpZ2luYWxQcmljZSA9ICskc2NvcGUuc29jay5wcmljZTtcbiAgICBpZiAoaXRlbS5xdWFudGl0eSA+IDApIHtcbiAgICAgIE9yZGVyRmFjdG9yeS5hZGRUb0NhcnQoaXRlbSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzcG9uc2UgIT09IFwib2JqZWN0XCIpICRzY29wZS5hbGVydChyZXNwb25zZSk7XG4gICAgICAgIGVsc2UgJHN0YXRlLmdvKCdjdXJyZW50Q2FydCcpO1xuICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSAkc2NvcGUuYWxlcnQoJ1lvdSBoYXZlIHRvIGFkZCBhdCBsZWFzdCBvbmUgc29jayEnKTtcbiAgfVxuXG4gICRzY29wZS5kaXNwbGF5VGFncyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkc2NvcGUuc29jay50YWdzLm1hcChmdW5jdGlvbih0YWcpe1xuICAgICAgcmV0dXJuICcjJyArIHRhZztcbiAgICB9KS5qb2luKFwiLCBcIik7XG4gIH1cblxuICAkc2NvcGUuZGlzcGxheVRhZ3MoKTtcblxuICAkc2NvcGUuZ2V0TG9nZ2VkSW5Vc2VySWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcbiAgICAudGhlbihmdW5jdGlvbih1c2VyKXtcbiAgICAgIGNvbnNvbGUubG9nKHVzZXIpO1xuICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICRzY29wZS5sb2dnZWRJblVzZXJJZCA9ICdub25lJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5sb2dnZWRJblVzZXJJZCA9IHVzZXIuaWQ7XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gICRzY29wZS5nZXRMb2dnZWRJblVzZXJJZCgpO1xuXG4gICRzY29wZS51c2VyQ2Fubm90UG9zdFJldmlldyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJHNjb3BlLnJldmlld05vdEFsbG93ZWQ7XG4gIH1cblxuICAkc2NvcGUudXNlckNhbm5vdFBvc3RSZXZpZXcoKTtcblxuICAkc2NvcGUubmV3UmV2aWV3ID0gZnVuY3Rpb24oKSB7XG5cbiAgLy9pZiB1c2VyIGhhcyBhbHJlYWR5IHJldmlldyBzb2NrLCBkb24ndCBhbGxvdyB1c2VyIHRvIHJldmlldyBpdCBhZ2FpblxuICAgIHZhciB1c2Vyc1dob1Jldmlld2VkU29jayA9ICRzY29wZS5yZXZpZXdzLm1hcChmdW5jdGlvbihyZXZpZXcpe1xuICAgICAgcmV0dXJuIHJldmlldy51c2VySWQ7XG4gICAgfSlcblxuICAgIGlmICgkc2NvcGUubG9nZ2VkSW5Vc2VySWQgPT09ICdub25lJykge1xuICAgICAgJHNjb3BlLnJldmlld0Vycm9yTWVzc2FnZSA9IFwiWW91IG11c3QgYmUgbG9nZ2VkIGluIHRvIHJldmlldyBhIHNvY2shXCI7XG4gICAgICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh1c2Vyc1dob1Jldmlld2VkU29jay5pbmRleE9mKCRzY29wZS5sb2dnZWRJblVzZXJJZCkgIT09IC0xKSB7XG4gICAgICAkc2NvcGUucmV2aWV3RXJyb3JNZXNzYWdlID0gXCJZb3UndmUgYWxyZWFkeSByZXZpZXdlZCB0aGlzIHNvY2shIFlvdSBjYW4ndCByZXZpZXcgaXQgYWdhaW4hXCI7XG4gICAgICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IHRydWU7XG4gIC8vaWYgc29jayBpZCBtYXRjaGVzIHVzZXIgaWQsIHVzZXIgZG9uJ3QgYWxsb3cgdXNlciB0byBwb3N0IGEgcmV2aWV3XG4gICAgfSBlbHNlIGlmICgkc2NvcGUubG9nZ2VkSW5Vc2VySWQgPT09ICRzY29wZS5zb2NrLnVzZXIuaWQpIHtcbiAgICAgICRzY29wZS5yZXZpZXdFcnJvck1lc3NhZ2UgPSBcIllvdSBjYW4ndCByZXZpZXcgeW91ciBvd24gc29jayFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICB2YXIgbmV3UmV2aWV3ID0ge1xuICAgICAgICB0ZXh0OiAkc2NvcGUucmV2aWV3VGV4dCxcbiAgICAgICAgc29ja0lkOiAkc2NvcGUuc29jay5pZFxuICAgICAgfVxuICAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucG9zdFJldmlldyhuZXdSZXZpZXcpXG4gICAgICAudGhlbihmdW5jdGlvbihuZXdSZXZpZXcpe1xuICAgICAgICB2YXIgcmV2aWV3ID0ge307XG4gICAgICAgIHJldmlldy51c2VyID0ge307XG5cbiAgICAgICAgICByZXZpZXcudXNlci5maXJzdF9uYW1lID0gbmV3UmV2aWV3LnVzZXIuZmlyc3RfbmFtZTtcbiAgICAgICAgICByZXZpZXcudXNlci5sYXN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5sYXN0X25hbWU7XG4gICAgICAgICAgcmV2aWV3LnVzZXIucHJvZmlsZV9waWMgPSBuZXdSZXZpZXcudXNlci5wcm9maWxlX3BpYztcbiAgICAgICAgICByZXZpZXcudXNlci51c2VybmFtZSA9IG5ld1Jldmlldy51c2VyLnVzZXJuYW1lO1xuICAgICAgICAgIHJldmlldy50ZXh0ID0gbmV3UmV2aWV3LnJldmlldy50ZXh0O1xuXG4gICAgICAgICRzY29wZS5yZXZpZXdzLnB1c2gocmV2aWV3KTtcbiAgICAgICAgJHNjb3BlLnJldmlld1RleHQgPSBudWxsO1xuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAkc2NvcGUudXB2b3RlID0gZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgcmV0dXJuIFNvY2tGYWN0b3J5LnVwdm90ZShzb2NrSWQpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgJHNjb3BlLnNvY2sudXB2b3RlcysrXG4gICAgfSlcbiAgfVxuICBcbiAgJHNjb3BlLmRvd252b3RlID0gZnVuY3Rpb24gKHNvY2tJZCkge1xuICAgIHJldHVybiBTb2NrRmFjdG9yeS5kb3dudm90ZShzb2NrSWQpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgJHNjb3BlLnNvY2suZG93bnZvdGVzKytcbiAgICB9KVxuICB9XG5cbiAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gdXNlci5pZCA9PSAkc2NvcGUuc29jay5Vc2VySWQgfHwgdXNlci5pc0FkbWluPyB0cnVlIDogZmFsc2VcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICRzY29wZS52ZXJpZnlVc2VyID0gcmVzdWx0XG4gICAgfSk7XG5cbiAgJHNjb3BlLmRlbGV0ZSA9IFNvY2tGYWN0b3J5LmRlbGV0ZVxuXG59KTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgIC8vIFJlZ2lzdGVyIG91ciAqYWJvdXQqIHN0YXRlLlxuICAgIC8vICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzb2NrcycsIHtcbiAgICAvLyAgICAgdXJsOiAnL3NvY2tzJyxcbiAgICAvLyAgICAgY29udHJvbGxlcjogJ3NvY2tWaWV3Q29udHJvbGxlcicsXG4gICAgLy8gICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuaHRtbCdcbiAgICAvLyB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVTb2NrVmlldycsIHtcbiAgICAgIHVybDonL3NvY2tzLzppZCcsXG4gICAgICBjb250cm9sbGVyOiAnc29ja0lkQ29udHJvbGxlcicsXG4gICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3Lmh0bWwnLFxuICAgICAgcmVzb2x2ZToge1xuICAgICAgICB0aGVTb2NrOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBTb2NrRmFjdG9yeSkge1xuICAgICAgICAgIHJldHVybiBTb2NrRmFjdG9yeS5zaW5nbGVTb2NrKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgfSxcbiAgICAgICAgdGhlUmV2aWV3czogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgUmV2aWV3RmFjdG9yeSkge1xuICAgICAgICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LnByb2R1Y3RSZXZpZXdzKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG5cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1Jldmlld0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICByZXR1cm4ge1xuICAgIHBvc3RSZXZpZXc6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvcmV2aWV3LycsIG9iailcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcbiAgICBwcm9kdWN0UmV2aWV3czogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Jldmlldy9zb2NrLycrc29ja0lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZWFyY2hSZXN1bHRzJywge1xuXHRcdHVybDogJy9zZWFyY2gvOnNlYXJjaFRlcm1zJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9zZWFyY2hyZXN1bHRzL3NlYXJjaC52aWV3Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6IFwic2VhcmNoQ3RybFwiLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGFsbFJlc3VsdHM6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFNlYXJjaEZhY3RvcnkpIHtcblx0XHRcdFx0cmV0dXJuIFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dCgkc3RhdGVQYXJhbXMuc2VhcmNoVGVybXMpXG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvLyBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBhbGxSZXN1bHRzKSB7XG5cdFx0Ly8gXHQkc2NvcGUucmVzdWx0cyA9IGFsbFJlc3VsdHM7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhcIkFsbCBSZXN1bHRzISFcIiwgYWxsUmVzdWx0cyk7XG5cdFx0Ly8gXHQkc2NvcGUubnVtYmVyID0gMTIzO1xuXHRcdC8vIH1cblx0XHQvLyBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGVQYXJhbXMpIHtcblx0XHQvLyBcdGNvbnNvbGUubG9nKFwiSEVSRUVFRUVcIiwgJHN0YXRlUGFyYW1zLnJlc3VsdHMpXG5cdFx0Ly8gXHQkc2NvcGUucmVzdWx0cyA9ICRzdGF0ZVBhcmFtcy5yZXN1bHRzXG5cdFx0Ly8gfVxuXHR9KVxufSlcbiIsImFwcC5jb250cm9sbGVyKCdTaWdudXBDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgU2lnbnVwRmFjdG9yeSwgJHN0YXRlKSB7XG5cbiAgZnVuY3Rpb24gcGFzc3dvcmRWYWxpZCAocGFzc3dvcmQpIHtcbiAgICBpZiAocGFzc3dvcmQubGVuZ3RoIDwgNikge1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJQYXNzd29yZCBtdXN0IGJlIDYgY2hhcmFjdGVycyBsb25nIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAocGFzc3dvcmQgIT09ICRzY29wZS5wdzIpIHtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiVGhlIHBhc3N3b3JkIGZpZWxkcyBkb24ndCBtYXRjaCFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKC9cXFcvLnRlc3QocGFzc3dvcmQpKXtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiUGFzc3dvcmQgY2Fubm90IGNvbnRhaW4gc3BlY2lhbCBjaGFyYWN0ZXJzIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAkc2NvcGUuc2hvd0Vycm9yID0gZmFsc2U7XG5cbiAgJHNjb3BlLmRpc3BsYXlFcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkc2NvcGUuc2hvd0Vycm9yO1xuICB9XG5cbiAgJHNjb3BlLnN1Ym1pdFNpZ251cCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAocGFzc3dvcmRWYWxpZCgkc2NvcGUucGFzc3dvcmQpKXtcbiAgICAgIGNvbnNvbGUubG9nKFwibm93IEkgZG9uJ3Qgd29yayFcIik7XG4gICAgICByZXR1cm4gU2lnbnVwRmFjdG9yeS5zdWJtaXQoe1xuICAgICAgIGVtYWlsOiAkc2NvcGUuZW1haWwsXG4gICAgICAgdXNlcm5hbWU6ICRzY29wZS51c2VybmFtZSxcbiAgICAgICBwYXNzd29yZDogJHNjb3BlLnBhc3N3b3JkLFxuICAgICAgIGZpcnN0X25hbWU6ICRzY29wZS5maXJzdG5hbWUsXG4gICAgICAgbGFzdF9uYW1lOiAkc2NvcGUubGFzdG5hbWUsXG4gICAgICAgaXNBZG1pbjogZmFsc2UsXG4gICAgICAgbmV3VXNlcjogdHJ1ZVxuICAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgLy8gcmVzcG9uc2UubmV3VXNlciA9IHRydWU7XG4gICAgICAgIHJldHVybiAkc3RhdGUuZ28oJ3BlcnNvbmFsJywge2lkOiByZXNwb25zZS5pZH0pO1xuICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG59KTsiLCIvLyBhcHAuZmFjdG9yeSgnU2lnbnVwRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4vLyAgIHZhciBTaWdudXBGYWN0b3J5ID0ge307XG5cbi8vICAgU2lnbnVwRmFjdG9yeS5zdWJtaXQgPSBmdW5jdGlvbih1c2VySW5mbyl7XG4vLyAgIFx0Y29uc29sZS5sb2codXNlckluZm8pO1xuLy8gICBcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvJywgdXNlckluZm8pXG4vLyAgIFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuLy8gICBcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4vLyAgIFx0fSlcbi8vICAgfVxuXG4vLyAgIHJldHVybiBTaWdudXBGYWN0b3J5O1xuXG4vLyB9KVxuXG5hcHAuZmFjdG9yeSgnU2lnbnVwRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXHR2YXIgU2lnbnVwRmFjdG9yeSA9IHt9O1xuXG5cdFNpZ251cEZhY3Rvcnkuc3VibWl0ID0gZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG5cdFx0Y29uc29sZS5sb2coXCJGcm9tIFNpZ251cCBGYWN0b3J5XCIsIHVzZXJJbmZvKTtcblx0XHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2VyLycsIHVzZXJJbmZvKVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuXHRcdH0pXG5cdH1cblx0cmV0dXJuIFNpZ251cEZhY3Rvcnk7XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ251cCcsIHtcblx0XHR1cmw6ICcvc2lnbnVwJyxcblx0XHRjb250cm9sbGVyOiAnU2lnbnVwQ3RybCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvc2lnbnVwL3NpZ251cC52aWV3Lmh0bWwnXG5cdH0pO1xuXG59KTsiLCJhcHAuY29udHJvbGxlcignVXNlckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIHRoZVVzZXIsIHRoZVVzZXJTb2NrcywgQXV0aFNlcnZpY2UsIFVzZXJGYWN0b3J5KSB7XG4gICAgY29uc29sZS5sb2coXCJjb250cm9sbGVyXCIsIHRoZVVzZXJTb2Nrcyk7XG5cdCRzY29wZS51c2VyID0gdGhlVXNlcjtcblx0JHNjb3BlLnNvY2tzID0gdGhlVXNlclNvY2tzO1xuXG5cdCRzY29wZS50b1NoaXBwaW5nSW5mbyA9IGZ1bmN0aW9uKGlkKXtcblx0XHQkc3RhdGUuZ28oJ3BlcnNvbmFsJywge2lkOiBpZH0pO1xuXHR9O1xuXG5cdCRzY29wZS50b1NvY2tWaWV3ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0JHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KVxuXHR9O1xuXG5cdEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIHVzZXIuaWQgPT0gJHNjb3BlLnVzZXIuaWQgfHwgdXNlci5pc0FkbWluID8gdHJ1ZSA6IGZhbHNlXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgXHRjb25zb2xlLmxvZyhyZXN1bHQpXG4gICAgXHQkc2NvcGUudmVyaWZ5VXNlciA9IHJlc3VsdFxuICAgIH0pO1xuXG4gICAgJHNjb3BlLmRlbGV0ZSA9IFVzZXJGYWN0b3J5LmRlbGV0ZVxufSlcbiIsImFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlKSB7XG5cdHZhciBVc2VyRmFjdG9yeSA9IHt9O1xuXG5cdFVzZXJGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlci8nICsgaWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImZhY3RvcnlcIiwgcmVzcG9uc2UuZGF0YSlcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhXG5cdFx0fSlcblx0fVxuXG5cdFVzZXJGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlcnMnKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGFcblx0XHR9KVxuXHR9XG5cblx0VXNlckZhY3RvcnkuZGVsZXRlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci9kZWxldGUvJyArIGlkKVxuXHRcdC50aGVuKCRzdGF0ZS5nbygnaG9tZScpKVxuXHR9XG5cblx0cmV0dXJuIFVzZXJGYWN0b3J5O1xufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1c2VyJywge1xuXHRcdHVybDogJy91c2VyLzp1c2VySWQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3VzZXIvdXNlci1wcm9maWxlLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdVc2VyQ3RybCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0dGhlVXNlcjogZnVuY3Rpb24gKFVzZXJGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMudXNlcklkKTtcblx0XHRcdH0sXG5cdFx0XHR0aGVVc2VyU29ja3M6IGZ1bmN0aW9uIChTb2NrRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHJldHVybiBTb2NrRmFjdG9yeS5zb2NrQnlVc2VySWQoJHN0YXRlUGFyYW1zLnVzZXJJZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxufSlcbiIsImFwcC5jb250cm9sbGVyKCduYXZiYXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBTZWFyY2hGYWN0b3J5KSB7XG5cblx0JHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uKHNlYXJjaFRlcm1zKXtcblx0XHQvLyBTZWFyY2hGYWN0b3J5LmZpbmRCeVNlYXJjaFRleHQoc2VhcmNoVGVybXMpXG5cdFx0Ly8gLnRoZW4oZnVuY3Rpb24ocmVzdWx0cyl7XG5cdFx0Ly8gXHQkc2NvcGUucmVzdWx0cyA9IHJlc3VsdHM7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhyZXN1bHRzKTtcblx0XHRcdHJldHVybiAkc3RhdGUuZ28oJ3NlYXJjaFJlc3VsdHMnLCB7c2VhcmNoVGVybXM6IHNlYXJjaFRlcm1zfSk7XG5cdFx0Ly8gfSlcblx0fVxufSlcblxuYXBwLmNvbnRyb2xsZXIoJ3NlYXJjaEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIGFsbFJlc3VsdHMsICRzdGF0ZVBhcmFtcykge1xuXHQkc2NvcGUucmVzdWx0cyA9IGFsbFJlc3VsdHM7XG5cdCRzY29wZS5zZWVTb2NrID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0JHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KVxuXHR9XG59KSIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5mYWN0b3J5KFwiU2VhcmNoRmFjdG9yeVwiLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0dmFyIFNlYXJjaEZhY3RvcnkgPSB7fTtcblxuXHRTZWFyY2hGYWN0b3J5LmZpbmRCeVNlYXJjaFRleHQgPSBmdW5jdGlvbiAodGV4dCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc2VhcmNoLz9xPScgKyB0ZXh0KVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdHMpIHtcblx0XHRcdHJldHVybiByZXN1bHRzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiBTZWFyY2hGYWN0b3J5O1xufSkiLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlLCBPcmRlckZhY3RvcnkpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgT3JkZXJGYWN0b3J5LmVuc3VyZUNhcnQoKVxuXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnSG9tZScsIHN0YXRlOiAnaG9tZScgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTXkgUHJvZmlsZScsIHN0YXRlOiAndXNlcih7dXNlcklkOnVzZXIuaWR9KScsIGF1dGg6IHRydWUgfSxcbiAgICAgICAgICAgICAgICAvLyB7IGxhYmVsOiAnQWJvdXQnLCBzdGF0ZTogJ2Fib3V0JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdEZXNpZ24gYSBTb2NrJywgc3RhdGU6ICdkZXNpZ25WaWV3JyB9LFxuICAgICAgICAgICAgICAgIC8vIHsgbGFiZWw6ICdBZG1pbiBEYXNoYm9hcmQnLCBzdGF0ZTogJ2FkbWluJ31cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHNjb3BlLmFkbWluSXRlbXMgPSBbXG4gICAgICAgICAgICAgICAge2xhYmVsOiAnQWRtaW4gRGFzaGJvYXJkJywgc3RhdGU6ICdhZG1pbid9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldFVzZXIoKVxuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnb2F1dGhCdXR0b24nLCBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB7XG4gICAgc2NvcGU6IHtcbiAgICAgIHByb3ZpZGVyTmFtZTogJ0AnXG4gICAgfSxcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvb2F1dGgtYnV0dG9uL29hdXRoLWJ1dHRvbi5odG1sJ1xuICB9XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLmdyZWV0aW5nID0gUmFuZG9tR3JlZXRpbmdzLmdldFJhbmRvbUdyZWV0aW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
