"""
Vercel-compatible FastAPI app for PDF RAG functionality
Simplified version that works with Vercel serverless functions
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
import tempfile
from typing import Optional, Dict, Any
import PyPDF2
import numpy as np
import json
import uuid
from datetime import datetime

# Initialize FastAPI application
app = FastAPI(title="PDF RAG API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for RAG pipeline
vector_db = None
pdf_chunks = []

class ChatRequest(BaseModel):
    developer_message: str
    user_message: str
    model: Optional[str] = "gpt-4o-mini"
    api_key: str

class PDFQueryRequest(BaseModel):
    question: str
    api_key: str

class MedicalAnalysisRequest(BaseModel):
    question: str
    api_key: str
    context_type: str = "medical_literature"
    include_clinical_implications: bool = True
    doctor_input: Optional[str] = None

class JSONImportRequest(BaseModel):
    json_data: Dict[str, Any]
    api_key: str

def extract_text_from_pdf(pdf_file_path: str) -> str:
    """Extract text from PDF file"""
    try:
        reader = PyPDF2.PdfReader(pdf_file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list:
    """Simple text chunking"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    return chunks

async def create_embeddings(texts: list, api_key: str) -> list:
    """Create embeddings using OpenAI"""
    client = OpenAI(api_key=api_key)
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts
        )
        return [data.embedding for data in response.data]
    except Exception as e:
        raise Exception(f"Error creating embeddings: {str(e)}")

def cosine_similarity(a: list, b: list) -> float:
    """Calculate cosine similarity between two vectors"""
    dot_product = sum(x * y for x, y in zip(a, b))
    magnitude_a = sum(x * x for x in a) ** 0.5
    magnitude_b = sum(y * y for y in b) ** 0.5
    if magnitude_a == 0 or magnitude_b == 0:
        return 0
    return dot_product / (magnitude_a * magnitude_b)

async def search_similar_chunks(query: str, api_key: str, k: int = 4) -> list:
    """Search for similar chunks using embeddings"""
    global vector_db, pdf_chunks
    
    if not pdf_chunks:
        return []
    
    # Create query embedding
    query_embeddings = await create_embeddings([query], api_key)
    query_embedding = query_embeddings[0]
    
    # Calculate similarities
    similarities = []
    for i, chunk_embedding in enumerate(vector_db):
        similarity = cosine_similarity(query_embedding, chunk_embedding)
        similarities.append((i, similarity))
    
    # Sort by similarity and return top k
    similarities.sort(key=lambda x: x[1], reverse=True)
    return [(pdf_chunks[i], score) for i, score in similarities[:k]]

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """General chat endpoint"""
    try:
        # Debug logging
        print(f"Chat request received - Model: {request.model}, API Key: {request.api_key[:10]}...")
        
        client = OpenAI(api_key=request.api_key)
        
        messages = [
            {"role": "system", "content": request.developer_message},
            {"role": "user", "content": request.user_message}
        ]
        
        print(f"Sending request to OpenAI with model: {request.model}")
        response = client.chat.completions.create(
            model=request.model,
            messages=messages
        )
        
        print("OpenAI response received successfully")
        return {
            "success": True,
            "response": response.choices[0].message.content
        }
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "debug_info": {
                "model": request.model,
                "api_key_length": len(request.api_key) if request.api_key else 0,
                "error_type": type(e).__name__
            }
        }

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), api_key: str = Form(...)):
    """Upload and process PDF file"""
    global vector_db, pdf_chunks
    
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Extract text from PDF
            pdf_text = extract_text_from_pdf(temp_file_path)
            
            if not pdf_text.strip():
                raise Exception("No text content found in PDF")
            
            # Create chunks
            pdf_chunks = chunk_text(pdf_text)
            
            # Create embeddings
            vector_db = await create_embeddings(pdf_chunks, api_key)
            
            return {
                "success": True,
                "message": f"PDF processed successfully. {len(pdf_chunks)} chunks created.",
                "filename": file.filename,
                "chunks_count": len(pdf_chunks),
                "total_characters": len(pdf_text)
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error processing PDF: {str(e)}",
            "chunks_count": 0,
            "total_characters": 0
        }

