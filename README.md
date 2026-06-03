# MenuVision

AI-powered menu scanner and food chat assistant. Upload a menu photo and get detailed dish info — ingredients, allergens, calories, nutrition, and AI-generated images.

---

## Quick Start (Automated)

### Prerequisites
- **Node.js** v18+ — https://nodejs.org
- **Firebase CLI** — `npm install -g firebase-tools`

### 1. Install & Run Setup

```bash
git clone <repo-url>
cd MenuVision
npm install
npm install --prefix Backend
npm install --prefix Frontend
firebase login                              # sign in with your Google account
node setup.cjs                              # automated Firebase project setup
```

The setup script will:
- Create a Firebase project
- Enable Email/Password + Google authentication
- Create a Firestore database
- Generate a service account key
- Update all config files automatically

### 2. Add API Keys

After the script finishes, edit your `.env` files:

**Backend/.env:**
| Variable | Get it from |
|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | https://aistudio.google.com/apikey |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |

**Frontend/.env.local** (copy from `Frontend/.env.example`):
| Variable | Get it from |
|----------|-------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console → Maps JavaScript API |

### 3. Run the App

```bash
npm run start --prefix Backend     # port 5000
npm run dev --prefix Frontend      # port 5173
```

Open **http://localhost:5173** → Sign Up → Scan a menu image.

---

## Manual Setup (if script fails)

<details>
<summary>Click to expand manual steps</summary>

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com → Add project
2. Go to **Authentication** → **Sign-in method** → Enable **Email/Password** and **Google**
3. Go to **Firestore Database** → **Create database** → choose a location
4. Go to **Project Settings** → **Add app** → **Web** → copy the `firebaseConfig`
5. Paste it into `Frontend/src/firebase.ts`
6. **Project Settings** → **Service accounts** → **Generate new private key** → rename to `serviceAccountKey.json` → place in `Backend/`

### 2. Environment Variables

```bash
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env.local
```

Edit both files with your API keys (see table above).

### 3. Firebase CLI

```bash
firebase use --add      # select your project
```

### 4. Run

```bash
npm run start --prefix Backend
npm run dev --prefix Frontend
```

</details>

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Setup script says "billing" | Firebase Spark (free) plan requires a linked billing account. Create one at https://console.cloud.google.com/billing → then re-run `node setup.cjs` |
| `auth/configuration-not-found` | Firebase config in `Frontend/src/firebase.ts` is wrong. Re-run setup or update manually. |
| Google popup closes immediately | Google provider not enabled in Firebase Auth, or frontend needs restart after setup. |
| Backend can't connect to Firestore | Verify `serviceAccountKey.json` exists in `Backend/` and belongs to the correct project. |
| AI scan errors | Check API keys in `Backend/.env`. |
| `vite: command not found` | Run `npm install --prefix Frontend`. |

---

## Project Structure

```
MenuVision/
├── Backend/              Express server (port 5000)
│   ├── server.ts         /analyzeMenu, /chat endpoints
│   └── .env              API keys (gitignored)
├── Frontend/             Vite + React (port 5173)
│   └── src/
│       ├── screens/      Login, Signup, Dashboard
│       ├── components/   UI components
│       └── firebase.ts   Firebase client config
├── setup.cjs             One-command Firebase setup
├── firebase.json         Firebase hosting config
└── .firebaserc           Firebase project alias
```
