import { Controller, Post, Body, Param, Put } from '@nestjs/common';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  create(@Body() createVideoDto: CreateVideoDto) {
    return this.videosService.create(createVideoDto);
  }

  @Put(':id/upload')
  upload(@Param('id') id: string) {
    return this.videosService.processUpload(id);
  }
}
