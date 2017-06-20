var mongoose = require('mongoose');

// User Schema
var PictureSchema = mongoose.Schema({
	filename: {
		type: String,
		index:true
	}
});

var Picture = module.exports = mongoose.model('Pictures', PictureSchema);
