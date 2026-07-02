# SpendIQ — Setup Guide

This guide walks you through everything needed to get SpendIQ running locally.

---

## Prerequisites

- Node.js 18+ installed
- A Google account (the Gmail account linked to your CBQ bank)
- An Anthropic account (optional — app works without it, just no AI insights)

---

## Step 1: Install Dependencies

```bash
cd "/Users/moizrana/World Cup App/spendiq"
npm install
```

---

## Step 2: Create Google Cloud Project

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Click the project dropdown at the top left → **New Project**
3. Name it something like `SpendIQ` and click **Create**
4. Make sure the new project is selected in the dropdown

---

## Step 3: Enable the Gmail API

1. In the left sidebar, go to **APIs & Services > Library**
2. Search for **Gmail API**
3. Click on it and press **Enable**

---

## Step 4: Configure the OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** as the user type → click **Create**
3. Fill in the required fields:
   - **App name**: SpendIQ
   - **User support email**: your email
   - **Developer contact information**: your email
4. Click **Save and Continue**
5. On the **Scopes** page, click **Add or Remove Scopes**
   - Search for `gmail.readonly`
   - Check `https://www.googleapis.com/auth/gmail.readonly`
   - Click **Update** then **Save and Continue**
6. On the **Test users** page, click **Add Users** and add your own Gmail address
   - This is required while the app is in "Testing" mode
7. Click **Save and Continue** → **Back to Dashboard**

> Note: While in Testing mode, only the email addresses you add as Test Users can log in. This is fine for personal use — you don't need to publish the app.

---

## Step 5: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Choose **Web application** as the application type
4. Give it a name like `SpendIQ Web Client`
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for local development)
   - `http://localhost:4173` (for `npm run preview`)
   - If you deploy it somewhere, add your production URL too (e.g. `https://spendiq.yourdomain.com`)
6. Leave **Authorized redirect URIs** empty — this app uses the implicit/token flow, not redirect-based auth
7. Click **Create**
8. A dialog will show your **Client ID** — copy it. It looks like:
   ```
   123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```

---

## Step 6: Get Your Anthropic API Key (Optional)

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign in or create an account
3. Go to **API Keys** in the left sidebar
4. Click **Create Key**, give it a name, copy it
5. It starts with `sk-ant-...`

> If you skip this step, SpendIQ will still work — it uses keyword-based categorisation offline and won't generate AI summaries. You can add it later.

---

## Step 7: Create Your .env File

In the `spendiq` directory, create a file called `.env` (copy from `.env.example`):

```bash
cp .env.example .env
```

Then open `.env` and fill in your values:

```
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
VITE_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
```

Save the file. Vite will pick it up automatically.

---

## Step 8: Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

You should see the SpendIQ dark-themed interface with a "Connect Gmail" card.

---

## Step 9: Connect Gmail and Sync

1. Click **Connect Gmail**
2. A Google sign-in popup will appear — log in with the Gmail account linked to your CBQ bank
3. Grant the **read-only Gmail** permission
4. SpendIQ will automatically fetch all emails from `cbqsms@cbq.com.qa` and parse your transactions
5. The first sync may take 10–30 seconds depending on how many emails you have

---

## Troubleshooting

**"Gmail connection failed"**
- Make sure your Client ID is correct in `.env`
- Make sure `http://localhost:5173` is in the Authorized JavaScript origins
- Make sure your Google account is added as a Test User on the OAuth consent screen

**"No transactions found"**
- SpendIQ looks for emails from `cbqsms@cbq.com.qa` specifically
- Check your Gmail — search for `from:cbqsms@cbq.com.qa` to confirm you have CBQ notification emails
- If your CBQ emails come from a different address, edit `SENDER` in `src/services/gmail.js`

**Popup blocked**
- Allow popups for `localhost:5173` in your browser settings
- Chrome: click the popup icon in the address bar and select "Always allow"

**App shows "Loading..." on the Connect button for too long**
- The Google API scripts need a moment to load
- Hard refresh the page (Cmd+Shift+R on Mac)
- Check your internet connection — the Google scripts load from external CDNs

**AI Insights not working**
- Check your Anthropic API key in `.env`
- The key must start with `sk-ant-`
- Make sure you have credits in your Anthropic account
- Without a key, the app uses offline insights (still useful, just not AI-powered)

---

## Privacy Notes

- SpendIQ requests **read-only** Gmail access — it cannot send emails, delete anything, or modify your account
- All data is stored in **your browser's localStorage only** — nothing is sent to any server except the Google and Anthropic APIs
- Your transaction data never leaves your device (except the summarised stats sent to Claude for AI insights)
- You can clear all data at any time from the Dashboard screen

---

## Building for Production

```bash
npm run build
```

This creates a `dist/` folder you can deploy to any static host (Netlify, Vercel, GitHub Pages, etc.).

Remember to add your production domain to the **Authorized JavaScript origins** in Google Cloud Console before deploying.
