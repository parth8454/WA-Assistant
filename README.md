# WhatsApp AI Assistant

A custom-built WhatsApp AI gatekeeper that handles incoming messages while you are away. Powered by Node.js, the Baileys library, and the Groq API, this assistant features context-aware conversational memory and automatic QR code generation for easy device linking.

## Features

* **Automated AI Responses:** Integrates with Groq (Llama-3) to generate natural, context-aware replies to incoming WhatsApp messages.
* **Contextual Memory:** Uses in-memory caching to remember the last 10 messages of a conversation, ensuring the AI understands the context of ongoing chats.
* **Auto-Expiring Sessions:** Conversations are automatically cleared after 30 minutes of inactivity to optimize system memory usage.
* **Live QR Authentication:** Streams the WhatsApp Web login QR code directly to a local HTML page via Server-Sent Events (SSE) for seamless linking.
* **Offline Message Filtering:** Automatically ignores old or queued messages upon server startup to prevent API rate-limit exhaustion.

## Prerequisites

Before running this project, ensure you have the following installed and configured:

* Node.js (v18 or higher recommended)
* npm (Node Package Manager)
* A free API key from [Groq](https://console.groq.com/)
* A WhatsApp account to act as the host device

## Installation

1. Clone the repository to your local machine:
   \`\`\`bash
   git clone https://github.com/YourUsername/whatsapp-assistant.git
   \`\`\`

2. Navigate into the project directory:
   \`\`\`bash
   cd whatsapp-assistant
   \`\`\`

3. Install the required dependencies:
   \`\`\`bash
   npm install
   \`\`\`

4. Create a `.env` file in the root directory and add your Groq API key:
   \`\`\`text
   GROQ_API=your_groq_api_key_here
   \`\`\`

## Usage

1. Start the Node.js server:
   \`\`\`bash
   node server.js
   \`\`\`

2. Open the `qr.html` file in your web browser. You can do this by double-clicking the file or using a local development server.

3. Open WhatsApp on your phone, navigate to **Linked Devices**, and scan the QR code displayed on the webpage.

4. Once the terminal displays a connected status, the assistant is live and will begin handling incoming messages automatically.

## Troubleshooting

* **Bad MAC Error / Cryptographic Issues:** If the server crashes continuously with decryption errors, the local session data may be corrupted. Stop the server, delete the `session/` folder, and restart the server to generate a fresh QR code.
* **CORS Errors on QR Page:** If the web browser refuses to connect to the QR stream, try opening `qr.html` through a local server (like the VS Code Live Server extension) rather than opening the raw file path.

## Technology Stack

* **Node.js:** Backend runtime environment.
* **Express:** Web framework for streaming the QR code.
* **Baileys:** WhatsApp Web API implementation.
* **Groq SDK:** Interface for interacting with large language models.
* **Node-Cache:** In-memory caching for conversation history.