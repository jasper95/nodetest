var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var multer = require('multer');

var User = require('../models/user');


var storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, 'public/uploads/avatars/')
		},
		filename: function (req, file, cb) {
			const ext = file.originalname.split('.').pop()
			cb(null, req.body.username+'.'+ext)
		}
});

function validateRegisterForm(req){
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	//req.checkBody('ext', 'Not a valid image').isValidImage();
}

var upload = multer({
	 storage: storage,
	 fileFilter: function(req, file, cb){
			validateRegisterForm(req)
			req.getValidationResult().then(function(result) {
				cb(null, result.isEmpty())
			});
	 }
});

// Register
router.get('/register', function(req, res){
	if(req.isAuthenticated())
		res.redirect('/');
	else{
		const oldForm = req.session.oldForm;
		if(oldForm)
			delete req.session.oldForm;
		res.render('register', {'old_form' : oldForm});
	}
});

// Login
router.get('/login', function(req, res){
	if(req.isAuthenticated())
		res.redirect('/');
	else{
		const oldFormUsername = req.session.oldFormUsername;
		if(oldFormUsername)
			delete req.session.oldFormUsername;
		res.render('login', {'oldFormUsername' : oldFormUsername});
	}
});

// Register User
router.post('/register', upload.single('avatar'), function(req, res){
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var hasAvatar = (req.file) ? true : false;

	if(!hasAvatar)
		validateRegisterForm(req);
	req.getValidationResult().then(function(errors) {
		if(errors.isEmpty()){
			User.getUserByUsername(req.body.username.toLowerCase(), function(err, user){
					if(err) throw err;
					if(user)
						req.checkBody('username', 'Username already exists').notEqual(user.username.toLowerCase());
					if(!errors.isEmpty()){
						req.flash('form_errors', errors.array());
						req.session.oldForm = {
							name : name,
							email: email,
							username: username,
							password: password,
							password2: password2,
						};
						res.redirect('/users/register')
					} else {
						const newUser = new User({
							name: name,
							email:email,
							username: username,
							password: password,
							hasAvatar : hasAvatar
						});

						User.createUser(newUser, (err, user) => {
							if(err) throw err;
						});
						req.flash('success_msg', 'You are registered and can now login');
						res.redirect('/users/login');
					}
			});
		}
	});
});

passport.use(new LocalStrategy(
  function(username, password, done) {
   User.getUserByUsername(username, function(err, user){
   	if(err) throw err;
   	if(!user){
   		return done(null, false, {message: 'Unknown User'});
   	}

   	User.comparePassword(password, user.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, user);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login',failureFlash: true}),
  function(req, res) {
    res.redirect('/');
  });

router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});

module.exports = router;
