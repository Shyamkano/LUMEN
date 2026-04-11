<br/>
<div align="center">
<a href="https://lumen-archive.vercel.app/">
<img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NextJS-Light.svg" width="80" alt="Next.js" />
</a>
<h1 align="center">LUMEN</h1>
<p align="center">
An archival publishing network for radical thinkers. Synchronize stories, code, and digital narratives in high-fidelity monochrome. Live at <a href="https://lumen-archive.vercel.app/">lumen-archive.vercel.app</a>
</p>
<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#social-graph">Social Graph</a> •
  <a href="#license">License</a>
</p>
</div>

---

## ⚡ Introducing LUMEN
LUMEN is a **digital narrative platform** designed with a strict high-contrast monochrome design language ("Clean Canvas"). It is built for thinkers who value signal over noise.

Current flagship instance: **[https://lumen-archive.vercel.app/](https://lumen-archive.vercel.app/)**

## 🚀 Key Features

* **Multi-Format Publishing:** 
  * 🪶 **Blogs**: Traditional long-form articles with deep typography.
  * ⚡ **Micro**: Fast thoughts for quick synchronization.
  * 💻 **Code**: Share gists with full syntax highlighting.
  * 🎙️ **Audio**: Upload voice logs with interactive players.
* **Social Graph Synchronization:** 
  * Follow other frequencies, build your network, and track your broadcast impact via the real-time Followers/Following engine.
* **Premium Editorial Co-Pilot (Mistral AI):** 
  * Select text and use the built-in AI assistant to refine grammar, suggest tags, or extend narratives.
* **"Clean Canvas" Identity:** 
  * Hardcoded high-contrast light mode using `Inter` and `Playfair Display`.
* **Anonymous Identities:**
  * Post thoughts via generated aliases without compromising your global identity.

## 🛠 Tech Stack

* **Frontend:** Next.js 16 (Turbopack) + React 19
* **Styling:** Tailwind CSS v4 + Vanilla CSS
* **Backend:** Supabase (Postgres, SSR Auth, Storage)
* **Editor:** TipTap
* **AI:** Mistral AI (AI-Assistants & Auto-tagging)

---

## 📦 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Shyamkano/LUMEN.git
cd LUMEN
npm install
```

### 2. Environment Configuration
Create `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=https://lumen-archive.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
MISTRAL_API_KEY=your_key
```

### 3. Database Sync
1. Run the `supabase-schema.sql` in your Supabase SQL Editor.
2. Ensure **Google OAuth** is enabled in Supabase Auth providers for seamless login.

## 🗄️ Social Graph & Automation
LUMEN uses a dual-step verification process for social synchronization (Followers). This ensures data integrity and high-speed retrieval across the network.

## 🪪 License
MIT License. Built by [Shyamkano](https://github.com/Shyamkano).
