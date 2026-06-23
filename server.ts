import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
const key = process.env.GEMINI_API_KEY;
if (key && key !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (error) {
    console.error("Error initializing Gemini API:", error);
  }
}

// 1. API: Chess Opponent Engine
app.post("/api/chess/opponent", async (req, res) => {
  const { fen, history, validMoves, engineType, lmStudioUrl, lmStudioModel } = req.body;

  if (!validMoves || !Array.isArray(validMoves) || validMoves.length === 0) {
    return res.status(400).json({ error: "No valid moves provided." });
  }

  // Fallback helper: picks a random valid move
  const pickRandomMove = () => {
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  };

  const fallbackMove = pickRandomMove();

  // Mode: Easy / Random
  if (engineType === "easy") {
    // Try to favor simple material captures if possible (very basic 8-bit engine)
    const captures = validMoves.filter(m => m.includes("x") || m.toLowerCase().includes("x"));
    const selectedMove = captures.length > 0 && Math.random() < 0.6 ? captures[Math.floor(Math.random() * captures.length)] : fallbackMove;
    return res.json({
      move: selectedMove,
      comment: "BEEP BOOP! Computing... I see a piece! Taking it!",
      confidence: 70,
      source: "Local Engine"
    });
  }

  // Mode: Local LM Studio (Gemma)
  if (engineType === "gemma") {
    const targetUrl = lmStudioUrl || "http://localhost:1234/v1";
    const targetModel = lmStudioModel || "gemma-2-2b-it";

    // Since the server runs in our cloud environment, it cannot access "localhost:1234" of the user's personal machine!
    if (targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1")) {
      return res.status(400).json({
        error: "SERVER_LOCALHOST_LIMITATION",
        message: "Since our backend is running in the cloud, it cannot directly reach 'localhost' on your computer. Please configure LM Studio using an ngrok tunnel (or other public HTTPS URL) under Settings. Alternatively, switch the Connection Mode to 'Direct Browser Fetch' in the Settings menu so your browser makes the request directly!"
      });
    }

    try {
      console.log(`Forwarding request to LM Studio at: ${targetUrl}/chat/completions`);
      const response = await fetch(`${targetUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            {
              role: "system",
              content: `You are playing chess.
The current board state (FEN): ${fen}
Moves played: ${history.join(", ")}
Valid moves list: ${validMoves.join(", ")}
Your task is to select exactly ONE move from the provided list.
Return your response in JSON format:
{
  "move": "EXACT_MOVE_FROM_THE_LIST",
  "comment": "An 8-bit style retro chess opponent response"
}`
            },
            {
              role: "user",
              content: "Which move from the valid moves list will you select?"
            }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`LM Studio HTTP ${response.status}`);
      }

      const data = await response.json();
      const contentStr = data.choices?.[0]?.message?.content;
      console.log("LM Studio response content:", contentStr);
      let parsed = JSON.parse(contentStr);

      const chosenMove = parsed.move;
      // Double check that the chosen move is actually valid
      if (validMoves.includes(chosenMove)) {
        return res.json({
          move: chosenMove,
          comment: parsed.comment || "BEHOLD MY POWER FLICKERING!",
          confidence: 100,
          source: "LM Studio"
        });
      } else {
        // Clean matching: strip extra characters/spaces or find close matches
        const cleanedStr = chosenMove ? chosenMove.trim() : "";
        const matched = validMoves.find(m => m.toLowerCase().replace(/[^a-z0-9+#=]/g, "") === cleanedStr.toLowerCase().replace(/[^a-z0-9+#=]/g, ""));
        if (matched) {
          return res.json({
            move: matched,
            comment: parsed.comment || "I play with ultimate precision!",
            confidence: 90,
            source: "LM Studio"
          });
        }
        throw new Error(`Invalid move returned by Gemma: ${chosenMove}. Falling back.`);
      }
    } catch (error: any) {
      console.error("Local Gemma Model access error:", error);
      return res.status(500).json({
        error: "LM_STUDIO_FAILED",
        message: `Could not connect to LM Studio: ${error.message}. Please verify your LM Studio is running, has CORS enabled, or use the direct browser fetch mode.`,
        fallbackMove
      });
    }
  }

  // Mode: Gemini AI (Server-Side)
  if (engineType === "gemini") {
    if (!ai) {
      return res.status(400).json({
        error: "GEMINI_NOT_CONFIGURED",
        message: "Gemini API is not configured. Please add your GEMINI_API_KEY inside the Settings > Secrets menu."
      });
    }

    try {
      const prompt = `You are playing chess as an 8-bit retro RPG game boss.
Current Board state (FEN): ${fen}
Moves played so far: ${history.join(", ")}
List of allowed, legally valid moves: ${validMoves.join(", ")}

Select exactly ONE move from the provided list. Return your selections and an 8-bit game dialog comment.
Response must be JSON format with exactly three fields:
- "move": exact move chosen from the allowed list
- "comment": a retro-style, trash-talking/dramatic 8-bit boss line commenting on this move or the game state (max 100 characters)
- "confidence": percentage integer (0-100)`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              move: { type: Type.STRING, description: "Must be a move listed exactly in the validMoves: " + validMoves.join(", ") },
              comment: { type: Type.STRING, description: "8-bit dialog line from boss (max 100 chars)" },
              confidence: { type: Type.INTEGER, description: "Confidence score (0 to 100)" }
            },
            required: ["move", "comment", "confidence"]
          },
          temperature: 0.2
        }
      });

      const bodyText = response.text?.trim() || "{}";
      const parsed = JSON.parse(bodyText);

      if (validMoves.includes(parsed.move)) {
        return res.json({
          move: parsed.move,
          comment: parsed.comment,
          confidence: parsed.confidence,
          source: "Gemini Flash"
        });
      } else {
        // Find best match if format differs slightly
        const match = validMoves.find(v => v.toLowerCase() === parsed.move?.toLowerCase());
        if (match) {
          return res.json({
            move: match,
            comment: parsed.comment,
            confidence: parsed.confidence,
            source: "Gemini Flash"
          });
        }
        // Fallback to random if not valid
        return res.json({
          move: fallbackMove,
          comment: "CURSES! My matrix glitched... This random move shall perplex you!",
          confidence: 50,
          source: "Gemini Flash (Fallback)"
        });
      }
    } catch (error: any) {
      console.error("Gemini Engine error:", error);
      return res.status(500).json({
        error: "GEMINI_ERROR",
        message: `Gemini API error: ${error.message}`,
        fallbackMove
      });
    }
  }

  // Default Fallback
  return res.json({
    move: fallbackMove,
    comment: "BEEP! I guess I will make a default move!",
    confidence: 100,
    source: "System Fallback"
  });
});

// 2. API: Chess Game Master commentary / narration
app.post("/api/chess/narrate", async (req, res) => {
  const { fen, lastMove, playerColor, bossType } = req.body;

  if (!ai) {
    return res.json({
      comment: "A dark mist envelops the board... (Configure your GEMINI_API_KEY in Secrets for epic RPG boss reactions!)"
    });
  }

  try {
    const bossPersona =
      bossType === "dark_emperor"
        ? "The Dark Obsidian Emperor, a prideful medieval sovereign who speaks in grand, dramatic villainous threats."
        : bossType === "pixel_dragon"
        ? "Gemma the Red Flame Dragon, a fiery pixel beast who is hot-tempered, hungry, and wants to incinerate your pieces."
        : "The Rogue Robo-Glitch, a malfunctioning retro arcade machine that speaks in stuttering, corrupted code snippets.";

    const prompt = `You are a retro 8-bit game character: ${bossPersona}.
The user (playing as ${playerColor === "w" ? "White" : "Black"}) just played the move: "${lastMove || "Game Start"}".
The chess board state in FEN is: "${fen}".
React to this move in the voice of your retro 8-bit gaming character.
Your commentary must be a short, highly dramatic, retro dialog line (max 120 characters).
Do not include any greeting or conversational fluff outside your 8-bit dialog line.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8
      }
    });

    return res.json({
      comment: response.text?.trim() || "..."
    });
  } catch (error: any) {
    return res.json({
      comment: "ZAP! The screen flickers... (The electronic boss grunts in frustration.)"
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
