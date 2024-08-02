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

  async getDonePlaces(user: User) {
    const matchStage = {
      place_status: { $in: [PlaceStatus.DONE, PlaceStatus.NOT_EXIST] },
    };

    if (!user.admin_preferences.show_all_places) {
      matchStage['user_done'] = user._id;
    }

    return await this.placeModel
      .aggregate([
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user_info',
          },
        },
        { $unwind: '$user_info' },
        {
          $project: {
            place_id: 1,
            display_name: 1,
            done_at: 1,
            google_maps_URI: 1,
            city: 1,
            username: '$user_info.username',
            place_status: 1,
            updated_at: 1,
          },
        },
      ])
      .exec();
  }

  async getStats(daterange: [Date, Date]) {
    console.log(daterange);
    const matchStage = {
      place_status: { $in: [PlaceStatus.DONE, PlaceStatus.NOT_EXIST] },
      done_at: { $gte: new Date(daterange[0]), $lt: new Date(daterange[1]) },
    };

    const values = await this.placeModel
      .aggregate([
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_done',
            foreignField: '_id',
            as: 'user_info',
          },
        },
        { $unwind: '$user_info' },
        {
          $project: {
            place_id: 1,
            username: '$user_info.username',
            place_status: 1,
          },
        },
      ])
      .exec();

    const result = Object.values(
      values.reduce((acc, { username, place_status }) => {
        if (!acc[username]) {
          acc[username] = { username, not_exist: 0, done: 0, total: 0 };
        }
        acc[username].total += 1;
        if (place_status === 'DONE') {
          acc[username].done += 1;
        } else if (place_status === 'NOT_EXIST') {
          acc[username].not_exist += 1;
        }
        return acc;
      }, {}),
    );

    return result;
  }

  async patchPlace(id: string, placeData: Place) {
    const place = await this.placeModel.findByIdAndUpdate(id, placeData).exec();
    if (!place) {
      throw new BadRequestException(`Place with id ${id} not found.`);
    }
    return await this.placeModel.findById(id);
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

    if (
      placeStatus == PlaceStatus.DONE ||
      placeStatus == PlaceStatus.NOT_EXIST
    ) {
      place.done_at = new Date();
      place.user_done = user;
    }
    if (placeStatus == PlaceStatus.SKIP) {
      if (place.skipped_count) {
        place.skipped_count++;
      } else {
        place.skipped_count = 1;
      }
    } else {
      place.skipped_count = 0;
    }
    try {
      await place.save();
      return await this.placeModel.findOne({ place_id: placeId }).exec();
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

  async updateLocations() {
    const places = await this.placeModel.find({});

    for (const place of places) {
      const { lat, lng } = place;
      if (lat && lng) {
        place.location = {
          type: 'Point',
          coordinates: [lng, lat],
        };
        await place.save();
      }
    }
  }
}
