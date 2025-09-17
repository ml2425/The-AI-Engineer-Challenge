'use client';

import { useState, useRef, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ApiKeyInput from './components/ApiKeyInput';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    setIsApiKeySet(true);
  };

  const handleResetApiKey = () => {
    setApiKey('');
    setIsApiKeySet(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🤖 AI Chat Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Your personal AI-powered chat companion
          </p>
        </div>

        {!isApiKeySet ? (
          <ApiKeyInput onSubmit={handleApiKeySubmit} />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
              <span className="text-sm text-gray-600">
                API Key: {apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 4)}
              </span>
              <button
                onClick={handleResetApiKey}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Change API Key
              </button>
            </div>
            <ChatInterface apiKey={apiKey} />
          </div>
        )}
      </div>
    </main>
  );
}

