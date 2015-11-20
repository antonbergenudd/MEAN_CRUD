var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Comment = mongoose.model('Comment');
var passport = require('passport');
var jwt = require('express-jwt');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/home', function(req, res, next) {
	User.find(function(err, users) {
		if(err) {return next(err);}

		res.json(users);
	})
});

router.param('user', function(req, res, next, id) {
	var query = User.findById(id);

	query.exec(function (err, user) {
		if(err) {return next(err);}
		if(!user) { return next(new Error('cant find user')); }

		req.user = user;
		return next();
	});
});


router.post('/user/:user', function(req, res, next) {
	var comment = new Comment(req.body);

	comment.user = req.user;

	comment.save(function(err, comment) {
		if(err) {return next(err);}
		
		req.user.comments.push(comment);

		req.user.save(function(err, user) {
			if(err) {return next(err);}

			res.json(comment);
		})
	});
});

router.get('/user/:user', function(req, res, next) {
	req.user.populate('comments', function(err, comment) {
		if(err) {return next(err);}

		res.json(comment);
	})
});

// // Upvote post
// router.put('/user/:user', function(req, res, next) {
//   req.user.upvote(function(err, user){
//     if (err) { return next(err); }

//     res.json(user);
//   });
// });

// Upvote post
router.post('/user/:user/upvote', function(req, res, next) {
	var user = {};
	user.username = req.body.username;
	user.id = req.body._id;

	req.user.save(function(err, user) {
		if(err) {return next(err);}

		res.json(user);
	});
});

router.put('/user/:user/upvote/:currentuser', function(req, res, next) {

	User.findById(req.params.currentuser, function(err, currentuser) {
		if(err) {return next(err)}

		var user = req.user;
		var results = 0;

		if(user.favorites.length > 0) {
			// Compare each user in array with current user
			for(var i = 0; i < user.favorites.length; i++) {
				if(user.favorites[i].username == currentuser.username) {
					results++;
				}
			}

			if(results == 0) {
				// Found 1 or more users
				user.favorites.push(currentuser);

				user.save(function(err, user) {
					if(err) {return next(err);}

					res.json(user);
				});
			} else {
				// Find no users equal to the one sent in
				// res.json();
			}
		} 
		// If the array is empty 
		else {
			user.favorites.push(currentuser);

			user.save(function(err, user) {
				if(err) {return next(err);}

				res.json(user);
			});
		};
	});
})




router.delete('/user/:user', function(req, res) {
	return Comment.find({ user: req.user._id }).remove(function(result) {
		res.json(result);
	});
});


router.post('/home', function(req, res, next) {
	var user = new User(req.body);

	user.save(function(err, user) {
		if(err) {return next(err);}

		res.json(user);
	})
});



// Kan vara User istället för user
router.post('/home/register', function(req, res, next) {
	if(!req.body.username || !req.body.password) {
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	var user = new User();

	user.username = req.body.username;

	user.setPassword(req.body.password);

	user.regDate = req.body.regDate;

	user.save(function (err) {
		if(err) {return next(err); }

		return res.json({token: user.generateJWT()})
	});
});

router.post('/home/login', function(req, res, next) {
	if(!req.body.username || !req.body.password) {
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	passport.authenticate('local', function(err, user, info) {
		if(err) {return next(err);}

		if(user) {
			return res.json({token: user.generateJWT()});
		} else {
			return res.status(401).json(info);
		}
	})(req, res, next);
});

module.exports = router;
