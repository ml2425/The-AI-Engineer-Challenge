# 🤖 AI Chat Frontend

A modern, responsive chat interface built with Next.js and Tailwind CSS that integrates with your FastAPI backend to provide AI-powered conversations.

## ✨ Features

- **🔐 Secure API Key Input** - Password-style input for OpenAI API keys
- **💬 Real-time Chat** - Stream responses from GPT-4.1-mini
- **🎨 Beautiful UI** - Modern design with excellent contrast and accessibility
- **📱 Responsive Design** - Works perfectly on desktop and mobile
- **⚡ Fast Performance** - Built with Next.js 14 and optimized for speed
- **🔄 Streaming Responses** - See AI responses appear in real-time

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Your OpenAI API key

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
frontend/
├── app/
│   ├── components/
│   │   ├── ChatInterface.tsx  # Main chat interface
│   │   └── Message.tsx        # Individual message component
│   ├── globals.css            # Global styles with Tailwind
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page component
├── package.json               # Dependencies and scripts
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
└── tsconfig.json              # TypeScript configuration
```

## 🌐 API Integration

The frontend integrates with your FastAPI backend at `/api/chat` endpoint:

- **Endpoint:** `POST /api/chat`
- **Request Body:**
  ```json
  {
    "developer_message": "System prompt for the AI",
    "user_message": "User's input message",
    "model": "gpt-4.1-mini",
    "api_key": "your-openai-api-key"
  }
  ```
- **Response:** Streaming text response from OpenAI

## 🎨 Design Features

- **Visual Clarity:** High contrast colors for excellent readability
- **Accessibility:** Proper focus states and keyboard navigation
- **Responsive:** Adapts to different screen sizes
- **Modern UI:** Clean, professional appearance with smooth animations

## 🔒 Security

- API keys are stored locally in component state
- No keys are sent to external servers (only to OpenAI via your backend)
- Password-style input for sensitive information
- Secure HTTPS communication with your backend

## 🚀 Deployment

### Local Testing

1. Ensure your FastAPI backend is running on port 8000
2. Start the frontend: `npm run dev`
3. Test the chat functionality with your OpenAI API key

### Vercel Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Configure environment variables** in Vercel dashboard if needed

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Error:**
   - Ensure your FastAPI backend is running
   - Check that the backend URL is correct
   - Verify CORS is properly configured

2. **OpenAI API Errors:**
   - Verify your API key is valid
   - Check your OpenAI account has sufficient credits
   - Ensure the model name is correct

3. **Build Errors:**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the AI Engineer Challenge.

---

**Happy Chatting! 🎉**