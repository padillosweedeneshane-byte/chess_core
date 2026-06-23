/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Chess, Square } from "chess.js";
import { 
  Play, 
  RotateCcw, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Settings, 
  HelpCircle, 
  AlertCircle, 
  Flame, 
  Bot, 
  Sparkles, 
  Crown, 
  ChevronRight, 
  Wifi, 
  WifiOff, 
  Check, 
  Info,
  ExternalLink
} from "lucide-react";
import { PixelChessPiece } from "./components/PixelChessPiece";
import { BossAvatar } from "./components/BossAvatar";
import { RetroDialogue } from "./components/RetroDialogue";
import { playSound } from "./utils/sound";
import { EngineType, ConnectionMode, PieceTheme, BossType, GameSettings, ChatMessage } from "./types";

interface PieceData {
  type: "p" | "r" | "n" | "b" | "q" | "k";
  color: "w" | "b";
}

export default function App() {
  // 1. Initialize Chess State
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleDestinations, setPossibleDestinations] = useState<string[]>([]);
  
  // Game Settings/Configurations
  const [engineType, setEngineType] = useState<EngineType>("gemini");
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("direct");
  const [lmStudioUrl, setLmStudioUrl] = useState("http://localhost:1234/v1");
  const [lmStudioModel, setLmStudioModel] = useState("gemma");
  const [pieceTheme, setPieceTheme] = useState<PieceTheme>("classic");
  const [bossType, setBossType] = useState<BossType>("dark_emperor");
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");

  // Animations & physical feedback
  const [shakeLevel, setShakeLevel] = useState(0);
  const [lastActionType, setLastActionType] = useState<"move" | "capture" | "check" | "victory" | "defeat" | "idle">("idle");

  // Interaction logs / Dialogue
  const [bossMessage, setBossMessage] = useState("HALT, MORTAL! Prepare to defend your honor in the royal game of chess. Make your move!");
  const [isBossThinking, setIsBossThinking] = useState(false);
  const [isBossTalking, setIsBossTalking] = useState(false);
  const [lastMoveSan, setLastMoveSan] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(100);
  const [aiEngineSource, setAiEngineSource] = useState("Arcade Board");

  // Game UI/Modals state
  const [showConfig, setShowConfig] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [testResult, setTestResult] = useState<{ status: "idle" | "testing" | "success" | "error"; msg?: string }>({ status: "idle" });
  
  // Promotion handling
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);

  // Retro Clocks & Neural States for Immersive UI Theme
  const [playerSecs, setPlayerSecs] = useState(600);
  const [opponentSecs, setOpponentSecs] = useState(600);
  const [neuralBars, setNeuralBars] = useState([20, 60, 40, 90, 70, 30, 50, 80]);

  // References
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Restart / Reset trigger
  const handleRestart = (newPlayerColor: "w" | "b" = playerColor) => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setSelectedSquare(null);
    setPossibleDestinations([]);
    setLastMoveSan(null);
    setPromotionPending(null);
    setPlayerColor(newPlayerColor);
    setAiConfidence(100);
    setAiEngineSource("Arcade Board");
    setPlayerSecs(600);
    setOpponentSecs(600);
    
    if (soundsEnabled) {
      playSound("victory");
    }

    let startText = "HALT, MORTAL! Prepare to defend your honor in the royal game of chess. Make your move!";
    if (bossType === "pixel_dragon") {
      startText = "GRAAAWR! The screen heats up! Feed me your pieces, tasty human! I SHALL incinerate your ranks!";
    } else if (bossType === "rogue_glitch") {
      startText = "L-L-O-A-D-I-N-G CH-CH-CESS... ZAP! SYSTEM ONLINE. [RUN: MOCK_HUMAN_DESTRUCTION_V1] BEGIN!";
    }

    if (newPlayerColor === "b") {
      // If player wants to play Black, AI plays White and must move first!
      setBossMessage("YOU DARE CHOOSE BLACK? Then I shall lead with First Strike! Computing...");
      setTimeout(() => {
        triggerAiMove(newGame, "b");
      }, 1500);
    } else {
      setBossMessage(startText);
    }
  };

  // Switch Boss Persona
  const handleBossChange = (newBoss: BossType) => {
    setBossType(newBoss);
    let switchText = "";
    if (newBoss === "dark_emperor") {
      switchText = "Mwahaha! I, the Obsidian King, shall claim the throne with royal precision!";
    } else if (newBoss === "pixel_dragon") {
      switchText = "FWOOSH! A fire erupts! I smell ashes and captured pawns! BRING IT ON!";
    } else {
      switchText = "ER-R-O-R... CH-C-HANGE PORT. CPU Core Temp 99C. G-Glitch override active!";
    }
    setBossMessage(switchText);
    if (soundsEnabled) playSound("click");
  };

  // Helper: Board Flipped state (Black is displayed at the bottom)
  const isBoardFlipped = playerColor === "b";

  // Real-time ticking clocks for both user & boss opponent
  useEffect(() => {
    if (game.isGameOver()) return;
    const timer = setInterval(() => {
      if (isBossThinking) {
        setOpponentSecs(s => Math.max(0, s - 1));
      } else {
        if (game.turn() === playerColor) {
          setPlayerSecs(s => Math.max(0, s - 1));
        } else {
          setOpponentSecs(s => Math.max(0, s - 1));
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [game, playerColor, isBossThinking]);

  // Real-time Neural Activity Bar fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      setNeuralBars(prev => prev.map(val => {
        const noise = Math.floor(Math.random() * 40) - 20;
        return Math.max(10, Math.min(100, val + noise));
      }));
    }, 450);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to clock helper
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Scan current pieces to compute captured sets
  const getCapturedPieces = () => {
    const startCount = {
      w: { p: 8, r: 2, n: 2, b: 2, q: 1 },
      b: { p: 8, r: 2, n: 2, b: 2, q: 1 }
    };
    
    const aliveCount = {
      w: { p: 0, r: 0, n: 0, b: 0, q: 0 },
      b: { p: 0, r: 0, n: 0, b: 0, q: 0 }
    };
    
    // Scan board
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type !== "k") {
          const color = piece.color as "w" | "b";
          const type = piece.type as "p" | "r" | "n" | "b" | "q";
          aliveCount[color][type]++;
        }
      }
    }
    
    const captured = {
      w: [] as { type: string; color: "w" }[], // White captured (Black has them)
      b: [] as { type: string; color: "b" }[]  // Black captured (White has them)
    };
    
    const types: ("p" | "q" | "r" | "b" | "n")[] = ["p", "q", "r", "b", "n"];
    types.forEach(t => {
      const wDiff = startCount.w[t] - aliveCount.w[t];
      for (let i = 0; i < Math.max(0, wDiff); i++) {
        captured.w.push({ type: t, color: "w" });
      }
      
      const bDiff = startCount.b[t] - aliveCount.b[t];
      for (let i = 0; i < Math.max(0, bDiff); i++) {
        captured.b.push({ type: t, color: "b" });
      }
    });
    
    return captured;
  };

  const { w: whiteCaptured, b: blackCaptured } = getCapturedPieces();

  // Test Connection to local LM Studio
  const handleTestConnection = async () => {
    setTestResult({ status: "testing" });
    if (soundsEnabled) playSound("click");

    try {
      const response = await fetch(`${lmStudioUrl}/models`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      const models = data?.data?.map((m: any) => m.id) || [];
      const modelNames = models.join(", ");
      setTestResult({ 
        status: "success", 
        msg: `Connection successful! Found models: ${modelNames || "None (uses default)"}` 
      });
    } catch (e: any) {
      setTestResult({ 
        status: "error", 
        msg: `Connection failed: ${e.message}. Is LM Studio running on port 1234? Make sure CORS is allowed in your app settings.` 
      });
    }
  };

  // AI Opponent Move Generator
  const triggerAiMove = async (gameInstance: Chess, forPlayerColor: "w" | "b") => {
    if (gameInstance.isGameOver()) return;

    setIsBossThinking(true);
    setIsBossTalking(true);

    const moves = gameInstance.moves({ verbose: true });
    // If no moves, game over
    if (moves.length === 0) {
      setIsBossThinking(false);
      setIsBossTalking(false);
      return;
    }

    const validMovesArray = moves.map(m => m.san);

    // Direct Browser Fetch to local LM Studio
    if (engineType === "gemma" && connectionMode === "direct") {
      try {
        const response = await fetch(`${lmStudioUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: lmStudioModel || "gemma",
            messages: [
              {
                role: "system",
                content: `You are playing chess as an 8-bit retro gaming boss: '${bossType}'.
Current Board state (FEN): ${gameInstance.fen()}
Moves played so far: ${gameInstance.history().join(", ")}
Allowed valid moves: ${validMovesArray.join(", ")}

Select exactly ONE move from the allowed list. Return your selection as a JSON object:
{
  "move": "EXACT_MOVE_FROM_THE_LIST",
  "comment": "An 8-bit retro theme dialogue comment reacting on this move (max 100 characters)"
}`
              },
              {
                role: "user",
                content: "Select exactly one move from the allowed list"
              }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          throw new Error(`Direct connection HTTP Error ${response.status}`);
        }

        const data = await response.json();
        const contentStr = data.choices?.[0]?.message?.content;
        const parsed = JSON.parse(contentStr);

        // Process Move
        applyAiMoveResult(gameInstance, parsed.move, parsed.comment || "My Gemma model computes absolute destruction!", "Local Gemma App");
      } catch (error: any) {
        console.error("Direct connection to LM Studio failed:", error);
        // Fallback to random locally
        const randomIndex = Math.floor(Math.random() * validMovesArray.length);
        const fbMove = validMovesArray[randomIndex];
        applyAiMoveResult(
          gameInstance, 
          fbMove, 
          "Connection to local LM Studio failed! Switching to emergency logic... [Random Move played]", 
          "Local Hardware Fallback"
        );
      }
      return;
    }

    // Server-Side Connection (Express proxy for Gemma or server-side Gemini API)
    try {
      const response = await fetch("/api/chess/opponent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fen: gameInstance.fen(),
          history: gameInstance.history(),
          validMoves: validMovesArray,
          engineType,
          lmStudioUrl,
          lmStudioModel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "SERVER_LOCALHOST_LIMITATION") {
          // Point the user clearly to the solution (Direct Mode)
          setBossMessage(`ZAP! Localhost configuration error: Since the application is running in the cloud, Server Proxy cannot reach 'localhost:1234' on your computer! Please click settings and enable "Direct Browser Fetch" so your browser connects to LM Studio directly!`);
          setIsBossThinking(false);
          setIsBossTalking(false);
          if (soundsEnabled) playSound("check");
          return;
        }
        throw new Error(data.message || "Failed to make move from server AI.");
      }

      applyAiMoveResult(gameInstance, data.move, data.comment, data.source || "AI Server");
    } catch (e: any) {
      console.error("Server AI request failed:", e);
      // fallback
      const randomIndex = Math.floor(Math.random() * validMovesArray.length);
      const fbMove = validMovesArray[randomIndex];
      applyAiMoveResult(
        gameInstance, 
        fbMove, 
        `Error calling AI: ${e.message}. System bypassed to random move!`, 
        "System Fallback"
      );
    }
  };

  // Helper: Apply the selected AI Move to the Board
  const applyAiMoveResult = (gameInstance: Chess, chosenMove: string, comment: string, source: string) => {
    try {
      const movesBefore = gameInstance.history({ verbose: true });
      const moveResult = gameInstance.move(chosenMove);
      const isCapture = moveResult.captured !== undefined;
      
      setGame(new Chess(gameInstance.fen()));
      setFen(gameInstance.fen());
      setLastMoveSan(chosenMove);
      setBossMessage(comment);
      setAiConfidence(Math.floor(Math.random() * 40) + 60); // Retro randomized confidence rating
      setAiEngineSource(source);

      // Play sound based on result & trigger screen shakes
      if (gameInstance.isCheckmate()) {
        if (soundsEnabled) playSound("defeat");
        setLastActionType("defeat");
      } else if (gameInstance.isCheck()) {
        if (soundsEnabled) playSound("check");
        setLastActionType("check");
      } else if (isCapture) {
        if (soundsEnabled) playSound("capture");
        setLastActionType("capture");
      } else {
        if (soundsEnabled) playSound("move");
        setLastActionType("move");
      }
      setShakeLevel(prev => prev + 1);
    } catch (e) {
      console.error("Error applying AI move locally", e);
      // Fallback
      const fallback = gameInstance.moves()[0];
      if (fallback) {
        gameInstance.move(fallback);
        setGame(new Chess(gameInstance.fen()));
        setFen(gameInstance.fen());
        setBossMessage("A temporal glitch occurred! Submitting standard backup vector!");
      }
    } finally {
      setIsBossThinking(false);
      setIsBossTalking(false);
    }
  };

  // 3. User Move Handler
  const handleSquareClick = (squareKey: string) => {
    if (game.isGameOver() || isBossThinking) return;

    const turn = game.turn();
    // Verify player is on turn
    if (turn !== playerColor) return;

    // A. If clicking on one of the highlighted destinations
    if (possibleDestinations.includes(squareKey)) {
      makeUserMove(selectedSquare!, squareKey);
      return;
    }

    // B. Otherwise, select current square
    const piece = game.get(squareKey as Square);
    if (piece && piece.color === playerColor) {
      setSelectedSquare(squareKey);
      if (soundsEnabled) playSound("click");
      const moves = game.moves({ square: squareKey as Square, verbose: true });
      setPossibleDestinations(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setPossibleDestinations([]);
    }
  };

  // Execute human user move
  const makeUserMove = (from: string, to: string, promotePiece: string = "q") => {
    const tempGame = new Chess(game.fen());
    
    // Check if it is a promotion
    const piece = tempGame.get(from as Square);
    const isPawn = piece && piece.type === "p";
    const targetRow = to[1];
    
    const isPromotion = isPawn && ((piece.color === "w" && targetRow === "8") || (piece.color === "b" && targetRow === "1"));

    if (isPromotion && !promotionPending) {
      // Trigger promotion choice UI
      setPromotionPending({ from, to });
      return;
    }

    try {
      const moveResult = tempGame.move({
        from: from as Square,
        to: to as Square,
        promotion: isPromotion ? promotePiece : undefined
      });

      const isCapture = moveResult.captured !== undefined;

      // Update Local Chess Board
      const updatedGame = new Chess(tempGame.fen());
      setGame(updatedGame);
      setFen(updatedGame.fen());
      setLastMoveSan(moveResult.san);
      setSelectedSquare(null);
      setPossibleDestinations([]);
      setPromotionPending(null);

      // Sound triggers & physical feedback shakes
      if (updatedGame.isCheckmate()) {
        if (soundsEnabled) playSound("victory");
        setLastActionType("victory");
      } else if (updatedGame.isCheck()) {
        if (soundsEnabled) playSound("check");
        setLastActionType("check");
      } else if (isCapture) {
        if (soundsEnabled) playSound("capture");
        setLastActionType("capture");
      } else {
        if (soundsEnabled) playSound("move");
        setLastActionType("move");
      }
      setShakeLevel(prev => prev + 1);

      // Check for Game Over after human moves
      if (updatedGame.isGameOver()) {
        triggerNarratorReaction(updatedGame, moveResult.san);
        return;
      }

      // Trigger Narrator Commentary
      triggerNarratorReaction(updatedGame, moveResult.san);

      // Trigger Opponent AI after a minor delay for classic 8-bit response pacing
      setTimeout(() => {
        triggerAiMove(updatedGame, playerColor);
      }, 1000);

    } catch (err) {
      console.error("Illegal move attempt:", err);
      setSelectedSquare(null);
      setPossibleDestinations([]);
    }
  };

  // Triggers Gemini backend to generate a narrative trash talk React dialogue on user moves
  const triggerNarratorReaction = async (gameInstance: Chess, userLastMove: string) => {
    try {
      const response = await fetch("/api/chess/narrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fen: gameInstance.fen(),
          lastMove: userLastMove,
          playerColor: playerColor,
          bossType: bossType
        })
      });
      const data = await response.json();
      setBossMessage(data.comment || "A bold step into mine field! Let's see you survive this next strike...");
    } catch (e) {
      setBossMessage("A bold maneuver! Let us see if your CPU can withstand my counter-battery!");
    }
  };

  // Promotion choice click
  const handlePromoteSelect = (promoteTo: "q" | "r" | "b" | "n") => {
    if (promotionPending) {
      makeUserMove(promotionPending.from, promotionPending.to, promoteTo);
    }
  };

  // 4. Render Board squares as HTML helper
  const renderBoardGrid = () => {
    const grid: React.ReactNode[] = [];
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const rows = ["8", "7", "6", "5", "4", "3", "2", "1"];

    // Adjust rows & files order depending on Flipped status
    const orderedRows = isBoardFlipped ? [...rows].reverse() : rows;
    const orderedFiles = isBoardFlipped ? [...files].reverse() : files;

    orderedRows.forEach((row, rowIdx) => {
      orderedFiles.forEach((file, fileIdx) => {
        const squareKey = `${file}${row}`;
        const isLightSquare = (parseInt(row) + orderedFiles.indexOf(file)) % 2 !== 0;
        
        // Get piece
        const piece = game.get(squareKey as Square);
        const isSelected = selectedSquare === squareKey;
        const isPossibleMove = possibleDestinations.includes(squareKey);
        const lastMoveHistory = game.history({ verbose: true }).slice(-1)[0];
        const isLastMoveSquare = lastMoveHistory && (lastMoveHistory.from === squareKey || lastMoveHistory.to === squareKey);

        // Coloring tiles
        let squareBg = isLightSquare ? "bg-[#f0d9b5] hover:bg-[#ebd0a3]" : "bg-[#769656] hover:bg-[#688a4c]"; // Real Tournament Green & Buff board
        if (pieceTheme === "gameboy") {
          squareBg = isLightSquare ? "bg-[#8bac0f] hover:bg-[#9cbd0f]" : "bg-[#306230] hover:bg-[#387238]";
        } else if (pieceTheme === "cyber") {
          squareBg = isLightSquare ? "bg-[#181530] hover:bg-[#1e1b3d]" : "bg-[#080517] hover:bg-[#0c0824]";
        } else if (pieceTheme === "wood") {
          squareBg = isLightSquare ? "bg-[#f4ebd0] hover:bg-[#faf4e0]" : "bg-[#b58863] hover:bg-[#c79a75]"; // Gorgeous maple & walnut wood grain
        }

        // Highlight square colors overlay
        let borderClass = "";
        if (isSelected) {
          borderClass = "ring-4 ring-yellow-400/80 ring-inset animate-pulse z-10";
        } else if (isPossibleMove) {
          borderClass = "ring-4 ring-green-400/80 ring-inset cursor-pointer z-10";
        } else if (isLastMoveSquare) {
          borderClass = "ring-4 ring-amber-500/40 ring-inset z-1";
        }

        // Dynamic, highly legible coordinates text color matching light/dark board tiles
        let coordColor = isLightSquare ? "text-[#769656]" : "text-[#f0d9b5]";
        if (pieceTheme === "classic") {
          coordColor = isLightSquare ? "text-[#5d7a46] font-bold" : "text-[#f0d9b5]/90 font-bold";
        } else if (pieceTheme === "gameboy") {
          coordColor = isLightSquare ? "text-[#306230] font-bold" : "text-[#8bac0f]/90 font-bold";
        } else if (pieceTheme === "cyber") {
          coordColor = isLightSquare ? "text-[#ff00ff]/80 font-bold" : "text-[#00ffff]/80 font-bold";
        } else if (pieceTheme === "wood") {
          coordColor = isLightSquare ? "text-[#b58863] font-bold" : "text-[#f4ebd0]/90 font-bold";
        }

        grid.push(
          <div
            key={squareKey}
            id={`square-${squareKey}`}
            onClick={() => handleSquareClick(squareKey)}
            className={`relative flex items-center justify-center aspect-square transition-all duration-150 select-none ${squareBg} ${borderClass} group cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]`}
          >
            {/* Draw Piece if present */}
            {piece && (
              <div 
                className={`z-10 cursor-grab active:cursor-grabbing flex items-center justify-center w-full h-full transform transition-all duration-150 ${
                  isSelected 
                    ? "scale-115 -translate-y-1.5 drop-shadow-[0_10px_15px_rgba(251,191,36,0.6)]" 
                    : "scale-95 md:scale-100 hover:scale-110 active:scale-95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                }`}
              >
                <PixelChessPiece
                  type={piece.type}
                  color={piece.color}
                  theme={pieceTheme}
                  size={42}
                />
              </div>
            )}

            {/* Corner Bracket Reticles for Selected / Move Target Squares */}
            {isSelected && (
              <>
                <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-yellow-400 pointer-events-none z-25" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-yellow-400 pointer-events-none z-25" />
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-yellow-400 pointer-events-none z-25" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-yellow-400 pointer-events-none z-25" />
              </>
            )}
            {isPossibleMove && (
              <>
                <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-green-400 pointer-events-none z-25 animate-pulse" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-green-400 pointer-events-none z-25 animate-pulse" />
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-green-400 pointer-events-none z-25 animate-pulse" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-green-400 pointer-events-none z-25 animate-pulse" />
              </>
            )}
            {isLastMoveSquare && !isSelected && !isPossibleMove && (
              <>
                <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-amber-500/60 pointer-events-none z-10" />
                <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-amber-500/60 pointer-events-none z-10" />
                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-amber-500/60 pointer-events-none z-10" />
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-amber-500/60 pointer-events-none z-10" />
              </>
            )}

            {/* Dotted target marker for empty possible moves */}
            {!piece && isPossibleMove && (
              <div className="w-2 h-2 bg-green-400 rounded-none border border-black animate-scale shadow-[0_0_8px_#00ff41]" />
            )}

            {/* Coordinates in corner labels for 8-bit vibe (on edges) */}
            {fileIdx === 0 && (
              <span className={`absolute top-1 left-1.5 font-retro text-[6px] select-none ${coordColor} opacity-80 pointer-events-none uppercase font-bold`}>
                {row}
              </span>
            )}
            {rowIdx === 7 && (
              <span className={`absolute bottom-1 right-1.5 font-retro text-[6px] select-none ${coordColor} opacity-80 pointer-events-none uppercase font-bold`}>
                {file}
              </span>
            )}
          </div>
        );
      });
    });

    return grid;
  };

  // Dynamic aesthetic layout styling variables to deliver an incredibly realistic chessboard presentation
  let boardFrameStyle = "border-8 border-zinc-800 bg-[#141414] shadow-[0_0_60px_rgba(0,255,65,0.18)]";
  let boardGridStyle = "border-4 border-black relative";
  let outerLabelColor = "text-zinc-500 font-mono";
  let drawOverlayDecals = true;

  const getShakeAnimation = () => {
    if (shakeLevel === 0) return {};
    if (lastActionType === "victory" || lastActionType === "defeat") {
      return {
        x: [0, -12, 12, -10, 10, -6, 6, -3, 3, 0],
        y: [0, 8, -8, 6, -6, 4, -4, 2, -2, 0],
        rotate: [0, -1.5, 1.5, -1, 1, -0.5, 0.5, 0],
        scale: [1, 1.05, 0.98, 1.02, 1]
      };
    }
    if (lastActionType === "check") {
      return {
        x: [0, -7, 7, -5, 5, -3, 3, 0],
        y: [0, -5, 5, -3, 3, 0],
        scale: [1, 0.98, 1.01, 1]
      };
    }
    if (lastActionType === "capture") {
      return {
        x: [0, -4, 4, -2, 2, 0],
        y: [0, 3, -3, 2, -2, 0],
        scale: [1, 0.99, 1.01, 1]
      };
    }
    // Standard move subtle bump
    return {
      y: [0, 1.5, -1.5, 0]
    };
  };

  if (pieceTheme === "classic") {
    // Highly polished classic US Chess Federation tournament vinyl wood rim layout
    boardFrameStyle = "border-[14px] border-[#25170f] bg-[#1d1009] shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-2 ring-[#dfaf65]/25 rounded-[3px]";
    boardGridStyle = "border-[3px] border-[#100905] bg-[#160d07] gap-[0.5px] shadow-[0_12px_24px_rgba(0,0,0,0.55)] relative";
    outerLabelColor = "text-[#f0d9b5]/90 font-black font-sans tracking-widest";
    drawOverlayDecals = false;
  } else if (pieceTheme === "wood") {
    // Solid handcrafted premium Mahogany and Maple luxury wood chessboard
    boardFrameStyle = "border-[16px] border-[#361a0b] bg-[#2a1306] shadow-[0_25px_55px_rgba(0,0,0,0.7)] ring-2 ring-[#c68a4c]/35 rounded-[4px]";
    boardGridStyle = "border-[4px] border-[#160a03] bg-[#1a0c04] gap-[1px] shadow-[0_15px_30px_rgba(0,0,0,0.6)] relative";
    outerLabelColor = "text-[#f4ebd0] font-black font-sans tracking-widest";
    drawOverlayDecals = false;
  } else if (pieceTheme === "gameboy") {
    boardFrameStyle = "border-8 border-[#306230] bg-[#0f380f] shadow-[0_0_30px_rgba(155,188,15,0.25)]";
    boardGridStyle = "border-4 border-black relative";
    outerLabelColor = "text-[#9bbc0f] font-bold font-mono";
    drawOverlayDecals = true;
  } else if (pieceTheme === "cyber") {
    boardFrameStyle = "border-8 border-indigo-950 bg-[#070512] shadow-[0_0_50px_rgba(0,242,254,0.3)]";
    boardGridStyle = "border-4 border-cyan-500/80 relative";
    outerLabelColor = "text-cyan-400 font-bold font-mono";
    drawOverlayDecals = true;
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#00ff41] flex flex-col font-mono selection:bg-[#ff0055] selection:text-white select-none relative overflow-x-hidden">
      {/* Immersive CRT Scanline & Phosphor Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-40 opacity-85" />

      {/* Top Header / Status Bar */}
      <header className="h-16 border-b-4 border-[#333] flex items-center justify-between px-4 md:px-8 bg-[#1a1a1a] shrink-0 z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-4 h-4 bg-[#ff0055] animate-pulse shadow-[0_0_10px_#ff0055]"></div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tighter uppercase text-[#00ff41] font-mono leading-none">
            Gemma-4 // Chess_Core
          </h1>
        </div>
        
        <div className="hidden md:flex gap-8 text-sm">
          <div className="flex flex-col">
            <span className="text-[#777] uppercase text-[10px]">Connection</span>
            <span className="text-white text-xs font-semibold uppercase">
              {connectionMode === "direct" ? "LM_STUDIO:1234" : "PROXY:SERVER"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#777] uppercase text-[10px]">Model</span>
            <span className="text-white text-xs font-semibold uppercase">
              {engineType === "gemma" ? lmStudioModel : engineType === "gemini" ? "GEMINI-3.5-FLASH" : "LOCAL_EASY_CPU"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#777] uppercase text-[10px]">Latency</span>
            <span className="text-[#00ff41] text-xs font-bold font-mono">42ms</span>
          </div>
        </div>
      </header>

      {/* Main Board & Sidebar Area */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 min-h-0 select-none z-10 overflow-y-auto lg:overflow-hidden">
        
        {/* Left Sidebar: Move Log & Neural Activity */}
        <div className="w-full lg:w-64 flex flex-col gap-4 shrink-0 lg:overflow-hidden">
          <div className="flex-1 border-4 border-[#333] bg-black p-4 flex flex-col min-h-[220px] lg:overflow-hidden">
            <h2 className="text-xs uppercase text-[#777] mb-4 border-b border-[#333] pb-2 font-bold tracking-widest font-mono">
              Move_History
            </h2>
            <div className="flex-1 space-y-1 text-sm overflow-y-auto pr-1 custom-scrollbar min-h-0">
              {game.history().length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 font-mono text-xs italic tracking-widest uppercase">
                  ACTIVE STANDBY
                </div>
              ) : (
                Array.from({ length: Math.ceil(game.history().length / 2) }).map((_, idx) => {
                  const whiteMove = game.history()[idx * 2];
                  const blackMove = game.history()[idx * 2 + 1];
                  const isActive = idx === Math.floor((game.history().length - 1) / 2);
                  return (
                    <div
                      key={idx}
                      className={`flex justify-between border-b border-[#222] py-1 px-1 font-mono text-[13px] ${
                        isActive ? "bg-[#00ff4122]" : ""
                      }`}
                    >
                      <span className="text-[#555]">{(idx + 1).toString().padStart(2, "0")}.</span>
                      <span className="text-white font-medium">{whiteMove}</span>
                      {blackMove ? (
                        <span className="text-[#ff0055] font-medium">{blackMove}</span>
                      ) : (
                        <span className="animate-pulse text-[#ff0055] font-bold">Computing</span>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messageEndRef} />
            </div>
          </div>

          <div className="h-32 border-4 border-[#ff0055] bg-black p-3 shrink-0">
            <div className="text-[10px] text-[#ff0055] uppercase mb-1 font-bold tracking-wider">
              AI_Neural_Activity
            </div>
            <div className="flex items-end gap-1.5 h-12 bg-neutral-950 p-1.5 border border-[#222]">
              {neuralBars.map((h, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-[#ff0055] transition-all duration-300"
                  style={{
                    height: `${isBossThinking ? h : Math.max(10, h * 0.25)}%`,
                    boxShadow: "0 0 8px #ff0055",
                  }}
                />
              ))}
            </div>
            <div className="text-[9px] mt-2 text-[#777] uppercase tracking-wide truncate">
              {isBossThinking ? "Processing move via Local LLM Engine..." : "Processor idle. Awaiting human input."}
            </div>
          </div>
        </div>

        {/* Center: The Board area */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0">
          <div className="w-full max-w-[280px] sm:max-w-[384px] md:max-w-[480px] flex items-center justify-between mb-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">
            <span className={game.isGameOver() ? "text-red-500 font-bold" : game.turn() === playerColor ? "text-[#00ff41] animate-pulse font-bold" : "text-[#ff0055] font-bold"}>
              {game.isGameOver() ? "MATCH TERMINATED" : game.turn() === playerColor ? "► YOUR TURN [USER]" : "► OPPONENT COMPUTING"}
            </span>
            <span className="hidden sm:inline truncate max-w-[200px]">FEN: {fen.substring(0, 15)}...</span>
          </div>

          <div
            className={`relative p-5 sm:p-7 md:p-8 select-none transition-all duration-300 ${boardFrameStyle}`}
          >
            {/* Decal high-tech crosshairs in the outer corners of the board frame (rendered only for matching sci-fi/retro themes) */}
            {drawOverlayDecals && (
              <>
                <div className="absolute top-2 left-2 text-[#00ff41] text-[7.5px] font-mono select-none opacity-40 uppercase tracking-widest">SYS_V4 // SECURE_PORT</div>
                <div className="absolute top-2 right-2 text-[#ff0055] text-[7.5px] font-mono select-none opacity-40 uppercase tracking-widest">OPP_LINK_STABLE</div>
                <div className="absolute bottom-2 left-2 text-zinc-650 text-[6.5px] font-mono select-none opacity-45 uppercase tracking-widest">CHESS_CORE_GRID_EMULATOR</div>
                <div className="absolute bottom-2 right-2 text-[#00ff41] text-[6.5px] font-mono select-none opacity-45 uppercase tracking-widest">TACTICAL_COMPUTING_ACTIVE</div>

                {/* Corner metal brackets for immersive retro aesthetic */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-[#00ff41] -translate-x-1 -translate-y-1" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-[#ff0055] translate-x-1 -translate-y-1" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-cyan-400 -translate-x-1 translate-y-1" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-yellow-400 translate-x-1 translate-y-1" />
              </>
            )}

            {/* Board Grid */}
            <div className={`grid grid-cols-8 grid-rows-8 w-[250px] h-[250px] sm:w-[320px] sm:h-[320px] md:w-[440px] md:h-[440px] ${boardGridStyle}`}>
              {renderBoardGrid()}

              {/* Game Over Screen Overlay */}
              {game.isGameOver() && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-20 border-4 border-[#ff0055] animate-[fadeIn_0.5s_ease_both]">
                  <div className="border-4 border-double border-[#ff0055] p-5 text-center max-w-sm bg-[#0c0c0c]">
                    <h3 className="font-mono text-[#ff0055] text-base md:text-lg mb-2 tracking-widest uppercase font-black animate-bounce">
                      GAME OVER!
                    </h3>
                    
                    {game.isCheckmate() ? (
                      <div>
                        <p className="font-mono text-yellow-500 text-[10px] mb-4 uppercase">
                          {game.turn() === playerColor ? "Defeat Registered" : "Supreme Victory"}
                        </p>
                        <p className="text-xs text-zinc-400 font-mono">
                          Opponent captured your King in a definitive checkmate sequence.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-mono text-zinc-400 text-[10px] mb-4 uppercase">Draw Condition</p>
                        <p className="text-xs text-zinc-400 font-mono">The battle resulted in a stalemate deadlock.</p>
                      </div>
                    )}

                    <button
                      onClick={() => handleRestart(playerColor)}
                      className="mt-6 font-mono text-[10px] bg-[#00ff41] hover:bg-[#33ff66] text-black border-2 border-black font-extrabold px-4 py-2 transition-all"
                    >
                      PLAY AGAIN
                    </button>
                  </div>
                </div>
              )}

              {/* Pawn Promotion choice overlay */}
              {promotionPending && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-30">
                  <div className="bg-[#1a1a1a] border-4 border-[#00ff41] p-5 text-center max-w-sm font-mono">
                    <h3 className="font-mono text-[#00ff41] text-xs mb-3 font-semibold uppercase tracking-wider">CHOOSE PROMOTION</h3>
                    <p className="text-[9px] text-[#777] mb-4 uppercase">Your pawn has scaled the ultimate rank!</p>
                    <div className="flex gap-2 justify-center">
                      {(["q", "r", "b", "n"] as const).map((pType) => (
                        <button
                          key={pType}
                          onClick={() => handlePromoteSelect(pType)}
                          className="bg-black hover:bg-[#222] border-2 border-[#333] hover:border-[#00ff41] p-2 flex flex-col items-center gap-1 active:scale-95 transition-all w-16"
                        >
                          <PixelChessPiece type={pType} color={playerColor} theme={pieceTheme} size={28} />
                          <span className="font-mono text-[8px] block uppercase text-white mt-1">
                            {pType === "q" ? "Queen" : pType === "r" ? "Rook" : pType === "b" ? "Bishop" : "Knight"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rank Labels (1-8) */}
            <div className={`absolute -left-6 top-4 bottom-4 flex flex-col justify-around text-[10px] font-bold ${outerLabelColor}`}>
              {(isBoardFlipped ? ["1","2","3","4","5","6","7","8"] : ["8","7","6","5","4","3","2","1"]).map(r => (
                <span key={r}>{r}</span>
              ))}
            </div>
            {/* File Labels (A-H) */}
            <div className={`absolute -bottom-6 left-4 right-4 flex justify-around text-[10px] font-bold ${outerLabelColor}`}>
              {(isBoardFlipped ? ["H","G","F","E","D","C","B","A"] : ["A","B","C","D","E","F","G","H"]).map(f => (
                <span key={f}>{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Players & UI Controls */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4 shrink-0 overflow-y-auto lg:overflow-hidden select-none">
          
          {/* BOSS PANEL: 8-Bit Dialogue narrative */}
          <div className="border border-[#333] bg-[#141414] p-3.5 flex flex-col gap-3 relative min-h-[140px] shrink-0">
            <div className="absolute top-2 right-2 border border-[#333] bg-black text-[#ff0055] text-[7.5px] font-mono px-1.5 py-0.5 select-none uppercase tracking-widest leading-none">
              BOSS COMMS
            </div>

            <div className="flex gap-3 mt-1.5">
              {/* Animated Avatar */}
              <BossAvatar boss={bossType} isTalking={isBossTalking || isBossThinking} size={50} />

              {/* Speech Box */}
              <div className="flex-grow bg-black border-2 border-[#333] p-2 relative min-h-[75px] flex flex-col justify-between">
                <RetroDialogue text={bossMessage} speed={25} soundsEnabled={soundsEnabled} />
                <div className="mt-1.5 text-right">
                  <span className="font-mono text-[7px] text-yellow-400 bg-black px-1.5 py-0.5 border border-[#333] uppercase">
                    {bossType === "dark_emperor" 
                      ? "OBSIDIAN KING" 
                      : bossType === "pixel_dragon" 
                      ? "GEMMA FLAME" 
                      : "Z80 GLITCH CPU"}
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnostics Tracker */}
            <div className="grid grid-cols-2 gap-2 mt-0.5 bg-black p-1.5 border border-[#222] text-[8px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-[#555]">PROV:</span>
                <span className="text-white uppercase font-bold truncate">{aiEngineSource}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[#555]">ACCURACY:</span>
                <span className="text-[#ff0055] font-bold">{aiConfidence}%</span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Dual Player Status HUD Cards */}
          <div className="grid grid-cols-2 gap-3 shrink-0 select-none">
            {/* Opponent Card Slot */}
            <div className="border border-[#ff0055] bg-[#111] p-3 flex flex-col justify-between relative">
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ff0055] rounded-full animate-pulse shadow-[0_0_6px_#ff0055]" />
              <div>
                <div className="text-[8.5px] text-[#ff0c5c] font-bold font-mono tracking-wider uppercase">OPP_CORE</div>
                <div className="text-white font-extrabold text-[11px] font-mono uppercase tracking-wide truncate mt-0.5">
                  {bossType === "dark_emperor" ? "GEMMA_EMPEROR" : bossType === "pixel_dragon" ? "GEMMA_DRAGON" : "GEMMA_GLITCH"}
                </div>
                
                {/* Captured pieces listing */}
                <div className="flex flex-wrap gap-0.5 mt-1.5 min-h-[16px]">
                  {whiteCaptured.length > 0 ? (
                    whiteCaptured.map((p, idx) => (
                      <span key={idx} className="bg-black p-0.5 border border-[#222] inline-block scale-75 transform origin-top-left -mr-1">
                        <PixelChessPiece type={p.type} color="w" theme={pieceTheme} size={11} />
                      </span>
                    ))
                  ) : (
                    <span className="text-[#444] text-[6.5px] uppercase font-mono">0_CAPS</span>
                  )}
                </div>
              </div>
              
              <div className="text-lg font-mono font-black tracking-wider text-center mt-3 py-1 border border-[#222] bg-black text-[#ff0055] shadow-[inset_0_0_8px_rgba(255,0,85,0.15)]">
                {formatTime(opponentSecs)}
              </div>
            </div>

            {/* Player Card Slot */}
            <div className="border border-[#00ff41] bg-[#111] p-3 flex flex-col justify-between relative">
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#00ff41] rounded-full shadow-[0_0_6px_#00ff41]" />
              <div>
                <div className="text-[8.5px] text-[#05ff4b] font-bold font-mono tracking-wider uppercase">USR_CORE</div>
                <div className="text-white font-extrabold text-[11px] font-mono uppercase tracking-wide truncate mt-0.5">
                  USER_01_CORE
                </div>

                {/* Captured pieces listing */}
                <div className="flex flex-wrap gap-0.5 mt-1.5 min-h-[16px]">
                  {blackCaptured.length > 0 ? (
                    blackCaptured.map((p, idx) => (
                      <span key={idx} className="bg-black p-0.5 border border-[#222] inline-block scale-75 transform origin-top-left -mr-1">
                        <PixelChessPiece type={p.type} color="b" theme={pieceTheme} size={11} />
                      </span>
                    ))
                  ) : (
                    <span className="text-[#444] text-[6.5px] uppercase font-mono">0_CAPS</span>
                  )}
                </div>
              </div>
              
              <div className="text-lg font-mono font-black tracking-wider text-center mt-3 py-1 border border-[#222] bg-black text-[#00ff41] shadow-[inset_0_0_8px_rgba(0,255,65,0.15)]">
                {formatTime(playerSecs)}
              </div>
            </div>
          </div>

          {/* IMMERSIVE ENGINE CONFIGURATIONCORE (Inline Persistent, replace dialog toggle) */}
          <div className="flex-grow border-4 border-[#333] bg-black p-3 md:p-4 flex flex-col gap-3.5 shrink-0 min-h-[280px]">
            <div className="border-b-2 border-[#222] pb-1 flex items-center justify-between">
              <h3 className="font-mono text-[10px] text-yellow-500 font-black uppercase tracking-widest">SYSTEM CONTROL PANEL</h3>
              <span className="text-[7.5px] text-zinc-500 font-mono tracking-widest">[ONLINE_EMU]</span>
            </div>

            {/* Opponent Input mode selections */}
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[8px] text-[#777] uppercase font-bold tracking-wider">OPPONENT ENHANCED ENGINE:</span>
              <div className="grid grid-cols-3 gap-1">
                {(["gemma", "gemini", "easy"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setEngineType(type);
                      if (soundsEnabled) playSound("click");
                    }}
                    className={`py-1 text-[8.5px] font-mono border transition-all truncate uppercase ${
                      engineType === type 
                        ? "bg-amber-900/60 border-amber-400 text-amber-200 font-extrabold shadow-[0_0_6px_rgba(245,158,11,0.2)]" 
                        : "bg-neutral-950 border-zinc-800 text-zinc-500 hover:text-white"
                    }`}
                  >
                    {type === "gemma" ? "LM Studio" : type === "gemini" ? "Gemini API" : "Hard Easy"}
                  </button>
                ))}
              </div>
            </div>

            {/* Personality settings */}
            <div className="flex flex-col gap-1 mt-0.5">
              <span className="font-mono text-[8px] text-[#777] uppercase font-bold tracking-wider">CHALLENGER PERSPECTIVE:</span>
              <div className="grid grid-cols-3 gap-1">
                {(["dark_emperor", "pixel_dragon", "rogue_glitch"] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleBossChange(b)}
                    className={`py-1.5 text-[8px] font-mono border transition-all truncate uppercase ${
                      bossType === b 
                        ? "bg-[#ff0055]/30 border-[#ff0055] text-white font-extrabold shadow-[0_0_6px_rgba(255,0,85,0.2)]" 
                        : "bg-[#090909] border-zinc-800 text-zinc-500 hover:text-white"
                    }`}
                  >
                    {b === "dark_emperor" ? "Emperor" : b === "pixel_dragon" ? "Dragon" : "Glitcher"}
                  </button>
                ))}
              </div>
            </div>

            {/* Board piece theme selector */}
            <div className="flex flex-col gap-1 mt-0.5">
              <span className="font-mono text-[8px] text-[#777] uppercase font-bold tracking-wider">VISUAL PIECE SKIN THEME:</span>
              <select
                value={pieceTheme}
                onChange={(e) => {
                  setPieceTheme(e.target.value as PieceTheme);
                  if (soundsEnabled) playSound("click");
                }}
                className="w-full text-[9px] bg-neutral-950 border border-zinc-800 text-[#00ff41] py-1 px-1.5 focus:outline-none focus:border-[#00ff41] font-mono font-bold"
              >
                <option value="classic">NES CLASSIC (TERRAIN SHADES)</option>
                <option value="gameboy">GAMEBOY DMG (RETRO DOT matrix)</option>
                <option value="cyber">CYBER GLOW (MAGENTA + CYAN)</option>
                <option value="wood">COZY CABINET WOODGRAIN</option>
              </select>
            </div>

            {/* Connection settings for LM Studio (Visible only if Gemma selected) */}
            {engineType === "gemma" && (
              <div className="bg-[#0b0b0b] border border-zinc-800 p-2 flex flex-col gap-2 rounded-none transition-all duration-300 animate-[fadeIn_0.2s_ease_both]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[7.5px] text-amber-500 uppercase tracking-widest font-bold">LM Studio Route URL</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setConnectionMode("direct");
                        if (soundsEnabled) playSound("click");
                      }}
                      className={`font-mono text-[7px] border px-1.5 py-0.5 lowercase ${
                        connectionMode === "direct" 
                          ? "bg-cyan-950 border-cyan-400 text-cyan-300 font-bold" 
                          : "bg-black border-zinc-900 text-zinc-650"
                      }`}
                    >
                      direct
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConnectionMode("proxy");
                        if (soundsEnabled) playSound("click");
                      }}
                      className={`font-mono text-[7px] border px-1.5 py-0.5 lowercase ${
                        connectionMode === "proxy" 
                          ? "bg-cyan-950 border-cyan-400 text-cyan-300 font-bold" 
                          : "bg-black border-zinc-900 text-zinc-650"
                      }`}
                    >
                      proxy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <label className="font-mono text-[7px] text-zinc-500">ENDPOINT URL</label>
                    <input
                      type="text"
                      className="font-mono text-[8px] bg-black text-[#00ff41] border border-[#222] p-1 focus:outline-none focus:border-[#00ff41]"
                      value={lmStudioUrl}
                      onChange={(e) => setLmStudioUrl(e.target.value)}
                      placeholder="http://localhost:1234/v1"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="font-mono text-[7px] text-zinc-500">MODEL CODE</label>
                    <input
                      type="text"
                      className="font-mono text-[8px] bg-black text-[#00ff41] border border-[#222] p-1 focus:outline-none focus:border-[#00ff41]"
                      value={lmStudioModel}
                      onChange={(e) => setLmStudioModel(e.target.value)}
                      placeholder="gemma"
                    />
                  </div>
                </div>

                {/* Connection verification widget */}
                <div className="border border-zinc-900 p-1.5 bg-neutral-950">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[7px] text-[#444]">PATH TRACER:</span>
                    <button
                      type="button"
                      disabled={testResult.status === "testing"}
                      onClick={handleTestConnection}
                      className="font-mono text-[7.5px] bg-[#00ff41] hover:bg-[#33ff66] text-black px-2 py-0.5 font-extrabold disabled:opacity-40"
                    >
                      {testResult.status === "testing" ? "TUNING..." : "TEST PATH"}
                    </button>
                  </div>
                  {testResult.msg && (
                    <p className={`text-[7px] mt-1 font-mono leading-tight ${testResult.status === "success" ? "text-green-400 font-bold" : "text-red-400"}`}>
                       {testResult.msg.substring(0, 85)}...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Action Operations */}
            <div className="grid grid-cols-3 gap-1.5 mt-auto">
              <button
                onClick={() => handleRestart(playerColor)}
                className="w-full py-2 bg-[#1a1a1a] hover:bg-black border border-zinc-800 hover:border-[#00ff41] text-[#00ff41] uppercase text-[9px] font-mono font-extrabold transition-all tracking-wider active:scale-95 text-center"
              >
                Reset Game
              </button>
              <button
                onClick={() => {
                  setSoundsEnabled(!soundsEnabled);
                  playSound("click");
                }}
                className={`w-full py-2 border text-[9px] font-mono uppercase font-bold transition-all text-center ${
                  soundsEnabled 
                    ? "bg-black border-[#00ff41] text-[#00ff41]" 
                    : "bg-[#111] border-zinc-800 text-zinc-500 hover:text-white"
                }`}
              >
                Beeps: {soundsEnabled ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => {
                  setShowTutorial(true);
                  playSound("click");
                }}
                className="w-full py-2 bg-[#1a1a1a] hover:bg-black border border-zinc-800 hover:border-yellow-500 text-yellow-500 uppercase text-[9px] font-mono font-extrabold transition-all active:scale-95 text-center"
              >
                Hardware Guide
              </button>
            </div>
            
            <div className="pt-1.5 border-t border-neutral-900 mt-1">
              <div className="text-[8px] text-[#555] uppercase mb-1 flex justify-between font-mono">
                <span>Core_C_Temp</span>
                <span className={isBossThinking ? "text-[#ff0055]" : "text-[#00ff41]"}>
                  {isBossThinking ? "84°C [SYS_LOAD]" : "41°C [STANDBY]"}
                </span>
              </div>
              <div className="w-full h-1 bg-[#111]">
                <div
                  className={`h-full transition-all duration-500 ${
                    isBossThinking ? "bg-[#ff0055] w-[85%]" : "bg-[#00ff41] w-[35%]"
                  }`}
                  style={{ boxShadow: isBossThinking ? "0 0 6px #ff0055" : "0 0 6px #00ff41" }}
                />
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Terminal bar */}
      <footer className="h-12 border-t-4 border-[#333] bg-black px-6 flex items-center justify-between text-[11px] font-mono shrink-0 select-none z-10">
        <div className="flex items-center gap-3">
          <span className="text-[#00ff41] font-bold">$</span>
          <span className="animate-pulse text-[#00ff41]">_</span>
          <span className="text-[#777] truncate max-w-[280px] sm:max-w-[480px]">
            {isBossThinking 
              ? "gemma computes battle tactics (1.4M nodes/sec)..." 
              : `Standby. Player: white. RECOMMENDED PATH: ${lastMoveSan ? `Respond to ${lastMoveSan}` : "Ke2 (Rating: +0.4)"}`}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-zinc-650 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-ping" />
          <span className="font-bold text-[#00ff41]/50 font-mono tracking-wider">CORE_ONLINE_V4</span>
        </div>
      </footer>

      {/* 3. INSTRUCTIONAL TUTORIAL MODAL */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-[#111] border-8 border-[#333] p-5 md:p-6 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col gap-3"
            >
              
              <div className="border-b-4 border-black pb-2 flex justify-between items-center">
                <h3 className="font-mono text-xs text-yellow-500 uppercase flex items-center gap-2 font-bold tracking-widest">
                  <Info className="w-4 h-4 text-yellow-500" />
                  Dungeon Manual
                </h3>
                <button
                  onClick={() => {
                    setShowTutorial(false);
                    playSound("click");
                  }}
                  className="font-mono text-[10px] bg-[#ff0055] border-2 border-black text-white px-2 py-0.5"
                >
                  X
                </button>
              </div>

              <div className="text-xs text-zinc-300 flex flex-col gap-3 h-96 overflow-y-auto pr-2 custom-scrollbar font-mono">
                <p className="font-bold text-yellow-500">WELCOME TO THE IMMERSIVE CHESS SIMULATOR V4!</p>
                
                <div className="border-l-4 border-yellow-500 pl-3">
                  <p className="font-mono text-[7.5px] text-yellow-500 font-bold uppercase tracking-wide">HOW TO INTEGRATE LM STUDIO (GEMMA):</p>
                  <ol className="list-decimal list-inside flex flex-col gap-1.5 mt-1 text-xs">
                    <li>Launch <strong>LM Studio</strong> on your local computer.</li>
                    <li>Search and download the <strong>Gemma model</strong> (e.g. <code>gemma-2-2b-it</code>).</li>
                    <li>Go to the <strong>Local Server</strong> tab on LM Studio.</li>
                    <li>Set port to <code>1234</code>, enable CORS, and click <strong>Start Server</strong>.</li>
                    <li>Open <strong>Engine Config</strong> in our Chess app, set your model name, and verify using the Link Tester!</li>
                  </ol>
                </div>

                <div className="border-l-4 border-[#ff0055] pl-3">
                  <p className="font-mono text-[7.5px] text-[#ff0055] font-bold uppercase tracking-wide">WHAT IF CONNECTION FAILS?</p>
                  <ul className="list-disc list-inside flex flex-col gap-1 mt-1 text-xs">
                    <li><strong>Enable CORS:</strong> Ensure access control is active inside LM Studio.</li>
                    <li><strong>Use Browser Direct Fetch:</strong> Direct fetch routes queries locally, bypassing backend firewalls! Recommended.</li>
                    <li><strong>Swap to Gemini Cloud API:</strong> Toggle power modes to <strong>Gemini API</strong> to challenge retro CPU opponent bosses instantly without running any local models!</li>
                  </ul>
                </div>

                <div className="border-l-4 border-[#00ff41] pl-3">
                  <p className="font-mono text-[7.5px] text-[#00ff41] font-bold uppercase tracking-wide">BATTLEGROUND JOURNAL:</p>
                  <ul className="list-disc list-inside mt-1 text-xs">
                    <li><strong>Pristine Interaction:</strong> Click a piece of your color, then select any highlighted vibrant green square to carry out tactical sequences.</li>
                    <li><strong>Audio Waves:</strong> Dynamic square Wave synthesizers buzz automatically on capture, beeps, check, and victory triggers.</li>
                    <li><strong>Live Clocks:</strong> Fully integrated game control clock automatically monitors individual move intervals in real-time.</li>
                  </ul>
                </div>

                <div className="border-l-4 border-cyan-400 pl-3">
                  <p className="font-mono text-[7.5px] text-cyan-400 font-bold uppercase tracking-wide">LOCAL PC DEPLOYMENT:</p>
                  <ol className="list-decimal list-inside flex flex-col gap-1.5 mt-1 text-xs">
                    <li>Download & unpack the ZIP stream or clone the files.</li>
                    <li>Open command prompt / terminal inside the folder directory.</li>
                    <li>Install packages: <code>npm install</code></li>
                    <li>Launch development mode: <code>npm run dev</code></li>
                    <li>Access your local board on: <code>http://localhost:3000</code></li>
                    <li>Build optimized production version: <code>npm run build && npm run start</code></li>
                  </ol>
                </div>
              </div>

              <div className="flex justify-end mt-2 leading-none">
                <button
                  onClick={() => {
                    setShowTutorial(false);
                    playSound("click");
                  }}
                  className="font-mono text-[9px] bg-yellow-500 text-black px-4 py-2 hover:bg-yellow-400 font-bold border-4 border-black font-semibold"
                >
                  GOT IT
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
