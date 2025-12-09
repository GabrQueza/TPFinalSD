Projeto Final: Sistema de Chat Distribuído (MicroChat)

Este projeto implementa uma plataforma de comunicação em tempo real utilizando uma arquitetura de Microsserviços, WebSockets e Redis para garantir Escalabilidade Horizontal e Alta Disponibilidade, conforme os requisitos do Trabalho Final.

1. Arquitetura de Microsserviços

O sistema é dividido em serviços independentes coordenados pelo Docker Compose:

| Serviço | Função Principal | Tecnologia | Porta Exposta |
| Auth Service | Login, Registro e Autenticação (JWT) | Node.js (Express) | 3001 |
| Chat Service (x2) | WebSockets, Distribuição (Pub/Sub) e Persistência de Mensagens 1:1 | Node.js (Socket.IO) | 3002, 3003 |
| Redis | Message Broker para Sincronização de Chat | Redis (Adapter) | 6379 |
| MongoDB | Persistência de Usuários e Histórico de Mensagens | MongoDB | 27017 |

2. Estrutura do Projeto

O projeto é organizado em diretórios para cada microsserviço:

```
MicroChat/
├── auth-service/        # Microsserviço de Usuário/Autenticação (Porta 3001)
├── chat-service/        # Microsserviço de Mensagens (Portas 3002 e 3003)
├── frontend/            # Interface de Usuário (HTML/JS)
└── docker-compose.yml   # Configuração do Ambiente Distribuído (Redis, Mongo, Services)
```

3. Pré-requisitos e Dependências

Docker e Docker Compose (ou Docker Desktop) instalados e rodando.

Node.js (necessário apenas para gerenciar os arquivos package.json localmente, se desejar).

4. Execução do Ambiente Distribuído (Via Docker Compose)

Para iniciar todos os microsserviços, o broker (Redis) e o banco de dados (MongoDB), execute o comando na pasta raiz do projeto (MicroChat/):

```bash

O '--build' garante que as imagens dos serviços Node.js sejam criadas

docker-compose up --build
```

Pontos importantes da execução:

Serviço de Chat Escalonado: Duas instâncias do Chat Service são iniciadas nas portas 3002 e 3003. O Redis as sincroniza.

Status dos Serviços: Você pode verificar os logs de cada serviço no terminal.

5. Acesso e Teste da Aplicação

Frontend (Interface do Usuário):
Abra o arquivo frontend/index.html diretamente no seu navegador.

Teste de Autenticação:
Use o formulário de login/registro para criar dois usuários (ex: alice e bob).

Teste de Escalabilidade (Opcional, mas Recomendado):
Para provar que o Redis está funcionando, abra o frontend/app.js e altere temporariamente a URL do Chat Service:

Mude const CHAT_SERVICE_URL = 'http://localhost:3002';

Para const CHAT_SERVICE_URL = 'http://localhost:3003';

Salve, recarregue o index.html e tente enviar uma mensagem entre os usuários. A entrega imediata prova que o Redis distribuiu a mensagem entre as portas 3002 e 3003.

```eof

2. Perguntas sobre Ambiente e Comandos

A. Extensão "Container Tools" da Microsoft

Sim, você deve usar a extensão "Container Tools" (agora geralmente chamada apenas de "Docker" no VS Code).

Essa extensão é extremamente útil para:

Visualizar todos os seus contêineres (redis, mongodb, auth-service, chat-service-1, etc.).

Verificar os logs em tempo real de qualquer serviço (clicando com o botão direito no contêiner).

Parar ou reconstruir o ambiente com facilidade, substituindo a necessidade de digitar comandos longos no terminal.

B. Comando para Instalar Node.js

Você está no caminho certo! O comando para instalar as dependências do Node.js é npm install (ou a forma abreviada npm i).

npm (Node Package Manager) é a ferramenta padrão do Node.js.

yarn é um gerenciador de pacotes alternativo. Ambos fazem a mesma coisa, mas o seu projeto está configurado para usar npm.

O mais importante: Como estamos usando o Docker, você não precisa rodar npm install localmente no seu computador. O Dockerfile de cada serviço já contém a linha RUN npm install , o que significa que o Docker faz a instalação das dependências dentro do contêiner durante a fase de construção (docker-compose up --build).

Isso simplifica seu trabalho e garante que o ambiente de produção (o contêiner) seja idêntico ao ambiente de desenvolvimento.
```
