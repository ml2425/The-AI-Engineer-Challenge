'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Settings, Key, MessageCircle } from 'lucide-react'
import ChatMessage from './components/ChatMessage'
import ApiKeyModal from './components/ApiKeyModal'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4.1-mini')
  const [developerMessage, setDeveloperMessage] = useState('You are a helpful AI assistant.')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Check if API key is stored in localStorage
    const storedApiKey = localStorage.getItem('ai-chat-api-key')
    if (storedApiKey) {
      setApiKey(storedApiKey)
    } else {
      setShowApiKeyModal(true)
    }
  }, [])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !apiKey) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: inputMessage,
          model: model,
          api_key: apiKey
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let assistantMessage = ''
      const assistantMessageId = (Date.now() + 1).toString()
      
      // Add initial assistant message
      const initialAssistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, initialAssistantMessage])

      // Stream the response
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        assistantMessage += chunk

        // Update the assistant message with new content
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: assistantMessage }
            : msg
        ))
      }

    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your API key and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const saveApiKey = (key: string) => {
    setApiKey(key)
    localStorage.setItem('ai-chat-api-key', key)
    setShowApiKeyModal(false)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Chat Assistant</h1>
              <p className="text-sm text-gray-500">Powered by {model}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>API Key</span>
            </button>
            <button
              onClick={clearChat}
              className="btn-secondary flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to AI Chat!</h3>
            <p className="text-gray-500">Start a conversation by typing a message below.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span>AI is thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="input-field resize-none"
              rows={1}
              disabled={isLoading || !apiKey}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim() || !apiKey}
            className="btn-primary flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
        
        {!apiKey && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please set your API key to start chatting.
            </p>
          </div>
        )}
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          onSave={saveApiKey}
          onClose={() => setShowApiKeyModal(false)}
          initialApiKey={apiKey}
          model={model}
          setModel={setModel}
          developerMessage={developerMessage}
          setDeveloperMessage={setDeveloperMessage}
        />
      )}
    </div>
  )
}
