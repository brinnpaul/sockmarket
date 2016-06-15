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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNoZWNrb3V0L2NoZWNrb3V0LmNvbnRyb2xsZXIuanMiLCJjaGVja291dC9jaGVja291dC5mYWN0b3J5LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuc3RhdGUuanMiLCJhYm91dC9hYm91dC5qcyIsImRlc2lnbi9kZXNpZ24tZGlyZWN0aXZlLmpzIiwiZGVzaWduL2Rlc2lnbi5jb250cm9sbGVyLmpzIiwiZGVzaWduL2Rlc2lnbi5qcyIsImRlc2lnbi9kZXNpZ24uc3RhdGUuanMiLCJkb2NzL2RvY3MuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm9yZGVyL29yZGVyLmNvbnRyb2xsZXIuanMiLCJvcmRlci9vcmRlci5kaXJlY3RpdmUuanMiLCJvcmRlci9vcmRlci5mYWN0b3J5LmpzIiwib3JkZXIvb3JkZXIuc3RhdGUuanMiLCJwZXJzb25hbGluZm8vcGVyc29uYWxpbmZvLmNvbnRyb2xsZXIuanMiLCJwZXJzb25hbGluZm8vcGVyc29uYWxpbmZvLmZhY3RvcnkuanMiLCJwZXJzb25hbGluZm8vcGVyc29uYWxpbmZvLnN0YXRlLmpzIiwicHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuZmFjdG9yeS5qcyIsInByb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3LmpzIiwicmV2aWV3L3Jldmlldy5mYWN0b3J5LmpzIiwic2VhcmNocmVzdWx0cy9zZWFyY2guc3RhdGUuanMiLCJzaWdudXAvc2lnbnVwLmNvbnRyb2xsZXIuanMiLCJzaWdudXAvc2lnbnVwLmZhY3RvcnkuanMiLCJzaWdudXAvc2lnbnVwLnN0YXRlLmpzIiwidXNlci91c2VyLWNvbnRyb2xsZXIuanMiLCJ1c2VyL3VzZXItZmFjdG9yeS5qcyIsInVzZXIvdXNlci1zdGF0ZXMuanMiLCJjb21tb24vY29udHJvbGxlcnMvbmF2YmFyLmNvbnRyb2xsZXIuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvc2VhcmNoLmZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmRpcmVjdGl2ZS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsWUFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLFFBQUEsQ0FBQSxDQUFBOztBQUVBLElBQUEsTUFBQSxDQUFBLFVBQUEsa0JBQUEsRUFBQSxpQkFBQSxFQUFBOztBQUVBLG9CQUFBLFNBQUEsQ0FBQSxJQUFBOztBQUVBLHFCQUFBLFNBQUEsQ0FBQSxHQUFBOztBQUVBLHFCQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBLFFBQUEsQ0FBQSxNQUFBO0FBQ0EsR0FGQTtBQUdBLFNBQUEsaUJBQUEsQ0FBQSxrQ0FBQTtBQUNBLENBVkE7OztBQWFBLElBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7OztBQUdBLE1BQUEsK0JBQUEsU0FBQSw0QkFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLFdBQUEsTUFBQSxJQUFBLElBQUEsTUFBQSxJQUFBLENBQUEsWUFBQTtBQUNBLEdBRkE7Ozs7QUFNQSxhQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsUUFBQSxDQUFBLDZCQUFBLE9B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S0FEQTtBQUVBLHVCQUFBLFdBRkE7QUFHQSxnQkFBQTtBQUhBLFNBQUE7O0FBTUEsaUJBQUEsYUFBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLGNBQUEsU0FBQSxLQUFBLFFBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsUUFBQSxFQUFBO0FBQ0EsZUFBQSxJQUFBLElBQUEsQ0FBQSxFQUFBLElBQUEsT0FBQSxNQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsSUFBQSxDQUFBLE9BQUEsVUFBQSxDQUFBLENBQUEsQ0FBQTtBQUNBO0FBQ0EsaUJBQUEsSUFBQSxJQUFBLENBQUEsQ0FBQSxJQUFBLFVBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxFQUFBLEVBQUEsTUFBQSxXQUFBLEVBQUEsQ0FBQTtBQUNBOztBQUVBLFlBQUEsVUFBQSxPQUFBLFNBQUEsQ0FBQSxXQUFBLENBQUE7QUFDQSxZQUFBLFdBQUEsY0FBQSxPQUFBLENBQUE7O0FBRUEsb0JBQUEsY0FBQSxHQUNBLElBREEsQ0FDQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGNBQUEsV0FBQSxJQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQTs7QUFFQSxnQkFBQSxHQUFBLENBQUEsSUFBQSxHQUFBLEVBQUEsUUFBQSxFQUNBLEVBQUEsU0FBQTtBQUNBLDhCQUFBLFdBREE7QUFFQSxtQkFBQTtBQUZBLGFBQUEsRUFEQSxFQUtBLElBTEEsQ0FLQSxVQUFBLEdBQUEsRUFBQTtBQUNBLDJCQUFBLEtBQUEsR0FBQSxRQUFBO0FBQ0Esd0JBQUEsVUFBQSxDQUFBLGNBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxNQUFBLEVBQUE7QUFDQSxxQkFBQSxFQUFBLENBQUEsTUFBQSxFQUFBLEVBQUEsUUFBQSxPQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxhQUhBO0FBSUEsV0FYQTtBQVlBLFNBaEJBO0FBaUJBLE9BdkNBOztBQTBDQSxVQUFBLFFBQUEsRUFBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7QUFDQSxVQUFBLFVBQUEsRUFBQSxRQUFBLEVBQUEsQ0FBQSxFQUFBLFVBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxVQUFBLFVBQUEsRUFBQSxRQUFBLENBQUE7QUFDQSxVQUFBLFNBQUE7QUFDQSxVQUFBLFlBQUEsS0FBQTs7QUFFQSxVQUFBLGFBQUEsSUFBQSxLQUFBLEVBQUE7O0FBRUEsaUJBQUEsR0FBQSxHQUFBLGdCQUFBOztBQUVBLGlCQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsU0FBQSxDQUFBLFVBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQTtBQUNBLE9BRkE7OztBQUtBLFFBQUEsV0FBQSxFQUFBLEVBQUEsQ0FBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLFlBQUE7O0FBRUEsVUFBQSxJQUFBLEVBQUEsUUFBQSxHQUFBLFdBQUEsQ0FBQSxVQUFBOztBQUVBLFVBQUEsSUFBQSxFQUFBLFFBQUEsQ0FBQSxVQUFBOztBQUVBLGdCQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxDQUFBO0FBQ0EsT0FQQTs7O0FBVUEsUUFBQSxvQkFBQSxFQUFBLEtBQUEsQ0FBQSxZQUFBOztBQUVBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsTUFBQTtBQUNBLE9BSkE7OztBQU9BLGVBQUEsV0FBQSxHQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLFFBQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsVUFBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLEVBQUEsU0FBQSxDQUFBLEdBQUEsSUFBQSxHQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLEdBQUE7O0FBSUE7O0FBRUEsUUFBQSxtQkFBQSxFQUFBLEVBQUEsQ0FBQSxPQUFBLEVBQUEsV0FBQTs7O0FBR0EsUUFBQSxjQUFBLEVBQUEsS0FBQSxDQUFBLFlBQUE7O0FBRUEsWUFBQSxZQUFBLEVBQUEsV0FBQSxDQUFBO0FBQ0Esa0JBQUEsR0FBQSxDQUFBLGtCQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7QUFDQSxVQUFBLGNBQUEsRUFBQSxNQUFBLENBQUEsU0FBQTtBQUNBLFVBQUEsY0FBQSxFQUFBLFFBQUEsR0FBQSxXQUFBLENBQUEsVUFBQTtBQUNBLFVBQUEsY0FBQSxFQUFBLElBQUEsR0FBQSxRQUFBLENBQUEsVUFBQTtBQUNBLGdCQUFBLEVBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxDQUFBOztBQUVBLFVBQUEsY0FBQSxFQUFBLElBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsR0FBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLFFBQUEsRUFBQSxHQUFBLENBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsT0FBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxVQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxTQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsR0FBQTtBQUVBLE9BZkE7OztBQWtCQSxjQUFBLFNBQUEsQ0FBQSxVQUFBLENBQUEsRUFBQTtBQUNBLG9CQUFBLENBQUE7QUFDQSxvQkFBQSxJQUFBO0FBQ0EsT0FIQSxFQUdBLFNBSEEsQ0FHQSxVQUFBLENBQUEsRUFBQTs7QUFFQSxZQUFBLFNBQUEsRUFBQTtBQUNBLGtCQUFBLFNBQUE7QUFDQSxrQkFBQSxNQUFBLENBQUEsVUFBQSxPQUFBLEVBQUEsVUFBQSxPQUFBO0FBQ0Esa0JBQUEsTUFBQSxDQUFBLEVBQUEsT0FBQSxFQUFBLEVBQUEsT0FBQTtBQUNBLGtCQUFBLFdBQUEsR0FBQSxLQUFBO0FBQ0Esa0JBQUEsTUFBQTtBQUNBLGtCQUFBLE9BQUEsR0FBQSxPQUFBO0FBQ0Esa0JBQUEsU0FBQSxHQUFBLEVBQUE7O0FBRUEsc0JBQUEsQ0FBQTtBQUNB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YUFGQTtBQUdBLFdBQUEsWUFBQSxjQUhBO0FBSUEsV0FBQSxZQUFBO0FBSkEsS0FBQTtBQU1BLFdBQUE7QUFDQSxxQkFBQSx1QkFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxVQUFBLENBQUEsV0FBQSxTQUFBLE1BQUEsQ0FBQSxFQUFBLFFBQUE7QUFDQSxlQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQTtBQUNBO0FBSkEsS0FBQTtBQU1BLEdBYkE7O0FBZUEsTUFBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxrQkFBQSxZQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsV0FEQSxFQUVBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsYUFBQSxVQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsS0FKQSxDQUFBO0FBTUEsR0FQQTs7QUFTQSxNQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGFBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxVQUFBLE9BQUEsU0FBQSxJQUFBO0FBQ0EsY0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBQSxJQUFBO0FBQ0EsaUJBQUEsVUFBQSxDQUFBLFlBQUEsWUFBQTtBQUNBLGFBQUEsS0FBQSxJQUFBO0FBQ0E7Ozs7QUFJQSxTQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsYUFBQSxDQUFBLENBQUEsUUFBQSxJQUFBO0FBQ0EsS0FGQTs7QUFJQSxTQUFBLGVBQUEsR0FBQSxVQUFBLFVBQUEsRUFBQTs7Ozs7Ozs7OztBQVVBLFVBQUEsS0FBQSxlQUFBLE1BQUEsZUFBQSxJQUFBLEVBQUE7QUFDQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFFBQUEsSUFBQSxDQUFBO0FBQ0E7Ozs7O0FBS0EsYUFBQSxNQUFBLEdBQUEsQ0FBQSxVQUFBLEVBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsS0FBQSxDQUFBLFlBQUE7QUFDQSxlQUFBLElBQUE7QUFDQSxPQUZBLENB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LGlCQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxTQUFBLFFBREE7QUFFQSxjQUFBLG1FQUZBO0FBR0EsZ0JBQUEsb0JBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLGtCQUFBLFFBQUEsR0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLEtBQUEsR0FBQSxLQUFBO0FBQ0EsT0FGQTtBQUdBLEtBUEE7OztBQVVBLFVBQUE7QUFDQSxvQkFBQTtBQURBO0FBVkEsR0FBQTtBQWVBLENBakJBO0FDakNBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGlCQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxTQUFBLFFBREE7QUFFQSxpQkFBQSxxQkFGQTtBQUdBLGdCQUFBO0FBSEEsR0FBQTtBQU1BLENBUkE7O0FBVUEsSUFBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsU0FBQSxLQUFBLEdBQUEsRUFBQTtBQUNBLFNBQUEsS0FBQSxHQUFBLElBQUE7O0FBRUEsU0FBQSxTQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUE7O0FBRUEsV0FBQSxLQUFBLEdBQUEsSUFBQTs7QUFFQSxnQkFBQSxLQUFBLENBQUEsU0FBQSxFQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsYUFBQSxFQUFBLENBQUEsTUFBQTtBQUNBLEtBRkEsRUFFQSxLQUZBLENBRUEsWUFBQTtBQUNBLGFBQUEsS0FBQSxHQUFBLDRCQUFBO0FBQ0EsS0FKQTtBQU1BLEdBVkE7QUFZQSxDQWpCQTtBQ1ZBLElBQUEsVUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsU0FBQSxPQUFBLEdBQUEsV0FBQTtBQUNBLENBRkE7O0FBS0EsSUFBQSxVQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsU0FBQSxXQUFBLEdBQUEsV0FBQTtBQUVBLENBSkE7O0FDTEEsSUFBQSxTQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQTs7QUFFQSxTQUFBO0FBQ0EsY0FBQSxHQURBO0FBRUEsV0FBQSxFQUZBO0FBR0EsaUJBQUEsdUJBSEE7QUFJQSxVQUFBLGNBQUEsS0FBQSxFQUFBOztBQUVBLFlBQUEsTUFBQSxHQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsWUFBQSxPQUFBO0FBQ0Esb0JBQUEsS0FBQSxTQURBO0FBRUEsY0FBQSxLQUFBO0FBRkEsU0FBQTtBQUlBLGVBQUEsYUFBQSxVQUFBLENBQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxZQUFBO0FBQ0EsZUFBQSxRQUFBLEdBQUEsS0FBQSxTQUFBO0FBQ0EsZUFBQSxTQUFBLEdBQUEsSUFBQTtBQUNBLFNBSkEsRUFLQSxJQUxBLENBS0EsWUFBQTtBQUNBLGdCQUFBLFNBQUE7QUFDQSxTQVBBLENBQUE7QUFRQSxPQWJBOztBQWVBLFlBQUEsTUFBQSxHQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsWUFBQSxXQUFBLEVBQUEsTUFBQSxJQUFBLEVBQUE7QUFDQSxxQkFBQSxVQUFBLENBQUEsU0FBQSxJQUFBLENBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxZQUFBO0FBQUEsaUJBQUEsTUFBQSxTQUFBLEVBQUE7QUFBQSxTQURBLEVBRUEsSUFGQSxDQUVBLFVBQUEsUUFBQSxFQUFBO0FBQUEsZ0JBQUEsS0FBQSxHQUFBLFFBQUE7QUFBQSxTQUZBO0FBR0EsT0FMQTs7QUFPQSxZQUFBLGNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUFBLGVBQUEsRUFBQSxDQUFBLGdCQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUFBLE9BQUE7QUFDQSxZQUFBLFVBQUEsR0FBQSxZQUFBO0FBQUEsZUFBQSxFQUFBLENBQUEsVUFBQTtBQUFBLE9BQUE7O0FBRUEsWUFBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsYUFBQSxjQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFNBQUEsRUFBQTtBQUNBLGdCQUFBLEtBQUEsR0FBQSxTQUFBO0FBQ0EsaUJBQUEsU0FBQTtBQUNBLFNBSkEsQ0FBQTtBQUtBLE9BTkE7O0FBUUEsWUFBQSxTQUFBOztBQUVBLGFBQUEsYUFBQSxRQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE9BQUEsRUFBQTtBQUFBLGNBQUEsV0FBQSxHQUFBLE9BQUE7QUFBQSxPQURBLENBQUE7QUFFQTtBQTNDQSxHQUFBO0FBNkNBLENBL0NBOztBQWlEQSxJQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBOztBQUVBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxXQUFBLEVBRkE7QUFHQSxpQkFBQSx1QkFIQTtBQUlBLFVBQUEsY0FBQSxLQUFBLEVBQUE7O0FBRUEsWUFBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsYUFBQSxjQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFNBQUEsRUFBQTtBQUFBLGdCQUFBLFVBQUEsR0FBQSxTQUFBO0FBQUEsU0FEQSxDQUFBO0FBRUEsT0FIQTs7QUFLQSxZQUFBLFNBQUEsR0FDQSxJQURBLENBQ0EsWUFBQTtBQUFBLGdCQUFBLEdBQUEsQ0FBQSxNQUFBLFVBQUE7QUFBQSxPQURBOztBQUdBLGFBQUEsYUFBQSxRQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE9BQUEsRUFBQTtBQUFBLGNBQUEsV0FBQSxHQUFBLE9BQUE7QUFBQSxPQURBLENBQUE7QUFFQTtBQWhCQSxHQUFBO0FBbUJBLENBckJBOztBQ2hEQSxJQUFBLE9BQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxNQUFBLGFBQUEsRUFBQTtBQUNBLE1BQUEsWUFBQSxTQUFBLFNBQUEsQ0FBQSxHQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxJQUFBLEdBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUFBLGFBQUEsS0FBQSxNQUFBO0FBQUEsS0FBQSxFQUFBLE9BQUEsQ0FBQSxJQUFBLE1BQUEsTUFBQSxDQUFBLENBQUEsR0FBQSxLQUFBLEdBQUEsSUFBQTtBQUNBLEdBRkE7QUFHQSxTQUFBO0FBQ0EsZUFBQSxtQkFBQSxHQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQSxDQUFBLG9CQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQUEsZUFBQSxVQUFBLEdBQUEsRUFBQSxJQUFBLElBQUEsQ0FBQTtBQUFBLE9BREEsRUFFQSxJQUZBLENBRUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxZQUFBLE1BQUEsRUFBQTtBQUNBLGlCQUFBLGtCQUFBO0FBQ0EsU0FGQSxNQUVBO0FBQ0EsaUJBQUEsTUFBQSxJQUFBLENBQUEsYUFBQSxFQUFBLEdBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFBQSxtQkFBQSxJQUFBLElBQUE7QUFBQSxXQURBLENBQUE7QUFFQTtBQUNBLE9BVEEsQ0FBQTtBQVVBLEtBWkE7QUFhQSxjQUFBLGtCQUFBLElBQUEsRUFBQTs7QUFFQSxhQUFBLE1BQUEsR0FBQSxDQUFBLGdCQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxLQUFBLEVBQUE7QUFDQSxxQkFBQSxNQUFBLElBQUE7QUFDQSxlQUFBLGNBQUEsRUFBQTtBQUNBLE9BSkEsQ0FBQTtBQUtBLEtBcEJBO0FBcUJBLG9CQUFBLHdCQUFBLElBQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsZ0JBQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHFCQUFBLE1BQUEsSUFBQTtBQUNBLGVBQUEsY0FBQSxFQUFBO0FBQ0EsT0FKQSxFQUtBLElBTEEsQ0FLQSxVQUFBLElBQUEsRUFBQTtBQUNBLFlBQUEsU0FBQSxTQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUEsRUFBQSxJQUFBLEVBQUE7QUFBQSxtQkFBQSxJQUNBLEtBQUEsSUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLFFBREE7QUFDQSxXQURBLEVBQ0EsQ0FEQSxDQUFBO0FBRUEsU0FIQSxNQUdBO0FBQ0EsaUJBQUEsS0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBO0FBQ0EsbUJBQUEsSUFBQSxNQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EscUJBQUEsSUFBQSxLQUFBLElBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxRQUFBO0FBQUEsYUFEQSxFQUNBLENBREEsQ0FBQTtBQUVBLFdBSEEsRUFHQSxDQUhBLENBQUE7QUFJQTtBQUNBLE9BZkEsQ0FBQTtBQWdCQSxLQXRDQTtBQXVDQSxnQkFBQSxvQkFBQSxHQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxHQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsSUFBQSxFQUFBO0FBQUEsZUFBQSxLQUFBLElBQUE7QUFBQSxPQURBLENBQUE7QUFFQSxLQTFDQTtBQTJDQSxnQkFBQSxvQkFBQSxNQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsTUFBQSxDQUFBLGdCQUFBLE1BQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxNQUFBLENBQUEsV0FBQSxHQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFBQSxpQkFBQSxLQUFBLEVBQUE7QUFBQSxTQUFBLEVBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLENBQUE7QUFDQSxlQUFBLFVBQUE7QUFDQSxPQUpBLENBQUE7QUFLQSxLQWpEQTtBQWtEQSxnQkFBQSxzQkFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsdUJBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLEVBQUEsUUFBQSxNQUFBLElBQUEsRUFBQTtBQUNBLE9BSEEsQ0FBQTtBQUlBOztBQXZEQSxHQUFBO0FBMERBLENBL0RBOztBQ0RBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLFNBQUEsZUFEQTtBQUVBLGlCQUFBLHFCQUZBO0FBR0EsZ0JBQUEsYUFIQTtBQUlBLGFBQUE7QUFDQSxtQkFBQSxxQkFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLGFBQUEsUUFBQSxDQUFBLFNBQUEsQ0FBQTtBQUNBO0FBSEE7QUFKQSxHQUFBOztBQVdBLGlCQUFBLEtBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxTQUFBLGVBREE7QUFFQSxpQkFBQSxxQkFGQTtBQUdBLGdCQUFBLGFBSEE7QUFJQSxhQUFBO0FBQ0EsbUJBQUEscUJBQUEsWUFBQSxFQUFBO0FBQ0EsZUFBQSxhQUFBLFFBQUEsQ0FBQSxTQUFBLENBQUE7QUFDQTtBQUhBO0FBSkEsR0FBQTtBQVdBLENBdkJBOztBQ0FBLElBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLEVBQUEsbUJBQUEsRUFBQTs7QUFFQSxTQUFBLE1BQUEsR0FBQSxRQUFBLEVBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxRQUFBLFFBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxRQUFBLFFBQUE7QUFDQSxTQUFBLEdBQUEsR0FBQSxRQUFBLEdBQUE7QUFDQSxTQUFBLEtBQUEsR0FBQSxRQUFBLEtBQUE7QUFDQSxTQUFBLE9BQUEsR0FBQSxRQUFBLE9BQUE7QUFDQSxTQUFBLEtBQUEsR0FBQSxRQUFBLEtBQUE7QUFDQSxTQUFBLFlBQUEsR0FBQSxLQUFBOzs7Ozs7Ozs7Ozs7OztBQWNBLFVBQUEsR0FBQSxDQUFBLFlBQUE7O0FBRUEsU0FBQSxjQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxRQUFBLENBQUEsT0FBQSxPQUFBLEtBQUEsZUFBQSxJQUFBLE9BQUEsT0FBQSxLQUFBLFFBQUEsS0FBQSxPQUFBLEtBQUEsS0FBQSxFQUFBLEVBQUE7QUFDQSxhQUFBLFlBQUEsR0FBQSxJQUFBO0FBQ0EsYUFBQSxPQUFBLFlBQUEsR0FBQSxpREFBQTtBQUNBOztBQUVBLFFBQUEsV0FBQTtBQUNBLGdCQUFBLE9BQUEsUUFEQTtBQUVBLGdCQUFBLE9BQUEsUUFGQTtBQUdBLFdBQUEsT0FBQSxHQUhBO0FBSUEsYUFBQSxPQUFBLEtBSkE7QUFLQSxlQUFBLE9BQUEsT0FMQTtBQU1BLGFBQUEsT0FBQTtBQU5BLEtBQUE7O0FBU0EsV0FBQSxvQkFBQSxNQUFBLENBQUEsT0FBQSxNQUFBLEVBQUEsUUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTs7QUFFQSxhQUFBLE9BQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQTs7QUFFQSxLQUxBLENBQUE7QUFNQSxHQXJCQTtBQXVCQSxDQWhEQTtBQ0FBLElBQUEsT0FBQSxDQUFBLHFCQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7Ozs7QUFJQSxTQUFBO0FBQ0EsWUFBQSxnQkFBQSxFQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFBQSxRQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsZUFBQSxTQUFBLElBQUE7QUFDQSxPQUhBLENBQUE7QUFJQTtBQU5BLEdBQUE7QUFTQSxDQWJBOztBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGlCQUFBLEtBQUEsQ0FBQSxVQUFBLEVBQUE7QUFDQSxTQUFBLGVBREE7QUFFQSxnQkFBQSxrQkFGQTtBQUdBLGlCQUFBLHlDQUhBO0FBSUEsYUFBQTtBQUNBLGVBQUEsaUJBQUEsWUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLGVBQUEsWUFBQSxTQUFBLENBQUEsYUFBQSxFQUFBLENBQUE7QUFDQTtBQUhBO0FBSkEsR0FBQTtBQVVBLENBWkE7QUNBQSxJQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBOztBQUVBLFNBQUE7QUFDQSxnQkFBQSxvQkFBQSxNQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQSxDQUFBLGVBQUEsTUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGVBQUEsSUFBQSxJQUFBO0FBQ0EsT0FIQSxDQUFBO0FBSUEsS0FOQTs7QUFRQSxrQkFBQSxzQkFBQSxNQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQSxDQUFBLHNCQUFBLE1BQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFDQSxlQUFBLElBQUEsSUFBQTtBQUNBLE9BSEEsQ0FBQTtBQUlBLEtBYkE7O0FBZUEscUJBQUEsMkJBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQSxDQUFBLGtCQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsZUFBQSxJQUFBLElBQUE7QUFDQSxPQUhBLENBQUE7QUFJQSxLQXBCQTs7QUFzQkEsZ0JBQUEsb0JBQUEsY0FBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLElBQUEsQ0FBQSxZQUFBLEVBQUEsY0FBQSxDQUFBO0FBQ0EsS0F4QkE7O0FBMEJBLGlCQUFBLHFCQUFBLFFBQUEsRUFBQTtBQUNBLGFBQUEsU0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsRUFBQTtBQUNBLFlBQUEsRUFBQSxPQUFBLENBQUEsSUFBQSxFQUFBLEVBQUEsQ0FBQTtBQUNBLFlBQUEsRUFBQSxTQUFBLENBQUEsQ0FBQSxDQUFBO0FBQ0EsZUFBQSxDQUFBO0FBQ0EsT0FKQSxDQUFBO0FBS0EsS0FoQ0E7O0FBa0NBLFlBQUEsZ0JBQUEsTUFBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLElBQUEsQ0FBQSxrQkFBQSxFQUFBLEVBQUEsSUFBQSxNQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFDQSxnQkFBQSxHQUFBLENBQUEsSUFBQSxJQUFBO0FBQ0EsZUFBQSxJQUFBLElBQUE7QUFDQSxPQUpBLENBQUE7QUFLQSxLQXhDQTs7QUEwQ0EsY0FBQSxrQkFBQSxNQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsSUFBQSxDQUFBLG9CQUFBLEVBQUEsRUFBQSxJQUFBLE1BQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGVBQUEsSUFBQSxJQUFBO0FBQ0EsT0FIQSxDQUFBO0FBSUEsS0EvQ0E7O0FBaURBLG9CQUFBLDBCQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUEsQ0FBQSx1QkFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGVBQUEsSUFBQSxJQUFBO0FBQ0EsT0FIQSxDQUFBO0FBSUEsS0F0REE7QUF1REEsWUFBQSxpQkFBQSxFQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsSUFBQSxDQUFBLHNCQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsT0FBQSxFQUFBLENBQUEsTUFBQSxDQURBLENBQUE7QUFFQTs7QUExREEsR0FBQTtBQThEQSxDQWhFQTs7QUNBQSxJQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLE9BQUEsRUFBQSxVQUFBLEVBQUEsYUFBQSxFQUFBLFlBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBOztBQUlBLFNBQUEsZ0JBQUEsR0FBQSxLQUFBO0FBQ0EsU0FBQSxJQUFBLEdBQUEsT0FBQTtBQUNBLFNBQUEsT0FBQSxHQUFBLFVBQUE7O0FBRUEsU0FBQSxLQUFBLEdBQUEsVUFBQSxPQUFBLEVBQUE7QUFDQSxXQUFBLE9BQUEsR0FBQSxPQUFBO0FBQ0EsV0FBQSxRQUFBLEdBQUEsQ0FBQSxPQUFBLFFBQUE7QUFDQSxlQUFBLFlBQUE7QUFDQSxhQUFBLFFBQUEsR0FBQSxDQUFBLE9BQUEsUUFBQTtBQUNBLGFBQUEsT0FBQTtBQUNBLEtBSEEsRUFHQSxJQUhBOztBQUtBLEdBUkE7O0FBVUEsU0FBQSxZQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxNQUFBLEVBQUEsRUFBQSxRQUFBLE1BQUEsRUFBQTtBQUNBLEdBRkE7O0FBSUEsU0FBQSxPQUFBLEdBQUEsWUFBQTtBQUNBLFFBQUEsT0FBQSxFQUFBO0FBQ0EsU0FBQSxNQUFBLEdBQUEsT0FBQSxJQUFBLENBQUEsRUFBQTtBQUNBLFNBQUEsUUFBQSxHQUFBLENBQUEsT0FBQSxRQUFBO0FBQ0EsU0FBQSxhQUFBLEdBQUEsQ0FBQSxPQUFBLElBQUEsQ0FBQSxLQUFBO0FBQ0EsUUFBQSxLQUFBLFFBQUEsR0FBQSxDQUFBLEVBQUE7QUFDQSxtQkFBQSxTQUFBLENBQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLFlBQUEsUUFBQSxRQUFBLHlDQUFBLFFBQUEsT0FBQSxRQUFBLEVBQUEsT0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBLEtBQ0EsT0FBQSxFQUFBLENBQUEsYUFBQTtBQUNBLE9BSkE7QUFLQSxLQU5BLE1BT0EsT0FBQSxLQUFBLENBQUEsb0NBQUE7QUFDQSxHQWJBOztBQWVBLFNBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxXQUFBLE9BQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQTtBQUNBLEtBRkEsRUFFQSxJQUZBLENBRUEsSUFGQSxDQUFBO0FBR0EsR0FKQTs7QUFNQSxTQUFBLFdBQUE7O0FBRUEsU0FBQSxpQkFBQSxHQUFBLFlBQUE7QUFDQSxXQUFBLFlBQUEsZUFBQSxHQUNBLElBREEsQ0FDQSxVQUFBLElBQUEsRUFBQTtBQUNBLGNBQUEsR0FBQSxDQUFBLElBQUE7QUFDQSxVQUFBLENBQUEsSUFBQSxFQUFBO0FBQ0EsZUFBQSxjQUFBLEdBQUEsTUFBQTtBQUNBLE9BRkEsTUFFQTtBQUNBLGVBQUEsY0FBQSxHQUFBLEtBQUEsRUFBQTtBQUNBO0FBQ0EsS0FSQSxDQUFBO0FBU0EsR0FWQTs7QUFZQSxTQUFBLGlCQUFBOztBQUVBLFNBQUEsb0JBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxPQUFBLGdCQUFBO0FBQ0EsR0FGQTs7QUFJQSxTQUFBLG9CQUFBOztBQUVBLFNBQUEsU0FBQSxHQUFBLFlBQUE7OztBQUdBLFFBQUEsdUJBQUEsT0FBQSxPQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsYUFBQSxPQUFBLE1B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QU9BLFNBQUEsYUFBQTtBQUNBLENBWEE7O0FDaEJBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFNBQUEsU0FEQTtBQUVBLGdCQUFBLFlBRkE7QUFHQSxpQkFBQTtBQUhBLEdBQUE7QUFNQSxDQVBBO0FDQUEsSUFBQSxVQUFBLENBQUEsVUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUEsWUFBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxVQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQUEsWUFBQTtBQUNBLFNBQUEsSUFBQSxHQUFBLE9BQUE7QUFDQSxTQUFBLEtBQUEsR0FBQSxZQUFBOztBQUVBLFNBQUEsY0FBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsVUFBQSxFQUFBLEVBQUEsSUFBQSxFQUFBLEVBQUE7QUFDQSxHQUZBOztBQUlBLFNBQUEsVUFBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsZ0JBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxFQUFBO0FBQ0EsR0FGQTs7QUFJQSxjQUFBLGVBQUEsR0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxXQUFBLEtBQUEsRUFBQSxJQUFBLE9BQUEsSUFBQSxDQUFBLEVBQUEsSUFBQSxLQUFBLE9BQUEsR0FBQSxJQUFBLEdBQUEsS0FBQTtBQUNBLEdBRkEsRUFHQSxJQUhBLENBR0EsVUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLFVBQUEsR0FBQSxNQUFBO0FBQ0EsR0FMQTs7QUFPQSxjQUFBLGVBQUEsR0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxXQUFBLEtBQUEsT0FBQSxHQUFBLElBQUEsR0FBQSxLQUFBO0FBQ0EsR0FGQSxFQUdBLElBSEEsQ0FHQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsT0FBQSxHQUFBLE1BQUE7QUFDQSxHQUxBOztBQU9BLE1BQUEsT0FBQSxJQUFBLENBQUEsT0FBQSxFQUFBLE9BQUEsV0FBQSxHQUFBLGdCQUFBO0FBQ0EsTUFBQSxDQUFBLE9BQUEsSUFBQSxDQUFBLE9BQUEsRUFBQSxPQUFBLFdBQUEsR0FBQSxZQUFBOztBQUVBLFNBQUEsTUFBQSxHQUFBLFlBQUEsTUFBQTs7QUFFQSxTQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsWUFBQSxTQUFBLENBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEdBQUEsRUFBQTtBQUNBLFVBQUEsT0FBQSxJQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsZUFBQSxJQUFBLENBQUEsT0FBQSxHQUFBLEtBQUE7QUFDQSxlQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsT0FIQSxNQUlBLElBQUEsQ0FBQSxPQUFBLElBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxlQUFBLElBQUEsQ0FBQSxPQUFBLEdBQUEsSUFBQTtBQUNBLGVBQUEsV0FBQSxHQUFBLGdCQUFBO0FBQ0E7QUFDQSxLQVZBLENBQUE7QUFXQSxHQVpBO0FBYUEsQ0E3Q0E7O0FDQUEsSUFBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLE1BQUEsY0FBQSxFQUFBOztBQUVBLGNBQUEsU0FBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsV0FBQSxNQUFBLEdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxjQUFBLEdBQUEsQ0FBQSxTQUFBLEVBQUEsU0FBQSxJQUFBO0FBQ0EsYUFBQSxTQUFBLElBQUE7QUFDQSxLQUpBLENBQUE7QUFLQSxHQU5BOztBQVFBLGNBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxXQUFBLE1BQUEsR0FBQSxDQUFBLFlBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxhQUFBLFNBQUEsSUFBQTtBQUNBLEtBSEEsQ0FBQTtBQUlBLEdBTEE7O0FBT0EsY0FBQSxNQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxXQUFBLE1BQUEsSUFBQSxDQUFBLHNCQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsT0FBQSxFQUFBLENBQUEsTUFBQSxDQURBLENBQUE7QUFFQSxHQUhBOztBQUtBLGNBQUEsU0FBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsV0FBQSxNQUFBLEdBQUEsQ0FBQSx5QkFBQSxFQUFBLENBQUE7QUFDQSxHQUZBOztBQUlBLFNBQUEsV0FBQTtBQUNBLENBNUJBOztBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFNBQUEsZUFEQTtBQUVBLGlCQUFBLDRCQUZBO0FBR0EsZ0JBQUEsVUFIQTtBQUlBLGFBQUE7QUFDQSxlQUFBLGlCQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLFlBQUEsU0FBQSxDQUFBLGFBQUEsTUFBQSxDQUFBO0FBQ0EsT0FIQTtBQUlBLG9CQUFBLHNCQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLFlBQUEsWUFBQSxDQUFBLGFBQUEsTUFBQSxDQUFBO0FBQ0E7QUFOQTtBQUpBLEdBQUE7QUFhQSxDQWRBOztBQ0FBLElBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBLFlBQUEsRUFBQTs7QUFFQSxTQUFBLE1BQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTs7Ozs7QUFLQSxXQUFBLE9BQUEsRUFBQSxDQUFBLGVBQUEsRUFBQSxFQUFBLGFBQUEsV0FBQSxFQUFBLENBQUE7O0FBRUEsR0FQQTs7QUFTQSxTQUFBLGFBQUEsVUFBQSxHQUNBLElBREEsQ0FDQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFlBQUEsR0FBQSxDQUFBLEVBQUE7QUFDQSxHQUhBLENBQUE7QUFJQSxDQWZBOztBQWlCQSxJQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQSxZQUFBLEVBQUE7QUFD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QTtBQUNBLGlCQUFBLEVBQUEsQ0FBQSxNQUFBO0FBQ0EsU0FGQSxDQUFBO0FBR0EsT0FKQTs7QUFNQSxVQUFBLFVBQUEsU0FBQSxPQUFBLEdBQUE7QUFDQSxlQUFBLFlBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsU0FGQSxDQUFBO0FBR0EsT0FKQTs7QUFNQTs7QUFFQSxVQUFBLGFBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxjQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsT0FGQTs7QUFJQSxpQkFBQSxHQUFBLENBQUEsWUFBQSxZQUFBLEVBQUEsT0FBQTtBQUNBLGlCQUFBLEdBQUEsQ0FBQSxZQUFBLGFBQUEsRUFBQSxVQUFBO0FBQ0EsaUJBQUEsR0FBQSxDQUFBLFlBQUEsY0FBQSxFQUFBLFVBQUE7QUFFQTs7QUFoREEsR0FBQTtBQW9EQSxDQXREQTs7QUNBQTs7QUFFQSxJQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQUEsWUFBQTtBQUNBLFNBQUE7QUFDQSxXQUFBO0FBQ0Esb0JBQUE7QUFEQSxLQURBO0FBSUEsY0FBQSxHQUpBO0FBS0EsaUJBQUE7QUFMQSxHQUFBO0FBT0EsQ0FSQTs7QUNGQSxJQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQSxlQUFBLEVBQUE7O0FBRUEsU0FBQTtBQUNBLGNBQUEsR0FEQTtBQUVBLGlCQUFBLHlEQUZBO0FBR0EsVUFBQSxjQUFBLEtBQUEsRUFBQTtBQUNBLFlBQUEsUUFBQSxHQUFBLGdCQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEdBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ3NvY2ttYXJrZXQnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ3N0cmlwZSddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xuICAgIFN0cmlwZS5zZXRQdWJsaXNoYWJsZUtleSgncGtfdGVzdF9SZDduTXBTWk1xUk51QjR6akVlWkh0MWQnKTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdjaGVja291dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGN1cnJlbnRDYXJ0LCBDaGVja291dEZhY3RvcnkpIHtcbiAgJHNjb3BlLmN1cnJlbnRDYXJ0ID0gY3VycmVudENhcnRcblxuICAkc2NvcGUuY2FsY1RvdGFsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5jYWxjdWxhdGVUb3RhbCgnY3VycmVudCcpXG4gICAgLnRoZW4oZnVuY3Rpb24oY2FydFRvdGFsKSB7ICRzY29wZS50b3RhbCA9IGNhcnRUb3RhbCB9KVxuICB9XG5cbiAgJHNjb3BlLmNhbGNUb3RhbCgpXG5cbiAgJHNjb3BlLmNoYXJnZSA9IGZ1bmN0aW9uKHN0YXR1cywgcmVwc29uc2UpIHtcbiAgICBDaGVja291dEZhY3RvcnkuY2hhcmdlQ2FyZCh7dG9rZW46IHJlc3BvbnNlLmlkfSlcbiAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKHJlcylcbiAgICB9KVxuICB9XG5cbn0pXG4iLCJhcHAuZmFjdG9yeSgnQ2hlY2tvdXRGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwLCAkc3RhdGUpIHtcblxuICByZXR1cm4ge1xuICAgIGNoYXJnZUNhcmQ6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgJGh0dHAucG9zdCgnL2NoZWNrb3V0Jywgb2JqKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVyLmRhdGFcbiAgICAgIH0pXG4gICAgfVxuICB9XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NoZWNrb3V0Jywge1xuICAgIHVybDogJy9jYXJ0L2NoZWNrb3V0Jyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9jaGVja291dC9jaGVja291dC5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnY2hlY2tvdXRDb250cm9sbGVyJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRjdXJyZW50Q2FydDogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuXHRcdFx0XHRyZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdjdXJyZW50Jylcblx0XHRcdH1cblx0XHR9XG4gIH0pXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgIC8vIFJlZ2lzdGVyIG91ciAqYWJvdXQqIHN0YXRlLlxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhYm91dCcsIHtcbiAgICAgICAgdXJsOiAnL2Fib3V0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Fib3V0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWJvdXQvYWJvdXQuaHRtbCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdBYm91dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBGdWxsc3RhY2tQaWNzKSB7XG5cbiAgICAvLyBJbWFnZXMgb2YgYmVhdXRpZnVsIEZ1bGxzdGFjayBwZW9wbGUuXG4gICAgJHNjb3BlLmltYWdlcyA9IF8uc2h1ZmZsZShGdWxsc3RhY2tQaWNzKTtcblxufSk7XG5cbiIsImFwcC5kaXJlY3RpdmUoJ2Rlc2lnblZpZXcnLCBmdW5jdGlvbiAoU29ja0ZhY3RvcnksICRzdGF0ZSwgJGh0dHApIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvZGVzaWduL2Rlc2lnbi12aWV3Lmh0bWwnLFxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIGRlc2lnblZpZXdDdHJsKSB7XG5cblx0XHRcdHZhciB0aXRsZSA9IHNjb3BlLnRpdGxlO1xuXHRcdFx0dmFyIGRlc2NyaXB0aW9uID0gc2NvcGUuZGVzY3JpcHRpb247XG5cdFx0XHR2YXIgdGFncyA9IHNjb3BlLnRhZ3M7XG5cdFx0XHR2YXIgY2FudmFzID0gZWxlbWVudC5maW5kKCdjYW52YXMnKVswXTtcblxuXHRcdFx0c2NvcGUuc2F2ZURlc2lnbiA9IGZ1bmN0aW9uICh0aXRsZSwgZGVzY3JpcHRpb24sIHRhZ3MpIHtcblxuXHRcdFx0XHR2YXIgdGFnc0FyciA9IFNvY2tGYWN0b3J5LnByZXBhcmVUYWdzKHRhZ3MpO1xuXG4gICAgICAgIHZhciBuZXdTb2NrRGF0YU9iaiA9IHtcbiAgICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICAgICAgICAgIHRhZ3M6IHRhZ3NBcnJcbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiBkYXRhVVJJdG9CbG9iKGRhdGFVUkkpIHtcbiAgICAgICAgICB2YXIgYmluYXJ5ID0gYXRvYihkYXRhVVJJLnNwbGl0KCcsJylbMV0pO1xuICAgICAgICAgIHZhciBhcnJheSA9IFtdO1xuICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBiaW5hcnkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFycmF5LnB1c2goYmluYXJ5LmNoYXJDb2RlQXQoaSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV3IEJsb2IoW25ldyBVaW50OEFycmF5KGFycmF5KV0sIHt0eXBlOiAnaW1hZ2UvcG5nJ30pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRhdGFVcmwgPSBjYW52YXMudG9EYXRhVVJMKFwiaW1hZ2UvcG5nXCIpO1xuICAgICAgICB2YXIgYmxvYkRhdGEgPSBkYXRhVVJJdG9CbG9iKGRhdGFVcmwpO1xuXG4gICAgICAgIFNvY2tGYWN0b3J5LmdldFVuc2lnbmVkVVJMKClcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpe1xuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gcmVzLnVybC5zcGxpdCgnPycpWzBdO1xuXG4gICAgICAgICAgICAkaHR0cC5wdXQocmVzLnVybCwgYmxvYkRhdGEsXG4gICAgICAgICAgICAgIHtoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgICAgICBLZXkgOiAnYW5pX2Jlbi5wbmcnXG4gICAgICAgICAgICB9fSlcbiAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICAgICAgICBuZXdTb2NrRGF0YU9iai5pbWFnZSA9IGltYWdlVXJsO1xuICAgICAgICAgICAgICAgIFNvY2tGYWN0b3J5LnNhdmVEZXNpZ24obmV3U29ja0RhdGFPYmopXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCd1c2VyJywge3VzZXJJZDogcmVzdWx0LmRhdGEudXNlcklkfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG5cdFx0XHR9O1xuXG5cblx0XHRcdHZhciBjb2xvciA9ICQoXCIuc2VsZWN0ZWRcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdHZhciBjb250ZXh0ID0gJChcImNhbnZhc1wiKVswXS5nZXRDb250ZXh0KFwiMmRcIik7XG5cdFx0XHR2YXIgJGNhbnZhcyA9ICQoXCJjYW52YXNcIik7XG5cdFx0XHR2YXIgbGFzdEV2ZW50O1xuXHRcdFx0dmFyIG1vdXNlRG93biA9IGZhbHNlO1xuXG5cdFx0XHR2YXIgYmFja2dyb3VuZCA9IG5ldyBJbWFnZSgpO1xuXG5cdFx0XHRiYWNrZ3JvdW5kLnNyYyA9ICcvc29jay1iZy8xLnBuZyc7XG5cblx0XHRcdGJhY2tncm91bmQub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQgIGNvbnRleHQuZHJhd0ltYWdlKGJhY2tncm91bmQsIDAsIDApO1xuXHRcdFx0fTtcblxuXHRcdFx0Ly9XaGVuIGNsaWNraW5nIG9uIGNvbnRyb2wgbGlzdCBpdGVtc1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzXCIpLm9uKFwiY2xpY2tcIiwgXCJsaVwiICwgZnVuY3Rpb24oKXtcblx0XHRcdCAgICAgLy9EZXNsZWN0IHNpYmxpbmcgZWxlbWVudHNcblx0XHRcdCAgICAgJCh0aGlzKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vU2VsZWN0IGNsaWNrZWQgZWxlbWVudFxuXHRcdFx0ICAgICAkKHRoaXMpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vc3RvcmUgdGhlIGNvbG9yXG5cdFx0XHQgICAgIGNvbG9yID0gJCh0aGlzKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICB9KTtcblxuXHRcdFx0Ly9XaGVuIFwiQWRkIENvbG9yXCIgYnV0dG9uIGlzIHByZXNzZWRcblx0XHRcdCAgJChcIiNyZXZlYWxDb2xvclNlbGVjdFwiKS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCAgLy9TaG93IGNvbG9yIHNlbGVjdCBvciBoaWRlIHRoZSBjb2xvciBzZWxlY3Rcblx0XHRcdCAgICBjaGFuZ2VDb2xvcigpO1xuXHRcdFx0ICBcdCQoXCIjY29sb3JTZWxlY3RcIikudG9nZ2xlKCk7XG5cdFx0XHQgIH0pO1xuXG5cdFx0XHQvL1VwZGF0ZSB0aGUgbmV3IGNvbG9yIHNwYW5cblx0XHRcdGZ1bmN0aW9uIGNoYW5nZUNvbG9yKCl7XG5cdFx0XHRcdHZhciByID0gJChcIiNyZWRcIikudmFsKCk7XG5cdFx0XHRcdHZhciBnID0gJChcIiNncmVlblwiKS52YWwoKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKCk7XG5cdFx0XHRcdCQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYihcIiArIHIgKyBcIiwgXCIgKyBnICsgXCIsIFwiICsgYiArIFwiKVwiKTtcblx0XHRcdCAgLy9XaGVuIGNvbG9yIHNsaWRlcnMgY2hhbmdlXG5cblxuXHRcdFx0fVxuXG5cdFx0XHQkKFwiaW5wdXRbdHlwZT1yYW5nZV1cIikub24oXCJpbnB1dFwiLCBjaGFuZ2VDb2xvcik7XG5cblx0XHRcdC8vd2hlbiBcIkFkZCBDb2xvclwiIGlzIHByZXNzZWRcblx0XHRcdCQoXCIjYWRkTmV3Q29sb3JcIikuY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdCAgLy9hcHBlbmQgdGhlIGNvbG9yIHRvIHRoZSBjb250cm9scyB1bFxuXHRcdFx0ICB2YXIgJG5ld0NvbG9yID0gJChcIjxsaT48L2xpPlwiKTtcblx0XHRcdCAgJG5ld0NvbG9yLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpKTtcblx0XHRcdCAgJChcIi5jb250cm9scyB1bFwiKS5hcHBlbmQoJG5ld0NvbG9yKTtcblx0XHRcdCAgJChcIi5jb250cm9scyBsaVwiKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgbGlcIikubGFzdCgpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgIGNvbG9yID0gJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICAvL3doZW4gYWRkZWQsIHJlc3RvcmUgc2xpZGVycyBhbmQgcHJldmlldyBjb2xvciB0byBkZWZhdWx0XG5cdFx0XHQgICQoXCIjY29sb3JTZWxlY3RcIikuaGlkZSgpO1xuXHRcdFx0XHR2YXIgciA9ICQoXCIjcmVkXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGcgPSAkKFwiI2dyZWVuXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKDApO1xuXHRcdFx0XHQkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2IoXCIgKyByICsgXCIsIFwiICsgZyArIFwiLCBcIiArIGIgKyBcIilcIik7XG5cblx0XHRcdH0pXG5cblx0XHRcdC8vT24gbW91c2UgZXZlbnRzIG9uIHRoZSBjYW52YXNcblx0XHRcdCRjYW52YXMubW91c2Vkb3duKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICBsYXN0RXZlbnQgPSBlO1xuXHRcdFx0ICBtb3VzZURvd24gPSB0cnVlO1xuXHRcdFx0fSkubW91c2Vtb3ZlKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICAvL2RyYXcgbGluZXNcblx0XHRcdCAgaWYgKG1vdXNlRG93bil7XG5cdFx0XHQgICAgY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdCAgICBjb250ZXh0Lm1vdmVUbyhsYXN0RXZlbnQub2Zmc2V0WCxsYXN0RXZlbnQub2Zmc2V0WSk7XG5cdFx0XHQgICAgY29udGV4dC5saW5lVG8oZS5vZmZzZXRYLCBlLm9mZnNldFkpO1xuXHRcdFx0ICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBjb2xvcjtcblx0XHRcdCAgICBjb250ZXh0LnN0cm9rZSgpO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZUNhcCA9ICdyb3VuZCc7XG5cdFx0XHQgICAgY29udGV4dC5saW5lV2lkdGggPSAyMDtcblxuXHRcdFx0ICAgIGxhc3RFdmVudCA9IGU7XG5cdFx0XHQgIH1cblx0XHRcdH0pLm1vdXNldXAoZnVuY3Rpb24oKXtcblx0XHRcdCAgICBtb3VzZURvd24gPSBmYWxzZTtcblx0XHRcdH0pLm1vdXNlbGVhdmUoZnVuY3Rpb24oKXtcblx0XHRcdCAgICAkY2FudmFzLm1vdXNldXAoKTtcblx0XHRcdH0pO1xuXG5cblx0XHR9XG5cdH1cbn0pXG4iLCJhcHAuY29udHJvbGxlcignRGVzaWduQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUpIHtcblxuICB2YXIgYnVja2V0ID0gbmV3IEFXUy5TMyh7cGFyYW1zOiB7QnVja2V0OiAnbXlCdWNrZXQnfX0pO1xuICBidWNrZXQubGlzdE9iamVjdHMoZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGF0dXMnKS5pbm5lckhUTUwgPVxuICAgICAgICAnQ291bGQgbm90IGxvYWQgb2JqZWN0cyBmcm9tIFMzJztcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXR1cycpLmlubmVySFRNTCA9XG4gICAgICAgICdMb2FkZWQgJyArIGRhdGEuQ29udGVudHMubGVuZ3RoICsgJyBpdGVtcyBmcm9tIFMzJztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5Db250ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb2JqZWN0cycpLmlubmVySFRNTCArPVxuICAgICAgICAgICc8bGk+JyArIGRhdGEuQ29udGVudHNbaV0uS2V5ICsgJzwvbGk+JztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICAkc2NvcGUuaGkgPSBcImhpXCI7XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGVzaWduVmlldycsIHtcbiAgICAgIHVybDonL3NvY2tzL2Rlc2lnbi86aWQnLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgdGhlU29jazogJz0nXG4gICAgICB9LFxuICAgICAgY29udHJvbGxlcjogJ2Rlc2lnblZpZXdDdHJsJyxcbiAgICAgIHRlbXBsYXRlOiAnPGRlc2lnbi12aWV3PjwvZGVzaWduLXZpZXc+JyxcbiAgICB9KVxuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ2Rlc2lnblZpZXdDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHApIHtcblxuICAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvbWF0Y2hJZCcpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgcmV0dXJuICRzY29wZS5zaG93VmlldyA9IHJlc1xuICAgIH0pXG5cblx0Ly8gLy8gJHNjb3BlLmRlc2NyaXB0aW9uO1xuXHQvLyAkc2NvcGUudGFncztcblx0Ly8gJHNjb3BlLnRpdGxlO1xuXHQvLyBjb25zb2xlLmxvZygkc2NvcGUuZGVzY3JpcHRpb24pO1xufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkZXNpZ24nLCB7XG4gICAgICB1cmw6Jy9kZXNpZ24nLFxuICAgICAgY29udHJvbGxlcjogJ0Rlc2lnbkNvbnRyb2xsZXInLFxuICAgICAgdGVtcGxhdGVVcmw6ICc8ZGVzaWduLXNvY2s+PC9kZXNpZ24tc29jaz4nXG4gICAgfSlcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2RvY3MnLCB7XG4gICAgICAgIHVybDogJy9kb2NzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9kb2NzL2RvY3MuaHRtbCdcbiAgICB9KTtcbn0pO1xuIiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdob21lQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRtb3N0UmVjZW50U29ja3M6IGZ1bmN0aW9uIChTb2NrRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFNvY2tGYWN0b3J5Lm1vc3RSZWNlbnRTb2NrcygpXG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ2hvbWVDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgbW9zdFJlY2VudFNvY2tzLCAkc3RhdGUsICRzdGF0ZVBhcmFtcykge1xuXG4gICRzY29wZS5tb3N0UmVjZW50U29ja3MgPSBtb3N0UmVjZW50U29ja3NcbiAgJHNjb3BlLnNlZVNvY2sgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG4gIH1cbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluJywge1xuICAgICAgICB1cmw6ICcvYWRtaW4nLFxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcbiAgICAgICAgICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5jb250cm9sbGVyKCdjYXJ0Q3VycmVudCcsIGZ1bmN0aW9uICgkc2NvcGUsIE9yZGVyRmFjdG9yeSwgY3VycmVudENhcnQpIHtcbiAgJHNjb3BlLmN1cnJlbnQgPSBjdXJyZW50Q2FydFxufSlcblxuXG5hcHAuY29udHJvbGxlcignY2FydEhpc3RvcnknLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGNhcnRIaXN0b3J5KSB7XG5cbiAgJHNjb3BlLmNhcnRIaXN0b3J5ID0gY2FydEhpc3RvcnlcblxufSlcbiIsImFwcC5kaXJlY3RpdmUoJ2N1cnJlbnRDYXJ0JywgZnVuY3Rpb24gKCRzdGF0ZSwgT3JkZXJGYWN0b3J5KSB7XG5cbiAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICBzY29wZToge30sXG4gICAgICB0ZW1wbGF0ZVVybDogJ2pzL29yZGVyL2N1cnJlbnQuaHRtbCcsXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSkge1xuXG4gICAgICAgIHNjb3BlLnVwZGF0ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICB2YXIgc29jayA9IHtcbiAgICAgICAgICAgIHF1YW50aXR5OiBpdGVtLm5ld0Ftb3VudCxcbiAgICAgICAgICAgIGlkOiBpdGVtLmlkXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBPcmRlckZhY3RvcnkudXBkYXRlSXRlbShzb2NrKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpdGVtLnF1YW50aXR5ID0gaXRlbS5uZXdBbW91bnQ7XG4gICAgICAgICAgICBpdGVtLm5ld0Ftb3VudCA9IG51bGw7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNjb3BlLmNhbGNUb3RhbCgpXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICB2YXIgdG9kZWxldGUgPSB7IGl0ZW06IGl0ZW0gfVxuICAgICAgICAgIE9yZGVyRmFjdG9yeS5kZWxldGVJdGVtKHRvZGVsZXRlLml0ZW0uaWQpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5jYWxjVG90YWwoKSB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKG5ld1RvdGFsKSB7IHNjb3BlLnRvdGFsID0gbmV3VG90YWwgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLnNpbmdsZVNvY2tWaWV3ID0gZnVuY3Rpb24oaWQpIHsgJHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KSB9XG4gICAgICAgIHNjb3BlLnRvQ2hlY2tvdXQgPSBmdW5jdGlvbigpIHsgJHN0YXRlLmdvKCdjaGVja291dCcpIH1cblxuICAgICAgICBzY29wZS5jYWxjVG90YWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LmNhbGN1bGF0ZVRvdGFsKCdjdXJyZW50JylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihjYXJ0VG90YWwpIHtcbiAgICAgICAgICAgIHNjb3BlLnRvdGFsID0gY2FydFRvdGFsXG4gICAgICAgICAgICByZXR1cm4gY2FydFRvdGFsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmNhbGNUb3RhbCgpXG5cbiAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnY3VycmVudCcpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGN1cnJlbnQpIHsgc2NvcGUuY3VycmVudENhcnQgPSBjdXJyZW50IH0pXG4gICAgfVxuICB9XG59KVxuXG5hcHAuZGlyZWN0aXZlKCdjYXJ0SGlzdG9yeScsIGZ1bmN0aW9uKCRzdGF0ZSwgT3JkZXJGYWN0b3J5KSB7XG5cbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHNjb3BlOiB7fSxcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL29yZGVyL2hpc3RvcnkuaHRtbCcsXG4gICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgIHNjb3BlLmNhbGNUb3RhbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LmNhbGN1bGF0ZVRvdGFsKCdoaXN0b3J5JylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY2FydFRvdGFsKSB7IHNjb3BlLnRvdGFsU3BlbnQgPSBjYXJ0VG90YWwgfSlcbiAgICAgIH1cblxuICAgICAgc2NvcGUuY2FsY1RvdGFsKClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkgeyBjb25zb2xlLmxvZyhzY29wZS50b3RhbFNwZW50KSB9KVxuXG4gICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdoaXN0b3J5JylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGhpc3RvcnkpIHsgc2NvcGUuY2FydEhpc3RvcnkgPSBoaXN0b3J5IH0pXG4gICAgfVxuICB9XG5cbn0pXG4iLCJcbmFwcC5mYWN0b3J5KCdPcmRlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuICB2YXIgY2FjaGVkQ2FydCA9IFtdXG4gIHZhciBjaGVja0NhcnQgPSBmdW5jdGlvbihvYmosIGFycikge1xuICAgIHJldHVybiBhcnIubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uc29ja0lkIH0pLmluZGV4T2Yob2JqLnNvY2tJZCkgPT09IC0xID8gZmFsc2UgOiB0cnVlXG4gIH1cbiAgcmV0dXJuIHtcbiAgICBhZGRUb0NhcnQ6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci9jdXJyZW50JylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykgeyByZXR1cm4gY2hlY2tDYXJ0KG9iaiwgcmVzLmRhdGEpIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihpbkNhcnQpIHtcbiAgICAgICAgaWYgKGluQ2FydCkge1xuICAgICAgICAgIHJldHVybiBcIkFscmVhZHkgaW4gQ2FydCFcIlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL29yZGVyLycsIG9iailcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHsgcmV0dXJuIHJlcy5kYXRhIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSxcbiAgICBzaG93Q2FydDogZnVuY3Rpb24odHlwZSkge1xuICAgICAgLy90eXBlID0gJ2N1cnJlbnQnIHx8IHR5cGUgPSAnaGlzdG9yeSdcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvJyt0eXBlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgY2FjaGVkQ2FydCA9IG9yZGVyLmRhdGFcbiAgICAgICAgcmV0dXJuIGNhY2hlZENhcnQgfHwgW11cbiAgICAgIH0pXG4gICAgfSxcbiAgICBjYWxjdWxhdGVUb3RhbDogZnVuY3Rpb24odHlwZSkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci8nK3R5cGUpXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICBjYWNoZWRDYXJ0ID0gb3JkZXIuZGF0YVxuICAgICAgICByZXR1cm4gY2FjaGVkQ2FydCB8fCBbXVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpIHtcbiAgICAgICAgaWYgKHR5cGU9PT0nY3VycmVudCcpIHtcbiAgICAgICAgICByZXR1cm4gY2FydC5yZWR1Y2UoZnVuY3Rpb24obywgaXRlbSkge3JldHVybiBvICsgKFxuICAgICAgICAgICAgaXRlbS5zb2NrLnByaWNlKml0ZW0ucXVhbnRpdHkpfSwgMClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gY2FydC5yZWR1Y2UoZnVuY3Rpb24obywgb3JkZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBvICsgb3JkZXIuaXRlbXMucmVkdWNlKGZ1bmN0aW9uKG8sIGl0ZW0pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG8gKyAoaXRlbS5zb2NrLnByaWNlKml0ZW0ucXVhbnRpdHkpfSwgMClcbiAgICAgICAgICB9LCAwKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gICAgdXBkYXRlSXRlbTogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucHV0KCcvYXBpL29yZGVyJywgb2JqKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5kYXRhIH0pXG4gICAgfSxcbiAgICBkZWxldGVJdGVtOiBmdW5jdGlvbihpdGVtSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5kZWxldGUoJy9hcGkvb3JkZXIvJytpdGVtSWQpXG4gICAgICAudGhlbihmdW5jdGlvbih0b1JlbW92ZSkge1xuICAgICAgICBjYWNoZWRDYXJ0LnNwbGljZShjYWNoZWRDYXJ0Lm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLmlkIH0pLmluZGV4T2YoaXRlbUlkKSwxKVxuICAgICAgICByZXR1cm4gY2FjaGVkQ2FydFxuICAgICAgfSlcbiAgICB9LFxuICAgIGVuc3VyZUNhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci9jcmVhdGVjYXJ0JylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKSB7XG4gICAgICAgIHJldHVybiB7ZXhpc3RzOiBvcmRlci5kYXRhfVxuICAgICAgfSlcbiAgICB9LFxuXG4gIH1cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY3VycmVudENhcnQnLCB7XG4gICAgdXJsOiAnL2NhcnQvY3VycmVudCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvb3JkZXIvY2FydC5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnY2FydEN1cnJlbnQnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGN1cnJlbnRDYXJ0OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuXHRcdFx0fVxuXHRcdH1cbiAgfSlcblxuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2FydEhpc3RvcnknLCB7XG4gICAgdXJsOiAnL2NhcnQvaGlzdG9yeScsXG4gICAgdGVtcGxhdGVVcmw6ICcvanMvb3JkZXIvcGFzdC5odG1sJyxcbiAgICBjb250cm9sbGVyOiAnY2FydEhpc3RvcnknLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGNhcnRIaXN0b3J5OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG4gICAgICAgIHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2hpc3RvcnknKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbn0pXG4iLCJhcHAuY29udHJvbGxlcignUGVyc29uYWxJbmZvQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UsIHRoZVVzZXIsIFBlcnNvbmFsSW5mb0ZhY3RvcnkpIHtcblxuXHQkc2NvcGUudXNlcklkID0gdGhlVXNlci5pZDtcblx0JHNjb3BlLmFkZHJlc3MxID0gdGhlVXNlci5hZGRyZXNzMTtcblx0JHNjb3BlLmFkZHJlc3MyID0gdGhlVXNlci5hZGRyZXNzMjtcblx0JHNjb3BlLnppcCA9IHRoZVVzZXIuemlwO1xuXHQkc2NvcGUuc3RhdGUgPSB0aGVVc2VyLnN0YXRlO1xuXHQkc2NvcGUuY291bnRyeSA9IHRoZVVzZXIuY291bnRyeTtcblx0JHNjb3BlLnBob25lID0gdGhlVXNlci5waG9uZTtcblx0JHNjb3BlLmRpc3BsYXlFcnJvciA9IGZhbHNlO1xuXG5cdC8vb25seSBhIHRlbXBvcmFyeSBzb2x1dGlvbiAtLSBjaGVja3MgdG8gc2VlIGlmIHVzZXIgaXMgYSBuZXcgdXNlciBieSBzZWVpbmcgaWYgdGhleSdyZSBsb2dnZWQgaW5cblxuXHQvLyAkc2NvcGUuY3VycmVudFVzZXJJc05ldyA9IGZ1bmN0aW9uKCkge1xuIC8vICAgXHRcdCByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcbiAvLyAgIFx0XHQudGhlbihmdW5jdGlvbih1c2VyKXtcbiAvLyAgICBcdFx0aWYgKCF1c2VyKSByZXR1cm4gJHNjb3BlLm5ld1VzZXIgPSB0cnVlO1xuIC8vICBcdFx0XHRlbHNlIHJldHVybiAkc2NvcGUubmV3VXNlciA9IGZhbHNlO1xuIC8vICAgIFx0fSlcbiAvLyBcdH1cblxuIC8vIFx0JHNjb3BlLmN1cnJlbnRVc2VySXNOZXcoKTtcblxuIFx0Y29uc29sZS5sb2coXCJoZWVlZWVlZWV5XCIpO1xuXG5cdCRzY29wZS5zdWJtaXRQZXJzb25hbCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdGlmICgoJHNjb3BlLmNvdW50cnkgPT09IFwiVW5pdGVkIFN0YXRlc1wiIHx8ICRzY29wZS5jb3VudHJ5ID09PSBcIkNhbmFkYVwiKSAmJiAkc2NvcGUuc3RhdGUgPT09IFwiXCIpIHtcblx0XHRcdCRzY29wZS5kaXNwbGF5RXJyb3IgPSB0cnVlO1xuXHRcdFx0cmV0dXJuICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIklmIGluIFVTIG9yIENhbmFkYSwgbXVzdCBpbmNsdWRlIFN0YXRlL1Byb3ZpbmNlXCI7XG5cdFx0fVxuXG5cdFx0dmFyIHVzZXJJbmZvID0ge1xuXHRcdFx0YWRkcmVzczEgOiAkc2NvcGUuYWRkcmVzczEsXG5cdFx0XHRhZGRyZXNzMiA6ICRzY29wZS5hZGRyZXNzMixcblx0XHRcdHppcCA6ICRzY29wZS56aXAsXG5cdFx0XHRzdGF0ZSA6ICRzY29wZS5zdGF0ZSxcblx0XHRcdGNvdW50cnkgOiAkc2NvcGUuY291bnRyeSxcblx0XHRcdHBob25lIDogJHNjb3BlLnBob25lXG5cdFx0fVxuXG5cdFx0cmV0dXJuIFBlcnNvbmFsSW5mb0ZhY3Rvcnkuc3VibWl0KCRzY29wZS51c2VySWQsIHVzZXJJbmZvKVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdC8vIGlmICgkc2NvcGUubmV3VXNlcikgXG5cdFx0XHRyZXR1cm4gJHN0YXRlLmdvKCdob21lJyk7XG5cdFx0XHQvLyBlbHNlIHJldHVybiAkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiAkc2NvcGUudXNlcklkfSk7XG5cdFx0fSlcblx0fVxuXG59KTsiLCJhcHAuZmFjdG9yeSgnUGVyc29uYWxJbmZvRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gIC8vIFBlcnNvbmFsRmFjdG9yeSA9IHt9O1xuXG4gIHJldHVybiB7XG4gICAgc3VibWl0IDogZnVuY3Rpb24oaWQsIHVzZXJJbmZvKXtcbiAgICAgIHJldHVybiAkaHR0cC5wdXQoJy9hcGkvdXNlci8nICsgaWQsIHVzZXJJbmZvKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwZXJzb25hbCcsIHtcblx0XHR1cmw6ICcvcGVyc29uYWwvOmlkJyxcblx0XHRjb250cm9sbGVyOiAnUGVyc29uYWxJbmZvQ3RybCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvcGVyc29uYWxpbmZvL3BlcnNvbmFsaW5mby52aWV3Lmh0bWwnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdHRoZVVzZXI6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFVzZXJGYWN0b3J5KXtcblx0XHRcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMuaWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59KTsiLCJhcHAuZmFjdG9yeSgnU29ja0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHAsICRzdGF0ZSkge1xuXG4gIHJldHVybiB7XG4gICAgc2luZ2xlU29jazogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBzb2NrQnlVc2VySWQ6IGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL2J5VXNlci8nICsgdXNlcklkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgbW9zdFJlY2VudFNvY2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgXHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svcmVjZW50JylcbiAgICBcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgIFx0XHRyZXR1cm4gcmVzLmRhdGFcbiAgICBcdH0pXG4gICAgfSxcblxuICAgIHNhdmVEZXNpZ246IGZ1bmN0aW9uIChuZXdTb2NrRGF0YU9iaikge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay8nLCBuZXdTb2NrRGF0YU9iailcbiAgICB9LFxuXG4gICAgcHJlcGFyZVRhZ3M6IGZ1bmN0aW9uICh0YWdJbnB1dCkge1xuICAgICAgcmV0dXJuIHRhZ0lucHV0LnNwbGl0KCcgJykubWFwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZSA9IGUucmVwbGFjZSgvLC9pLCBcIlwiKTtcbiAgICAgICAgZSA9IGUuc3Vic3RyaW5nKDEpO1xuICAgICAgICByZXR1cm4gZVxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHVwdm90ZTogZnVuY3Rpb24gKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay91cHZvdGUnLCB7aWQ6IHNvY2tJZH0pXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzLmRhdGEpXG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGRvd252b3RlOiBmdW5jdGlvbiAoc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9zb2NrL2Rvd252b3RlJywge2lkOiBzb2NrSWR9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGdldFVuc2lnbmVkVVJMOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svdW5zaWduZWRVUkwnKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICB9KVxuICAgIH0sXG4gICAgZGVsZXRlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svZGVsZXRlLycgKyBpZClcbiAgICAgIC50aGVuKCRzdGF0ZS5nbygnaG9tZScpKVxuICAgIH1cblxuICB9XG5cbn0pXG4iLCJhcHAuY29udHJvbGxlcignc29ja0lkQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UsICRzdGF0ZVBhcmFtcywgdGhlU29jaywgdGhlUmV2aWV3cywgUmV2aWV3RmFjdG9yeSwgT3JkZXJGYWN0b3J5LCBTb2NrRmFjdG9yeSwgVXNlckZhY3RvcnkpIHtcblxuXG5cbiAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSBmYWxzZTtcbiAgJHNjb3BlLnNvY2sgPSB0aGVTb2NrO1xuICAkc2NvcGUucmV2aWV3cyA9IHRoZVJldmlld3M7XG5cbiAgJHNjb3BlLmFsZXJ0ID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICRzY29wZS5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nXG4gICAgICAkc2NvcGUuJGRpZ2VzdCgpXG4gICAgfSwgMzAwMClcbiAgICAvLyBpZiAoISRzY29wZS5hbGVydGluZykgJHNjb3BlLm1lc3NhZ2UgPT09IG51bGxcbiAgfVxuXG4gICRzY29wZS5nb1RvVXNlclBhZ2UgPSBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiB1c2VySWR9KTtcbiAgfVxuXG4gICRzY29wZS5hZGRJdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW0gPSB7fTtcbiAgICBpdGVtLnNvY2tJZCA9ICRzY29wZS5zb2NrLmlkO1xuICAgIGl0ZW0ucXVhbnRpdHkgPSArJHNjb3BlLnF1YW50aXR5O1xuICAgIGl0ZW0ub3JpZ2luYWxQcmljZSA9ICskc2NvcGUuc29jay5wcmljZTtcbiAgICBpZiAoaXRlbS5xdWFudGl0eSA+IDApIHtcbiAgICAgIE9yZGVyRmFjdG9yeS5hZGRUb0NhcnQoaXRlbSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzcG9uc2UgIT09IFwib2JqZWN0XCIpICRzY29wZS5hbGVydChyZXNwb25zZSk7XG4gICAgICAgIGVsc2UgJHN0YXRlLmdvKCdjdXJyZW50Q2FydCcpO1xuICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSAkc2NvcGUuYWxlcnQoJ1lvdSBoYXZlIHRvIGFkZCBhdCBsZWFzdCBvbmUgc29jayEnKTtcbiAgfVxuXG4gICRzY29wZS5kaXNwbGF5VGFncyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkc2NvcGUuc29jay50YWdzLm1hcChmdW5jdGlvbih0YWcpe1xuICAgICAgcmV0dXJuICcjJyArIHRhZztcbiAgICB9KS5qb2luKFwiLCBcIik7XG4gIH1cblxuICAkc2NvcGUuZGlzcGxheVRhZ3MoKTtcblxuICAkc2NvcGUuZ2V0TG9nZ2VkSW5Vc2VySWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcbiAgICAudGhlbihmdW5jdGlvbih1c2VyKXtcbiAgICAgIGNvbnNvbGUubG9nKHVzZXIpO1xuICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICRzY29wZS5sb2dnZWRJblVzZXJJZCA9ICdub25lJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5sb2dnZWRJblVzZXJJZCA9IHVzZXIuaWQ7XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gICRzY29wZS5nZXRMb2dnZWRJblVzZXJJZCgpO1xuXG4gICRzY29wZS51c2VyQ2Fubm90UG9zdFJldmlldyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJHNjb3BlLnJldmlld05vdEFsbG93ZWQ7XG4gIH1cblxuICAkc2NvcGUudXNlckNhbm5vdFBvc3RSZXZpZXcoKTtcblxuICAkc2NvcGUubmV3UmV2aWV3ID0gZnVuY3Rpb24oKSB7XG5cbiAgLy9pZiB1c2VyIGhhcyBhbHJlYWR5IHJldmlldyBzb2NrLCBkb24ndCBhbGxvdyB1c2VyIHRvIHJldmlldyBpdCBhZ2FpblxuICAgIHZhciB1c2Vyc1dob1Jldmlld2VkU29jayA9ICRzY29wZS5yZXZpZXdzLm1hcChmdW5jdGlvbihyZXZpZXcpe1xuICAgICAgcmV0dXJuIHJldmlldy51c2VySWQ7XG4gICAgfSlcblxuICAgIGlmICgkc2NvcGUubG9nZ2VkSW5Vc2VySWQgPT09ICdub25lJykge1xuICAgICAgJHNjb3BlLnJldmlld0Vycm9yTWVzc2FnZSA9IFwiWW91IG11c3QgYmUgbG9nZ2VkIGluIHRvIHJldmlldyBhIHNvY2shXCI7XG4gICAgICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh1c2Vyc1dob1Jldmlld2VkU29jay5pbmRleE9mKCRzY29wZS5sb2dnZWRJblVzZXJJZCkgIT09IC0xKSB7XG4gICAgICAkc2NvcGUucmV2aWV3RXJyb3JNZXNzYWdlID0gXCJZb3UndmUgYWxyZWFkeSByZXZpZXdlZCB0aGlzIHNvY2shIFlvdSBjYW4ndCByZXZpZXcgaXQgYWdhaW4hXCI7XG4gICAgICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IHRydWU7XG4gIC8vaWYgc29jayBpZCBtYXRjaGVzIHVzZXIgaWQsIHVzZXIgZG9uJ3QgYWxsb3cgdXNlciB0byBwb3N0IGEgcmV2aWV3XG4gICAgfSBlbHNlIGlmICgkc2NvcGUubG9nZ2VkSW5Vc2VySWQgPT09ICRzY29wZS5zb2NrLnVzZXIuaWQpIHtcbiAgICAgICRzY29wZS5yZXZpZXdFcnJvck1lc3NhZ2UgPSBcIllvdSBjYW4ndCByZXZpZXcgeW91ciBvd24gc29jayFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICB2YXIgbmV3UmV2aWV3ID0ge1xuICAgICAgICB0ZXh0OiAkc2NvcGUucmV2aWV3VGV4dCxcbiAgICAgICAgc29ja0lkOiAkc2NvcGUuc29jay5pZFxuICAgICAgfVxuICAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucG9zdFJldmlldyhuZXdSZXZpZXcpXG4gICAgICAudGhlbihmdW5jdGlvbihuZXdSZXZpZXcpe1xuICAgICAgICB2YXIgcmV2aWV3ID0ge307XG4gICAgICAgIHJldmlldy51c2VyID0ge307XG5cbiAgICAgICAgICByZXZpZXcudXNlci5maXJzdF9uYW1lID0gbmV3UmV2aWV3LnVzZXIuZmlyc3RfbmFtZTtcbiAgICAgICAgICByZXZpZXcudXNlci5sYXN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5sYXN0X25hbWU7XG4gICAgICAgICAgcmV2aWV3LnVzZXIucHJvZmlsZV9waWMgPSBuZXdSZXZpZXcudXNlci5wcm9maWxlX3BpYztcbiAgICAgICAgICByZXZpZXcudXNlci51c2VybmFtZSA9IG5ld1Jldmlldy51c2VyLnVzZXJuYW1lO1xuICAgICAgICAgIHJldmlldy50ZXh0ID0gbmV3UmV2aWV3LnJldmlldy50ZXh0O1xuXG4gICAgICAgICRzY29wZS5yZXZpZXdzLnB1c2gocmV2aWV3KTtcbiAgICAgICAgJHNjb3BlLnJldmlld1RleHQgPSBudWxsO1xuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAkc2NvcGUudXB2b3RlID0gZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgcmV0dXJuIFNvY2tGYWN0b3J5LnVwdm90ZShzb2NrSWQpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgJHNjb3BlLnNvY2sudXB2b3RlcysrXG4gICAgfSlcbiAgfVxuXG4gICRzY29wZS5kb3dudm90ZSA9IGZ1bmN0aW9uIChzb2NrSWQpIHtcbiAgICByZXR1cm4gU29ja0ZhY3RvcnkuZG93bnZvdGUoc29ja0lkKVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICRzY29wZS5zb2NrLmRvd252b3RlcysrXG4gICAgfSlcbiAgfVxuXG4gIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIHVzZXIuaWQgPT0gJHNjb3BlLnNvY2suVXNlcklkIHx8IHVzZXIuaXNBZG1pbj8gdHJ1ZSA6IGZhbHNlXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICBjb25zb2xlLmxvZyhyZXN1bHQpXG4gICAgICAkc2NvcGUudmVyaWZ5VXNlciA9IHJlc3VsdFxuICAgIH0pO1xuXG4gICRzY29wZS5kZWxldGUgPSBTb2NrRmFjdG9yeS5kZWxldGVcblxufSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAvLyAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc29ja3MnLCB7XG4gICAgLy8gICAgIHVybDogJy9zb2NrcycsXG4gICAgLy8gICAgIGNvbnRyb2xsZXI6ICdzb2NrVmlld0NvbnRyb2xsZXInLFxuICAgIC8vICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3Lmh0bWwnXG4gICAgLy8gfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2luZ2xlU29ja1ZpZXcnLCB7XG4gICAgICB1cmw6Jy9zb2Nrcy86aWQnLFxuICAgICAgY29udHJvbGxlcjogJ3NvY2tJZENvbnRyb2xsZXInLFxuICAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0dmlldy9wcm9kdWN0dmlldy5odG1sJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgdGhlU29jazogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgU29ja0ZhY3RvcnkpIHtcbiAgICAgICAgICByZXR1cm4gU29ja0ZhY3Rvcnkuc2luZ2xlU29jaygkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgIH0sXG4gICAgICAgIHRoZVJldmlld3M6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFJldmlld0ZhY3RvcnkpIHtcbiAgICAgICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wcm9kdWN0UmV2aWV3cygkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuXG59KTtcbiIsImFwcC5mYWN0b3J5KCdSZXZpZXdGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBwb3N0UmV2aWV3OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3Jldmlldy8nLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG4gICAgcHJvZHVjdFJldmlld3M6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9yZXZpZXcvc29jay8nK3NvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2VhcmNoUmVzdWx0cycsIHtcblx0XHR1cmw6ICcvc2VhcmNoLzpzZWFyY2hUZXJtcycsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvc2VhcmNocmVzdWx0cy9zZWFyY2gudmlldy5odG1sJyxcblx0XHRjb250cm9sbGVyOiBcInNlYXJjaEN0cmxcIixcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRhbGxSZXN1bHRzOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBTZWFyY2hGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBTZWFyY2hGYWN0b3J5LmZpbmRCeVNlYXJjaFRleHQoJHN0YXRlUGFyYW1zLnNlYXJjaFRlcm1zKVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgYWxsUmVzdWx0cykge1xuXHRcdC8vIFx0JHNjb3BlLnJlc3VsdHMgPSBhbGxSZXN1bHRzO1xuXHRcdC8vIFx0Y29uc29sZS5sb2coXCJBbGwgUmVzdWx0cyEhXCIsIGFsbFJlc3VsdHMpO1xuXHRcdC8vIFx0JHNjb3BlLm51bWJlciA9IDEyMztcblx0XHQvLyB9XG5cdFx0Ly8gY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhcIkhFUkVFRUVFXCIsICRzdGF0ZVBhcmFtcy5yZXN1bHRzKVxuXHRcdC8vIFx0JHNjb3BlLnJlc3VsdHMgPSAkc3RhdGVQYXJhbXMucmVzdWx0c1xuXHRcdC8vIH1cblx0fSlcbn0pXG4iLCJhcHAuY29udHJvbGxlcignU2lnbnVwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIFNpZ251cEZhY3RvcnksICRzdGF0ZSkge1xuXG4gIGZ1bmN0aW9uIHBhc3N3b3JkVmFsaWQgKHBhc3N3b3JkKSB7XG4gICAgaWYgKHBhc3N3b3JkLmxlbmd0aCA8IDYpIHtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiUGFzc3dvcmQgbXVzdCBiZSA2IGNoYXJhY3RlcnMgbG9uZyFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHBhc3N3b3JkICE9PSAkc2NvcGUucHcyKSB7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlRoZSBwYXNzd29yZCBmaWVsZHMgZG9uJ3QgbWF0Y2ghXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmICgvXFxXLy50ZXN0KHBhc3N3b3JkKSl7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlBhc3N3b3JkIGNhbm5vdCBjb250YWluIHNwZWNpYWwgY2hhcmFjdGVycyFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLnNob3dFcnJvciA9IGZhbHNlO1xuXG4gICRzY29wZS5kaXNwbGF5RXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJHNjb3BlLnNob3dFcnJvcjtcbiAgfVxuXG4gICRzY29wZS5zdWJtaXRTaWdudXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHBhc3N3b3JkVmFsaWQoJHNjb3BlLnBhc3N3b3JkKSl7XG4gICAgICBjb25zb2xlLmxvZyhcIm5vdyBJIGRvbid0IHdvcmshXCIpO1xuICAgICAgcmV0dXJuIFNpZ251cEZhY3Rvcnkuc3VibWl0KHtcbiAgICAgICBlbWFpbDogJHNjb3BlLmVtYWlsLFxuICAgICAgIHVzZXJuYW1lOiAkc2NvcGUudXNlcm5hbWUsXG4gICAgICAgcGFzc3dvcmQ6ICRzY29wZS5wYXNzd29yZCxcbiAgICAgICBmaXJzdF9uYW1lOiAkc2NvcGUuZmlyc3RuYW1lLFxuICAgICAgIGxhc3RfbmFtZTogJHNjb3BlLmxhc3RuYW1lLFxuICAgICAgIGlzQWRtaW46IGZhbHNlLFxuICAgICAgIG5ld1VzZXI6IHRydWVcbiAgICAgfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIC8vIHJlc3BvbnNlLm5ld1VzZXIgPSB0cnVlO1xuICAgICAgICByZXR1cm4gJHN0YXRlLmdvKCdwZXJzb25hbCcsIHtpZDogcmVzcG9uc2UuaWR9KTtcbiAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxufSk7IiwiLy8gYXBwLmZhY3RvcnkoJ1NpZ251cEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuLy8gICB2YXIgU2lnbnVwRmFjdG9yeSA9IHt9O1xuXG4vLyAgIFNpZ251cEZhY3Rvcnkuc3VibWl0ID0gZnVuY3Rpb24odXNlckluZm8pe1xuLy8gICBcdGNvbnNvbGUubG9nKHVzZXJJbmZvKTtcbi8vICAgXHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2VyLycsIHVzZXJJbmZvKVxuLy8gICBcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbi8vICAgXHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuLy8gICBcdH0pXG4vLyAgIH1cblxuLy8gICByZXR1cm4gU2lnbnVwRmFjdG9yeTtcblxuLy8gfSlcblxuYXBwLmZhY3RvcnkoJ1NpZ251cEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0dmFyIFNpZ251cEZhY3RvcnkgPSB7fTtcblxuXHRTaWdudXBGYWN0b3J5LnN1Ym1pdCA9IGZ1bmN0aW9uICh1c2VySW5mbykge1xuXHRcdGNvbnNvbGUubG9nKFwiRnJvbSBTaWdudXAgRmFjdG9yeVwiLCB1c2VySW5mbyk7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci8nLCB1c2VySW5mbylcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuXHR9XG5cdHJldHVybiBTaWdudXBGYWN0b3J5O1xufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0Y29udHJvbGxlcjogJ1NpZ251cEN0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3NpZ251cC9zaWdudXAudmlldy5odG1sJ1xuXHR9KTtcblxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ1VzZXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCB0aGVVc2VyLCB0aGVVc2VyU29ja3MsIEF1dGhTZXJ2aWNlLCBVc2VyRmFjdG9yeSkge1xuICAgIGNvbnNvbGUubG9nKFwiY29udHJvbGxlclwiLCB0aGVVc2VyU29ja3MpO1xuXHQkc2NvcGUudXNlciA9IHRoZVVzZXI7XG5cdCRzY29wZS5zb2NrcyA9IHRoZVVzZXJTb2NrcztcblxuXHQkc2NvcGUudG9TaGlwcGluZ0luZm8gPSBmdW5jdGlvbihpZCl7XG5cdFx0JHN0YXRlLmdvKCdwZXJzb25hbCcsIHtpZDogaWR9KTtcblx0fTtcblxuXHQkc2NvcGUudG9Tb2NrVmlldyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdCRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSlcblx0fTtcblxuXHRBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiB1c2VyLmlkID09ICRzY29wZS51c2VyLmlkIHx8IHVzZXIuaXNBZG1pbiA/IHRydWUgOiBmYWxzZVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgIFx0JHNjb3BlLnZlcmlmeVVzZXIgPSByZXN1bHRcbiAgICB9KTtcblxuXHRBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiB1c2VyLmlzQWRtaW4gPyB0cnVlIDogZmFsc2VcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICBcdCRzY29wZS5pc0FkbWluID0gcmVzdWx0XG4gICAgfSk7XG5cbiAgICBpZiAoJHNjb3BlLnVzZXIuaXNBZG1pbikgJHNjb3BlLmFkbWluQnV0dG9uID0gXCJNYWtlIE5vbi1BZG1pblwiXG4gICAgaWYgKCEkc2NvcGUudXNlci5pc0FkbWluKSAkc2NvcGUuYWRtaW5CdXR0b24gPSBcIk1ha2UgQWRtaW5cIlxuXG4gICAgJHNjb3BlLmRlbGV0ZSA9IFVzZXJGYWN0b3J5LmRlbGV0ZTtcbiAgICBcbiAgICAkc2NvcGUubWFrZUFkbWluID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgXHRyZXR1cm4gVXNlckZhY3RvcnkubWFrZUFkbWluKGlkKVxuICAgIFx0LnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgIFx0XHRpZiAoJHNjb3BlLnVzZXIuaXNBZG1pbikge1xuICAgIFx0XHRcdCRzY29wZS51c2VyLmlzQWRtaW4gPSBmYWxzZVxuICAgIFx0XHRcdCRzY29wZS5hZG1pbkJ1dHRvbiA9IFwiTWFrZSBBZG1pblwiXG4gICAgXHRcdH1cbiAgICBcdFx0ZWxzZSBpZiAoISRzY29wZS51c2VyLmlzQWRtaW4pIHtcbiAgICBcdFx0XHQkc2NvcGUudXNlci5pc0FkbWluID0gdHJ1ZVxuICAgIFx0XHRcdCRzY29wZS5hZG1pbkJ1dHRvbiA9IFwiTWFrZSBOb24tQWRtaW5cIlxuICAgIFx0XHR9XG4gICAgXHR9KTtcbiAgICB9XG59KVxuIiwiYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwLCAkc3RhdGUpIHtcblx0dmFyIFVzZXJGYWN0b3J5ID0ge307XG5cblx0VXNlckZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS91c2VyLycgKyBpZClcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZmFjdG9yeVwiLCByZXNwb25zZS5kYXRhKVxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGFcblx0XHR9KVxuXHR9XG5cblx0VXNlckZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS91c2VycycpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YVxuXHRcdH0pXG5cdH1cblxuXHRVc2VyRmFjdG9yeS5kZWxldGUgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2VyL2RlbGV0ZS8nICsgaWQpXG5cdFx0LnRoZW4oJHN0YXRlLmdvKCdob21lJykpXG5cdH1cblxuXHRVc2VyRmFjdG9yeS5tYWtlQWRtaW4gPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRyZXR1cm4gJGh0dHAucHV0KCcvYXBpL3VzZXIvbWFrZUFkbWluLycgKyBpZClcblx0fVxuXG5cdHJldHVybiBVc2VyRmFjdG9yeTtcbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgndXNlcicsIHtcblx0XHR1cmw6ICcvdXNlci86dXNlcklkJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy91c2VyL3VzZXItcHJvZmlsZS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnVXNlckN0cmwnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdHRoZVVzZXI6IGZ1bmN0aW9uIChVc2VyRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLnVzZXJJZCk7XG5cdFx0XHR9LFxuXHRcdFx0dGhlVXNlclNvY2tzOiBmdW5jdGlvbiAoU29ja0ZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuXHRcdFx0XHRyZXR1cm4gU29ja0ZhY3Rvcnkuc29ja0J5VXNlcklkKCRzdGF0ZVBhcmFtcy51c2VySWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSlcbn0pXG4iLCJhcHAuY29udHJvbGxlcignbmF2YmFyQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgU2VhcmNoRmFjdG9yeSwgT3JkZXJGYWN0b3J5KSB7XG5cblx0JHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uKHNlYXJjaFRlcm1zKXtcblx0XHQvLyBTZWFyY2hGYWN0b3J5LmZpbmRCeVNlYXJjaFRleHQoc2VhcmNoVGVybXMpXG5cdFx0Ly8gLnRoZW4oZnVuY3Rpb24ocmVzdWx0cyl7XG5cdFx0Ly8gXHQkc2NvcGUucmVzdWx0cyA9IHJlc3VsdHM7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhyZXN1bHRzKTtcblx0XHRcdHJldHVybiAkc3RhdGUuZ28oJ3NlYXJjaFJlc3VsdHMnLCB7c2VhcmNoVGVybXM6IHNlYXJjaFRlcm1zfSk7XG5cdFx0Ly8gfSlcblx0fVxuXG5cdHJldHVybiBPcmRlckZhY3RvcnkuZW5zdXJlQ2FydCgpXG5cdC50aGVuKGZ1bmN0aW9uKGlkKSB7XG5cdFx0Y29uc29sZS5sb2coaWQpXG5cdH0pXG59KVxuXG5hcHAuY29udHJvbGxlcignc2VhcmNoQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgYWxsUmVzdWx0cywgJHN0YXRlUGFyYW1zKSB7XG5cdCRzY29wZS5yZXN1bHRzID0gYWxsUmVzdWx0cztcblx0JHNjb3BlLnNlZVNvY2sgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHQkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG5cdH1cbn0pXG4iLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZmFjdG9yeShcIlNlYXJjaEZhY3RvcnlcIiwgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBTZWFyY2hGYWN0b3J5ID0ge307XG5cblx0U2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0ID0gZnVuY3Rpb24gKHRleHQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NlYXJjaC8/cT0nICsgdGV4dClcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHRzKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0cy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gU2VhcmNoRmFjdG9yeTtcbn0pIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSwgT3JkZXJGYWN0b3J5KSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIE9yZGVyRmFjdG9yeS5lbnN1cmVDYXJ0KClcblxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ015IFByb2ZpbGUnLCBzdGF0ZTogJ3VzZXIoe3VzZXJJZDp1c2VyLmlkfSknLCBhdXRoOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgLy8geyBsYWJlbDogJ0Fib3V0Jywgc3RhdGU6ICdhYm91dCcgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnRGVzaWduIGEgU29jaycsIHN0YXRlOiAnZGVzaWduVmlldycgfSxcbiAgICAgICAgICAgICAgICAvLyB7IGxhYmVsOiAnQWRtaW4gRGFzaGJvYXJkJywgc3RhdGU6ICdhZG1pbid9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS5hZG1pbkl0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHtsYWJlbDogJ0FkbWluIERhc2hib2FyZCcsIHN0YXRlOiAnYWRtaW4nfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKClcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ29hdXRoQnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICBwcm92aWRlck5hbWU6ICdAJ1xuICAgIH0sXG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uaHRtbCdcbiAgfVxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
