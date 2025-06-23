# Audio Notes Extractor - Web Edition

A fully client-side web application that transforms audio recordings into structured notes and insights. All processing happens in your browser - no data is sent to external servers except for optional AI-powered analysis.

## 🌟 Features

### 🎙️ **Client-Side Audio Recording**
- High-quality audio capture using Web Audio API
- Real-time audio level monitoring
- Automatic noise reduction and gain control
- WAV format conversion for compatibility

### 🤖 **Intelligent Note Extraction**
- **AI-Powered Analysis**: Optional OpenAI integration for advanced insights
- **Rule-Based Fallback**: Works offline with pattern matching
- **Context-Aware Processing**: Optimized for meetings, interviews, lectures, and conversations
- **Multi-Language Support**: Ready for expansion to other languages

### 📱 **Modern Web Interface**
- Responsive design that works on desktop and mobile
- Tabbed interface for transcription and notes
- Real-time status updates and progress indicators
- Keyboard shortcuts for power users
- Dark/light theme adaptation

### 💾 **Local Data Management**
- Session history with local storage
- Export functionality (JSON, text, markdown)
- No server dependencies for core functionality
- Privacy-focused design

## 🚀 Quick Start

### Method 1: Simple Python Server (Recommended)

1. **Navigate to web directory**
   ```bash
   cd web/
   ```

2. **Run the server**
   ```bash
   python server.py
   ```

3. **Open your browser**
   - The app will automatically open at `https://localhost:8000`
   - Accept the self-signed certificate warning (safe for local use)

### Method 2: Any Web Server

You can serve the web app with any HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js (with serve package)
npx serve

# PHP
php -S localhost:8000

# Apache/Nginx
# Point document root to the web/ directory
```

**Important**: For microphone access, most browsers require HTTPS. The included server script automatically handles this.

## 🔧 Configuration

### Audio Settings

The app automatically configures optimal audio settings:
- **Sample Rate**: 16kHz (optimized for speech)
- **Channels**: Mono
- **Format**: WAV with 16-bit depth
- **Noise Reduction**: Enabled by default
- **Auto Gain**: Enabled by default

### AI-Powered Note Extraction (Optional)

To enable advanced note extraction:

1. **Get an OpenAI API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create an account and generate an API key

2. **Configure in App**
   - Click the "Settings" button
   - Enter your API key in the "OpenAI API Key" field
   - Click "Save Settings"

3. **Privacy Note**
   - Your API key is stored locally in your browser
   - Only transcription text is sent to OpenAI for analysis
   - Audio never leaves your device

### Context Types

Choose the appropriate context for better results:

- **General**: Casual conversations, personal notes
- **Meeting**: Business meetings, team discussions
- **Interview**: Job interviews, research interviews
- **Lecture**: Educational content, presentations

## 📋 Usage Guide

### Basic Recording

1. **Select Context**: Choose the type of content you're recording
2. **Start Recording**: Click the microphone button or press Spacebar
3. **Speak Clearly**: The app captures high-quality audio
4. **Stop Recording**: Click stop or press Spacebar again
5. **Review Results**: Transcription appears automatically

### Advanced Features

#### Keyboard Shortcuts
- **Spacebar**: Toggle recording
- **Escape**: Stop recording or close modals
- **Ctrl+E**: Extract notes manually
- **Ctrl+S**: Save current content

#### Export Options
- **Individual Files**: Save transcription or notes separately
- **Complete Export**: Download all data as JSON
- **History Export**: Export your entire session history

### Note Extraction Types

#### With AI (OpenAI API Key Required)
- **Meeting Analysis**: Decisions, action items, next steps
- **Interview Insights**: Key responses, follow-up questions
- **Lecture Notes**: Concepts, definitions, examples
- **General Insights**: Topics, tasks, key points

#### Without AI (Rule-Based)
- **Action Items**: Tasks and responsibilities
- **Key Points**: Important statements
- **Questions**: Extracted questions and inquiries
- **Decisions**: Identified decisions and agreements
- **Dates/Times**: Mentioned schedules and deadlines

## 🏗️ Technical Architecture

### Client-Side Processing
- **Audio Capture**: Web Audio API with MediaRecorder
- **Audio Processing**: Real-time noise reduction and format conversion
- **Note Extraction**: JavaScript-based pattern matching and AI integration
- **Data Storage**: Browser localStorage for history and settings

### Browser Compatibility
- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support with some limitations
- **Edge**: Full support

### Performance Considerations
- **Memory Usage**: ~50-100MB during active recording
- **Storage**: ~1MB per hour of transcription history
- **Processing**: Client-side only, no server dependencies

## 🔒 Privacy & Security

### Data Privacy
- **Local Processing**: All audio processing happens in your browser
- **No Server Storage**: Transcriptions never stored on external servers
- **Optional Cloud**: Only transcription text sent to OpenAI if API key provided
- **Local Storage**: History and settings stored in browser only

### Security Features
- **HTTPS Support**: Secure connection for microphone access
- **Self-Signed Certificates**: Generated automatically for local development
- **API Key Protection**: Keys stored locally and transmitted securely

## 🛠️ Development

### Project Structure
```
web/
├── index.html              # Main application page
├── styles.css              # Application styles
├── js/
│   ├── app.js              # Main application controller
│   ├── audio-recorder.js   # Audio recording functionality
│   └── note-extractor.js   # Note extraction engine
├── server.py               # Development server script
└── README_WEB.md          # This file
```

### Customization

#### Adding New Context Types
Edit `note-extractor.js` to add new context patterns:

```javascript
const prompts = {
    // Add new context
    "workshop": `
        Analyze this workshop transcription and extract:
        1. Key learning objectives
        2. Activities and exercises
        3. Participant feedback
        // ... custom prompt
    `
};
```

#### Modifying UI
- **Colors**: Edit CSS variables in `styles.css`
- **Layout**: Modify HTML structure in `index.html`
- **Functionality**: Add features in `app.js`

#### Advanced Audio Processing
The `AudioRecorder` class can be extended for:
- Custom audio filters
- Real-time transcription
- Multiple microphone support
- Audio visualization

## 🚀 Deployment

### Local Network Access

To access from other devices on your network:

```bash
python server.py --port 8000
# Then access via https://YOUR_IP:8000
```

### Static Hosting

Deploy to any static hosting service:

#### GitHub Pages
1. Push to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Access via `https://username.github.io/repository-name`

