var app = angular.module('app', ['ui.router']);

app.config(['$stateProvider', '$urlRouterProvider', 
	function($stateProvider, $urlRouterProvider) {

	$stateProvider
		.state('home', {
			url: '/home',
			templateUrl: 'partials/home.html',
			resolve:{
				userPromise: function(users, $http) {
			   		users.getAll();
			    }
			}
		})
		.state('user', {
			url: '/user/{id}',
			templateUrl: 'partials/user.html',
			controller: 'UserCtrl',
			resolve: {
				user: function($stateParams, users) {
					console.log('Fetching user');
					return users.get($stateParams.id);
				}
			}
		})

	$urlRouterProvider.otherwise('home');
}]);

app.factory('auth', ['$http', '$window', function($http, $window) {
	var auth = {};

	auth.saveToken = function(token) {
		$window.localStorage['userpage-token'] = token;
	};

	auth.getToken = function() {
		return $window.localStorage['userpage-token'];
	};

	auth.isLoggedIn = function() {
		var token = auth.getToken();

		if(token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			
			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function(){
		if(auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload;
		}
	};

	auth.register = function(user){
		return $http.post('/home/register', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	auth.logIn = function(user) {
		return $http.post('/home/login', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function() {
		$window.localStorage.removeItem('userpage-token');
		console.log('logging out');
	};

	return auth;
}]);

app.factory('users', ['$http', '$window', function($http, $window){
	var o = {
		users: []
	}

	o.getAll = function() {
		return $http.get('/home').success(function(data) {
			angular.copy(data, o.users);
		})
	};

	o.createUser = function(user) {
		console.log('Adding new user');
		return $http.post('/home', user).success(function(data) {
			o.users.push(data);
		});
	};

	o.get = function(id) {
		return $http.get('/user/' + id).success(function(res) {
			return res;
		});
	};

	o.addComment = function(comment, id) {
		return $http.post('/user/' + id, comment);
	};

	o.emptyComments = function(id) {
		return $http.delete('/user/' + id).success(function(data) {
			console.log('Deleted comments');
		});
	};

	o.upvote = function(currentUser, user) {
		return $http.put('/user/' + user._id + '/upvote/' + currentUser._id).success(function(data) {
			console.log('User added');

			// Instantly update
			user.upvotes += 1;
			user.hasVoted = true;
		});
	};

	return o;
}]);

app.controller('MainCtrl', ['$scope', 'users', 'auth', function($scope, users, auth){
	$scope.users = users.users;

	$scope.isLoggedIn = auth.isLoggedIn();
	$scope.currentUser = auth.currentUser();

	$scope.logOut = function() {
		auth.logOut();
		location.reload();
	}
}]);

app.controller('UserCtrl', ['$scope', '$stateParams', 'users', 'user', 'auth', function($scope, $stateParams, users, user, auth){

	// Get global user data
	var user = user.data;

	// Store global user in local scope
	$scope.user = user;
	// Locally display favorites
	$scope.user.upvotes = user.favorites.length;

	$scope.isLoggedIn = auth.isLoggedIn();
	$scope.currentUser = auth.currentUser();

	if($scope.isLoggedIn) {
		for(var i = 0; i < user.favorites.length; i++) {
			if(user.favorites[i].username == $scope.currentUser.username) {
				user.hasVoted = true;
			}
		}
	}
	
	$scope.addComment = function() {

		// Inject 2 params into service funct addComment()
		users.addComment({
			body: $scope.body,
			author: $scope.currentUser.username
		}, $stateParams.id).success(function(comment) {
			// Store new comment in local var
			$scope.user.comments.push(comment);
		});

		// Reset comment input
		$scope.body = '';
	};

	// Delete all comments
	$scope.emptyComments = function() {

		// Call service funct
		users.emptyComments($stateParams.id).success(function(){
			console.log('erased comments');
			$scope.user.comments = [];
		});
	};

	$scope.upvote = function(user) {
		// user.favorites.push(user);
		users.upvote($scope.currentUser, user);
	};

}]);

app.controller('LoginCtrl', ['$scope', 'users', 'auth', '$state', function($scope, users, auth, $state){
	
	$scope.user = {};

	var dateObj = new Date();
	var month = dateObj.getUTCMonth() + 1;
	var day = dateObj.getUTCDate();
	var year = dateObj.getUTCFullYear();

	newdate = year + "-" + month + "-" + day;

	$scope.user.regDate = newdate;

	$scope.register = function() {
		auth.register($scope.user).error(function(error) {
			$scope.error = error
		}).then(function(){
			$scope.show = false;
			location.reload();
		});
	};

	$scope.login = function() {
		auth.logIn($scope.user).error(function(error) {
			$scope.error = error;
		}).then(function() {
			console.log('logged in');
			$scope.show = false;
			location.reload();
		});
	};

	$scope.show = false;
	$scope.toggle = function(state) {
		$scope.state = state;
		if($scope.show == false) {
			$scope.show = true;
		} else { $scope.show = false; }
	};
}]);


