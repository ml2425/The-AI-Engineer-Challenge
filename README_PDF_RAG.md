# 📄 PDF RAG Chat Feature

## 🎯 Overview

This application now supports **Retrieval Augmented Generation (RAG)** with PDF documents! Upload PDFs and chat with them using AI-powered question answering that only uses content from your uploaded documents.

## ✨ Features

- **📄 PDF Upload**: Upload PDF documents up to 10MB
- **🧠 RAG Processing**: Automatic text extraction and vector indexing
- **💬 PDF Chat**: Ask questions about your PDF content
- **📚 Source Citations**: See which parts of the PDF were used for answers
- **🎨 Dual Mode**: Switch between general chat and PDF chat
- **⚡ Real-time Processing**: Fast PDF processing and instant responses

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** with virtual environment
- **Node.js 18+** 
- **OpenAI API Key** (get one at [platform.openai.com](https://platform.openai.com/api-keys))

### Installation

1. **Clone and Setup Environment**
   ```bash
   # Navigate to project directory
   cd aichallenge
   
   # Activate virtual environment
   .\venv\Scripts\Activate.ps1  # Windows
   # source venv/bin/activate     # Mac/Linux
   ```

2. **Install Backend Dependencies**
   ```bash
   cd api
   pip install -r requirements.txt
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd api
   python app.py
   ```
   *Server runs on: http://localhost:8000*

2. **Start Frontend Server**
   ```bash
   cd frontend
   npm run dev
   ```
   *Frontend runs on: http://localhost:3000*

3. **Open Application**
   - Navigate to http://localhost:3000
   - Enter your OpenAI API key
   - Start chatting or uploading PDFs!

## 📖 How to Use PDF RAG

### Step 1: Enter API Key
- Open http://localhost:3000
- Enter your OpenAI API key
- Click "Start Chatting"

### Step 2: Switch to PDF Mode
- Click the "📄 PDF Chat" button
- You'll see the PDF upload interface

### Step 3: Upload PDF
- Click "Click to select PDF file"
- Select your PDF document (max 10MB)
- Wait for processing (you'll see progress indicator)
- Once complete, you'll see: "✅ PDF Ready for Chat"

### Step 4: Chat with PDF
- Ask questions about your PDF content
- Examples:
  - "What is this document about?"
  - "Summarize the main points"
  - "What are the key findings?"
  - "Explain [specific topic from PDF]"

### Step 5: View Sources
- Click "📚 Sources" to see which parts of the PDF were used
- View relevance scores for each source
- Understand how the AI found the information

## 🔧 API Endpoints

### Upload PDF
```http
POST /api/upload-pdf
Content-Type: multipart/form-data

file: [PDF file]
api_key: [OpenAI API key]
```

**Response:**
```json
{
  "success": true,
  "message": "PDF processed successfully. 15 chunks created.",
  "filename": "document.pdf",
  "chunks_count": 15,
  "total_characters": 12500
}
```

### Query PDF
```http
POST /api/query-pdf
Content-Type: application/json

{
  "question": "What is this document about?",
  "api_key": "sk-..."
}
```

**Response:**
```json
{
  "success": true,
  "answer": "This document discusses...",
  "context_count": 3,
  "sources": [
    {
      "source_id": 1,
      "content": "Relevant text excerpt...",
      "relevance_score": 0.856
    }
  ],
  "question": "What is this document about?"
}
```

## 🎨 User Interface

### Mode Selection
- **💬 General Chat**: Standard ChatGPT-like conversation
- **📄 PDF Chat**: Upload and chat with PDF documents

### PDF Upload Interface
- **Drag & Drop**: Easy file selection
- **Progress Indicator**: Shows processing status
- **File Validation**: Ensures PDF format and size limits
- **Error Handling**: Clear error messages

### PDF Chat Interface
- **Green Theme**: Distinguishes from general chat
- **Source Citations**: Expandable source references
- **Relevance Scores**: Shows how relevant each source is
- **Context Awareness**: Only answers based on PDF content

## 🛠️ Technical Details

### RAG Pipeline Components

1. **PDF Processing** (`pdf_service.py`)
   - Text extraction using PyPDF2
   - Document chunking with CharacterTextSplitter
   - Vector database creation

2. **Vector Database** (`aimakerspace/vectordatabase.py`)
   - OpenAI text-embedding-3-small embeddings
   - Cosine similarity search
   - Efficient document retrieval

3. **RAG Pipeline** (`aimakerspace/`)
   - Context-aware prompting
   - Source citation generation
   - Relevance scoring

### File Structure
```
aichallenge/
├── api/
│   ├── app.py              # FastAPI backend with PDF endpoints
│   ├── pdf_service.py      # PDF processing and RAG pipeline
│   └── requirements.txt    # Updated with PDF dependencies
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── PDFUpload.tsx        # PDF upload component
│   │   │   └── PDFChatInterface.tsx # PDF chat interface
│   │   └── page.tsx                 # Updated main page
│   └── package.json
└── aimakerspace/           # RAG library components
```

## 🧪 Testing

### Test Scenarios

1. **Basic PDF Upload**
   - Upload a PDF document
   - Verify processing completes successfully
   - Check chunk count and character count

2. **PDF Chat Functionality**
   - Ask questions about PDF content
   - Verify answers are based only on PDF
   - Check source citations and relevance scores

3. **Edge Cases**
   - Upload non-PDF file (should show error)
   - Upload large file >10MB (should show error)
   - Ask unrelated questions (should say "I don't have enough information")

4. **Mode Switching**
   - Switch between General Chat and PDF Chat
   - Verify state is maintained correctly

### Sample Test Questions

For a medical document:
- "What are the main symptoms described?"
- "What treatments are recommended?"
- "What are the risk factors mentioned?"

For a technical document:
- "What is the main technology discussed?"
- "What are the implementation steps?"
- "What are the key requirements?"

## 🔒 Security & Privacy

- **API Keys**: Stored locally in browser, never sent to our servers
- **PDF Processing**: Files are processed temporarily and deleted after processing
- **No Data Storage**: PDFs are not permanently stored on our servers
- **OpenAI Only**: PDF content is only sent to OpenAI for processing

## 🚨 Troubleshooting

### Common Issues

1. **"No module named 'aimakerspace'"**
   - Ensure you're in the correct directory with aimakerspace folder
   - Check Python path includes the project root

2. **PDF Upload Fails**
   - Verify file is a valid PDF
   - Check file size is under 10MB
   - Ensure OpenAI API key is valid

3. **Processing Errors**
   - Check if PDF has extractable text (not scanned images)
   - Verify OpenAI API key has sufficient credits
   - Check backend server is running on port 8000

4. **Frontend Issues**
   - Ensure backend is running on http://localhost:8000
   - Check browser console for errors
   - Verify CORS settings

### Debug Commands

```bash
# Test aimakerspace import
python -c "from aimakerspace.text_utils import TextFileLoader; print('Success')"

# Test PDF processing
python -c "import PyPDF2; print('PyPDF2 working')"

# Check server status
curl http://localhost:8000/api/health
```

## 🎯 Use Cases

### Educational
- **Research Papers**: Upload academic papers and ask questions
- **Textbooks**: Chat with textbook content for study help
- **Manuals**: Get instant answers from technical documentation

### Business
- **Reports**: Analyze business reports and extract insights
- **Contracts**: Ask questions about contract terms and conditions
- **Policies**: Understand company policies and procedures

### Personal
- **Health Documents**: Ask questions about medical reports
- **Legal Documents**: Understand legal documents and terms
- **Financial Reports**: Analyze financial statements and reports

## 🚀 Future Enhancements

- **Multiple PDF Support**: Upload and chat with multiple documents
- **PDF Management**: View, delete, and manage uploaded PDFs
- **Advanced Search**: Full-text search across PDF content
- **Export Features**: Export chat conversations and sources
- **Batch Processing**: Upload multiple PDFs at once

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all dependencies are installed correctly
3. Ensure both servers are running
4. Check browser console for error messages

---

**Happy PDF Chatting! 🎉**

*This feature demonstrates a complete RAG pipeline implementation using the aimakerspace library, providing a powerful way to interact with document content through natural language.*
