# Diretrizes de Engenharia e Workflow IA (Gemini CLI)

## Visão Geral do Projeto (StreamTube)
Plataforma de compartilhamento de vídeos. A Fase 03 (foco atual) exige a implementação de upload de vídeos de até 10GB sem travar a API, processamento assíncrono (extração de metadados e thumbnail via FFmpeg), armazenamento em Object Storage e reprodução via streaming.

## Arquitetura (C4 Container Diagram)
O projeto é um monorepo que roda inteiramente em Docker. Componentes:
- **API (NestJS 11):** Regras de negócio, endpoints, auth, escrita no DB e publicação na fila.
- **Video Worker (FFmpeg):** Processo isolado que consome a fila, extrai metadados/thumbnails e atualiza status.
- **Database (PostgreSQL 17):** Persistência de usuários, canais e metadados de vídeo.
- **Object Storage (S3/MinIO):** Armazenamento de arquivos pesados (vídeos e imagens).
- **Message Queue (TBD):** Fila de processamento assíncrono.
- **Email Service (Mailpit):** Teste de e-mails transacionais.

## ⚠️ Regras de Rede Docker (CRÍTICO)
Como o projeto roda inteiramente em containers, **use sempre o nome do serviço do Compose como host (ex.: `db`, `storage`, `queue`), NUNCA `localhost` ou `127.0.0.1`** para comunicação interna entre containers.
- **Correto:** `DB_HOST=db`
- **Incorreto:** `DB_HOST=localhost`

## 🧪 Convenções de Testes e Arquivos
Cada alteração deve ser testada. Durante o desenvolvimento das SIs, rode apenas os testes focados.
- **Testes Unitários:** `*.spec.ts`
- **Testes de Integração:** `*.integration-spec.ts` (devem exercitar a infra real do Compose, como o MinIO e a Fila, sem mockar o que pode ser testado na infra real).
- **Testes End-to-End (E2E):** `*.e2e-spec.ts` (HTTP via supertest).

## 📚 Documentação de Bibliotecas via MCP (context7)
Antes de implementar qualquer funcionalidade que utilize bibliotecas externas (ex: BullMQ, AWS SDK, fluent-ffmpeg), você **DEVE** obrigatoriamente:
1. Checar a versão instalada no `package.json`.
2. Usar a tool/servidor MCP `context7` para consultar a documentação oficial da versão correta.
3. Seguir os padrões da documentação em vez de dados genéricos de treinamento.

## 🔀 Git Flow e Limites de Escopo
- **Branches:** `feature/*` devem sempre sair da branch `dev` e retornar para a `dev`.
- **Proibição:** Nunca faça commits diretos na branch `main`.
- Foco em apenas uma funcionalidade por vez. Não misture refatoração cosmética com entrega de feature funcional.

## ✅ Definition of Done (Critério de Aceite)
Uma Step Implementation (SI) ou a Fase só está pronta se atender a TODOS os requisitos abaixo:
1. Suíte de testes local relevante passa (`npm test`).
2. Suíte End-to-End passa (`npm run test:e2e`).
3. Checagem estática não retorna erros: `npx tsc --noEmit` sai com **código 0**.
4. Linter passa sem violações: `npm run lint`.