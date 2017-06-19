var express = require('express');
var multer = require('multer');
var router = express.Router();


// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	res.render('index');
});

router.post('/', function (req, res) {
  var storage = multer.diskStorage({
      destination: function (req, file, cb) {
          cb(null, 'public/uploads/')
      },
      filename: function (req, file, cb) {
          cb(null, file.fieldname + '-' + Date.now() + '.jpg')
      }
  });

  var upload = multer({ storage: storage }).single('avatar');

  upload(req, res, function (err) {
      if (err) {
          // An error occurred when uploading
      }
      res.json({
          success: true,
          message: 'Image uploaded!'
      });

      // Everything went fine
  })
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router;
