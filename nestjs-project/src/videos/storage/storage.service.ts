import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
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

  async generateUploadUrl(key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async getObjectStream(key: string, range?: string) {
    const headCommand = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const headData = await this.s3Client.send(headCommand);
    const fileSize = headData.ContentLength || 0;

    const getCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Range: range,
    });
    const response = await this.s3Client.send(getCommand);

    return {
      stream: response.Body,
      contentType: response.ContentType || 'video/mp4',
      fileSize,
    };
  }
}
