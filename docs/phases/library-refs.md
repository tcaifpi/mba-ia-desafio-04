# Referências de Bibliotecas — Fase 03: Upload e Processamento de Vídeos

**Responsável:** Tiago Aragão (Analista de TI)  
**Status:** Fixado via MCP (context7)  

Este documento mapeia as bibliotecas externas adicionadas ao ecossistema do StreamTube para suportar as operações de mensageria, armazenamento distribuído e processamento audiovisual de grande porte.

---

## 1. Ecossistema da API Principal (`nestjs-project`)

### @nestjs/bullmq & bullmq
* **Propósito:** Integração de primeira classe do NestJS com o BullMQ para gerenciar a fila de processamento assíncrono baseada em Redis.
* **Versão Alvo:** Compatível com a infraestrutura do NestJS 11 instalada[cite: 3].
* **Padrão de Uso:** Registro do módulo via `BullModule.forRoot()` apontando para o host de rede do Docker Compose `queue` (porta 6379)[cite: 3].

### @aws-sdk/client-s3 & @aws-sdk/s3-request-presigner
* **Propósito:** SDK oficial da AWS para interagir com a API compatível do MinIO local e gerar as URLs pré-assinadas (*Presigned URLs*) para o Multipart Upload de até 10GB direto do cliente[cite: 3].
* **Versão Alvo:** v3.x (Modular)[cite: 3].
* **Padrão de Uso:** Inicialização do `S3Client` configurando `forcePathStyle: true` e injetando as credenciais do Compose[cite: 3].

---

## 2. Ecossistema do Worker de Vídeo

### fluent-ffmpeg
* **Propósito:** Abstração de comandos fluentes em Node.js para interagir nativamente com as ferramentas de linha de comando `ffmpeg` e `ffprobe` instaladas no container[cite: 3].
* **Versão Alvo:** v2.x[cite: 3].
* **Padrão de Uso:** Extração de metadados de duração em formato JSON e captura de frame estático em timestamp controlado para geração automática da thumbnail[cite: 3].