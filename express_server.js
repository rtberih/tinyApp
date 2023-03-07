const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { generateRandomString, getUserByEmail, urlsForUser } = require("./helper");

app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['pokemon'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};
// users and password for accounts that register
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "helloworld"
  }
};

// on link localhost:8080 shows hello
app.get("/", (req, res) => {
  res.redirect("login")
});
// on link localhost:8080/urls.json shows object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
// on link localhost:8080/hello shows html style Hello World
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//THIS IS THE SHORT URL PATH THAT REDIRECTS YOU TO THE LONG URL WEBPAGE
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]){
    res.status(404).send("The short url you have attempted to access does not exist")
    return;
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.status(401).send("You must be logged in with a valid account to see short URLs.");
  }
  const user = users[user_id];
  const templateVars = { 
    urls: urlsForUser(user_id, urlDatabase), 
    user: user 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let user_id = req.session.user_id;
  if (!user_id) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new",templateVars);
});

app.use(bodyParser.urlencoded({extended: true}));

app.post("/urls", (req, res) => {
  let longUrl = req.body.longURL;  // Log the POST request body to the console
  let shortUrl = generateRandomString();
  //adds a short url (random generated) and long url to the database
  urlDatabase[shortUrl] = {
    longURL : longUrl,
    userID : req.session.user_id
  };
  const templateVars = {
    shortURL :shortUrl,
    longURL : longUrl,
    user : users[req.session.user_id]
  };
  return res.render("urls_show", templateVars);
});

// sends user to the edit url page /urls/SAKDAL
app.get("/urls/:shortURL",(req, res)=>{
  let user_id = req.session.user_id;
  if (!user_id) {
    return res.status(401).send("You must be logged in with a valid account to see short URLs.");
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(400).send("This url doesn't exist");
  }
  const myUrls = urlsForUser(user_id, urlDatabase);
  if (Object.keys(myUrls).length < 1) {
    return res.status(401).send("you are not permitted to edit");
  }
  const templateVars = {
    shortURL : req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id]
  };
  
  res.render("urls_show", templateVars);
});

// deletes a url on url page
app.post("/urls/:shortURL/delete", (req, res) => {
  let user_id = req.session.user_id;
  if (!user_id) {
    return res.status(401).send("You must be logged in with a valid account to see short URLs.");
  }
  //doesnt allow other user to delete
  const myUrls = urlsForUser(user_id, urlDatabase);
  if (Object.keys(myUrls).length < 1) {
    return res.status(401).send("you are not permitted to delete");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// edit a url on url page
app.post("/urls/:shortURL", (req, res) => {
  let user_id = req.session.user_id;
  if (!user_id) {
    return res.status(401).send("You must be logged in with a valid account to see short URLs.");
  }
  const myUrls = urlsForUser(user_id, urlDatabase);
  if (Object.keys(myUrls).length < 1) {
    return res.status(401).send("you are not permitted to edit");
  }
  const updateUrl = req.body.update_Urls;
  urlDatabase[req.params.shortURL].longURL = updateUrl;
  res.redirect("/urls");
});

// logout in the header
app.post("/logout", (req, res) => {
  req.session =  null;
  res.redirect("/login");
});

// registration page
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: null
    };
    res.render("urls_register", templateVars);
  }
});

// creating a new user and password
app.post("/register",(req, res) =>{
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400).send("Use a proper Email or Password");
  } else if (getUserByEmail(email, users)) {
    res.status(400).send("An account already exists for this email address");
  } else {
    const user = {
      id : id,
      email : email,
      password : bcrypt.hashSync(password, 10)
    };
    users[id] = user;
    req.session.user_id = id;
    res.redirect("/urls");
  }
});
// creates login window
app.get("/login", (req, res) => {
  const templateVars = {
    user: null
  };
  res.render("urls_login", templateVars);
});
// logins in user to the tiny app
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.id;
      res.redirect("/urls");
    } else {
      res.send("invaild password");
    }
  } else {
    res.send("invaild email");
  }
});