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

// Database of shortURLS and longURLs //
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

// User Database //
const users = {};


///////// ROUTE HANDLERS //////////

// Route handler for the home page
app.get("/", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});


// Route handler to show all URLs
app.get("/urls", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.send("Please log in to see your shortURLs");
  }
  const templateVars = { user: currentUser, urls: helpers.urlsForUser(currentUser.id, urlDatabase) };
  res.render("urls_index", templateVars);
});

// Route handler to show shortURL submision form
app.get("/urls/new", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.redirect("/login");
  }
  const templateVars = {user: currentUser};
  res.render("urls_new", templateVars);
});

// Route handler to show newly created shortURL and the corresponding longURL
app.get("/urls/:id", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.send("You are not logged in!");
  } else if (!helpers.shortURLExists(req.params.id, urlDatabase)) {
    return res.send("There is no such shortURL in the database!");
  } else if (currentUser.id !== urlDatabase[req.params.id].userID) {
    return res.send("Not your shortURL!");
  }
  const templateVars = { user: currentUser, id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});


// Route handler to redirect a shortURL to the longURL
app.get("/u/:id", (req, res) => {
  if (!helpers.shortURLExists(req.params.id, urlDatabase)) {
    return res.send("There's no such shortURL!!!");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});


// Route handler for handling the shortURL submission
app.post("/urls", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    res.send("You are not logged in!!!");
  }
  const shortURL = helpers.generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: currentUser.id};
  res.redirect(`/urls/${shortURL}`);
});


// Route handler for editing a shortURL
app.post("/urls/:id", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.send("Can't edit if you are not a registered user!!!");
  } else if (currentUser.id !== urlDatabase[req.params.id].userID) {
    return res.send("Can't edit a shortURL that is not yours");
  } else if (!helpers.shortURLExists(urlDatabase[req.params.id], urlDatabase)) {
    return res.send("There is no such shortURL");
  }
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});


// Route handler for the deletition of a shortURL entry
app.post("/urls/:id/delete", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.send("Can't delete if you are not a registered user!!!");
  } else if (currentUser.id !== urlDatabase[req.params.id].userID) {
    return res.send("Can't delete a shortURL that is not yours");
  } else if (!helpers.shortURLExists(req.params.id, urlDatabase)) {
    return res.send("There is no such shortURL");
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});


// Route handler to show the login page
app.get("/login", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (currentUser) {
    return res.redirect("/urls");
  }
  const templateVars = { user: currentUser };
  res.render("login", templateVars);
});


// Route handler to show the registration page
app.get("/register", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (currentUser) {
    return res.redirect("/urls");
  }
  const templateVars = {user: currentUser};
  res.render("register", templateVars);
});


// Route handler for the login submission
app.post("/login", (req, res) => {
  const user = helpers.getUserByEmail(req.body.email, users);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.statusCode = 403;
    return res.send("Email or password doesn't match!");
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});


// Route handler for the registration submission
app.post("/register", (req, res) => {
  if (req.body.email.trim() === "" || req.body.password.trim() === "") {
    return res.send("Email and password fields cannot be blank");
  }
  if (helpers.getUserByEmail(req.body.email, users)) {
    return res.send("This email is already associated with an existing user");
  }

  const userID = helpers.generateRandomString();
  users[userID] = {id: userID, email: req.body.email, password: bcrypt.hashSync(req.body.password) };
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