// Helper function to find user by email
const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
};

// Helper function to generate unique shortURL id
const generateRandomString = function() {
  let uniqueID = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    uniqueID += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return uniqueID;
};

// Helper to get userID //
const urlsForUser = function(id, urlDB) {
  let urls = {};
  for (let key in urlDB) {
    if (urlDB[key].userID === id) {
      urls[key] = urlDB[key];
    }
  }
  return urls;
};

// Helper to check if a shortURL exists
const shortURLExists = function(shortURL, urlDB) {
  for (let key in urlDB) {
    if (shortURL === key) {
      return true;
    }
  }
  return false;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
  shortURLExists
};