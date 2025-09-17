'use client';

import { useState } from 'react';

interface ApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
}

export default function ApiKeyInput({ onSubmit }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (apiKey.trim().length < 10) {
      setIsValid(false);
      return;
    }
    
    setIsValid(true);
    onSubmit(apiKey.trim());
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔑</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Enter Your OpenAI API Key
        </h2>
        <p className="text-gray-600 text-sm">
          Your API key is required to use the chat service. It will be stored locally and never sent to our servers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              if (!isValid) setIsValid(true);
            }}
            placeholder="sk-..."
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isValid ? 'border-gray-300' : 'border-red-300 focus:ring-red-500 focus:border-red-500'
            }`}
            required
          />
          {!isValid && (
            <p className="mt-1 text-sm text-red-600">
              Please enter a valid API key (at least 10 characters)
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Start Chatting
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">💡 How to get your API key:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">OpenAI Platform</a></li>
          <li>2. Sign in or create an account</li>
          <li>3. Navigate to API Keys section</li>
          <li>4. Create a new secret key</li>
          <li>5. Copy and paste it here</li>
        </ol>
      </div>
    </div>
  );
}

