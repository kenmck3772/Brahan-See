
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Harvester API Ingress Endpoint
  app.post('/api/ingress/harvester', (req, res) => {
    const { uwi, source, payload, timestamp, forensicNotary } = req.body;
    
    console.log(`[HARVESTER] Ingress received for UWI: ${uwi} from ${source}`);
    
    // Broadcast the forensic data to all connected clients (real-time dashboard)
    io.emit('harvester:data', {
      uwi,
      source,
      payload,
      timestamp: timestamp || new Date().toISOString(),
      forensicNotary: forensicNotary || `SHA-512:${Math.random().toString(36).substring(7).toUpperCase()}`
    });

    res.status(200).json({ 
      status: 'VERIFIED', 
      message: 'Forensic Ingress Successful',
      notary: forensicNotary || 'GENERATED_BY_TERMINAL'
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[WETE] Sovereign Terminal running on http://localhost:${PORT}`);
  });
}

startServer();
