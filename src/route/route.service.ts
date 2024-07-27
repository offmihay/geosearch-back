import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Route, RouteDocument } from './schemas/route.schema';
import { Place, PlaceDocument } from 'src/place/schemas/place.schema';
import { User } from 'src/user/schemas/user.schema';
import { CreateRouteDto } from './dto/create-route.dto';

@Injectable()
export class RouteService {
  constructor(
    @InjectModel(Place.name) private placeModel: Model<PlaceDocument>,
    @InjectModel(Route.name) private routeModel: Model<RouteDocument>,
  ) {}

  async getRoutes(filter: {} | { user: mongoose.Types.ObjectId }) {
    const routes = await this.routeModel.find(filter).exec();
    const routesWithStatus = await Promise.all(
      routes.map(async (route) => {
        const places = await this.placeModel
          .find({
            place_id: { $in: route.places_id_set },
          })
          .exec();

        const totalPlaces = places.length;
        const doneNotExistPlaces = places.filter(
          (place) =>
            place.place_status === 'DONE' || place.place_status === 'NOT_EXIST',
        ).length;
        const donePlaces = places.filter(
          (place) => place.place_status === 'DONE',
        ).length;
        const routeStatusPercentage =
          totalPlaces > 0 ? (doneNotExistPlaces / totalPlaces) * 100 : 0;

        // Set is_active to false if routeStatusPercentage is 100
        if (routeStatusPercentage === 100) {
          route.is_active = false;
          await route.save(); // Save the updated route to the database
        }

        return {
          ...route.toObject(),
          route_status_percentage: routeStatusPercentage.toFixed(0),
          routes_done: donePlaces,
        };
      }),
    );
    return routesWithStatus;
  }

  async createRoute(routeData: CreateRouteDto, user: User) {
    // Validate that no place has place_status set to 'DONE'
    const places = await this.placeModel.find({
      place_id: { $in: routeData.places_id_set },
    });
    const invalidPlaces = places.filter(
      (place) => place.place_status === 'DONE',
    );
    if (invalidPlaces.length > 0) {
      throw new BadRequestException(
        `Places with IDs ${invalidPlaces.map((place) => place.place_id).join(', ')} have a status of DONE and cannot be used.`,
      );
    }

    const route = new this.routeModel({
      name: routeData.name,
      img_url: routeData.img_url,
      user: user._id,
      places_id_set: routeData.places_id_set,
    });

    route.save();

    await this.placeModel.updateMany(
      { place_id: { $in: route.places_id_set } },
      {
        $set: {
          place_status: 'PROGRESSING',
          user: user._id,
        },
      },
    );

    return route;
  }

  async deleteRoute(id: string) {
    const route = await this.routeModel.findById(id).exec();
    if (!route) {
      throw new BadRequestException(`Route with ID ${id} not found.`);
    }

    await this.placeModel.updateMany(
      {
        place_id: { $in: route.places_id_set },
        place_status: { $in: ['PROGRESSING', 'SKIP'] },
      },
      { $set: { place_status: 'TO_DO', user: undefined, skipped_count: 0 } },
    );

    await route.deleteOne();

    return { message: 'Route deleted successfully' };
  }

  async deactivateRoute(id: string) {
    const route = await this.routeModel.findById(id).exec();

    route.is_active = false;
    await route.save();

    await this.placeModel.updateMany(
      {
        place_id: { $in: route.places_id_set },
        place_status: { $in: ['PROGRESSING', 'SKIP'] },
      },
      { $set: { place_status: 'TO_DO', user: null, skipped_count: 0 } },
    );

    return { message: 'Route deactivated and places updated successfully' };
  }

  async getCurrPlace(id: string) {
    const route = await this.routeModel.findById(id).exec();

    const placesProgressing = await this.placeModel
      .find({
        place_id: { $in: route.places_id_set },
        place_status: { $in: ['PROGRESSING'] },
      })
      .exec();

    const placeMapProgressing = new Map();
    placesProgressing.forEach((place) => {
      placeMapProgressing.set(place.place_id, place);
    });
    const sortedPlacesProgressing = route.places_id_set
      .map((placeId) => placeMapProgressing.get(placeId))
      .filter((place) => place !== undefined);

    const placesSkip = await this.placeModel
      .find({
        place_id: { $in: route.places_id_set },
        place_status: { $in: ['SKIP'] },
      })
      .exec();

    const placeMapSkip = new Map();
    placesSkip.forEach((place) => {
      placeMapSkip.set(place.place_id, place);
    });
    const sortedPlacesSkip = route.places_id_set
      .map((placeId) => placeMapSkip.get(placeId))
      .filter((place) => place !== undefined);

    if (sortedPlacesProgressing.length != 0) {
      return { isEmpty: false, place: sortedPlacesProgressing[0] };
    } else if (sortedPlacesSkip.length != 1) {
      const smallestSkipCountPlace = sortedPlacesSkip.reduce((min, current) => {
        return current.skipped_count < min.skipped_count ? current : min;
      });
      return { isEmpty: false, place: smallestSkipCountPlace };
    }

    return { isEmpty: true };
  }
}
