"""
Medical Literature Analysis Service
Handles medical paper analysis, doctor input, and JSON export/import
"""

import os
import sys
import json
import tempfile
from typing import List, Dict, Any, Optional
import PyPDF2
import numpy as np
from openai import OpenAI
import uuid
from datetime import datetime

# Add parent directory to Python path to find aimakerspace module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from aimakerspace.text_utils import CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase

class MedicalAnalysisService:
    """Service for medical literature analysis and doctor collaboration"""
    
    def __init__(self):
        self.text_splitter = CharacterTextSplitter()
        self.vector_db: Optional[VectorDatabase] = None
        self.llm = None
        self.medical_chunks = []
        self.conversation_history = []
        
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF file"""
        try:
            reader = PyPDF2.PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")
    
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Chunk text for medical literature analysis"""
        documents = [text]
        split_documents = self.text_splitter.split_texts(documents)
        return split_documents
    
    async def create_embeddings(self, texts: List[str], api_key: str) -> List[List[float]]:
        """Create embeddings using OpenAI"""
        if self.llm is None:
            self.llm = OpenAI(api_key=api_key)
        
        try:
            response = self.llm.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            raise Exception(f"Error creating embeddings: {str(e)}")
    
    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = sum(x * y for x, y in zip(a, b))
        magnitude_a = sum(x * x for x in a) ** 0.5
        magnitude_b = sum(y * y for y in b) ** 0.5
        if magnitude_a == 0 or magnitude_b == 0:
            return 0
        return dot_product / (magnitude_a * magnitude_b)
    
    async def search_medical_chunks(self, query: str, api_key: str, k: int = 4) -> List[tuple]:
        """Search for relevant medical chunks"""
        if not self.medical_chunks:
            return []
        
        # Create query embedding
        query_embeddings = await self.create_embeddings([query], api_key)
        query_embedding = query_embeddings[0]
        
        # Calculate similarities
        similarities = []
        for i, chunk_embedding in enumerate(self.vector_db):
            similarity = self.cosine_similarity(query_embedding, chunk_embedding)
            similarities.append((i, similarity))
        
        # Sort by similarity and return top k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return [(self.medical_chunks[i], score) for i, score in similarities[:k]]
    
    async def analyze_medical_literature(self, pdf_path: str, api_key: str) -> Dict[str, Any]:
        """Analyze medical literature and build vector database"""
        try:
            # Extract text from PDF
            pdf_text = self.extract_text_from_pdf(pdf_path)
            
            if not pdf_text.strip():
                raise Exception("No text content found in PDF")
            
            # Create chunks
            self.medical_chunks = self.chunk_text(pdf_text)
            
            # Create embeddings
            embeddings = await self.create_embeddings(self.medical_chunks, api_key)
            
            # Build vector database
            self.vector_db = VectorDatabase()
            self.vector_db = await self.vector_db.abuild_from_list(self.medical_chunks)
            
            return {
                "success": True,
                "message": f"Medical literature processed successfully. {len(self.medical_chunks)} sections analyzed.",
                "chunks_count": len(self.medical_chunks),
                "total_characters": len(pdf_text),
                "analysis_type": "medical_literature"
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error analyzing medical literature: {str(e)}",
                "chunks_count": 0,
                "total_characters": 0
            }
    
    async def query_medical_literature(self, question: str, api_key: str, doctor_input: Optional[str] = None) -> Dict[str, Any]:
        """Query medical literature with clinical context"""
        if not self.medical_chunks:
            return {
                "success": False,
                "answer": "No medical literature has been processed yet. Please upload a medical paper first.",
                "context_count": 0,
                "sources": [],
                "clinical_implications": []
            }
        
        try:
            # Initialize LLM if not already done
            if self.llm is None:
                self.llm = OpenAI(api_key=api_key)
            
            # Search for relevant chunks
            context_list = await self.search_medical_chunks(question, api_key)
            
            if not context_list:
                return {
                    "success": False,
                    "answer": "No relevant information found in the medical literature for this question.",
                    "context_count": 0,
                    "sources": [],
                    "clinical_implications": []
                }
            
            # Build context prompt
            context_prompt = ""
            sources = []
            
            for i, (context, score) in enumerate(context_list, 1):
                context_prompt += f"[Medical Literature Section {i}]: {context}\n\n"
                sources.append({
                    "source_id": i,
                    "content": context[:200] + "..." if len(context) > 200 else context,
                    "relevance_score": round(score, 3),
                    "source_type": "medical_literature"
                })
            
            # Add doctor input if provided
            doctor_context = ""
            if doctor_input:
                doctor_context = f"\n\n[Doctor Clinical Input]: {doctor_input}"
            
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

            user_message = f"""Medical Literature Context:
{context_prompt.strip()}{doctor_context}

Clinical Question: {question}

Please provide a comprehensive analysis including:
1. Direct answer based on the literature
2. Clinical implications
3. Limitations or considerations
4. Practical applications for patient care

Number of relevant sources: {len(context_list)}"""
            
            # Get response from LLM
            response = self.llm.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ]
            )
            
            answer = response.choices[0].message.content
            
            # Extract clinical implications
            clinical_implications = self.extract_clinical_implications(answer)
            
            # Store conversation
            self.conversation_history.append({
                "question": question,
                "answer": answer,
                "doctor_input": doctor_input,
                "timestamp": datetime.now().isoformat(),
                "sources": sources
            })
            
            return {
                "success": True,
                "answer": answer,
                "context_count": len(context_list),
                "sources": sources,
                "question": question,
                "clinical_implications": clinical_implications,
                "confidence_score": min(0.95, max(0.7, np.mean([s["relevance_score"] for s in sources])))
            }
            
        except Exception as e:
            return {
                "success": False,
                "answer": f"Error analyzing medical literature: {str(e)}",
                "context_count": 0,
                "sources": [],
                "clinical_implications": []
            }
    
    def extract_clinical_implications(self, answer: str) -> List[str]:
        """Extract clinical implications from the answer"""
        implications = []
        
        # Simple keyword-based extraction
        clinical_keywords = [
            "clinical implication", "patient care", "treatment", "diagnosis",
            "clinical practice", "medical management", "therapeutic", "prognosis"
        ]
        
        sentences = answer.split('.')
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in clinical_keywords):
                implications.append(sentence.strip())
        
        return implications[:3]  # Return top 3 implications
    
    def export_conversation_to_json(self, pdf_info: Dict[str, Any], conversation_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Export conversation to LangChain-compatible JSON format"""
        
        document_id = f"medical_analysis_{uuid.uuid4().hex[:8]}"
        
        # Extract doctor participants
        doctor_participants = set()
        doctor_annotations = []
        
        for conv in conversation_data:
            if conv.get("doctor_input"):
                doctor_participants.add("Doctor")
                doctor_annotations.append({
                    "doctor_name": "Doctor",
                    "specialty": "General",
                    "content": conv["doctor_input"],
                    "timestamp": conv["timestamp"]
                })
        
        # Create LangChain-compatible structure
        export_data = {
            "document_id": document_id,
            "metadata": {
                "source": "medical_literature",
                "paper_metadata": {
                    "filename": pdf_info.get("filename", "unknown.pdf"),
                    "chunks_count": pdf_info.get("chunks_count", 0),
                    "total_characters": pdf_info.get("total_characters", 0),
                    "analysis_timestamp": datetime.now().isoformat()
                },
                "doctor_metadata": {
                    "participants": list(doctor_participants),
                    "total_annotations": len(doctor_annotations)
                }
            },
            "content": {
                "paper_content": {
                    "filename": pdf_info.get("filename", "unknown.pdf"),
                    "chunks_processed": pdf_info.get("chunks_count", 0)
                },
                "doctor_annotations": doctor_annotations,
                "synthesis": {
                    "conversation_summary": "\n\n".join([conv["answer"] for conv in conversation_data]),
                    "total_messages": len(conversation_data),
                    "doctor_participants": len(doctor_participants),
                    "clinical_implications": [imp for conv in conversation_data for imp in conv.get("clinical_implications", [])]
                }
            },
            "chunks": [
                {
                    "chunk_id": f"chunk_{i+1}",
                    "content": conv["answer"],
                    "chunk_type": "ai_analysis",
                    "source": "medical_literature",
                    "timestamp": conv["timestamp"],
                    "metadata": {
                        "question": conv["question"],
                        "doctor_input": conv.get("doctor_input"),
                        "confidence_score": conv.get("confidence_score", 0.85)
                    }
                }
                for i, conv in enumerate(conversation_data)
            ],
            "vector_embeddings": {
                "model": "text-embedding-3-small",
                "dimensions": 1536,
                "chunk_embeddings": []  # Will be populated by vector database
            },
            "langchain_compatibility": {
                "document_type": "MedicalLiteratureDocument",
                "schema_version": "1.0",
                "vector_store_ready": True,
                "retrieval_ready": True
            }
        }
        
        return export_data
    
    def import_conversation_from_json(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """Import conversation from JSON format"""
        try:
            # Validate structure
            if not all(key in json_data for key in ["document_id", "metadata", "content", "chunks"]):
                raise ValueError("Invalid JSON structure")
            
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
                "synthesis": json_data.get("content", {}).get("synthesis", {})
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# Global medical analysis service instance
medical_service = MedicalAnalysisService()
