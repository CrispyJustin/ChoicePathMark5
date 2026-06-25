# ChoicePath Vercel Deploy

This package is configured as a static Vite + React + TanStack Router app for Vercel.

Vercel settings:

- Framework Preset: Vite
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist
- Root Directory: blank/default if package.json is at repo root

Environment variables required in Vercel:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

After deploy, set the deployed URL in Supabase:

Authentication → URL Configuration → Site URL and Redirect URLs.

Keep email confirmation off until login and cloud persistence are tested on the deployed URL.
