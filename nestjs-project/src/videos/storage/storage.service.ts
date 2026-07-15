import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

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

  async onModuleInit() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch (error) {
      await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
    }
  }

  async getPresignedUploadUrl(videoStorageKey: string): Promise<string> {
    return `http://localhost:9000/${this.bucketName}/${videoStorageKey}`;
  }
}
