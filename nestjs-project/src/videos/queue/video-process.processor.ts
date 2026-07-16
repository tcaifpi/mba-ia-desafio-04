import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoStatus } from '../entities/video.entity';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

@Injectable()
@Processor('video-processing')
export class VideoProcessProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessProcessor.name);
  private s3Client: S3Client;
  private bucketName = 'streamtube-videos';

  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
  ) {
    super();
    this.s3Client = new S3Client({
      endpoint: 'http://storage:9000',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'streamtube_admin',
        secretAccessKey: 'streamtube_password',
      },
      forcePathStyle: true,
    });
  }

  async process(
    job: Job<{ videoId: string; videoStorageKey: string }>,
  ): Promise<any> {
    const { videoId, videoStorageKey } = job.data;
    this.logger.log(`Iniciando processamento do vídeo: ${videoId}`);

    const video = await this.videoRepository.findOne({
      where: { id: videoId },
    });
    if (!video) {
      throw new Error(`Vídeo com id ${videoId} não encontrado no banco.`);
    }

    const tempDir = path.join(__dirname, '..', '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempVideoPath = path.join(tempDir, `${videoId}.mp4`);
    const tempThumbPath = path.join(tempDir, `${videoId}-thumb.png`);

    try {
      // 1. Baixar o arquivo de vídeo do MinIO (S3) para um arquivo temporário local
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: videoStorageKey,
        }),
      );

      const writeStream = fs.createWriteStream(tempVideoPath);
      await new Promise<void>((resolve, reject) => {
        (response.Body as Readable)
          .pipe(writeStream)
          .on('finish', () => resolve())
          .on('error', (err) =>
            reject(err instanceof Error ? err : new Error(String(err))),
          );
      });

      // 2. Extrair metadados e duração usando FFmpeg
      const duration: number = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tempVideoPath, (err, metadata) => {
          if (err)
            return reject(err instanceof Error ? err : new Error(String(err)));
          resolve(metadata.format.duration || 0);
        });
      });

      // 3. Extrair Thumbnail do primeiro frame do vídeo
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .screenshots({
            timestamps: [1], // pega frame do segundo 1
            filename: path.basename(tempThumbPath),
            folder: path.dirname(tempThumbPath),
            size: '320x240',
          })
          .on('end', () => resolve())
          .on('error', (err) =>
            reject(err instanceof Error ? err : new Error(String(err))),
          );
      });

      // 4. Fazer upload do thumbnail de volta para o MinIO
      const thumbnailStorageKey = `thumbnails/${videoId}.png`;
      const thumbFileStream = fs.createReadStream(tempThumbPath);

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: thumbnailStorageKey,
          Body: thumbFileStream,
          ContentType: 'image/png',
        }),
      );

      // 5. Atualizar registro do banco de dados
      video.status = VideoStatus.READY;
      video.duration = Math.round(duration);
      video.thumbnailStorageKey = thumbnailStorageKey;
      await this.videoRepository.save(video);

      this.logger.log(
        `Vídeo ${videoId} processado com sucesso. Duração: ${video.duration}s`,
      );
    } catch (error) {
      this.logger.error(`Falha ao processar o vídeo ${videoId}`, error);
      video.status = VideoStatus.ERROR;
      await this.videoRepository.save(video);
      throw error;
    } finally {
      // Limpeza dos arquivos temporários
      if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
      if (fs.existsSync(tempThumbPath)) fs.unlinkSync(tempThumbPath);
    }
  }
}
