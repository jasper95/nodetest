var express = require('express');
var multer = require('multer');
var router = express.Router();
var Picture = require('../models/picture');
var randomstring = require('randomstring');

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
	var filename  = randomstring.generate() + '.jpg';
	var storage = multer.diskStorage({
      destination: function (req, file, cb) {
          cb(null, 'public/uploads/pictures')
      },
      filename: function (req, file, cb) {
          cb(null, filename)
      }
  });

  var upload = multer({ storage: storage }).single('avatar');

  upload(req, res, function (err) {
      if (err) throw err;
			Picture.create({filename : 'uploads/pictures/' + filename}, function(picErr, newPic){
				req.flash('success_msg','Picture successfully uploaded');
				res.redirect('/');
			})
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
