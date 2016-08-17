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

// mostPopularSocks: function(SockFactory) {
//   return SockFacory.mostPopularSocks();
// }
app.controller('homeCtrl', function ($scope, mostRecentSocks, SockFactory, $state, $stateParams) {

  $scope.mostRecentSocks = mostRecentSocks;
  SockFactory.mostPopularSocks().then(function (socks) {
    $scope.mostPopularSocks = socks;
  });

  $scope.seeSock = function (id) {
    $state.go('singleSockView', { id: id });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiYWRtaW4vYWRtaW4uY29udHJvbGxlci5qcyIsImFkbWluL2FkbWluLnN0YXRlLmpzIiwiYWRtaW4vbWVtYmVycy1vbmx5LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuY29udHJvbGxlci5qcyIsImNoZWNrb3V0L2NoZWNrb3V0LmZhY3RvcnkuanMiLCJjaGVja291dC9jaGVja291dC5zdGF0ZS5qcyIsImRlc2lnbi9kZXNpZ24tZGlyZWN0aXZlLmpzIiwiZGVzaWduL2Rlc2lnbi5jb250cm9sbGVyLmpzIiwiZGVzaWduL2Rlc2lnbi5qcyIsImRlc2lnbi9kZXNpZ24uc3RhdGUuanMiLCJkb2NzL2RvY3MuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxpa2UvbGlrZS5mYWN0b3J5LmpzIiwib3JkZXIvb3JkZXIuY29udHJvbGxlci5qcyIsIm9yZGVyL29yZGVyLmRpcmVjdGl2ZS5qcyIsIm9yZGVyL29yZGVyLmZhY3RvcnkuanMiLCJvcmRlci9vcmRlci5zdGF0ZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwicGVyc29uYWxpbmZvL3BlcnNvbmFsaW5mby5jb250cm9sbGVyLmpzIiwicGVyc29uYWxpbmZvL3BlcnNvbmFsaW5mby5mYWN0b3J5LmpzIiwicGVyc29uYWxpbmZvL3BlcnNvbmFsaW5mby5zdGF0ZS5qcyIsInByb2R1Y3R2aWV3L3Byb2R1Y3R2aWV3LmNvbnRyb2xsZXIuanMiLCJwcm9kdWN0dmlldy9wcm9kdWN0dmlldy5mYWN0b3J5LmpzIiwicHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuc3RhdGUuanMiLCJyZXZpZXcvcmV2aWV3LmZhY3RvcnkuanMiLCJzZWFyY2hyZXN1bHRzL3NlYXJjaC5zdGF0ZS5qcyIsInNpZ251cC9zaWdudXAuY29udHJvbGxlci5qcyIsInNpZ251cC9zaWdudXAuZmFjdG9yeS5qcyIsInNpZ251cC9zaWdudXAuc3RhdGUuanMiLCJ1c2VyL3VzZXItY29udHJvbGxlci5qcyIsInVzZXIvdXNlci1mYWN0b3J5LmpzIiwidXNlci91c2VyLXN0YXRlcy5qcyIsImNvbW1vbi9jb250cm9sbGVycy9uYXZiYXIuY29udHJvbGxlci5qcyIsImFkbWluL3ZpZXdzL3NvY2tBZG1pblJvdy5kaXJlY3RpdmUuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvc2VhcmNoLmZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uZGlyZWN0aXZlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsWUFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLFFBQUEsQ0FBQSxDQUFBOztBQUVBLElBQUEsTUFBQSxDQUFBLFVBQUEsa0JBQUEsRUFBQSxpQkFBQSxFQUFBOztBQUVBLG9CQUFBLFNBQUEsQ0FBQSxJQUFBOztBQUVBLHFCQUFBLFNBQUEsQ0FBQSxHQUFBOztBQUVBLHFCQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBLFFBQUEsQ0FBQSxNQUFBO0FBQ0EsR0FGQTtBQUdBLFNBQUEsaUJBQUEsQ0FBQSxrQ0FBQTtBQUNBLENBVkE7OztBQWFBLElBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7OztBQUdBLE1BQUEsK0JBQUEsU0FBQSw0QkFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLFdBQUEsTUFBQSxJQUFBLElBQUEsTUFBQSxJQUFBLENBQUEsWUFBQTtBQUNBLEdBRkE7Ozs7QUFNQSxhQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsUUFBQSxDQUFBLDZCQUFBLE9BQUEsQ0FBQSxFQUFBOzs7QUFHQTtBQUNBOztBQUVBLFFBQUEsWUFBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0E7QUFDQTs7O0FBR0EsVUFBQSxjQUFBOztBQUVBLGdCQUFBLGVBQUEsR0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7Ozs7QUFJQSxVQUFBLElBQUEsRUFBQTtBQUNBLGVBQUEsRUFBQSxDQUFBLFFBQUEsSUFBQSxFQUFBLFFBQUE7QUFDQSxPQUZBLE1BRUE7QUFDQSxlQUFBLEVBQUEsQ0FBQSxPQUFBO0FBQ0E7QUFDQSxLQVRBO0FBV0EsR0E1QkE7QUE4QkEsQ0F2Q0E7O0FDaEJBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOzs7QUFHQSxpQkFBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsU0FBQSxRQURBO0FBRUEsZ0JBQUEsaUJBRkE7QUFHQSxpQkFBQTtBQUhBLEdBQUE7QUFNQSxDQVRBOztBQVdBLElBQUEsVUFBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBOzs7QUFHQSxTQUFBLE1BQUEsR0FBQSxFQUFBLE9BQUEsQ0FBQSxhQUFBLENBQUE7QUFFQSxDQUxBOztBQ1hBLElBQUEsVUFBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsQ0FFQSxDQUZBO0FDQUEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsU0FBQSxRQURBO0FBRUEsaUJBQUEscUJBRkE7QUFHQSxnQkFBQTtBQUhBLEdBQUEsRUFLQSxLQUxBLENBS0EsYUFMQSxFQUtBO0FBQ0EsaUJBQUEsaUNBREE7QUFFQSxhQUFBO0FBQ0EsYUFBQSxlQUFBLFdBQUEsRUFBQTtBQUNBLGVBQUEsWUFBQSxRQUFBLEVBQUE7QUFDQTtBQUhBLEtBRkE7QUFPQSxnQkFBQSxvQkFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLFdBQUEsRUFBQSxhQUFBLEVBQUE7QUFDQSxhQUFBLEtBQUEsR0FBQSxLQUFBO0FBQ0EsY0FBQSxHQUFBLENBQUEsS0FBQTtBQUNBLGFBQUEsVUFBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsZ0JBQUEsR0FBQSxDQUFBLFlBQUE7QUFDQSxlQUFBLFlBQUEsTUFBQSxDQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsWUFBQTtBQUNBLGlCQUFBLEtBQUEsR0FBQSxPQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFBQSxnQkFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLEVBQUEsT0FBQSxJQUFBO0FBQUEsV0FBQSxDQUFBO0FBQ0EsU0FIQSxDQUFBO0FBSUEsT0FOQTs7QUFRQSxhQUFBLFlBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLGVBQUEsY0FBQSxNQUFBLENBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGlCQUFBLEtBQUEsR0FBQSxPQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxnQkFBQSxLQUFBLEVBQUEsS0FBQSxPQUFBLE1BQUEsRUFBQTtBQUNBLHFCQUFBLElBQUE7QUFDQSxhQUZBLE1BRUE7QUFDQSxtQkFBQSxPQUFBLEdBQUEsS0FBQSxPQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsWUFBQSxFQUFBO0FBQUEsdUJBQUEsYUFBQSxFQUFBLEtBQUEsRUFBQTtBQUFBLGVBQUEsQ0FBQTtBQUNBLHFCQUFBLElBQUE7QUFDQTtBQUNBLFdBUEEsQ0FBQTtBQVFBLFNBVkEsQ0FBQTtBQVdBLE9BWkE7QUFjQTtBQWhDQSxHQUxBLEVBdUNBLEtBdkNBLENBdUNBLGFBdkNBLEVBdUNBO0FBQ0EsaUJBQUEsaUNBREE7QUFFQSxhQUFBO0FBQ0EsYUFBQSxlQUFBLFdBQUEsRUFBQTtBQUNBLGVBQUEsWUFBQSxRQUFBLEVBQUE7QUFDQTtBQUhBO0FBRkEsR0F2Q0E7QUErQ0EsQ0FoREE7O0FDQUEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsaUJBQUEsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLFNBQUEsZUFEQTtBQUVBLGNBQUEsbUVBRkE7QUFHQSxnQkFBQSxvQkFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0Esa0JBQUEsUUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsS0FBQSxHQUFBLEtBQUE7QUFDQSxPQUZBO0FBR0EsS0FQQTs7O0FBVUEsVUFBQTtBQUNBLG9CQUFBO0FBREE7QUFWQSxHQUFBO0FBZUEsQ0FqQkE7O0FBbUJBLElBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTs7QUFFQSxNQUFBLFdBQUEsU0FBQSxRQUFBLEdBQUE7QUFDQSxXQUFBLE1BQUEsR0FBQSxDQUFBLDJCQUFBLEVBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxTQUFBLElBQUE7QUFDQSxLQUZBLENBQUE7QUFHQSxHQUpBOztBQU1BLFNBQUE7QUFDQSxjQUFBO0FBREEsR0FBQTtBQUlBLENBWkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbkJBLElBQUEsVUFBQSxDQUFBLG9CQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLFdBQUEsRUFBQSxlQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsU0FBQSxXQUFBLEdBQUEsV0FBQTs7QUFFQSxTQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxhQUFBLGNBQUEsQ0FBQSxTQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsU0FBQSxFQUFBO0FBQUEsYUFBQSxLQUFBLEdBQUEsU0FBQTtBQUFBLEtBREEsQ0FBQTtBQUVBLEdBSEE7QUFJQSxTQUFBLFNBQUE7O0FBRUEsU0FBQSxNQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsWUFBQSxHQUFBLENBQUEsUUFBQTtBQUNBLG9CQUFBLFVBQUEsQ0FBQTtBQUNBLGFBQUEsU0FBQSxFQURBO0FBRUEsY0FBQSxTQUFBLE9BQUEsS0FBQSxHQUFBLEdBQUE7QUFGQSxLQUFBLEVBSUEsSUFKQSxDQUlBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsYUFBQSxhQUFBLFVBQUEsRUFBQTtBQUNBLEtBTkEsRUFPQSxJQVBBLENBT0EsVUFBQSxHQUFBLEVBQUE7QUFDQSxhQUFBLEVBQUEsQ0FBQSxhQUFBO0FBQ0EsS0FUQTtBQVVBLEdBWkE7QUFjQSxDQXZCQTs7QUNBQSxJQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxTQUFBO0FBQ0EsZ0JBQUEsb0JBQUEsR0FBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLElBQUEsQ0FBQSxXQUFBLEVBQUEsR0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsTUFBQSxJQUFBO0FBQ0EsT0FIQSxDQUFBO0FBSUE7QUFOQSxHQUFBO0FBUUEsQ0FWQTs7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGlCQUFBLEtBQUEsQ0FBQSxVQUFBLEVBQUE7QUFDQSxTQUFBLGdCQURBO0FBRUEsaUJBQUEsNEJBRkE7QUFHQSxnQkFBQSxvQkFIQTtBQUlBLGFBQUE7QUFDQSxtQkFBQSxxQkFBQSxZQUFBLEVBQUE7QUFDQSxlQUFBLGFBQUEsUUFBQSxDQUFBLFNBQUEsQ0FBQTtBQUNBO0FBSEE7QUFKQSxHQUFBO0FBVUEsQ0FYQTs7QUNBQSxJQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxpQkFBQSw0QkFGQTtBQUdBLFVBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQSxjQUFBLEVBQUE7O0FBRUEsVUFBQSxRQUFBLE1BQUEsS0FBQTtBQUNBLFVBQUEsY0FBQSxNQUFBLFdBQUE7QUFDQSxVQUFBLE9BQUEsTUFBQSxJQUFBO0FBQ0EsVUFBQSxTQUFBLFFBQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLGVBQUEsS0FBQTs7QUFFQSxZQUFBLGlCQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsWUFBQTtBQUNBLE9BRkE7O0FBSUEsVUFBQSxvQkFBQSxTQUFBLGlCQUFBLENBQUEsS0FBQSxFQUFBLFdBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsU0FBQSxFQUFBO0FBQ0EseUJBQUEsSUFBQTtBQUNBLGdCQUFBLFlBQUEsR0FBQSwwQkFBQTtBQUNBLGlCQUFBLElBQUE7QUFDQSxTQUpBLE1BSUEsSUFBQSxnQkFBQSxTQUFBLEVBQUE7QUFDQSx5QkFBQSxJQUFBO0FBQ0EsZ0JBQUEsWUFBQSxHQUFBLGdDQUFBO0FBQ0EsaUJBQUEsSUFBQTtBQUNBLFNBSkEsTUFJQSxJQUFBLFNBQUEsU0FBQSxFQUFBO0FBQ0EseUJBQUEsSUFBQTtBQUNBLGdCQUFBLFlBQUEsR0FBQSw0QkFBQTtBQUNBLGlCQUFBLElBQUE7QUFDQTtBQUNBLE9BZEE7O0FBZ0JBLFlBQUEsVUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBLFdBQUEsRUFBQSxJQUFBLEVBQUE7O0FBRUEsWUFBQSxrQkFBQSxLQUFBLEVBQUEsV0FBQSxFQUFBLElBQUEsQ0FBQSxFQUFBO0FBQ0EsaUJBQUEsa0JBQUEsS0FBQSxFQUFBLFdBQUEsRUFBQSxJQUFBLENBQUE7QUFDQTs7QUFFQSxZQUFBLFVBQUEsWUFBQSxXQUFBLENBQUEsSUFBQSxDQUFBOztBQUVBLFlBQUEsaUJBQUE7QUFDQSxpQkFBQSxLQURBO0FBRUEsdUJBQUEsV0FGQTtBQUdBLGdCQUFBO0FBSEEsU0FBQTs7Ozs7OztBQVdBLGlCQUFBLGFBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxjQUFBLFNBQUEsS0FBQSxRQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLFFBQUEsRUFBQTtBQUNBLGVBQUEsSUFBQSxJQUFBLENBQUEsRUFBQSxJQUFBLE9BQUEsTUFBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLGtCQUFBLElBQUEsQ0FBQSxPQUFBLFVBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQTtBQUNBLGlCQUFBLElBQUEsSUFBQSxDQUFBLENBQUEsSUFBQSxVQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsV0FBQSxFQUFBLENBQUE7QUFDQTs7QUFFQSxZQUFBLFVBQUEsT0FBQSxTQUFBLENBQUEsV0FBQSxDQUFBO0FBQ0EsWUFBQSxXQUFBLGNBQUEsT0FBQSxDQUFBOztBQUVBLG9CQUFBLGNBQUEsR0FDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFDQSxjQUFBLFdBQUEsSUFBQSxHQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUE7O0FBRUEsZ0JBQUEsR0FBQSxDQUFBLElBQUEsR0FBQSxFQUFBLFFBQUEsRUFDQSxFQUFBLFNBQUE7QUFDQSw4QkFBQSxXQURBO0FBRUEsbUJBQUE7QUFGQSxhQUFBLEVBREEsRUFLQSxJQUxBLENBS0EsVUFBQSxHQUFBLEVBQUE7QUFDQSwyQkFBQSxLQUFBLEdBQUEsUUFBQTtBQUNBLHdCQUFBLFVBQUEsQ0FBQSxjQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsTUFBQSxFQUFBO0FBQ0EscUJBQUEsRUFBQSxDQUFBLE1BQUEsRUFBQSxFQUFBLFFBQUEsT0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsYUFIQTtBQUlBLFdBWEE7QUFZQSxTQWhCQTtBQWlCQSxPQWhEQTs7QUFtREEsVUFBQSxRQUFBLEVBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxDQUFBO0FBQ0EsVUFBQSxVQUFBLEVBQUEsUUFBQSxFQUFBLENBQUEsRUFBQSxVQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQSxVQUFBLEVBQUEsUUFBQSxDQUFBO0FBQ0EsVUFBQSxTQUFBO0FBQ0EsVUFBQSxZQUFBLEtBQUE7O0FBRUEsVUFBQSxhQUFBLElBQUEsS0FBQSxFQUFBOztBQUVBLGlCQUFBLEdBQUEsR0FBQSxnQkFBQTs7QUFFQSxpQkFBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLGdCQUFBLFNBQUEsQ0FBQSxVQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUE7QUFDQSxPQUZBOzs7QUFLQSxRQUFBLFdBQUEsRUFBQSxFQUFBLENBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxZQUFBOztBQUVBLFVBQUEsSUFBQSxFQUFBLFFBQUEsR0FBQSxXQUFBLENBQUEsVUFBQTs7QUFFQSxVQUFBLElBQUEsRUFBQSxRQUFBLENBQUEsVUFBQTs7QUFFQSxnQkFBQSxFQUFBLElBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLE9BUEE7OztBQVVBLFFBQUEsb0JBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTs7QUFFQTtBQUNBLFVBQUEsY0FBQSxFQUFBLE1BQUE7QUFDQSxPQUpBOzs7QUFPQSxlQUFBLFdBQUEsR0FBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxRQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsT0FBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLFVBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxFQUFBLFNBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsSUFBQSxHQUFBLENBQUEsR0FBQSxHQUFBOztBQUlBOztBQUVBLFFBQUEsbUJBQUEsRUFBQSxFQUFBLENBQUEsT0FBQSxFQUFBLFdBQUE7OztBQUdBLFFBQUEsY0FBQSxFQUFBLEtBQUEsQ0FBQSxZQUFBOztBQUVBLFlBQUEsWUFBQSxFQUFBLFdBQUEsQ0FBQTtBQUNBLGtCQUFBLEdBQUEsQ0FBQSxrQkFBQSxFQUFBLEVBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxrQkFBQSxDQUFBO0FBQ0EsVUFBQSxjQUFBLEVBQUEsTUFBQSxDQUFBLFNBQUE7QUFDQSxVQUFBLGNBQUEsRUFBQSxRQUFBLEdBQUEsV0FBQSxDQUFBLFVBQUE7QUFDQSxVQUFBLGNBQUEsRUFBQSxJQUFBLEdBQUEsUUFBQSxDQUFBLFVBQUE7QUFDQSxnQkFBQSxFQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQTs7QUFFQSxVQUFBLGNBQUEsRUFBQSxJQUFBO0FBQ0EsWUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLElBQUEsRUFBQSxRQUFBLEVBQUEsR0FBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLENBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLGtCQUFBLEVBQUEsU0FBQSxDQUFBLEdBQUEsSUFBQSxHQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLEdBQUE7QUFFQSxPQWZBOzs7QUFrQkEsY0FBQSxTQUFBLENBQUEsVUFBQSxDQUFBLEVBQUE7QUFDQSxvQkFBQSxDQUFBO0FBQ0Esb0JBQUEsSUFBQTtBQUNBLE9BSEEsRUFHQSxTQUhBLENBR0EsVUFBQSxDQUFBLEVBQUE7O0FBRUEsWUFBQSxTQUFBLEVBQUE7QUFDQSxrQkFBQSxTQUFBO0FBQ0Esa0JBQUEsTUFBQSxDQUFBLFVBQUEsT0FBQSxFQUFBLFVBQUEsT0FBQTtBQUNBLGtCQUFBLE1BQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQSxFQUFBLE9BQUE7QUFDQSxrQkFBQSxXQUFBLEdBQUEsS0FBQTtBQUNBLGtCQUFBLE1BQUE7QUFDQSxrQkFBQSxPQUFBLEdBQUEsT0FBQTtBQUNBLGtCQUFBLFNBQUEsR0FBQSxFQUFBOztBQUVBLHNCQUFBLENBQUE7QUFDQTtBQUNBLE9BaEJBLEVBZ0JBLE9BaEJBLENBZ0JBLFlBQUE7QUFDQSxvQkFBQSxLQUFBO0FBQ0EsT0FsQkEsRUFrQkEsVUFsQkEsQ0FrQkEsWUFBQTtBQUNBLGdCQUFBLE9BQUE7QUFDQSxPQXBCQTtBQXVCQTtBQXhLQSxHQUFBO0FBMEtBLENBM0tBOztBQ0FBLElBQUEsVUFBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUE7O0FBRUEsU0FBQSxZQUFBLEdBQUEsSUFBQTtBQUVBLENBSkE7O0FDQUEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxpQkFBQSxLQUFBLENBQUEsWUFBQSxFQUFBO0FBQ0EsU0FBQSxtQkFEQTtBQUVBLFdBQUE7QUFDQSxlQUFBO0FBREEsS0FGQTtBQUtBLGdCQUFBLGdCQUxBO0FBTUEsY0FBQTtBQU5BLEdBQUE7QUFTQSxDQVZBOztBQVlBLElBQUEsVUFBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBOztBQUVBLFFBQUEsSUFBQSxDQUFBLG1CQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxPQUFBLFFBQUEsR0FBQSxHQUFBO0FBQ0EsR0FIQTs7Ozs7O0FBU0EsQ0FYQTtBQ1pBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFNBQUEsU0FEQTtBQUVBLGdCQUFBLGtCQUZBO0FBR0EsaUJBQUE7QUFIQSxHQUFBO0FBS0EsQ0FOQTtBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsaUJBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFNBQUEsT0FEQTtBQUVBLGlCQUFBO0FBRkEsR0FBQTtBQUlBLENBTEE7O0FDQUEsQ0FBQSxZQUFBOztBQUVBOzs7O0FBR0EsTUFBQSxDQUFBLE9BQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsd0JBQUEsQ0FBQTs7QUFFQSxNQUFBLE1BQUEsUUFBQSxNQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsQ0FBQTs7QUFFQSxNQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUEsQ0FBQSxPQUFBLEVBQUEsRUFBQSxNQUFBLElBQUEsS0FBQSxDQUFBLHNCQUFBLENB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QUFBLHVCQUFBLE1BQUEsRUFBQTtBQUNBLGFBQUEsTUFBQSxHQUFBLENBQUEsc0JBQUEsTUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLElBQUEsRUFBQTtBQUNBLGVBQUEsS0FBQSxJQUFBO0FBQ0EsT0FIQSxDQUFBO0FBSUE7QUFoREEsR0FBQTtBQWtEQSxDQXBEQTtBQ0FBLElBQUEsVUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsU0FBQSxPQUFBLEdBQUEsV0FBQTtBQUNBLENBRkE7O0FBS0EsSUFBQSxVQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsU0FBQSxXQUFBLEdBQUEsV0FBQTtBQUVBLENBSkE7O0FDTEEsSUFBQSxTQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQTs7QUFFQSxTQUFBO0FBQ0EsY0FBQSxHQURBO0FBRUEsV0FBQSxFQUZBO0FBR0EsaUJBQUEsdUJBSEE7QUFJQSxVQUFBLGNBQUEsS0FBQSxFQUFBOztBQUVBLFlBQUEsTUFBQSxHQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsWUFBQSxPQUFBO0FBQ0Esb0JBQUEsS0FBQSxTQURBO0FBRUEsY0FBQSxLQUFBO0FBRkEsU0FBQTtBQUlBLGVBQUEsYUFBQSxVQUFBLENBQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxZQUFBO0FBQ0EsZUFBQSxRQUFBLEdBQUEsS0FBQSxTQUFBO0FBQ0EsZUFBQSxTQUFBLEdBQUEsSUFBQTtBQUNBLFNBSkEsRUFLQSxJQUxBLENBS0EsWUFBQTtBQUNBLGdCQUFBLFNBQUE7QUFDQSxTQVBBLENBQUE7QUFRQSxPQWJBOztBQWVBLFlBQUEsTUFBQSxHQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsWUFBQSxXQUFBLEVBQUEsTUFBQSxJQUFBLEVBQUE7QUFDQSxxQkFBQSxVQUFBLENBQUEsU0FBQSxJQUFBLENBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxZQUFBO0FBQUEsaUJBQUEsTUFBQSxTQUFBLEVBQUE7QUFBQSxTQURBLEVBRUEsSUFGQSxDQUVBLFVBQUEsUUFBQSxFQUFBO0FBQUEsZ0JBQUEsS0FBQSxHQUFBLFFBQUE7QUFBQSxTQUZBO0FBR0EsT0FMQTs7QUFPQSxZQUFBLGNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUFBLGVBQUEsRUFBQSxDQUFBLGdCQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUFBLE9BQUE7QUFDQSxZQUFBLFVBQUEsR0FBQSxZQUFBO0FBQUEsZUFBQSxFQUFBLENBQUEsVUFBQTtBQUFBLE9BQUE7O0FBRUEsWUFBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsYUFBQSxjQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFNBQUEsRUFBQTtBQUNBLGdCQUFBLEtBQUEsR0FBQSxTQUFBO0FBQ0EsaUJBQUEsU0FBQTtBQUNBLFNBSkEsQ0FBQTtBQUtBLE9BTkE7O0FBUUEsWUFBQSxTQUFBOztBQUVBLGFBQUEsYUFBQSxRQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE9BQUEsRUFBQTtBQUFBLGNBQUEsV0FBQSxHQUFBLE9BQUE7QUFBQSxPQURBLENBQUE7QUFFQTtBQTNDQSxHQUFBO0FBNkNBLENBL0NBOztBQWlEQSxJQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBOztBQUVBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxXQUFBLEVBRkE7QUFHQSxpQkFBQSx1QkFIQTtBQUlBLFVBQUEsY0FBQSxLQUFBLEVBQUE7O0FBRUEsWUFBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsYUFBQSxjQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFNBQUEsRUFBQTtBQUFBLGdCQUFBLFVBQUEsR0FBQSxTQUFBO0FBQUEsU0FEQSxDQUFBO0FBRUEsT0FIQTs7QUFLQSxZQUFBLFNBQUEsR0FDQSxJQURBLENBQ0EsWUFBQTtBQUFBLGdCQUFBLEdBQUEsQ0FBQSxNQUFBLFVBQUE7QUFBQSxPQURBOztBQUdBLGFBQUEsYUFBQSxRQUFBLENBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE9BQUEsRUFBQTtBQUFBLGNBQUEsV0FBQSxHQUFBLE9BQUE7QUFBQSxPQURBLENBQUE7QUFFQTtBQWhCQSxHQUFBO0FBbUJBLENBckJBOztBQ2hEQSxJQUFBLE9BQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxNQUFBLGFBQUEsRUFBQTtBQUNBLE1BQUEsWUFBQSxTQUFBLFNBQUEsQ0FBQSxHQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxJQUFBLEdBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUFBLGFBQUEsS0FBQSxNQUFBO0FBQUEsS0FBQSxFQUFBLE9BQUEsQ0FBQSxJQUFBLE1BQUEsTUFBQSxDQUFBLENBQUEsR0FBQSxLQUFBLEdBQUEsSUFBQTtBQUNBLEdBRkE7QUFHQSxTQUFBO0FBQ0EsZUFBQSxtQkFBQSxHQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQSxDQUFBLG9CQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQUEsZUFBQSxVQUFBLEdBQUEsRUFBQSxJQUFBLElBQUEsQ0FBQTtBQUFBLE9BREEsRUFFQSxJQUZBLENBRUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxZQUFBLE1BQUEsRUFBQTtBQUNBLGlCQUFBLGtCQUFBO0FBQ0EsU0FGQSxNQUVBO0FBQ0EsaUJBQUEsTUFBQSxJQUFBLENBQUEsYUFBQSxFQUFBLEdBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxHQUFBLEVBQUE7QUFBQSxtQkFBQSxJQUFBLElBQUE7QUFBQSxXQURBLENBQUE7QUFFQTtBQUNBLE9BVEEsQ0FBQTtBQVVBLEtBWkE7QUFhQSxjQUFBLGtCQUFBLElBQUEsRUFBQTs7QUFFQSxhQUFBLE1BQUEsR0FBQSxDQUFBLGdCQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxLQUFBLEVBQUE7QUFDQSxxQkFBQSxNQUFBLElBQUE7QUFDQSxlQUFBLGNBQUEsRUFB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QSxHQUFBLElBQUE7O0FBRUEsU0FBQSxrQkFBQSxHQUFBLFlBQUE7QUFDQSxXQUFBLE9BQUEsRUFBQSxDQUFBLFFBQUEsQ0FBQTtBQUNBLEdBRkE7O0FBSUEsU0FBQSxTQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUE7O0FBRUEsV0FBQSxLQUFBLEdBQUEsSUFBQTs7QUFFQSxnQkFBQSxLQUFBLENBQUEsU0FBQSxFQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsYUFBQSxFQUFBLENBQUEsTUFBQTtBQUNBLEtBRkEsRUFFQSxLQUZBLENBRUEsWUFBQTtBQUNBLGFBQUEsS0FBQSxHQUFBLDRCQUFBO0FBQ0EsS0FKQTtBQU1BLEdBVkE7QUFZQSxDQXJCQTtBQ1ZBLElBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLEVBQUEsbUJBQUEsRUFBQTs7QUFFQSxTQUFBLE1BQUEsR0FBQSxRQUFBLEVBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxRQUFBLFFBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxRQUFBLFFBQUE7QUFDQSxTQUFBLEdBQUEsR0FBQSxRQUFBLEdBQUE7QUFDQSxTQUFBLEtBQUEsR0FBQSxRQUFBLEtBQUE7QUFDQSxTQUFBLE9BQUEsR0FBQSxRQUFBLE9BQUE7QUFDQSxTQUFBLEtBQUEsR0FBQSxRQUFBLEtBQUE7QUFDQSxTQUFBLFlBQUEsR0FBQSxLQUFBOztBQUVBLFNBQUEsY0FBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsUUFBQSxDQUFBLE9BQUEsT0FBQSxLQUFBLGVBQUEsSUFBQSxPQUFBLE9BQUEsS0FBQSxRQUFBLEtBQUEsT0FBQSxLQUFBLEtBQUEsRUFBQSxFQUFBO0FBQ0EsYUFBQSxZQUFBLEdBQUEsSUFBQTtBQUNBLGFBQUEsT0FBQSxZQUFBLEdBQUEsaURBQUE7QUFDQTs7QUFFQSxRQUFBLFdBQUE7QUFDQSxnQkFBQSxPQUFBLFFBREE7QUFFQSxnQkFBQSxPQUFBLFFBRkE7QUFHQSxXQUFBLE9BQUEsR0FIQTtBQUlBLGFBQUEsT0FBQSxLQUpBO0FBS0EsZUFBQSxPQUFBLE9BTEE7QUFNQSxhQUFBLE9BQUE7QUFOQSxLQUFBOztBQVNBLFdBQUEsb0JBQUEsTUFBQSxDQUFBLE9BQUEsTUFBQSxFQUFBLFFBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxhQUFBLE9BQUEsRUFBQSxDQUFBLE1BQUEsRUFBQSxFQUFBLFFBQUEsT0FBQSxNQUFBLEVBQUEsQ0FBQTtBQUNBLEtBSEEsQ0FBQTtBQUlBLEdBbkJBO0FBcUJBLENBaENBO0FDQUEsSUFBQSxPQUFBLENBQUEscUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTs7OztBQUlBLFNBQUE7QUFDQSxZQUFBLGdCQUFBLEVBQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxhQUFBLE1BQUEsR0FBQSxDQUFBLGVBQUEsRUFBQSxFQUFBLFFBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxlQUFBLFNBQUEsSUFBQTtBQUNBLE9BSEEsQ0FBQTtBQUlBO0FBTkEsR0FBQTtBQVNBLENBYkE7O0FDQUEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsaUJBQUEsS0FBQSxDQUFBLFVBQUEsRUFBQTtBQUNBLFNBQUEsZUFEQTtBQUVBLGdCQUFBLGtCQUZBO0FBR0EsaUJBQUEseUNBSEE7QUFJQSxhQUFBO0FBQ0EsZUFBQSxpQkFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsZUFBQSxZQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQUEsQ0FBQTtBQUNBO0FBSEE7QUFKQSxHQUFBO0FBVUEsQ0FaQTtBQ0FBLElBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxlQUFBLEVBQUEsU0FBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsU0FBQSxnQkFBQSxHQUFBLEtBQUE7QUFDQSxTQUFBLElBQUEsR0FBQSxPQUFBO0FBQ0EsU0FBQSxPQUFBLEdBQUEsVUFBQTtBQUNBLFNBQUEsSUFBQSxHQUFBLG1CQUFBLEVBQUEsTUFBQSxLQUFBLEVBQUEsU0FBQSxLQUFBLEVBQUE7QUFDQSxTQUFBLHVCQUFBLEdBQUEsS0FBQTs7QUFFQSxXQUFBLFVBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxRQUFBLFFBQUEsQ0FBQTtRQUNBLFdBQUEsQ0FEQTtBQUVBLFVBQUEsT0FBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsVUFBQSxLQUFBLElBQUEsRUFBQTtBQUNBLFVBQUEsS0FBQSxPQUFBLEVBQUE7QUFDQSxLQUhBO0FBSUEsV0FBQSxFQUFBLE9BQUEsS0FBQSxFQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0E7O0FBRUEsU0FBQSxLQUFBLEdBQUEsV0FBQSxTQUFBLENBQUE7O0FBR0EsU0FBQSxXQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLFlBQUEsWUFBQSxDQUFBLE1BQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxLQUFBLEVBQUE7QUFDQSxhQUFBLEtBQUEsR0FBQSxXQUFBLEtBQUEsQ0FBQTtBQUNBLEtBSEEsQ0FBQTtBQUlBLEdBTEE7O0FBT0EsU0FBQSxVQUFBLEdBQUEsVUFBQSxPQUFBLEVBQUE7QUFDQSxRQUFBLFVBQUEsUUFBQSxTQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLFFBQUEsVUFBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLFFBQUEsV0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLFFBQUEsU0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLFFBQUEsV0FBQTtBQUNBLFlBQUEsU0FEQTtBQUVBLFlBQUEsVUFGQTtBQUdBLFlBQUEsT0FIQTtBQUlBLFlBQUEsT0FKQTtBQUtBLFlBQUEsS0FMQTtBQU1BLFlBQUEsTUFOQTtBQU9BLFlBQUEsTUFQQTtBQVFBLFlBQUEsUUFSQTtBQVNBLFlBQUEsV0FUQTtBQVVBLFlBQUEsU0FWQTtBQVdBLFlBQUEsVUFYQTtBQVlBLFlBQUE7QUFaQSxLQUFBO0FBY0EsV0FBQSxTQUFBLEdBQUEsR0FBQSxTQUFBLFFBQUEsQ0FBQSxHQUFBLEdBQUEsR0FBQSxPQUFBO0FBQ0EsR0FwQkE7O0FBc0JBLFNBQUEsS0FBQSxHQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxPQUFBLEdBQUEsT0FBQTtBQUNBLFdBQUEsUUFBQSxHQUFBLENBQUEsT0FBQSxRQUFBO0FBQ0EsZUFBQSxZQUFBO0FBQ0EsYUFBQSxRQUFBLEdBQUEsQ0FBQSxPQUFBLFFBQUE7QUFDQSxhQUFBLE9BQUE7QUFDQSxLQUhBLEVBR0EsSUFIQTs7QUFLQSxHQVJBOztBQVVBLFNBQUEsWUFBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsTUFBQSxFQUFBLEVBQUEsUUFBQSxNQUFBLEVBQUE7QUFDQSxHQUZBOztBQUlBLFNBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxRQUFBLE9BQUEsRUFBQTtBQUNBLFNBQUEsTUFBQSxHQUFBLE9BQUEsSUFBQSxDQUFBLEVBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxDQUFBLE9BQUEsUUFBQTtBQUNBLFNBQUEsYUFBQSxHQUFBLENBQUEsT0FBQSxJQUFBLENBQUEsS0FBQTtBQUNBLFFBQUEsS0FBQSxRQUFBLEdBQUEsQ0FBQSxFQUFBO0FBQ0EsbUJBQUEsU0FBQSxDQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsUUFBQSx5Q0FBQSxRQUFBLE9BQUEsUUFBQSxFQUFBLE9BQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxLQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUE7QUFDQSxPQUpBO0FBS0EsS0FOQSxNQU9BLE9BQUEsS0FBQSxDQUFBLG9DQUFBO0FBQ0EsR0FiQTs7QUFlQSxTQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxPQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsYUFBQSxNQUFBLEdBQUE7QUFDQSxLQUZBLEVBRUEsSUFGQSxDQUVBLElBRkEsQ0FBQTtBQUdBLEdBSkE7O0FBTUEsU0FBQSxXQUFBOztBQUVBLFNBQUEsaUJBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxZQUFBLGVBQUEsR0FDQSxJQURBLENBQ0EsVUFBQSxJQUFBLEVBQUE7QUFDQSxVQUFBLENBQUEsSUFBQSxFQUFBO0FBQ0EsZUFBQSxjQUFBLEdBQUEsTUFBQTtBQUNBLE9BRkEsTUFFQTtBQUNBLGVBQUEsY0FBQSxHQUFBLEtBQUEsRUFBQTtBQUNBO0FBQ0EsS0FQQSxDQUFBO0FBUUEsR0FUQTs7QUFXQSxTQUFBLGlCQUFBOztBQUVBLFNBQUEsb0JBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxPQUFBLGdCQUFBO0FBQ0EsR0FGQTs7QUFJQSxTQUFBLG9CQUFBOztBQUVBLFNBQUEsU0FBQSxHQUFBLFlBQUE7OztBQUdBLFFBQUEsdUJBQUEsT0FBQSxPQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsYUFBQSxPQUFBLE1BQUE7QUFDQSxLQUZBLENBQUE7O0FBSUEsUUFBQSxPQUFBLGNBQUEsS0FBQSxNQUFBLEVBQUE7QUFDQSxhQUFBLGtCQUFBLEdBQUEseUNBQUE7QUFDQSxhQUFBLGdCQUFBLEdBQUEsSUFBQTtBQUNBLEtBSEEsTUFHQSxJQUFBLHFCQUFBLE9BQUEsQ0FBQSxPQUFBLGNBQUEsTUFBQSxDQUFBLENBQUEsSUFBQSxPQUFBLG9CQUFBLEVBQUEsRUFBQTtBQUNBLGFBQUEsa0JBQUEsR0FBQSwrREFBQTtBQUNBLGFBQUEsZ0JBQUEsR0FBQSxJQUFBOztBQUVBLEtBSkEsTUFJQSxJQUFBLE9BQUEsY0FBQSxLQUFBLE9BQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxFQUFBLEVBQUE7QUFDQSxlQUFBLGtCQUFBLEdBQUEsaUNBQUE7QUFDQSxlQUFBLGdCQUFBLEdBQUEsSUFBQTtBQUNBLE9BSEEsTUFHQTs7QUFFQSxZQUFBLFlBQUE7QUFDQSxnQkFBQSxPQUFBLFVBREE7QUFFQSxrQkFBQSxPQUFBLElBQUEsQ0FBQTtBQUZBLFNBQUE7QUFJQSxlQUFBLGNBQUEsVUFBQSxDQUFBLFNBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxTQUFBLEVBQUE7QUFDQSxjQUFBLFNBQUEsRUFBQTtBQUNBLGlCQUFBLElBQUEsR0FBQSxFQUFBOztBQUVBLGlCQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxJQUFBLENBQUEsVUFBQTtBQUNBLGlCQUFBLElBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxJQUFBLENBQUEsU0FBQTtBQUNBLGlCQUFBLElBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxJQUFBLENBQUEsV0FBQTtBQUNBLGlCQUFBLElBQUEsQ0FBQSxRQUFBLEdBQUEsVUFBQSxJQUFBLENBQUEsUUFBQTtBQUNBLGlCQUFBLElBQUEsR0FBQSxVQUFBLE1BQUEsQ0FBQSxJQUFBOztBQUVBLGlCQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUEsTUFBQTtBQUNBLGlCQUFBLFVBQUEsR0FBQSxJQUFBO0FBQ0EsaUJBQUEsZ0JBQUEsR0FBQSxJQUFBO0FBQ0EsU0FkQSxDQUFBO0FBZUE7QUFDQSxHQXZDQTs7QUF5Q0EsU0FBQSxPQUFBLEdBQUEsWUFBQSxPQUFBO0FBQ0EsU0FBQSxVQUFBLEdBQUEsWUFBQSxVQUFBO0FBQ0EsU0FBQSxVQUFBLEdBQUEsWUFBQSxVQUFBO0FBQ0EsU0FBQSxhQUFBLEdBQUEsWUFBQSxhQUFBOztBQUVBLFNBQUEsSUFBQSxHQUFBLFVBQUEsTUFBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxRQUFBLENBQUEsT0FBQSxVQUFBLEVBQUEsT0FBQSxLQUFBLENBQUEsK0JBQUE7O0FBRUEsUUFBQSxDQUFBLE9BQUEsSUFBQSxDQUFBLElBQUEsSUFBQSxDQUFBLE9BQUEsSUFBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLFdBQUEsTUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLElBQUEsRUFBQTtBQUNBLGVBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxlQUFBLEtBQUEsR0FBQSxPQUFBLFdB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QSxDQUFBLENBQUE7QUFDQSxRQUFBLFNBQUEsUUFBQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxXQUFBO0FBQ0EsWUFBQSxTQURBO0FBRUEsWUFBQSxVQUZBO0FBR0EsWUFBQSxPQUhBO0FBSUEsWUFBQSxPQUpBO0FBS0EsWUFBQSxLQUxBO0FBTUEsWUFBQSxNQU5BO0FBT0EsWUFBQSxNQVBBO0FBUUEsWUFBQSxRQVJBO0FBU0EsWUFBQSxXQVRBO0FBVUEsWUFBQSxTQVZBO0FBV0EsWUFBQSxVQVhBO0FBWUEsWUFBQTtBQVpBLEtBQUE7QUFjQSxXQUFBLFNBQUEsR0FBQSxHQUFBLFNBQUEsUUFBQSxDQUFBLEdBQUEsR0FBQSxHQUFBLE9BQUE7QUFDQSxHQXJCQTs7QUF1QkEsU0FBQSxjQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxVQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsRUFBQTtBQUNBLEdBRkE7O0FBSUEsU0FBQSxVQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxnQkFBQSxFQUFBLEVBQUEsSUFBQSxFQUFBLEVBQUE7QUFDQSxHQUZBOztBQUlBLGNBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLFdBQUEsS0FBQSxFQUFBLElBQUEsT0FBQSxJQUFBLENBQUEsRUFBQSxJQUFBLEtBQUEsT0FBQSxHQUFBLElBQUEsR0FBQSxLQUFBO0FBQ0EsR0FGQSxFQUdBLElBSEEsQ0FHQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsVUFBQSxHQUFBLE1BQUE7QUFDQSxHQUxBOztBQU9BLGNBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLFdBQUEsS0FBQSxPQUFBLEdBQUEsSUFBQSxHQUFBLEtBQUE7QUFDQSxHQUZBLEVBR0EsSUFIQSxDQUdBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxPQUFBLEdBQUEsTUFBQTtBQUNBLEdBTEE7O0FBT0EsTUFBQSxPQUFBLElBQUEsQ0FBQSxPQUFBLEVBQUEsT0FBQSxXQUFBLEdBQUEsZ0JBQUE7QUFDQSxNQUFBLENBQUEsT0FBQSxJQUFBLENBQUEsT0FBQSxFQUFBLE9BQUEsV0FBQSxHQUFBLFlBQUE7O0FBRUEsU0FBQSxNQUFBLEdBQUEsWUFBQSxNQUFBOztBQUVBLFNBQUEsU0FBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsV0FBQSxZQUFBLFNBQUEsQ0FBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsVUFBQSxPQUFBLElBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxlQUFBLElBQUEsQ0FBQSxPQUFBLEdBQUEsS0FBQTtBQUNBLGVBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxPQUhBLE1BSUEsSUFBQSxDQUFBLE9BQUEsSUFBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLGVBQUEsSUFBQSxDQUFBLE9BQUEsR0FBQSxJQUFBO0FBQ0EsZUFBQSxXQUFBLEdBQUEsZ0JBQUE7QUFDQTtBQUNBLEtBVkEsQ0FBQTtBQVdBLEdBWkE7QUFhQSxDQXBFQTs7QUNBQSxJQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsTUFBQSxjQUFBLEVBQUE7O0FBRUEsY0FBQSxTQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxXQUFBLE1BQUEsR0FBQSxDQUFBLGVBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGFBQUEsU0FBQSxJQUFBO0FBQ0EsS0FIQSxDQUFBO0FBSUEsR0FMQTs7QUFPQSxjQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxNQUFBLEdBQUEsQ0FBQSxlQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxTQUFBLElBQUE7QUFDQSxLQUhBLENBQUE7QUFJQSxHQUxBOztBQU9BLGNBQUEsTUFBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsV0FBQSxNQUFBLElBQUEsQ0FBQSxzQkFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNB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QUFBLFVBQUEsU0FBQSxPQUFBLEdBQUE7QUFDQSxlQUFBLFlBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsU0FGQSxDQUFBO0FBR0EsT0FKQTs7QUFNQTs7QUFFQSxVQUFBLGFBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxjQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsT0FGQTs7QUFJQSxpQkFBQSxHQUFBLENBQUEsWUFBQSxZQUFBLEVBQUEsT0FBQTtBQUNBLGlCQUFBLEdBQUEsQ0FBQSxZQUFBLGFBQUEsRUFBQSxVQUFBO0FBQ0EsaUJBQUEsR0FBQSxDQUFBLFlBQUEsY0FBQSxFQUFBLFVBQUE7QUFFQTs7QUFoREEsR0FBQTtBQW9EQSxDQXREQTs7QUNBQSxJQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxpQkFBQTtBQUZBLEdBQUE7QUFJQSxDQUxBO0FDQUEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsZUFBQSxFQUFBOztBQUVBLFNBQUE7QUFDQSxjQUFBLEdBREE7QUFFQSxpQkFBQSx5REFGQTtBQUdBLFVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsR0FBQSxnQkFBQSxpQkFBQSxFQUFBO0FBQ0E7QUFMQSxHQUFBO0FBUUEsQ0FWQTtBQ0FBOztBQUVBLElBQUEsU0FBQSxDQUFBLGFBQUEsRUFBQSxZQUFBO0FBQ0EsU0FBQTtBQUNBLFdBQUE7QUFDQSxvQkFBQTtBQURBLEtBREE7QUFJQSxjQUFBLEdBSkE7QUFLQSxpQkFBQTtBQUxBLEdBQUE7QUFPQSxDQVJBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ3NvY2ttYXJrZXQnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ3N0cmlwZSddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xuICAgIFN0cmlwZS5zZXRQdWJsaXNoYWJsZUtleSgncGtfdGVzdF9SZDduTXBTWk1xUk51QjR6akVlWkh0MWQnKTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWJvdXQnLCB7XG4gICAgICAgIHVybDogJy9hYm91dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBYm91dENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Fib3V0L2Fib3V0Lmh0bWwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignQWJvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgRnVsbHN0YWNrUGljcykge1xuXG4gICAgLy8gSW1hZ2VzIG9mIGJlYXV0aWZ1bCBGdWxsc3RhY2sgcGVvcGxlLlxuICAgICRzY29wZS5pbWFnZXMgPSBfLnNodWZmbGUoRnVsbHN0YWNrUGljcyk7XG5cbn0pO1xuXG4iLCJhcHAuY29udHJvbGxlcignQWRtaW5DdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUpIHtcblxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbicsIHtcbiAgICB1cmw6ICcvYWRtaW4nLFxuICAgIHRlbXBsYXRlVXJsOiAnanMvYWRtaW4vYWRtaW4uaHRtbCcsXG4gICAgY29udHJvbGxlcjogJ0FkbWluQ3RybCcsXG4gIH0pXG4gIC5zdGF0ZSgnYWRtaW4uc29ja3MnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICdqcy9hZG1pbi92aWV3cy9hZG1pbi5zb2Nrcy5odG1sJyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBzb2NrczogZnVuY3Rpb24oU29ja0ZhY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIFNvY2tGYWN0b3J5LmFsbFNvY2tzKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsIHNvY2tzLCBTb2NrRmFjdG9yeSwgUmV2aWV3RmFjdG9yeSkge1xuICAgICAgJHNjb3BlLnNvY2tzID0gc29ja3M7XG4gICAgICBjb25zb2xlLmxvZyhzb2Nrcyk7XG4gICAgICAkc2NvcGUuZGVsZXRlU29jayA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZGVsZXRlU29ja1wiKVxuICAgICAgICByZXR1cm4gU29ja0ZhY3RvcnkuZGVsZXRlKGlkKVxuICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAkc2NvcGUuc29ja3MgPSAkc2NvcGUuc29ja3MuZmlsdGVyKGZ1bmN0aW9uKHNvY2spIHsgaWYgKHNvY2suaWQgIT09IGlkKSByZXR1cm4gc29ja30pO1xuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICAkc2NvcGUuZGVsZXRlUmV2aWV3ID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkuZGVsZXRlKGlkKVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXZpZXcpIHtcbiAgICAgICAgICAkc2NvcGUuc29ja3MgPSAkc2NvcGUuc29ja3MubWFwKGZ1bmN0aW9uKHNvY2spIHtcbiAgICAgICAgICAgIGlmIChzb2NrLmlkICE9PSByZXZpZXcuc29ja0lkKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzb2NrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc29jay5yZXZpZXdzID0gc29jay5yZXZpZXdzLmZpbHRlcihmdW5jdGlvbihyZXZpZXdPblNvY2spIHsgcmV0dXJuIHJldmlld09uU29jay5pZCAhPT0gaWQgfSlcbiAgICAgICAgICAgICAgcmV0dXJuIHNvY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgIH1cbiAgfSlcbiAgLnN0YXRlKCdhZG1pbi51c2VycycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJ2pzL2FkbWluL3ZpZXdzL2FkbWluLnVzZXJzLmh0bWwnLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIHVzZXJzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICByZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hBbGwoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pXG59KVxuXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21lbWJlcnNPbmx5Jywge1xuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXG4gICAgfTtcblxufSk7XG5cbi8vIGFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4vL1xuLy8gICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbicsIHtcbi8vICAgICAgICAgdXJsOiAnL2FkbWluJyxcbi8vICAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4vLyAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4vLyAgICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4vLyAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4vLyAgICAgICAgICAgICB9KTtcbi8vICAgICAgICAgfSxcbi8vICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4vLyAgICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbi8vICAgICAgICAgZGF0YToge1xuLy8gICAgICAgICAgICAgYXV0aGVudGljYXRlOiBmYWxzZVxuLy8gICAgICAgICB9XG4vLyAgICAgfSk7XG4vL1xuLy8gfSk7IiwiYXBwLmNvbnRyb2xsZXIoJ2NoZWNrb3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIE9yZGVyRmFjdG9yeSwgY3VycmVudENhcnQsIENoZWNrb3V0RmFjdG9yeSwgJHN0YXRlKSB7XG4gICRzY29wZS5jdXJyZW50Q2FydCA9IGN1cnJlbnRDYXJ0XG5cbiAgJHNjb3BlLmNhbGNUb3RhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBPcmRlckZhY3RvcnkuY2FsY3VsYXRlVG90YWwoJ2N1cnJlbnQnKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnRUb3RhbCkgeyAkc2NvcGUudG90YWwgPSBjYXJ0VG90YWwgfSlcbiAgfVxuICAkc2NvcGUuY2FsY1RvdGFsKClcblxuICAkc2NvcGUuY2hhcmdlID0gZnVuY3Rpb24oc3RhdHVzLCByZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgIENoZWNrb3V0RmFjdG9yeS5jaGFyZ2VDYXJkKHtcbiAgICAgIHRva2VuOiByZXNwb25zZS5pZCxcbiAgICAgIGFtb3VudDogcGFyc2VJbnQoJHNjb3BlLnRvdGFsKjEwMClcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5lbnN1cmVDYXJ0KClcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgJHN0YXRlLmdvKCdjYXJ0SGlzdG9yeScpXG4gICAgfSlcbiAgfVxuXG59KVxuIiwiYXBwLmZhY3RvcnkoJ0NoZWNrb3V0RmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBjaGFyZ2VDYXJkOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvY2hlY2tvdXQnLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICByZXR1cm4gb3JkZXIuZGF0YVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hlY2tvdXQnLCB7XG4gICAgdXJsOiAnL2NhcnQvY2hlY2tvdXQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL2NoZWNrb3V0L2NoZWNrb3V0Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdjaGVja291dENvbnRyb2xsZXInLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGN1cnJlbnRDYXJ0OiBmdW5jdGlvbiAoT3JkZXJGYWN0b3J5KSB7XG5cdFx0XHRcdHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2N1cnJlbnQnKVxuXHRcdFx0fVxuXHRcdH1cbiAgfSlcbn0pXG4iLCJhcHAuZGlyZWN0aXZlKCdkZXNpZ25WaWV3JywgZnVuY3Rpb24gKFNvY2tGYWN0b3J5LCAkc3RhdGUsICRodHRwKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2Rlc2lnbi9kZXNpZ24tdmlldy5odG1sJyxcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBkZXNpZ25WaWV3Q3RybCkge1xuXG5cdFx0XHR2YXIgdGl0bGUgPSBzY29wZS50aXRsZTtcblx0XHRcdHZhciBkZXNjcmlwdGlvbiA9IHNjb3BlLmRlc2NyaXB0aW9uO1xuXHRcdFx0dmFyIHRhZ3MgPSBzY29wZS50YWdzO1xuXHRcdFx0dmFyIGNhbnZhcyA9IGVsZW1lbnQuZmluZCgnY2FudmFzJylbMF07XG5cdFx0XHR2YXIgZGlzcGxheUVycm9yID0gZmFsc2U7XG5cblx0XHRcdHNjb3BlLnByZXZlbnRTdWJtaXNzaW9uID0gZnVuY3Rpb24gKCl7XG5cdFx0XHRcdHJldHVybiBkaXNwbGF5RXJyb3I7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBpbnZhbGlkU3VibWlzc2lvbiA9IGZ1bmN0aW9uKHRpdGxlLCBkZXNjcmlwdGlvbiwgdGFncykge1xuXHRcdFx0XHRpZiAodGl0bGUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGRpc3BsYXlFcnJvciA9IHRydWU7XG5cdFx0XHRcdFx0c2NvcGUuZXJyb3JNZXNzYWdlID0gXCJZb3VyIHNvY2tzIG5lZWQgYSB0aXRsZSFcIjtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIGlmIChkZXNjcmlwdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0ZGlzcGxheUVycm9yID0gdHJ1ZTtcblx0XHRcdFx0XHRzY29wZS5lcnJvck1lc3NhZ2UgPSBcIllvdXIgc29ja3MgbmVlZCBhIGRlc2NyaXB0aW9uIVwiO1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHRhZ3MgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGRpc3BsYXlFcnJvciA9IHRydWU7XG5cdFx0XHRcdFx0c2NvcGUuZXJyb3JNZXNzYWdlID0gXCJZb3VyIHNvY2tzIG5lZWQgc29tZSB0YWdzIVwiO1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHNjb3BlLnNhdmVEZXNpZ24gPSBmdW5jdGlvbiAodGl0bGUsIGRlc2NyaXB0aW9uLCB0YWdzKSB7XG5cblx0XHRcdFx0aWYgKGludmFsaWRTdWJtaXNzaW9uKHRpdGxlLCBkZXNjcmlwdGlvbiwgdGFncykpIHtcblx0XHRcdFx0XHRyZXR1cm4gaW52YWxpZFN1Ym1pc3Npb24odGl0bGUsIGRlc2NyaXB0aW9uLCB0YWdzKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciB0YWdzQXJyID0gU29ja0ZhY3RvcnkucHJlcGFyZVRhZ3ModGFncyk7XG5cbiAgICAgICAgdmFyIG5ld1NvY2tEYXRhT2JqID0ge1xuICAgICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24sXG4gICAgICAgICAgdGFnczogdGFnc0FyclxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybiBTb2NrRmFjdG9yeS5zYXZlRGVzaWduKG5ld1NvY2tEYXRhT2JqKVxuICAgICAgICAvLyAudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgLy8gXHQkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiByZXN1bHQuZGF0YS51c2VySWR9KVxuICAgICAgICAvLyB9KVxuXG4gICAgICAgIGZ1bmN0aW9uIGRhdGFVUkl0b0Jsb2IoZGF0YVVSSSkge1xuICAgICAgICAgIHZhciBiaW5hcnkgPSBhdG9iKGRhdGFVUkkuc3BsaXQoJywnKVsxXSk7XG4gICAgICAgICAgdmFyIGFycmF5ID0gW107XG4gICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGJpbmFyeS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJyYXkucHVzaChiaW5hcnkuY2hhckNvZGVBdChpKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXcgQmxvYihbbmV3IFVpbnQ4QXJyYXkoYXJyYXkpXSwge3R5cGU6ICdpbWFnZS9wbmcnfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGF0YVVybCA9IGNhbnZhcy50b0RhdGFVUkwoXCJpbWFnZS9wbmdcIik7XG4gICAgICAgIHZhciBibG9iRGF0YSA9IGRhdGFVUkl0b0Jsb2IoZGF0YVVybCk7XG5cbiAgICAgICAgU29ja0ZhY3RvcnkuZ2V0VW5zaWduZWRVUkwoKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgICAgICB2YXIgaW1hZ2VVcmwgPSByZXMudXJsLnNwbGl0KCc/JylbMF07XG5cbiAgICAgICAgICAgICRodHRwLnB1dChyZXMudXJsLCBibG9iRGF0YSxcbiAgICAgICAgICAgICAge2hlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgICAgIEtleSA6ICdhbmlfYmVuLnBuZydcbiAgICAgICAgICAgIH19KVxuICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpe1xuICAgICAgICAgICAgICAgIG5ld1NvY2tEYXRhT2JqLmltYWdlID0gaW1hZ2VVcmw7XG4gICAgICAgICAgICAgICAgU29ja0ZhY3Rvcnkuc2F2ZURlc2lnbihuZXdTb2NrRGF0YU9iailcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiByZXN1bHQuZGF0YS51c2VySWR9KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcblx0XHRcdCB9O1xuXG5cblx0XHRcdHZhciBjb2xvciA9ICQoXCIuc2VsZWN0ZWRcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiKTtcblx0XHRcdHZhciBjb250ZXh0ID0gJChcImNhbnZhc1wiKVswXS5nZXRDb250ZXh0KFwiMmRcIik7XG5cdFx0XHR2YXIgJGNhbnZhcyA9ICQoXCJjYW52YXNcIik7XG5cdFx0XHR2YXIgbGFzdEV2ZW50O1xuXHRcdFx0dmFyIG1vdXNlRG93biA9IGZhbHNlO1xuXG5cdFx0XHR2YXIgYmFja2dyb3VuZCA9IG5ldyBJbWFnZSgpO1xuXG5cdFx0XHRiYWNrZ3JvdW5kLnNyYyA9ICcvc29jay1iZy8xLnBuZyc7XG5cblx0XHRcdGJhY2tncm91bmQub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQgIGNvbnRleHQuZHJhd0ltYWdlKGJhY2tncm91bmQsIDAsIDApO1xuXHRcdFx0fTtcblxuXHRcdFx0Ly9XaGVuIGNsaWNraW5nIG9uIGNvbnRyb2wgbGlzdCBpdGVtc1xuXHRcdFx0ICAkKFwiLmNvbnRyb2xzXCIpLm9uKFwiY2xpY2tcIiwgXCJsaVwiICwgZnVuY3Rpb24oKXtcblx0XHRcdCAgICAgLy9EZXNsZWN0IHNpYmxpbmcgZWxlbWVudHNcblx0XHRcdCAgICAgJCh0aGlzKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vU2VsZWN0IGNsaWNrZWQgZWxlbWVudFxuXHRcdFx0ICAgICAkKHRoaXMpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICAgIC8vc3RvcmUgdGhlIGNvbG9yXG5cdFx0XHQgICAgIGNvbG9yID0gJCh0aGlzKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICB9KTtcblxuXHRcdFx0Ly9XaGVuIFwiQWRkIENvbG9yXCIgYnV0dG9uIGlzIHByZXNzZWRcblx0XHRcdCAgJChcIiNyZXZlYWxDb2xvclNlbGVjdFwiKS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCAgLy9TaG93IGNvbG9yIHNlbGVjdCBvciBoaWRlIHRoZSBjb2xvciBzZWxlY3Rcblx0XHRcdCAgICBjaGFuZ2VDb2xvcigpO1xuXHRcdFx0ICBcdCQoXCIjY29sb3JTZWxlY3RcIikudG9nZ2xlKCk7XG5cdFx0XHQgIH0pO1xuXG5cdFx0XHQvL1VwZGF0ZSB0aGUgbmV3IGNvbG9yIHNwYW5cblx0XHRcdGZ1bmN0aW9uIGNoYW5nZUNvbG9yKCl7XG5cdFx0XHRcdHZhciByID0gJChcIiNyZWRcIikudmFsKCk7XG5cdFx0XHRcdHZhciBnID0gJChcIiNncmVlblwiKS52YWwoKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKCk7XG5cdFx0XHRcdCQoXCIjbmV3Q29sb3JcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYihcIiArIHIgKyBcIiwgXCIgKyBnICsgXCIsIFwiICsgYiArIFwiKVwiKTtcblx0XHRcdCAgLy9XaGVuIGNvbG9yIHNsaWRlcnMgY2hhbmdlXG5cblxuXHRcdFx0fVxuXG5cdFx0XHQkKFwiaW5wdXRbdHlwZT1yYW5nZV1cIikub24oXCJpbnB1dFwiLCBjaGFuZ2VDb2xvcik7XG5cblx0XHRcdC8vd2hlbiBcIkFkZCBDb2xvclwiIGlzIHByZXNzZWRcblx0XHRcdCQoXCIjYWRkTmV3Q29sb3JcIikuY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdCAgLy9hcHBlbmQgdGhlIGNvbG9yIHRvIHRoZSBjb250cm9scyB1bFxuXHRcdFx0ICB2YXIgJG5ld0NvbG9yID0gJChcIjxsaT48L2xpPlwiKTtcblx0XHRcdCAgJG5ld0NvbG9yLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpKTtcblx0XHRcdCAgJChcIi5jb250cm9scyB1bFwiKS5hcHBlbmQoJG5ld0NvbG9yKTtcblx0XHRcdCAgJChcIi5jb250cm9scyBsaVwiKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgICQoXCIuY29udHJvbHMgbGlcIikubGFzdCgpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG5cdFx0XHQgIGNvbG9yID0gJChcIiNuZXdDb2xvclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIpO1xuXHRcdFx0ICAvL3doZW4gYWRkZWQsIHJlc3RvcmUgc2xpZGVycyBhbmQgcHJldmlldyBjb2xvciB0byBkZWZhdWx0XG5cdFx0XHQgICQoXCIjY29sb3JTZWxlY3RcIikuaGlkZSgpO1xuXHRcdFx0XHR2YXIgciA9ICQoXCIjcmVkXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGcgPSAkKFwiI2dyZWVuXCIpLnZhbCgwKTtcblx0XHRcdFx0dmFyIGIgPSAkKFwiI2JsdWVcIikudmFsKDApO1xuXHRcdFx0XHQkKFwiI25ld0NvbG9yXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2IoXCIgKyByICsgXCIsIFwiICsgZyArIFwiLCBcIiArIGIgKyBcIilcIik7XG5cblx0XHRcdH0pXG5cblx0XHRcdC8vT24gbW91c2UgZXZlbnRzIG9uIHRoZSBjYW52YXNcblx0XHRcdCRjYW52YXMubW91c2Vkb3duKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICBsYXN0RXZlbnQgPSBlO1xuXHRcdFx0ICBtb3VzZURvd24gPSB0cnVlO1xuXHRcdFx0fSkubW91c2Vtb3ZlKGZ1bmN0aW9uKGUpe1xuXHRcdFx0ICAvL2RyYXcgbGluZXNcblx0XHRcdCAgaWYgKG1vdXNlRG93bil7XG5cdFx0XHQgICAgY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdCAgICBjb250ZXh0Lm1vdmVUbyhsYXN0RXZlbnQub2Zmc2V0WCxsYXN0RXZlbnQub2Zmc2V0WSk7XG5cdFx0XHQgICAgY29udGV4dC5saW5lVG8oZS5vZmZzZXRYLCBlLm9mZnNldFkpO1xuXHRcdFx0ICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBjb2xvcjtcblx0XHRcdCAgICBjb250ZXh0LnN0cm9rZSgpO1xuXHRcdFx0ICAgIGNvbnRleHQubGluZUNhcCA9ICdyb3VuZCc7XG5cdFx0XHQgICAgY29udGV4dC5saW5lV2lkdGggPSAyMDtcblxuXHRcdFx0ICAgIGxhc3RFdmVudCA9IGU7XG5cdFx0XHQgIH1cblx0XHRcdH0pLm1vdXNldXAoZnVuY3Rpb24oKXtcblx0XHRcdCAgICBtb3VzZURvd24gPSBmYWxzZTtcblx0XHRcdH0pLm1vdXNlbGVhdmUoZnVuY3Rpb24oKXtcblx0XHRcdCAgICAkY2FudmFzLm1vdXNldXAoKTtcblx0XHRcdH0pO1xuXG5cblx0XHR9XG5cdH1cbn0pXG4iLCJhcHAuY29udHJvbGxlcignRGVzaWduVmlld0N0cmwnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cbiAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiaGlcIjtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkZXNpZ25WaWV3Jywge1xuICAgICAgdXJsOicvc29ja3MvZGVzaWduLzppZCcsXG4gICAgICBzY29wZToge1xuICAgICAgICB0aGVTb2NrOiAnPSdcbiAgICAgIH0sXG4gICAgICBjb250cm9sbGVyOiAnZGVzaWduVmlld0N0cmwnLFxuICAgICAgdGVtcGxhdGU6ICc8ZGVzaWduLXZpZXc+PC9kZXNpZ24tdmlldz4nLFxuICAgIH0pXG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignZGVzaWduVmlld0N0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCkge1xuXG4gICRodHRwLnBvc3QoJy9hcGkvdXNlci9tYXRjaElkJylcbiAgICAudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICByZXR1cm4gJHNjb3BlLnNob3dWaWV3ID0gcmVzXG4gICAgfSlcblxuXHQvLyAvLyAkc2NvcGUuZGVzY3JpcHRpb247XG5cdC8vICRzY29wZS50YWdzO1xuXHQvLyAkc2NvcGUudGl0bGU7XG5cdC8vIGNvbnNvbGUubG9nKCRzY29wZS5kZXNjcmlwdGlvbik7XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rlc2lnbicsIHtcbiAgICAgIHVybDonL2Rlc2lnbicsXG4gICAgICBjb250cm9sbGVyOiAnRGVzaWduQ29udHJvbGxlcicsXG4gICAgICB0ZW1wbGF0ZVVybDogJzxkZXNpZ24tc29jaz48L2Rlc2lnbi1zb2NrPidcbiAgICB9KVxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZG9jcycsIHtcbiAgICAgICAgdXJsOiAnL2RvY3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2RvY3MvZG9jcy5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ2hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdG1vc3RSZWNlbnRTb2NrczogZnVuY3Rpb24gKFNvY2tGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU29ja0ZhY3RvcnkubW9zdFJlY2VudFNvY2tzKClcbiAgICAgICAgXHR9LFxuICAgICAgICAgIC8vIG1vc3RQb3B1bGFyU29ja3M6IGZ1bmN0aW9uKFNvY2tGYWN0b3J5KSB7XG4gICAgICAgICAgLy8gICByZXR1cm4gU29ja0ZhY29yeS5tb3N0UG9wdWxhclNvY2tzKCk7XG4gICAgICAgICAgLy8gfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ2hvbWVDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgbW9zdFJlY2VudFNvY2tzLCBTb2NrRmFjdG9yeSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcblxuICAkc2NvcGUubW9zdFJlY2VudFNvY2tzID0gbW9zdFJlY2VudFNvY2tzO1xuICBTb2NrRmFjdG9yeS5tb3N0UG9wdWxhclNvY2tzKClcbiAgLnRoZW4oZnVuY3Rpb24oc29ja3Mpe1xuICAgICRzY29wZS5tb3N0UG9wdWxhclNvY2tzID0gc29ja3M7XG4gIH0pO1xuICBcbiAgJHNjb3BlLnNlZVNvY2sgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG4gIH1cbn0pIiwiYXBwLmZhY3RvcnkoJ0xpa2VGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApIHtcblxuICByZXR1cm4ge1xuICAgIGdldEFsbExpa2VzOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbGlrZScpXG4gICAgICAudGhlbihmdW5jdGlvbihsaWtlcykge1xuICAgICAgICByZXR1cm4gbGlrZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcbiAgICBnZXRTb2NrTGlrZXM6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9saWtlL3NvY2svJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihsaWtlcykge1xuICAgICAgICByZXR1cm4gbGlrZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcbiAgICBnZXRVc2VyU29ja0xpa2U6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9saWtlL3VzZXIvc29jay8nK3NvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGxpa2UpIHtcbiAgICAgICAgcmV0dXJuIGxpa2UuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcbiAgICBnZXRVc2VyTGlrZXM6IGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9saWtlL3VzZXIvJyt1c2VySWQpXG4gICAgICAudGhlbihmdW5jdGlvbihsaWtlcykge1xuICAgICAgICByZXR1cm4gbGlrZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcbiAgICBuZXdMaWtlOiBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCdhcGkvbGlrZS9saWtlLycrc29ja0lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24obGlrZSkge1xuICAgICAgICByZXR1cm4gbGlrZS5kYXRhO1xuICAgICAgfSlcbiAgICB9LFxuICAgIG5ld0Rpc2xpa2U6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJ2FwaS9saWtlL2Rpc2xpa2UvJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihsaWtlKSB7XG4gICAgICAgIHJldHVybiBsaWtlLmRhdGE7XG4gICAgICB9KVxuICAgIH0sXG4gICAgdXBkYXRlTGlrZTogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAucHV0KCdhcGkvbGlrZS9saWtlLycrc29ja0lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24obGlrZSkge1xuICAgICAgICByZXR1cm4gbGlrZS5kYXRhXG4gICAgICB9KVxuICAgIH0sXG4gICAgdXBkYXRlRGlzbGlrZTogZnVuY3Rpb24oc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAucHV0KCdhcGkvbGlrZS9kaXNsaWtlLycrc29ja0lkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24obGlrZSkge1xuICAgICAgICByZXR1cm4gbGlrZS5kYXRhO1xuICAgICAgfSlcbiAgICB9XG4gIH1cbn0pIiwiYXBwLmNvbnRyb2xsZXIoJ2NhcnRDdXJyZW50JywgZnVuY3Rpb24gKCRzY29wZSwgT3JkZXJGYWN0b3J5LCBjdXJyZW50Q2FydCkge1xuICAkc2NvcGUuY3VycmVudCA9IGN1cnJlbnRDYXJ0XG59KVxuXG5cbmFwcC5jb250cm9sbGVyKCdjYXJ0SGlzdG9yeScsIGZ1bmN0aW9uICgkc2NvcGUsIE9yZGVyRmFjdG9yeSwgY2FydEhpc3RvcnkpIHtcblxuICAkc2NvcGUuY2FydEhpc3RvcnkgPSBjYXJ0SGlzdG9yeVxuXG59KVxuIiwiYXBwLmRpcmVjdGl2ZSgnY3VycmVudENhcnQnLCBmdW5jdGlvbiAoJHN0YXRlLCBPcmRlckZhY3RvcnkpIHtcblxuICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHNjb3BlOiB7fSxcbiAgICAgIHRlbXBsYXRlVXJsOiAnanMvb3JkZXIvY3VycmVudC5odG1sJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XG5cbiAgICAgICAgc2NvcGUudXBkYXRlID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgIHZhciBzb2NrID0ge1xuICAgICAgICAgICAgcXVhbnRpdHk6IGl0ZW0ubmV3QW1vdW50LFxuICAgICAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS51cGRhdGVJdGVtKHNvY2spXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGl0ZW0ucXVhbnRpdHkgPSBpdGVtLm5ld0Ftb3VudDtcbiAgICAgICAgICAgIGl0ZW0ubmV3QW1vdW50ID0gbnVsbDtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2NvcGUuY2FsY1RvdGFsKClcbiAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuZGVsZXRlID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgIHZhciB0b2RlbGV0ZSA9IHsgaXRlbTogaXRlbSB9XG4gICAgICAgICAgT3JkZXJGYWN0b3J5LmRlbGV0ZUl0ZW0odG9kZWxldGUuaXRlbS5pZClcbiAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHsgcmV0dXJuIHNjb3BlLmNhbGNUb3RhbCgpIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24obmV3VG90YWwpIHsgc2NvcGUudG90YWwgPSBuZXdUb3RhbCB9KVxuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuc2luZ2xlU29ja1ZpZXcgPSBmdW5jdGlvbihpZCkgeyAkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pIH1cbiAgICAgICAgc2NvcGUudG9DaGVja291dCA9IGZ1bmN0aW9uKCkgeyAkc3RhdGUuZ28oJ2NoZWNrb3V0JykgfVxuXG4gICAgICAgIHNjb3BlLmNhbGNUb3RhbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBPcmRlckZhY3RvcnkuY2FsY3VsYXRlVG90YWwoJ2N1cnJlbnQnKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGNhcnRUb3RhbCkge1xuICAgICAgICAgICAgc2NvcGUudG90YWwgPSBjYXJ0VG90YWxcbiAgICAgICAgICAgIHJldHVybiBjYXJ0VG90YWxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuY2FsY1RvdGFsKClcblxuICAgICAgICByZXR1cm4gT3JkZXJGYWN0b3J5LnNob3dDYXJ0KCdjdXJyZW50JylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY3VycmVudCkgeyBzY29wZS5jdXJyZW50Q2FydCA9IGN1cnJlbnQgfSlcbiAgICB9XG4gIH1cbn0pXG5cbmFwcC5kaXJlY3RpdmUoJ2NhcnRIaXN0b3J5JywgZnVuY3Rpb24oJHN0YXRlLCBPcmRlckZhY3RvcnkpIHtcblxuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgc2NvcGU6IHt9LFxuICAgIHRlbXBsYXRlVXJsOiAnanMvb3JkZXIvaGlzdG9yeS5odG1sJyxcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgc2NvcGUuY2FsY1RvdGFsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBPcmRlckZhY3RvcnkuY2FsY3VsYXRlVG90YWwoJ2hpc3RvcnknKVxuICAgICAgICAudGhlbihmdW5jdGlvbihjYXJ0VG90YWwpIHsgc2NvcGUudG90YWxTcGVudCA9IGNhcnRUb3RhbCB9KVxuICAgICAgfVxuXG4gICAgICBzY29wZS5jYWxjVG90YWwoKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7IGNvbnNvbGUubG9nKHNjb3BlLnRvdGFsU3BlbnQpIH0pXG5cbiAgICAgIHJldHVybiBPcmRlckZhY3Rvcnkuc2hvd0NhcnQoJ2hpc3RvcnknKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oaGlzdG9yeSkgeyBzY29wZS5jYXJ0SGlzdG9yeSA9IGhpc3RvcnkgfSlcbiAgICB9XG4gIH1cblxufSlcbiIsIlxuYXBwLmZhY3RvcnkoJ09yZGVyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKSB7XG4gIHZhciBjYWNoZWRDYXJ0ID0gW11cbiAgdmFyIGNoZWNrQ2FydCA9IGZ1bmN0aW9uKG9iaiwgYXJyKSB7XG4gICAgcmV0dXJuIGFyci5tYXAoZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5zb2NrSWQgfSkuaW5kZXhPZihvYmouc29ja0lkKSA9PT0gLTEgPyBmYWxzZSA6IHRydWVcbiAgfVxuICByZXR1cm4ge1xuICAgIGFkZFRvQ2FydDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyL2N1cnJlbnQnKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7IHJldHVybiBjaGVja0NhcnQob2JqLCByZXMuZGF0YSkgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGluQ2FydCkge1xuICAgICAgICBpZiAoaW5DYXJ0KSB7XG4gICAgICAgICAgcmV0dXJuIFwiQWxyZWFkeSBpbiBDYXJ0IVwiXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvb3JkZXIvJywgb2JqKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykgeyByZXR1cm4gcmVzLmRhdGEgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9LFxuICAgIHNob3dDYXJ0OiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAvL3R5cGUgPSAnY3VycmVudCcgfHwgdHlwZSA9ICdoaXN0b3J5J1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9vcmRlci8nK3R5cGUpXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlcikge1xuICAgICAgICBjYWNoZWRDYXJ0ID0gb3JkZXIuZGF0YVxuICAgICAgICByZXR1cm4gY2FjaGVkQ2FydCB8fCBbXVxuICAgICAgfSlcbiAgICB9LFxuICAgIGNhbGN1bGF0ZVRvdGFsOiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyLycrdHlwZSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKSB7XG4gICAgICAgIGNhY2hlZENhcnQgPSBvcmRlci5kYXRhXG4gICAgICAgIHJldHVybiBjYWNoZWRDYXJ0IHx8IFtdXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oY2FydCkge1xuICAgICAgICBpZiAodHlwZT09PSdjdXJyZW50Jykge1xuICAgICAgICAgIHJldHVybiBjYXJ0LnJlZHVjZShmdW5jdGlvbihvLCBpdGVtKSB7cmV0dXJuIG8gKyAoXG4gICAgICAgICAgICBpdGVtLnNvY2sucHJpY2UqaXRlbS5xdWFudGl0eSl9LCAwKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBjYXJ0LnJlZHVjZShmdW5jdGlvbihvLCBvcmRlcikge1xuICAgICAgICAgICAgcmV0dXJuIG8gKyBvcmRlci5pdGVtcy5yZWR1Y2UoZnVuY3Rpb24obywgaXRlbSkge1xuICAgICAgICAgICAgICByZXR1cm4gbyArIChpdGVtLnNvY2sucHJpY2UqaXRlbS5xdWFudGl0eSl9LCAwKVxuICAgICAgICAgIH0sIDApXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSxcbiAgICB1cGRhdGVJdGVtOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wdXQoJy9hcGkvb3JkZXInLCBvYmopXG4gICAgICAudGhlbihmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLmRhdGEgfSlcbiAgICB9LFxuICAgIGRlbGV0ZUl0ZW06IGZ1bmN0aW9uKGl0ZW1JZCkge1xuICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9vcmRlci8nK2l0ZW1JZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHRvUmVtb3ZlKSB7XG4gICAgICAgIGNhY2hlZENhcnQuc3BsaWNlKGNhY2hlZENhcnQubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uaWQgfSkuaW5kZXhPZihpdGVtSWQpLDEpXG4gICAgICAgIHJldHVybiBjYWNoZWRDYXJ0XG4gICAgICB9KVxuICAgIH0sXG4gICAgZW5zdXJlQ2FydDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL29yZGVyL2NyZWF0ZWNhcnQnKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpIHtcbiAgICAgICAgcmV0dXJuIHtleGlzdHM6IG9yZGVyLmRhdGF9XG4gICAgICB9KVxuICAgIH0sXG5cbiAgfVxufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjdXJyZW50Q2FydCcsIHtcbiAgICB1cmw6ICcvY2FydC9jdXJyZW50Jyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9vcmRlci9jYXJ0Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdjYXJ0Q3VycmVudCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0Y3VycmVudENhcnQ6IGZ1bmN0aW9uIChPcmRlckZhY3RvcnkpIHtcblx0XHRcdFx0cmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnY3VycmVudCcpXG5cdFx0XHR9XG5cdFx0fVxuICB9KVxuXG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjYXJ0SGlzdG9yeScsIHtcbiAgICB1cmw6ICcvY2FydC9oaXN0b3J5JyxcbiAgICB0ZW1wbGF0ZVVybDogJy9qcy9vcmRlci9wYXN0Lmh0bWwnLFxuICAgIGNvbnRyb2xsZXI6ICdjYXJ0SGlzdG9yeScsXG4gICAgcmVzb2x2ZToge1xuICAgICAgY2FydEhpc3Rvcnk6IGZ1bmN0aW9uIChPcmRlckZhY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIE9yZGVyRmFjdG9yeS5zaG93Q2FydCgnaGlzdG9yeScpO1xuICAgICAgfVxuICAgIH1cbiAgfSlcblxufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zd2l0Y2hUb1NpZ251cFBhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkc3RhdGUuZ28oJ3NpZ251cCcpO1xuICAgIH1cblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ1BlcnNvbmFsSW5mb0N0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlLCB0aGVVc2VyLCBQZXJzb25hbEluZm9GYWN0b3J5KSB7XG5cblx0JHNjb3BlLnVzZXJJZCA9IHRoZVVzZXIuaWQ7XG5cdCRzY29wZS5hZGRyZXNzMSA9IHRoZVVzZXIuYWRkcmVzczE7XG5cdCRzY29wZS5hZGRyZXNzMiA9IHRoZVVzZXIuYWRkcmVzczI7XG5cdCRzY29wZS56aXAgPSB0aGVVc2VyLnppcDtcblx0JHNjb3BlLnN0YXRlID0gdGhlVXNlci5zdGF0ZTtcblx0JHNjb3BlLmNvdW50cnkgPSB0aGVVc2VyLmNvdW50cnk7XG5cdCRzY29wZS5waG9uZSA9IHRoZVVzZXIucGhvbmU7XG5cdCRzY29wZS5kaXNwbGF5RXJyb3IgPSBmYWxzZTtcblxuXHQkc2NvcGUuc3VibWl0UGVyc29uYWwgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRpZiAoKCRzY29wZS5jb3VudHJ5ID09PSBcIlVuaXRlZCBTdGF0ZXNcIiB8fCAkc2NvcGUuY291bnRyeSA9PT0gXCJDYW5hZGFcIikgJiYgJHNjb3BlLnN0YXRlID09PSBcIlwiKSB7XG5cdFx0XHQkc2NvcGUuZGlzcGxheUVycm9yID0gdHJ1ZTtcblx0XHRcdHJldHVybiAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJJZiBpbiBVUyBvciBDYW5hZGEsIG11c3QgaW5jbHVkZSBTdGF0ZS9Qcm92aW5jZVwiO1xuXHRcdH1cblxuXHRcdHZhciB1c2VySW5mbyA9IHtcblx0XHRcdGFkZHJlc3MxIDogJHNjb3BlLmFkZHJlc3MxLFxuXHRcdFx0YWRkcmVzczIgOiAkc2NvcGUuYWRkcmVzczIsXG5cdFx0XHR6aXAgOiAkc2NvcGUuemlwLFxuXHRcdFx0c3RhdGUgOiAkc2NvcGUuc3RhdGUsXG5cdFx0XHRjb3VudHJ5IDogJHNjb3BlLmNvdW50cnksXG5cdFx0XHRwaG9uZSA6ICRzY29wZS5waG9uZVxuXHRcdH1cblxuXHRcdHJldHVybiBQZXJzb25hbEluZm9GYWN0b3J5LnN1Ym1pdCgkc2NvcGUudXNlcklkLCB1c2VySW5mbylcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRyZXR1cm4gJHN0YXRlLmdvKCd1c2VyJywge3VzZXJJZDogJHNjb3BlLnVzZXJJZH0pO1xuXHRcdH0pXG5cdH1cblxufSk7IiwiYXBwLmZhY3RvcnkoJ1BlcnNvbmFsSW5mb0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAvLyBQZXJzb25hbEZhY3RvcnkgPSB7fTtcblxuICByZXR1cm4ge1xuICAgIHN1Ym1pdCA6IGZ1bmN0aW9uKGlkLCB1c2VySW5mbyl7XG4gICAgICByZXR1cm4gJGh0dHAucHV0KCcvYXBpL3VzZXIvJyArIGlkLCB1c2VySW5mbylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncGVyc29uYWwnLCB7XG5cdFx0dXJsOiAnL3BlcnNvbmFsLzppZCcsXG5cdFx0Y29udHJvbGxlcjogJ1BlcnNvbmFsSW5mb0N0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3BlcnNvbmFsaW5mby9wZXJzb25hbGluZm8udmlldy5odG1sJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR0aGVVc2VyOiBmdW5jdGlvbiAoJHN0YXRlUGFyYW1zLCBVc2VyRmFjdG9yeSl7XG5cdFx0XHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLmlkKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ3NvY2tJZENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGVQYXJhbXMsIHRoZVNvY2ssIHRoZVJldmlld3MsIGN1cnJlbnRVc2VyTGlrZSwgc29ja0xpa2VzLCBSZXZpZXdGYWN0b3J5LCBPcmRlckZhY3RvcnksIFNvY2tGYWN0b3J5LCBVc2VyRmFjdG9yeSwgTGlrZUZhY3RvcnkpIHtcblxuICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IGZhbHNlO1xuICAkc2NvcGUuc29jayA9IHRoZVNvY2s7XG4gICRzY29wZS5yZXZpZXdzID0gdGhlUmV2aWV3cztcbiAgJHNjb3BlLmxpa2UgPSBjdXJyZW50VXNlckxpa2UgfHwge2xpa2U6ZmFsc2UsIGRpc2xpa2U6ZmFsc2V9O1xuICAkc2NvcGUuY3VycmVudFVzZXJSZXZpZXdlZFNvY2sgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBjb3VudExpa2VzKHZvdGVzKSB7XG4gICAgdmFyIGxpa2VzID0gMCxcbiAgICAgICAgZGlzbGlrZXMgPSAwO1xuICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSkge1xuICAgICAgaWYgKHZvdGUubGlrZSkgbGlrZXMrKztcbiAgICAgIGlmICh2b3RlLmRpc2xpa2UpIGRpc2xpa2VzKys7XG4gICAgfSk7XG4gICAgcmV0dXJuIHsgbGlrZXM6IGxpa2VzLCBkaXNsaWtlczogZGlzbGlrZXMgfTtcbiAgfVxuXG4gICRzY29wZS5saWtlcyA9IGNvdW50TGlrZXMoc29ja0xpa2VzKTtcblxuXG4gICRzY29wZS51cGRhdGVMaWtlcyA9IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgIHJldHVybiBMaWtlRmFjdG9yeS5nZXRTb2NrTGlrZXMoc29ja0lkKVxuICAgIC50aGVuKGZ1bmN0aW9uKGxpa2VzKSB7XG4gICAgICAkc2NvcGUubGlrZXMgPSBjb3VudExpa2VzKGxpa2VzKTtcbiAgICB9KVxuICB9O1xuXG4gICRzY29wZS5kYXRlUGFyc2VyID0gZnVuY3Rpb24gKHJhd0RhdGUpIHtcbiAgICB2YXIgcmF3RGF0ZSA9IHRoZVNvY2suY3JlYXRlZEF0LnNwbGl0KFwiVFwiKVswXS5zcGxpdChcIi1cIik7XG4gICAgdmFyIHJhd1llYXIgPSByYXdEYXRlWzBdO1xuICAgIHZhciByYXdNb250aCA9IHJhd0RhdGVbMV07XG4gICAgdmFyIHJhd0RheSA9IHJhd0RhdGVbMl07XG4gICAgdmFyIG1vbnRoT2JqID0ge1xuICAgICAgICBcIjAxXCI6XCJKYW51YXJ5XCIsXG4gICAgICAgIFwiMDJcIjpcIkZlYnJ1YXJ5XCIsXG4gICAgICAgIFwiMDNcIjpcIk1hcmNoXCIsXG4gICAgICAgIFwiMDRcIjpcIkFwcmlsXCIsXG4gICAgICAgIFwiMDVcIjpcIk1heVwiLFxuICAgICAgICBcIjA2XCI6XCJKdW5lXCIsXG4gICAgICAgIFwiMDdcIjpcIkp1bHlcIixcbiAgICAgICAgXCIwOFwiOlwiQXVndXN0XCIsXG4gICAgICAgIFwiMDlcIjpcIlNlcHRlbWJlclwiLFxuICAgICAgICBcIjEwXCI6XCJPY3RvYmVyXCIsXG4gICAgICAgIFwiMTFcIjpcIk5vdmVtYmVyXCIsXG4gICAgICAgIFwiMTJcIjpcIkRlY2VtYmVyXCJcbiAgICB9XG4gICAgcmV0dXJuIHJhd0RheSArIFwiIFwiICsgbW9udGhPYmpbcmF3TW9udGhdICsgXCIgXCIgKyByYXdZZWFyO1xuICB9XG5cbiAgJHNjb3BlLmFsZXJ0ID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICRzY29wZS5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkc2NvcGUuYWxlcnRpbmcgPSAhJHNjb3BlLmFsZXJ0aW5nXG4gICAgICAkc2NvcGUuJGRpZ2VzdCgpXG4gICAgfSwgMzAwMClcbiAgICAvLyBpZiAoISRzY29wZS5hbGVydGluZykgJHNjb3BlLm1lc3NhZ2UgPT09IG51bGxcbiAgfVxuXG4gICRzY29wZS5nb1RvVXNlclBhZ2UgPSBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAkc3RhdGUuZ28oJ3VzZXInLCB7dXNlcklkOiB1c2VySWR9KTtcbiAgfVxuXG4gICRzY29wZS5hZGRJdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW0gPSB7fTtcbiAgICBpdGVtLnNvY2tJZCA9ICRzY29wZS5zb2NrLmlkO1xuICAgIGl0ZW0ucXVhbnRpdHkgPSArJHNjb3BlLnF1YW50aXR5O1xuICAgIGl0ZW0ub3JpZ2luYWxQcmljZSA9ICskc2NvcGUuc29jay5wcmljZTtcbiAgICBpZiAoaXRlbS5xdWFudGl0eSA+IDApIHtcbiAgICAgIE9yZGVyRmFjdG9yeS5hZGRUb0NhcnQoaXRlbSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzcG9uc2UgIT09IFwib2JqZWN0XCIpICRzY29wZS5hbGVydChyZXNwb25zZSk7XG4gICAgICAgIGVsc2UgJHN0YXRlLmdvKCdjdXJyZW50Q2FydCcpO1xuICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSAkc2NvcGUuYWxlcnQoJ1lvdSBoYXZlIHRvIGFkZCBhdCBsZWFzdCBvbmUgc29jayEnKTtcbiAgfVxuXG4gICRzY29wZS5kaXNwbGF5VGFncyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkc2NvcGUuc29jay50YWdzLm1hcChmdW5jdGlvbih0YWcpe1xuICAgICAgcmV0dXJuICcjJyArIHRhZztcbiAgICB9KS5qb2luKFwiLCBcIik7XG4gIH1cblxuICAkc2NvcGUuZGlzcGxheVRhZ3MoKTtcblxuICAkc2NvcGUuZ2V0TG9nZ2VkSW5Vc2VySWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcbiAgICAudGhlbihmdW5jdGlvbih1c2VyKXtcbiAgICAgIGlmICghdXNlcikge1xuICAgICAgICAkc2NvcGUubG9nZ2VkSW5Vc2VySWQgPSAnbm9uZSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUubG9nZ2VkSW5Vc2VySWQgPSB1c2VyLmlkO1xuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICAkc2NvcGUuZ2V0TG9nZ2VkSW5Vc2VySWQoKTtcblxuICAkc2NvcGUudXNlckNhbm5vdFBvc3RSZXZpZXcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICRzY29wZS5yZXZpZXdOb3RBbGxvd2VkO1xuICB9XG5cbiAgJHNjb3BlLnVzZXJDYW5ub3RQb3N0UmV2aWV3KCk7XG5cbiAgJHNjb3BlLm5ld1JldmlldyA9IGZ1bmN0aW9uKCkge1xuXG4gIC8vaWYgdXNlciBoYXMgYWxyZWFkeSByZXZpZXcgc29jaywgZG9uJ3QgYWxsb3cgdXNlciB0byByZXZpZXcgaXQgYWdhaW5cbiAgICB2YXIgdXNlcnNXaG9SZXZpZXdlZFNvY2sgPSAkc2NvcGUucmV2aWV3cy5tYXAoZnVuY3Rpb24ocmV2aWV3KXtcbiAgICAgIHJldHVybiByZXZpZXcudXNlcklkO1xuICAgIH0pXG5cbiAgICBpZiAoJHNjb3BlLmxvZ2dlZEluVXNlcklkID09PSAnbm9uZScpIHtcbiAgICAgICRzY29wZS5yZXZpZXdFcnJvck1lc3NhZ2UgPSBcIllvdSBtdXN0IGJlIGxvZ2dlZCBpbiB0byByZXZpZXcgYSBzb2NrIVwiO1xuICAgICAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAodXNlcnNXaG9SZXZpZXdlZFNvY2suaW5kZXhPZigkc2NvcGUubG9nZ2VkSW5Vc2VySWQpICE9PSAtMSB8fCAkc2NvcGUudXNlckNhbm5vdFBvc3RSZXZpZXcoKSkge1xuICAgICAgJHNjb3BlLnJldmlld0Vycm9yTWVzc2FnZSA9IFwiWW91J3ZlIGFscmVhZHkgcmV2aWV3ZWQgdGhpcyBzb2NrISBZb3UgY2FuJ3QgcmV2aWV3IGl0IGFnYWluIVwiO1xuICAgICAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSB0cnVlO1xuICAvL2lmIHNvY2sgaWQgbWF0Y2hlcyB1c2VyIGlkLCB1c2VyIGRvbid0IGFsbG93IHVzZXIgdG8gcG9zdCBhIHJldmlld1xuICAgIH0gZWxzZSBpZiAoJHNjb3BlLmxvZ2dlZEluVXNlcklkID09PSAkc2NvcGUuc29jay51c2VyLmlkKSB7XG4gICAgICAkc2NvcGUucmV2aWV3RXJyb3JNZXNzYWdlID0gXCJZb3UgY2FuJ3QgcmV2aWV3IHlvdXIgb3duIHNvY2shXCI7XG4gICAgICAkc2NvcGUucmV2aWV3Tm90QWxsb3dlZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcblxuICAgICAgdmFyIG5ld1JldmlldyA9IHtcbiAgICAgICAgdGV4dDogJHNjb3BlLnJldmlld1RleHQsXG4gICAgICAgIHNvY2tJZDogJHNjb3BlLnNvY2suaWRcbiAgICAgIH1cbiAgICAgIHJldHVybiBSZXZpZXdGYWN0b3J5LnBvc3RSZXZpZXcobmV3UmV2aWV3KVxuICAgICAgLnRoZW4oZnVuY3Rpb24obmV3UmV2aWV3KXtcbiAgICAgICAgdmFyIHJldmlldyA9IHt9O1xuICAgICAgICByZXZpZXcudXNlciA9IHt9O1xuXG4gICAgICAgICAgcmV2aWV3LnVzZXIuZmlyc3RfbmFtZSA9IG5ld1Jldmlldy51c2VyLmZpcnN0X25hbWU7XG4gICAgICAgICAgcmV2aWV3LnVzZXIubGFzdF9uYW1lID0gbmV3UmV2aWV3LnVzZXIubGFzdF9uYW1lO1xuICAgICAgICAgIHJldmlldy51c2VyLnByb2ZpbGVfcGljID0gbmV3UmV2aWV3LnVzZXIucHJvZmlsZV9waWM7XG4gICAgICAgICAgcmV2aWV3LnVzZXIudXNlcm5hbWUgPSBuZXdSZXZpZXcudXNlci51c2VybmFtZTtcbiAgICAgICAgICByZXZpZXcudGV4dCA9IG5ld1Jldmlldy5yZXZpZXcudGV4dDtcblxuICAgICAgICAkc2NvcGUucmV2aWV3cy5wdXNoKHJldmlldyk7XG4gICAgICAgICRzY29wZS5yZXZpZXdUZXh0ID0gbnVsbDtcbiAgICAgICAgJHNjb3BlLnJldmlld05vdEFsbG93ZWQgPSB0cnVlO1xuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAkc2NvcGUubmV3TGlrZSA9IExpa2VGYWN0b3J5Lm5ld0xpa2U7XG4gICRzY29wZS5uZXdEaXNsaWtlID0gTGlrZUZhY3RvcnkubmV3RGlzbGlrZTtcbiAgJHNjb3BlLnVwZGF0ZUxpa2UgPSBMaWtlRmFjdG9yeS51cGRhdGVMaWtlO1xuICAkc2NvcGUudXBkYXRlRGlzbGlrZSA9IExpa2VGYWN0b3J5LnVwZGF0ZURpc2xpa2U7XG5cbiAgJHNjb3BlLnZvdGUgPSBmdW5jdGlvbihzb2NrSWQsIG5uZXcsIHVwZGF0ZSkge1xuICAgIGlmICghJHNjb3BlLnZlcmlmeVVzZXIpICRzY29wZS5hbGVydChcIlBsZWFzZSBsb2cgaW4gdG8gbGlrZSBhIHNvY2shXCIpO1xuXG4gICAgaWYgKCEkc2NvcGUubGlrZS5saWtlICYmICEkc2NvcGUubGlrZS5kaXNsaWtlKSB7XG4gICAgICBubmV3KHNvY2tJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgJHNjb3BlLmxpa2UgPSB2b3RlO1xuICAgICAgICAkc2NvcGUubGlrZXMgPSAkc2NvcGUudXBkYXRlTGlrZXMoJHNjb3BlLnNvY2suaWQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZShzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbih1cGRhdGUpIHtcbiAgICAgICAgJHNjb3BlLmxpa2UgPSB1cGRhdGU7XG4gICAgICAgICRzY29wZS5saWtlcyA9ICRzY29wZS51cGRhdGVMaWtlcygkc2NvcGUuc29jay5pZCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgcmV0dXJuIHVzZXIuaWQgPT0gJHNjb3BlLnNvY2suVXNlcklkIHx8IHVzZXIuaXNBZG1pbj8gdHJ1ZSA6IGZhbHNlXG4gIH0pXG4gIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAkc2NvcGUudmVyaWZ5VXNlciA9IHJlc3VsdDtcbiAgfSk7XG5cbiAgJHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuIFNvY2tGYWN0b3J5LmRlbGV0ZShpZClcbiAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICRzdGF0ZS5nbygnaG9tZScpXG4gICAgfSlcbiAgfVxuXG59KTtcbiIsImFwcC5mYWN0b3J5KCdTb2NrRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gIHJldHVybiB7XG4gICAgYWxsU29ja3M6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnYXBpL3NvY2snKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIHNpbmdsZVNvY2s6IGZ1bmN0aW9uKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrLycgKyBzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgfSlcbiAgICB9LFxuXG4gICAgc29ja0J5VXNlcklkOiBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay9ieVVzZXIvJyArIHVzZXJJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBtb3N0UmVjZW50U29ja3M6IGZ1bmN0aW9uICgpIHtcbiAgICBcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay9yZWNlbnQnKVxuICAgIFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgXHRcdHJldHVybiByZXMuZGF0YTtcbiAgICBcdH0pXG4gICAgfSxcblxuICAgIG1vc3RQb3B1bGFyU29ja3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvc29jay9wb3B1bGFyJylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBzYXZlRGVzaWduOiBmdW5jdGlvbiAobmV3U29ja0RhdGFPYmopIHtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3NvY2svJywgbmV3U29ja0RhdGFPYmopXG4gICAgfSxcblxuICAgIHByZXBhcmVUYWdzOiBmdW5jdGlvbiAodGFnSW5wdXQpIHtcbiAgICAgIHJldHVybiB0YWdJbnB1dC5zcGxpdCgnICcpLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgIGUgPSBlLnJlcGxhY2UoLywvaSwgXCJcIik7XG4gICAgICAgIGUgPSBlLnN1YnN0cmluZygxKTtcbiAgICAgICAgcmV0dXJuIGU7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgdXB2b3RlOiBmdW5jdGlvbiAoc29ja0lkKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9zb2NrL3Vwdm90ZScsIHtpZDogc29ja0lkfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBkb3dudm90ZTogZnVuY3Rpb24gKHNvY2tJZCkge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc29jay9kb3dudm90ZScsIHtpZDogc29ja0lkfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICB9KVxuICAgIH0sXG5cbiAgICBnZXRVbnNpZ25lZFVSTDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9zb2NrL3Vuc2lnbmVkVVJMJylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSlcbiAgICB9LFxuICAgIGRlbGV0ZTogZnVuY3Rpb24gKGlkKSB7XG4gICAgICBjb25zb2xlLmxvZyhpZClcbiAgICAgIHJldHVybiAkaHR0cC5kZWxldGUoJy9hcGkvc29jay9kZWxldGUvJyArIGlkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgIH0pXG4gICAgfVxuXG4gIH1cblxufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpbmdsZVNvY2tWaWV3Jywge1xuICAgIHVybDonL3NvY2tzLzppZCcsXG4gICAgY29udHJvbGxlcjogJ3NvY2tJZENvbnRyb2xsZXInLFxuICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHZpZXcvcHJvZHVjdHZpZXcuaHRtbCcsXG4gICAgcmVzb2x2ZToge1xuICAgICAgdGhlU29jazogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgU29ja0ZhY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIFNvY2tGYWN0b3J5LnNpbmdsZVNvY2soJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgfSxcbiAgICAgIHRoZVJldmlld3M6IGZ1bmN0aW9uICgkc3RhdGVQYXJhbXMsIFJldmlld0ZhY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIFJldmlld0ZhY3RvcnkucHJvZHVjdFJldmlld3MoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgfSxcbiAgICAgIGN1cnJlbnRVc2VyTGlrZTogZnVuY3Rpb24oJHN0YXRlUGFyYW1zLCBMaWtlRmFjdG9yeSwgQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgICBpZiAodXNlcikgcmV0dXJuIExpa2VGYWN0b3J5LmdldFVzZXJTb2NrTGlrZSgkc3RhdGVQYXJhbXMuaWQpO1xuICAgICAgICAgIGVsc2UgcmV0dXJuIFwibm8gdXNlciBkYXRhXCI7XG4gICAgICAgIH0pXG4gICAgICB9LFxuICAgICAgc29ja0xpa2VzOiBmdW5jdGlvbigkc3RhdGVQYXJhbXMsIExpa2VGYWN0b3J5KSB7XG4gICAgICAgIHJldHVybiBMaWtlRmFjdG9yeS5nZXRTb2NrTGlrZXMoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmV2aWV3RmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gIHJldHVybiB7XG4gICAgcG9zdFJldmlldzogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9yZXZpZXcvJywgb2JqKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgfSlcbiAgICB9LFxuICAgIHByb2R1Y3RSZXZpZXdzOiBmdW5jdGlvbihzb2NrSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcmV2aWV3L3NvY2svJytzb2NrSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH0sXG4gICAgZGVsZXRlOiBmdW5jdGlvbihyZXZpZXdJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnYXBpL3Jldmlldy9kZWxldGUvJyArcmV2aWV3SWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NlYXJjaFJlc3VsdHMnLCB7XG5cdFx0dXJsOiAnL3NlYXJjaC86c2VhcmNoVGVybXMnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3NlYXJjaHJlc3VsdHMvc2VhcmNoLnZpZXcuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogXCJzZWFyY2hDdHJsXCIsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0YWxsUmVzdWx0czogZnVuY3Rpb24gKCRzdGF0ZVBhcmFtcywgU2VhcmNoRmFjdG9yeSkge1xuXHRcdFx0XHRyZXR1cm4gU2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0KCRzdGF0ZVBhcmFtcy5zZWFyY2hUZXJtcylcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIGFsbFJlc3VsdHMpIHtcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gYWxsUmVzdWx0cztcblx0XHQvLyBcdGNvbnNvbGUubG9nKFwiQWxsIFJlc3VsdHMhIVwiLCBhbGxSZXN1bHRzKTtcblx0XHQvLyBcdCRzY29wZS5udW1iZXIgPSAxMjM7XG5cdFx0Ly8gfVxuXHRcdC8vIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcykge1xuXHRcdC8vIFx0Y29uc29sZS5sb2coXCJIRVJFRUVFRVwiLCAkc3RhdGVQYXJhbXMucmVzdWx0cylcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gJHN0YXRlUGFyYW1zLnJlc3VsdHNcblx0XHQvLyB9XG5cdH0pXG59KVxuIiwiYXBwLmNvbnRyb2xsZXIoJ1NpZ251cEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBTaWdudXBGYWN0b3J5LCAkc3RhdGUsIEF1dGhTZXJ2aWNlKSB7XG5cbiAgZnVuY3Rpb24gcGFzc3dvcmRWYWxpZCAocGFzc3dvcmQpIHtcbiAgICBpZiAocGFzc3dvcmQubGVuZ3RoIDwgNikge1xuICAgICAgJHNjb3BlLnNob3dFcnJvciA9IHRydWU7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gXCJQYXNzd29yZCBtdXN0IGJlIDYgY2hhcmFjdGVycyBsb25nIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAocGFzc3dvcmQgIT09ICRzY29wZS5wdzIpIHtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiVGhlIHBhc3N3b3JkIGZpZWxkcyBkb24ndCBtYXRjaCFcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKC9cXFcvLnRlc3QocGFzc3dvcmQpKXtcbiAgICAgICRzY29wZS5zaG93RXJyb3IgPSB0cnVlO1xuICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9IFwiUGFzc3dvcmQgY2Fubm90IGNvbnRhaW4gc3BlY2lhbCBjaGFyYWN0ZXJzIVwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAkc2NvcGUuc2hvd0Vycm9yID0gZmFsc2U7XG5cbiAgJHNjb3BlLmRpc3BsYXlFcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkc2NvcGUuc2hvd0Vycm9yO1xuICB9XG5cbiAgJHNjb3BlLnN1Ym1pdFNpZ251cCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAocGFzc3dvcmRWYWxpZCgkc2NvcGUucGFzc3dvcmQpKXtcbiAgICAgIHJldHVybiBTaWdudXBGYWN0b3J5LnN1Ym1pdCh7XG4gICAgICAgZW1haWw6ICRzY29wZS5lbWFpbCxcbiAgICAgICB1c2VybmFtZTogJHNjb3BlLnVzZXJuYW1lLFxuICAgICAgIHBhc3N3b3JkOiAkc2NvcGUucGFzc3dvcmQsXG4gICAgICAgZmlyc3RfbmFtZTogJHNjb3BlLmZpcnN0bmFtZSxcbiAgICAgICBsYXN0X25hbWU6ICRzY29wZS5sYXN0bmFtZSxcbiAgICAgICBpc0FkbWluOiBmYWxzZSxcbiAgICAgICBuZXdVc2VyOiB0cnVlXG4gICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICB2YXIgbG9naW5PYmogPSB7fTtcbiAgICAgICAgbG9naW5PYmouZW1haWwgPSAkc2NvcGUuZW1haWw7XG4gICAgICAgIGxvZ2luT2JqLnBhc3N3b3JkID0gJHNjb3BlLnBhc3N3b3JkO1xuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbk9iailcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgIHJldHVybiAkc3RhdGUuZ28oJ3BlcnNvbmFsJywge2lkOiByZXNwb25zZS5pZH0pO1xuICAgICAgICB9KVxuICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG59KTtcbiIsIi8vIGFwcC5mYWN0b3J5KCdTaWdudXBGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbi8vICAgdmFyIFNpZ251cEZhY3RvcnkgPSB7fTtcblxuLy8gICBTaWdudXBGYWN0b3J5LnN1Ym1pdCA9IGZ1bmN0aW9uKHVzZXJJbmZvKXtcbi8vICAgXHRjb25zb2xlLmxvZyh1c2VySW5mbyk7XG4vLyAgIFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlci8nLCB1c2VySW5mbylcbi8vICAgXHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4vLyAgIFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcbi8vICAgXHR9KVxuLy8gICB9XG5cbi8vICAgcmV0dXJuIFNpZ251cEZhY3Rvcnk7XG5cbi8vIH0pXG5cbmFwcC5mYWN0b3J5KCdTaWdudXBGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBTaWdudXBGYWN0b3J5ID0ge307XG5cblx0U2lnbnVwRmFjdG9yeS5zdWJtaXQgPSBmdW5jdGlvbiAodXNlckluZm8pIHtcblx0XHRjb25zb2xlLmxvZyhcIkZyb20gU2lnbnVwIEZhY3RvcnlcIiwgdXNlckluZm8pO1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvJywgdXNlckluZm8pXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0fSlcblx0fVxuXHRyZXR1cm4gU2lnbnVwRmFjdG9yeTtcbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnbnVwJywge1xuXHRcdHVybDogJy9zaWdudXAnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDdHJsJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9qcy9zaWdudXAvc2lnbnVwLnZpZXcuaHRtbCdcblx0fSk7XG5cbn0pOyIsImFwcC5jb250cm9sbGVyKCdVc2VyQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgdGhlVXNlciwgdGhlVXNlclNvY2tzLCBBdXRoU2VydmljZSwgVXNlckZhY3RvcnkpIHtcbiAgICBjb25zb2xlLmxvZyhcImNvbnRyb2xsZXJcIiwgdGhlVXNlclNvY2tzKTtcblx0JHNjb3BlLnVzZXIgPSB0aGVVc2VyO1xuXHQkc2NvcGUuc29ja3MgPSB0aGVVc2VyU29ja3M7XG5cbiAgICAkc2NvcGUuZGF0ZVBhcnNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJhd0RhdGUgPSAkc2NvcGUudXNlci5jcmVhdGVkQXQuc3BsaXQoXCJUXCIpWzBdLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgdmFyIHJhd1llYXIgPSByYXdEYXRlWzBdO1xuICAgICAgICB2YXIgcmF3TW9udGggPSByYXdEYXRlWzFdO1xuICAgICAgICB2YXIgcmF3RGF5ID0gcmF3RGF0ZVsyXTtcblxuICAgICAgICB2YXIgbW9udGhPYmogPSB7XG4gICAgICAgICAgICBcIjAxXCI6XCJKYW51YXJ5XCIsXG4gICAgICAgICAgICBcIjAyXCI6XCJGZWJydWFyeVwiLFxuICAgICAgICAgICAgXCIwM1wiOlwiTWFyY2hcIixcbiAgICAgICAgICAgIFwiMDRcIjpcIkFwcmlsXCIsXG4gICAgICAgICAgICBcIjA1XCI6XCJNYXlcIixcbiAgICAgICAgICAgIFwiMDZcIjpcIkp1bmVcIixcbiAgICAgICAgICAgIFwiMDdcIjpcIkp1bHlcIixcbiAgICAgICAgICAgIFwiMDhcIjpcIkF1Z3VzdFwiLFxuICAgICAgICAgICAgXCIwOVwiOlwiU2VwdGVtYmVyXCIsXG4gICAgICAgICAgICBcIjEwXCI6XCJPY3RvYmVyXCIsXG4gICAgICAgICAgICBcIjExXCI6XCJOb3ZlbWJlclwiLFxuICAgICAgICAgICAgXCIxMlwiOlwiRGVjZW1iZXJcIlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByYXdEYXkgKyBcIiBcIiArIG1vbnRoT2JqW3Jhd01vbnRoXSArIFwiIFwiICsgcmF3WWVhcjtcbiAgICB9XG5cblx0JHNjb3BlLnRvU2hpcHBpbmdJbmZvID0gZnVuY3Rpb24oaWQpe1xuXHRcdCRzdGF0ZS5nbygncGVyc29uYWwnLCB7aWQ6IGlkfSk7XG5cdH07XG5cblx0JHNjb3BlLnRvU29ja1ZpZXcgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHQkc3RhdGUuZ28oJ3NpbmdsZVNvY2tWaWV3Jywge2lkOiBpZH0pXG5cdH07XG5cblx0QXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gdXNlci5pZCA9PSAkc2NvcGUudXNlci5pZCB8fCB1c2VyLmlzQWRtaW4gPyB0cnVlIDogZmFsc2VcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICBcdCRzY29wZS52ZXJpZnlVc2VyID0gcmVzdWx0XG4gICAgfSk7XG5cblx0QXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gdXNlci5pc0FkbWluID8gdHJ1ZSA6IGZhbHNlXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgXHQkc2NvcGUuaXNBZG1pbiA9IHJlc3VsdFxuICAgIH0pO1xuXG4gICAgaWYgKCRzY29wZS51c2VyLmlzQWRtaW4pICRzY29wZS5hZG1pbkJ1dHRvbiA9IFwiTWFrZSBOb24tQWRtaW5cIlxuICAgIGlmICghJHNjb3BlLnVzZXIuaXNBZG1pbikgJHNjb3BlLmFkbWluQnV0dG9uID0gXCJNYWtlIEFkbWluXCJcblxuICAgICRzY29wZS5kZWxldGUgPSBVc2VyRmFjdG9yeS5kZWxldGU7XG4gICAgXG4gICAgJHNjb3BlLm1ha2VBZG1pbiA9IGZ1bmN0aW9uIChpZCkge1xuICAgIFx0cmV0dXJuIFVzZXJGYWN0b3J5Lm1ha2VBZG1pbihpZClcbiAgICBcdC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICBcdFx0aWYgKCRzY29wZS51c2VyLmlzQWRtaW4pIHtcbiAgICBcdFx0XHQkc2NvcGUudXNlci5pc0FkbWluID0gZmFsc2VcbiAgICBcdFx0XHQkc2NvcGUuYWRtaW5CdXR0b24gPSBcIk1ha2UgQWRtaW5cIlxuICAgIFx0XHR9XG4gICAgXHRcdGVsc2UgaWYgKCEkc2NvcGUudXNlci5pc0FkbWluKSB7XG4gICAgXHRcdFx0JHNjb3BlLnVzZXIuaXNBZG1pbiA9IHRydWVcbiAgICBcdFx0XHQkc2NvcGUuYWRtaW5CdXR0b24gPSBcIk1ha2UgTm9uLUFkbWluXCJcbiAgICBcdFx0fVxuICAgIFx0fSk7XG4gICAgfVxufSlcbiIsImFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlKSB7XG5cdHZhciBVc2VyRmFjdG9yeSA9IHt9O1xuXG5cdFVzZXJGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlci8nICsgaWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YVxuXHRcdH0pXG5cdH1cblxuXHRVc2VyRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3VzZXIvYWxsJylcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhXG5cdFx0fSlcblx0fVxuXG5cdFVzZXJGYWN0b3J5LmRlbGV0ZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3VzZXIvZGVsZXRlLycgKyBpZClcblx0XHQudGhlbigkc3RhdGUuZ28oJ2hvbWUnKSlcblx0fVxuXG5cdFVzZXJGYWN0b3J5Lm1ha2VBZG1pbiA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdHJldHVybiAkaHR0cC5wdXQoJy9hcGkvdXNlci9tYWtlQWRtaW4vJyArIGlkKVxuXHR9XG5cblx0cmV0dXJuIFVzZXJGYWN0b3J5O1xufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1c2VyJywge1xuXHRcdHVybDogJy91c2VyLzp1c2VySWQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2pzL3VzZXIvdXNlci1wcm9maWxlLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdVc2VyQ3RybCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0dGhlVXNlcjogZnVuY3Rpb24gKFVzZXJGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMudXNlcklkKTtcblx0XHRcdH0sXG5cdFx0XHR0aGVVc2VyU29ja3M6IGZ1bmN0aW9uIChTb2NrRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHJldHVybiBTb2NrRmFjdG9yeS5zb2NrQnlVc2VySWQoJHN0YXRlUGFyYW1zLnVzZXJJZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxufSlcbiIsImFwcC5jb250cm9sbGVyKCduYXZiYXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBTZWFyY2hGYWN0b3J5LCBPcmRlckZhY3RvcnkpIHtcblxuXHQkc2NvcGUuc2VhcmNoID0gZnVuY3Rpb24oc2VhcmNoVGVybXMpe1xuXHRcdC8vIFNlYXJjaEZhY3RvcnkuZmluZEJ5U2VhcmNoVGV4dChzZWFyY2hUZXJtcylcblx0XHQvLyAudGhlbihmdW5jdGlvbihyZXN1bHRzKXtcblx0XHQvLyBcdCRzY29wZS5yZXN1bHRzID0gcmVzdWx0cztcblx0XHQvLyBcdGNvbnNvbGUubG9nKHJlc3VsdHMpO1xuXHRcdFx0cmV0dXJuICRzdGF0ZS5nbygnc2VhcmNoUmVzdWx0cycsIHtzZWFyY2hUZXJtczogc2VhcmNoVGVybXN9KTtcblx0XHQvLyB9KVxuXHR9XG5cblx0cmV0dXJuIE9yZGVyRmFjdG9yeS5lbnN1cmVDYXJ0KClcblxufSlcblxuYXBwLmNvbnRyb2xsZXIoJ3NlYXJjaEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIGFsbFJlc3VsdHMsICRzdGF0ZVBhcmFtcykge1xuXHQkc2NvcGUucmVzdWx0cyA9IGFsbFJlc3VsdHM7XG5cdCRzY29wZS5zZWVTb2NrID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0JHN0YXRlLmdvKCdzaW5nbGVTb2NrVmlldycsIHtpZDogaWR9KVxuXHR9XG59KVxuIiwiYXBwLmRpcmVjdGl2ZSgnc29ja0FkbWluUm93JywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICBzY29wZToge1xuICAgICAgc29jazogXCI9c29ja0FkbWluUm93XCJcbiAgICB9LFxuICAgIHRlbXBsYXRlVXJsOiAnanMvYWRtaW4vdmlld3Mvc29ja0FkbWluUm93Lmh0bWwnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgfVxuICB9XG59KTsiLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZmFjdG9yeShcIlNlYXJjaEZhY3RvcnlcIiwgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBTZWFyY2hGYWN0b3J5ID0ge307XG5cblx0U2VhcmNoRmFjdG9yeS5maW5kQnlTZWFyY2hUZXh0ID0gZnVuY3Rpb24gKHRleHQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3NlYXJjaC8/cT0nICsgdGV4dClcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHRzKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0cy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gU2VhcmNoRmFjdG9yeTtcbn0pIiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlLCBPcmRlckZhY3RvcnkpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgT3JkZXJGYWN0b3J5LmVuc3VyZUNhcnQoKVxuXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnSG9tZScsIHN0YXRlOiAnaG9tZScgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTXkgUHJvZmlsZScsIHN0YXRlOiAndXNlcih7dXNlcklkOnVzZXIuaWR9KScsIGF1dGg6IHRydWUgfSxcbiAgICAgICAgICAgICAgICAvLyB7IGxhYmVsOiAnQWJvdXQnLCBzdGF0ZTogJ2Fib3V0JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdEZXNpZ24gYSBTb2NrJywgc3RhdGU6ICdkZXNpZ25WaWV3JyB9LFxuICAgICAgICAgICAgICAgIC8vIHsgbGFiZWw6ICdBZG1pbiBEYXNoYm9hcmQnLCBzdGF0ZTogJ2FkbWluJ31cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHNjb3BlLmFkbWluSXRlbXMgPSBbXG4gICAgICAgICAgICAgICAge2xhYmVsOiAnQWRtaW4gRGFzaGJvYXJkJywgc3RhdGU6ICdhZG1pbid9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldFVzZXIoKVxuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdvYXV0aEJ1dHRvbicsIGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICBzY29wZToge1xuICAgICAgcHJvdmlkZXJOYW1lOiAnQCdcbiAgICB9LFxuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmh0bWwnXG4gIH1cbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
