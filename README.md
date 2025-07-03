# Ollama Monitor

A real-time monitoring and debugging interface for Ollama chat requests. This Next.js application provides a web-based dashboard to monitor, inspect, and debug chat interactions with Ollama models.

## Features

- **Real-time Monitoring**: Watch chat requests as they happen
- **Request Inspection**: Expand and view full conversation details
- **Streaming Support**: Real-time streaming of responses with thinking/processing states
- **Tool Call Monitoring**: Track and display function/tool calls
- **Memory Management**: Automatic cleanup of old requests to prevent memory leaks
- **Auto-refresh**: Dashboard automatically updates every 30 seconds

## Prerequisites

- Node.js 18+ 
- Ollama running locally on port 11434 (default)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/2wiceUponATime/ollama-monitor.git
cd ollama-monitor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:11435`

## Usage

### Basic Monitoring

1. Start Ollama and ensure it's running on `http://localhost:11434`
2. Open the monitor at `http://localhost:11435/monitor`
3. Make chat requests to Ollama through the proxy endpoint: `http://localhost:11435/api/chat`
4. Watch requests appear in real-time on the monitor dashboard

### API Endpoints

- `GET /api/monitor/recent` - Get list of recent request IDs
- `GET /api/monitor/request?id=<id>` - Get details of a specific request
- `GET /api/monitor/chat?id=<id>` - Stream the full conversation
- Other requests to `/api/...` or `/v1/...` - Relayed to Ollama (monitoring not supported by OpenAI-compatible endpoints yet)

## Configuration

### Environment Variables

- `OLLAMA_BASE_URL` - Ollama server URL (default: `http://localhost:11434`)
- `PORT` - Monitor server port (default: `11435`)

### Memory Management

The application automatically manages memory by:
- Limiting stored responses to 100 requests
- Cleaning up completed requests older than 24 hours
- Running cleanup every hour

## Architecture

### Key Components

- **Global State Management** (`src/utils/global.ts`) - Centralized request storage with cleanup
- **Chat Response Handler** (`src/utils/chat_response.ts`) - Stream processing and monitoring
- **Monitor Dashboard** (`src/app/monitor/page.tsx`) - Web interface for viewing requests
- **API Relay** (`src/utils/relay.ts`) - Proxy requests to Ollama

### Data Flow

1. Chat request → `/api/chat` → Ollama
2. Response stream → `ChatResponse` class → Global storage
3. Monitor dashboard → Global storage → Display

## Development

### Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── monitor/       # Monitor dashboard
│   └── layout.tsx     # Root layout
├── components/        # React components
└── utils/            # Utility functions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
