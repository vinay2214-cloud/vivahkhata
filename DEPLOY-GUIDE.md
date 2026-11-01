# Vivah Khata — Deploy Guide

The code is already on GitHub: **github.com/vinay2214-cloud/vivahkhata**.
You only need to click through Firebase, get a Gemini key, and create the Render service.
Time: about 20 minutes. Cost: ₹0.

You will collect **3 values** on the way — keep a notes app open:

| #   | Name                    | Where it comes from       | Secret?                                |
| --- | ----------------------- | ------------------------- | -------------------------------------- |
| 1   | `VITE_FIREBASE_API_KEY` | Firebase web app (Step 1) | No — public by design                  |
| 2   | `VITE_FIREBASE_APP_ID`  | Firebase web app (Step 1) | No — public by design                  |
| 3   | `GEMINI_API_KEY`        | Google AI Studio (Step 5) | **Yes — never share or put in GitHub** |

---

## Step 1 — Register the web app in Firebase (2 min)

1. Open **console.firebase.google.com** → project **vivahkatha**.
2. On the overview page click **+ Add app** → choose the **`</>` Web** icon.
3. App nickname: `vivahkhata-web`. Leave "Firebase Hosting" **unticked** → **Register app**.
4. You'll see code like:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy....................",
     authDomain: "vivahkatha-f164e.firebaseapp.com",
     projectId: "vivahkatha-f164e",
     ...
     appId: "1:1234567890:web:abcdef123456"
   };
   ```
5. Copy **apiKey** → that's value #1. Copy **appId** → that's value #2. Click **Continue to console**.

## Step 2 — Turn on sign-in (2 min)

1. Left menu → **Security → Authentication** → **Get started**.
2. **Sign-in method** tab → **Google** → **Enable** → pick your email as "support email" → **Save**.
3. **Add new provider** → **Anonymous** → **Enable** → **Save** (this powers the "Try Demo" button).

## Step 3 — Create the database (2 min)

1. Left menu → **Databases & Storage → Firestore Database** → **Create database**.
2. Edition: **Standard**. Database ID: leave as **(default)**.
3. Location: **asia-south1 (Mumbai)** — cannot be changed later.
4. Choose **Start in production mode** → **Create**.

## Step 4 — Publish the security rules (1 min)

1. Firestore Database → **Rules** tab.
2. Open **github.com/vinay2214-cloud/vivahkhata/blob/main/firestore.rules** → click the **Copy raw file** button.
3. Select everything in the Firebase rules editor, paste, click **Publish**.

These rules make sure only family members you invite can see a wedding.

## Step 5 — Get your free Gemini API key (2 min)

1. Open **aistudio.google.com/apikey** (signed in as vinayjanyavula256@gmail.com).
2. **Create API key** → choose the project **vivahkatha** (or "create in new project").
3. Copy the key (starts with `AIza…`) → that's value #3.

> Keep this key private. It goes **only** into Render (Step 6), never into GitHub or WhatsApp.
> On Google's free tier, prompts may be used to improve Google's products — fine for family testing;
> switch to a paid key before storing many real families' data.

## Step 6 — Deploy on Render (5 min)

1. Go to **render.com** → **Sign in with GitHub** (account `vinay2214-cloud`).
2. Top right **+ New** → **Blueprint**.
3. Connect GitHub if asked → select **vinay2214-cloud/vivahkhata** → **Connect**.
4. Render reads `render.yaml` and shows one **Web Service: vivahkhata (Free)**.
5. It asks for 3 values — paste them:
   - `GEMINI_API_KEY` → value #3
   - `VITE_FIREBASE_API_KEY` → value #1
   - `VITE_FIREBASE_APP_ID` → value #2
6. Click **Apply** / **Deploy Blueprint**. Wait 3–5 minutes until it says **Live**.
7. Your link is at the top of the service page, e.g. **https://vivahkhata.onrender.com**
   (Render may add letters if the name is taken — use exactly what it shows).

**If "Blueprint" fails or isn't offered**, create it manually: **+ New → Web Service** → pick the repo →

- Runtime: **Node** · Region: **Singapore** · Plan: **Free**
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Environment → add: `NODE_VERSION`=`22`, `VITE_FIREBASE_PROJECT_ID`=`vivahkatha-f164e`, plus the 3 values above.

## Step 7 — Allow Google sign-in on your Render link (1 min) ⚠️ required

1. Firebase → **Authentication** → **Settings** tab → **Authorized domains** → **Add domain**.
2. Type your Render address **without** `https://` — e.g. `vivahkhata.onrender.com` → **Add**.

Without this, sign-in shows _"auth/unauthorized-domain"_.

## Step 8 — Check it works (5 min)

- [ ] Open `https://<your-link>/api/health` → shows `"ai":true`. (If `false`, the Gemini key wasn't saved — Step 6.)
- [ ] Open the main link on your phone → **Continue with Google** → create a wedding.
- [ ] Add an expense → it shows in Money.
- [ ] Voice: say _"caterer ki 40 thousand advance ichhamu cash lo"_ → card shows ₹40,000 · Catering · Cash · Advance.
- [ ] Scan a real bill or PhonePe screenshot → check the amount → Save.
- [ ] Members → Invite → open the link on a second Google account → code is filled in → Join.
- [ ] Airplane mode → add an expense → back online → it syncs.

## Step 9 — Share with family

- Send the link on WhatsApp.
- **Android:** Chrome menu ⋮ → **Add to Home screen**. **iPhone:** Safari Share → **Add to Home Screen**.
- One person creates the wedding; everyone else joins with an invite link from **Members**.

### Good to know about the free Render plan

- The app **goes to sleep after 15 minutes** with no visitors. The next person to open it waits **up to a minute** while it wakes; after that it's fast.
- Data is safe while it sleeps — it lives in Firebase, not on Render.
- Upgrade later to Render "Starter" (~$7/month) if the wake-up wait bothers the family, especially on the wedding day.

---

## Updating the app later

Changes pushed to the `main` branch on GitHub deploy automatically.

To edit on your Mac:

```bash
cd ~/Desktop
git clone https://github.com/vinay2214-cloud/vivahkhata.git
cd vivahkhata
npm install
cp .env.example .env.local     # then fill in the 3 values
npm run dev:server   # terminal 1 — AI server on :8787
npm run dev          # terminal 2 — app on http://localhost:3000
```

Then `git add . && git commit -m "what changed" && git push`.

If you change `firestore.rules`, paste it into Firebase → Firestore → Rules → **Publish** again.

---

## Troubleshooting

| What you see                                 | Fix                                                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| "Vivah Khata is almost ready" page           | Firebase values missing in Render → Environment → add, then **Manual Deploy → Clear build cache & deploy** |
| `auth/unauthorized-domain`                   | Step 7                                                                                                     |
| "Missing or insufficient permissions"        | Step 4 — rules not published                                                                               |
| "AI reading is not switched on"              | `GEMINI_API_KEY` missing or wrong in Render → Environment                                                  |
| "Too many requests"                          | Gemini free limit or 40 AI reads/hour per person — wait, or raise `AI_LIMIT_PER_HOUR` in Render            |
| Changed a `VITE_…` value but nothing changed | These are baked in at build time — redeploy after changing them                                            |
| Voice button hears nothing                   | Use Chrome on Android; on iPhone type the note instead                                                     |
| "Try Demo" errors                            | Step 2 — enable Anonymous                                                                                  |
