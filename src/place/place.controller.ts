import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Place, PlaceDocument, PlaceStatus } from './schemas/place.schema';

@Controller('places')
export class PlaceController {
  constructor(
    @InjectModel(Place.name) private PlaceModel: Model<PlaceDocument>,
  ) {}

  @Get()
  async getPlaces() {
    try {
      const places = await this.PlaceModel.find(
        { business_status: 'OPERATIONAL' },
        'place_id lat lng place_status',
      ).exec();
      return places;
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get(':place_id')
  async getPlaceById(@Param('place_id') placeId: string) {
    const place = await this.PlaceModel.findOne({ place_id: placeId }).exec();
    if (!place) {
      throw new BadRequestException(
        `Place with place_id ${placeId} not found.`,
      );
    }
    return place;
  }

  @Post()
  async createPlace(@Body() placesData: Place | Place[]) {
    const places = Array.isArray(placesData) ? placesData : [placesData];

    const operations = places.map((place) => ({
      updateOne: {
        filter: { place_id: place.place_id },
        update: { $setOnInsert: place },
        upsert: true,
      },
    }));

    try {
      const result = await this.PlaceModel.bulkWrite(operations);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/update-status')
  async updatePlaceStatus(
    @Body('place_id') placeId: string,
    @Body('place_status')
    placeStatus: PlaceStatus,
  ) {
    const place = await this.PlaceModel.findOne({ place_id: placeId }).exec();
    if (!place) {
      throw new BadRequestException(
        `Place with place_id ${placeId} not found.`,
      );
    }

    place.place_status = placeStatus;

    if (placeStatus !== 'PROGRESSING' && placeStatus !== 'TO_DO') {
      place.done_at = new Date();
    } else {
      place.done_at = null;
    }

    try {
      await place.save();
      return { success: true, place };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Delete(':id')
  async deletePlace(@Param('id') id: string) {
    const result = await this.PlaceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new BadRequestException(`Place with ID ${id} not found.`);
    }
    return { message: 'Place deleted successfully' };
  }
}
