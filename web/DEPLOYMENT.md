# Railway Deployment Guide - Audio Notes Extractor

Deploy the Audio Notes Extractor web app to Railway with GitHub integration for automatic deployments.

## 🚀 Quick Deployment Steps

### 1. **Prepare GitHub Repository**

1. **Create a new GitHub repository** or use an existing one
2. **Copy the web app files** to your repository:
   ```
   your-repo/
   ├── app.py                 # Flask server
   ├── index.html             # Main app
   ├── styles.css             # Styling
   ├── requirements.txt       # Python dependencies
   ├── railway.json           # Railway configuration
   ├── Procfile              # Process definition
   ├── nixpacks.toml         # Nixpacks configuration
   ├── .env.example          # Environment template
   ├── .gitignore            # Git ignore rules
   └── js/
       ├── app.js            # Main controller
       ├── audio-recorder.js # Audio processing
       └── note-extractor.js # Note extraction
   ```

3. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Add Audio Notes Extractor web app"
   git push origin main
   ```

### 2. **Deploy to Railway**

#### Option A: Railway Dashboard (Recommended)

1. **Go to [Railway](https://railway.app/)**
2. **Sign in** with your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**
6. **Railway will automatically detect** the Python app and deploy

#### Option B: Railway CLI

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize and deploy**:
   ```bash
   cd your-web-app-directory
   railway init
   railway up
   ```

### 3. **Configure Environment (Optional)**

If you want to provide a default OpenAI API key:

1. **In Railway Dashboard**, go to your project
2. **Navigate to Variables tab**
3. **Add environment variable**:
   - `OPENAI_API_KEY`: Your OpenAI API key (optional)
   - `SECRET_KEY`: A secure random string for Flask sessions

### 4. **Access Your App**

After deployment:
- Railway will provide a **public URL** (e.g., `https://your-app.railway.app`)
- The app will automatically start on the assigned port
- **HTTPS is enabled by default** (required for microphone access)

## 🔧 Configuration Files Explained

### `app.py` - Flask Server
- **Production-ready** Flask application
- **Serves static files** (HTML, CSS, JS)
- **Health check endpoints** for monitoring
- **Security headers** for safe operation
- **CORS enabled** for API access

### `requirements.txt` - Python Dependencies
```
flask>=2.3.0           # Web framework
gunicorn>=21.0.0        # Production WSGI server
python-dotenv>=1.0.0    # Environment variable loading
```

### `railway.json` - Railway Configuration
```json
{
  "build": {
    "builder": "NIXPACKS"     // Use Nixpacks for builds
  },
  "deploy": {
    "startCommand": "gunicorn --bind 0.0.0.0:$PORT app:app",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### `Procfile` - Process Definition
```
web: gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 120 app:app
```

### `nixpacks.toml` - Build Configuration
```toml
[phases.setup]
nixPkgs = ['python39']       # Python version

[phases.install]
cmds = ['pip install -r requirements.txt']

[start]
cmd = 'gunicorn --bind 0.0.0.0:$PORT app:app'
```

## 🌐 Features Available After Deployment

### ✅ **Fully Functional Web App**
- **Audio recording** with Web Audio API
- **Real-time transcription** (demo mode)
- **Note extraction** (AI + rule-based)
- **Export functionality** for notes and transcriptions
- **Session history** with local storage

### ✅ **Production Features**
- **HTTPS enabled** for secure microphone access
- **Health monitoring** with `/health` endpoint
- **API status** with `/api/status` endpoint
- **Error handling** with graceful fallbacks
- **Security headers** for safe operation

### ✅ **Client-Side Processing**
- **Privacy-focused**: All audio processing in browser
- **No server storage**: User data never leaves their device
- **Optional AI**: Users can add their own OpenAI API key
- **Offline capable**: Rule-based extraction works without internet

## 🔒 Security & Privacy

### **Data Privacy**
- ✅ **Audio never leaves user's device**
- ✅ **No server-side storage** of conversations
- ✅ **Optional OpenAI integration** (user's choice)
- ✅ **Local browser storage** for history and settings

### **Security Headers**
- ✅ **Content Security Policy** configured
- ✅ **XSS Protection** enabled
- ✅ **Frame Options** set to deny
- ✅ **HTTPS enforcement** for microphone access

## 🎯 Post-Deployment Testing

### **Test Core Features**
1. **Visit your Railway URL**
2. **Grant microphone permissions**
3. **Record a short audio clip**
4. **Verify transcription appears**
5. **Test note extraction**
6. **Check export functionality**

### **Test API Endpoints**
- **Health check**: `https://your-app.railway.app/health`
- **API status**: `https://your-app.railway.app/api/status`

