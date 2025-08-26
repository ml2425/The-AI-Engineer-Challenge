from http.server import BaseHTTPRequestHandler
import json
import os
from openai import OpenAI

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/chat':
            # Get request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            try:
                # Initialize OpenAI client
                client = OpenAI(api_key=request_data['api_key'])
                
                # Create chat completion
                response = client.chat.completions.create(
                    model=request_data['model'],
                    messages=[
                        {"role": "system", "content": request_data['developer_message']},
                        {"role": "user", "content": request_data['user_message']}
                    ],
                    stream=False
                )
                
                # Get response content
                assistant_message = response.choices[0].message.content
                
                # Send response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                response_data = {
                    "content": assistant_message,
                    "status": "success"
                }
                
                self.wfile.write(json.dumps(response_data).encode())
                
            except Exception as e:
                # Send error response
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                error_data = {
                    "error": str(e),
                    "status": "error"
                }
                
                self.wfile.write(json.dumps(error_data).encode())
        
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
