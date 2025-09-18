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
  source?: 'paper' | 'doctor_input' | 'ai_analysis' | 'collaborative_analysis';
  metadata?: {
    doctor_name?: string;
    specialty?: string;
    confidence_score?: number;
    clinical_agreement?: 'agrees' | 'disagrees' | 'partial' | 'unclear';
    confidence_change?: number;
    branching_path?: string;
    follow_up_questions?: string[];
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
  const [clinicalConfidence, setClinicalConfidence] = useState<number>(0.85);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [branchingPaths, setBranchingPaths] = useState<{[key: string]: string}>({});
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
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
      // Use PDF query if we have PDF info, otherwise use general medical analysis
      const endpoint = pdfInfo ? '/api/query-pdf' : '/api/medical-analysis';
      const requestBody = pdfInfo 
        ? {
            question: inputMessage,
            api_key: apiKey
          }
        : {
            question: inputMessage,
            api_key: apiKey,
            context_type: 'medical_literature',
            include_clinical_implications: true
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
      console.error('Medical analysis error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
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
    
    // Trigger collaborative analysis
    await performCollaborativeAnalysis(doctorInput.content, doctorInput.name, doctorInput.specialty);
    
    setDoctorInput({
      name: '',
      specialty: '',
      input_type: 'text',
      content: '',
      timestamp: new Date()
    });
    setShowDoctorInput(false);
  };

  const performCollaborativeAnalysis = async (doctorInput: string, doctorName: string, specialty: string) => {
    setIsLoading(true);
    
    try {
      // Use PDF query if we have PDF info, otherwise use general medical analysis
      const endpoint = pdfInfo ? '/api/query-pdf' : '/api/medical-analysis';
      const requestBody = pdfInfo 
        ? {
            question: `Doctor Input Analysis: Dr. ${doctorName} (${specialty}) says: "${doctorInput}". Please analyze this input against the medical literature and provide collaborative analysis including agreement level, confidence changes, and follow-up questions.`,
            api_key: apiKey
          }
        : {
            question: `Doctor Input Analysis: Dr. ${doctorName} (${specialty}) says: "${doctorInput}". Please provide collaborative analysis including agreement level, confidence changes, and follow-up questions.`,
            api_key: apiKey,
            context_type: 'medical_literature',
            include_clinical_implications: true
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      // Parse the collaborative analysis response
      const analysis = parseCollaborativeAnalysis(result.answer || '');
      
      // Update clinical confidence based on analysis
      const newConfidence = Math.max(0.1, Math.min(0.95, clinicalConfidence + analysis.confidenceChange));
      setClinicalConfidence(newConfidence);
      
      // Create branching path if confidence change is significant
      let branchPath = currentBranch;
      if (Math.abs(analysis.confidenceChange) > 0.2) {
        const branchId = `branch_${Date.now()}`;
        const branchName = analysis.agreement === 'disagrees' ? 
          `Alternative_${specialty}_Approach` : 
          `Enhanced_${specialty}_Approach`;
        
        setBranchingPaths(prev => ({
          ...prev,
          [branchId]: branchName
        }));
        setCurrentBranch(branchId);
        branchPath = branchId;
      }

      const collaborativeMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: analysis.response,
        timestamp: new Date(),
        source: 'collaborative_analysis',
        metadata: {
          confidence_score: newConfidence,
          clinical_agreement: analysis.agreement,
          confidence_change: analysis.confidenceChange,
          branching_path: branchPath,
          follow_up_questions: analysis.followUpQuestions
        }
      };

      setMessages(prev => [...prev, collaborativeMessage]);
      
    } catch (error) {
      console.error('Collaborative analysis error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error in collaborative analysis: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        source: 'ai_analysis'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseCollaborativeAnalysis = (response: string) => {
    // Enhanced parsing with semantic analysis
    const responseLower = response.toLowerCase();
    let agreement: 'agrees' | 'disagrees' | 'partial' | 'unclear' = 'unclear';
    let confidenceChange = 0;
    let followUpQuestions: string[] = [];
    let analysisResponse = response;

    // Enhanced agreement detection with strength indicators
    const agreementPatterns = {
      strong_agreement: [
        'strongly agrees', 'fully supports', 'completely consistent', 
        'highly corroborates', 'definitively supports', 'clearly indicates'
      ],
      moderate_agreement: [
        'agrees', 'supports', 'consistent', 'corroborates', 'indicates',
        'moderately strong', 'somewhat supports', 'partially consistent'
      ],
      partial_agreement: [
        'partial', 'somewhat', 'mixed', 'limited support', 'inconclusive',
        'moderate evidence', 'some evidence', 'weakly supports'
      ],
      disagreement: [
        'disagrees', 'contradicts', 'inconsistent', 'refutes', 'challenges',
        'not supported', 'lacks evidence', 'conflicting'
      ]
    };

    // Check for strong agreement
    if (agreementPatterns.strong_agreement.some(pattern => responseLower.includes(pattern))) {
      agreement = 'agrees';
      confidenceChange = 0.15; // +15% for strong agreement
    }
    // Check for moderate agreement
    else if (agreementPatterns.moderate_agreement.some(pattern => responseLower.includes(pattern))) {
      agreement = 'agrees';
      confidenceChange = 0.08; // +8% for moderate agreement
    }
    // Check for partial agreement
    else if (agreementPatterns.partial_agreement.some(pattern => responseLower.includes(pattern))) {
      agreement = 'partial';
      confidenceChange = 0.03; // +3% for partial agreement
    }
    // Check for disagreement
    else if (agreementPatterns.disagreement.some(pattern => responseLower.includes(pattern))) {
      agreement = 'disagrees';
      confidenceChange = -0.12; // -12% for disagreement
    }

    // Look for explicit confidence change indicators
    const confidenceMatch = response.match(/confidence.*?([+-]?\d+\.?\d*)/i);
    if (confidenceMatch) {
      const explicitChange = parseFloat(confidenceMatch[1]) / 100;
      // Use explicit change if it's more significant than heuristic
      if (Math.abs(explicitChange) > Math.abs(confidenceChange)) {
        confidenceChange = explicitChange;
      }
    }

    // Look for evidence strength indicators
    const evidenceStrength = {
      'strong evidence': 0.12,
      'moderate evidence': 0.06,
      'weak evidence': 0.02,
      'limited evidence': 0.01,
      'insufficient evidence': -0.05,
      'conflicting evidence': -0.08
    };

    for (const [strength, change] of Object.entries(evidenceStrength)) {
      if (responseLower.includes(strength)) {
        confidenceChange = change;
        break;
      }
    }

    // Look for follow-up questions
    const questionMatches = response.match(/\d+\.\s*([^?]*\?)/g);
    if (questionMatches) {
      followUpQuestions = questionMatches.map(q => q.replace(/^\d+\.\s*/, '').trim());
    }

    // Look for clinical recommendation strength
    const clinicalStrength = {
      'strongly recommend': 0.1,
      'recommend': 0.05,
      'consider': 0.02,
      'not recommended': -0.08,
      'contraindicated': -0.15
    };

    for (const [strength, change] of Object.entries(clinicalStrength)) {
      if (responseLower.includes(strength)) {
        confidenceChange += change;
        break;
      }
    }

    return {
      agreement,
      confidenceChange: Math.max(-0.3, Math.min(0.3, confidenceChange)), // Cap at ±30%
      followUpQuestions,
      response: analysisResponse
    };
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
          ).size,
          clinical_confidence: clinicalConfidence,
          current_branch: currentBranch,
          branching_paths: branchingPaths,
          collaborative_analysis: {
            total_doctor_inputs: messages.filter(m => m.role === 'doctor').length,
            agreement_summary: {
              agrees: messages.filter(m => m.metadata?.clinical_agreement === 'agrees').length,
              disagrees: messages.filter(m => m.metadata?.clinical_agreement === 'disagrees').length,
              partial: messages.filter(m => m.metadata?.clinical_agreement === 'partial').length,
              unclear: messages.filter(m => m.metadata?.clinical_agreement === 'unclear').length
            },
            confidence_changes: messages
              .filter(m => m.metadata?.confidence_change)
              .map(m => ({
                timestamp: m.timestamp,
                change: m.metadata?.confidence_change,
                doctor: m.metadata?.doctor_name
              }))
          }
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
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">Clinical Confidence:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        clinicalConfidence > 0.7 ? 'bg-green-500' : 
                        clinicalConfidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${clinicalConfidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {Math.round(clinicalConfidence * 100)}%
                  </span>
                </div>
              </div>
              {currentBranch !== 'main' && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">Branch:</span>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {branchingPaths[currentBranch] || currentBranch}
                  </span>
                </div>
              )}
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                {showDebugInfo ? 'Hide' : 'Show'} Debug Info
              </button>
            </div>
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

      {/* Debug Info Panel */}
      {showDebugInfo && (
        <div className="bg-gray-100 border-b border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">🔍 Confidence Calculation Debug</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Current Confidence:</strong> {Math.round(clinicalConfidence * 100)}%</div>
            <div><strong>Current Branch:</strong> {currentBranch}</div>
            <div><strong>Branching Paths:</strong> {Object.keys(branchingPaths).length}</div>
            <div><strong>Algorithm:</strong> Enhanced semantic analysis with evidence strength detection</div>
            <div><strong>Confidence Range:</strong> 10% - 95% (capped at ±30% change per input)</div>
            <div className="mt-2">
              <strong>Key Patterns Detected:</strong>
              <ul className="ml-4 list-disc">
                <li>Strong agreement: +15% (strongly agrees, fully supports)</li>
                <li>Moderate agreement: +8% (agrees, supports, moderately strong)</li>
                <li>Partial agreement: +3% (partial, somewhat, limited support)</li>
                <li>Disagreement: -12% (disagrees, contradicts, not supported)</li>
                <li>Evidence strength: strong (+12%), moderate (+6%), weak (+2%)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

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
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  {message.metadata.doctor_name && `Dr. ${message.metadata.doctor_name}`}
                  {message.metadata.specialty && ` (${message.metadata.specialty})`}
                  {message.metadata.confidence_score && ` • Confidence: ${(message.metadata.confidence_score * 100).toFixed(1)}%`}
                  
                  {/* Collaborative Analysis Indicators */}
                  {message.metadata.clinical_agreement && (
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        message.metadata.clinical_agreement === 'agrees' ? 'bg-green-100 text-green-800' :
                        message.metadata.clinical_agreement === 'disagrees' ? 'bg-red-100 text-red-800' :
                        message.metadata.clinical_agreement === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {message.metadata.clinical_agreement === 'agrees' ? '✅ Agrees' :
                         message.metadata.clinical_agreement === 'disagrees' ? '❌ Disagrees' :
                         message.metadata.clinical_agreement === 'partial' ? '⚠️ Partial' : '❓ Unclear'}
                      </span>
                      {message.metadata.confidence_change && (
                        <span className={`text-xs ${
                          message.metadata.confidence_change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {message.metadata.confidence_change > 0 ? '+' : ''}{(message.metadata.confidence_change * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Follow-up Questions */}
                  {message.metadata.follow_up_questions && message.metadata.follow_up_questions.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-blue-700 mb-1">Follow-up Questions:</div>
                      {message.metadata.follow_up_questions.slice(0, 2).map((question, idx) => (
                        <div key={idx} className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-1">
                          {question}
                        </div>
                      ))}
                    </div>
                  )}
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
