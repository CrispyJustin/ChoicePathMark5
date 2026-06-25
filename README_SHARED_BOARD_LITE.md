# ChoicePath Shared Board Lite

This update adds the simplest shared-board workflow:

1. Board owner enters an email in Settings.
2. That email is saved to `board_members.member_email`.
3. When a user logs in with that same email, the shared board appears in the board selector.
4. The shared user can edit students, attendance, and progress.

This does not add realtime syncing. Users may need to refresh to see someone else's latest changes.

## Required Supabase SQL

Before deploying this code, run `SUPABASE_SHARED_BOARD_LITE.sql` in Supabase SQL Editor.

## Deploy

Use the same Vercel setup as the current working app:

- Framework: Vite
- Install command: npm install
- Build command: npm run build
- Output directory: dist
- Environment variables:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY

## Test

1. Log in as Account A.
2. Go to Settings.
3. Share the board with Account B's email.
4. Log out.
5. Log in as Account B.
6. Use the board selector in the top navigation to choose Account A's board.
7. Add or edit a fake student.
8. Log back in as Account A and refresh to confirm the change appears.
