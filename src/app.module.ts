import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { RouteModule } from './route/route.module';
import { PlaceModule } from './place/place.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URL),
    RouteModule,
    PlaceModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {
  constructor() {
    mongoose.set('debug', true);
  }
}
