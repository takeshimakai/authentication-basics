const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongoDb = "mongodb+srv://***REMOVED***:***REMOVED***@cluster0.bx1ul.mongodb.net/authentication-basics?retryWrites=true&w=majority";
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
  })
);

const app = express();
app.set("views", path.join(__dirname, 'views'));
app.set("view engine", "pug");

// Validate log in credentials
passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username }, (err, user) => {
      if (err) return done(err);
      if (!user) {
        return done(null, false, { message: 'Incorrect username' });
      }
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Incorrect password' });
        }
      })
    });
  })
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// Routes
app.get("/", (req, res) => res.render("index"));

app.get('/sign-up', (req, res) => res.render('sign-up-form'));

app.post('/sign-up', (req, res, next) => {
  bcrypt.hash(req.body.password, 10, (err, hashedPw) => {
    if (err) return next(err);
    new User({
      username: req.body.username,
      password: hashedPw
    }).save((err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  })
});

app.post('/log-in', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/'
}));

app.get('/log-out', (req, res) => {
  req.logout();
  res.redirect('/');
})

app.listen(3000, () => console.log("app listening on port 3000!"));