import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(@InjectQueue('video-processing') private videoQueue: Queue) {}

  async addVideoProcessJob(videoId: string, videoStorageKey: string) {
    await this.videoQueue.add(
      'process-video',
      { videoId, videoStorageKey },
      {
        attempts: 3,
        backoff: 5000,
      },
    );
  }
}
