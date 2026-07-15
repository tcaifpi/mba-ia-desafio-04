# Contexto da Fase 03 — Upload e Processamento de Vídeos

**Responsável:** Tiago Aragão (Analista de TI)
**Status:** Validado / Alinhado com as Fases 01 e 02

## 1. Escopo e Objetivos da Fase
Esta fase expande a infraestrutura do StreamTube para suportar o core business da plataforma: a ingestão, armazenamento, processamento assíncrono e entrega de fluxos de vídeo de até 10GB de forma distribuída, sem comprometer a responsabilidade e a performance da API principal.

## 2. Componentes Envolvidos e Responsabilidades
* **API (NestJS):** Orquestra o ciclo de vida inicial. Expõe endpoints para iniciar o upload multipart, gera URLs pré-assinadas (Presigned URLs) integrando com o MinIO, realiza o pré-cadastro automático do vídeo como `rascunho` no PostgreSQL conectado ao Canal do usuário, e publica jobs na fila assim que o upload é concluído pelo cliente.
* **Fila (BullMQ/Redis):** Atua como o barramento de mensageria assíncrona. Gerencia o ciclo de vida dos jobs de transcodificação e extração, garantindo resiliência, isolamento e retentativas automáticas em caso de falhas de processamento.
* **Worker (Node.js/FFmpeg):** Consome os jobs da fila de forma isolada. Baixa os pedaços/arquivo do storage, invoca os binários do `ffprobe` (para extração de duração e metadados) e `ffmpeg` (para extração de frame e geração de thumbnail), envia os resultados de imagem de volta ao storage e altera o status do vídeo para `pronto` ou `erro`.
* **Object Storage (MinIO):** Responsável por armazenar os arquivos brutos de vídeo de até 10GB e os arquivos finais das thumbnails geradas.

## 3. Modelo de Dados Prévio (Entidade Video)
A tabela a ser persistida via migration deve conter a seguinte estrutura básica acordada:
* `id` (UUID / Identificador único interno)
* `channel_id` (Relacionamento ManyToOne com Canais - dono do vídeo)
* `title` (Título do rascunho/vídeo)
* `status` (Enum: `draft`, `processing`, `ready`, `error`)
* `video_storage_key` (Caminho/Chave do arquivo de vídeo no bucket)
* `thumbnail_storage_key` (Caminho/Chave da imagem no bucket)
* `duration` (Duração em segundos extraída pelo worker)
* `metadata` (JSON contendo codecs, bitrate e resoluções)
* `unique_url_slug` (Identificador seguro e único para a URL pública do streaming)