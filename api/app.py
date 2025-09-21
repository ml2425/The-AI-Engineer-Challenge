# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import sys
import tempfile
import asyncio
from typing import Optional
from dotenv import load_dotenv

# Add current directory to Python path for Vercel
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Try to import pdf_service, but handle the error gracefully
try:
    from pdf_service import RAGPipeline
    PDF_SERVICE_AVAILABLE = True
except ImportError as e:
    print(f"Warning: pdf_service not available: {e}")
    PDF_SERVICE_AVAILABLE = False
    # Create a dummy RAGPipeline class for when imports fail
    class RAGPipeline:
        def __init__(self):
            pass
        async def build_vector_database(self, pdf_file_path: str):
            return {"success": False, "message": "PDF service not available on this deployment"}
        async def query_pdf(self, question: str, k: int = 4):
            return {"success": False, "answer": "PDF service not available on this deployment"}

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Global storage for processed PDFs (in production, use a database)
processed_pdfs = {}

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4o-mini"  # Optional model selection with default

class PDFQueryRequest(BaseModel):
    question: str         # User's question about the PDF

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Debug: Log available environment variables (for troubleshooting)
        print(f"DEBUG: Available env vars: {list(os.environ.keys())}")
        print(f"DEBUG: OPENAI_API_KEY exists: {'OPENAI_API_KEY' in os.environ}")
        
        # Get API key from environment variables
        api_key = os.getenv("OPENAI_API_KEY")
        print(f"DEBUG: API key length: {len(api_key) if api_key else 0}")
        
        if not api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        # Initialize OpenAI client with environment API key
        client = OpenAI(api_key=api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "system", "content": request.developer_message},
                    {"role": "user", "content": request.user_message}
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# PDF Upload endpoint for RAG pipeline
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload and process PDF file for RAG pipeline
    """
    try:
        # Debug: Log environment variable status
        print(f"DEBUG PDF Upload: OPENAI_API_KEY exists: {'OPENAI_API_KEY' in os.environ}")
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Create request-scoped RAG pipeline instance (uses environment API key)
        rag_pipeline = RAGPipeline()
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Process PDF with RAG pipeline
            result = await rag_pipeline.build_vector_database(temp_file_path)
            
            if result["success"]:
                # Store the processed PDF for future queries
                processed_pdfs["default"] = rag_pipeline
                
                return {
                    "success": True,
                    "message": result["message"],
                    "filename": file.filename,
                    "chunks_count": result["chunks_count"],
                    "total_characters": result["total_characters"]
                }
            else:
                raise HTTPException(status_code=500, detail=result["message"])
                
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# PDF Query endpoint for RAG pipeline
@app.post("/api/query-pdf")
async def query_pdf(request: PDFQueryRequest):
    """
    Query the uploaded PDF using RAG pipeline
    """
    try:
        # Check if PDF has been processed (using a simple key since we only support one API key)
        if "default" not in processed_pdfs:
            return {
                "success": False,
                "answer": "No PDF has been processed yet. Please upload a PDF first.",
                "context_count": 0,
                "sources": []
            }
        
        # Use the stored RAG pipeline instance
        rag_pipeline = processed_pdfs["default"]
        
        # Query the PDF
        result = await rag_pipeline.query_pdf(request.question)
        
        if result["success"]:
            return {
                "success": True,
                "answer": result["answer"],
                "context_count": result["context_count"],
                "sources": result["sources"],
                "question": result["question"]
            }
        else:
            return {
                "success": False,
                "answer": result["answer"],
                "context_count": result["context_count"],
                "sources": result["sources"]
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Define a health check endpoint to verify API status
@app.get("/api/debug")
async def debug_env():
    """Debug endpoint to check environment variables"""
    try:
        # Safely get environment variables
        env_vars = list(os.environ.keys()) if os.environ else []
        openai_key_exists = "OPENAI_API_KEY" in os.environ if os.environ else False
        openai_key = os.getenv("OPENAI_API_KEY", "")
        openai_key_length = len(openai_key) if openai_key else 0
        
        return {
            "status": "debug",
            "env_vars": env_vars,
            "openai_key_exists": openai_key_exists,
            "openai_key_length": openai_key_length,
            "python_version": sys.version
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/simple")
async def simple_test():
    """Simple test endpoint without complex imports"""
    return {"status": "simple", "message": "Basic endpoint working"}

# Import Mangum for Vercel serverless deployment
from mangum import Mangum

# Vercel handler for serverless deployment
handler = Mangum(app)

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
