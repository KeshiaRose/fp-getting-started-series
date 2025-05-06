// Bring in Fingerprint library
const {
  unsealEventsResponse,
} = require("@fingerprintjs/fingerprintjs-pro-server-api");

const bcrypt = require("bcrypt");
const dbPromise = require("./db");
let db;
(async () => {
  db = await dbPromise;
})();

// Check if the visitor is able to create a new account
async function newAccountCheck(username, password_hash, sealedResult) {
  // Unseal the identification event
  const identificationEvent = await unsealEventData(sealedResult);
  const visitorId = identificationEvent.products.identification.data.visitorId;

  // Bot detection
  const botDetected =
    identificationEvent.products.botd.data.bot.result != "notDetected";
  if (botDetected) return { success: false };

  // Check if the visitor has already created 3 accounts
  const numAccounts = await numAccountsDevice(visitorId);
  if (numAccounts >= 3) return { success: false };

  // Add new user
  await db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)", [
    username,
    password_hash,
  ]);

  return { success: true, visitorId };
}

// Check if the visitor is able to login
async function loginCheck({ username, password, sealedResult }) {
  // MFA check
  let mfaRequired = false;

  // Verify the user's credentials
  const user = await validateCredentials({ username, password });
  if (!user) return { success: false };

  // Unseal event results
  const identificationEvent = await unsealEventData(sealedResult);
  const visitorId = identificationEvent.products.identification.data.visitorId;

  // Bot detection
  const botDetected =
    identificationEvent.products.botd.data.bot.result != "notDetected";
  if (botDetected) return { success: false };

  // Suspect score
  const suspectScore = identificationEvent.products.suspectScore.data.result;
  if (suspectScore > 15) mfaRequired = true;

  // Check for known device
  const knownDevice = await checkKnownDevice({ username, visitorId });
  if (!knownDevice) mfaRequired = true;

  // Update login status
  const status = mfaRequired ? "mfa_required" : "verified";

  return { success: true, status, visitorId };
}

// Validate the user's credentials
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

// Unseal the Fingerprint event data
async function unsealEventData(sealedData) {
  const decryptionKey = process.env.FINGERPRINT_ENCRYPTION_KEY;

  const unsealedData = await unsealEventsResponse(
    Buffer.from(sealedData, "base64"),
    [
      {
        key: Buffer.from(decryptionKey, "base64"),
        algorithm: "aes-256-gcm",
      },
    ]
  );

  return unsealedData;
}

// Check if the visitor has already created an account with the same device
async function checkKnownDevice({ username, visitorId }) {
  const device = await db.get(
    "SELECT * FROM user_devices WHERE username = ? AND device_id = ?;",
    [username, visitorId]
  );

  if (!device) return false;

  return true;
}

// Check how many accounts are associated with the device
async function numAccountsDevice(visitorId) {
  const accounts = await db.get(
    "SELECT COUNT(DISTINCT username) AS cnt FROM user_devices WHERE device_id = ?",
    [visitorId]
  );

  return accounts.cnt;
}

// Add the visitor's device to the database
async function addKnownDevice({ username, visitorId }) {
  await db.run("INSERT INTO user_devices (username, device_id) VALUES (?,?);", [
    username,
    visitorId,
  ]);
}

module.exports = {
  loginCheck,
  newAccountCheck,
  addKnownDevice,
};
