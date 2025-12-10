# Projeto Final: Sistema de Chat Distribuído (MicroChat)

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

6. Rodar pelo Python o locahost:

Passo a Passo para Corrigir a Origem
Parar o Docker (Opcional, mas limpa o console): Se você quiser parar os logs, execute docker compose down. Se não, continue com o próximo passo.

Abrir o Terminal na Pasta Correta: No VS Code, abra um novo terminal e navegue para a pasta frontend/ do seu projeto:

```bash

cd frontend
Iniciar o Servidor Python: Use o módulo http.server do Python para servir o Front-end na porta 8000:

```

Se você tem Python 3
python -m http.server 8000
O terminal deve mostrar: Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...

Acessar a URL Localhost: Abra o navegador e acesse:

http://localhost:8000/
Testar: Com o Front-end carregado via http://localhost:8000, tente registrar e logar novamente (usuário alice, senha 1234).

7. Para restartar o docker:
```bash
docker compose down -v
```

```bash
docker compose build --no-cache
```

```bash
docker compose up
```
