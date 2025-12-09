// ----------------------------------------------------
// Lógica do Cliente (Front-end)
// ----------------------------------------------------

// Endereços dos serviços (Acessíveis via proxy reverso ou porta direta no Docker)
const AUTH_SERVICE_URL = "http://localhost:3001";
// Usamos a porta 3002, que corresponde à primeira instância do Chat Service no docker-compose
const CHAT_SERVICE_URL = "http://localhost:3002";

let socket;
let currentUser = { id: null, username: null, token: null };
let targetUser = { id: null, username: null };

// Estrutura de Usuários para Simulação 1:1 (IDs e Nomes)
const SIMULATED_USERS = [
  { id: "user_a", username: "Alice" },
  { id: "user_b", username: "Bob" },
  { id: "user_c", username: "Carlos" },
];

// --- Elementos DOM ---
const statusPanel = document.getElementById("status-panel");
const chatPanel = document.getElementById("chat-panel");
const connectionStatus = document.getElementById("connection-status");
const currentUsernameEl = document.getElementById("current-username");
const currentUserIdEl = document.getElementById("current-userid");
const loginForm = document.getElementById("login-form");
const messagesDisplay = document.getElementById("messages-display");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const targetUsernameEl = document.getElementById("target-username");
const targetUserIdEl = document.getElementById("target-userid");
const contactList = document.getElementById("contact-list");
const userInfoEl = document.getElementById("user-info");

// --- Funções de UI ---

function updateConnectionStatus(isConnected) {
  if (isConnected) {
    connectionStatus.textContent = `Conectado via Socket.IO (${CHAT_SERVICE_URL})`;
    connectionStatus.classList.remove("text-red-500");
    connectionStatus.classList.add("text-green-500");
    messageInput.disabled = false;
    sendBtn.disabled = false;
  } else {
    connectionStatus.textContent = "Desconectado";
    connectionStatus.classList.remove("text-green-500");
    connectionStatus.classList.add("text-red-500");
    messageInput.disabled = true;
    sendBtn.disabled = true;
  }
}

function displayMessage(msg) {
  const isSelf = msg.senderId === currentUser.id;
  const sender = isSelf ? "Você" : msg.senderUsername || msg.senderId;

  const msgEl = document.createElement("div");
  msgEl.className = `flex ${isSelf ? "justify-end" : "justify-start"}`;
  msgEl.innerHTML = `
        <div class="msg-bubble p-3 rounded-xl shadow ${
          isSelf ? "self-end" : "peer-start"
        }">
            <p class="font-semibold text-xs mb-1">${sender}</p>
            <p class="text-sm">${msg.content}</p>
            <p class="text-xs text-gray-500 mt-1 text-right">${new Date(
              msg.timestamp
            ).toLocaleTimeString()}</p>
        </div>
    `;
  messagesDisplay.appendChild(msgEl);
  messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
}

function loadContactList() {
  contactList.innerHTML = "";
  SIMULATED_USERS.forEach((user) => {
    if (user.id !== currentUser.id) {
      const li = document.createElement("li");
      li.className =
        "cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition duration-150";
      li.textContent = user.username;
      li.onclick = () => selectUser(user);
      contactList.appendChild(li);
    }
  });
}

// --- Lógica de Conversa ---

async function selectUser(user) {
  targetUser = user;
  targetUsernameEl.textContent = user.username;
  targetUserIdEl.textContent = user.id;
  messagesDisplay.innerHTML = "";

  chatPanel.classList.remove("hidden");

  // Carrega Histórico (API REST)
  await loadMessageHistory(currentUser.id, targetUser.id);
}

