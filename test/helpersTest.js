const { assert } = require('chai');

const { getUserByEmail } = require("../helper");

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "3lk123": {
    id: "3lk123", 
    email: "pokemon@master.com", 
    password: "ash-ketchum"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    // Write your assert statement here
  });
  it('should return undefined when looking for a non-existent email', () => {
    const user = getUserByEmail('wow@power.com', testUsers);
    assert.equal(user, undefined);
  });
  it('should return a user with valid email', function() {
    const user = getUserByEmail("pokemon@master.com", testUsers)
    const expectedUserID = "3lk123";
    // Write your assert statement here
  });
});