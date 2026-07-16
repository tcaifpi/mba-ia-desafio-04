import { Controller, Get, Post, Body, Param, Res } from '@nestjs/common';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import type { Response } from 'express';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // Rota para CRIAR o vídeo
  @Post()
  async create(@Body() createVideoDto: CreateVideoDto) {
    return this.videosService.create(createVideoDto);
  }

  // Rota para PROCESSAR o vídeo (disparar a fila)
  @Post(':id/process')
  async process(@Param('id') id: string) {
    return this.videosService.processUpload(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Get(':id/stream')
  async stream(@Param('id') id: string, @Res() res: Response) {
    const { stream, contentType } = await this.videosService.getVideoStream(id);
    res.setHeader('Content-Type', contentType);
    stream.pipe(res);
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
    stream.pipe(res);
  }
}