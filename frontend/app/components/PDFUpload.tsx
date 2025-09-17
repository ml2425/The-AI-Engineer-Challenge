'use client';

import { useState } from 'react';

interface PDFUploadProps {
  onUploadSuccess: (result: any) => void;
  onUploadError: (error: string) => void;
  apiKey: string;
}

export default function PDFUpload({ onUploadSuccess, onUploadError, apiKey }: PDFUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      onUploadError('Please select a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onUploadError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUploadSuccess(result);
        setUploadProgress(100);
      } else {
        onUploadError(result.message || 'Upload failed');
      }
    } catch (error) {
      onUploadError('Network error. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Upload PDF Document
        </h2>
        <p className="text-gray-600 text-sm">
          Upload a PDF file to start asking questions about its content
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className={`cursor-pointer block ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="text-gray-500 mb-2">
              {isUploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              ) : (
                <span className="text-4xl">📁</span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {isUploading ? 'Processing PDF...' : 'Click to select PDF file'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: 10MB
            </p>
          </label>
        </div>

        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">💡 How it works:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Upload a PDF document</li>
          <li>2. The system will extract and process the text</li>
          <li>3. Start asking questions about the content</li>
          <li>4. Get answers based only on the PDF content</li>
        </ol>
      </div>
    </div>
  );
}
