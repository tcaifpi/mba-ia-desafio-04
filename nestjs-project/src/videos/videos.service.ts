import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoStatus } from './entities/video.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { StorageService } from './storage/storage.service';
import { QueueService } from './queue/queue.service';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly storageService: StorageService,
    private readonly queueService: QueueService,
  ) {}

  async create(createVideoDto: CreateVideoDto) {
    const uniqueUrlSlug = `${createVideoDto.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
    const video = this.videoRepository.create({
      ...createVideoDto,
      status: VideoStatus.DRAFT,
      uniqueUrlSlug,
    });

    const savedVideo = await this.videoRepository.save(video);
    const videoStorageKey = `raw/${savedVideo.id}-${savedVideo.uniqueUrlSlug}.mp4`;
    savedVideo.videoStorageKey = videoStorageKey;
    await this.videoRepository.save(savedVideo);

    const uploadUrl =
      await this.storageService.generateUploadUrl(videoStorageKey);

    return {
      video: savedVideo,
      uploadUrl,
    };
  }

  async processUpload(id: string) {
    const video = await this.findOne(id);
    if (!video.videoStorageKey) {
      throw new NotFoundException(
        'Vídeo não possui chave de armazenamento válida.',
      );
    }

    video.status = VideoStatus.PROCESSING;
    await this.videoRepository.save(video);

    await this.queueService.addVideoProcessJob({
      videoId: video.id,
      videoStorageKey: video.videoStorageKey,
    });

    return {
      message:
        'Upload simulado com sucesso. Vídeo enviado para a fila de processamento.',
      status: 'processing',
    };
  }

  async findOne(id: string): Promise<Video> {
    const video = await this.videoRepository.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Vídeo com ID ${id} não encontrado.`);
    }
    return video;
  }

  async getVideoStream(id: string, range?: string) {
    const video = await this.findOne(id);
    if (!video.videoStorageKey) {
      throw new NotFoundException('Vídeo ainda não possui arquivo de mídia.');
    }
    return this.storageService.getObjectStream(video.videoStorageKey, range);
  }
}
