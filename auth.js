const bcrypt = require("bcrypt");
const dbPromise = require("./db");
let db;
(async () => {
  db = await dbPromise;
})();

async function newAccountCheck(username, password_hash) {
  // Add new user
  await db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)", [
    username,
    password_hash,
  ]);

  return { success: true };
}

async function loginCheck({ username, password }) {
  // MFA check
  let mfaRequired = false;

  // Verify the user's credentials
  const user = await validateCredentials({ username, password });
  if (!user) return { success: false };

  // Update login status
  const status = mfaRequired ? "mfa_required" : "verified";

  return { success: true, status };
}

async function validateCredentials({ username, password }) {
  const user = await db.get("SELECT * FROM users WHERE username = ? LIMIT 1;", [
    username,
  ]);

  if (!user) return null;

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) null;

  return {
    id: user.id,
    username: user.username,
  };
}

module.exports = {
  loginCheck,
  newAccountCheck,
};
