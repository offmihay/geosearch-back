import { Module } from '@nestjs/common';
import { PlaceController } from './place.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Place, PlaceSchema } from './schemas/place.schema';
import { AuthModule } from '../auth/auth.module';
import { PlaceService } from './place.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Place.name, schema: PlaceSchema }]),
  ],
  controllers: [PlaceController],
  exports: [MongooseModule],
  providers: [PlaceService],
})
export class PlaceModule {}
