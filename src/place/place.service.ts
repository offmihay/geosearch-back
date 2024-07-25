import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Place, PlaceDocument, PlaceStatus } from './schemas/place.schema';
import { User } from 'src/user/schemas/user.schema';

@Injectable()
export class PlaceService {
  constructor(
    @InjectModel(Place.name) private placeModel: Model<PlaceDocument>,
  ) {}

  async getPlaces(user: User) {
    const placeStatus_filter = user.preferences.show_done_places
      ? Object.keys(PlaceStatus)
      : [PlaceStatus.TO_DO];
    try {
      return await this.placeModel
        .find(
          {
            business_status: 'OPERATIONAL',
            region: { $in: user.preferences.regions },
            place_status: { $in: placeStatus_filter },
          },
          'place_id lat lng place_status',
        )
        .exec();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getPlaceById(placeId: string) {
    const place = await this.placeModel.findOne({ place_id: placeId }).exec();
    if (!place) {
      throw new BadRequestException(
        `Place with place_id ${placeId} not found.`,
      );
    }
    return place;
  }

  async createPlace(placesData: Place | Place[]) {
    const places = Array.isArray(placesData) ? placesData : [placesData];

    const operations = places.map((place) => ({
      updateOne: {
        filter: { place_id: place.place_id },
        update: { $setOnInsert: place },
        upsert: true,
      },
    }));

    try {
      return await this.placeModel.bulkWrite(operations);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updatePlaceStatus(
    placeId: string,
    placeStatus: PlaceStatus,
    user: User,
  ) {
    const place = await this.placeModel.findOne({ place_id: placeId }).exec();
    if (!place) {
      throw new BadRequestException(
        `Place with place_id ${placeId} not found.`,
      );
    }

    place.place_status = placeStatus;

    if (placeStatus !== 'PROGRESSING' && placeStatus !== 'TO_DO') {
      place.done_at = new Date();
      place.user_done = user;
    } else {
      place.done_at = null;
    }

    try {
      await place.save();
      return place;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deletePlace(id: string) {
    const result = await this.placeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new BadRequestException(`Place with ID ${id} not found.`);
    }
    return { message: 'Place deleted successfully' };
  }
}
