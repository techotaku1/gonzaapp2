import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { z } from 'zod';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Enable CORS
app.use(cors());
app.use(express.json());

// Message schema validation
const MessageSchema = z.object({
  type: z.enum(['UPDATE', 'CREATE', 'DELETE']),
  data: z.union([z.array(z.object({})), z.array(z.string())]),
});

// Store connected clients
const clients = new Set<WebSocket>();

// WebSocket connection handler
wss.on('connection', (ws) => {
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Broadcast endpoint
app.post('/broadcast', (req, res) => {
  try {
    const message = MessageSchema.parse(req.body);

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid message format',
    });
  }
});

const PORT = process.env.POLLING_PORT ?? 3001;
server.listen(PORT, () => {
  console.log(`Polling server running on port ${PORT}`);
});
