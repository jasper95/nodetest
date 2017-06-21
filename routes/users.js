const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const multer = require('multer');

const User = require('../models/user');


const storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, 'public/uploads/avatars/')
		},
		filename: function (req, file, cb) {
			const ext = file.originalname.split('.').pop()
			cb(null, req.body.username+'.'+ext)
		}
});

const validateRegisterForm = function(req){
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	req.checkBody('ext', 'Uploaded file not an image').isValidImage();
}

const upload = multer({
	storage: storage,
 	fileFilter: function(req, file, cb){
		const ext = file.originalname.split('.').pop();
		const isValidExt = (['jpg', 'png', 'jpeg'].indexOf(ext) >= 0);
		validateRegisterForm(req)
		req.getValidationResult().then(function(result) {
			cb(null, result.isEmpty() && isValidExt)
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
	const {name, email, username, password, password2, ext} = req.body;
	const hasAvatar = (req.file) ? true : false;
	const respondError = (req, errors) => {
		req.flash('form_errors', errors.useFirstErrorOnly().array());
		req.session.oldForm = {
			name : name,
			email: email,
			username: username,
			password: password,
			password2: password2,
		};
		res.redirect('/users/register')
	}

	if(!hasAvatar)
		validateRegisterForm(req);

	req.getValidationResult().then(errors => {
		if(errors.isEmpty()){
			User.getUserByUsername(req.body.username.toLowerCase(), (err, user) => {
					if(err) throw err;
					if(user)
						req.checkBody('username', 'Username already exists').notEqual(user.username.toLowerCase());
					if(!errors.isEmpty()){
						respondError(req, errors)
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
		} else {
			respondError(req, errors)
		}
	});
});

passport.use(new LocalStrategy(
  function(username, password, done) {
   User.getUserByUsername(username, function(err, user){
   	if(err) throw err;
   	if(!user){
   		return done(null, false, {message: 'Invalid username'});
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
