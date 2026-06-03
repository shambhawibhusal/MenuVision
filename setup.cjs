// ---------------------------------------------------------------------------
// MenuVision – One-Command Firebase Setup
// Run: node setup.cjs
//
// This script automates:
//   1. Firebase project creation
//   2. Auth providers (Email/Password + Google)
//   3. Firestore database
//   4. Web app config → Frontend/src/firebase.ts
//   5. Service account key → Backend/serviceAccountKey.json
//   6. .firebaserc update
//   7. .env file creation (with prompts for API keys)
//
// Prerequisites: Node.js 18+, Firebase CLI installed & logged in
// ---------------------------------------------------------------------------

const { execSync } = require("child_process");
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

const ROOT = __dirname;

// --- helpers -----------------------------------------------------------------

const COLORS = { reset: "\x1b[0m", green: "\x1b[32m", yellow: "\x1b[33m", cyan: "\x1b[36m", red: "\x1b[31m", bold: "\x1b[1m" };
function log(c, msg) { console.log(`${COLORS[c] || ""}${msg}${COLORS.reset}`); }
function ok(msg)  { log("green",  `✓ ${msg}`); }
function info(msg){ log("cyan",   `ℹ ${msg}`); }
function warn(msg){ log("yellow", `⚠ ${msg}`); }
function err(msg) { log("red",    `✗ ${msg}`); }

