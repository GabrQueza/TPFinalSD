// ----------------------------------------------------
// Serviço de Mensagens (Microsserviço de Chat em Tempo Real)
// ----------------------------------------------------
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3002;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/microchat_db";
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const JWT_SECRET = process.env.JWT_SECRET || "chave_secreta_padrao";

app.use(express.json());

// ---------------------
// 1. Configuração do Banco de Dados (MongoDB)
// ---------------------
mongoose
  .connect(MONGO_URI)
  .then(() => console.log(`Chat Service (${PORT}): Conectado ao MongoDB.`))
  .catch((err) =>
    console.error(`Chat Service (${PORT}): Erro de conexão com MongoDB:`, err)
  );

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", MessageSchema);

// ---------------------
// 2. Configuração do Redis (Message Broker) para Escalabilidade
// O adaptador Redis permite que múltiplas instâncias do Chat Service se comuniquem.
// ---------------------
const pubClient = createClient({ url: `redis://${REDIS_HOST}:6379` });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    console.log(`Chat Service (${PORT}): Conectado ao Redis.`);
  })
  .catch((err) =>
    console.error(`Chat Service (${PORT}): Erro de conexão com Redis:`, err)
  );

// ---------------------
// 3. Configuração do Socket.IO (WebSockets)
// ---------------------
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Aplica o adaptador Redis para distribuir mensagens entre instâncias
io.adapter(createAdapter(pubClient, subClient));

// Middleware de Autenticação do WebSocket (usa o Token JWT)
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Autenticação falhou: Token não fornecido."));
  }
  try {
    // Verifica o token JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    console.log(
      `[Socket] Usuário autenticado: ${socket.username} (${socket.userId})`
    );
    next();
  } catch (err) {
    return next(new Error("Autenticação falhou: Token inválido."));
  }
});

// Eventos do WebSocket
io.on("connection", (socket) => {
  // Entra na room específica do usuário para receber mensagens privadas
  socket.join(socket.userId);
  console.log(`[Socket] Novo cliente conectado: ${socket.userId}`);

  // Lógica para Troca de Mensagens 1:1 (Privadas)
  socket.on("send_message", async (data) => {
    const { receiverId, content } = data;

    if (!receiverId || !content) {
      return socket.emit("error", {
        message: "Dados da mensagem incompletos.",
      });
    }

    try {
      // 1. Persistência (MongoDB)
      const newMessage = new Message({
        senderId: socket.userId,
        receiverId: receiverId,
        content: content,
      });
      await newMessage.save();

      // 2. Transmissão em Tempo Real (Socket.IO + Redis Adapter)
      // Envia para a room do destinatário (incluindo todas as instâncias do Chat Service)
      io.to(receiverId).emit("new_message", newMessage);

      // Envia de volta ao remetente (para atualizar a interface dele)
      socket.emit("new_message", newMessage);

      console.log(`[Chat] Msg de ${socket.username} para ${receiverId}`);
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      socket.emit("error", { message: "Erro ao enviar mensagem." });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Cliente desconectado: ${socket.userId}`);
  });
});

// ---------------------
// 4. API REST para Histórico de Mensagens
// ---------------------
app.get("/history/:userId1/:userId2", async (req, res) => {
  const { userId1, userId2 } = req.params;

  // Busca mensagens onde (sender=1 E receiver=2) OU (sender=2 E receiver=1)
  const query = {
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 },
    ],
  };

  try {
    const history = await Message.find(query).sort({ timestamp: 1 }).limit(100);
    res.send(history);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    res.status(500).send({ message: "Erro ao buscar histórico." });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Chat Service rodando na porta ${PORT}`);
  console.log(`(Instância rodando em http://localhost:${PORT})`);
});
