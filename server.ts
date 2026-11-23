import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { buildZipBuffer, collectDirectoryEntries, ZipEntryInput } from './zipExport';

interface PlayerConn {
  ws: WebSocket;
  slot: 1 | 2;
  name: string;
  charId: string;
  attributes: Record<string, number>;
  ready: boolean;
}

interface PvpRoom {
  code: string;
  createdAt: number;
  hostName: string;
  isPublic: boolean;
  biome: string;
  players: Partial<Record<1 | 2, PlayerConn>>;
  activeTurn: 1 | 2;
  started: boolean;
}

interface ArcadeEntry {
  name: string;
  charId: string;
  score: number;
  wave: number;
  createdAt: number;
}

const PORT = 3000;
const rooms = new Map<string, PvpRoom>();
const arcadeScores: ArcadeEntry[] = [];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function sendJson(ws: WebSocket | undefined, payload: unknown) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function broadcastRoom(room: PvpRoom, payload: unknown) {
  sendJson(room.players[1]?.ws, payload);
  sendJson(room.players[2]?.ws, payload);
}

function serializeRoom(room: PvpRoom) {
  return {
    code: room.code,
    started: room.started,
    activeTurn: room.activeTurn,
    biome: room.biome,
    players: {
      1: room.players[1]
        ? {
            slot: 1,
            name: room.players[1].name,
            charId: room.players[1].charId,
            attributes: room.players[1].attributes,
            ready: room.players[1].ready,
          }
        : null,
      2: room.players[2]
        ? {
            slot: 2,
            name: room.players[2].name,
            charId: room.players[2].charId,
            attributes: room.players[2].attributes,
            ready: room.players[2].ready,
          }
        : null,
    },
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/export/site.zip', (_req, res) => {
    try {
      const rootDir = process.cwd();
      const distDir = path.resolve(rootDir, 'dist');
      if (!fs.existsSync(path.join(distDir, 'index.html'))) {
        execSync('npm run build', { cwd: rootDir, stdio: 'pipe' });
      }
      const entries = collectDirectoryEntries(distDir, 'super-carrollo-site', (rel) =>
        rel.startsWith('assets/aistudio') || rel === '.DS_Store'
      );
      const guide = [
        'SUPER CARROLLO — SITE PRONTO PARA PUBLICAR',
        '=========================================',
        '',
        'Como publicar gratis em 1 minuto para enviar o link ao seu professor:',
        '',
        'OPCAO 1: Netlify Drop (mais rapido, sem precisar programar)',
        '1. Extraia este arquivo .zip no seu computador.',
        '2. Acesse: https://app.netlify.com/drop',
        '3. Arraste a pasta "super-carrollo-site" para dentro da pagina.',
        '4. Em segundos o site gera um link publico pronto para entregar!',
        '',
        'OPCAO 2: GitHub Pages',
        '1. Crie um repositorio publico no GitHub (ex: super-carrollo).',
        '2. Envie todos os arquivos de dentro de "super-carrollo-site" para o repositorio.',
        '3. Va em Settings -> Pages -> Branch: main / (root) -> Save.',
        '4. O GitHub vai gerar seu link: https://SEU_USUARIO.github.io/super-carrollo/',
        '',
        'OPCAO 3: Servidor local (VS Code Live Server / XAMPP)',
        'Coloque os arquivos em htdocs ou abra a pasta no VS Code com a extensao Live Server.',
      ].join('\n');
      entries.push({
        name: 'super-carrollo-site/LEIA-ME-PUBLICAR.txt',
        data: Buffer.from(guide, 'utf8'),
      });
      const zipBuf = buildZipBuffer(entries);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="super-carrollo-site.zip"');
      res.setHeader('Content-Length', String(zipBuf.length));
      return res.send(zipBuf);
    } catch (err) {
      return res.status(500).json({ error: 'Falha ao gerar pacote do site.' });
    }
  });

  app.get('/api/export/source.zip', (_req, res) => {
    try {
      const rootDir = process.cwd();
      const entries: ZipEntryInput[] = [];
      const rootFiles = [
        'index.html',
        'package.json',
        'tsconfig.json',
        'vite.config.ts',
        'server.ts',
        'zipExport.ts',
        '.env.example',
      ];
      for (const file of rootFiles) {
        const full = path.join(rootDir, file);
        if (fs.existsSync(full)) {
          entries.push({
            name: `super-carrollo-codigo/${file}`,
            data: fs.readFileSync(full),
          });
        }
      }
      entries.push(
        ...collectDirectoryEntries(
          path.join(rootDir, 'src'),
          'super-carrollo-codigo/src',
          (rel) => rel.endsWith('.DS_Store')
        )
      );
      entries.push(
        ...collectDirectoryEntries(
          path.join(rootDir, 'public/assets/arenas'),
          'super-carrollo-codigo/public/assets/arenas'
        )
      );
      const readme = [
        '# Super Carrollo — Codigo-Fonte Completo',
        '',
        '## Como rodar localmente no seu computador:',
        '1. Instale o Node.js (https://nodejs.org) versao 20+.',
        '2. Abra o terminal na pasta `super-carrollo-codigo`.',
        '3. Execute: `npm install`',
        '4. Para rodar em modo desenvolvimento: `npm run dev`',
        '5. Para gerar a versao final de site estatico (pasta `dist/`): `npm run build`',
        '',
        '## Como publicar online:',
        '- **Vercel / Netlify:** conecte este repositorio e use o comando de build `npm run build` com pasta de saida `dist`.',
        '- **GitHub Pages:** execute `npm run build` e publique o conteudo da pasta `dist/`.',
      ].join('\n');
      entries.push({
        name: 'super-carrollo-codigo/README.md',
        data: Buffer.from(readme, 'utf8'),
      });
      const zipBuf = buildZipBuffer(entries);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="super-carrollo-codigo.zip"');
      res.setHeader('Content-Length', String(zipBuf.length));
      return res.send(zipBuf);
    } catch {
      return res.status(500).json({ error: 'Falha ao gerar pacote do codigo-fonte.' });
    }
  });

  app.get('/api/rooms', (_req, res) => {
    const openRooms = Array.from(rooms.values())
      .filter((r) => r.isPublic && !r.players[2] && Date.now() - r.createdAt < 30 * 60 * 1000)
      .map((r) => ({
        code: r.code,
        hostName: r.hostName,
        hostCharId: r.players[1]?.charId || 'leo',
      }));
    res.json({ rooms: openRooms });
  });

  app.get('/api/arcade-scores', (_req, res) => {
    const sorted = [...arcadeScores].sort((a, b) => b.score - a.score).slice(0, 10);
    res.json({ scores: sorted });
  });

  app.post('/api/arcade-scores', (req, res) => {
    const { name, charId, score, wave } = req.body || {};
    if (typeof score !== 'number' || typeof wave !== 'number') {
      return res.status(400).json({ error: 'Invalid score payload' });
    }
    arcadeScores.push({
      name: String(name || 'Desafiante').slice(0, 24),
      charId: String(charId || 'leo'),
      score: Math.max(0, Math.floor(score)),
      wave: Math.max(1, Math.floor(wave)),
      createdAt: Date.now(),
    });
    const sorted = [...arcadeScores].sort((a, b) => b.score - a.score).slice(0, 10);
    res.json({ scores: sorted });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let joinedRoomCode: string | null = null;
    let joinedSlot: 1 | 2 | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'create_room') {
          const code = generateRoomCode();
          const room: PvpRoom = {
            code,
            createdAt: Date.now(),
            hostName: String(msg.name || 'Jogador 1').slice(0, 20),
            isPublic: Boolean(msg.isPublic ?? true),
            biome: String(msg.biome || 'docks'),
            activeTurn: 1,
            started: false,
            players: {
              1: {
                ws,
                slot: 1,
                name: String(msg.name || 'Jogador 1').slice(0, 20),
                charId: String(msg.charId || 'leo'),
                attributes: msg.attributes || {},
                ready: true,
              },
            },
          };
          rooms.set(code, room);
          joinedRoomCode = code;
          joinedSlot = 1;
          sendJson(ws, { type: 'room_joined', slot: 1, room: serializeRoom(room) });
          return;
        }

        if (msg.type === 'join_room') {
          const code = String(msg.code || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            sendJson(ws, { type: 'error', message: 'Sala não encontrada. Confira o código.' });
            return;
          }
          if (room.players[2]) {
            sendJson(ws, { type: 'error', message: 'Esta sala já está cheia (2/2).' });
            return;
          }
          room.players[2] = {
            ws,
            slot: 2,
            name: String(msg.name || 'Jogador 2').slice(0, 20),
            charId: String(msg.charId || 'nina'),
            attributes: msg.attributes || {},
            ready: true,
          };
          room.started = true;
          room.activeTurn = 1;
          joinedRoomCode = code;
          joinedSlot = 2;

          sendJson(ws, { type: 'room_joined', slot: 2, room: serializeRoom(room) });
          broadcastRoom(room, { type: 'duel_start', room: serializeRoom(room) });
          return;
        }

        if (!joinedRoomCode || !joinedSlot) return;
        const room = rooms.get(joinedRoomCode);
        if (!room) return;

        if (msg.type === 'pvp_event') {
          const eventName = String(msg.event || '');
          // Validate turn-sensitive actions
          const turnBoundEvents = new Set(['spin_bottle', 'carrollo_strike']);
          if (turnBoundEvents.has(eventName) && room.activeTurn !== joinedSlot) {
            return;
          }
          if (eventName === 'end_turn') {
            room.activeTurn = room.activeTurn === 1 ? 2 : 1;
          }
          if (eventName === 'rematch_request') {
            room.activeTurn = 1;
          }

          const opponentSlot: 1 | 2 = joinedSlot === 1 ? 2 : 1;
          sendJson(room.players[opponentSlot]?.ws, {
            type: 'pvp_event',
            fromSlot: joinedSlot,
            event: eventName,
            payload: msg.payload || {},
            activeTurn: room.activeTurn,
          });
        }
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      if (!joinedRoomCode || !joinedSlot) return;
      const room = rooms.get(joinedRoomCode);
      if (!room) return;
      delete room.players[joinedSlot];
      const otherSlot: 1 | 2 = joinedSlot === 1 ? 2 : 1;
      if (room.players[otherSlot]) {
        sendJson(room.players[otherSlot]?.ws, {
          type: 'opponent_left',
          message: 'O adversário desconectou da sala.',
        });
      }
      if (!room.players[1] && !room.players[2]) {
        rooms.delete(joinedRoomCode);
      }
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Super Carrollo server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
