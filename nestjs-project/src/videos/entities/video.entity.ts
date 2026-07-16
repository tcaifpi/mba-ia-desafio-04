import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VideoStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
}

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'channel_id', type: 'uuid' })
  channelId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: VideoStatus,
    default: VideoStatus.DRAFT,
  })
  status: VideoStatus;

  @Column({
    name: 'video_storage_key',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  videoStorageKey: string;

  @Column({
    name: 'thumbnail_storage_key',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  thumbnailStorageKey: string;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Index({ unique: true })
  @Column({ name: 'unique_url_slug', type: 'varchar', length: 100 })
  uniqueUrlSlug: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
