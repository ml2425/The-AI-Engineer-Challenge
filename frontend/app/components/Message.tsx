'use client';

interface MessageProps {
  message?: {
    role: 'user' | 'assistant' | 'doctor';
    content: string;
    timestamp: Date;
  };
  role?: 'user' | 'assistant' | 'doctor';
  content?: string;
  timestamp?: Date;
  sources?: Array<{
    source_id: number;
    content: string;
    relevance_score: number;
  }>;
}

export default function Message({ message, role, content, timestamp, sources }: MessageProps) {
  // Handle both formats: message object or individual props
  const messageData = message || { role: role!, content: content!, timestamp: timestamp! };
  const isUser = messageData.role === 'user';
  const isDoctor = messageData.role === 'doctor';
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : isDoctor
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-gray-100 text-gray-800'
      }`}>
        <div className="flex items-start space-x-2">
          {!isUser && !isDoctor && (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-xs">🤖</span>
            </div>
          )}
          
          {isDoctor && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-xs">👨‍⚕️</span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="text-sm">
              {messageData.content.split('\n').map((line, index) => (
                <div key={index} className={index > 0 ? 'mt-1' : ''}>
                  {line}
                </div>
              ))}
            </div>
            
            <div className={`text-xs mt-2 ${
              isUser ? 'text-blue-100' : isDoctor ? 'text-green-600' : 'text-gray-500'
            }`}>
              {formatTime(messageData.timestamp)}
            </div>
          </div>
          
          {isUser && (
            <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-xs">👤</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

