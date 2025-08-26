# AI Chat Frontend

A modern, beautiful ChatGPT-like chat interface built with Next.js and Tailwind CSS. This frontend integrates with the FastAPI backend to provide a seamless AI chat experience.

## ✨ Features

- **Modern UI/UX**: Clean, responsive design with smooth animations
- **Multi-Model Support**: Support for various LLM providers (OpenAI, Anthropic, Google, Meta)
- **Real-time Streaming**: Live streaming responses from AI models
- **Secure API Key Management**: Local storage of API keys with password-style input
- **Customizable System Instructions**: Define how the AI should behave
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Dark/Light Theme Ready**: Built with Tailwind CSS for easy theming

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- The FastAPI backend running (see `/api/README.md`)

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

### Building for Production

```bash
npm run build
npm start
```

## 🔧 Configuration

### API Key Setup

1. Click the "API Key" button in the header
2. Enter your API key from your preferred LLM provider
3. Select your desired AI model
4. Customize system instructions if needed
5. Click "Save Configuration"

### Supported Models

- **OpenAI**: GPT-4.1 Mini, GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku
- **Google**: Gemini Pro
- **Meta**: Llama 2 70B

### Getting API Keys

- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com/)
- **Google**: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

## 🏗️ Project Structure

```
frontend/
├── app/                    # Next.js 13+ app directory
│   ├── components/        # Reusable UI components
│   │   ├── ChatMessage.tsx    # Individual chat message component
│   │   └── ApiKeyModal.tsx    # API configuration modal
│   ├── globals.css       # Global styles and Tailwind CSS
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Main chat interface
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── next.config.js        # Next.js configuration
```

## 🎨 Customization

### Styling

The application uses Tailwind CSS with a custom color scheme. You can modify colors in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    500: '#0ea5e9', // Main brand color
    // ... other shades
  }
}
```

### Adding New Models

To add support for new AI models, update the `models` array in `ApiKeyModal.tsx`:

```typescript
const models = [
  // ... existing models
  { value: 'new-model', label: 'New Model (Provider)' },
]
```

## 🔒 Security Features

- API keys are stored locally in browser localStorage
- Password-style input fields for sensitive information
- No server-side storage of user credentials
- CORS properly configured for backend communication

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on every push

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Error**: Ensure the FastAPI backend is running on port 8000
2. **API Key Invalid**: Verify your API key is correct and has sufficient credits
3. **Model Not Supported**: Check if the selected model is available with your API key

### Development Tips

- Use browser dev tools to inspect network requests
- Check the console for error messages
- Verify CORS settings in the backend

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

This project is part of the AI Engineer Challenge by AI Makerspace.