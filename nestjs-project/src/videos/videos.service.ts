import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoStatus } from './entities/video.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { StorageService } from './storage/storage.service';
import { QueueService } from './queue/queue.service';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    private storageService: StorageService,
    private queueService: QueueService,
  ) {}

  async findOne(id: string) {
    const video = await this.videoRepository.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException('Vídeo não encontrado');
    }
    return video;
  }

  async getVideoStream(
    id: string,
  ): Promise<{ stream: Readable; contentType: string }> {
    const video = await this.findOne(id);

    // Obtém o stream do MinIO utilizando o StorageService diretamente
    const response = await this.storageService.getS3Client().send(
      new GetObjectCommand({
        Bucket: 'streamtube-videos',
        Key: video.videoStorageKey,
      }),
    );

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType || 'video/mp4',
    };
  }

  async create(createVideoDto: CreateVideoDto) {
    const { title, description, channelId } = createVideoDto;

    // Geração simplificada de um slug amigável e único
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${randomSuffix}`;

    const video = this.videoRepository.create({
      title,
      description,
      channelId,
      status: VideoStatus.DRAFT,
      uniqueUrlSlug: slug,
    });

    const savedVideo = await this.videoRepository.save(video);

    // Gera a chave de armazenamento que será usada no MinIO
    const videoStorageKey = `raw/${savedVideo.id}-${slug}.mp4`;
    savedVideo.videoStorageKey = videoStorageKey;
    await this.videoRepository.save(savedVideo);

    // Solicita ao StorageService a URL de upload simulada para esta etapa
    const uploadUrl =
      await this.storageService.getPresignedUploadUrl(videoStorageKey);

    return {
      video: savedVideo,
      uploadUrl,
    };
  }

  async processUpload(id: string) {
    const video = await this.videoRepository.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException('Vídeo não encontrado');
    }

    // Atualiza o estado do vídeo no pipeline para PROCESSANDO
    video.status = VideoStatus.PROCESSING;
    await this.videoRepository.save(video);

    // Despacha o Job assíncrono para a fila do Redis (BullMQ)
    await this.queueService.addVideoProcessJob(video.id, video.videoStorageKey);

    return {
      message:
        'Upload simulado com sucesso. Vídeo enviado para a fila de processamento.',
      status: video.status,
    };
  }
}
