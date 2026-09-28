# Zentum Deployment Guide

This guide covers all the best free and paid options to deploy your **Zentum Quantum Computing Platform** online.

---

## 🚀 Option 1: Render.com (Recommended — 100% Free, Auto SSL)

Render is the easiest and most reliable free cloud host for Flask apps.

### Steps:
1. **Push your code to GitHub**:
   - Create a repository on [GitHub.com](https://github.com).
   - Push this `qlearn` project folder to your repository.
2. **Sign up / Log in to [Render.com](https://render.com)**.
3. Click **New +** > **Web Service**.
4. Connect your GitHub repository.
5. Fill in the settings:
   - **Name**: `zentum-quantum-platform` (or your choice)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Instance Type**: `Free`
6. *(Optional)* Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your Anthropic API key (if using Claude AI tutor)
7. Click **Create Web Service**.
8. Render will build and launch your site with a free URL like `https://zentum-quantum-platform.onrender.com`.

---

## ⚡ Option 2: Railway.app (Ultra-Fast 1-Click Deploy)

1. Sign up on [Railway.app](https://railway.app).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your repository.
4. Railway automatically detects `requirements.txt` and `Procfile` and deploys instantly.
5. In **Settings** > **Networking**, click **Generate Domain** to get your public HTTPS URL.

---

## 🐍 Option 3: PythonAnywhere (Free & Beginner Friendly)

1. Create a free account at [PythonAnywhere.com](https://www.pythonanywhere.com).
2. Open a **Bash Console** and clone or upload your files:
   ```bash
   git clone <your-repo-url>
   cd qlearn
   pip install --user -r requirements.txt
   ```
3. Go to the **Web** tab > **Add a new web app**.
4. Choose **Manual configuration** > **Python 3.10 / 3.11**.
5. Under **Code**:
   - Source code: `/home/yourusername/qlearn`
   - Working directory: `/home/yourusername/qlearn`
6. Edit the **WSGI configuration file** (link on Web tab) and set:
   ```python
   import sys
   path = '/home/yourusername/qlearn'
   if path not in sys.path:
       sys.path.append(path)

   from app import app as application
   ```
7. Click **Reload yourusername.pythonanywhere.com** and your app is live!

---

## 🤗 Option 4: Hugging Face Spaces (Free Docker/Python Hosting)

1. Create a free account on [Hugging Face](https://huggingface.co).
2. Click your profile > **New Space**.
3. Set **Space SDK** to **Docker** (Blank).
4. Clone the space repo or upload `app.py`, `quantum.py`, `tutor.py`, `content.py`, `templates/`, `static/`, `requirements.txt`, and `Dockerfile`.
5. Hugging Face will automatically build and host the app with high performance and zero downtime.

---

## ▲ Option 5: Vercel (Free Serverless)

1. Push code to GitHub.
2. Go to [Vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Vercel uses `vercel.json` and `requirements.txt` automatically.
5. Click **Deploy**.

---

## 🌐 Option 6: Instant Live Public Mobile Link (Cloudflare Tunnel - 0 Setup)

If you just want to test, share with friends, or access your platform on your phone right now without hosting setup:
1. Double-click **`start_public_link.bat`** in the `qlearn` folder.
2. It will launch the server and give you an instant, secure public URL (e.g. `https://random-name.trycloudflare.com`).
3. You can open that link from any mobile device or PC anywhere in the world!

---

## 🐳 Option 7: Docker / Self-Hosted VPS (Ubuntu/Debian)

Run anywhere with Docker:
```bash
docker build -t zentum-quantum .
docker run -d -p 5000:5000 --name zentum zentum-quantum
```
Visit `http://your-server-ip:5000`.
