import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  Headers,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import type { Response } from 'express';
import { Readable } from 'stream';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  async create(@Body() createVideoDto: CreateVideoDto) {
    return this.videosService.create(createVideoDto);
  }

  @Post(':id/process')
  async process(@Param('id') id: string) {
    return this.videosService.processUpload(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Get(':id/stream')
  async stream(
    @Param('id') id: string,
    @Headers('range') range: string | undefined,
    @Res() res: Response,
  ) {
    const { stream, contentType, fileSize } =
      await this.videosService.getVideoStream(id, range);

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunksize);
      res.setHeader('Content-Type', contentType);
    } else {
      res.status(200);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', contentType);
    }

    if (stream && typeof (stream as Readable).pipe === 'function') {
      (stream as Readable).pipe(res);
    } else {
      res.end();
    }
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const video = await this.videosService.findOne(id);
    const { stream, contentType } = await this.videosService.getVideoStream(id);

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${video.uniqueUrlSlug}.mp4"`,
    );

    if (stream && typeof (stream as Readable).pipe === 'function') {
      (stream as Readable).pipe(res);
    } else {
      res.end();
    }
  }
}
