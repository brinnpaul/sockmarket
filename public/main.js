'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

window.app = angular.module('sockmarket', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'stripe', 'infinite-scroll']);

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

app.controller('AdminCtrl', function ($scope, $state) {});
app.config(function ($stateProvider) {
  $stateProvider.state('admin', {
    url: '/admin',
    templateUrl: 'js/admin/admin.html',
    controller: 'AdminCtrl'
  }).state('admin.socks', {
    templateUrl: 'js/admin/views/admin.socks.html',
    resolve: {
      socks: function socks(SockFactory) {
        return SockFactory.allSocks();
      }
    },
    controller: function controller($scope, socks, SockFactory, ReviewFactory) {
      $scope.socks = socks;
      console.log(socks);
      $scope.deleteSock = function (id) {
        console.log("deleteSock");
        return SockFactory.delete(id).then(function () {
          $scope.socks = $scope.socks.filter(function (sock) {
            if (sock.id !== id) return sock;
          });
        });
      };

      $scope.deleteReview = function (id) {
        return ReviewFactory.delete(id).then(function (review) {
          $scope.socks = $scope.socks.map(function (sock) {
            if (sock.id !== review.sockId) {
              return sock;
            } else {
              sock.reviews = sock.reviews.filter(function (reviewOnSock) {
                return reviewOnSock.id !== id;
              });
              return sock;
            }
          });
        });
      };
    }
  }).state('admin.users', {
    templateUrl: 'js/admin/views/admin.users.html',
    resolve: {
      users: function users(UserFactory) {
        return UserFactory.fetchAll();
      }
    }
  });
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

// app.config(function ($stateProvider) {
//
//     $stateProvider.state('admin', {
//         url: '/admin',
//         template: '<img ng-repeat="item in stash" width="300" ng-src="{{ item }}" />',
//         controller: function ($scope, SecretStash) {
//             SecretStash.getStash().then(function (stash) {
//                 $scope.stash = stash;
//             });
//         },
//         // The following data.authenticate is read by an event listener
//         // that controls access to this state. Refer to app.js.
//         data: {
//             authenticate: false
//         }
//     });
//
// });
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
      var displayError = false;

      scope.preventSubmission = function () {
        return displayError;
      };

      var invalidSubmission = function invalidSubmission(title, description, tags) {
        if (title === undefined) {
          displayError = true;
          scope.errorMessage = "Your socks need a title!";
          return true;
        } else if (description === undefined) {
          displayError = true;
          scope.errorMessage = "Your socks need a description!";
          return true;
        } else if (tags === undefined) {
          displayError = true;
          scope.errorMessage = "Your socks need some tags!";
          return true;
        }
      };

      scope.saveDesign = function (title, description, tags) {

        if (invalidSubmission(title, description, tags)) {
          return invalidSubmission(title, description, tags);
        }

        var tagsArr = SockFactory.prepareTags(tags);

        var newSockDataObj = {
          title: title,
          description: description,
          tags: tagsArr
        };

        // return SockFactory.saveDesign(newSockDataObj)
        // .then(function(result) {
        // 	$state.go('user', {userId: result.data.userId})
        // })

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

app.controller('DesignViewCtrl', function ($scope) {

  $scope.errorMessage = "hi";
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

app.controller('homeCtrl', function ($scope, mostRecentSocks, mostPopularSocks, recentlyPurchasedSocks, SockFactory, $state, $stateParams) {

  $scope.mostRecentSocks = mostRecentSocks;
  $scope.mostPopularSocks = mostPopularSocks;
  $scope.recentlyPurchasedSocks = recentlyPurchasedSocks;

  console.log("IM YOUR RECENT SOCKS", $scope.recentlyPurchasedSocks);

  $scope.maxSockId = null;
  $scope.browseSocks = [];
  $scope.busy = false;

  $scope.loadSocks = function (id) {
    if (this.busy) return;
    if (this.maxSockId === 'done') return;
    this.busy = true;

    return SockFactory.browseSocks(id).then(function (socks) {
      console.log(socks);
      if (socks.length === 0) return $scope.maxSockId = 'done';
      $scope.maxSockId = socks[socks.length - 1].id;
      $scope.busy = false;
      $scope.browseSocks = $scope.browseSocks.concat(socks);
    });
  };

  $scope.formatBrowseSockTitle = function (title) {
    if (title.length < 24) {
      return title;
    } else {
      return title.slice(0, 23) + '...';
    }
  };

  $scope.seeSock = function (id) {
    $state.go('singleSockView', { id: id });
  };
  $scope.seeUser = function (id) {
    $state.go('user', { userId: id });
  };
});

app.directive('sockDetail', function ($state) {
  return {
    restrict: 'E',
    templateUrl: "js/home/sockdetail.html",
    scope: {
      sock: '='
    },
    link: function link(scope) {
      scope.formatBrowseSockTitle = function (title) {
        if (title.length < 20) {
          return title;
        } else {
          return title.slice(0, 19) + '...';
        }
      };

      scope.seeSock = function (id) {
        $state.go('singleSockView', { id: id });
      };
      scope.seeUser = function (id) {
        $state.go('user', { userId: id });
      };
    }
  };
});
app.config(function ($stateProvider) {
  $stateProvider.state('home', {
    url: '/',
    templateUrl: 'js/home/home.html',
    controller: 'homeCtrl',
    resolve: {
      mostRecentSocks: function mostRecentSocks(SockFactory) {
        return SockFactory.mostRecentSocks();
      },
      mostPopularSocks: function mostPopularSocks(SockFactory) {
        return SockFactory.mostPopularSocks();
      },
      recentlyPurchasedSocks: function recentlyPurchasedSocks(SockFactory) {
        return SockFactory.recentlyPurchasedSocks();
      }
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

  $scope.switchToSignupPage = function () {
    return $state.go('signup');
  };

  $scope.sendLogin = function (loginInfo) {

    $scope.error = null;

    AuthService.login(loginInfo).then(function () {
      $state.go('home');
    }).catch(function () {
      $scope.error = 'Invalid login credentials.';
    });
  };
});
app.factory('LikeFactory', function ($http) {

  return {
    getAllLikes: function getAllLikes() {
      return $http.get('/api/like').then(function (likes) {
        return likes.data;
      });
    },
    getSockLikes: function getSockLikes(sockId) {
      return $http.get('/api/like/sock/' + sockId).then(function (likes) {
        return likes.data;
      });
    },
    getUserSockLike: function getUserSockLike(sockId) {
      return $http.get('/api/like/user/sock/' + sockId).then(function (like) {
        return like.data;
      });
    },
    getUserLikes: function getUserLikes(userId) {
      return $http.get('/api/like/user/' + userId).then(function (likes) {
        return likes.data;
      });
    },
    newLike: function newLike(sockId) {
      return $http.post('api/like/like/' + sockId).then(function (like) {
        return like.data;
      });
    },
    newDislike: function newDislike(sockId) {
      return $http.post('api/like/dislike/' + sockId).then(function (like) {
        return like.data;
      });
    },
    updateLike: function updateLike(sockId) {
      return $http.put('api/like/like/' + sockId).then(function (like) {
        return like.data;
      });
    },
    updateDislike: function updateDislike(sockId) {
      return $http.put('api/like/dislike/' + sockId).then(function (like) {
        return like.data;
      });
    }
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
      return $state.go('user', { userId: $scope.userId });
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
app.controller('sockIdController', function ($scope, $state, AuthService, $stateParams, theSock, theReviews, currentUserLike, sockLikes, ReviewFactory, OrderFactory, SockFactory, UserFactory, LikeFactory) {

  $scope.reviewNotAllowed = false;
  $scope.sock = theSock;
  $scope.reviews = theReviews;
  $scope.like = currentUserLike || { like: false, dislike: false };
  $scope.currentUserReviewedSock = false;

  function countLikes(votes) {
    var likes = 0,
        dislikes = 0;
    votes.forEach(function (vote) {
      if (vote.like) likes++;
      if (vote.dislike) dislikes++;
    });
    return { likes: likes, dislikes: dislikes };
  }

  $scope.likes = countLikes(sockLikes);

  $scope.updateLikes = function (sockId) {
    return LikeFactory.getSockLikes(sockId).then(function (likes) {
      $scope.likes = countLikes(likes);
    });
  };

  $scope.dateParser = function (rawDate) {
    var rawDate = theSock.createdAt.split("T")[0].split("-");
    var rawYear = rawDate[0];
    var rawMonth = rawDate[1];
    var rawDay = rawDate[2];
    var monthObj = {
      "01": "January",
      "02": "February",
      "03": "March",
      "04": "April",
      "05": "May",
      "06": "June",
      "07": "July",
      "08": "August",
      "09": "September",
      "10": "October",
      "11": "November",
      "12": "December"
    };
    return rawDay + " " + monthObj[rawMonth] + " " + rawYear;
  };

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
    var item = {
      sockId: $scope.sock.id,
      quantity: +$scope.quantity,
      originalPrice: +$scope.sock.price
    };
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
    } else if (usersWhoReviewedSock.indexOf($scope.loggedInUserId) !== -1 || $scope.userCannotPostReview()) {
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
          $scope.reviewNotAllowed = true;
        });
      }
  };

  $scope.newLike = LikeFactory.newLike;
  $scope.newDislike = LikeFactory.newDislike;
  $scope.updateLike = LikeFactory.updateLike;
  $scope.updateDislike = LikeFactory.updateDislike;

  $scope.vote = function (sockId, nnew, update) {
    if (!$scope.verifyUser) $scope.alert("Please log in to like a sock!");

    if (!$scope.like.like && !$scope.like.dislike) {
      nnew(sockId).then(function (vote) {
        $scope.like = vote;
        $scope.likes = $scope.updateLikes($scope.sock.id);
      });
    } else {
      update(sockId).then(function (update) {
        $scope.like = update;
        $scope.likes = $scope.updateLikes($scope.sock.id);
      });
    }
  };

  AuthService.getLoggedInUser().then(function (user) {
    return user.id == $scope.sock.UserId || user.isAdmin ? true : false;
  }).then(function (result) {
    $scope.verifyUser = result;
  });

  $scope.delete = function (id) {
    return SockFactory.delete(id).then(function () {
      $state.go('home');
    });
  };
});

app.factory('SockFactory', function ($http) {

  return {
    allSocks: function allSocks() {
      return $http.get('api/sock').then(function (res) {
        return res.data;
      });
    },

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

    mostPopularSocks: function mostPopularSocks() {
      return $http.get('/api/sock/popular').then(function (res) {
        return res.data;
      });
    },

    recentlyPurchasedSocks: function recentlyPurchasedSocks() {
      return $http.get('/api/sock/recent-purchase').then(function (res) {
        return res.data;
      });
    },

    browseSocks: function browseSocks(id) {
      return $http.get('/api/sock/browse/' + id).then(function (res) {
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
      console.log(id);
      return $http.delete('/api/sock/delete/' + id).then(function (res) {
        return res.data;
      });
    }

  };
});

app.config(function ($stateProvider) {

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
      },
      currentUserLike: function currentUserLike($stateParams, LikeFactory, AuthService) {
        return AuthService.getLoggedInUser().then(function (user) {
          if (user) return LikeFactory.getUserSockLike($stateParams.id);else return "no user data";
        });
      },
      sockLikes: function sockLikes($stateParams, LikeFactory) {
        return LikeFactory.getSockLikes($stateParams.id);
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
    },
    delete: function _delete(reviewId) {
      return $http.delete('api/review/delete/' + reviewId).then(function (res) {
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
app.controller('SignupCtrl', function ($scope, SignupFactory, $state, AuthService) {

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
      return SignupFactory.submit({
        email: $scope.email,
        username: $scope.username,
        password: $scope.password,
        first_name: $scope.firstname,
        last_name: $scope.lastname,
        isAdmin: false,
        newUser: true
      }).then(function (response) {
        var loginObj = {};
        loginObj.email = $scope.email;
        loginObj.password = $scope.password;
        AuthService.login(loginObj).then(function (response) {
          return $state.go('personal', { id: response.id });
        });
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

  $scope.dateParser = function () {
    var rawDate = $scope.user.createdAt.split("T")[0].split("-");
    var rawYear = rawDate[0];
    var rawMonth = rawDate[1];
    var rawDay = rawDate[2];

    var monthObj = {
      "01": "January",
      "02": "February",
      "03": "March",
      "04": "April",
      "05": "May",
      "06": "June",
      "07": "July",
      "08": "August",
      "09": "September",
      "10": "October",
      "11": "November",
      "12": "December"
    };
    return rawDay + " " + monthObj[rawMonth] + " " + rawYear;
  };

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
      return response.data;
    });
  };

  UserFactory.fetchAll = function () {
    return $http.get('/api/user/all').then(function (response) {
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

app.directive('sockAdminRow', function () {
  return {
    restrict: 'E',
    scope: {
      sock: "=sockAdminRow"
    },
    templateUrl: 'js/admin/views/sockAdminRow.html',
    link: function link(scope) {}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiYWRtaW4vYWRtaW4uY29udHJvbGxlci5qcyIsImFkbWluL2FkbWluLnN0YXRlLmpzIiwiYWRtaW4vbWVtYmVycy1vbmx5LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuY29udHJvbGxlci5qcyIsImNoZWNrb3V0L2NoZWNrb3V0LmZhY3RvcnkuanMiLCJjaGVja291dC9jaGVja291dC5zdGF0ZS5qcyIsImRlc2lnbi9kZXNpZ24tZGlyZWN0aXZlLmpzIiwiZGVzaWduL2Rlc2lnbi5jb250cm9sbGVyLmpzIiwiZGVzaWduL2Rlc2lnbi5qcyIsImRlc2lnbi9kZXNpZ24uc3RhdGUuanMiLCJkb2NzL2RvY3MuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5jb250cm9sbGVyLmpzIiwiaG9tZS9ob21lLmRpcmVjdGl2ZS5qcyIsImhvbWUvaG9tZS5zdGF0ZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibGlrZS9saWtlLmZhY3RvcnkuanMiLCJvcmRlci9vcmRlci5jb250cm9sbGVyLmpzIiwib3JkZXIvb3JkZXIuZGlyZWN0aXZlLmpzIiwib3JkZXIvb3JkZXIuZmFjdG9yeS5qcyIsIm9yZGVyL29yZGVyLnN0YXRlLmpzIiwicGVyc29uYWxpbmZvL3BlcnNvbmFsaW5mby5jb250cm9sbGVyLmpzIiwicGVyc29uYWxpbmZvL3BlcnNvbmFsaW5mby5mYWN0b3J5LmpzIiwicGVyc29uYWxpbmZvL3BlcnNvbmFsaW5mby5zdGF0ZS5qcyIsInByb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3LmNvbnRyb2xsZXIuanMiLCJwcm9kdWN0dmlldy9wcm9kdWN0dmlldy5mYWN0b3J5LmpzIiwicHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuc3RhdGUuanMiLCJyZXZpZXcvcmV2aWV3LmZhY3RvcnkuanMiLCJzZWFyY2hyZXN1bHRzL3NlYXJjaC5zdGF0ZS5qcyIsInNpZ251cC9zaWdudXAuY29udHJvbGxlci5qcyIsInNpZ251cC9zaWdudXAuZmFjdG9yeS5qcyIsInNpZ251cC9zaWdudXAuc3RhdGUuanMiLCJ1c2VyL3VzZXItY29udHJvbGxlci5qcyIsInVzZXIvdXNlci1mYWN0b3J5LmpzIiwidXNlci91c2VyLXN0YXRlcy5qcyIsImNvbW1vbi9jb250cm9sbGVycy9uYXZiYXIuY29udHJvbGxlci5qcyIsImFkbWluL3ZpZXdzL3NvY2tBZG1pblJvdy5kaXJlY3RpdmUuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvc2VhcmNoLmZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmRpcmVjdGl2ZS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsWUFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLFFBQUEsRUFBQSxpQkFBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEsb0JBQUEsU0FBQSxDQUFBLElBQUE7O0FBRUEscUJBQUEsU0FBQSxDQUFBLEdBQUE7O0FBRUEscUJBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUEsUUFBQSxDQUFBLE1BQUE7QUFDQSxHQUZBO0FBR0EsU0FBQSxpQkFBQSxDQUFBLGtDQUFBO0FBQ0EsQ0FWQTs7O0FBYUEsSUFBQSxHQUFBLENBQUEsVUFBQSxV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QSxDQUFBLE9BQUEsRUFBQTtBQUNBLGNBQUEsU0FBQSxLQUFBLFFBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsUUFBQSxFQUFBO0FBQ0EsZUFBQSxJQUFBLElBQUEsQ0FBQSxFQUFBLElBQUEsT0FBQSxNQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsSUFBQSxDQUFBLE9BQUEsVUFBQSxDQUFBLENBQUEsQ0FBQTtBQUNBO0FBQ0EsaUJBQUEsSUFBQSxJQUFBLENBQUEsQ0FBQSxJQUFBLFVBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxFQUFBLEVBQUEsTUFBQSxXQUFBLEVBQUEsQ0FBQTtBQUNBOztBQUVBLFlBQUEsVUFBQSxPQUFBLFNBQUEsQ0FBQSxXQUFBLENBQUE7QUFDQSxZQUFBLFdBQUEsY0FBQSxPQUFBLENBQUE7O0FBRUEsb0JBQUEsY0FBQSxHQUNBLElBREEsQ0FDQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGNBQUEsV0FBQSxJQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQTs7QUFFQSxnQkFBQSxHQUFBLENBQUEsSUFBQSxHQUFBLEVBQUEsUUFBQSxFQUNBLEVBQUEsU0FBQTtBQUNBLDhCQUFBLFdBREE7QUFFQSxtQkFBQTtBQUZBLGFBQUEsRUFEQSxFQUtBLElBTEEsQ0FLQSxVQUFBLEdBQUEsRUFBQTtBQUNBLDJCQUFBLEtBQUEsR0FBQSxRQUFBO0FBQ0Esd0JBQUEsVUFBQSxDQUFBLGNBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxNQUFBLEVBQUE7QUFDQSxxQkFBQSxFQUFBLENBQUEsTUFBQSxFQUFBLEVBQUEsUUFBQSxPQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxhQUhBO0FBSUEsV0FYQTtBQVlBLFNBaEJBO0FBaUJBLE9BaERBOztBQW1EQSxVQUFBLFFBQUEsRUFBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUE7QUFDQSxVQUFBLFVBQUEsRUFBQSxRQUFBLEVBQUEsQ0FBQSxFQUFBLFVBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxVQUFBLFVBQUEsRUFBQSxRQUFBLENBQUE7QUFDQSxVQUFBLFNBQUE7QUFDQSxVQUFBLFlBQUEsS0FBQTs7QUFFQSxVQUFBLGFBQUEsSUFBQSxLQUFBLEVBQUE7O0FBRUEsaUJBQUEsR0FBQSxHQUFBLGdCQUFBOztBQUVBLGlCQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsU0FBQSxDQUFBLFVBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQTtBQUNBLE9BRkE7OztBQUtBLFFBQUEsV0FBQSxFQUFBLEVBQUEsQ0FBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLFlBQUE7O0FBRUEsVUFBQSxJQUFBLEVBQUEsUUFBQSxHQUFBLFdBQUEsQ0FBQSxVQUFBOztBQUVBLFVBQUEsSUFBQSxFQUFBLFFBQUEsQ0FBQSxVQUFBOztBQUVBLGdCQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxDQUFBO0FBQ0EsT0FQQTs7O0FBVUEsUUFBQSxvQkFBQSxFQUFBLEtBQUEsQ0FBQSxZQUFBOztBQUVBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsTUFBQTtBQUNBLE9BSkE7OztBQU9BLGVBQUEsV0FBQSxHQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLFFBQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsVUFBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLEVBQUEsU0FBQSxDQUFBLEdBQUEsSUFBQSxHQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLEdBQUE7O0FBSUE7O0FBRUEsUUFBQSxtQkFBQSxFQUFBLEVBQUEsQ0FBQSxPQUFBLEVBQUEsV0FBQTs7O0FBR0EsUUFBQSxjQUFBLEVBQUEsS0FBQSxDQUFBLFlBQUE7O0FBRUEsWUFBQSxZQUFBLEVBQUEsV0FBQSxDQUFBO0FBQ0Esa0JBQUEsR0FBQSxDQUFBLGtCQUFBLEVBQUEsRUFBQSxX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QUEsQ0FBQSxLQUFBLEVBQUEsRUFBQSxLQUFBLElBQUE7QUFDQSxpQkFBQSxVQUFBLENBQUEsWUFBQSxZQUFBO0FBQ0EsYUFBQSxLQUFBLElBQUE7QUFDQTs7OztBQUlBLFNBQUEsZUFBQSxHQUFBLFlBQUE7QUFDQSxhQUFBLENBQUEsQ0FBQSxRQUFBLElBQUE7QUFDQSxLQUZBOztBQUlBLFNBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsVUFBQSxLQUFBLGVBQUEsTUFBQSxlQUFBLElBQUEsRUFBQTtBQUNBLGVBQUEsR0FBQSxJQUFBLENBQUEsUUFBQSxJQUFBLENBQUE7QUFDQTs7Ozs7QUFLQSxhQUFBLE1BQUEsR0FBQSxDQUFBLFVBQUEsRUFBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTtBQUNBLGVBQUEsSUFBQTtBQUNBLE9BRkEsQ0FBQTtBQUlBLEtBckJBOztBQXVCQSxTQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsRUFDQSxJQURBLENBQ0EsaUJBREEsRUFFQSxLQUZBLENBRUEsWUFBQTtBQUNBLGVBQUEsR0FBQSxNQUFBLENBQUEsRUFBQSxTQUFBLDRCQUFBLEVBQUEsQ0FBQTtBQUNBLE9BSkEsQ0FBQTtBQUtBLEtBTkE7O0FBUUEsU0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsU0FBQSxFQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsZ0JBQUEsT0FBQTtBQUNBLG1CQUFBLFVBQUEsQ0FBQSxZQUFBLGFBQUE7QUFDQSxPQUhBLENBQUE7QUFJQSxLQUxBO0FBT0EsR0FyREE7O0FBdURBLE1BQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsUUFBQSxPQUFBLElBQUE7O0FBRUEsZUFBQSxHQUFBLENBQUEsWUFBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBLE9BQUE7QUFDQSxLQUZBOztBQUlBLGVBQUEsR0FBQSxDQUFBLFlBQUEsY0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBLE9BQUE7QUFDQSxLQUZBOztBQUlBLFNBQUEsRUFBQSxHQUFBLElBQUE7QUFDQSxTQUFBLElBQUEsR0FBQSxJQUFBOztBQUVBLFNBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxHQUFBLFNBQUE7QUFDQSxXQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsS0FIQTs7QUFLQSxTQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxFQUFBLEdBQUEsSUFBQTtBQUNBLFdBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxLQUhBO0FBS0EsR0F6QkE7QUEyQkEsQ0FwSUE7O0FDQUEsSUFBQSxVQUFBLENBQUEsVUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLHNCQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUE7O0FBRUEsU0FBQSxlQUFBLEdBQUEsZUFBQTtBQUNBLFNBQUEsZ0JBQUEsR0FBQSxnQkFBQTtBQUNBLFNBQUEsc0JBQUEsR0FBQSxzQkFBQTs7QUFFQSxVQUFBLEdBQUEsQ0FBQSxzQkFBQSxFQUFBLE9BQUEsc0JBQUE7O0FBRUEsU0FBQSxTQUFBLEdBQUEsSUFBQTtBQUNBLFNBQUEsV0FBQSxHQUFBLEVBQUE7QUFDQSxTQUFBLElBQUEsR0FBQSxLQUFBOztBQUVBLFNBQUEsU0FBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsUUFBQSxLQUFBLElBQUEsRUFBQTtBQUNBLFFBQUEsS0FBQSxTQUFBLEtBQUEsTUFBQSxFQUFBO0FBQ0EsU0FBQSxJQUFBLEdBQUEsSUFBQTs7QUFFQSxXQUFBLFlBQUEsV0FBQSxDQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLEdBQUEsQ0FBQSxLQUFBO0FBQ0EsVUFBQSxNQUFBLE1BQUEsS0FBQSxDQUFBLEVBQUEsT0FBQSxPQUFBLFNBQUEsR0FBQSxNQUFBO0FBQ0EsYUFBQSxTQUFBLEdBQUEsTUFBQSxNQUFBLE1BQUEsR0FBQSxDQUFBLEVBQUEsRUFBQTtBQUNBLGFBQUEsSUFBQSxHQUFBLEtBQUE7QUFDQSxhQUFBLFdBQUEsR0FBQSxPQUFBLFdBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBO0FBQ0EsS0FQQSxDQUFBO0FBU0EsR0FkQTs7QUFnQkEsU0FBQSxxQkFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsUUFBQSxNQUFBLE1BQUEsR0FBQSxFQUFBLEVBQUE7QUFDQSxhQUFBLEtBQUE7QUFDQSxLQUZBLE1BRUE7QUFDQSxhQUFBLE1BQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxFQUFBLElBQUEsS0FBQTtBQUNBO0FBQ0EsR0FOQTs7QUFRQSxTQUFBLE9BQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLGdCQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUNBLEdBRkE7QUFHQSxTQUFBLE9BQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLE1BQUEsRUFBQSxFQUFBLFFBQUEsRUFBQSxFQUFBO0FBQ0EsR0FGQTtBQUdBLENBMUNBOztBQ0FBLElBQUEsU0FBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxpQkFBQSx5QkFGQTtBQUdBLFdBQUE7QUFDQSxZQUFBO0FBREEsS0FIQTtBQU1BLFVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLHFCQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLE1BQUEsTUFBQSxHQUFBLEVBQUEsRUFBQTtBQUNBLGlCQUFBLEtBQUE7QUFDQSxTQUZBLE1BRUE7QUFDQSxpQkFBQSxNQUFBLEtBQUEsQ0FBQSxDQUFBLEVBQUEsRUFBQSxJQUFBLEtBQUE7QUFDQTtBQUNBLE9BTkE7O0FBUUEsWUFBQSxPQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxlQUFBLEVBQUEs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LGNBQUEsR0FEQTtBQUVBLFdBQUEsRUFGQTtBQUdBLGlCQUFBLHVCQUhBO0FBSUEsVUFBQSxjQUFBLEtBQUEsRUFBQTs7QUFFQSxZQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxhQUFBLGNBQUEsQ0FBQSxTQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsU0FBQSxFQUFBO0FBQUEsZ0JBQUEsVUFBQSxHQUFBLFNBQUE7QUFBQSxTQURBLENBQUE7QUFFQSxPQUhBOztBQUtBLFlBQUEsU0FBQSxHQUNBLElBREEsQ0FDQSxZQUFBO0FBQUEsZ0JBQUEsR0FBQSxDQUFBLE1BQUEsVUFBQTtBQUFBLE9BREE7O0FBR0EsYUFBQSxhQUFBLFFBQUEsQ0FBQSxTQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsT0FBQSxFQUFBO0FBQUEsY0FBQSxXQUFBLEdBQUEsT0FBQTtBQUFBLE9BREEsQ0FBQTtBQUVBO0FBaEJBLEdBQUE7QUFtQkEsQ0FyQkE7O0FDaERBLElBQUEsT0FBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLE1BQUEsYUFBQSxFQUFBO0FBQ0EsTUFBQSxZQUFBLFNBQUEsU0FBQSxDQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxXQUFBLElBQUEsR0FBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQUEsYUFBQSxLQUFBLE1BQUE7QUFBQSxLQUFBLEVBQUEsT0FBQSxDQUFBLElBQUEsTUFBQSxNQUFBLENBQUEsQ0FBQSxHQUFBLEtBQUEsR0FBQSxJQUFBO0FBQ0EsR0FGQTtBQUdBLFNBQUE7QUFDQSxlQUFBLG1CQUFBLEdBQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsb0JBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFBQSxlQUFBLFVBQUEsR0FBQSxFQUFBLElBQUEsSUFBQSxDQUFBO0FBQUEsT0FEQSxFQUVBLElBRkEsQ0FFQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFlBQUEsTUFBQSxFQUFBO0FBQ0EsaUJBQUEsa0JBQUE7QUFDQSxTQUZBLE1BRUE7QUFDQSxpQkFBQSxNQUFBLElBQUEsQ0FBQSxhQUFBLEVBQUEsR0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEdBQUEsRUFBQTtBQUFBLG1CQUFBLElBQUEsSUFBQTtBQUFBLFdBREEsQ0FBQTtBQUVBO0FBQ0EsT0FUQSxDQUFBO0FBVUEsS0FaQTtBQWFBLGNBQUEsa0JBQUEsSUFBQSxFQUFBOztBQUVBLGFBQUEsTUFBQSxHQUFBLENBQUEsZ0JBQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHFCQUFBLE1BQUEsSUFBQTtBQUNBLGVBQUEsY0FBQSxFQUFBO0FBQ0EsT0FKQSxDQUFBO0FBS0EsS0FwQkE7QUFxQkEsb0JBQUEsd0JBQUEsSUFBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUEsQ0FBQSxnQkFBQSxJQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsS0FBQSxFQUFBO0FBQ0EscUJBQUEsTUFBQSxJQUFBO0FBQ0EsZUFBQSxjQUFBLEVBQUE7QUFDQSxPQUpBLEVBS0EsSUFMQSxDQUtBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsWUFBQSxTQUFBLFNBQUEsRUFBQTtBQUNBLGlCQUFBLEtBQUEsTUFBQSxDQUFBLFVBQUEsQ0FBQSxFQUFBLElBQUEsRUFBQTtBQUFBLG1CQUFBLElBQ0EsS0FBQSxJQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsUUFEQTtBQUNBLFdBREEsRUFDQSxDQURBLENBQUE7QUFFQSxTQUhBLE1BR0E7QUFDQSxpQkFBQSxLQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxtQkFBQSxJQUFBLE1BQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxxQkFBQSxJQUFBLEtBQUEsSUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLFFBQUE7QUFBQSxhQURBLEVBQ0EsQ0FEQSxDQUFBO0FBRUEsV0FIQSxFQUdBLENBSEEsQ0FBQTtBQUlBO0FBQ0EsT0FmQSxDQUFBO0FBZ0JBLEtBdENBO0FBdUNBLGdCQUFBLG9CQUFBLEdBQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsWUFBQSxFQUFBLEdBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxJQUFBLEVBQUE7QUFBQSxlQUFBLEtBQUEsSUFBQTtBQUFBLE9BREEsQ0FBQTtBQUVBLEtBMUNBO0FBMkNBLGdCQUFBLG9CQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxNQUFBLENBQUEsZ0JBQUEsTUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLE1BQUEsQ0FBQSxXQUFBLEdBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUFBLGlCQUFBLEtBQUEsRUFBQTtBQUFBLFNBQUEsRUFBQSxPQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsQ0FBQTtBQUNBLGVBQUEsVUFBQTtBQUNBLE9BSkEsQ0FBQTtBQUtBLEtBakRBO0FBa0RBLGdCQUFBLHNCQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUEsQ0FBQSx1QkFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsRUFBQSxRQUFBLE1BQUEsSUFBQSxFQUFBO0FBQ0EsT0FIQSxDQUFBO0FBSUE7O0FBdkRBLEdBQUE7QUEwREEsQ0EvREE7O0FDREEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0EsU0FBQSxlQURBO0FBRUEsaUJBQUEscUJBRkE7QUFHQSxnQkFBQSxhQUhBO0FBSUEsYUFBQTtBQUNBLG1CQUFBLHFCQUFBLFlBQUEsRUFBQTtBQUNBLGVBQUEsYUFBQSxRQUFBLENBQUEsU0FBQSxDQUFBO0FBQ0E7QUFIQTtBQUpBLEdBQUE7O0FBV0EsaUJBQUEsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLFNBQUEsZUFEQTtBQUVBLGlCQUFBLHFCQUZBO0FBR0EsZ0JBQUEsYUFIQTtBQUlBLGFBQUE7QUFDQSxtQkFBQSxxQkFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLGFBQUEsUUFBQSxDQUFBLFNBQUEsQ0FBQTtBQUNBO0FBSEE7QUFKQSxHQUFBO0FBV0EsQ0F2QkE7O0FDQUEsSUFBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLE9BQUEsRUFBQSxtQkFBQSxFQUFBOztBQUVBLFNBQUEsTUFBQSxHQUFBLFFBQUEsRUFBQTtBQUNBLFNBQUEsUUFBQSxHQUFBLFFBQUEsUUFBQTtBQUNBLFNBQUEsUUFBQSxHQUFBLFFBQUEsUUFBQTtBQUNBLFNBQUEsR0FBQSxHQUFBLFFBQUEsR0FBQTtBQUNBLFNBQUEsS0FBQSxHQUFBLFFBQUEsS0FBQTtBQUNBLFNBQUEsT0FBQSxHQUFBLFFBQUEsT0FBQTtBQUNBLFNBQUEsS0FBQSxHQUFBLFFBQUEsS0FBQTtBQUNBLFNBQUEsWUFBQSxHQUFBLEtBQUE7O0FBRUEsU0FBQSxjQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxRQUFBLENBQUEsT0FBQSxPQUFBLEtBQUEsZUFBQSxJQUFBLE9BQUEsT0FBQSxLQUFBLFFBQUEsS0FBQSxPQUFBLEtBQUEsS0FBQSxFQUFBLEVBQUE7QUFDQSxhQUFBLFlBQUEsR0FBQSxJQUFBO0FBQ0EsYUFBQSxPQUFBLFlBQUEsR0FBQSxpREFBQTtBQUNBOztBQUVBLFFBQUEsV0FBQTtBQUNBLGdCQUFBLE9BQUEsUUFEQTtBQUVBLGdCQUFBLE9BQUEsUUFGQTtBQUdBLFdBQUEsT0FBQSxHQUhBO0FBSUEsYUFBQSxPQUFBLEtBSkE7QUFLQSxlQUFBLE9BQUEsT0FMQTtBQU1BLGFBQUEsT0FBQTtBQU5BLEtBQUE7O0FBU0EsV0FBQSxvQkFBQSxNQUFBLENBQUEsT0FBQSxNQUFBLEVBQUEsUUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGFBQUEsT0FBQSxFQUFBLENBQUEsTUFBQSxFQUFBLEVBQUEsUUFBQSxPQUFBLE1BQUEsRUFBQSxDQUFBO0FBQ0EsS0FIQSxDQUFBO0FBSUEsR0FuQkE7QUFxQkEsQ0FoQ0E7QUNBQSxJQUFBLE9BQUEsQ0FBQSxxQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOzs7O0FBSUEsU0FBQTtBQUNBLFlBQUEsZ0JBQUEsRUFBQSxFQUFBLFFBQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsZUFBQSxFQUFBLEVBQUEsUUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGVBQUEsU0FBQSxJQUFBO0FBQ0EsT0FIQSxDQUFBO0FBSUE7QUFOQSxHQUFBO0FBU0EsQ0FiQTs7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxpQkFBQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsU0FBQSxlQURBO0FBRUEsZ0JBQUEsa0JBRkE7QUFHQSxpQkFBQSx5Q0FIQTtBQUlBLGFBQUE7QUFDQSxlQUFBLGlCQUFBLFlBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxlQUFBLFlBQUEsU0FBQSxDQUFBLGFBQUEsRUFBQSxDQUFBO0FBQ0E7QUFIQTtBQUpBLEdBQUE7QUFVQSxDQVpBO0FDQUEsSUFBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLGVBQUEsRUFBQSxTQUFBLEVBQUEsYUFBQSxFQUFBLFlBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQTs7QUFFQSxTQUFBLGdCQUFBLEdBQUEsS0FBQTtBQUNBLFNBQUEsSUFBQSxHQUFBLE9BQUE7QUFDQSxTQUFBLE9BQUEsR0FBQSxVQUFBO0FBQ0EsU0FBQSxJQUFBLEdBQUEsbUJBQUEsRUFBQSxNQUFBLEtBQUEsRUFBQSxTQUFBLEtBQUEsRUFBQTtBQUNBLFNBQUEsdUJBQUEsR0FBQSxLQUFBOztBQUVBLFdBQUEsVUFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLFFBQUEsUUFBQSxDQUFBO1FBQ0EsV0FBQSxDQURBO0FBRUEsVUFBQSxPQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxVQUFBLEtBQUEsSUFBQSxFQUFBO0FBQ0EsVUFBQSxLQUFBLE9BQUEsRUFBQTtBQUNBLEtBSEE7QUFJQSxXQUFBLEVBQUEsT0FBQSxLQUFBLEVBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQTs7QUFFQSxTQUFBLEtBQUEsR0FBQSxXQUFBLFNBQUEsQ0FBQTs7QUFHQSxTQUFBLFdBQUEsR0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsWUFBQSxZQUFBLENBQUEsTUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGFBQUEsS0FBQSxHQUFBLFdBQUEsS0FBQSxDQUFBO0FBQ0EsS0FIQSxDQUFBO0FBSUEsR0FMQTs7QUFPQSxTQUFBLFVBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTtBQUNBLFFBQUEsVUFBQSxRQUFBLFNBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsRUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0EsUUFBQSxVQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsUUFBQSxXQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsUUFBQSxTQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsUUFBQSxXQUFBO0FBQ0EsWUFBQSxTQURBO0FBRUEsWUFBQSxVQUZBO0FBR0EsWUFBQSxPQUhBO0FBSUEsWUFBQSxPQUpBO0FBS0EsWUFBQSxLQUxBO0FBTUEsWUFBQSxNQU5BO0FBT0EsWUFBQSxNQVBBO0FBUUEsWUFBQSxRQVJBO0FBU0EsWUFBQSxXQVRBO0FBVUEsWUFBQSxTQVZBO0FBV0EsWUFBQSxVQVhBO0FBWUEsWUFBQTtBQVpBLEtBQUE7QUFjQSxXQUFBLFNBQUEsR0FBQSxHQUFBLFNBQUEsUUFBQSxDQUFBLEdBQUEsR0FBQSxHQUFBLE9BQUE7QUFDQSxHQXBCQTs7QUFzQkEsU0FBQSxLQUFBLEdBQUEsVUFBQSxPQUFBLEVBQUE7QUFDQSxXQUFBLE9BQUEsR0FBQSxPQUFBO0FBQ0EsV0FBQSxRQUFBLEdBQUEsQ0FBQSxPQUFBLFFBQUE7QUFDQSxlQUFBLFlBQUE7QUFDQSxhQUFBLFFBQUEsR0FBQSxDQUFBLE9BQUEsUUFBQTtBQUNBLGFBQUEsT0FBQTtB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QUEsRUFBQSxFQUFBLENBQUE7QUFDQSxTQUhBO0FBSUEsT0FoQkEsQ0FBQTtBQWlCQSxLQWxCQSxNQWtCQTtBQUNBO0FBQ0E7QUFDQSxHQXRCQTtBQXVCQSxDQWpEQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDZ0JBLElBQUEsT0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLE1BQUEsZ0JBQUEsRUFBQTs7QUFFQSxnQkFBQSxNQUFBLEdBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxZQUFBLEdBQUEsQ0FBQSxxQkFBQSxFQUFBLFFBQUE7QUFDQSxXQUFBLE1BQUEsSUFBQSxDQUFBLFlBQUEsRUFBQSxRQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxTQUFBLElBQUE7QUFDQSxLQUhBLENBQUE7QUFJQSxHQU5BO0FBT0EsU0FBQSxhQUFBO0FBQ0EsQ0FYQTs7QUNoQkEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsU0FBQSxTQURBO0FBRUEsZ0JBQUEsWUFGQTtBQUdBLGlCQUFBO0FBSEEsR0FBQTtBQU1BLENBUEE7QUNBQSxJQUFBLFVBQUEsQ0FBQSxVQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFVBQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxZQUFBO0FBQ0EsU0FBQSxJQUFBLEdBQUEsT0FBQTtBQUNBLFNBQUEsS0FBQSxHQUFBLFlBQUE7O0FBRUEsU0FBQSxVQUFBLEdBQUEsWUFBQTtBQUNBLFFBQUEsVUFBQSxPQUFBLElBQUEsQ0FBQSxTQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLFFBQUEsVUFBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLFFBQUEsV0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLFFBQUEsU0FBQSxRQUFBLENBQUEsQ0FBQTs7QUFFQSxRQUFBLFdBQUE7QUFDQSxZQUFBLFNBREE7QUFFQSxZQUFBLFVBRkE7QUFHQSxZQUFBLE9BSEE7QUFJQSxZQUFBLE9BSkE7QUFLQSxZQUFBLEtBTEE7QUFNQSxZQUFBLE1BTkE7QUFPQSxZQUFBLE1BUEE7QUFRQSxZQUFBLFFBUkE7QUFTQSxZQUFBLFdBVEE7QUFVQSxZQUFBLFNBVkE7QUFXQSxZQUFBLFVBWEE7QUFZQSxZQUFBO0FBWkEsS0FBQTtBQWNBLFdBQUEsU0FBQSxHQUFBLEdBQUEsU0FBQSxRQUFBLENBQUEsR0FBQSxHQUFBLEdBQUEsT0FBQTtBQUNBLEdBckJBOztBQXVCQSxTQUFBLGNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQSxFQUFBO0FBQ0EsR0FGQTs7QUFJQSxTQUFBLFVBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLGdCQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUNBLEdBRkE7O0FBSUEsY0FBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsV0FBQSxLQUFBLEVBQUEsSUFBQSxPQUFBLElBQUEsQ0FBQSxFQUFBLElBQUEsS0FBQSxPQUFBLEdBQUEsSUFBQSxHQUFBLEtBQUE7QUFDQSxHQUZBLEVBR0EsSUFIQSxDQUdBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxVQUFBLEdBQUEsTUFBQTtBQUNBLEdBTEE7O0FBT0EsY0FBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsV0FBQSxLQUFBLE9BQUEsR0FBQSxJQUFBLEdBQUEsS0FBQTtBQUNBLEdBRkEsRUFHQSxJQUhBLENBR0EsVUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLE9BQUEsR0FBQSxNQUFBO0FBQ0EsR0FMQTs7QUFPQSxNQUFBLE9BQUEsSUFBQSxDQUFBLE9BQUEsRUFBQSxPQUFBLFdBQUEsR0FBQSxnQkFBQTtBQUNBLE1BQUEsQ0FBQSxPQUFBLElBQUEsQ0FBQSxPQUFBLEVBQUEsT0FBQSxXQUFBLEdBQUEsWUFBQTs7QUFFQSxTQUFBLE1BQUEsR0FBQSxZQUFBLE1BQUE7O0FBRUEsU0FBQSxTQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxXQUFBLFlBQUEsU0FBQSxDQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFDQSxVQUFBLE9BQUEsSUFBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLGVBQUEsSUFBQSxDQUFBLE9BQUEsR0FBQSxLQUFBO0FBQ0EsZUFBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLE9BSEEsTUFJQSxJQUFBLENBQUEsT0FBQSxJQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsZUFBQSxJQUFBLENBQUEsT0FBQSxHQUFBLElBQUE7QUFDQSxlQUFBLFdBQUEsR0FBQSxnQkFBQTtBQUNBO0FBQ0EsS0FWQSxDQUFBO0FBV0EsR0FaQTtBQWFBLENBcEVBOztBQ0FBLElBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxNQUFBLGNBQUEsRUFBQTs7QUFFQSxjQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFdBQUEsTUFBQSxHQUFBLENBQUEsZUFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxTQUFBLElBQUE7QUFDQSxLQUhBLENBQUE7QUFJQSxHQUxBOztBQU9BLGNBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxXQUFBLE1BQUEsR0FBQSxDQUFBLGVBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxhQUFBLFNBQUEsSUFBQTtBQUNBLEtBSEEsQ0FBQTtBQUlBLEdBTEE7O0FBT0EsY0FBQSxNQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxXQUFBLE1BQUEsSUFBQSxDQUFBLHNCQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsT0FBQSxFQUFBLENBQUEsTUFBQSxDQURBLENBQUE7QUFF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QUNBLGlCQUFBLEVBQUEsQ0FBQSxNQUFBO0FBQ0EsU0FGQSxDQUFBO0FBR0EsT0FKQTs7QUFNQSxVQUFBLFVBQUEsU0FBQSxPQUFBLEdBQUE7QUFDQSxlQUFBLFlBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsU0FGQSxDQUFBO0FBR0EsT0FKQTs7QUFNQTs7QUFFQSxVQUFBLGFBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxjQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsT0FGQTs7QUFJQSxpQkFBQSxHQUFBLENBQUEsWUFBQSxZQUFBLEVBQUEsT0FBQTtBQUNBLGlCQUFBLEdBQUEsQ0FBQSxZQUFBLGFBQUEsRUFBQSxVQUFBO0FBQ0EsaUJBQUEsR0FBQSxDQUFBLFlBQUEsY0FBQSxFQUFBLFVBQUE7QUFFQTs7QUFoREEsR0FBQTtBQW9EQSxDQXREQTs7QUNBQTs7QUFFQSxJQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQUEsWUFBQTtBQUNBLFNBQUE7QUFDQSxXQUFBO0FBQ0Esb0JBQUE7QUFEQSxLQURBO0FBSUEsY0FBQSxHQUpBO0FBS0EsaUJBQUE7QUFMQSxHQUFBO0FBT0EsQ0FSQTs7QUNGQSxJQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQSxlQUFBLEVBQUE7O0FBRUEsU0FBQTtBQUNBLGNBQUEsR0FEQTtBQUVBLGlCQUFBLHlEQUZBO0FBR0EsVUFBQSxjQUFBLEtBQUEsRUFBQTtBQUNBLFlBQUEsUUFBQSxHQUFBLGdCQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEdBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ3NvY2ttYXJrZXQnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ3N0cmlwZScsICdpbmZpbml0ZS1zY3JvbGwnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbiAgICBTdHJpcGUuc2V0UHVibGlzaGFibGVLZXkoJ3BrX3Rlc3RfUmQ3bk1wU1pNcVJOdUI0empFZVpIdDFkJyk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Fib3V0Jywge1xuICAgICAgICB1cmw6ICcvYWJvdXQnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWJvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hYm91dC9hYm91dC5odG1sJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Fib3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEZ1bGxzdGFja1BpY3MpIHtcblxuICAgIC8vIEltYWdlcyBvZiBiZWF1dGlmdWwgRnVsbHN0YWNrIHBlb3BsZS5cbiAgICAkc2NvcGUuaW1hZ2VzID0gXy5zaHVmZmxlKEZ1bGxzdGFja1BpY3MpO1xuXG59KTtcblxuIiwiYXBwLmNvbnRyb2xsZXIoJ0FkbWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlKSB7XG5cbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4nLCB7XG4gICAgdXJsOiAnL2FkbWluJyxcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL2FkbWluL2FkbWluLmh0bWwnLFxuICAgIGNvbnRyb2xsZXI6ICdBZG1pbkN0cmwnLFxuICB9KVxuICAuc3RhdGUoJ2FkbWluLnNvY2tzJywge1xuICAgIHRlbXBsYXRlVXJsOiAnanMvYWRtaW4vdmlld3MvYWRtaW4uc29ja3MuaHRtbCcsXG4gICAgcmVzb2x2ZToge1xuICAgICAgc29ja3M6IGZ1bmN0aW9uKFNvY2tGYWN0b3J5KSB7XG4gICAgICAgIHJldHVybiBTb2NrRmFjdG9yeS5hbGxTb2NrcygpO1xuICAgICAgfVxuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCBzb2NrcywgU29ja0ZhY3RvcnksIFJldmlld0ZhY3RvcnkpIHtcbiAgICAgICRzY29wZS5zb2NrcyA9IHNvY2tzO1xuICAgICAgY29uc29sZS5sb2coc29ja3MpO1xuICAgICAgJHNjb3BlLmRlbGV0ZVNvY2sgPSBmdW5jdGlvbihpZCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImRlbGV0ZVNvY2tcIilcbiAgICAgICAgcmV0dXJuIFNvY2tGYWN0b3J5LmRlbGV0ZShpZClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJHNjb3BlLnNvY2tzID0gJHNjb3BlLnNvY2tzLmZpbHRlcihmdW5jdGlvbihzb2NrKSB7IGlmIChzb2NrLmlkICE9PSBpZCkgcmV0dXJuIHNvY2t9KTtcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgJHNjb3BlLmRlbGV0ZVJldmlldyA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LmRlbGV0ZShpZClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmV2aWV3KSB7XG4gICAgICAgICAgJHNjb3BlLnNvY2tzID0gJHNjb3BlLnNvY2tzLm1hcChmdW5jdGlvbihzb2NrKSB7XG4gICAgICAgICAgICBpZiAoc29jay5pZCAhPT0gcmV2aWV3LnNvY2tJZCkge1xuICAgICAgICAgICAgICByZXR1cm4gc29jaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNvY2sucmV2aWV3cyA9IHNvY2sucmV2aWV3cy5maWx0ZXIoZnVuY3Rpb24ocmV2aWV3T25Tb2NrKSB7IHJldHVybiByZXZpZXdPblNvY2suaWQgIT09IGlkIH0pXG4gICAgICAgICAgICAgIHJldHVybiBzb2NrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICB9XG4gIH0pXG4gIC5zdGF0ZSgnYWRtaW4udXNlcnMnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICdqcy9hZG1pbi92aWV3cy9hZG1pbi51c2Vycy5odG1sJyxcbiAgICByZXNvbHZlOiB7XG4gICAgICB1c2VyczogZnVuY3Rpb24oVXNlckZhY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICB9XG4gICAgfVxuICB9KVxufSlcblxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pO1xuXG4vLyBhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuLy9cbi8vICAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4nLCB7XG4vLyAgICAgICAgIHVybDogJy9hZG1pbicsXG4vLyAgICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuLy8gICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuLy8gICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuLy8gICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuLy8gICAgICAgICAgICAgfSk7XG4vLyAgICAgICAgIH0sXG4vLyAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuLy8gICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4vLyAgICAgICAgIGRhdGE6IHtcbi8vICAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogZmFsc2Vcbi8vICAgICAgICAgfVxuLy8gICAgIH0pO1xuLy9cbi8vIH0pOyIsImFwcC5jb250cm9sbGVyKCdjaGVja291dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGN1cnJlbnRDYXJ0LCBDaGVja291dEZhY3RvcnksICRzdGF0ZSkge1xuICAkc2NvcGUuY3VycmVudENhcnQgPSBjdXJyZW50Q2FydFxuXG4gICRzY29wZS5jYWxjVG90YWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gT3JkZXJGYWN0b3J5LmNhbGN1bGF0ZVRvdGFsKCdjdXJyZW50JylcbiAgICAudGhlbihmdW5jdGlvbihjYXJ0VG90YWwpIHsgJHNjb3BlLnRvdGFsID0gY2FydFRvdGFsIH0pXG4gIH1cbiAgJHNjb3BlLmNhbGNUb3RhbCgpXG5cbiAgJHNjb3BlLmNoYXJnZSA9IGZ1bmN0aW9uKHN0YXR1cywgcmVzcG9uc2UpIHtcbiAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICBDaGVja291dEZhY3RvcnkuY2hhcmdlQ2FyZCh7XG4gICAgICB0b2tlbjogcmVzcG9uc2UuaWQsXG4gICAgICBhbW91bnQ6IHBhcnNlSW50KCRzY29wZS50b3RhbCoxMDApXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIHJldHVybiBPcmRlckZhY3RvcnkuZW5zdXJlQ2FydCgpXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICRzdGF0ZS5nbygnY2FydEhpc3RvcnknKVxuICAgIH0pXG4gIH1cblxufSlcbiIsImFwcC5mYWN0b3J5KCdDaGVja291dEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHAsICRzdGF0ZSkge1xuXG4gIHJldHVybiB7XG4gICAgY2hhcmdlQ2FyZDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2NoZWNrb3V0Jywgb2JqKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVyLmRhdGFcbiAgICAgIH0pXG4gICAgfVxuICB9XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NoZWNrb3V0Jywge1xuICAgIHVybDogJy9jYXJ0L2NoZWNrb3V0Jyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9jaGVja291dC9jaGVja291dC5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnY2hlY2tvdXRDb250cm9sbGVyJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRjdXJyZW50Q2FydDogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuXHRcdFx0XHRyZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdjdXJyZW50Jylcblx0XHRcdH1cblx0XHR9XG4gIH0pXG59KVxuIiwiYXBwLmRpcmVjdGl2ZSgnZGVzaWduVmlldycsIGZ1bmN0aW9uIChTb2NrRmFjdG9yeSwgJHN0YXRlLCAkaHR0cCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9kZXNpZ24vZGVzaWduLXZpZXcuaHRtbCcsXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgZGVzaWduVmlld0N0cmwpIHtcblxuXHRcdFx0dmFyIHRpdGxlID0gc2NvcGUudGl0bGU7XG5cdFx0XHR2YXIgZGVzY3JpcHRpb24gPSBzY29wZS5kZXNjcmlwdGlvbjtcblx0XHRcdHZhciB0YWdzID0gc2NvcGUudGFncztcblx0XHRcdHZhciBjYW52YXMgPSBlbGVtZW50LmZpbmQoJ2NhbnZhcycpWzBdO1xuXHRcdFx0dmFyIGRpc3BsYXlFcnJvciA9IGZhbHNlO1xuXG5cdFx0XHRzY29wZS5wcmV2ZW50U3VibWlzc2lvbiA9IGZ1bmN0aW9uICgpe1xuXHRcdFx0XHRyZXR1cm4gZGlzcGxheUVycm9yO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaW52YWxpZFN1Ym1pc3Npb24gPSBmdW5jdGlvbih0aXRsZSwgZGVzY3JpcHRpb24sIHRhZ3MpIHtcblx0XHRcdFx0aWYgKHRpdGxlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRkaXNwbGF5RXJyb3IgPSB0cnVlO1xuXHRcdFx0XHRcdHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiWW91ciBzb2NrcyBuZWVkIGEgdGl0bGUhXCI7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH0gZWxzZSBpZiAoZGVzY3JpcHRpb24gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGRpc3BsYXlFcnJvciA9IHRydWU7XG5cdFx0XHRcdFx0c2NvcGUuZXJyb3JNZXNzYWdlID0gXCJZb3VyIHNvY2tzIG5lZWQgYSBkZXNjcmlwdGlvbiFcIjtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIGlmICh0YWdzID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRkaXNwbGF5RXJyb3IgPSB0cnVlO1xuXHRcdFx0XHRcdHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiWW91ciBzb2NrcyBuZWVkIHNvbWUgdGFncyFcIjtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRzY29wZS5zYXZlRGVzaWduID0gZnVuY3Rpb24gKHRpdGxlLCBkZXNjcmlwdGlvbiwgdGFncykge1xuXG5cdFx0XHRcdGlmIChpbnZhbGlkU3VibWlzc2lvbih0aXRsZSwgZGVzY3JpcHRpb24sIHRhZ3MpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGludmFsaWRTdWJtaXNzaW9uKHRpdGxlLCBkZXNjcmlwdGlvbiwgdGFncyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgdGFnc0FyciA9IFNvY2tGYWN0b3J5LnByZXBhcmVUYWdzKHRhZ3MpO1xuXG4gICAgICAgIHZhciBuZXdTb2NrRGF0YU9iaiA9IHtcbiAgICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICAgICAgICAgIHRhZ3M6IHRhZ3NBcnJcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm4gU29ja0ZhY3Rvcnkuc2F2ZURlc2lnbihuZXdTb2NrRGF0YU9iailcbiAgICAgICAgLy8gLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIC8vIFx0JHN0YXRlLmdvKCd1c2VyJywge3VzZXJJZDogcmVzdWx0LmRhdGEudXNlcklkfSlcbiAgICAgICAgLy8gfSlcblxuICAgICAgICBmdW5jdGlvbiBkYXRhVVJJdG9CbG9iKGRhdGFVUkkpIHtcbiAgICAgICAgICB2YXIgYmluYXJ5ID0gYXRvYihkYXRhVVJJLnNwbGl0KCcsJylbMV0pO1xuICAgICAgICAgIHZhciBhcnJheSA9IFtdO1xuICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBiaW5hcnkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFycmF5LnB1c2goYmluYXJ5LmNoYXJDb2RlQXQoaSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV3IEJsb2IoW25ldyBVaW50OEFycmF5KGFycmF5KV0sIHt0eXBlOiAnaW1hZ2UvcG5nJ30pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRhdGFVcmwgPSBjYW52YXMudG9EYXRhVVJMKFwiaW1hZ2UvcG5nXCIpO1xuICAgICAgICB2YXIgYmxvYkRhdGEgPSBkYXRhVVJJdG9CbG9iKGRhdGFVcmwpO1xuXG4gICAgICAgIFNvY2tGYWN0b3J5LmdldFVuc2lnbmVkVVJMKClcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpe1xuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gcmVzLnVybC5zcGxpdCgnPycpWzBdO1xuXG4gICAgICAgICAgICAkaHR0cC5wdXQocmVzLnVybCwgYmxvYkRhdGEsXG4gICAgICAgICAgICAgIHtoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgICAgICBLZXkgOiAnYW5pX2Jlbi5wbmcnXG4gICAgICAgICAgICB9fSlcbiAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKXtcbiAgICAgICAgICAgICAgICBuZXdTb2NrRGF0YU9iai5pbWFnZSA9IGltYWdlVXJsO1xuICAgICAgICAgICAgICAgIFNvY2tGYWN0b3J5LnNhdmVEZXNpZ24obmV3U29ja0RhdGFPYmopXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCd1c2VyJywge3VzZXJJZDogcmVzdWx0LmRhdGEudXNlcklkfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG5cdFx0XHQgfTtcblxuXG5cdFx0XHR2YXIgY29sb3IgPSAkKFwiLnNlbGVjdGVkXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIik7XG5cdFx0XHR2YXIgY29udGV4dCA9ICQoXCJjYW52YXNcIilbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXHRcdFx0dmFyICRjYW52YXMgPSAkKFwiY2FudmFzXCIpO1xuXHRcdFx0dmFyIGxhc3RFdmVudDtcblx0XHRcdHZhciBtb3VzZURvd24gPSBmYWxzZTtcblxuXHRcdFx0dmFyIGJhY2tncm91bmQgPSBuZXcgSW1hZ2UoKTtcblxuXHRcdFx0YmFja2dyb3VuZC5zcmMgPSAnL3NvY2stYmcvMS5wbmcnO1xuXG5cdFx0XHRiYWNrZ3JvdW5kLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ICBjb250ZXh0LmRyYXdJbWFnZShiYWNrZ3JvdW5kLCAwLCAwKTtcblx0XHRcdH07XG5cblx0XHRcdC8vV2hlbiBjbGlja2luZyBvbiBjb250cm9sIGxpc3QgaXRlbXNcblx0XHRcdCAgJChcIi5jb250cm9sc1wiKS5vbihcImNsaWNrXCIsIFwibGlcIiAsIGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgIC8vRGVzbGVjdCBzaWJsaW5nIGVsZW1lbnRzXG5cdFx0XHQgICAgICQodGhpcykuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAgICAvL1NlbGVjdCBjbGlja2VkIGVsZW1lbnRcblx0XHRcdCAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAgICAvL3N0b3JlIHRoZSBjb2xvclxuXHRcdFx0ICAgICBjb2xvciA9ICQodGhpcykuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdCAgfSk7XG5cblx0XHRcdC8vV2hlbiBcIkFkZCBDb2xvclwiIGJ1dHRvbiBpcyBwcmVzc2VkXG5cdFx0XHQgICQoXCIjcmV2ZWFsQ29sb3JTZWxlY3RcIikuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgIC8vU2hvdyBjb2xvciBzZWxlY3Qgb3IgaGlkZSB0aGUgY29sb3Igc2VsZWN0XG5cdFx0XHQgICAgY2hhbmdlQ29sb3IoKTtcblx0XHRcdCAgXHQkKFwiI2NvbG9yU2VsZWN0XCIpLnRvZ2dsZSgpO1xuXHRcdFx0ICB9KTtcblxuXHRcdFx0Ly9VcGRhdGUgdGhlIG5ldyBjb2xvciBzcGFuXG5cdFx0XHRmdW5jdGlvbiBjaGFuZ2VDb2xvcigpe1xuXHRcdFx0XHR2YXIgciA9ICQoXCIjcmVkXCIpLnZhbCgpO1xuXHRcdFx0XHR2YXIgZyA9ICQoXCIjZ3JlZW5cIikudmFsKCk7XG5cdFx0XHRcdHZhciBiID0gJChcIiNibHVlXCIpLnZhbCgpO1xuXHRcdFx0XHQkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2IoXCIgKyByICsgXCIsIFwiICsgZyArIFwiLCBcIiArIGIgKyBcIilcIik7XG5cdFx0XHQgIC8vV2hlbiBjb2xvciBzbGlkZXJzIGNoYW5nZVxuXG5cblx0XHRcdH1cblxuXHRcdFx0JChcImlucHV0W3R5cGU9cmFuZ2VdXCIpLm9uKFwiaW5wdXRcIiwgY2hhbmdlQ29sb3IpO1xuXG5cdFx0XHQvL3doZW4gXCJBZGQgQ29sb3JcIiBpcyBwcmVzc2VkXG5cdFx0XHQkKFwiI2FkZE5ld0NvbG9yXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0XHQgIC8vYXBwZW5kIHRoZSBjb2xvciB0byB0aGUgY29udHJvbHMgdWxcblx0XHRcdCAgdmFyICRuZXdDb2xvciA9ICQoXCI8bGk+PC9saT5cIik7XG5cdFx0XHQgICRuZXdDb2xvci5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsICQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKSk7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgdWxcIikuYXBwZW5kKCRuZXdDb2xvcik7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgbGlcIikuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzIGxpXCIpLmxhc3QoKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xuXHRcdFx0ICBjb2xvciA9ICQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdCAgLy93aGVuIGFkZGVkLCByZXN0b3JlIHNsaWRlcnMgYW5kIHByZXZpZXcgY29sb3IgdG8gZGVmYXVsdFxuXHRcdFx0ICAkKFwiI2NvbG9yU2VsZWN0XCIpLmhpZGUoKTtcblx0XHRcdFx0dmFyIHIgPSAkKFwiI3JlZFwiKS52YWwoMCk7XG5cdFx0XHRcdHZhciBnID0gJChcIiNncmVlblwiKS52YWwoMCk7XG5cdFx0XHRcdHZhciBiID0gJChcIiNibHVlXCIpLnZhbCgwKTtcblx0XHRcdFx0JChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiKFwiICsgciArIFwiLCBcIiArIGcgKyBcIiwgXCIgKyBiICsgXCIpXCIpO1xuXG5cdFx0XHR9KVxuXG5cdFx0XHQvL09uIG1vdXNlIGV2ZW50cyBvbiB0aGUgY2FudmFzXG5cdFx0XHQkY2FudmFzLm1vdXNlZG93bihmdW5jdGlvbihlKXtcblx0XHRcdCAgbGFzdEV2ZW50ID0gZTtcblx0XHRcdCAgbW91c2VEb3duID0gdHJ1ZTtcblx0XHRcdH0pLm1vdXNlbW92ZShmdW5jdGlvbihlKXtcblx0XHRcdCAgLy9kcmF3IGxpbmVzXG5cdFx0XHQgIGlmIChtb3VzZURvd24pe1xuXHRcdFx0ICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0XHQgICAgY29udGV4dC5tb3ZlVG8obGFzdEV2ZW50Lm9mZnNldFgsbGFzdEV2ZW50Lm9mZnNldFkpO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZVRvKGUub2Zmc2V0WCwgZS5vZmZzZXRZKTtcblx0XHRcdCAgICBjb250ZXh0LnN0cm9rZVN0eWxlID0gY29sb3I7XG5cdFx0XHQgICAgY29udGV4dC5zdHJva2UoKTtcblx0XHRcdCAgICBjb250ZXh0LmxpbmVDYXAgPSAncm91bmQnO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZVdpZHRoID0gMjA7XG5cblx0XHRcdCAgICBsYXN0RXZlbnQgPSBlO1xuXHRcdFx0ICB9XG5cdFx0XHR9KS5tb3VzZXVwKGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgbW91c2VEb3duID0gZmFsc2U7XG5cdFx0XHR9KS5tb3VzZWxlYXZlKGZ1bmN0aW9uKCl7XG5cdFx0XHQgICAgJGNhbnZhcy5tb3VzZXVwKCk7XG5cdFx0XHR9KTtcblxuXG5cdFx0fVxuXHR9XG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ0Rlc2lnblZpZXdDdHJsJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXG4gICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcImhpXCI7XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGVzaWduVmlldycsIHtcbiAgICAgIHVybDonL3NvY2tzL2Rlc2lnbi86aWQnLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgdGhlU29jazogJz0nXG4gICAgICB9LFxuICAgICAgY29udHJvbGxlcjogJ2Rlc2lnblZpZXdDdHJsJyxcbiAgICAgIHRlbXBsYXRlOiAnPGRlc2lnbi12aWV3PjwvZGVzaWduLXZpZXc+JyxcbiAgICB9KVxuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ2Rlc2lnblZpZXdDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHApIHtcblxuICAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvbWF0Y2hJZCcpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgcmV0dXJuICRzY29wZS5zaG93VmlldyA9IHJlc1xuICAgIH0pXG5cblx0Ly8gLy8gJHNjb3BlLmRlc2NyaXB0aW9uO1xuXHQvLyAkc2NvcGUudGFncztcblx0Ly8gJHNjb3BlLnRpdGxlO1xuXHQvLyBjb25zb2xlLmxvZygkc2NvcGUuZGVzY3JpcHRpb24pO1xufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkZXNpZ24nLCB7XG4gICAgICB1cmw6Jy9kZXNpZ24nLFxuICAgICAgY29udHJvbGxlcjogJ0Rlc2lnbkNvbnRyb2xsZXInLFxuICAgICAgdGVtcGxhdGVVcmw6ICc8ZGVzaWduLXNvY2s+PC9kZXNpZ24tc29jaz4nXG4gICAgfSlcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2RvY3MnLCB7XG4gICAgICAgIHVybDogJy9kb2NzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9kb2NzL2RvY3MuaHRtbCdcbiAgICB9KTtcbn0pO1xuIiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuY29udHJvbGxlcignaG9tZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBtb3N0UmVjZW50U29ja3MsIG1vc3RQb3B1bGFyU29ja3MsIHJlY2VudGx5UHVyY2hhc2VkU29ja3MsIFNvY2tGYWN0b3J5LCAkc3RhdGUsICRzdGF0ZVBhcmFtcykge1xuXG4gICRzY29wZS5tb3N0UmVjZW50U29ja3MgPSBtb3N0UmVjZW50U29ja3M7XG4gICRzY29wZS5tb3N0UG9wdWxhclNvY2tzID0gbW9zdFBvcHVsYXJTb2NrcztcbiAgJHNjb3BlLnJlY2VudGx5UHVyY2hhc2VkU29ja3MgPSByZWNlbnRseVB1cmNoYXNlZFNvY2tzO1xuXG4gIGNvbnNvbGUubG9nKFwiSU0gWU9VUiBSRUNFTlQgU09DS1NcIiwgJHNjb3BlLnJlY2VudGx5UHVyY2hhc2VkU29ja3MpO1xuXG4gICRzY29wZS5tYXhTb2NrSWQgPSBudWxsO1xuICAkc2NvcGUuYnJvd3NlU29ja3MgPSBbXTtcbiAgJHNjb3BlLmJ1c3kgPSBmYWxzZTtcblxuICAkc2NvcGUubG9hZFNvY2tzID0gZnVuY3Rpb24oaWQpIHtcbiAgICBpZiAodGhpcy5idXN5KSByZXR1cm47XG4gICAgaWYgKHRoaXMubWF4U29ja0lkID09PSAnZG9uZScpIHJldHVybjtcbiAgICB0aGlzLmJ1c3kgPSB0cnVlO1xuXG4gICAgcmV0dXJuIFNvY2tGYWN0b3J5LmJyb3dzZVNvY2tzKGlkKVxuICAgIC50aGVuKGZ1bmN0aW9uKHNvY2tzKSB7XG4gICAgICBjb25zb2xlLmxvZyhzb2Nrcyk7XG4gICAgICBpZiAoc29ja3MubGVuZ3RoID09PSAwKSByZXR1cm4gJHNjb3BlLm1heFNvY2tJZCA9ICdkb25lJztcbiAgICAgICRzY29wZS5tYXhTb2NrSWQgPSBzb2Nrc1tzb2Nrcy5sZW5ndGgtMV0uaWQ7XG4gICAgICAkc2NvcGUuYnVzeSA9IGZhbHNlO1xuICAgICAgJHNjb3BlLmJyb3dzZVNvY2tzID0gJHNjb3BlLmJyb3dzZVNvY2tzLmNvbmNhdChzb2Nrcyk7XG4gICAgfSlcblxuICB9XG5cbiAgJHNjb3BlLmZvcm1hdEJyb3dzZVNvY2tUaXRsZSA9IGZ1bmN0aW9uICh0aXRsZSkge1xuICAgIGlmICh0aXRsZS5sZW5ndGggPCAyNCkge1xuICAgICAgcmV0dXJuIHRpdGxlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGl0bGUuc2xpY2UoMCwgMjMpICsgJy4uLic7XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLnNlZVNvY2sgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pO1xuICB9XG4gICRzY29wZS5zZWVVc2VyID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgJHN0YXRlLmdvKCd1c2VyJywge3VzZXJJZDogaWR9KTtcbiAgfVxufSk7XG5cbiIsImFwcC5kaXJlY3RpdmUoJ3NvY2tEZXRhaWwnLCBmdW5jdGlvbigkc3RhdGUpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHRlbXBsYXRlVXJsOiBcImpzL2hvbWUvc29ja2RldGFpbC5odG1sXCIsXG4gIHNjb3BlOiB7XG4gICAgICBzb2NrOiAnPSdcbiAgICB9LFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgICBzY29wZS5mb3JtYXRCcm93c2VTb2NrVGl0bGUgPSBmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgaWYgKHRpdGxlLmxlbmd0aCA8IDIwKSB7XG4gICAgICAgICAgcmV0dXJuIHRpdGxlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aXRsZS5zbGljZSgwLCAxOSkgKyAnLi4uJztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzY29wZS5zZWVTb2NrID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSk7XG4gICAgICB9XG4gICAgICBzY29wZS5zZWVVc2VyID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICRzdGF0ZS5nbygndXNlcicsIHt1c2VySWQ6IGlkfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnaG9tZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0bW9zdFJlY2VudFNvY2tzOiBmdW5jdGlvbiAoU29ja0ZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBTb2NrRmFjdG9yeS5tb3N0UmVjZW50U29ja3MoKTtcbiAgICAgICAgXHR9LFxuICAgICAgICAgIG1vc3RQb3B1bGFyU29ja3M6IGZ1bmN0aW9uKFNvY2tGYWN0b3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gU29ja0ZhY3RvcnkubW9zdFBvcHVsYXJTb2NrcygpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVjZW50bHlQdXJjaGFzZWRTb2NrczogZnVuY3Rpb24oU29ja0ZhY3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBTb2NrRmFjdG9yeS5yZWNlbnRseVB1cmNoYXNlZFNvY2tzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnN3aXRjaFRvU2lnbnVwUGFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRzdGF0ZS5nbygnc2lnbnVwJyk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuZmFjdG9yeSgnTGlrZUZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuXG4gIHJldHVybiB7XG4gICAgZ2V0QWxsTGlrZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9saWtlJylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGxpa2VzKSB7XG4gICAgICAgIHJldHVybiBsaWtlcy5kYXRhO1xuICAgICAgfSlcbiAgICB9LFxuICAgIGdldFNvY2tMaWtlczogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2xpa2Uvc29jay8nK3NvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGxpa2VzKSB7XG4gICAgICAgIHJldHVybiBsaWtlcy5kYXRhO1xuICAgICAgfSlcbiAgICB9LFxuICAgIGdldFVzZXJTb2NrTGlrZTogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2xpa2UvdXNlci9zb2NrLycrc29ja0lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24obGlrZSkge1xuICAgICAgICByZXR1cm4gbGlrZS5kYXRhO1xuICAgICAgfSlcbiAgICB9LFxuICAgIGdldFVzZXJMaWtlczogZnVuY3Rpb24odXNlcklkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2xpa2UvdXNlci8nK3VzZXJJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGxpa2VzKSB7XG4gICAgICAgIHJldHVybiBsaWtlcy5kYXRhO1xuICAgICAgfSlcbiAgICB9LFxuICAgIG5ld0xpa2U6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJ2FwaS9saWtlL2xpa2UvJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihsaWtlKSB7XG4gICAgICAgIHJldHVybiBsaWtlLmRhdGE7XG4gICAgICB9KVxuICAgIH0sXG4gICAgbmV3RGlzbGlrZTogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnYXBpL2xpa2UvZGlzbGlrZS8nK3NvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGxpa2UpIHtcbiAgICAgICAgcmV0dXJuIGxpa2UuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcbiAgICB1cGRhdGVMaWtlOiBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wdXQoJ2FwaS9saWtlL2xpa2UvJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihsaWtlKSB7XG4gICAgICAgIHJldHVybiBsaWtlLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcbiAgICB1cGRhdGVEaXNsaWtlOiBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wdXQoJ2FwaS9saWtlL2Rpc2xpa2UvJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihsaWtlKSB7XG4gICAgICAgIHJldHVybiBsaWtlLmRhdGE7XG4gICAgICB9KVxuICAgIH1cbiAgfVxufSkiLCJhcHAuY29udHJvbGxlcignY2FydEN1cnJlbnQnLCBmdW5jdGlvbiAoJHNjb3BlLCBPcmRlckZhY3RvcnksIGN1cnJlbnRDYXJ0KSB7XG4gICRzY29wZS5jdXJyZW50ID0gY3VycmVudENhcnRcbn0pXG5cblxuYXBwLmNvbnRyb2xsZXIoJ2NhcnRIaXN0b3J5JywgZnVuY3Rpb24gKCRzY29wZSwgT3JkZXJGYWN0b3J5LCBjYXJ0SGlzdG9yeSkge1xuXG4gICRzY29wZS5jYXJ0SGlzdG9yeSA9IGNhcnRIaXN0b3J5XG5cbn0pXG4iLCJhcHAuZGlyZWN0aXZlKCdjdXJyZW50Q2FydCcsIGZ1bmN0aW9uICgkc3RhdGUsIE9yZGVyRmFjdG9yeSkge1xuXG4gIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgc2NvcGU6IHt9LFxuICAgICAgdGVtcGxhdGVVcmw6ICdqcy9vcmRlci9jdXJyZW50Lmh0bWwnLFxuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUpIHtcblxuICAgICAgICBzY29wZS51cGRhdGUgPSBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgdmFyIHNvY2sgPSB7XG4gICAgICAgICAgICBxdWFudGl0eTogaXRlbS5uZXdBbW91bnQsXG4gICAgICAgICAgICBpZDogaXRlbS5pZFxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnVwZGF0ZUl0ZW0oc29jaylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbigpe1xuICAgICAgICAgICAgaXRlbS5xdWFudGl0eSA9IGl0ZW0ubmV3QW1vdW50O1xuICAgICAgICAgICAgaXRlbS5uZXdBbW91bnQgPSBudWxsO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzY29wZS5jYWxjVG90YWwoKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5kZWxldGUgPSBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgdmFyIHRvZGVsZXRlID0geyBpdGVtOiBpdGVtIH1cbiAgICAgICAgICBPcmRlckZhY3RvcnkuZGVsZXRlSXRlbSh0b2RlbGV0ZS5pdGVtLmlkKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkgeyByZXR1cm4gc2NvcGUuY2FsY1RvdGFsKCkgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihuZXdUb3RhbCkgeyBzY29wZS50b3RhbCA9IG5ld1RvdGFsIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5zaW5nbGVTb2NrVmlldyA9IGZ1bmN0aW9uKGlkKSB7ICRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSkgfVxuICAgICAgICBzY29wZS50b0NoZWNrb3V0ID0gZnVuY3Rpb24oKSB7ICRzdGF0ZS5nbygnY2hlY2tvdXQnKSB9XG5cbiAgICAgICAgc2NvcGUuY2FsY1RvdGFsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5jYWxjdWxhdGVUb3RhbCgnY3VycmVudCcpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oY2FydFRvdGFsKSB7XG4gICAgICAgICAgICBzY29wZS50b3RhbCA9IGNhcnRUb3RhbFxuICAgICAgICAgICAgcmV0dXJuIGNhcnRUb3RhbFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5jYWxjVG90YWwoKVxuXG4gICAgICAgIHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuICAgICAgICAudGhlbihmdW5jdGlvbihjdXJyZW50KSB7IHNjb3BlLmN1cnJlbnRDYXJ0ID0gY3VycmVudCB9KVxuICAgIH1cbiAgfVxufSlcblxuYXBwLmRpcmVjdGl2ZSgnY2FydEhpc3RvcnknLCBmdW5jdGlvbigkc3RhdGUsIE9yZGVyRmFjdG9yeSkge1xuXG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICBzY29wZToge30sXG4gICAgdGVtcGxhdGVVcmw6ICdqcy9vcmRlci9oaXN0b3J5Lmh0bWwnLFxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICBzY29wZS5jYWxjVG90YWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5jYWxjdWxhdGVUb3RhbCgnaGlzdG9yeScpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGNhcnRUb3RhbCkgeyBzY29wZS50b3RhbFNwZW50ID0gY2FydFRvdGFsIH0pXG4gICAgICB9XG5cbiAgICAgIHNjb3BlLmNhbGNUb3RhbCgpXG4gICAgICAudGhlbihmdW5jdGlvbigpIHsgY29uc29sZS5sb2coc2NvcGUudG90YWxTcGVudCkgfSlcblxuICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnaGlzdG9yeScpXG4gICAgICAudGhlbihmdW5jdGlvbihoaXN0b3J5KSB7IHNjb3BlLmNhcnRIaXN0b3J5ID0gaGlzdG9yeSB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiXG5hcHAuZmFjdG9yeSgnT3JkZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApIHtcbiAgdmFyIGNhY2hlZENhcnQgPSBbXVxuICB2YXIgY2hlY2tDYXJ0ID0gZnVuY3Rpb24ob2JqLCBhcnIpIHtcbiAgICByZXR1cm4gYXJyLm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLnNvY2tJZCB9KS5pbmRleE9mKG9iai5zb2NrSWQpID09PSAtMSA/IGZhbHNlIDogdHJ1ZVxuICB9XG4gIHJldHVybiB7XG4gICAgYWRkVG9DYXJ0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvY3VycmVudCcpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHsgcmV0dXJuIGNoZWNrQ2FydChvYmosIHJlcy5kYXRhKSB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oaW5DYXJ0KSB7XG4gICAgICAgIGlmIChpbkNhcnQpIHtcbiAgICAgICAgICByZXR1cm4gXCJBbHJlYWR5IGluIENhcnQhXCJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9vcmRlci8nLCBvYmopXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7IHJldHVybiByZXMuZGF0YSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gICAgc2hvd0NhcnQ6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIC8vdHlwZSA9ICdjdXJyZW50JyB8fCB0eXBlID0gJ2hpc3RvcnknXG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyLycrdHlwZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKSB7XG4gICAgICAgIGNhY2hlZENhcnQgPSBvcmRlci5kYXRhXG4gICAgICAgIHJldHVybiBjYWNoZWRDYXJ0IHx8IFtdXG4gICAgICB9KVxuICAgIH0sXG4gICAgY2FsY3VsYXRlVG90YWw6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvJyt0eXBlKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgY2FjaGVkQ2FydCA9IG9yZGVyLmRhdGFcbiAgICAgICAgcmV0dXJuIGNhY2hlZENhcnQgfHwgW11cbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihjYXJ0KSB7XG4gICAgICAgIGlmICh0eXBlPT09J2N1cnJlbnQnKSB7XG4gICAgICAgICAgcmV0dXJuIGNhcnQucmVkdWNlKGZ1bmN0aW9uKG8sIGl0ZW0pIHtyZXR1cm4gbyArIChcbiAgICAgICAgICAgIGl0ZW0uc29jay5wcmljZSppdGVtLnF1YW50aXR5KX0sIDApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGNhcnQucmVkdWNlKGZ1bmN0aW9uKG8sIG9yZGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbyArIG9yZGVyLml0ZW1zLnJlZHVjZShmdW5jdGlvbihvLCBpdGVtKSB7XG4gICAgICAgICAgICAgIHJldHVybiBvICsgKGl0ZW0uc29jay5wcmljZSppdGVtLnF1YW50aXR5KX0sIDApXG4gICAgICAgICAgfSwgMClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9LFxuICAgIHVwZGF0ZUl0ZW06IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICRodHRwLnB1dCgnL2FwaS9vcmRlcicsIG9iailcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uZGF0YSB9KVxuICAgIH0sXG4gICAgZGVsZXRlSXRlbTogZnVuY3Rpb24oaXRlbUlkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZGVsZXRlKCcvYXBpL29yZGVyLycraXRlbUlkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24odG9SZW1vdmUpIHtcbiAgICAgICAgY2FjaGVkQ2FydC5zcGxpY2UoY2FjaGVkQ2FydC5tYXAoZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5pZCB9KS5pbmRleE9mKGl0ZW1JZCksMSlcbiAgICAgICAgcmV0dXJuIGNhY2hlZENhcnRcbiAgICAgIH0pXG4gICAgfSxcbiAgICBlbnN1cmVDYXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvb3JkZXIvY3JlYXRlY2FydCcpXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICByZXR1cm4ge2V4aXN0czogb3JkZXIuZGF0YX1cbiAgICAgIH0pXG4gICAgfSxcblxuICB9XG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2N1cnJlbnRDYXJ0Jywge1xuICAgIHVybDogJy9jYXJ0L2N1cnJlbnQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL29yZGVyL2NhcnQuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ2NhcnRDdXJyZW50Jyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRjdXJyZW50Q2FydDogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuXHRcdFx0XHRyZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdjdXJyZW50Jylcblx0XHRcdH1cblx0XHR9XG4gIH0pXG5cbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnRIaXN0b3J5Jywge1xuICAgIHVybDogJy9jYXJ0L2hpc3RvcnknLFxuICAgIHRlbXBsYXRlVXJsOiAnL2pzL29yZGVyL3Bhc3QuaHRtbCcsXG4gICAgY29udHJvbGxlcjogJ2NhcnRIaXN0b3J5JyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBjYXJ0SGlzdG9yeTogZnVuY3Rpb24gKE9yZGVyRmFjdG9yeSkge1xuICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdoaXN0b3J5Jyk7XG4gICAgICB9XG4gICAgfVxuICB9KVxuXG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ1BlcnNvbmFsSW5mb0N0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlLCB0aGVVc2VyLCBQZXJzb25hbEluZm9GYWN0b3J5KSB7XG5cblx0JHNjb3BlLnVzZXJJZCA9IHRoZVVzZXIuaWQ7XG5cdCRzY29wZS5hZGRyZXNzMSA9IHRoZVVzZXIuYWRkcmVzczE7XG5cdCRzY29wZS5hZGRyZXNzMiA9IHRoZVVzZXIuYWRkcmVzczI7XG5cdCRzY29wZS56aXAgPSB0aGVVc2VyLnppcDtcblx0JHNjb3BlLnN0YXRlID0gdGhlVXNlci5zdGF0ZTtcblx0JHNjb3BlLmNvdW50cnkgPSB0aGVVc2VyLmNvdW50cnk7XG5cdCRzY29wZS5waG9uZSA9IHRoZVVzZXIucGhvbmU7XG5cdCRzY29wZS5kaXNwbGF5RXJyb3IgPSBmYWxzZTtcblxuXHQkc2NvcGUuc3VibWl0UGVyc29uYWwgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRpZiAoKCRzY29wZS5jb3VudHJ5ID09PSBcIlVuaXRlZCBTdGF0ZXNcIiB8fCAkc2NvcGUuY291bnRyeSA9PT0gXCJDYW5hZGFcIikgJiYgJHNjb3BlLnN0YXRlID09PSBcIlwiKSB7XG5cdFx0XHQkc2NvcGUuZGlzcGxheUVycm9yID0gdHJ1ZTtcblx0XHRcdHJldHVybiAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJJZiBpbiBVUyBvciBDYW5hZGEsIG11c3QgaW5jbHVkZSBTdGF0ZS9Qcm92aW5jZVwiO1xuXHRcdH1cblxuXHRcdHZhciB1c2VySW5mbyA9IHtcblx0XHRcdGFkZHJlc3MxIDogJHNjb3BlLmFkZHJlc3MxLFxuXHRcdFx0YWRkcmVzczIgOiAkc2NvcGUuYWRkcmVzczIsXG5cdFx0XHR6aXAgOiAkc2NvcGUuemlwLFxuXHRcdFx0c3RhdGUgOiAkc2NvcGUuc3RhdGUsXG5cdFx0XHRjb3VudHJ5IDogJHNjb3BlLmNvdW50cnksXG5cdFx0XHRwaG9uZSA6ICRzY29wZS5waG9uZVxuXHRcdH1cblxuXHRcdHJldHVybiBQZXJzb25hbEluZm9GYWN0b3J5LnN1Ym1pdCgkc2NvcGUudXNlcklkLCB1c2VySW5mbylcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRyZXR1cm4gJHN0YXRlLmdvKCd1c2VyJywge3VzZXJJZDogJHNjb3BlLnVzZXJJZH0pO1xuXHRcdH0pXG5cdH1cblxufSk7IiwiYXBwLmZhY3RvcnkoJ1BlcnNvbmFsSW5mb0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAvLyBQZXJzb25hbEZhY3RvcnkgPSB7fTtcblxuICByZXR1cm4ge1xuICAgIHN1Ym1pdCA6IGZ1bmN0aW9uKGlkLCB1c2VySW5mbyl7XG4gICAgICByZXR1cm4gJGh0dHAucHV0KCcvYXBpL3VzZXIvJyArIGlkLCB1c2VySW5mbylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncGVyc29uYWwnLCB7XG5cdFx0dXJsOiAnL3BlcnNvbmFsLzppZCcsXG5cdFx0Y29udHJvbGxlcjogJ1BlcnNvbmFsSW5mb0N0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3BlcnNvbmFsaW5mby9wZXJzb25hbGluZm8udmlldy5odG1sJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR0aGVVc2VyOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBVc2VyRmFjdG9yeSl7XG5cdFx0XHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLmlkKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ3NvY2tJZENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGVQYXJhbXMsIHRoZVNvY2ssIHRoZVJldmlld3MsIGN1cnJlbnRVc2VyTGlrZSwgc29ja0xpa2VzLCBSZXZpZXdGYWN0b3J5LCBPcmRlckZhY3RvcnksIFNvY2tGYWN0b3J5LCBVc2VyRmFjdG9yeSwgTGlrZUZhY3RvcnkpIHtcblxuICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IGZhbHNlO1xuICAkc2NvcGUuc29jayA9IHRoZVNvY2s7XG4gICRzY29wZS5yZXZpZXdzID0gdGhlUmV2aWV3cztcbiAgJHNjb3BlLmxpa2UgPSBjdXJyZW50VXNlckxpa2UgfHwge2xpa2U6ZmFsc2UsIGRpc2xpa2U6ZmFsc2V9O1xuICAkc2NvcGUuY3VycmVudFVzZXJSZXZpZXdlZFNvY2sgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBjb3VudExpa2VzKHZvdGVzKSB7XG4gICAgdmFyIGxpa2VzID0gMCxcbiAgICAgICAgZGlzbGlrZXMgPSAwO1xuICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSkge1xuICAgICAgaWYgKHZvdGUubGlrZSkgbGlrZXMrKztcbiAgICAgIGlmICh2b3RlLmRpc2xpa2UpIGRpc2xpa2VzKys7XG4gICAgfSk7XG4gICAgcmV0dXJuIHsgbGlrZXM6IGxpa2VzLCBkaXNsaWtlczogZGlzbGlrZXMgfTtcbiAgfVxuXG4gICRzY29wZS5saWtlcyA9IGNvdW50TGlrZXMoc29ja0xpa2VzKTtcblxuXG4gICRzY29wZS51cGRhdGVMaWtlcyA9IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgIHJldHVybiBMaWtlRmFjdG9yeS5nZXRTb2NrTGlrZXMoc29ja0lkKVxuICAgIC50aGVuKGZ1bmN0aW9uKGxpa2VzKSB7XG4gICAgICAkc2NvcGUubGlrZXMgPSBjb3VudExpa2VzKGxpa2VzKTtcbiAgICB9KVxuICB9O1xuXG4gICRzY29wZS5kYXRlUGFyc2VyID0gZnVuY3Rpb24gKHJhd0RhdGUpIHtcbiAgICB2YXIgcmF3RGF0ZSA9IHRoZVNvY2suY3JlYXRlZEF0LnNwbGl0KFwiVFwiKVswXS5zcGxpdChcIi1cIik7XG4gICAgdmFyIHJhd1llYXIgPSByYXdEYXRlWzBdO1xuICAgIHZhciByYXdNb250aCA9IHJhd0RhdGVbMV07XG4gICAgdmFyIHJhd0RheSA9IHJhd0RhdGVbMl07XG4gICAgdmFyIG1vbnRoT2JqID0ge1xuICAgICAgICBcIjAxXCI6XCJKYW51YXJ5XCIsXG4gICAgICAgIFwiMDJcIjpcIkZlYnJ1YXJ5XCIsXG4gICAgICAgIFwiMDNcIjpcIk1hcmNoXCIsXG4gICAgICAgIFwiMDRcIjpcIkFwcmlsXCIsXG4gICAgICAgIFwiMDVcIjpcIk1heVwiLFxuICAgICAgICBcIjA2XCI6XCJKdW5lXCIsXG4gICAgICAgIFwiMDdcIjpcIkp1bHlcIixcbiAgICAgICAgXCIwOFwiOlwiQXVndXN0XCIsXG4gICAgICAgIFwiMDlcIjpcIlNlcHRlbWJlclwiLFxuICAgICAgICBcIjEwXCI6XCJPY3RvYmVyXCIsXG4gICAgICAgIFwiMTFcIjpcIk5vdmVtYmVyXCIsXG4gICAgICAgIFwiMTJcIjpcIkRlY2VtYmVyXCJcbiAgICB9XG4gICAgcmV0dXJuIHJhd0RheSArIFwiIFwiICsgbW9udGhPYmpbcmF3TW9udGhdICsgXCIgXCIgKyByYXdZZWFyO1xuICB9XG5cbiAgJHNjb3BlLmFsZXJ0ID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICRzY29wZS5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nXG4gICAgICAkc2NvcGUuJGRpZ2VzdCgpXG4gICAgfSwgMzAwMClcbiAgICAvLyBpZiAoISRzY29wZS5hbGVydGluZykgJHNjb3BlLm1lc3NhZ2UgPT09IG51bGxcbiAgfVxuXG4gICRzY29wZS5nb1RvVXNlclBhZ2UgPSBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiB1c2VySWR9KTtcbiAgfVxuXG4gICRzY29wZS5hZGRJdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW0gPSB7XG4gICAgICBzb2NrSWQ6JHNjb3BlLnNvY2suaWQsXG4gICAgICBxdWFudGl0eTogKyRzY29wZS5xdWFudGl0eSxcbiAgICAgIG9yaWdpbmFsUHJpY2U6ICskc2NvcGUuc29jay5wcmljZVxuICAgIH07XG4gICAgaWYgKGl0ZW0ucXVhbnRpdHkgPiAwKSB7XG4gICAgICBPcmRlckZhY3RvcnkuYWRkVG9DYXJ0KGl0ZW0pXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBpZiAodHlwZW9mIHJlc3BvbnNlICE9PSBcIm9iamVjdFwiKSAkc2NvcGUuYWxlcnQocmVzcG9uc2UpO1xuICAgICAgICBlbHNlICRzdGF0ZS5nbygnY3VycmVudENhcnQnKTtcbiAgICAgIH0pXG4gICAgfVxuICAgIGVsc2UgJHNjb3BlLmFsZXJ0KCdZb3UgaGF2ZSB0byBhZGQgYXQgbGVhc3Qgb25lIHNvY2shJyk7XG4gIH1cblxuICAkc2NvcGUuZGlzcGxheVRhZ3MgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJHNjb3BlLnNvY2sudGFncy5tYXAoZnVuY3Rpb24odGFnKXtcbiAgICAgIHJldHVybiAnIycgKyB0YWc7XG4gICAgfSkuam9pbihcIiwgXCIpO1xuICB9XG5cbiAgJHNjb3BlLmRpc3BsYXlUYWdzKCk7XG5cbiAgJHNjb3BlLmdldExvZ2dlZEluVXNlcklkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpXG4gICAgLnRoZW4oZnVuY3Rpb24odXNlcil7XG4gICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgJHNjb3BlLmxvZ2dlZEluVXNlcklkID0gJ25vbmUnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmxvZ2dlZEluVXNlcklkID0gdXNlci5pZDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuZ2V0TG9nZ2VkSW5Vc2VySWQoKTtcblxuICAkc2NvcGUudXNlckNhbm5vdFBvc3RSZXZpZXcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkO1xuICB9O1xuXG4gICRzY29wZS51c2VyQ2Fubm90UG9zdFJldmlldygpO1xuXG4gICRzY29wZS5uZXdSZXZpZXcgPSBmdW5jdGlvbigpIHtcblxuICAvL2lmIHVzZXIgaGFzIGFscmVhZHkgcmV2aWV3IHNvY2ssIGRvbid0IGFsbG93IHVzZXIgdG8gcmV2aWV3IGl0IGFnYWluXG4gICAgdmFyIHVzZXJzV2hvUmV2aWV3ZWRTb2NrID0gJHNjb3BlLnJldmlld3MubWFwKGZ1bmN0aW9uKHJldmlldyl7XG4gICAgICByZXR1cm4gcmV2aWV3LnVzZXJJZDtcbiAgICB9KVxuXG4gICAgaWYgKCRzY29wZS5sb2dnZWRJblVzZXJJZCA9PT0gJ25vbmUnKSB7XG4gICAgICAkc2NvcGUucmV2aWV3RXJyb3JNZXNzYWdlID0gXCJZb3UgbXVzdCBiZSBsb2dnZWQgaW4gdG8gcmV2aWV3IGEgc29jayFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHVzZXJzV2hvUmV2aWV3ZWRTb2NrLmluZGV4T2YoJHNjb3BlLmxvZ2dlZEluVXNlcklkKSAhPT0gLTEgfHwgJHNjb3BlLnVzZXJDYW5ub3RQb3N0UmV2aWV3KCkpIHtcbiAgICAgICRzY29wZS5yZXZpZXdFcnJvck1lc3NhZ2UgPSBcIllvdSd2ZSBhbHJlYWR5IHJldmlld2VkIHRoaXMgc29jayEgWW91IGNhbid0IHJldmlldyBpdCBhZ2FpbiFcIjtcbiAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgLy9pZiBzb2NrIGlkIG1hdGNoZXMgdXNlciBpZCwgdXNlciBkb24ndCBhbGxvdyB1c2VyIHRvIHBvc3QgYSByZXZpZXdcbiAgICB9IGVsc2UgaWYgKCRzY29wZS5sb2dnZWRJblVzZXJJZCA9PT0gJHNjb3BlLnNvY2sudXNlci5pZCkge1xuICAgICAgJHNjb3BlLnJldmlld0Vycm9yTWVzc2FnZSA9IFwiWW91IGNhbid0IHJldmlldyB5b3VyIG93biBzb2NrIVwiO1xuICAgICAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIHZhciBuZXdSZXZpZXcgPSB7XG4gICAgICAgIHRleHQ6ICRzY29wZS5yZXZpZXdUZXh0LFxuICAgICAgICBzb2NrSWQ6ICRzY29wZS5zb2NrLmlkXG4gICAgICB9XG4gICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wb3N0UmV2aWV3KG5ld1JldmlldylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG5ld1Jldmlldyl7XG4gICAgICAgIHZhciByZXZpZXcgPSB7fTtcbiAgICAgICAgcmV2aWV3LnVzZXIgPSB7fTtcblxuICAgICAgICAgIHJldmlldy51c2VyLmZpcnN0X25hbWUgPSBuZXdSZXZpZXcudXNlci5maXJzdF9uYW1lO1xuICAgICAgICAgIHJldmlldy51c2VyLmxhc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmxhc3RfbmFtZTtcbiAgICAgICAgICByZXZpZXcudXNlci5wcm9maWxlX3BpYyA9IG5ld1Jldmlldy51c2VyLnByb2ZpbGVfcGljO1xuICAgICAgICAgIHJldmlldy51c2VyLnVzZXJuYW1lID0gbmV3UmV2aWV3LnVzZXIudXNlcm5hbWU7XG4gICAgICAgICAgcmV2aWV3LnRleHQgPSBuZXdSZXZpZXcucmV2aWV3LnRleHQ7XG5cbiAgICAgICAgJHNjb3BlLnJldmlld3MucHVzaChyZXZpZXcpO1xuICAgICAgICAkc2NvcGUucmV2aWV3VGV4dCA9IG51bGw7XG4gICAgICAgICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAkc2NvcGUubmV3TGlrZSA9IExpa2VGYWN0b3J5Lm5ld0xpa2U7XG4gICRzY29wZS5uZXdEaXNsaWtlID0gTGlrZUZhY3RvcnkubmV3RGlzbGlrZTtcbiAgJHNjb3BlLnVwZGF0ZUxpa2UgPSBMaWtlRmFjdG9yeS51cGRhdGVMaWtlO1xuICAkc2NvcGUudXBkYXRlRGlzbGlrZSA9IExpa2VGYWN0b3J5LnVwZGF0ZURpc2xpa2U7XG5cbiAgJHNjb3BlLnZvdGUgPSBmdW5jdGlvbihzb2NrSWQsIG5uZXcsIHVwZGF0ZSkge1xuICAgIGlmICghJHNjb3BlLnZlcmlmeVVzZXIpICRzY29wZS5hbGVydChcIlBsZWFzZSBsb2cgaW4gdG8gbGlrZSBhIHNvY2shXCIpO1xuXG4gICAgaWYgKCEkc2NvcGUubGlrZS5saWtlICYmICEkc2NvcGUubGlrZS5kaXNsaWtlKSB7XG4gICAgICBubmV3KHNvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgJHNjb3BlLmxpa2UgPSB2b3RlO1xuICAgICAgICAkc2NvcGUubGlrZXMgPSAkc2NvcGUudXBkYXRlTGlrZXMoJHNjb3BlLnNvY2suaWQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZShzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbih1cGRhdGUpIHtcbiAgICAgICAgJHNjb3BlLmxpa2UgPSB1cGRhdGU7XG4gICAgICAgICRzY29wZS5saWtlcyA9ICRzY29wZS51cGRhdGVMaWtlcygkc2NvcGUuc29jay5pZCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgIHJldHVybiB1c2VyLmlkID09ICRzY29wZS5zb2NrLlVzZXJJZCB8fCB1c2VyLmlzQWRtaW4/IHRydWUgOiBmYWxzZVxuICB9KVxuICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgJHNjb3BlLnZlcmlmeVVzZXIgPSByZXN1bHQ7XG4gIH0pO1xuXG4gICRzY29wZS5kZWxldGUgPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiBTb2NrRmFjdG9yeS5kZWxldGUoaWQpXG4gICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAkc3RhdGUuZ28oJ2hvbWUnKVxuICAgIH0pXG4gIH07XG5cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1NvY2tGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBhbGxTb2NrczogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCdhcGkvc29jaycpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgfSlcbiAgICB9LFxuXG4gICAgc2luZ2xlU29jazogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svJyArIHNvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBzb2NrQnlVc2VySWQ6IGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL2J5VXNlci8nICsgdXNlcklkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIG1vc3RSZWNlbnRTb2NrczogZnVuY3Rpb24gKCkge1xuICAgIFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL3JlY2VudCcpXG4gICAgXHQudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICBcdFx0cmV0dXJuIHJlcy5kYXRhO1xuICAgIFx0fSlcbiAgICB9LFxuXG4gICAgbW9zdFBvcHVsYXJTb2NrczogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL3BvcHVsYXInKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIHJlY2VudGx5UHVyY2hhc2VkU29ja3M6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL3JlY2VudC1wdXJjaGFzZScpXG4gICAgICAudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGJyb3dzZVNvY2tzOiBmdW5jdGlvbihpZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL2Jyb3dzZS8nK2lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIHNhdmVEZXNpZ246IGZ1bmN0aW9uIChuZXdTb2NrRGF0YU9iaikge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay8nLCBuZXdTb2NrRGF0YU9iailcbiAgICB9LFxuXG4gICAgcHJlcGFyZVRhZ3M6IGZ1bmN0aW9uICh0YWdJbnB1dCkge1xuICAgICAgcmV0dXJuIHRhZ0lucHV0LnNwbGl0KCcgJykubWFwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZSA9IGUucmVwbGFjZSgvLC9pLCBcIlwiKTtcbiAgICAgICAgZSA9IGUuc3Vic3RyaW5nKDEpO1xuICAgICAgICByZXR1cm4gZTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB1cHZvdGU6IGZ1bmN0aW9uIChzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svdXB2b3RlJywge2lkOiBzb2NrSWR9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGRvd252b3RlOiBmdW5jdGlvbiAoc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9zb2NrL2Rvd252b3RlJywge2lkOiBzb2NrSWR9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGdldFVuc2lnbmVkVVJMOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NvY2svdW5zaWduZWRVUkwnKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICB9KVxuICAgIH0sXG4gICAgZGVsZXRlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKGlkKVxuICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9zb2NrL2RlbGV0ZS8nICsgaWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgfSlcbiAgICB9XG5cbiAgfVxuXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2luZ2xlU29ja1ZpZXcnLCB7XG4gICAgdXJsOicvc29ja3MvOmlkJyxcbiAgICBjb250cm9sbGVyOiAnc29ja0lkQ29udHJvbGxlcicsXG4gICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0dmlldy9wcm9kdWN0dmlldy5odG1sJyxcbiAgICByZXNvbHZlOiB7XG4gICAgICB0aGVTb2NrOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBTb2NrRmFjdG9yeSkge1xuICAgICAgICByZXR1cm4gU29ja0ZhY3Rvcnkuc2luZ2xlU29jaygkc3RhdGVQYXJhbXMuaWQpXG4gICAgICB9LFxuICAgICAgdGhlUmV2aWV3czogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgUmV2aWV3RmFjdG9yeSkge1xuICAgICAgICByZXR1cm4gUmV2aWV3RmFjdG9yeS5wcm9kdWN0UmV2aWV3cygkc3RhdGVQYXJhbXMuaWQpXG4gICAgICB9LFxuICAgICAgY3VycmVudFVzZXJMaWtlOiBmdW5jdGlvbigkc3RhdGVQYXJhbXMsIExpa2VGYWN0b3J5LCBBdXRoU2VydmljZSkge1xuICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24odXNlcikge1xuICAgICAgICAgIGlmICh1c2VyKSByZXR1cm4gTGlrZUZhY3RvcnkuZ2V0VXNlclNvY2tMaWtlKCRzdGF0ZVBhcmFtcy5pZCk7XG4gICAgICAgICAgZWxzZSByZXR1cm4gXCJubyB1c2VyIGRhdGFcIjtcbiAgICAgICAgfSlcbiAgICAgIH0sXG4gICAgICBzb2NrTGlrZXM6IGZ1bmN0aW9uKCRzdGF0ZVBhcmFtcywgTGlrZUZhY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIExpa2VGYWN0b3J5LmdldFNvY2tMaWtlcygkc3RhdGVQYXJhbXMuaWQpXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG59KTtcbiIsImFwcC5mYWN0b3J5KCdSZXZpZXdGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBwb3N0UmV2aWV3OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3Jldmlldy8nLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG4gICAgcHJvZHVjdFJldmlld3M6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9yZXZpZXcvc29jay8nK3NvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfSxcbiAgICBkZWxldGU6IGZ1bmN0aW9uKHJldmlld0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZGVsZXRlKCdhcGkvcmV2aWV3L2RlbGV0ZS8nICtyZXZpZXdJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2VhcmNoUmVzdWx0cycsIHtcblx0XHR1cmw6ICcvc2VhcmNoLzpzZWFyY2hUZXJtcycsXG5cdFx0dGVtcGxhdGVVcmw6ICcvanMvc2VhcmNocmVzdWx0cy9zZWFyY2gudmlldy5odG1sJyxcblx0XHRjb250cm9sbGVyOiBcInNlYXJjaEN0cmxcIixcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRhbGxSZXN1bHRzOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBTZWFyY2hGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBTZWFyY2hGYWN0b3J5LmZpbmRCeVNlYXJjaFRleHQoJHN0YXRlUGFyYW1zLnNlYXJjaFRlcm1zKVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgYWxsUmVzdWx0cykge1xuXHRcdC8vIFx0JHNjb3BlLnJlc3VsdHMgPSBhbGxSZXN1bHRzO1xuXHRcdC8vIFx0Y29uc29sZS5sb2coXCJBbGwgUmVzdWx0cyEhXCIsIGFsbFJlc3VsdHMpO1xuXHRcdC8vIFx0JHNjb3BlLm51bWJlciA9IDEyMztcblx0XHQvLyB9XG5cdFx0Ly8gY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhcIkhFUkVFRUVFXCIsICRzdGF0ZVBhcmFtcy5yZXN1bHRzKVxuXHRcdC8vIFx0JHNjb3BlLnJlc3VsdHMgPSAkc3RhdGVQYXJhbXMucmVzdWx0c1xuXHRcdC8vIH1cblx0fSlcbn0pXG4iLCJhcHAuY29udHJvbGxlcignU2lnbnVwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIFNpZ251cEZhY3RvcnksICRzdGF0ZSwgQXV0aFNlcnZpY2UpIHtcblxuICBmdW5jdGlvbiBwYXNzd29yZFZhbGlkIChwYXNzd29yZCkge1xuICAgIGlmIChwYXNzd29yZC5sZW5ndGggPCA2KSB7XG4gICAgICAkc2NvcGUuc2hvd0Vycm9yID0gdHJ1ZTtcbiAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIlBhc3N3b3JkIG11c3QgYmUgNiBjaGFyYWN0ZXJzIGxvbmchXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChwYXNzd29yZCAhPT0gJHNjb3BlLnB3Mikge1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJUaGUgcGFzc3dvcmQgZmllbGRzIGRvbid0IG1hdGNoIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoL1xcVy8udGVzdChwYXNzd29yZCkpe1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJQYXNzd29yZCBjYW5ub3QgY29udGFpbiBzcGVjaWFsIGNoYXJhY3RlcnMhXCI7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gICRzY29wZS5zaG93RXJyb3IgPSBmYWxzZTtcblxuICAkc2NvcGUuZGlzcGxheUVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICRzY29wZS5zaG93RXJyb3I7XG4gIH1cblxuICAkc2NvcGUuc3VibWl0U2lnbnVwID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChwYXNzd29yZFZhbGlkKCRzY29wZS5wYXNzd29yZCkpe1xuICAgICAgcmV0dXJuIFNpZ251cEZhY3Rvcnkuc3VibWl0KHtcbiAgICAgICBlbWFpbDogJHNjb3BlLmVtYWlsLFxuICAgICAgIHVzZXJuYW1lOiAkc2NvcGUudXNlcm5hbWUsXG4gICAgICAgcGFzc3dvcmQ6ICRzY29wZS5wYXNzd29yZCxcbiAgICAgICBmaXJzdF9uYW1lOiAkc2NvcGUuZmlyc3RuYW1lLFxuICAgICAgIGxhc3RfbmFtZTogJHNjb3BlLmxhc3RuYW1lLFxuICAgICAgIGlzQWRtaW46IGZhbHNlLFxuICAgICAgIG5ld1VzZXI6IHRydWVcbiAgICAgfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIHZhciBsb2dpbk9iaiA9IHt9O1xuICAgICAgICBsb2dpbk9iai5lbWFpbCA9ICRzY29wZS5lbWFpbDtcbiAgICAgICAgbG9naW5PYmoucGFzc3dvcmQgPSAkc2NvcGUucGFzc3dvcmQ7XG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luT2JqKVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgcmV0dXJuICRzdGF0ZS5nbygncGVyc29uYWwnLCB7aWQ6IHJlc3BvbnNlLmlkfSk7XG4gICAgICAgIH0pXG4gICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbn0pO1xuIiwiLy8gYXBwLmZhY3RvcnkoJ1NpZ251cEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuLy8gICB2YXIgU2lnbnVwRmFjdG9yeSA9IHt9O1xuXG4vLyAgIFNpZ251cEZhY3Rvcnkuc3VibWl0ID0gZnVuY3Rpb24odXNlckluZm8pe1xuLy8gICBcdGNvbnNvbGUubG9nKHVzZXJJbmZvKTtcbi8vICAgXHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS91c2VyLycsIHVzZXJJbmZvKVxuLy8gICBcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbi8vICAgXHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuLy8gICBcdH0pXG4vLyAgIH1cblxuLy8gICByZXR1cm4gU2lnbnVwRmFjdG9yeTtcblxuLy8gfSlcblxuYXBwLmZhY3RvcnkoJ1NpZ251cEZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0dmFyIFNpZ251cEZhY3RvcnkgPSB7fTtcblxuXHRTaWdudXBGYWN0b3J5LnN1Ym1pdCA9IGZ1bmN0aW9uICh1c2VySW5mbykge1xuXHRcdGNvbnNvbGUubG9nKFwiRnJvbSBTaWdudXAgRmFjdG9yeVwiLCB1c2VySW5mbyk7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci8nLCB1c2VySW5mbylcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuXHR9XG5cdHJldHVybiBTaWdudXBGYWN0b3J5O1xufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0Y29udHJvbGxlcjogJ1NpZ251cEN0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3NpZ251cC9zaWdudXAudmlldy5odG1sJ1xuXHR9KTtcblxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ1VzZXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCB0aGVVc2VyLCB0aGVVc2VyU29ja3MsIEF1dGhTZXJ2aWNlLCBVc2VyRmFjdG9yeSkge1xuICAgIGNvbnNvbGUubG9nKFwiY29udHJvbGxlclwiLCB0aGVVc2VyU29ja3MpO1xuXHQkc2NvcGUudXNlciA9IHRoZVVzZXI7XG5cdCRzY29wZS5zb2NrcyA9IHRoZVVzZXJTb2NrcztcblxuICAgICRzY29wZS5kYXRlUGFyc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmF3RGF0ZSA9ICRzY29wZS51c2VyLmNyZWF0ZWRBdC5zcGxpdChcIlRcIilbMF0uc3BsaXQoXCItXCIpO1xuICAgICAgICB2YXIgcmF3WWVhciA9IHJhd0RhdGVbMF07XG4gICAgICAgIHZhciByYXdNb250aCA9IHJhd0RhdGVbMV07XG4gICAgICAgIHZhciByYXdEYXkgPSByYXdEYXRlWzJdO1xuXG4gICAgICAgIHZhciBtb250aE9iaiA9IHtcbiAgICAgICAgICAgIFwiMDFcIjpcIkphbnVhcnlcIixcbiAgICAgICAgICAgIFwiMDJcIjpcIkZlYnJ1YXJ5XCIsXG4gICAgICAgICAgICBcIjAzXCI6XCJNYXJjaFwiLFxuICAgICAgICAgICAgXCIwNFwiOlwiQXByaWxcIixcbiAgICAgICAgICAgIFwiMDVcIjpcIk1heVwiLFxuICAgICAgICAgICAgXCIwNlwiOlwiSnVuZVwiLFxuICAgICAgICAgICAgXCIwN1wiOlwiSnVseVwiLFxuICAgICAgICAgICAgXCIwOFwiOlwiQXVndXN0XCIsXG4gICAgICAgICAgICBcIjA5XCI6XCJTZXB0ZW1iZXJcIixcbiAgICAgICAgICAgIFwiMTBcIjpcIk9jdG9iZXJcIixcbiAgICAgICAgICAgIFwiMTFcIjpcIk5vdmVtYmVyXCIsXG4gICAgICAgICAgICBcIjEyXCI6XCJEZWNlbWJlclwiXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJhd0RheSArIFwiIFwiICsgbW9udGhPYmpbcmF3TW9udGhdICsgXCIgXCIgKyByYXdZZWFyO1xuICAgIH1cblxuXHQkc2NvcGUudG9TaGlwcGluZ0luZm8gPSBmdW5jdGlvbihpZCl7XG5cdFx0JHN0YXRlLmdvKCdwZXJzb25hbCcsIHtpZDogaWR9KTtcblx0fTtcblxuXHQkc2NvcGUudG9Tb2NrVmlldyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdCRzdGF0ZS5nbygnc2luZ2xlU29ja1ZpZXcnLCB7aWQ6IGlkfSk7XG5cdH07XG5cblx0QXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gdXNlci5pZCA9PSAkc2NvcGUudXNlci5pZCB8fCB1c2VyLmlzQWRtaW4gPyB0cnVlIDogZmFsc2U7XG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgXHQkc2NvcGUudmVyaWZ5VXNlciA9IHJlc3VsdDtcbiAgICB9KTtcblxuXHRBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiB1c2VyLmlzQWRtaW4gPyB0cnVlIDogZmFsc2U7XG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgXHQkc2NvcGUuaXNBZG1pbiA9IHJlc3VsdDtcbiAgICB9KTtcblxuICAgIGlmICgkc2NvcGUudXNlci5pc0FkbWluKSAkc2NvcGUuYWRtaW5CdXR0b24gPSBcIk1ha2UgTm9uLUFkbWluXCI7XG4gICAgaWYgKCEkc2NvcGUudXNlci5pc0FkbWluKSAkc2NvcGUuYWRtaW5CdXR0b24gPSBcIk1ha2UgQWRtaW5cIjtcblxuICAgICRzY29wZS5kZWxldGUgPSBVc2VyRmFjdG9yeS5kZWxldGU7XG5cbiAgICAkc2NvcGUubWFrZUFkbWluID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgXHRyZXR1cm4gVXNlckZhY3RvcnkubWFrZUFkbWluKGlkKVxuICAgIFx0LnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgIFx0XHRpZiAoJHNjb3BlLnVzZXIuaXNBZG1pbikge1xuICAgIFx0XHRcdCRzY29wZS51c2VyLmlzQWRtaW4gPSBmYWxzZTtcbiAgICBcdFx0XHQkc2NvcGUuYWRtaW5CdXR0b24gPSBcIk1ha2UgQWRtaW5cIjtcbiAgICBcdFx0fVxuICAgIFx0XHRlbHNlIGlmICghJHNjb3BlLnVzZXIuaXNBZG1pbikge1xuICAgIFx0XHRcdCRzY29wZS51c2VyLmlzQWRtaW4gPSB0cnVlO1xuICAgIFx0XHRcdCRzY29wZS5hZG1pbkJ1dHRvbiA9IFwiTWFrZSBOb24tQWRtaW5cIjtcbiAgICBcdFx0fVxuICAgIFx0fSk7XG4gICAgfVxufSlcbiIsImFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlKSB7XG5cdHZhciBVc2VyRmFjdG9yeSA9IHt9O1xuXG5cdFVzZXJGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlci8nICsgaWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YVxuXHRcdH0pXG5cdH1cblxuXHRVc2VyRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3VzZXIvYWxsJylcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhXG5cdFx0fSlcblx0fVxuXG5cdFVzZXJGYWN0b3J5LmRlbGV0ZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvZGVsZXRlLycgKyBpZClcblx0XHQudGhlbigkc3RhdGUuZ28oJ2hvbWUnKSlcblx0fVxuXG5cdFVzZXJGYWN0b3J5Lm1ha2VBZG1pbiA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdHJldHVybiAkaHR0cC5wdXQoJy9hcGkvdXNlci9tYWtlQWRtaW4vJyArIGlkKVxuXHR9XG5cblx0cmV0dXJuIFVzZXJGYWN0b3J5O1xufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1c2VyJywge1xuXHRcdHVybDogJy91c2VyLzp1c2VySWQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3VzZXIvdXNlci1wcm9maWxlLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdVc2VyQ3RybCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0dGhlVXNlcjogZnVuY3Rpb24gKFVzZXJGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMudXNlcklkKTtcblx0XHRcdH0sXG5cdFx0XHR0aGVVc2VyU29ja3M6IGZ1bmN0aW9uIChTb2NrRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHJldHVybiBTb2NrRmFjdG9yeS5zb2NrQnlVc2VySWQoJHN0YXRlUGFyYW1zLnVzZXJJZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxufSlcbiIsImFwcC5jb250cm9sbGVyKCduYXZiYXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBTZWFyY2hGYWN0b3J5LCBPcmRlckZhY3RvcnkpIHtcblxuXHQkc2NvcGUuc2VhcmNoID0gZnVuY3Rpb24oc2VhcmNoVGVybXMpe1xuXHRcdC8vIFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dChzZWFyY2hUZXJtcylcblx0XHQvLyAudGhlbihmdW5jdGlvbihyZXN1bHRzKXtcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gcmVzdWx0cztcblx0XHQvLyBcdGNvbnNvbGUubG9nKHJlc3VsdHMpO1xuXHRcdFx0cmV0dXJuICRzdGF0ZS5nbygnc2VhcmNoUmVzdWx0cycsIHtzZWFyY2hUZXJtczogc2VhcmNoVGVybXN9KTtcblx0XHQvLyB9KVxuXHR9XG5cblx0cmV0dXJuIE9yZGVyRmFjdG9yeS5lbnN1cmVDYXJ0KClcblxufSlcblxuYXBwLmNvbnRyb2xsZXIoJ3NlYXJjaEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIGFsbFJlc3VsdHMsICRzdGF0ZVBhcmFtcykge1xuXHQkc2NvcGUucmVzdWx0cyA9IGFsbFJlc3VsdHM7XG5cdCRzY29wZS5zZWVTb2NrID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0JHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KVxuXHR9XG59KVxuIiwiYXBwLmRpcmVjdGl2ZSgnc29ja0FkbWluUm93JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICBzY29wZToge1xuICAgICAgc29jazogXCI9c29ja0FkbWluUm93XCJcbiAgICB9LFxuICAgIHRlbXBsYXRlVXJsOiAnanMvYWRtaW4vdmlld3Mvc29ja0FkbWluUm93Lmh0bWwnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgfVxuICB9XG59KTsiLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZmFjdG9yeShcIlNlYXJjaEZhY3RvcnlcIiwgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBTZWFyY2hGYWN0b3J5ID0ge307XG5cblx0U2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0ID0gZnVuY3Rpb24gKHRleHQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NlYXJjaC8/cT0nICsgdGV4dClcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHRzKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0cy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gU2VhcmNoRmFjdG9yeTtcbn0pIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSwgT3JkZXJGYWN0b3J5KSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIE9yZGVyRmFjdG9yeS5lbnN1cmVDYXJ0KClcblxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ015IFByb2ZpbGUnLCBzdGF0ZTogJ3VzZXIoe3VzZXJJZDp1c2VyLmlkfSknLCBhdXRoOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgLy8geyBsYWJlbDogJ0Fib3V0Jywgc3RhdGU6ICdhYm91dCcgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnRGVzaWduIGEgU29jaycsIHN0YXRlOiAnZGVzaWduVmlldycgfSxcbiAgICAgICAgICAgICAgICAvLyB7IGxhYmVsOiAnQWRtaW4gRGFzaGJvYXJkJywgc3RhdGU6ICdhZG1pbid9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS5hZG1pbkl0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHtsYWJlbDogJ0FkbWluIERhc2hib2FyZCcsIHN0YXRlOiAnYWRtaW4nfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKClcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ29hdXRoQnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICBwcm92aWRlck5hbWU6ICdAJ1xuICAgIH0sXG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uaHRtbCdcbiAgfVxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
