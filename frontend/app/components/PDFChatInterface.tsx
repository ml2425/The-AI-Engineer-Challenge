'use client';

import { useState, useRef, useEffect } from 'react';
import Message from './Message';

interface PDFChatInterfaceProps {
  apiKey: string;
  pdfInfo: {
    filename: string;
    chunks_count: number;
    total_characters: number;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    source_id: number;
    content: string;
    relevance_score: number;
  }>;
}

export default function PDFChatInterface({ apiKey, pdfInfo }: PDFChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I've processed your PDF "${pdfInfo.filename}". I can now answer questions about its content. What would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/query-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          api_key: apiKey
        }),
      });

      const result = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.success ? result.answer : result.answer,
        timestamp: new Date(),
        sources: result.sources || []
      };
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your API key and try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Chat with PDF</h2>
        <p className="text-green-100 text-sm">
          Document: {pdfInfo.filename} • {pdfInfo.chunks_count} chunks processed
        </p>
      </div>

      {/* Messages Container */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <Message message={message} />
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 ml-4">
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">
                    📚 Sources ({message.sources.length})
                  </summary>
                  <div className="mt-2 space-y-1">
                    {message.sources.map((source) => (
                      <div key={source.source_id} className="bg-gray-50 p-2 rounded text-xs">
                        <div className="font-medium">Source {source.source_id} (Score: {source.relevance_score})</div>
                        <div className="text-gray-600">{source.content}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            <span className="text-sm">Analyzing PDF content...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-gray-50 p-4">
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about the PDF content..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Ask
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to ask, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
