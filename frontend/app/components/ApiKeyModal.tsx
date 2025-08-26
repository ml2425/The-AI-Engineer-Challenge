import { useState, useEffect } from 'react'
import { X, Bot, MessageSquare, Save } from 'lucide-react'

interface ApiKeyModalProps {
  onSave: () => void
  onClose: () => void
  model: string
  setModel: (model: string) => void
  developerMessage: string
  setDeveloperMessage: (message: string) => void
}

export default function ApiKeyModal({
  onSave,
  onClose,
  model,
  setModel,
  developerMessage,
  setDeveloperMessage
}: ApiKeyModalProps) {
  const [tempModel, setTempModel] = useState(model)
  const [tempDeveloperMessage, setTempDeveloperMessage] = useState(developerMessage)

  const handleSave = () => {
    setModel(tempModel)
    setDeveloperMessage(tempDeveloperMessage)
    onSave()
  }

  const models = [
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (OpenAI)' },
    { value: 'gpt-4', label: 'GPT-4 (OpenAI)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Anthropic)' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Anthropic)' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Anthropic)' },
    { value: 'gemini-pro', label: 'Gemini Pro (Google)' },
    { value: 'llama-2-70b-chat', label: 'Llama 2 70B (Meta)' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Chat Settings</h2>
              <p className="text-sm text-gray-500">Configure your AI chat preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Model
            </label>
            <select
              value={tempModel}
              onChange={(e) => setTempModel(e.target.value)}
              className="input-field"
            >
              {models.map((modelOption) => (
                <option key={modelOption.value} value={modelOption.value}>
                  {modelOption.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Choose the AI model you want to use for conversations.
            </p>
          </div>

          {/* Developer Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Instructions
            </label>
            <textarea
              value={tempDeveloperMessage}
              onChange={(e) => setTempDeveloperMessage(e.target.value)}
              placeholder="Define how the AI should behave (e.g., 'You are a helpful coding assistant')"
              className="input-field"
              rows={3}
            />
            <p className="mt-2 text-sm text-gray-500">
              This message sets the context and behavior for the AI assistant.
            </p>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">API Key Information</h3>
            <p className="text-sm text-blue-800">
              The API key is configured on the server side. You can start chatting immediately without entering any keys.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}
