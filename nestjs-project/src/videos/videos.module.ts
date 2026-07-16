import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { Video } from './entities/video.entity';
import { StorageService } from './storage/storage.service';
import { QueueService } from './queue/queue.service';
import { VideoProcessProcessor } from './queue/video-process.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    BullModule.registerQueue({
      name: 'video-processing',
    }),
  ],
  controllers: [VideosController],
  providers: [
    VideosService,
    StorageService,
    QueueService,
    VideoProcessProcessor,
  ],
  exports: [VideosService],
})
export class VideosModule {}
