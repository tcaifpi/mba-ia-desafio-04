
---

## 🛠️ Technical Specifications

### Error Catalog

| Error Code | HTTP Status | Description | Trigger Condition |
| :--- | :---: | :--- | :--- |
| `VIDEO_NOT_FOUND` | 404 | Vídeo não encontrado no banco de dados. | Requisição a endpoint com ID inexistente. |
| `MEDIA_NOT_READY` | 404 / 500 | Arquivo de mídia indisponível no Storage/MinIO. | Tentativa de streaming antes do processamento concluído. |
| `INVALID_INPUT` | 400 | Erro de validação nos DTOs de entrada. | Parâmetros obrigatórios ausentes ou em formato inválido. |
| `STORAGE_ERROR` | 500 | Falha na comunicação com MinIO/S3. | Credenciais incorretas ou serviço de storage offline. |
| `QUEUE_ERROR` | 500 | Falha ao enfileirar job no Redis/BullMQ. | Serviço de fila offline ou falha de conexão com o Redis. |

### Deliverables

* **SI-03.1:** Infraestrutura Docker Compose expandida com serviços MinIO e Redis ativos.
* **SI-03.2:** Migration TypeORM para tabela `videos` com mapeamento de relacionamentos e metadados.
* **SI-03.3:** Módulos `StorageService` e `QueueService` injetáveis e integrados à API NestJS.
* **SI-03.4:** Endpoints de ingestão (`POST /videos`) com suporte a DTOs e geração de Presigned URLs.
* **SI-03.5:** Worker assíncrono BullMQ integrado ao FFmpeg para transcodificação de vídeos.
* **SI-03.6:** Endpoints de streaming (`GET /videos/:id/stream`) com suporte a chunking (HTTP 206 Partial Content) e cobertura de testes E2E.
