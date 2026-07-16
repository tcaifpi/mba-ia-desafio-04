import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName = 'streamtube-videos';

  constructor() {
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

  // Método Getter para expor o client ao VideosService
  getS3Client(): S3Client {
    return this.s3Client;
  }

  async onModuleInit() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
    } catch {
      await this.s3Client.send(
        new CreateBucketCommand({ Bucket: this.bucketName }),
      );
    }
  }

  async getPresignedUploadUrl(videoStorageKey: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: videoStorageKey,
    });

    const urlPromise = getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });
    return await urlPromise;
  }
}
