#!/usr/bin/env python3
"""
Test script for the Flask application.
Verifies all endpoints work correctly before deployment.
"""

import unittest
import json
import os
import sys
from app import app

class AudioNotesAppTestCase(unittest.TestCase):
    """Test cases for the Audio Notes Extractor Flask app."""

    def setUp(self):
        """Set up test client."""
        self.app = app.test_client()
        self.app.testing = True

    def test_index_page(self):
        """Test that the main page loads correctly."""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Audio Notes Extractor', response.data)

    def test_styles_css(self):
        """Test that CSS file is served correctly."""
        response = self.app.get('/styles.css')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'text/css')

    def test_javascript_files(self):
        """Test that JavaScript files are served correctly."""
        js_files = ['app.js', 'audio-recorder.js', 'note-extractor.js']
        
        for js_file in js_files:
            response = self.app.get(f'/js/{js_file}')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.mimetype, 'application/javascript')

    def test_health_endpoint(self):
        """Test the health check endpoint."""
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['service'], 'Audio Notes Extractor')

    def test_api_status(self):
        """Test the API status endpoint."""
        response = self.app.get('/api/status')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['api'], 'online')
        self.assertIn('features', data)

    def test_favicon(self):
        """Test favicon handling."""
        response = self.app.get('/favicon.ico')
        self.assertEqual(response.status_code, 204)

    def test_404_handling(self):
        """Test that 404s redirect to main app (SPA behavior)."""
        response = self.app.get('/nonexistent-page')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Audio Notes Extractor', response.data)

    def test_security_headers(self):
        """Test that security headers are present."""
        response = self.app.get('/')
        
        # Check for security headers
        self.assertIn('X-Content-Type-Options', response.headers)
        self.assertIn('X-Frame-Options', response.headers)
        self.assertIn('X-XSS-Protection', response.headers)
        self.assertIn('Content-Security-Policy', response.headers)

    def test_cors_headers(self):
        """Test that CORS headers are present."""
        response = self.app.get('/api/status')
        
        self.assertIn('Access-Control-Allow-Origin', response.headers)
        self.assertIn('Access-Control-Allow-Methods', response.headers)

def run_tests():
    """Run all tests and display results."""
    print("🧪 Testing Audio Notes Extractor Flask App")
    print("=" * 50)
    
    # Check if required files exist
    required_files = ['index.html', 'styles.css', 'js/app.js', 'js/audio-recorder.js', 'js/note-extractor.js']
    missing_files = []
    
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing required files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        print("\nPlease ensure all files are present before testing.")
        return False
    
    # Run the tests
    suite = unittest.TestLoader().loadTestsFromTestCase(AudioNotesAppTestCase)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 50)
    if result.wasSuccessful():
        print("✅ All tests passed! App is ready for deployment.")
        print("\nNext steps:")
        print("1. Commit your changes to GitHub")
        print("2. Connect your repository to Railway")
        print("3. Deploy and enjoy your live app!")
        return True
    else:
        print("❌ Some tests failed. Please fix the issues before deploying.")
        print(f"Failures: {len(result.failures)}")
        print(f"Errors: {len(result.errors)}")
        return False

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)