#!/usr/bin/env python3
"""
Production Flask server for Audio Notes Extractor web app.
Optimized for Railway deployment.
"""

import os
from flask import Flask, send_from_directory, send_file, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
app.config['ENV'] = os.environ.get('FLASK_ENV', 'production')

@app.route('/')
def index():
    """Serve the main application page."""
    return send_file('index.html')

@app.route('/styles.css')
def styles():
    """Serve the CSS file."""
    return send_file('styles.css', mimetype='text/css')

@app.route('/js/<path:filename>')
def js_files(filename):
    """Serve JavaScript files."""
    return send_from_directory('js', filename, mimetype='application/javascript')

@app.route('/favicon.ico')
def favicon():
    """Serve favicon - return empty response to avoid 404s."""
    return '', 204

@app.route('/health')
def health_check():
    """Health check endpoint for Railway."""
    return jsonify({
        'status': 'healthy',
        'service': 'Audio Notes Extractor',
        'version': '1.0.0'
    })

@app.route('/api/status')
def api_status():
    """API status endpoint."""
    return jsonify({
        'api': 'online',
        'features': {
            'audio_recording': True,
            'note_extraction': True,
            'local_storage': True,
            'export': True
        }
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors by serving the main app (SPA behavior)."""
    return send_file('index.html')

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        'error': 'Internal server error',
        'message': 'Please try again later'
    }), 500

# Security headers
@app.after_request
def after_request(response):
    """Add security headers to all responses."""
    # CORS headers for API access
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    
    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Allow microphone access (required for audio recording)
    if 'Content-Security-Policy' not in response.headers:
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
            "font-src 'self' https://cdnjs.cloudflare.com; "
            "media-src 'self' blob:; "
            "connect-src 'self' https://api.openai.com; "
            "img-src 'self' data:;"
        )
    
    # Set cache headers for static assets
    if response.mimetype in ['text/css', 'application/javascript']:
        response.headers['Cache-Control'] = 'public, max-age=31536000'  # 1 year
    elif response.mimetype == 'text/html':
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    
    return response

if __name__ == '__main__':
    # Get port from environment (Railway sets this)
    port = int(os.environ.get('PORT', 8000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🎙️ Audio Notes Extractor starting on {host}:{port}")
    print(f"🌐 Environment: {app.config['ENV']}")
    print(f"🔧 Debug mode: {debug}")
    
    app.run(host=host, port=port, debug=debug)