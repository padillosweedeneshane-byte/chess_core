# Immersive Chess Simulator V4 - Local PC Deployment Guide

Bring the retro sci-fi chess experience, complete with dynamic sound synthesis, AI engines (Gemini Core & Local LM Studio Gemma integration), and reactive CRT terminal graphics, straight to your local desk.

Follow these step-by-step instructions to install and deploy the game on your local machine.

---

## 🛠️ Prerequisites

Ensure you have the following installed on your machine:
* **Node.js** (v18.x or higher recommended)
* **npm** (comes bundled with Node.js) or **Yarn**

---

## 🚀 Quick Start (Development Mode)

1. **Extract the ZIP / Clone the Repo**
   Extract the downloaded project bundle or clone the source files into a folder of your choice on your desktop.

2. **Open Terminal**
   Navigate to the project root directory:
   ```bash
   cd immersive-chess-v4
   ```

3. **Install Dependencies**
   Pull down the required full-stack dependencies (Vite, Express, TailwindCSS, etc.):
   ```bash
   npm install
   ```

4. **Run Development Server**
   Spin up the full-stack server under hot development reloading:
   ```bash
   npm run dev
   ```

5. **Interact**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📦 Production Build & Deployment

To bundle the application into an optimized build for deployment or continuous local play:

1. **Build the Entire Applet**
   This compiles the React frontend client-side code (`vite build`) and bundles the high-performance TypeScript backend server (`esbuild`) into a single fast-loading file (`dist/server.cjs`):
   ```bash
   npm run build
   ```

2. **Start Production Server**
   Boot the server natively using Node:
   ```bash
   npm run start
   ```
   The application will run on port `3000`. Access it at `http://localhost:3000`.

---

## ⚙️ Setting Up Environment Variables

If you wish to use the premium server-side **Gemini Cloud API** for the retro processor CPU opponents, configure the API key securely.

1. Create a `.env` file at the root of the project:
   ```bash
   touch .env
   ```
2. Open `.env` and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Restart your server. The system will automatically ingest the key to authenticate cloud calls safely from the backend.

---

## 🤖 Local LM Studio Integration (No Cloud API Required)

To battle offline CPU opponents locally without a cloud Gemini key:
1. Open **LM Studio** on your PC.
2. Search and download the **Gemma model** (e.g. `gemma-2-2b-it`).
3. Navigate to the **Local Server** tab, keep port `1234` active, enable **CORS**, and click **Start Server**.
4. In our Chess application, open the **Engine Config** panel, choose local Gemma, and click **Verify Link**!