### **Browser Compatibility**
- ✅ **Chrome**: Full support
- ✅ **Firefox**: Full support  
- ✅ **Safari**: Full support
- ✅ **Edge**: Full support

## 🚀 Advanced Configuration

### **Custom Domain**
1. **In Railway Dashboard**, go to Settings
2. **Add custom domain**
3. **Configure DNS** as instructed
4. **SSL certificate** automatically provisioned

### **Environment Variables**
```bash
# Optional OpenAI integration
OPENAI_API_KEY=sk-your-key-here

# Flask security
SECRET_KEY=your-secure-random-string

# Server configuration
FLASK_ENV=production
PORT=8000                    # Railway sets this automatically
```

### **Monitoring & Logs**
- **Railway Dashboard**: Real-time logs and metrics
- **Health endpoint**: Monitor app status
- **Error tracking**: Automatic error collection

## 🔄 Continuous Deployment

### **Automatic Updates**
- **Push to GitHub**: Triggers automatic Railway deployment
- **Zero downtime**: Railway handles rolling deployments
- **Rollback capability**: Easy rollback to previous versions

### **Branch Deployments**
- **Main branch**: Production deployment
- **Feature branches**: Preview deployments
- **Pull requests**: Automatic preview environments

## 📊 Performance & Scaling

### **Current Configuration**
- **Single worker**: Optimized for web app serving
- **Timeout**: 120 seconds for long requests
- **Memory**: ~100MB typical usage
- **CPU**: Minimal server-side processing

### **Scaling Options**
- **Horizontal scaling**: Multiple instances if needed
- **Vertical scaling**: More CPU/memory if required
- **CDN integration**: Static asset caching
- **Database**: Add if persistent storage needed

## 🛠️ Troubleshooting

### **Common Deployment Issues**

#### **Build Fails**
- Check `requirements.txt` syntax
- Verify Python version compatibility
- Review build logs in Railway dashboard

#### **App Won't Start**
- Check `Procfile` configuration
- Verify Flask app name in startup command
- Review application logs

#### **Microphone Not Working**
- Ensure HTTPS is enabled (Railway default)
- Check browser permissions
- Verify Web Audio API support

### **Debug Commands**
```bash
# Local testing
python app.py

# Check requirements
pip install -r requirements.txt

# Test production server locally
gunicorn --bind 127.0.0.1:8000 app:app
```

## 🎉 Success Checklist

After deployment, you should have:

- ✅ **Live web app** at your Railway URL
- ✅ **HTTPS enabled** for secure access
- ✅ **Microphone recording** working
- ✅ **Note extraction** functional
- ✅ **Export features** operational
- ✅ **Responsive design** on mobile/desktop
- ✅ **Health monitoring** active
- ✅ **Automatic deployments** from GitHub

## 📱 Sharing Your App

Once deployed, you can share your app:

- **Direct link**: `https://your-app.railway.app`
- **QR code**: Generate for mobile access
- **Embed**: Use in other applications
- **API access**: For integration with other tools

## 🔮 Next Steps

### **Enhancements to Consider**
- **Real Whisper integration**: Add WebAssembly Whisper for offline transcription
- **User authentication**: Add login system if needed
- **Database storage**: Persistent user data
- **Team features**: Collaboration capabilities
- **Advanced analytics**: Usage tracking and insights

### **Integration Opportunities**
- **Zapier**: Automate workflows
- **Slack/Discord**: Bot integration
- **Calendar apps**: Meeting integration
- **Note-taking apps**: Export to Notion, Obsidian
- **CRM systems**: Customer interaction tracking

---

**Your Audio Notes Extractor is now live and ready to transform conversations into insights! 🎙️✨**