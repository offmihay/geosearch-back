import { Module } from '@nestjs/common';
import { PlaceController } from './place.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Place, PlaceSchema } from './schemas/place.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Place.name, schema: PlaceSchema }]),
  ],
  controllers: [PlaceController],
  exports: [MongooseModule],
})
export class PlaceModule {}
