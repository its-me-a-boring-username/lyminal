# Lyminal

Private beta. Password: `goaldirected`

## Deploy to Vercel (5 minutes)

### 1. Install prerequisites
- [Node.js](https://nodejs.org) (v18+)
- [Git](https://git-scm.com)
- A [Vercel account](https://vercel.com) (free)
- A [GitHub account](https://github.com) (free)

### 2. Push to GitHub
```bash
cd lyminal
git init
git add .
git commit -m "initial commit"
```
Create a new repo at github.com, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/lyminal.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Vercel will auto-detect Vite — no build settings needed
4. Before clicking **Deploy**, go to **Environment Variables** and add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (get one at console.anthropic.com)
5. Click **Deploy**

You'll get a URL like `lyminal.vercel.app` in about 60 seconds.

### 4. Custom domain (optional)
In Vercel project settings → **Domains**, add `lyminal.xyz` or whatever domain you own.

## Local development
```bash
npm install
cp .env.example .env.local
# Add your API key to .env.local
npm run dev
```

## Changing the password
Open `src/App.jsx` and find:
```js
const CORRECT_PASSWORD = "goaldirected";
```
Change it to whatever you want, commit, and push. Vercel redeploys automatically.

## Dev workflow docs
- Regression checklist: `docs/REGRESSION_CHECKLIST.md`
- Development guardrails: `docs/DEVELOPMENT_GUARDRAILS.md`
