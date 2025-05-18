import { Server } from "socket.io";
import { spawn } from "child_process";
import fs from "fs";

import path from "path";

let connections = {};
let messages = {};
let timeOnline = {};

const tmpDir = path.join("transcription_service", "audio_chunks");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

let persistentPy;

function startPersistentWhisperProcess(io) {
  persistentPy = spawn("python", ["transcription_service/live_transcribe.py"]);

  persistentPy.stdout.on("data", (data) => {
    const text = data.toString().trim();
    if (text) {
      io.emit("transcription", text);
    }
  });

  persistentPy.stderr.on("data", (err) => {
    console.error("Python error:", err.toString());
  });

  persistentPy.on("exit", (code, signal) => {
    console.error(
      `Whisper process exited with code ${code} and signal ${signal}. Restarting in 3 seconds...`
    );
    setTimeout(() => startPersistentWhisperProcess(io), 3000); // backoff restart
  });
}

export const connectToSocket = (server) => {
  console.log("Socket server initialization start");
  try {
    const io = new Server(server, {
      maxHttpBufferSize: 1e7,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true,
      },
    });

    console.log("Socket server initialization complete");
    startPersistentWhisperProcess(io);

    io.on("connection", (socket) => {
      console.log("User connected");
      let adminID;

      socket.on("join-call", (path) => {
        if (!connections[path]){ connections[path] = [];
          adminID = socket.id;
        }
        socket.emit("adminID", socket.id );
        console.log("Admin ID sent to client:", socket.id);
        connections[path].push(socket.id);
        timeOnline[socket.id] = new Date();


        connections[path].forEach((id) => {
          io.to(id).emit("user-joined", socket.id, connections[path]);
        });

        if (messages[path]) {
          messages[path].forEach((msg) => {
            io.to(socket.id).emit(
              "chat-message",
              msg.data,
              msg.sender,
              msg["socket-id-sender"]
            );
          });
        }
      });

      socket.on("audio-chunk", async (audio) => {
        try {
          let buffer;
          if (Buffer.isBuffer(audio)) {
            buffer = audio;
          } else if (audio.data) {
            buffer = Buffer.from(audio.data);
          } else if (typeof audio === "string") {
            buffer = Buffer.from(audio, "base64");
          } else {
            return console.error("Unknown audio format");
          }

          if (!buffer || buffer.length < 1000) {
      return console.warn("Received empty or too small audio buffer. Skipping...");
    }

          // Save the buffer as a WAV file in tmpDir
          const fileName = `audio_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}.wav`;
          const filePath = path.join(tmpDir, fileName);

          await fs.promises.writeFile(filePath, buffer);

          // Send the path to Python via stdin
          if (persistentPy && !persistentPy.killed) {
            persistentPy.stdin.write(filePath + "\n");
          } else {
            console.error("Python process not running");
          }

          // Optional: delete file after a delay to allow Python processing (or handle cleanup differently)
          setTimeout(() => {
            fs.unlink(filePath, (err) => {
              if (err)
                console.warn("Failed to delete temp audio file:", err.message);
            });
          }, 60 * 1000); // delete after 60 seconds
        } catch (err) {
          console.error("Error handling audio chunk:", err);
        }
      });

      socket.on("signal", (toId, message) => {
        io.to(toId).emit("signal", socket.id, message);
      });

      socket.on("chat-message", (data, sender) => {
        const [room] =
          Object.entries(connections).find(([_, users]) =>
            users.includes(socket.id)
          ) || [];
        if (room) {
          messages[room] = messages[room] || [];
          messages[room].push({ sender, data, "socket-id-sender": socket.id });

          connections[room].forEach((id) => {
            io.to(id).emit("chat-message", data, sender, socket.id);
          });
        }
      });

      socket.on("disconnect", () => {
        for (const [room, users] of Object.entries(connections)) {
          const index = users.indexOf(socket.id);
          if (index !== -1) {
            users.splice(index, 1);
            users.forEach((id) => io.to(id).emit("user-left", socket.id));
            if (users.length === 0) delete connections[room];
            break;
          }
        }
      });
    });

    return io;
  } catch (error) {
    console.error("Error setting up socket.io:", error);
    return null;
  }
};
