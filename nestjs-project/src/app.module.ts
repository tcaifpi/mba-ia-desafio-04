import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import { VideosModule } from './videos/videos.module';

@Module({
  imports: [
    // 1. Inicializa o módulo de configuração globalmente
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: '.env',
    }),

    // 2. Conectando de forma assíncrona e segura ao PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'db',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'streamtube_user',
        password: configService.get<string>('DB_PASSWORD') || 'streamtube_password',
        database: configService.get<string>('DB_DATABASE') || 'streamtube',
        autoLoadEntities: true,
        synchronize: true, // Ideal para ambiente de desenvolvimento
      }),
    }),

    // 3. Configura a fila (Redis)
    BullModule.forRoot({
      connection: {
        host: 'queue',
        port: 6379,
      },
    }),

    // 4. Seus módulos de negócio
    VideosModule,
  ],
})
export class AppModule {}