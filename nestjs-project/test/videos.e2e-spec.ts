import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('VideosController (e2e)', () => {
  let app: INestApplication;
  let createdVideoId: string;
  const dummyChannelId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /videos - deve registrar um novo vídeo e retornar a presigned URL', async () => {
    const response = await request(app.getHttpServer())
      .post('/videos')
      .send({
        title: 'Vídeo Teste E2E',
        description: 'Descrição do vídeo e2e',
        channelId: dummyChannelId,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('uploadUrl');
    expect(response.body).toHaveProperty('video');
    expect(response.body.video).toHaveProperty('id');

    createdVideoId = response.body.video.id;
  });

  it('GET /videos/:id - deve retornar os detalhes do vídeo criado', async () => {
    expect(createdVideoId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/videos/${createdVideoId}`)
      .expect(200);

    expect(response.body.id).toBe(createdVideoId);
  });

  it('GET /videos/:id/stream - deve falhar ao tentar transmitir vídeo sem arquivo no storage', async () => {
    expect(createdVideoId).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/videos/${createdVideoId}/stream`)
      .set('Range', 'bytes=0-99');

    // Valida que não permite streaming sem a mídia estar disponível no S3
    expect([404, 500]).toContain(response.status);
  });

  it('GET /videos/99999999-9999-9999-9999-999999999999/stream - deve retornar 404 para vídeo inexistente', async () => {
    await request(app.getHttpServer())
      .get('/videos/99999999-9999-9999-9999-999999999999/stream')
      .set('Range', 'bytes=0-99')
      .expect(404);
  });
});