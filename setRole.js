const admin = require("firebase-admin");
const path = require("path");

// change this accordingly
const serviceAccount = require(path.resolve(__dirname, "violationledger-3c82b-firebase-adminsdk-fbsvc-a95301efd1.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setRole(uid, role) {
  if (!["guard", "bpso", "admin"].includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  await admin.auth().setCustomUserClaims(uid, { role });
  // Optionally track last claim set for visibility
  await admin.auth().updateUser(uid, { displayName: `role:${role}` });
  console.log(`Role '${role}' set for UID: ${uid}`);
}

const [,, uid, role] = process.argv;
if (!uid || !role) {
  console.error("Usage: node setRole.js <uid> <guard|bpso|admin>");
  process.exit(1);
}

setRole(uid, role)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });