import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Route, RouteDocument } from './schemas/route.schema';
import {
  Place,
  PlaceDocument,
  PlaceStatus,
} from 'src/place/schemas/place.schema';
import { User } from 'src/user/schemas/user.schema';
import { CreateRouteDto } from './dto/create-route.dto';

@Injectable()
export class RouteService {
  constructor(
    @InjectModel(Place.name) private placeModel: Model<PlaceDocument>,
    @InjectModel(Route.name) private routeModel: Model<RouteDocument>,
  ) {}

  async getRoutes(filter: {} | { user: mongoose.Types.ObjectId }) {
    const routes = await this.routeModel
      .find({ ...filter, deleted: undefined })
      .exec();
    const routesWithStatus = await Promise.all(
      routes.map(async (route) => {
        if (route.is_active) {
          const places = await this.placeModel
            .find({
              place_id: { $in: route.places_id_set },
            })
            .exec();

          const totalPlaces = places.length;
          const doneNotExistPlaces = places.filter(
            (place) =>
              place.place_status === PlaceStatus.DONE ||
              place.place_status === PlaceStatus.NOT_EXIST,
          ).length;
          const donePlaces = places.filter(
            (place) => place.place_status === PlaceStatus.DONE,
          ).length;
          const routeStatusPercentage =
            totalPlaces > 0 ? (doneNotExistPlaces / totalPlaces) * 100 : 0;

          route.route_status_percentage = routeStatusPercentage.toFixed(0);
          route.routes_done = donePlaces;

          if (routeStatusPercentage === 100) {
            route.is_active = false;
          }

          await route.save();
          return route;
        } else {
          return route;
        }
      }),
    );
    return routesWithStatus;
  }

  async createRoute(routeData: CreateRouteDto, user: User) {
    const places = await this.placeModel.find({
      place_id: { $in: routeData.places_id_set },
    });
    const invalidPlaces = places.filter(
      (place) => place.place_status === PlaceStatus.DONE,
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
          place_status: PlaceStatus.PROGRESSING,
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
        place_status: { $in: [PlaceStatus.PROGRESSING, PlaceStatus.SKIP] },
      },
      {
        $set: {
          place_status: PlaceStatus.TO_DO,
          user: undefined,
          skipped_count: 0,
        },
      },
    );

    route.deleted = new Date();
    route.is_active = false;
    await route.save();

    return { message: 'Route deleted successfully' };
  }

  async deactivateRoute(id: string) {
    const route = await this.routeModel.findById(id).exec();

    route.is_active = false;
    await route.save();

    await this.placeModel.updateMany(
      {
        place_id: { $in: route.places_id_set },
        place_status: { $in: [PlaceStatus.PROGRESSING, PlaceStatus.SKIP] },
      },
      {
        $set: { place_status: PlaceStatus.TO_DO, user: null, skipped_count: 0 },
      },
    );

    return { message: 'Route deactivated and places updated successfully' };
  }

  async getCurrPlace(id: string, nearest: boolean, lat: number, lng: number) {
    const route = await this.routeModel.findById(id).exec();
    if (!nearest) {
      const placesProgressing = await this.placeModel
        .find({
          place_id: { $in: route.places_id_set },
          place_status: { $in: [PlaceStatus.PROGRESSING] },
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
          place_status: { $in: [PlaceStatus.SKIP] },
        })
        .exec();

      const placeMapSkip = new Map();
      placesSkip.forEach((place) => {
        placeMapSkip.set(place.place_id, place);
      });
      const sortedPlacesSkip = route.places_id_set
        .map((placeId) => placeMapSkip.get(placeId))
        .filter((place) => place !== undefined);

      console.log(sortedPlacesSkip);
      if (sortedPlacesProgressing.length != 0) {
        return { isEmpty: false, place: sortedPlacesProgressing[0] };
      } else if (sortedPlacesSkip.length != 1 && sortedPlacesSkip.length != 0) {
        const smallestSkipCountPlace = sortedPlacesSkip.reduce(
          (min, current) => {
            return current.skipped_count < min.skipped_count ? current : min;
          },
        );
        return { isEmpty: false, place: smallestSkipCountPlace };
      } else if (sortedPlacesSkip.length == 1) {
        return { isEmpty: false, place: sortedPlacesSkip[0] };
      }

      return { isEmpty: true };
    } else {
      const nearestPlace = await this.placeModel
        .findOne({
          place_id: { $in: route.places_id_set },
          place_status: { $in: [PlaceStatus.PROGRESSING] },
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat],
              },
            },
          },
        })
        .exec();

      if (nearestPlace) {
        return { isEmpty: false, place: nearestPlace };
      } else {
        const nearestPlaces = await this.placeModel.find({
          place_id: { $in: route.places_id_set },
          place_status: { $in: [PlaceStatus.SKIP] },
        });
        const skippedCount = nearestPlaces
          .map((place) => place.skipped_count)
          .sort((a, b) => a - b)[0];

        const nearestPlaceSkip = await this.placeModel
          .findOne({
            skipped_count: skippedCount,
            location: {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: [lng, lat],
                },
              },
            },
          })
          .exec();
        if (nearestPlaceSkip) {
          return { isEmpty: false, place: nearestPlaceSkip };
        } else {
          return { isEmpty: true };
        }
      }
    }
  }
}
