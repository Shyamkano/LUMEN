<br/>
<div align="center">
<a href="https://lumen-archive.vercel.app/">
<img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NextJS-Light.svg" width="80" alt="Next.js" />
</a>
<h1 align="center">LUMEN</h1>
<p align="center">
<b>The Collective Intelligence Registry & High-Fidelity Narrative Engine.</b> <br/> 
Synchronize stories, code, and digital narratives across a lineage of network resonance.
<br/>
Live at <a href="https://lumen-archive.vercel.app/">lumen-archive.vercel.app</a>
</p>

<p align="center">
  <a href="#-the-vision">The Vision</a> •
  <a href="#-core-architecture">Basics</a> •
  <a href="#-feature-hierarchy">Features</a> •
  <a href="#-what-makes-lumen-different">Differentiation</a> •
  <a href="#-tech-stack">Stack</a>
</p>
</div>

---

## ⚡ The Vision
LUMEN is not just a publishing platform; it is a **Collective Asset Infrastructure**. It shifts the focus from individual content ownership to **Network Resonance**. Built on a strict **"Archival Off-White"** design language, it provides an eye-safe, high-contrast environment for radical thinkers to build a perpetual library of human intelligence.

In an era of fleeting social feeds, LUMEN prioritizes **durability, lineage, and depth**.

---

## 🏛️ Core Architecture (The Basics)
Before diving into the narrative protocols, LUMEN handles the foundational blogging experience with extreme polish:
- **High-Fidelity Writing**: A customized TipTap/ProseMirror editor designed for a distraction-free experience.
- **Multi-Format Support**: Dedicated workflows for **Long-form Blogs**, **Technical Code Entries**, and **Audio Narratives**.
- **Performance First**: Built on Next.js 16 (Turbopack) and React 19 for instantaneous navigation and state-of-the-art server-side rendering.
- **Identity Synthesis**: Robust authentication via Supabase (Social & Email) with integrated profile management.
- **Adaptive Aesthetics**: System-wide Dark Mode that preserves contrast ratios for long-term reading comfort.

---

## 🚀 Feature Hierarchy (Small to Big)

### 🔹 Layer 1: The Writing Suite
*   **Persistent Images**: Custom logic to ensure image URLs are serialized and preserved across edits without breakage.
*   **Media Multi-Upload**: Support for cover images, inline assets, and external audio URLs.
*   **Metadata Engine**: Automatic read-time calculation, tag synchronization, and slug generation for SEO stability.
*   **Draft Protocol**: Auto-saving drafts to prevent loss of intellectual assets during the creation process.

### 🔹 Layer 2: Social Connectivity
*   **Resident Mentions**: A precision @mention system allowing authors to reference other "Residents" in the network.
*   **Signal Propagation**: Real-time notifications for likes, follows, and comments.
*   **Legacy Comments**: Deeply nested discussion threads designed for high-resolution discourse rather than shallow engagement.

### 🔹 Layer 3: Advanced Intelligence
*   **Shadow Identity Protocol**: Post raw or high-risk thoughts through **hardened anonymous aliases**. These identities (Residents) build their own reputation, cryptographically isolated from your public profile.
*   **Narrative Genealogy**: LUMEN treats ideas as evolving assets. Every post can be **Forked** to create a "Remix," while automatically tracking the lineage back to the original "Seed Post."
*   **Editorial Co-Pilot**: Integrated **Mistral AI** assistant to aid in brainstorming, refining prose, and suggesting structural improvements.

### 🔹 Layer 4: Network Mechanics (Big Features)
*   **The Pull Economy (Signal Gaps)**: Traditional platforms are "Push" based. LUMEN implements a **Pull Economy** where the community can signal "Requests" for missing knowledge. Architects who "Resolve Gaps" claim collective credit.
*   **Cognitive Cartography**: A real-time **Intelligence Map** visualizing topic heatmaps across the network. Identify "Hot" zones of resonance and "Cold" zones of opportunity.
*   **Immutable Versioning**: Every post maintains an archive of versions, allowing readers to track how an idea has evolved from its inception to the current state.

---

## 🧪 What Makes LUMEN Different?

| Feature | Traditional Blogs | LUMEN |
| :--- | :--- | :--- |
| **Philosophy** | Content Consumption | Knowledge Archival |
| **Ownership** | Isolated Posts | Narrative Lineage (Forks) |
| **Discovery** | Algorithmic Feed | Cognitive Cartography (Heatmaps) |
| **Anonymity** | Hidden Profiles | Persistent Shadow Identities (Aliases) |
| **Input** | Write & Hope (Push) | Signal Gaps & Resolutions (Pull) |
| **Design** | Eye-Strain UI | Archival Off-White System (Low Stress) |

---

## 🛠 Tech Stack

*   **Logic**: Next.js 16 (App Router) & React 19
*   **State**: TanStack Query (React Query) v5 for optimistic updates.
*   **Database**: Supabase (PostgreSQL) with hardened JSONB storage for narratives.
*   **Editor**: custom TipTap Engine with Mention, Image, and Code-Snippet extensions.
*   **Styling**: Tailwind CSS v4 + custom high-contrast fluid typography.
*   **AI**: Mistral AI Editorial Co-Pilot.

---

## 📦 System Installation

### 1. Environment Synchronization
Configure your `.env.local` with the following variables:
```env
NEXT_PUBLIC_SITE_URL=your_deployment_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MISTRAL_API_KEY=your_mistral_api_key
```

### 2. Start Local Sync
```bash
npm install
npm run dev
```

---

## 🪪 License
Distributed under the MIT License. Built for the future of digital archival intelligence by [Shyamkano](https://github.com/Shyamkano).
