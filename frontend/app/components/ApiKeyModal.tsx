import { useState, useEffect } from 'react'
import { X, Key, Bot, MessageSquare, Save } from 'lucide-react'

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void
  onClose: () => void
  initialApiKey: string
  model: string
  setModel: (model: string) => void
  developerMessage: string
  setDeveloperMessage: (message: string) => void
}

export default function ApiKeyModal({
  onSave,
  onClose,
  initialApiKey,
  model,
  setModel,
  developerMessage,
  setDeveloperMessage
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [tempModel, setTempModel] = useState(model)
  const [tempDeveloperMessage, setTempDeveloperMessage] = useState(developerMessage)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    setIsValid(apiKey.trim().length > 0)
  }, [apiKey])

  const handleSave = () => {
    if (isValid) {
      setModel(tempModel)
      setDeveloperMessage(tempDeveloperMessage)
      onSave(apiKey)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleSave()
    }
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
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">API Configuration</h2>
              <p className="text-sm text-gray-500">Configure your AI chat settings</p>
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
          {/* API Key Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your API key"
                className="input-field pr-10"
              />
              <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>

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

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Getting API Keys</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>OpenAI:</strong> Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a></p>
              <p><strong>Anthropic:</strong> Visit <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a></p>
              <p><strong>Google:</strong> Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">makersuite.google.com</a></p>
            </div>
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
            disabled={!isValid}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  )
}
