import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Place, PlaceSchema } from './schemas/place.schema';
import { Route, RouteSchema } from './schemas/route.schema';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URL),
    MongooseModule.forFeature([{ name: Place.name, schema: PlaceSchema }]),
    MongooseModule.forFeature([{ name: Route.name, schema: RouteSchema }]),
  ],
  controllers: [AppController],
})
export class AppModule {
  constructor() {
    mongoose.set('debug', true);
  }
}
