# MyAnimeList Admin Panel

A powerful, modern admin panel for managing your MyAnimeList repository. Built with Next.js.

## Features

- 🔐 **Password Protected** — Secure authentication with JWT tokens
- 📊 **Dashboard** — Overview of your anime collection with stats
- ➕ **Add Anime** — Manual entry or quick import from AniList
- ✏️ **Edit Anime** — Update any anime details
- 🗑️ **Delete Anime** — Remove entries with confirmation
- 🔍 **AniList Search** — Search and import from AniList's massive database
- 📄 **README Generation** — Auto-generate README.md from your data
- 🚀 **GitHub Push** — Push changes directly to your repository
- 🎨 **Dark Theme** — Beautiful purple-accented dark UI
- 📱 **Responsive** — Works on desktop and mobile

## Quick Start

### Local Development

```bash
cd admin-panel

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your admin password

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and login with your password.

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" and import your `MyAnimeList` repository
3. Set the **Root Directory** to `admin-panel`
4. Add Environment Variables:
   - `ADMIN_PASSWORD` — Your secure admin password
5. Deploy!

### Deploy to GitHub Pages (Static)

The admin panel requires a server (API routes), so Vercel or a similar platform is recommended. For GitHub Pages, you'd need to convert to a static site with client-side GitHub API calls.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ADMIN_PASSWORD` | Password to access the admin panel | Yes |
| `JWT_SECRET` | Secret for token signing (auto-generated if not set) | No |

## Architecture

```
admin-panel/
├── pages/
│   ├── _app.js          # Global layout with sidebar
│   ├── index.js          # Dashboard
│   ├── login.js          # Login page
│   ├── anime/
│   │   ├── index.js      # All anime list
│   │   ├── add.js        # Add new anime
│   │   └── [id].js       # Edit anime
│   ├── anilist.js        # AniList search
│   ├── push.js           # Push to GitHub
│   └── api/
│       ├── auth.js       # Authentication
│       ├── stats.js      # Dashboard stats
│       ├── push.js       # GitHub push
│       ├── anime/
│       │   ├── index.js  # List/Add anime
│       │   ├── [id].js   # Get/Update/Delete
│       │   └── search.js # AniList search
│       └── anilist/
│           └── search.js # AniList API
├── lib/
│   ├── auth.js           # JWT authentication
│   ├── data.js           # Data management
│   ├── github.js         # GitHub API
│   ├── anilist.js        # AniList GraphQL API
│   └── readme-generator.js # README generation
├── data/
│   └── anime.json        # Anime data store
└── styles/
    └── globals.css       # Dark theme styles
```

## Usage

1. **Login** with your admin password
2. **Dashboard** shows your collection overview
3. **Add Anime** — Search AniList or enter manually
4. **Edit/Delete** — Manage existing entries
5. **Push** — Generate README and push to GitHub

## Security

- Password authentication with HMAC-signed JWT tokens
- HttpOnly cookies (no XSS vulnerability)
- 24-hour token expiry
- All API routes require authentication

---

*Built with ❤️ for the MyAnimeList repository*
