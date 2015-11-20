var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
	body: String,
	author: String,
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

mongoose.model('Comment', CommentSchema);