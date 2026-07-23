import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { Response } from 'express';
import { Readable } from 'stream';

describe('VideosController', () => {
  let controller: VideosController;

  const mockVideosService = {
    create: jest.fn(),
    processUpload: jest.fn(),
    getVideoStream: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        {
          provide: VideosService,
          useValue: mockVideosService,
        },
      ],
    }).compile();

    controller = module.get<VideosController>(VideosController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create (Upload)', () => {
    it('deve criar um vídeo e retornar a URL de upload', async () => {
      const dto = {
        title: 'Test Video',
        description: 'Desc',
        channelId: '00000000-0000-0000-0000-000000000001',
      };
      const result = {
        video: { id: 'uuid-123' },
        uploadUrl: 'http://s3/upload',
      };
      mockVideosService.create.mockResolvedValue(result);

      expect(await controller.create(dto)).toEqual(result);
    });
  });

  describe('process (Processamento)', () => {
    it('deve enviar o vídeo para a fila de processamento', async () => {
      const result = {
        message:
          'Upload simulado com sucesso. Vídeo enviado para a fila de processamento.',
        status: 'processing',
      };
      mockVideosService.processUpload.mockResolvedValue(result);

      expect(await controller.process('uuid-123')).toEqual(result);
    });
  });

  describe('stream (Streaming com Range/206)', () => {
    it('deve responder com status 206 Partial Content quando o header Range for enviado', async () => {
      const mockStream = new Readable();
      mockStream._read = () => {};

      const mockStatus = jest.fn();
      const mockSetHeader = jest.fn();
      const mockEnd = jest.fn();

      const res = {
        status: mockStatus,
        setHeader: mockSetHeader,
        end: mockEnd,
      } as unknown as Response;

      jest
        .spyOn(mockStream, 'pipe')
        .mockReturnValue(res as unknown as NodeJS.WritableStream);

      mockVideosService.getVideoStream.mockResolvedValue({
        stream: mockStream,
        contentType: 'video/mp4',
        fileSize: 1000,
      });

      mockStatus.mockImplementation(() => res);

      await controller.stream('uuid-123', 'bytes=0-499', res);

      expect(mockStatus).toHaveBeenCalledWith(206);
      expect(mockSetHeader).toHaveBeenCalledWith(
        'Content-Range',
        'bytes 0-499/1000',
      );
    });
  });
});
