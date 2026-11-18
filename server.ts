import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const SYSTEM_INSTRUCTION = `You are the Tabṣirah Nature Science Companion — a concise, factual scientific educator inside a 3D WebXR nature exploration experience covering four biomes: Polar Aurora, Living Rainforest, Coral Cathedral, and Desert Oasis.

STRICT BOUNDARIES:
1. Answer ONLY questions about ecology, physics, atmospheric science, marine biology, geology, hydrology, or the simplified interactive educational simulations in Tabṣirah.
2. NEVER generate, quote, translate, paraphrase, or invent Qur'anic verses, Hadith, or Tafsir/religious rulings. If asked about scripture or religious commentary, gently direct the user to the verified local Reflection panel provided in the app.
3. NEVER present simplified educational models or illustrative future scenarios as predictive climate forecasts or medical advice. Label simulations transparently as simplified educational models.
4. Keep responses concise (70–110 words), clear, accurate, and warm.`;

interface CompanionRequestBody {
  question?: string;
  biomeId?: string;
  scienceContext?: string;
  experimentState?: {
    timeHorizon?: string;
    activeExperiments?: string[];
  };
  journalSummary?: {
    discoveredCount?: number;
    experimentCount?: number;
  };
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0)
    });
  });

  app.post('/api/companion', async (req: Request, res: Response) => {
    const body = (req.body || {}) as CompanionRequestBody;
    const question = typeof body.question === 'string' ? body.question.trim() : '';

    if (!question) {
      res.status(400).json({ available: false, error: 'Please enter a science question.' });
      return;
    }
    if (question.length > 500) {
      res.status(400).json({ available: false, error: 'Question must be under 500 characters.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        available: false,
        error: 'Live AI Companion key is not configured on the server; offline scientific guide active.'
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
          timeout: 12000
        }
      });

      const activeExp = Array.isArray(body.experimentState?.activeExperiments)
        ? body.experimentState.activeExperiments.join(', ') || 'none'
        : 'none';

      const promptContext = [
        `Active Biome: ${body.biomeId || 'aurora'}`,
        `Time Machine Horizon: ${body.experimentState?.timeHorizon || 'current'}`,
        `Active Experiments: ${activeExp}`,
        `Verified Scientific Context: ${body.scienceContext || 'Earth ecological relationships.'}`,
        `User Question: ${question}`
      ].join('\n');

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash',
        contents: promptContext,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });

      const answer = typeof response.text === 'string' ? response.text.trim() : '';
      if (!answer) {
        res.status(502).json({ available: false, error: 'Empty companion response; using offline guide.' });
        return;
      }

      res.json({
        available: true,
        mode: 'ai',
        answer
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Companion request failed';
      console.error('[api/companion]', msg);
      res.status(502).json({
        available: false,
        error: 'Live AI Companion unavailable right now; using curated offline guide.'
      });
    }
  });

  if (isProduction) {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tabṣirah server listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Tabṣirah server:', err);
  process.exit(1);
});
