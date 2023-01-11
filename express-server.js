const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require('cookie-parser');
app.use(cookieParser());


app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");


////////// HELPER FUNCTIONS //////////

// Helper function to generate unique shortURL id
const generateRandomString = function(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// Helper function to find user by email
const getUserByEmail = function(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
};

////////// END OFHELPER FUNCTIONS //////////


//////////// DATABASES /////////////

// Our Database of shortURLS and longURLs //
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// User Database //
const users = {};

//////////// END OF DATABASES /////////////


///////// ROUTE HANDLERS //////////

// Route handler to show shortURL submision form
app.get("/urls/new", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.redirect("/login");
  }
  const templateVars = {user: currentUser};
  res.render("urls_new", templateVars);
});

// Route handler to show the registration page
app.get("/register", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (currentUser) {
    return res.redirect("/urls");
  }
  const templateVars = {user: currentUser};
  res.render("register", templateVars);
});

// Route handler for the registration submission
app.post("/register", (req, res) => {
  if (req.body.email.trim() === "" || req.body.password.trim() === "") {
    res.statusCode = 400;
    return res.end();
  }

  if (getUserByEmail(req.body.email)) {
    res.statusCode = 400;
    return res.end();
  }

  const userID = generateRandomString(6);
  users[userID] = {id: userID, email: req.body.email, password: req.body.password};
  res.cookie("user_id", userID);
  res.redirect("/urls");
});

// Route handler to show the login page
app.get("/login", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (currentUser) {
    return res.redirect("/urls");
  }
  const templateVars = { user: currentUser };
  res.render("login", templateVars);
});

// Route handler for the login submission
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email);
  if (!user) {
    res.statusCode = 403;
    return res.end();
  }
  if (user.password !== req.body.password) {
    res.statusCode = 403;
    return res.end();
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

// Route handler for the logout submission
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Route handler for handling the shortURL submission
app.post("/urls", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    res.send("You are not logged in!!!");
  }
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// Route handler to show all URLs
app.get("/urls", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = { user: currentUser, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Route handler to redirect a shortURL to the longURL
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("There's no such shortURL!!!");
  }
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// Route handler to show newly created shortURL and the corresponding longURL
app.get("/urls/:id", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = { user: currentUser, id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// Route handler for editing a shortURL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

// Route handler for the deletition of a shortURL entry
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Route handler for the home page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

///////// END OF ROUTE HANDLERS //////////


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});