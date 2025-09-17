"""
Minimal Vercel-compatible API
Simplified to ensure it works on Vercel
"""

import os
import json
from openai import OpenAI

def handler(request):
    """Main Vercel handler"""
    try:
        # Parse request
        if request.method == "GET":
            if request.path == "/api/health":
                return {
                    "statusCode": 200,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"status": "ok"})
                }
        
        elif request.method == "POST":
            # Parse request body
            body = json.loads(request.body) if request.body else {}
            
            if request.path == "/api/chat":
                return handle_chat(body)
            elif request.path == "/api/upload-pdf":
                return handle_pdf_upload(body)
            elif request.path == "/api/query-pdf":
                return handle_pdf_query(body)
        
        # Default response
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Not found"})
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }

def handle_chat(body):
    """Handle general chat"""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "OpenAI API key not configured"})
            }
        
        client = OpenAI(api_key=api_key)
        
        messages = [
            {"role": "system", "content": body.get("developer_message", "You are a helpful assistant.")},
            {"role": "user", "content": body.get("user_message", "Hello")}
        ]
        
        response = client.chat.completions.create(
            model=body.get("model", "gpt-4o-mini"),
            messages=messages
        )
        
        answer = response.choices[0].message.content
        
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"answer": answer})
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }

def handle_pdf_upload(body):
    """Handle PDF upload - simplified for now"""
    try:
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "success": True,
                "message": "PDF upload endpoint ready",
                "filename": body.get("filename", "test.pdf"),
                "chunks_count": 0,
                "total_characters": 0
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }

def handle_pdf_query(body):
    """Handle PDF query - simplified for now"""
    try:
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "success": False,
                "answer": "PDF functionality not yet implemented",
                "context_count": 0,
                "sources": []
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }
