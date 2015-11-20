var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var UserSchema = new mongoose.Schema({
	username: {type: String, lowercase: true, unique: true},
	comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
	upvotes: {type: Number, default: 0},
	test: {type: Number, default: 0},
	regDate: String,
	hash: String,
	salt: String,
	favorites: Array
});

UserSchema.methods.upvote = function(user, cb) {
	this.upvotes += 1;
	this.test += 1;
	this.favorites.push(user);
	this.save(cb);
};

// Hashes and salts passowrd
UserSchema.methods.setPassword = function(password) {
	this.salt = crypto.randomBytes(16).toString('hex');

	this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.validPassword = function(password) {
	var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
	return this.hash === hash;
};

// expiration token
UserSchema.methods.generateJWT = function() {

	// Set exipration to 60 days
	var today = new Date();
	var exp = new Date(today);
	exp.setDate(today.getDate() + 60);

	return jwt.sign({
			_id: this._id,
			username: this.username,
			exp: parseInt(exp.getTime() / 1000),
		}, 'SECRET');
};


mongoose.model('User', UserSchema);