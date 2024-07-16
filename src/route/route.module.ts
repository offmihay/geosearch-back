import { Module } from '@nestjs/common';
import { RouteController } from './route.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Route, RouteSchema } from './schemas/route.schema';
import { PlaceModule } from '../place/place.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Route.name, schema: RouteSchema }]),
    PlaceModule,
  ],
  controllers: [RouteController],
})
export class RouteModule {}
