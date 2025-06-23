#!/usr/bin/env python3
"""
Simple HTTP server for the Audio Notes Extractor web app.
Serves the web application locally with HTTPS support for microphone access.
"""

import http.server
import ssl
import socketserver
import os
import webbrowser
import time
from pathlib import Path

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with CORS support."""
    
    def end_headers(self):
        """Add CORS headers to all responses."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight requests."""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Custom log format."""
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def create_self_signed_cert():
    """Create a self-signed certificate for HTTPS."""
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        import datetime
        
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        
        # Create certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Local"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Local"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Audio Notes Extractor"),
            x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
        ])
        
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.utcnow()
        ).not_valid_after(
            datetime.datetime.utcnow() + datetime.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName("localhost"),
                x509.IPAddress("127.0.0.1"),
            ]),
            critical=False,
        ).sign(private_key, hashes.SHA256())
        
        # Write certificate and key to files
        with open("server.crt", "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        with open("server.key", "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        return True
        
    except ImportError:
        print("Warning: cryptography package not available. Using HTTP instead of HTTPS.")
        print("Note: Microphone access requires HTTPS in most browsers.")
        return False

def run_server(port=8000, use_https=True):
    """Run the web server."""
    
    # Change to web directory
    web_dir = Path(__file__).parent
    os.chdir(web_dir)
    
    print("🎙️ Audio Notes Extractor - Web Server")
    print("=" * 50)
    
    # Try to create HTTPS certificates
    has_ssl = False
    if use_https:
        if os.path.exists("server.crt") and os.path.exists("server.key"):
            has_ssl = True
            print("✅ SSL certificates found")
        else:
            print("🔧 Creating SSL certificates...")
            has_ssl = create_self_signed_cert()
            if has_ssl:
                print("✅ SSL certificates created")
    
    # Start server
    with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
        if has_ssl and use_https:
            # Configure SSL
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            context.load_cert_chain("server.crt", "server.key")
            httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
            
            protocol = "https"
            print(f"🔒 Starting HTTPS server on port {port}")
        else:
            protocol = "http"
            print(f"🌐 Starting HTTP server on port {port}")
            if use_https:
                print("⚠️  Note: Using HTTP. Microphone access may be limited.")
        
        url = f"{protocol}://localhost:{port}"
        print(f"📱 Server running at: {url}")
        print(f"📁 Serving files from: {web_dir}")
        print()
        print("Controls:")
        print("  - Press Ctrl+C to stop the server")
        print("  - The web app will open automatically in your browser")
        print()
        
        # Open browser
        try:
            webbrowser.open(url)
            print("🌐 Opening browser...")
        except Exception as e:
            print(f"Could not open browser automatically: {e}")
            print(f"Please open {url} manually in your browser")
        
        print()
        print("Server Logs:")
        print("-" * 30)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Server stopped by user")
            
            # Clean up certificates
            if has_ssl and os.path.exists("server.crt"):
                try:
                    os.remove("server.crt")
                    os.remove("server.key")
                    print("🧹 Cleaned up SSL certificates")
                except:
                    pass

def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Audio Notes Extractor Web Server")
    parser.add_argument("--port", type=int, default=8000, help="Port to serve on (default: 8000)")
    parser.add_argument("--http", action="store_true", help="Use HTTP instead of HTTPS")
    parser.add_argument("--no-browser", action="store_true", help="Don't open browser automatically")
    
    args = parser.parse_args()
    
    # Check if we're in the right directory
    if not os.path.exists("index.html"):
        print("❌ Error: index.html not found")
        print("Please run this script from the web directory")
        return 1
    
    try:
        run_server(port=args.port, use_https=not args.http)
        return 0
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Error: Port {args.port} is already in use")
            print("Try a different port with --port <number>")
        else:
            print(f"❌ Error starting server: {e}")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())