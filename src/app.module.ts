import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Location, LocationSchema } from './schemas/location.schema';
import mongoose from 'mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URL),
    MongooseModule.forFeature([
      { name: Location.name, schema: LocationSchema },
    ]),
  ],
  controllers: [AppController],
})
export class AppModule {
  constructor() {
    mongoose.set('debug', true);
  }
}
