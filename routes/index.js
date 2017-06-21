const express = require('express');
const multer = require('multer');
const router = express.Router();
const Picture = require('../models/picture');
const randomstring = require('randomstring');

let isUploaded;
let filename;

const storage = multer.diskStorage({
		destination: function (req, file, cb) {
				cb(null, 'public/uploads/pictures')
		},
		filename: function (req, file, cb) {
				cb(null, filename)
		}
});
const upload = multer({
	storage: storage,
	fileFilter : (req, file, cb) => {
		const ext = file.originalname.split('.').pop();
		isUploaded = (['jpg', 'png', 'jpeg'].indexOf(ext) >= 0);
		if(isUploaded)
			filename = randomstring.generate()+'.'+ext;
		cb(null, isUploaded)
	}
}).single('avatar')

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	Picture.find({}, (err, pics) => {
		if(err) throw err;
		res.render('index',{
			pictures: pics
		});
	})
});

router.post('/', ensureAuthenticated, function (req, res) {
  upload(req, res, function (err) {
      if (err) throw err;
			if(isUploaded){

				Picture.create({filename : 'uploads/pictures/' + filename}, function(picErr, newPic){
					req.flash('success_msg','Picture successfully uploaded');
					res.redirect('/');
				})
			} else {
				req.flash('error_msg','Upload failed, not an image.');
				res.redirect('/');
			}
  })
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		res.redirect('/users/login');
	}
}

module.exports = router;
