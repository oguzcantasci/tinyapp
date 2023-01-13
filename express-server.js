///// Express Server //////
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

////// Packages //////
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");




///// Middleware /////

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

// Helper to get userID //
const urlsForUser = function(id) {
  let urls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key];
    }
  }
  return urls;
};

// Helper to check if a shortURL exists

const shortURLExists = function(shortURL) {
  for (let key of urlDatabase) {
    if (shortURL === key) {
      return true;
    }
  }
  return false;
};

////////// END OF HELPER FUNCTIONS //////////


//////////// DATABASES /////////////

// Our Database of shortURLS and longURLs //
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
  users[userID] = {id: userID, email: req.body.email, password: bcrypt.hashSync(req.body.password) };
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
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: currentUser.id};
  res.redirect(`/urls/${shortURL}`);
});

// Route handler to show all URLs
app.get("/urls", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.send("Please log in to see your shortURLs");
  }
  const templateVars = { user: currentUser, urls: urlsForUser(currentUser.id) };
  res.render("urls_index", templateVars);
});

// Route handler to redirect a shortURL to the longURL
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("There's no such shortURL!!!");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// Route handler to show newly created shortURL and the corresponding longURL
app.get("/urls/:id", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.send("You are not logged in!");
  } else if (currentUser.id !== urlDatabase[req.params.id].userID) {
    return res.send("Not your shortURL!");
  }
  const templateVars = { user: currentUser, id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

// Route handler for editing a shortURL
app.post("/urls/:id", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.send("Can't edit if you are not a registered user!!!");
  } else if (currentUser.id !== urlDatabase[req.params].id) {
    return res.send("Can't edit a shortURL that is not yours");
  } else if (!shortURLExists) {
    return res.send("There is no such shortURL");
  }
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

// Route handler for the deletition of a shortURL entry
app.post("/urls/:id/delete", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.send("Can't delete if you are not a registered user!!!");
  } else if (currentUser.id !== urlDatabase[req.params].id) {
    return res.send("Can't delete a shortURL that is not yours");
  } else if (!shortURLExists) {
    return res.send("There is no such shortURL");
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Route handler for the home page
app.get("/", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

///////// END OF ROUTE HANDLERS //////////


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});