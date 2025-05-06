require("dotenv").config();
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const path = require("path");
const bcrypt = require("bcrypt");
const { loginCheck, newAccountCheck, addKnownDevice } = require("./auth");
const dbPromise = require("./db");

let db;
(async () => {
  db = await dbPromise;
})();

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.use(
  session({
    store: new SQLiteStore({ db: "database.db", table: "sessions" }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV == "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);

const PORT = 8080;
const router = express.Router();

// Verify session middleware
function isAuthenticated(req, res, next) {
  if (req.session && req.session.status == "verified") {
    return next();
  }
  res.status(401).send("Unauthorized");
}

router.get("/", async function (req, res) {
  res.render("index", { title: "Welcome!" });
});

router.get("/signup", async function (req, res) {
  res.render("signup");
});

router.get("/profile", isAuthenticated, (req, res) => {
  res.render("profile", { username: req.session.username });
});

router.get("/otp", (req, res) => {
  res.render("otp");
});

router.post("/api/login", async function (req, res) {
  const { username, password, sealedResult } = req.body;

  const result = await loginCheck({ username, password, sealedResult });
  const status = result.status;

  if (!result.success) {
    return res
      .status(401)
      .send({ success: false, message: "Failed to log in." });
  }

  req.session.username = username;
  req.session.status = status;
  req.session.visitorId = result.visitorId;

  if (status == "mfa_required") {
    req.session.otp = "123456"; // Generate and send a real OTP here
    return res.json({ success: true, redirectUrl: "/otp" });
  }

  return res.json({ success: true, redirectUrl: "/profile" });
});

router.post("/api/otp", async function (req, res) {
  const { otp } = req.body;

  // Verify the OTP
  if (!req.session || !req.session.otp || !otp == req.session.otp) {
    return res
      .status(401)
      .send({ success: false, message: "Failed to verify passcode." });
  }

  // Add the visitor's device to the database
  await addKnownDevice({
    username: req.session.username,
    visitorId: req.session.visitorId,
  });

  // Update session and redirect to the profile page
  req.session.status = "verified";
  delete req.session.otp;
  res.send({ success: true, redirectUrl: "/profile" });
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Logout error");
    return res.redirect("/");
  });
});

router.post("/api/create-user", async function (req, res) {
  const { username, password, sealedResult } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  const result = await newAccountCheck(username, password_hash, sealedResult);
  if (!result.success) {
    return res
      .status(401)
      .send({ success: false, message: "Failed to create new account." });
  }

  // Add the visitor's device to the database
  await addKnownDevice({
    username,
    visitorId: result.visitorId,
  });

  return res.json({
    success: true,
    message: `Successfully created user ${username}`,
    redirectUrl: "/",
  });
});

app.use("/", router);

app.listen(PORT, function () {
  console.log(`Server running! http://localhost:${PORT}`);
});