#### Netlify
1. Drag and drop the `web/` folder to Netlify
2. Configure custom domain if needed
3. Automatic HTTPS provided

#### Vercel
```bash
cd web/
npx vercel --static
```

#### Apache/Nginx
Copy files to web server document root and configure HTTPS.

## ⚡ Performance Tips

### For Best Audio Quality
- Use a good quality microphone
- Record in a quiet environment
- Speak clearly and at normal pace
- Keep microphone 6-12 inches from mouth

### For Better Note Extraction
- Use appropriate context settings
- Speak in structured sentences
- Mention names, dates, and actions clearly
- Include clear transitions between topics

### Browser Performance
- Close unnecessary tabs during recording
- Use Chrome or Firefox for best performance
- Clear browser cache if experiencing issues
- Ensure stable internet for AI features

## 🔧 Troubleshooting

### Common Issues

#### Microphone Not Working
- **Check Permissions**: Ensure microphone access is allowed
- **HTTPS Required**: Use the provided server script or proper HTTPS
- **Device Selection**: Try different microphone devices
- **Browser Support**: Update to latest browser version

#### Poor Transcription Quality
- **Audio Quality**: Improve recording environment
- **Speaking Clarity**: Speak more slowly and clearly
- **Background Noise**: Use noise reduction settings
- **Microphone Position**: Adjust distance and angle

#### Note Extraction Issues
- **API Key**: Verify OpenAI API key is correct and has credits
- **Internet Connection**: Check connection for AI features
- **Context Selection**: Choose appropriate context type
- **Content Structure**: Speak in more structured manner

#### Performance Problems
- **Browser Resources**: Close other applications
- **Local Storage**: Clear app data if corrupted
- **Cache Issues**: Hard refresh (Ctrl+F5)
- **Memory Usage**: Restart browser if needed

### Error Messages

#### "Audio recording not supported"
- Update browser to latest version
- Try different browser (Chrome recommended)
- Check if running on HTTPS

#### "Failed to initialize audio"
- Check microphone permissions
- Ensure microphone is connected
- Try refreshing the page

#### "OpenAI API error"
- Verify API key is correct
- Check OpenAI account status and credits
- Ensure internet connection is stable

## 🎯 Use Cases

### Business Meetings
- Capture decisions and action items
- Track project progress
- Generate meeting minutes
- Identify next steps and responsibilities

### Educational Content
- Take lecture notes automatically
- Extract key concepts and definitions
- Identify important examples
- Generate study materials

### Interviews
- Capture key insights and quotes
- Extract main discussion topics
- Generate follow-up questions
- Create structured summaries

### Personal Use
- Voice journaling with structure
- Meeting preparation notes
- Idea capture and organization
- Task and project planning

## 🔮 Future Enhancements

### Planned Features
- **Real-time Transcription**: Live transcription during recording
- **Multiple Languages**: Support for non-English content
- **Voice Commands**: Control app with voice
- **Advanced Export**: PDF and Word document generation
- **Team Collaboration**: Share notes with team members
- **Calendar Integration**: Auto-schedule follow-ups
- **Advanced Search**: Search through transcription history

### Technical Improvements
- **WebAssembly Whisper**: Fully offline transcription
- **Improved AI Models**: Better context understanding
- **Enhanced Audio Processing**: Advanced noise reduction
- **Progressive Web App**: Install as desktop app
- **Offline Functionality**: Work completely offline

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and feature requests:
- Create an issue in the repository
- Check the troubleshooting section
- Review browser console for error messages

---

**Audio Notes Extractor Web Edition** - Transform conversations into insights, right in your browser! 🎉