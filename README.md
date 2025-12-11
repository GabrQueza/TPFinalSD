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

5. Para restartar/iniciar o docker novamente:

```bash
docker compose down -v
```

```bash
docker compose build --no-cache
```

```bash
docker compose up
```

6. Acesso da aplicação (via Python e o localhost)

Abrir o Terminal na Pasta Correta: No VS Code, abra um novo terminal e navegue para a pasta frontend/ do seu projeto:

```bash

cd frontend

```
Iniciar o Servidor Python: Use o módulo http.server do Python para servir o Front-end na porta 8000:

Se você tem Python 3
```bash
python -m http.server 8000
```
O terminal deve mostrar: Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...

Agora para o acesso do localhost, basta abrir duas janelas de navegadores e acessar:

http://localhost:8000/
Testar: Com o Front-end carregado via http://localhost:8000, tente registrar o primeiro usuário e logar novamente (Exemplo: usuário alice, senha 1234).
Após isso na outra janela tente registrar o primeiro usuário e logar novamente (Exemplo: usuário bob, senha 1234)
Cada janela vai mostrar quais usuários estão ativos no momento, portanto para alice(com um id único) vai verificar que o bob(com outro id único) está online para chat e vice-versa.
Para o teste, basta um deles mandar uma mensagem para o outro e vice-versa, é simultâneo. É possível criar até 20 usuários simultâneos, garantido pelo código e pelo docker.


