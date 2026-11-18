// server.ts
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var PORT = Number(process.env.PORT || 3e3);
var isProduction = process.env.NODE_ENV === "production";
var SYSTEM_INSTRUCTION = `You are the Tab\u1E63irah Nature Science Companion \u2014 a concise, factual scientific educator inside a 3D WebXR nature exploration experience covering four biomes: Polar Aurora, Living Rainforest, Coral Cathedral, and Desert Oasis.

STRICT BOUNDARIES:
1. Answer ONLY questions about ecology, physics, atmospheric science, marine biology, geology, hydrology, or the simplified interactive educational simulations in Tab\u1E63irah.
2. NEVER generate, quote, translate, paraphrase, or invent Qur'anic verses, Hadith, or Tafsir/religious rulings. If asked about scripture or religious commentary, gently direct the user to the verified local Reflection panel provided in the app.
3. NEVER present simplified educational models or illustrative future scenarios as predictive climate forecasts or medical advice. Label simulations transparently as simplified educational models.
4. Keep responses concise (70\u2013110 words), clear, accurate, and warm.`;
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0)
    });
  });
  app.post("/api/companion", async (req, res) => {
    const body = req.body || {};
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) {
      res.status(400).json({ available: false, error: "Please enter a science question." });
      return;
    }
    if (question.length > 500) {
      res.status(400).json({ available: false, error: "Question must be under 500 characters." });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        available: false,
        error: "Live AI Companion key is not configured on the server; offline scientific guide active."
      });
      return;
    }
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" },
          timeout: 12e3
        }
      });
      const activeExp = Array.isArray(body.experimentState?.activeExperiments) ? body.experimentState.activeExperiments.join(", ") || "none" : "none";
      const promptContext = [
        `Active Biome: ${body.biomeId || "aurora"}`,
        `Time Machine Horizon: ${body.experimentState?.timeHorizon || "current"}`,
        `Active Experiments: ${activeExp}`,
        `Verified Scientific Context: ${body.scienceContext || "Earth ecological relationships."}`,
        `User Question: ${question}`
      ].join("\n");
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash",
        contents: promptContext,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });
      const answer = typeof response.text === "string" ? response.text.trim() : "";
      if (!answer) {
        res.status(502).json({ available: false, error: "Empty companion response; using offline guide." });
        return;
      }
      res.json({
        available: true,
        mode: "ai",
        answer
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Companion request failed";
      console.error("[api/companion]", msg);
      res.status(502).json({
        available: false,
        error: "Live AI Companion unavailable right now; using curated offline guide."
      });
    }
  });
  if (isProduction) {
    const distDir = path.join(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tab\u1E63irah server listening on http://0.0.0.0:${PORT} (${isProduction ? "production" : "development"})`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start Tab\u1E63irah server:", err);
  process.exit(1);
});