async function loadMessageHistory(userId1, userId2) {
  try {
    const url = `${CHAT_SERVICE_URL}/history/${userId1}/${userId2}`;
    const res = await fetch(url);
    const history = await res.json();

    messagesDisplay.innerHTML = ""; // Limpa antes de carregar
    history.forEach((msg) => {
      // Adiciona o nome do usuário para exibição
      if (msg.senderId === "user_a") msg.senderUsername = "Alice";
      if (msg.senderId === "user_b") msg.senderUsername = "Bob";
      if (msg.senderId === "user_c") msg.senderUsername = "Carlos";
      displayMessage(msg);
    });
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    alert("Falha ao carregar histórico de mensagens.");
  }
}

// --- Lógica de Auth e Conexão ---

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  try {
    // Tenta Logar/Registrar no Auth Service
    let res = await fetch(`${AUTH_SERVICE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.status === 401) {
      // Se falhou, tenta registrar
      res = await fetch(`${AUTH_SERVICE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 201) {
        // Registro bem-sucedido, tenta logar novamente para obter o token
        return handleLogin(e);
      } else if (res.status === 409) {
        alert("Usuário já existe. Tente novamente com a senha correta.");
        return;
      } else {
        throw new Error("Erro ao registrar.");
      }
    }

    const data = await res.json();

    if (data.token) {
      currentUser.token = data.token;
      currentUser.id = data.userId;
      currentUser.username = data.username;

      localStorage.setItem("microchat_token", data.token);

      // UI Update
      loginForm.classList.add("hidden");
      userInfoEl.classList.remove("hidden");
      currentUsernameEl.textContent = data.username;
      currentUserIdEl.textContent = data.userId;

      loadContactList();
      connectWebSocket(); // Conecta ao Chat Service
    } else {
      alert("Falha na autenticação.");
    }
  } catch (error) {
    console.error("Erro no Login:", error);
    alert("Erro de comunicação com o serviço de autenticação.");
  }
}

function connectWebSocket() {
  if (socket) {
    socket.disconnect();
  }

  // 1. Conecta ao Chat Service, enviando o token JWT
  socket = io(CHAT_SERVICE_URL, {
    auth: {
      token: currentUser.token,
    },
    transports: ["websocket"], // Força o uso de WebSocket para o trabalho
  });

  // 2. Handlers de Eventos
  socket.on("connect", () => {
    console.log("WebSocket conectado ao Chat Service!");
    updateConnectionStatus(true);
  });

  socket.on("disconnect", () => {
    console.log("WebSocket desconectado.");
    updateConnectionStatus(false);
  });

  socket.on("error", (err) => {
    console.error("Erro no WebSocket:", err);
    alert(`Erro de conexão: ${err.message}`);
    updateConnectionStatus(false);
  });

  // 3. Recebimento de Nova Mensagem
  socket.on("new_message", (msg) => {
    // A mensagem deve ser exibida SOMENTE se for para ou do usuário ativo
    const isActiveConversation =
      (msg.senderId === currentUser.id && msg.receiverId === targetUser.id) ||
      (msg.senderId === targetUser.id && msg.receiverId === currentUser.id);

    if (isActiveConversation) {
      // Adiciona o nome do usuário para exibição
      if (msg.senderId === "user_a") msg.senderUsername = "Alice";
      if (msg.senderId === "user_b") msg.senderUsername = "Bob";
      if (msg.senderId === "user_c") msg.senderUsername = "Carlos";
      displayMessage(msg);
    } else {
      console.log(
        `Nova mensagem recebida de ${msg.senderId}, mas não na conversa ativa.`
      );
      // Notificação simples
    }
  });
}

function handleSendMessage(e) {
  e.preventDefault();
  const content = messageInput.value.trim();

  if (!content || !targetUser.id || !socket || !socket.connected) {
    return;
  }

  // Envia a mensagem via WebSocket
  socket.emit("send_message", {
    receiverId: targetUser.id,
    content: content,
  });

  messageInput.value = ""; // Limpa o input
}

// --- Inicialização ---

document.addEventListener("DOMContentLoaded", () => {
  loginForm.addEventListener("submit", handleLogin);
  messageForm.addEventListener("submit", handleSendMessage);
});
