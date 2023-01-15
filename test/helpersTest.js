const { assert } = require('chai');

const { getUserByEmail, shortURLExists, urlsForUser, generateRandomString } = require('../helpers.js');

/////// TEST DATABASES ////////
const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testURLDatabase = {
  k4LaD5: {
    userID: "o4kL2A" ,
    longURL: "https://google.ca"
  },

  asf4KO: {
    longURL: "https://lighthouselabs.ca",
    userID: "o4kL2A"
  },
  
  La4F11: {
    userID: "KAgsd2",
    longURL: "https://facebook.com"
  }
};


//// Test for getUserByEmail() function ////
describe('getUserByEmail', function() {
  it('should return a user with the given email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.equal(user.id, expectedUserID);
  });

  it('should return undefined when the email doesn\'t exist', () => {
    const user = getUserByEmail('idontexist@hotmail.com', testUsers);
    assert.equal(user, undefined);
  });
});


//// Test for shortURLExists() function ////
describe('shortURLExists', function() {
  it('should return true if shortURL id is in the database', function() {
    const shortURL = "k4LaD5";
    assert.equal(shortURLExists(shortURL, testURLDatabase), true);
  });

  it('should return false if shortURL is not in the database', () => {
    const shortURL = "at4OT1";
    assert.equal(shortURLExists(shortURL, testURLDatabase), false);
  });
});


//// Test for urlsForUser() function ////
describe('urlsForUser', function() {
  it('should return urls owned by only the given userID', function() {
    const userID = "o4kL2A";
    const expectedURLS = {
      k4LaD5: {
        userID: "o4kL2A" ,
        longURL: "https://google.ca"
      },
    
      asf4KO: {
        longURL: "https://lighthouselabs.ca",
        userID: "o4kL2A"
      },
    };
    assert.deepEqual(urlsForUser(userID, testURLDatabase), expectedURLS);
  });

  it('should return an empty object if the given userID owns no shortURLs', function() {
    const userID = "J5Fs6l";
    const expectedURLS = {};
    assert.deepEqual(urlsForUser(userID, testURLDatabase), expectedURLS);
  });
});


//// Test for generateRandomString() function ////
describe('generateRandomString', function() {
  it('should generate a random string 6 characters long', function() {
    const actualLength = generateRandomString().length;
    const expectedLength = 6;
    assert.equal(actualLength, expectedLength);
  });

  it('should generate a random string every time it is called', function() {
    const randomStringOne = generateRandomString();
    const randomStringTwo = generateRandomString();
    assert.notEqual(randomStringOne, randomStringTwo);
  });
});

