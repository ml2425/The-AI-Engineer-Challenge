"""
PDF Processing Service for RAG Pipeline
Handles PDF text extraction and document preparation for RAG
"""

import os
import sys
import tempfile
from typing import List, Dict, Any
import PyPDF2

# Add parent directory to Python path to find aimakerspace module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from aimakerspace.text_utils import TextFileLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.chatmodel import ChatOpenAI
from aimakerspace.openai_utils.prompts import SystemRolePrompt, UserRolePrompt
import asyncio
import numpy as np


class PDFProcessor:
    """Handles PDF text extraction and processing for RAG pipeline"""
    
    def __init__(self):
        self.text_splitter = CharacterTextSplitter()
    
    def extract_text_from_pdf(self, pdf_file_path: str) -> str:
        """
        Extract text from PDF file
        
        Args:
            pdf_file_path: Path to the PDF file
            
        Returns:
            Extracted text content
        """
        try:
            with open(pdf_file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text() + "\n"
                
                return text.strip()
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")
    
    def process_pdf_text(self, text: str) -> List[str]:
        """
        Process extracted PDF text into chunks for RAG
        
        Args:
            text: Raw text from PDF
            
        Returns:
            List of text chunks
        """
        # Split text into manageable chunks
        documents = [text]
        split_documents = self.text_splitter.split_texts(documents)
        return split_documents


class RAGPipeline:
    """Complete RAG Pipeline for PDF-based question answering"""
    
    def __init__(self, api_key: str = None):
        self.pdf_processor = PDFProcessor()
        self.vector_db = None
        self.api_key = api_key
        self.llm = None  # Will be initialized when API key is provided
        self.rag_system_prompt = None
        self.rag_user_prompt = None
        self._setup_prompts()
        
        # Initialize LLM if API key is provided
        if self.api_key:
            self.llm = ChatOpenAI(api_key=self.api_key)
    
    def _setup_prompts(self):
        """Setup RAG-specific prompts"""
        RAG_SYSTEM_TEMPLATE = """You are a knowledgeable assistant that answers questions based strictly on provided context from uploaded PDF documents.

Instructions:
- Only answer questions using information from the provided PDF context
- If the PDF context doesn't contain relevant information, respond with "I don't have enough information in the uploaded PDF to answer this question"
- Be accurate and cite specific parts of the PDF when possible
- Keep responses concise and helpful
- Only use the provided PDF context. Do not use external knowledge
- If asked about topics not covered in the PDF, politely explain that you can only answer questions about the uploaded document"""

        RAG_USER_TEMPLATE = """PDF Context Information:
{context}

Number of relevant sources found: {context_count}

Question: {user_query}

Please provide your answer based solely on the PDF context above."""

        self.rag_system_prompt = SystemRolePrompt(RAG_SYSTEM_TEMPLATE)
        self.rag_user_prompt = UserRolePrompt(RAG_USER_TEMPLATE)
    
    async def build_vector_database(self, pdf_file_path: str) -> Dict[str, Any]:
        """
        Build vector database from PDF file
        
        Args:
            pdf_file_path: Path to the PDF file
            
        Returns:
            Dictionary with processing results
        """
        try:
            # Extract text from PDF
            pdf_text = self.pdf_processor.extract_text_from_pdf(pdf_file_path)
            
            if not pdf_text.strip():
                raise Exception("No text content found in PDF")
            
            # Process text into chunks
            text_chunks = self.pdf_processor.process_pdf_text(pdf_text)
            
            # Build vector database
            self.vector_db = VectorDatabase()
            self.vector_db = await self.vector_db.abuild_from_list(text_chunks)
            
            return {
                "success": True,
                "message": f"PDF processed successfully. {len(text_chunks)} chunks created.",
                "chunks_count": len(text_chunks),
                "total_characters": len(pdf_text)
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error processing PDF: {str(e)}",
                "chunks_count": 0,
                "total_characters": 0
            }
    
    async def query_pdf(self, question: str, k: int = 4) -> Dict[str, Any]:
        """
        Query the PDF using RAG pipeline
        
        Args:
            question: User's question
            k: Number of relevant chunks to retrieve
            
        Returns:
            Dictionary with answer and metadata
        """
        if self.vector_db is None:
            return {
                "success": False,
                "answer": "No PDF has been processed yet. Please upload a PDF first.",
                "context_count": 0,
                "sources": []
            }
        
        try:
            # Ensure LLM is initialized with API key
            if self.llm is None and self.api_key:
                self.llm = ChatOpenAI(api_key=self.api_key)
            elif self.llm is None:
                return {
                    "success": False,
                    "answer": "No API key provided for LLM initialization.",
                    "context_count": 0,
                    "sources": []
                }
            
            # Retrieve relevant contexts
            context_list = self.vector_db.search_by_text(question, k=k)
            
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
            
            # Create messages for LLM
            system_message = self.rag_system_prompt.create_message()
            user_message = self.rag_user_prompt.create_message(
                user_query=question,
                context=context_prompt.strip(),
                context_count=len(context_list)
            )
            
            # Get response from LLM
            answer = self.llm.run([system_message, user_message])
            
            return {
                "success": True,
                "answer": answer,
                "context_count": len(context_list),
                "sources": sources,
                "question": question
            }
            
        except Exception as e:
            return {
                "success": False,
                "answer": f"Error processing question: {str(e)}",
                "context_count": 0,
                "sources": []
            }


# No global instance - create request-scoped instances for concurrency safety