function run(cmd, silent = false) {
  try {
    return execSync(cmd, { cwd: ROOT, stdio: silent ? "pipe" : "inherit", encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function getAuthToken() {
  const cfgPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
  if (!fs.existsSync(cfgPath)) return null;
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  return cfg?.tokens?.access_token || null;
}

let _tokenCache = null;
function token() {
  if (_tokenCache) return _tokenCache;
  const t = getAuthToken();
  if (!t) { err("No Firebase CLI token found. Run: firebase login"); process.exit(1); }
  _tokenCache = t;
  return t;
}

function api(method, host, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: host, path: urlPath, method,
      headers: { Authorization: "Bearer " + token(), "Content-Type": "application/json" },
    };
    if (data) opts.headers["Content-Length"] = Buffer.byteLength(data);
    const req = https.request(opts, (res) => {
      let b = "";
      res.on("data", (c) => (b += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: b ? JSON.parse(b) : null }); }
        catch { resolve({ status: res.statusCode, body: b }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); }));
}

// --- steps -------------------------------------------------------------------

async function step01_prerequisites() {
  info("Step 1/9 – Checking prerequisites …");

  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
  if (major < 18) { err(`Node.js 18+ required (found ${nodeVersion})`); process.exit(1); }
  ok(`Node.js ${nodeVersion}`);

  const fb = run("firebase --version 2>&1", true);
  if (!fb) { err("Firebase CLI not found. Install: npm install -g firebase-tools"); process.exit(1); }
  ok(`Firebase CLI ${fb}`);

  const loggedIn = run("firebase login:list 2>&1", true);
  if (!loggedIn || !loggedIn.includes("@")) { err("Not logged in. Run: firebase login"); process.exit(1); }
  ok(`Logged in as ${loggedIn.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || "unknown"}`);

  if (!getAuthToken()) { err("Could not read Firebase CLI auth token. Run: firebase login"); process.exit(1); }
  ok("Auth token ready");
}

async function step02_project() {
  info("\nStep 2/9 – Firebase project …");

  const name = await prompt("  Enter a project display name (e.g. MenuVision): ");
  const id = (name || "MenuVision").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/(-+)/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

  info(`  Creating project "${name}" (ID: ${id}) …`);
  const result = run(`firebase projects:create "${id}" --display-name "${name}" 2>&1`, true);
  if (!result) {
    warn("  Firebase CLI project creation failed (may need billing). Trying REST API …");
    // Fallback: try Firebase Management REST API
    const res = await api("POST", "firebase.googleapis.com", "/v1beta1/projects", { projectId: id, displayName: name });
    if (res.status !== 200) {
      err(`  Could not create project automatically. Status: ${res.status}`);
      info("  Please create the project manually at: https://console.firebase.google.com");
      info("  Then run: firebase use --add    (select your new project)");
      info("  Then re-run this script — it will detect the existing project.");
      process.exit(1);
    }
  }
  ok(`Project "${id}" created`);

  // Enable required APIs
  info("  Enabling required APIs …");
  const apis = ["identitytoolkit.googleapis.com", "firestore.googleapis.com", "iam.googleapis.com"];
  for (const s of apis) {
    const r = await api("POST", "serviceusage.googleapis.com", `/v1/projects/${id}/services/${s}:enable`);
    if (r.status === 200 || r.status === 409) ok(`  ${s}`);
    else warn(`  ${s} – status ${r.status} (may already be enabled)`);
  }

  return id;
}

async function step03_auth(projectId) {
  info("\nStep 3/9 – Configuring Authentication …");

  // Enable Identity Platform
  const initRes = await api("POST", "identitytoolkit.googleapis.com", `/v2/projects/${projectId}/identityPlatform:initializeAuth`);
  if (initRes.status === 200) ok("Identity Platform initialized");
  else info("  Identity Platform may already be initialized");

  // Enable Email/Password + Google
  info("  Enabling Email/Password provider …");
  const emailBody = { signIn: { email: { enabled: true, passwordRequired: true } } };
  const emailRes = await api("PATCH", "identitytoolkit.googleapis.com", `/v2/projects/${projectId}/config?updateMask=signIn.email`, emailBody);
  if (emailRes.status === 200) ok("  Email/Password enabled");
  else warn(`  Email/Password – status ${emailRes.status}`);

  info("  Enabling Google provider …");
  const googleBody = { signIn: { google: { enabled: true, clientId: "", clientSecret: "" } } };
  const googleRes = await api("PATCH", "identitytoolkit.googleapis.com", `/v2/projects/${projectId}/config?updateMask=signIn.google`, googleBody);
  if (googleRes.status === 200) ok("  Google enabled");
  else warn(`  Google – status ${googleRes.status} (you can enable it later)`);
}

async function step04_firestore(projectId) {
  info("\nStep 4/9 – Creating Firestore database …");

  const body = { type: "FIRESTORE_NATIVE", locationId: "nam5" };
  const res = await api("POST", "firestore.googleapis.com", `/v1/projects/${projectId}/databases?databaseId=(default)`, body);
  if (res.status === 200 || res.status === 409) ok("Firestore database ready");
  else warn(`  Firestore – status ${res.status} (may already exist)`);
}

async function step05_webapp(projectId) {
  info("\nStep 5/9 – Creating Web app …");

  const name = `${projectId}-web`;

  // Create web app and capture app ID from output
  let appId = null;
  const createOutput = run(`firebase apps:create web "${name}" --project ${projectId} 2>&1`, true);
  if (createOutput) {
    const match = createOutput.match(/App ID:\s*(\S+)/);
    if (match) appId = match[1];
  }

  if (!appId) {
    warn("  Web app creation via CLI failed, trying REST …");
    const createRes = await api("POST", "firebase.googleapis.com", `/v1beta1/projects/${projectId}/webApps`, { displayName: name });
    if (createRes.status === 200 && createRes.body) {
      appId = createRes.body.appId;
    } else {
      // List existing apps
      const listRes = await api("GET", "firebase.googleapis.com", `/v1beta1/projects/${projectId}/webApps`);
      const apps = listRes.body?.apps || [];
      if (apps.length > 0) appId = apps[0].appId;
    }
  }

  if (!appId) { err("Could not create or find web app"); return null; }
  ok(`  Web app ready`);

  // Get SDK config
  info("  Fetching SDK config …");
  const sc = run(`firebase apps:sdkconfig WEB ${appId} 2>&1`, true);
  if (sc) {
    try {
      const config = JSON.parse(sc);
      ok(`  App ID: ${config.appId}`);
      return config;
    } catch { /* fall through */ }
  }

  // REST API fallback for config
  const configRes = await api("GET", "firebase.googleapis.com", `/v1beta1/projects/${projectId}/webApps/${appId}/config`);
  if (configRes.status === 200 && configRes.body) {
    ok(`  App ID: ${configRes.body.appId || appId}`);
    return configRes.body;
  }

  warn("  Could not get SDK config");
  return null;
}

async function step06_serviceAccount(projectId) {
  info("\nStep 6/9 – Generating service account key …");

  const saEmail = `firebase-adminsdk-fbsvc@${projectId}.iam.gserviceaccount.com`;
  const saPath = `/v1/projects/${projectId}/serviceAccounts/${saEmail}/keys`;

  // Check if service account exists
  const listRes = await api("GET", "iam.googleapis.com", `/v1/projects/${projectId}/serviceAccounts`);
  const accounts = listRes.body?.accounts || [];
  const sa = accounts.find((a) => a.email === saEmail);

  if (!sa) {
    // Create the service account first
    info("  Creating firebase-adminsdk service account …");
    const createRes = await api("POST", "iam.googleapis.com", `/v1/projects/${projectId}/serviceAccounts`, {
      accountId: "firebase-adminsdk-fbsvc",
      serviceAccount: { displayName: "Firebase Admin SDK" },
    });
    if (createRes.status !== 200) {
      warn("  Could not create service account");
      return;
    }
  }

  info("  Generating key …");
  const res = await api("POST", "iam.googleapis.com", saPath, {});
  if (res.status !== 200) { warn("  Could not generate key"); return; }

  const pk = res.body?.privateKeyData;
  if (!pk) { warn("  No privateKeyData in response"); return; }

  const decoded = Buffer.from(pk, "base64").toString("utf8");
  const dest = path.join(ROOT, "Backend", "serviceAccountKey.json");
  fs.writeFileSync(dest, decoded);
  ok(`  Key saved → Backend/serviceAccountKey.json`);
}

async function step07_updateFiles(projectId, sdkConfig) {
  info("\nStep 7/9 – Updating project files …");

  // Update firebase.ts
  if (sdkConfig) {
    const fPath = path.join(ROOT, "Frontend", "src", "firebase.ts");
    let content = fs.readFileSync(fPath, "utf8");

    content = content.replace(/apiKey:\s*"[^"]*"/, `apiKey: "${sdkConfig.apiKey}"`);
    content = content.replace(/authDomain:\s*"[^"]*"/, `authDomain: "${sdkConfig.authDomain}"`);
    content = content.replace(/projectId:\s*"[^"]*"/, `projectId: "${sdkConfig.projectId}"`);
    content = content.replace(/storageBucket:\s*"[^"]*"/, `storageBucket: "${sdkConfig.storageBucket}"`);
    content = content.replace(/messagingSenderId:\s*"[^"]*"/, `messagingSenderId: "${sdkConfig.messagingSenderId}"`);
    content = content.replace(/appId:\s*"[^"]*"/, `appId: "${sdkConfig.appId}"`);
    content = content.replace(/measurementId:\s*"[^"]*"/, `measurementId: "${sdkConfig.measurementId || ""}"`);

    fs.writeFileSync(fPath, content);
    ok("  Frontend/src/firebase.ts updated");
  }

  // Update .firebaserc
  const rc = { projects: { default: projectId } };
  fs.writeFileSync(path.join(ROOT, ".firebaserc"), JSON.stringify(rc, null, 2) + "\n");
  ok(`  .firebaserc → "${projectId}"`);
}

async function step08_envFiles() {
  info("\nStep 8/9 – Environment variables …");

  // Backend .env
  const beEnvPath = path.join(ROOT, "Backend", ".env");
  if (!fs.existsSync(beEnvPath)) {
    const beExample = fs.readFileSync(path.join(ROOT, "Backend", ".env.example"), "utf8");
    fs.writeFileSync(beEnvPath, beExample);
    ok("  Backend/.env created from .env.example");
    info("  → Edit Backend/.env with your API keys:");
    info("    GOOGLE_GENERATIVE_AI_API_KEY  –  https://aistudio.google.com/apikey");
    info("    OPENAI_API_KEY                –  https://platform.openai.com/api-keys");
  } else {
    info("  Backend/.env already exists (skipped)");
  }

  // Frontend .env.local
  const feEnvPath = path.join(ROOT, "Frontend", ".env.local");
  if (!fs.existsSync(feEnvPath)) {
    const feExample = fs.readFileSync(path.join(ROOT, "Frontend", ".env.local.example"), "utf8");
    fs.writeFileSync(feEnvPath, feExample);
    ok("  Frontend/.env.local created from .env.local.example");
    info("  → Edit Frontend/.env.local with:");
    info("    VITE_GOOGLE_MAPS_API_KEY  –  Google Cloud Console → Maps JavaScript API");
  } else {
    info("  Frontend/.env.local already exists (skipped)");
  }
}

async function step09_summary(projectId) {
  info("\nStep 9/9 – Done!");

  console.log("");
  log("bold", "═══════════════════════════════════════════════════");
  log("bold", "  Setup Complete!");
  log("bold", "═══════════════════════════════════════════════════");
  console.log("");
  info(`Firebase project: ${projectId}`);
  info(`Web app: https://console.firebase.google.com/project/${projectId}/overview`);
  console.log("");
  log("bold", "Next steps:");
  console.log("  1. Add your API keys to:");
  console.log("     Backend/.env           → GOOGLE_GENERATIVE_AI_API_KEY + OPENAI_API_KEY");
  console.log("     Frontend/.env.local    → VITE_GOOGLE_MAPS_API_KEY");
  console.log("");
  console.log("  2. Start the app:");
  console.log("     npm run start --prefix Backend       (port 5000)");
  console.log("     npm run dev --prefix Frontend        (port 5173)");
  console.log("");
  console.log("  3. Open http://localhost:5173");
  console.log("     → Sign Up with Google or Email/Password");
  console.log("     → Scan a menu image to test");
  console.log("");
}

// --- main --------------------------------------------------------------------

async function main() {
  console.log("");
  log("bold", "╔══════════════════════════════════════╗");
  log("bold", "║   MenuVision – Firebase Setup        ║");
  log("bold", "╚══════════════════════════════════════╝");
  console.log("");

  await step01_prerequisites();

  // Check if already set up
  const existingRc = fs.existsSync(path.join(ROOT, ".firebaserc"))
    ? JSON.parse(fs.readFileSync(path.join(ROOT, ".firebaserc"), "utf8"))
    : null;
  const existingProject = existingRc?.projects?.default;

  let projectId;
  let sdkConfig;

  if (existingProject && existingProject !== "project-cd5a3") {
    info(`Found existing project "${existingProject}" in .firebaserc`);
    const reuse = await prompt("  Use this project? (Y/n): ");
    if (reuse.toLowerCase() !== "n") {
      projectId = existingProject;
      info("  Fetching existing config …");
      const sc = run(`firebase apps:sdkconfig WEB --project ${projectId} 2>&1`, true);
      if (sc) {
        try { sdkConfig = JSON.parse(sc); } catch {}
      }
    }
  }

  if (!projectId) {
    projectId = await step02_project();
  }

  await step03_auth(projectId);
  await step04_firestore(projectId);

  if (!sdkConfig) {
    sdkConfig = await step05_webapp(projectId);
  }

  await step06_serviceAccount(projectId);
  await step07_updateFiles(projectId, sdkConfig);
  await step08_envFiles();
  await step09_summary(projectId);
}

main().catch((e) => {
  err(`Unexpected error: ${e.message}`);
  process.exit(1);
});
