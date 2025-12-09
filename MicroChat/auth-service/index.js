// ----------------------------------------------------
// Serviço de Autenticação (Microsserviço de Usuário)
// ----------------------------------------------------
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/microchat_db";
const JWT_SECRET = process.env.JWT_SECRET || "chave_secreta_padrao";

app.use(express.json());

// Conexão com o MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Auth Service: Conectado ao MongoDB."))
  .catch((err) =>
    console.error("Auth Service: Erro de conexão com MongoDB:", err)
  );

// Esquema do Usuário
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Middleware para hash de senha antes de salvar
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model("User", UserSchema);

// Endpoint de Registro de Novo Usuário
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .send({ message: "Nome de usuário e senha são obrigatórios." });
    }
    const user = new User({ username, password });
    await user.save();
    res.status(201).send({ message: "Usuário registrado com sucesso." });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicated key error
      return res.status(409).send({ message: "Nome de usuário já existe." });
    }
    console.error("Erro no registro:", error);
    res.status(500).send({ message: "Erro interno ao registrar." });
  }
});

// Endpoint de Login e Emissão de JWT
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send({ message: "Credenciais inválidas." });
    }

    // Emite o token JWT (Importante para autenticação no Chat Service)
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.send({
      message: "Login bem-sucedido.",
      token,
      userId: user._id,
      username: user.username,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).send({ message: "Erro interno ao autenticar." });
  }
});

// Endpoint de Verificação de Token (Usado internamente pelo Chat Service)
app.post("/verify-token", (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).send({ message: "Token não fornecido." });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.send({ isValid: true, user: decoded });
  } catch (error) {
    res
      .status(401)
      .send({ isValid: false, message: "Token inválido ou expirado." });
  }
});

app.listen(PORT, () => {
  console.log(`Auth Service rodando na porta ${PORT}`);
});
