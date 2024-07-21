import { Module } from '@nestjs/common';
import { RouteController } from './route.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Route, RouteSchema } from './schemas/route.schema';
import { PlaceModule } from '../place/place.module';
import { AuthModule } from 'src/auth/auth.module';
import { RouteService } from './route.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Route.name, schema: RouteSchema }]),
    PlaceModule,
    AuthModule,
  ],
  controllers: [RouteController],
  providers: [RouteService],
})
export class RouteModule {}
