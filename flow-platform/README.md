<br/>
<div align="center">
<a href="#">
<img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NextJS-Light.svg" width="80" alt="Next.js" />
</a>
<h1 align="center">LUMEN</h1>
<p align="center">
An archival publishing network for radical thinkers. Synchronize stories, code, and digital narratives in high-fidelity monochrome.
</p>
<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#database-schema">Database Schema</a> •
  <a href="#license">License</a>
</p>
</div>

---

## ⚡ Introducing LUMEN
LUMEN is not just a blogging platform; it's a **digital narrative platform** designed with strict high-contrast monochrome design language ("Clean Canvas"), aimed at delivering distraction-free reading and seamless, frictionless authoring. 

Whether you're publishing a heavy engineering manifesto, dropping a quick micro-log, or releasing a transcribed audio chronicle, LUMEN adapts flawlessly to your content.

## 🚀 Key Features

* **Multi-Format Publishing:** 
  * 🪶 **Blogs**: Traditional long-form articles with deep formatting.
  * ⚡ **Micro**: Fast, 500-character thoughts for quick synchronization.
  * 💻 **Code**: Share gists and architecture snippets with syntax highlighting.
  * 🎙️ **Audio**: Upload voice files with interactive players and embedded transcripts.
* **Premium Editorial Co-Pilot (Mistral AI):** 
  * Select any text and ask the Assistant to fix grammar, generate tags, summarize, suggest titles, or continue writing. Now parses JSON intelligently rendering interactive insertion buttons directly into your UI.
* **"Clean Canvas" Interface:** 
  * Hardcoded high-contrast light mode, brutalist-inspired typography (`Inter`, `Lora`, `Playfair Display`), seamless transitions (`animate-reveal`), and glassmorphic dashboards.
* **Anonymous Identities:**
  * Post thoughts without linking directly back to your primary user registration.
* **Robust Draft Engine:**
  * Auto-saving drafts directly to the cloud. Never lose a keystroke again.

## 🛠 Tech Stack

* **Frontend:** [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + CSS Modules (Custom specific theme enforcing pure '#FFFFFF' light-mode)
* **Backend Shell & Database:** [Supabase](https://supabase.com/) (PostgreSQL & SSR Authentication)
* **Rich Text Editing:** [TipTap](https://tiptap.dev/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **AI Infrastructure:** [Mistral AI](https://mistral.ai/) API (Handling unstructured textual logic and generative prompts)

---

## 📦 Getting Started

### Prerequisites
Make sure you have Node.js 18+ and a standard package manager (`npm`, `yarn`, or `pnpm`).

### 1. Clone & Install
```bash
git clone https://github.com/your-username/lumen-platform.git
cd lumen-platform
npm install
```

### 2. Environment Configuration
Create a `.env.local` file at the root. You will need to provision a [Supabase Project](https://supabase.com/) and obtain a [Mistral AI Key](https://mistral.ai/).

```env
# NextJS / Project Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Realtime Database & Auth
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_here

# Mistral AI Co-pilot Support
MISTRAL_API_KEY=your_mistral_api_key
```

### 3. Initialize Local Development Server
```bash
npm run dev
```

Your platform should successfully mount on [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Database Schema & Automation

We execute server actions directly via Next.js calling Supabase endpoints. To ensure complete replication:

1. Go to your **Supabase Dashboard** > SQL Editor.
2. Copy the contents of the `supabase-schema.sql` file provided in this repository.
3. **Execute the SQL**. This will generate your Core Entity tables (`profiles`, `posts`, `drafts`, `post_versions`, `bookmarks`, `comments`, etc.).
4. **Storage Creation**: Create two public buckets under Supabase Storage:
   * `post-images`
   * `audio-posts`

## 🪪 License
Distributed under the MIT License. See `LICENSE` for more information. Built for rapid, independent thinkers. 
