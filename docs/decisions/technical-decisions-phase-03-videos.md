# Decisões Técnicas — Fase 03: Upload e Processamento de Vídeos

**Responsável:** Tiago Aragão (Analista de TI)  
**Status:** Homologado / Pronto para Alimentar o Planejamento  

Este documento registra as decisões de arquitetura e infraestrutura para a Fase 03 do StreamTube, analisando opções, trade-offs e definindo a stack recomendada para o tratamento de arquivos de até 10GB de forma assíncrona.

---

## 1. Tecnologia de Fila (Message Queue)

*   **Opções Analisadas:** RabbitMQ, Apache Kafka, BullMQ (Redis-backed).
*   **Trade-offs:**
    *   *RabbitMQ / Kafka:* Oferecem alta escalabilidade corporativa, mas adicionam complexidade operacional acentuada de configuração e maior consumo de memória RAM no ambiente conteinerizado local.
    *   *BullMQ:* Utiliza o Redis como motor de dados. É extremamente leve para execução em Docker Compose, possui integração nativa e simplificada com o ecossistema NestJS (via `@nestjs/bullmq`) e provê gerenciamento nativo e robusto de estados de ciclo de vida de jobs (espera, processamento, falha, sucesso).
*   **Decisão:** **BullMQ com Redis**.
*   **Justificativa:** Casamento perfeito com a pilha NestJS atual, baixo consumo de infraestrutura no ambiente de desenvolvimento local e suporte nativo a retentativas automáticas e controle de concorrência.

---

## 2. Estratégia de Upload de Grandes Arquivos (Até 10GB)

*   **Opções Analisadas:** Multipart Form Data convencional via API (NestJS Streaming), Multipart Upload direto ao Storage via Presigned URLs.
*   **Trade-offs:**
    *   *API Proxy Streaming:* Fazer o arquivo passar pela API (mesmo via streams do Node.js) sobrecarrega a CPU e monopoliza o I/O do processo do NestJS em uploads simultâneos de grande porte, violando o requisito de "não travar o sistema".
    *   *Presigned URLs (Multipart):* A API NestJS atua apenas no controle: recebe a intenção de upload, efetua o pré-cadastro do vídeo como `rascunho` no PostgreSQL e gera chaves seguras expiráveis em partes. O cliente web realiza o upload dos blocos (chunks) diretamente para o Object Storage (MinIO/S3).
*   **Decisão:** **Multipart Upload direto via URLs Pré-Assinadas (Presigned URLs)**.
*   **Justificativa:** Zera o overhead de banda e processamento na API principal, transferindo a carga pesada de I/O de rede diretamente para a infraestrutura dedicada de Object Storage.

---

## 3. Isolamento do Processamento de Vídeos (Worker & FFmpeg)

*   **Opções Analisadas:** Processamento inline na API via subprocesso local, Worker isolado em container dedicado.
*   **Trade-offs:**
    *   *Subprocesso na API:* Chamar o binário do FFmpeg diretamente em threads filhas da API NestJS degradaria a estabilidade do servidor web em instantes durante transcodificações pesadas.
    *   *Container Worker Dedicado:* Um microsserviço Node.js isolado no Docker Compose que escuta a fila do BullMQ. Possui seus próprios recursos de hardware limitados, consome as mensagens, baixa os chunks/vídeos temporariamente e dispara os binários do FFmpeg/ffprobe de maneira encapsulada.
*   **Decisão:** **Worker Isolado em Container Docker Independente**.
*   **Justificativa:** Isolamento completo de falhas. Se uma transcodificação de vídeo estourar o limite de memória ou CPU, apenas o container do Worker cai e é reiniciado pelo Docker Daemon; a API de atendimento aos clientes permanece 100% disponível.

---

## 4. Estratégia de URL Única e Streaming de Vídeo

*   **Opções Analisadas:** Geração de slugs baseados em título, UUIDv4 criptográfico, e streaming via HTTP Range (206) vs HLS (HTTP Live Streaming).
*   **Trade-offs:**
    *   *URL Única:* Usar títulos geraria colisões frequentes. Optar por identificadores únicos baseados em strings pseudo-aleatórias curtas de alta entropia (ex: `nanoid` ou UUID truncado) garante URLs únicas, curtas e não previsíveis.
    *   *Streaming:* HLS é o padrão de mercado para produção, mas exige a quebra do vídeo em centenas de arquivos `.ts` e um manifesto `.m3u8`, expandindo o escopo do desafio. O suporte a requisições com cabeçalhos **HTTP Range (`206 Partial Content`)** entrega a capacidade de reprodução imediata e saltos temporais na timeline consumindo diretamente o arquivo bruto do storage.
*   **Decisão:** **URLs geradas via UUID/NanoID seguro e Streaming baseado em HTTP Range (206 Partial Content)**.
*   **Justificativa:** Garante conformidade estrita aos entregáveis exigidos pelo edital da fase com simplicidade de implementação e sem inflar desnecessariamente o pipeline de processamento do Worker local.