'use client';

import { useState, useRef, useEffect } from 'react';
import Message from './Message';

interface MedicalAnalysisInterfaceProps {
  apiKey: string;
  pdfInfo: {
    filename: string;
    chunks_count: number;
    total_characters: number;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'doctor';
  content: string;
  timestamp: Date;
  source?: 'paper' | 'doctor_input' | 'ai_analysis';
  metadata?: {
    doctor_name?: string;
    specialty?: string;
    confidence_score?: number;
  };
}

interface DoctorInput {
  name: string;
  specialty: string;
  input_type: 'text' | 'pdf';
  content: string;
  timestamp: Date;
}

export default function MedicalAnalysisInterface({ apiKey, pdfInfo }: MedicalAnalysisInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `🏥 Welcome to Medical Literature Analysis! I've processed "${pdfInfo.filename}" and I'm ready to help you analyze this medical paper. You can ask questions about the research, methodology, findings, or clinical implications.`,
      timestamp: new Date(),
      source: 'ai_analysis'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [doctorInput, setDoctorInput] = useState<DoctorInput>({
    name: '',
    specialty: '',
    input_type: 'text',
    content: '',
    timestamp: new Date()
  });
  const [showDoctorInput, setShowDoctorInput] = useState(false);
  const [exportedConversations, setExportedConversations] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      source: 'paper'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/medical-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputMessage,
          api_key: apiKey,
          context_type: 'medical_literature',
          include_clinical_implications: true
        }),
      });

      const result = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date(),
        source: 'ai_analysis',
        metadata: {
          confidence_score: result.confidence_score || 0.85
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        source: 'ai_analysis'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorInputSubmit = async () => {
    if (!doctorInput.name.trim() || !doctorInput.content.trim()) return;

    const doctorMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'doctor',
      content: `Dr. ${doctorInput.name} (${doctorInput.specialty}): ${doctorInput.content}`,
      timestamp: new Date(),
      source: 'doctor_input',
      metadata: {
        doctor_name: doctorInput.name,
        specialty: doctorInput.specialty
      }
    };

    setMessages(prev => [...prev, doctorMessage]);
    setDoctorInput({
      name: '',
      specialty: '',
      input_type: 'text',
      content: '',
      timestamp: new Date()
    });
    setShowDoctorInput(false);
  };

  const exportConversationToJSON = () => {
    const conversationData = {
      document_id: `medical_analysis_${Date.now()}`,
      metadata: {
        source: "medical_literature",
        paper_metadata: {
          filename: pdfInfo.filename,
          chunks_count: pdfInfo.chunks_count,
          total_characters: pdfInfo.total_characters,
          analysis_timestamp: new Date().toISOString()
        },
        doctor_metadata: {
          participants: messages
            .filter(m => m.role === 'doctor')
            .map(m => ({
              doctor_name: m.metadata?.doctor_name,
              specialty: m.metadata?.specialty
            }))
        }
      },
      content: {
        paper_content: {
          filename: pdfInfo.filename,
          chunks_processed: pdfInfo.chunks_count
        },
        doctor_annotations: messages
          .filter(m => m.role === 'doctor')
          .map(m => ({
            doctor_name: m.metadata?.doctor_name,
            specialty: m.metadata?.specialty,
            content: m.content,
            timestamp: m.timestamp
          })),
        synthesis: {
          conversation_summary: messages
            .filter(m => m.role === 'assistant')
            .map(m => m.content)
            .join('\n\n'),
          total_messages: messages.length,
          doctor_participants: new Set(
            messages
              .filter(m => m.role === 'doctor')
              .map(m => m.metadata?.doctor_name)
          ).size
        }
      },
      chunks: messages.map((message, index) => ({
        chunk_id: `chunk_${index + 1}`,
        content: message.content,
        chunk_type: message.role === 'doctor' ? 'doctor_annotation' : 
                   message.role === 'assistant' ? 'ai_analysis' : 'user_query',
        source: message.source || 'conversation',
        timestamp: message.timestamp,
        metadata: message.metadata || {}
      })),
      vector_embeddings: {
        model: "text-embedding-3-small",
        dimensions: 1536,
        chunk_embeddings: [] // Will be populated by backend
      },
      langchain_compatibility: {
        document_type: "MedicalLiteratureDocument",
        schema_version: "1.0",
        vector_store_ready: true
      }
    };

    const blob = new Blob([JSON.stringify(conversationData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical_analysis_${pdfInfo.filename.replace('.pdf', '')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportedConversations(prev => [...prev, conversationData]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-green-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-green-800">🏥 Medical Literature Analysis</h2>
            <p className="text-sm text-green-600">
              Analyzing: {pdfInfo.filename} • {pdfInfo.chunks_count} sections processed
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDoctorInput(!showDoctorInput)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              👨‍⚕️ Add Doctor Input
            </button>
            <button
              onClick={exportConversationToJSON}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              📥 Export Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Doctor Input Form */}
      {showDoctorInput && (
        <div className="bg-green-100 border-b border-green-200 p-4">
          <h3 className="text-lg font-medium text-green-800 mb-3">👨‍⚕️ Doctor Input</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Doctor Name</label>
              <input
                type="text"
                value={doctorInput.name}
                onChange={(e) => setDoctorInput(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Dr. Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">Specialty</label>
              <input
                type="text"
                value={doctorInput.specialty}
                onChange={(e) => setDoctorInput(prev => ({ ...prev, specialty: e.target.value }))}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Cardiology, Neurology, etc."
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-green-700 mb-1">Clinical Input</label>
            <textarea
              value={doctorInput.content}
              onChange={(e) => setDoctorInput(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Share your clinical insights, questions, or observations about this medical literature..."
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDoctorInputSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Doctor Input
            </button>
            <button
              onClick={() => setShowDoctorInput(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              <Message
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                sources={message.source ? [{
                  source_id: 1,
                  content: message.content,
                  relevance_score: message.metadata?.confidence_score || 0.85
                }] : undefined}
              />
              {message.metadata && (
                <div className="text-xs text-gray-500 mt-1">
                  {message.metadata.doctor_name && `Dr. ${message.metadata.doctor_name}`}
                  {message.metadata.specialty && ` (${message.metadata.specialty})`}
                  {message.metadata.confidence_score && ` • Confidence: ${(message.metadata.confidence_score * 100).toFixed(1)}%`}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-gray-600">Analyzing medical literature...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-green-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about the medical literature, clinical implications, methodology, or findings..."
            className="flex-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
