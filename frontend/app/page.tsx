'use client';

import { useState, useRef, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ApiKeyInput from './components/ApiKeyInput';
import PDFUpload from './components/PDFUpload';
import PDFChatInterface from './components/PDFChatInterface';
import MedicalAnalysisInterface from './components/MedicalAnalysisInterface';
import JSONImportInterface from './components/JSONImportInterface';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'pdf' | 'medical'>('chat');
  const [pdfInfo, setPdfInfo] = useState<{
    filename: string;
    chunks_count: number;
    total_characters: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [importedData, setImportedData] = useState<any>(null);

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    setIsApiKeySet(true);
  };

  const handleResetApiKey = () => {
    setApiKey('');
    setIsApiKeySet(false);
    setActiveMode('chat');
    setPdfInfo(null);
    setUploadError('');
  };

  const handlePDFUploadSuccess = (result: any) => {
    setPdfInfo({
      filename: result.filename,
      chunks_count: result.chunks_count,
      total_characters: result.total_characters
    });
    setActiveMode('pdf');
    setUploadError('');
  };

  const handlePDFUploadError = (error: string) => {
    setUploadError(error);
  };

  const handleJSONImportSuccess = (data: any) => {
    setImportedData(data);
    setActiveMode('medical');
    setUploadError('');
  };

  const handleJSONImportError = (error: string) => {
    setUploadError(error);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🤖 AI Chat Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Chat with AI or upload PDFs to ask questions about documents
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

            {/* Mode Selection */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setActiveMode('chat')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeMode === 'chat'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💬 General Chat
                </button>
                <button
                  onClick={() => setActiveMode('pdf')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeMode === 'pdf'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📄 PDF Chat
                </button>
                <button
                  onClick={() => setActiveMode('medical')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeMode === 'medical'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🏥 Medical Analysis
                </button>
              </div>

              {activeMode === 'chat' && <ChatInterface apiKey={apiKey} />}
              
              {activeMode === 'pdf' && (
                <div className="space-y-4">
                  {!pdfInfo ? (
                    <div>
                      <PDFUpload
                        onUploadSuccess={handlePDFUploadSuccess}
                        onUploadError={handlePDFUploadError}
                        apiKey={apiKey}
                      />
                      {uploadError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 text-sm">❌ {uploadError}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-green-800">✅ PDF Ready for Chat</h3>
                            <p className="text-sm text-green-600">
                              {pdfInfo.filename} • {pdfInfo.chunks_count} chunks • {pdfInfo.total_characters.toLocaleString()} characters
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setPdfInfo(null);
                              setUploadError('');
                            }}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                          >
                            Upload New PDF
                          </button>
                        </div>
                      </div>
                      <PDFChatInterface apiKey={apiKey} pdfInfo={pdfInfo} />
                    </div>
                  )}
                </div>
              )}

              {activeMode === 'medical' && (
                <div className="space-y-4">
                  {!pdfInfo && !importedData ? (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">📄 Upload Medical Literature</h3>
                          <PDFUpload
                            onUploadSuccess={handlePDFUploadSuccess}
                            onUploadError={handlePDFUploadError}
                            apiKey={apiKey}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">📥 Import Previous Analysis</h3>
                          <JSONImportInterface
                            onImportSuccess={handleJSONImportSuccess}
                            onImportError={handleJSONImportError}
                          />
                        </div>
                      </div>
                      {uploadError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 text-sm">❌ {uploadError}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-red-800">🏥 Medical Analysis Ready</h3>
                            <p className="text-sm text-red-600">
                              {pdfInfo ? `${pdfInfo.filename} • ${pdfInfo.chunks_count} sections` : 
                               importedData ? `Imported: ${importedData.filename}` : 'Analysis loaded'}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setPdfInfo(null);
                              setImportedData(null);
                              setUploadError('');
                            }}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Start New Analysis
                          </button>
                        </div>
                      </div>
                      <MedicalAnalysisInterface 
                        apiKey={apiKey} 
                        pdfInfo={pdfInfo || {
                          filename: importedData?.filename || 'Imported Analysis',
                          chunks_count: importedData?.data?.paper_info?.chunks_count || 0,
                          total_characters: importedData?.data?.paper_info?.total_characters || 0
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

