const mongoose = require('mongoose');

// User Schema
const PictureSchema = mongoose.Schema({
	filename: {
		type: String,
		index:true
	}
});

const Picture = module.exports = mongoose.model('Pictures', PictureSchema);
