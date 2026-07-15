# Plano de Execução — Fase 03: Upload e Processamento de Vídeos

**Responsável:** Tiago Aragão (Analista de TI)  
**Status:** Pronto para Implementação (Alinhado ao GEMINI.md)  

Este documento detalha o plano de execução fatiado em Step Implementations (SIs) e as especificações técnicas detalhadas para a Fase 03 do StreamTube.

---

## 🏗️ 1. Technical Specifications (Especificações Técnicas)

### 📊 Data Model (Entidade Video)
A nova entidade `Video` será relacionada com a tabela `Channel` já existente:

*   `id`: UUID (Primary Key, gerado automaticamente).
*   `channelId`: UUID (Foreign Key, relacionamento ManyToOne com `Channel`, obrigatório).
*   `title`: VARCHAR(255) (Obrigatório).
*   `description`: TEXT (Opcional).
*   `status`: ENUM ('draft', 'processing', 'ready', 'error') (Padrão: 'draft')[cite: 3].
*   `videoStorageKey`: VARCHAR(512) (Opcional, preenchido após confirmação do upload)[cite: 3].
*   `thumbnailStorageKey`: VARCHAR(512) (Opcional, gerado pelo worker)[cite: 3].
*   `duration`: INT (Opcional, duração em segundos extraída pelo worker)[cite: 3].
*   `metadata`: JSONB (Opcional, dados de codec, resolução e bitrate)[cite: 3].
*   `uniqueUrlSlug`: VARCHAR(100) (Unique Index, string curta de alta entropia para a URL pública)[cite: 3].
*   `createdAt`: TIMESTAMP (Padrão: now()).
*   `updatedAt`: TIMESTAMP (Padrão: now()).

### 🌐 API Contracts (Contratos dos Endpoints)

#### 1. Iniciar Upload Multipart
*   **POST** `/videos/upload/init`
*   **Autenticação:** Obrigatória (Bearer JWT)[cite: 3].
*   **Request Body:**
    ```json
    {
      "title": "Minha Aula de Arquitetura",
      "filename": "video_aula.mp4",
      "fileSize": 524288000
    }
    ```
*   **Response (201 Created):** Retorna o ID do rascunho, o slug único e os dados necessários para o upload direto em partes para o MinIO[cite: 3].

#### 2. Confirmar Upload e Disparar Processamento
*   **POST** `/videos/:id/upload/complete`
*   **Autenticação:** Obrigatória (Bearer JWT)[cite: 3].
*   **Request Body:**
    ```json
    {
      "uploadId": "string-do-storage",
      "parts": [{ "PartNumber": 1, "ETag": "string" }]
    }
    ```
*   **Response (200 OK):** Altera o status para `processing` e publica o job na fila[cite: 3].

#### 3. Streaming de Vídeo
*   **GET** `/videos/stream/:slug`
*   **Autenticação:** Opcional (Anônimo permitido).
*   **Headers Exigidos:** `Range: bytes=x-y`[cite: 3].
*   **Response (206 Partial Content):** Transmite o pedaço do binário solicitado[cite: 3].

#### 4. Download de Vídeo
*   **GET** `/videos/download/:slug`
*   **Response (200 OK):** Força o download do arquivo via header `Content-Disposition`.

### 🔐 Authorization Matrix (Matriz de Autorização)
*   `POST /videos/upload/init` -> Apenas usuários autenticados com Canal ativo[cite: 3].
*   `POST /videos/:id/upload/complete` -> Apenas o dono do Canal associado ao vídeo (Prevenção de BOLA/IDOR).
*   `GET /videos/stream/:slug` -> Público / Anônimo.
*   `GET /videos/download/:slug` -> Público / Anônimo.

### ✉️ Events / Messages (Topologia da Fila)
*   **Fila:** `video-processing`[cite: 3].
*   **Payload do Job:**
    ```json
    {
      "videoId": "UUID",
      "videoStorageKey": "raw-videos/slug.mp4"
    }
    ```

---

## 🔀 2. Dependency Map (Mapa de Dependências)
1. **Infraestrutura** (MinIO e Redis no Compose) deve anteceder as tabelas do banco[cite: 3].
2. **Entidade e Migrations** dependem da modelagem do banco[cite: 3].
3. **Módulo de Vídeo na API** depende dos serviços de Storage e Queue encapsulados[cite: 3].
4. **Worker Separado** depende da fila ativa e das tabelas estruturadas[cite: 3].

---

## 🏁 3. Step Implementations (SIs) — Roteiro de Código

### SI-03.1: Expansão da Infraestrutura no Docker Compose
*   **Ação:** Alterar o `compose.yaml` em `nestjs-project/` para adicionar os serviços `storage` (MinIO) e `queue` (Redis)[cite: 3].
*   **Validação:** Rodar `docker compose up -d` e verificar se os serviços sobem e se comunicam através dos nomes de serviço das redes do Compose[cite: 3].

### SI-03.2: Criação da Tabela de Vídeos via Migrations
*   **Ação:** Gerar a migration `CreateVideos` no TypeORM, mapeando a entidade e o relacionamento 1:N com Canais[cite: 3].
*   **Validação:** Rodar `npm run migration:run` e checar a integridade do banco no Postgres[cite: 3].

### SI-03.3: Módulo de Storage e Queue na API (NestJS)
*   **Ação:** Criar serviços reutilizáveis integrando com `@aws-sdk/client-s3` e `@nestjs/bullmq`[cite: 3].
*   **Validação:** Testes de integração locais garantindo conexão com os containers sem mockar a infra[cite: 3].

### SI-03.4: Implementação dos Endpoints de Ingestão e Upload Seguro
*   **Ação:** Criar as rotas de inicialização de upload, pré-cadastro automático do rascunho e rota de finalização que injeta o job na fila[cite: 3].
*   **Validação:** Testes E2E com supertest verificando a validação de token e segurança de escopo (IDOR)[cite: 3].

### SI-03.5: Construção do Worker Assíncrono e Integração com FFmpeg
*   **Ação:** Criar o container do Worker isolado. Configurar o binário do FFmpeg para calcular metadados do vídeo e salvar a thumbnail gerada de volta no storage[cite: 3].
*   **Validação:** Subir o fluxo completo, postar um vídeo e verificar se o status muda automaticamente de `processing` para `ready` e se o frame foi gerado[cite: 3].

### SI-03.6: Endpoints de Entrega (Streaming 206 e Download)
*   **Ação:** Implementar o streaming via Range requests da API lendo os blocos do MinIO[cite: 3].
*   **Validação:** Passar em toda a suíte de testes de ponta a ponta (`npm test` e `npm run test:e2e`), `npx tsc --noEmit` código 0, e `npm run lint` livre de erros[cite: 3].