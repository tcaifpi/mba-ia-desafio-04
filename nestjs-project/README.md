cat << 'EOF' > README.md
# StreamTube API — Fase 03 (Upload e Processamento de Vídeos)

Esta é a API do StreamTube, desenvolvida em NestJS 11 como parte do Desafio 04 do MBA em Engenharia de Software com IA. Esta fase engloba a ingestão de vídeos de grande porte, processamento assíncrono em fila e armazenamento distribuído de mídia.

## 🛠️ Arquitetura e Tecnologias

- **Framework principal:** NestJS 11 (TypeScript)
- **Persistência de dados:** PostgreSQL 17 + TypeORM
- **Mensageria e Filas:** BullMQ + Redis
- **Armazenamento de Objetos (Storage):** MinIO (compatível com S3)
- **Processamento de Mídia:** Worker dedicado + FFmpeg

---

## 🚀 Como Executar o Ambiente Local

Para subir toda a infraestrutura física exigida (Banco de dados, Fila, Object Storage e o Worker de vídeo), utilize o Docker Compose:

```bash
# Iniciar todos os containers em segundo plano
docker compose up -d