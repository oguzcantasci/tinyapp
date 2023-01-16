/* eslint-disable camelcase */
///// Express Server //////
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

////// Packages //////
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const helpers = require("./helpers");


///// Middleware /////
app.use(cookieSession({
  name: 'session',
  keys: ["TobeyMaguireSupremacy", "IOfferedYouFriendship", "AndYouSpatInMyFace"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(express.urlencoded({ extended: true }));

// Set the view engine to EJS //
app.set("view engine", "ejs");



//////////// DATABASES /////////////
const db = require('./database');


///////// ROUTE HANDLERS //////////

// Route handler for the home page
app.get("/", (req, res) => {
  const currentUser = db.users[req.session.user_id];
  if (!currentUser) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});


// Route handler to show all URLs
app.get("/urls", (req, res) => {
  const currentUser = db.users[req.session.user_id];
  if (!currentUser) {
    const error = "You are not logged in!!!";
    const templateVars = {error: error, user: currentUser};
    return res.render("error", templateVars);
  }
  const templateVars = { user: currentUser, urls: helpers.urlsForUser(currentUser.id, db.urlDatabase) };
  res.render("urls_index", templateVars);
});

// Route handler to show shortURL submision form
app.get("/urls/new", (req, res) => {
  const currentUser = db.users[req.session.user_id];
  if (!currentUser) {
    return res.redirect("/login");
  }
  const templateVars = {user: currentUser};
  res.render("urls_new", templateVars);
});

// Route handler to show newly created shortURL and the corresponding longURL
app.get("/urls/:id", (req, res) => {
  const currentUser = db.users[req.session.user_id];
  const templateVars = { user: currentUser, id: req.params.id, longURL: db.urlDatabase[req.params.id].longURL };
  if (!currentUser) {
    const error = "You are not logged in!";
    templateVars["error"] = error;
    return res.render("error", templateVars);
  } else if (!helpers.shortURLExists(req.params.id, db.urlDatabase)) {
    const error = "There is no such shortURL in the database!";
    templateVars["error"] = error;
    return res.render("error", templateVars);
  } else if (currentUser.id !== db.urlDatabase[req.params.id].userID) {
    const error = "Not your shortURL!";
    templateVars["error"] = error;
    return res.render("error", templateVars);
  }
  
  res.render("urls_show", templateVars);
});


// Route handler to redirect a shortURL to the longURL
app.get("/u/:id", (req, res) => {
  if (!helpers.shortURLExists(req.params.id, db.urlDatabase)) {
    const error = "There's no such shortURL!!!";
    const templateVars = {error: error, user: db.users[req.session.user_id] };
    return res.render("error", templateVars);
  }
  const longURL = db.urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});


// Route handler for handling the shortURL submission
app.post("/urls", (req, res) => {
  const currentUser = db.users[req.session.user_id];
  if (!currentUser) {
    const error = "You are not logged in!!!";
    const templateVars = {error: error, user: db.users[req.session.user_id] };
    return res.render("error", templateVars);
  }
  if (req.body.longURL.trim() === "") {
    const error = "URL field cannot be left blank!\nPlease enter a valid URL";
    const templateVars = {error: error, user: db.users[req.session.user_id] };
    return res.render("error", templateVars);
  }
  const shortURL = helpers.generateRandomString();
  db.urlDatabase[shortURL] = { longURL: req.body.longURL, userID: currentUser.id};
  res.redirect(`/urls/${shortURL}`);
});


// Route handler for editing a shortURL
app.post("/urls/:id", (req, res) => {
  const currentUser = db.users[req.session.user_id];
  console.log("edit posted");
  if (!currentUser) {
    const error = "Can't edit if you are not a registered user!!!";
    const templateVars = {error: error, user: currentUser };
    return res.render("error", templateVars);
  } else if (currentUser.id !== db.urlDatabase[req.params.id].userID) {
    const error = "Can't edit a shortURL that is not yours";
    const templateVars = {error: error, user: currentUser };
    return res.render("error", templateVars);
  } else if (!helpers.shortURLExists(req.params.id, db.urlDatabase)) {
    const error = "There is no such shortURL";
    const templateVars = {error: error, user: currentUser };
    return res.render("error", templateVars);
  } else if (req.body.longURL.trim() === "") {
    const error = "URL field cannot be left blank!\nPlease enter a valid URL";
    const templateVars = {error: error, user: currentUser };
    return res.render("error", templateVars);
  }
  db.urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});


// Route handler for the deletition of a shortURL entry
app.post("/urls/:id/delete", (req, res) => {
  const currentUser = db.users[req.session.user_id];
  if (!currentUser) {
    const error = "Can't delete if you are not a registered user!!!";
    const templateVars = {error: error, user: currentUser };
    return res.render("error", templateVars);
  } else if (currentUser.id !== db.urlDatabase[req.params.id].userID) {
    const error = "Can't delete a shortURL that is not yours";
    const templateVars = {error: error, user: currentUser };
    return res.render("error", templateVars);
  } else if (!helpers.shortURLExists(req.params.id, db.urlDatabase)) {
    const error = "There is no such shortURL";
    const templateVars = {error: error, user: currentUser };
    return res.render("error", templateVars);
  }
  delete db.urlDatabase[req.params.id];
  res.redirect("/urls");
});


// Route handler to show the login page
app.get("/login", (req, res) => {
  const currentUser = db.users[req.session.user_id];
  if (currentUser) {
    return res.redirect("/urls");
  }
  const templateVars = { user: currentUser };
  res.render("login", templateVars);
});


// Route handler to show the registration page
app.get("/register", (req, res) => {
  const currentUser = db.users[req.session.user_id];
  if (currentUser) {
    return res.redirect("/urls");
  }
  const templateVars = {user: currentUser};
  res.render("register", templateVars);
});


// Route handler for the login submission
app.post("/login", (req, res) => {
  const user = helpers.getUserByEmail(req.body.email, db.users);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    const error = "Email or password doesn't match!";
    const templateVars = {error: error, user: db.users[req.session.user_id] };
    return res.render("error", templateVars);
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});


// Route handler for the registration submission
app.post("/register", (req, res) => {
  if (req.body.email.trim() === "" || req.body.password.trim() === "") {
    const error = "Email and password fields cannot be blank";
    const templateVars = {error: error, user: db.users[req.session.user_id] };
    return res.render("error", templateVars);
  }
  if (helpers.getUserByEmail(req.body.email, db.users)) {
    const error = "This email is already associated with an existing user";
    const templateVars = {error: error, user: db.users[req.session.user_id] };
    return res.render("error", templateVars);
  }

  const userID = helpers.generateRandomString();
  db.users[userID] = {id: userID, email: req.body.email, password: bcrypt.hashSync(req.body.password) };
  req.session.user_id = userID;
  res.redirect("/urls");
});


// Route handler for the logout submission
app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.redirect("/login");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});