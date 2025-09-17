'use client';

import { useState } from 'react';

interface JSONImportInterfaceProps {
  onImportSuccess: (data: any) => void;
  onImportError: (error: string) => void;
}

export default function JSONImportInterface({ onImportSuccess, onImportError }: JSONImportInterfaceProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      onImportError('Please select a JSON file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      onImportError('File size must be less than 5MB');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Read file content
      const text = await file.text();
      setImportProgress(25);

      // Parse JSON
      const jsonData = JSON.parse(text);
      setImportProgress(50);

      // Validate JSON structure
      if (!validateMedicalAnalysisJSON(jsonData)) {
        throw new Error('Invalid medical analysis JSON format');
      }
      setImportProgress(75);

      // Process the imported data
      const processedData = await processImportedJSON(jsonData);
      setImportProgress(100);

      onImportSuccess({
        filename: file.name,
        data: processedData,
        original_json: jsonData
      });

    } catch (error) {
      onImportError(`Error importing JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const validateMedicalAnalysisJSON = (data: any): boolean => {
    try {
      // Check required fields
      if (!data.document_id || !data.metadata || !data.content || !data.chunks) {
        return false;
      }

      // Check metadata structure
      if (!data.metadata.source || !data.metadata.paper_metadata) {
        return false;
      }

      // Check content structure
      if (!data.content.paper_content || !data.content.doctor_annotations || !data.content.synthesis) {
        return false;
      }

      // Check LangChain compatibility
      if (!data.langchain_compatibility || !data.langchain_compatibility.document_type) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  const processImportedJSON = async (data: any) => {
    // Extract conversation data
    const conversationData = {
      document_id: data.document_id,
      paper_info: {
        filename: data.metadata.paper_metadata.filename || 'Unknown',
        chunks_count: data.chunks.length,
        total_characters: data.chunks.reduce((sum: number, chunk: any) => sum + chunk.content.length, 0)
      },
      doctor_annotations: data.content.doctor_annotations || [],
      synthesis: data.content.synthesis || {},
      chunks: data.chunks || [],
      vector_embeddings: data.vector_embeddings || {},
      langchain_compatibility: data.langchain_compatibility || {}
    };

    return conversationData;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-dashed border-blue-300">
      <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            📥 Import Medical Analysis
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Import previously exported medical literature analysis JSON files
          </p>
        </div>

        <div className="mb-4">
          <input
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
            id="json-file-input"
            disabled={isImporting}
          />
          <label
            htmlFor="json-file-input"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              isImporting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            } transition-colors`}
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Select JSON File
              </>
            )}
          </label>
        </div>

        {isImporting && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            ></div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>Supported format: Medical Analysis JSON (LangChain compatible)</p>
          <p>Max file size: 5MB</p>
        </div>
      </div>
    </div>
  );
}