@app.post("/api/query-pdf")
async def query_pdf(request: PDFQueryRequest):
    """Query the uploaded PDF using RAG"""
    global vector_db, pdf_chunks
    
    try:
        if not pdf_chunks:
            return {
                "success": False,
                "answer": "No PDF has been processed yet. Please upload a PDF first.",
                "context_count": 0,
                "sources": []
            }
        
        # Search for relevant chunks
        context_list = await search_similar_chunks(request.question, request.api_key)
        
        if not context_list:
            return {
                "success": False,
                "answer": "No relevant information found in the PDF for this question.",
                "context_count": 0,
                "sources": []
            }
        
        # Build context prompt
        context_prompt = ""
        sources = []
        
        for i, (context, score) in enumerate(context_list, 1):
            context_prompt += f"[Source {i}]: {context}\n\n"
            sources.append({
                "source_id": i,
                "content": context[:200] + "..." if len(context) > 200 else context,
                "relevance_score": round(score, 3)
            })
        
        # Create LLM prompt
        system_message = """You are a knowledgeable assistant that answers questions based strictly on provided context from uploaded PDF documents.

Instructions:
- Only answer questions using information from the provided PDF context
- If the PDF context doesn't contain relevant information, respond with "I don't have enough information in the uploaded PDF to answer this question"
- Be accurate and cite specific parts of the PDF when possible
- Keep responses concise and helpful
- Only use the provided PDF context. Do not use external knowledge"""

        user_message = f"""Context Information:
{context_prompt.strip()}

Number of relevant sources found: {len(context_list)}

Question: {request.question}

Please provide your answer based solely on the context above."""
        
        # Get response from LLM
        client = OpenAI(api_key=request.api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ]
        )
        
        answer = response.choices[0].message.content
        
        return {
            "success": True,
            "answer": answer,
            "context_count": len(context_list),
            "sources": sources,
            "question": request.question
        }
        
    except Exception as e:
        return {
            "success": False,
            "answer": f"Error processing question: {str(e)}",
            "context_count": 0,
            "sources": []
        }

@app.post("/api/medical-analysis")
async def medical_analysis(request: MedicalAnalysisRequest):
    """Medical literature analysis endpoint"""
    try:
        client = OpenAI(api_key=request.api_key)
        
        # Create medical-specific system prompt
        system_message = """You are a medical AI assistant specializing in literature analysis and clinical interpretation. 

Your role:
- Analyze medical literature with clinical accuracy
- Provide evidence-based insights
- Consider clinical implications and patient care
- Identify limitations and areas for further research
- Maintain medical terminology and precision

Guidelines:
- Base responses strictly on the provided medical literature
- Highlight clinical relevance and practical applications
- Identify potential limitations or biases in the research
- Suggest areas where additional research might be needed
- Use appropriate medical terminology
- Consider patient safety and clinical decision-making implications"""

        # Build user message with context
        user_message = f"""Medical Literature Analysis Request:

Question: {request.question}

Context Type: {request.context_type}
Include Clinical Implications: {request.include_clinical_implications}

{f"Doctor Input: {request.doctor_input}" if request.doctor_input else ""}

Please provide a comprehensive analysis including:
1. Direct answer based on medical literature
2. Clinical implications and practical applications
3. Limitations or considerations
4. Recommendations for clinical practice

Use appropriate medical terminology and maintain clinical accuracy."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ]
        )
        
        answer = response.choices[0].message.content
        
        # Extract clinical implications
        clinical_implications = []
        if request.include_clinical_implications:
            clinical_keywords = [
                "clinical implication", "patient care", "treatment", "diagnosis",
                "clinical practice", "medical management", "therapeutic", "prognosis"
            ]
            sentences = answer.split('.')
            for sentence in sentences:
                if any(keyword in sentence.lower() for keyword in clinical_keywords):
                    clinical_implications.append(sentence.strip())
        
        return {
            "success": True,
            "answer": answer,
            "clinical_implications": clinical_implications[:3],
            "confidence_score": 0.85,
            "context_type": request.context_type,
            "doctor_input": request.doctor_input
        }
        
    except Exception as e:
        return {
            "success": False,
            "answer": f"Error in medical analysis: {str(e)}",
            "clinical_implications": [],
            "confidence_score": 0.0
        }

@app.post("/api/import-json")
async def import_json(request: JSONImportRequest):
    """Import medical analysis JSON"""
    try:
        json_data = request.json_data
        
        # Validate structure
        if not all(key in json_data for key in ["document_id", "metadata", "content", "chunks"]):
            return {
                "success": False,
                "error": "Invalid JSON structure"
            }
        
        # Extract conversation data
        conversation_data = []
        for chunk in json_data.get("chunks", []):
            conversation_data.append({
                "question": chunk.get("metadata", {}).get("question", ""),
                "answer": chunk.get("content", ""),
                "doctor_input": chunk.get("metadata", {}).get("doctor_input"),
                "timestamp": chunk.get("timestamp", datetime.now().isoformat()),
                "confidence_score": chunk.get("metadata", {}).get("confidence_score", 0.85)
            })
        
        return {
            "success": True,
            "conversation_data": conversation_data,
            "paper_info": json_data.get("metadata", {}).get("paper_metadata", {}),
            "doctor_annotations": json_data.get("content", {}).get("doctor_annotations", []),
            "synthesis": json_data.get("content", {}).get("synthesis", {}),
            "document_id": json_data.get("document_id")
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Vercel handler
def handler(request):
    return app(request.scope, request.receive, request.send)
