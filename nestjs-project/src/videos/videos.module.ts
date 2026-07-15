import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Video } from './entities/video.entity';
import { StorageService } from './storage/storage.service';
import { QueueService } from './queue/queue.service';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    BullModule.registerQueue({
      name: 'video-processing',
    }),
  ],
  controllers: [VideosController],
  providers: [StorageService, QueueService, VideosService],
  exports: [StorageService, QueueService, VideosService, TypeOrmModule],
})
export class VideosModule {}
