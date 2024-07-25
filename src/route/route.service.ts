import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Route, RouteDocument } from './schemas/route.schema';
import { Place, PlaceDocument } from 'src/place/schemas/place.schema';
import { User } from 'src/user/schemas/user.schema';

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

  async createRoute(routeData: Route | Route[], user: User) {
    const routes = Array.isArray(routeData) ? routeData : [routeData];

    // Validate that no place has place_status set to 'DONE'
    for (const route of routes) {
      const places = await this.placeModel
        .find({
          place_id: { $in: route.places_id_set },
        })
        .exec();
      const invalidPlaces = places.filter(
        (place) => place.place_status === 'DONE',
      );
      if (invalidPlaces.length > 0) {
        throw new BadRequestException(
          `Places with IDs ${invalidPlaces.map((place) => place.place_id).join(', ')} have a status of DONE and cannot be used.`,
        );
      }
    }

    // Create new routes
    const newRoutes = routes.map((route) => {
      route.user = user;
      return new this.routeModel(route);
    });
    const result = await this.routeModel.insertMany(newRoutes);

    // Update place_status to PROGRESSING for the places in places_id_set
    for (const route of routes) {
      await this.placeModel.updateMany(
        { place_id: { $in: route.places_id_set } },
        { $set: { place_status: 'PROGRESSING', user } },
      );
    }

    return result;
  }

  async deleteRoute(id: string) {
    const route = await this.routeModel.findById(id).exec();
    if (!route) {
      throw new BadRequestException(`Route with ID ${id} not found.`);
    }

    await this.placeModel.updateMany(
      { place_id: { $in: route.places_id_set }, place_status: 'PROGRESSING' },
      { $set: { place_status: 'TO_DO' } },
    );

    await route.deleteOne();

    return { message: 'Route deleted successfully' };
  }

  async deactivateRoute(id: string) {
    const route = await this.routeModel.findById(id).exec();

    route.is_active = false;
    await route.save();

    await this.placeModel.updateMany(
      { place_id: { $in: route.places_id_set }, place_status: 'PROGRESSING' },
      { $set: { place_status: 'TO_DO' } },
    );

    return { message: 'Route deactivated and places updated successfully' };
  }

  async getCurrPlace(id: string) {
    const route = await this.routeModel.findById(id).exec();

    for (const placeId of route.places_id_set) {
      const place = await this.placeModel
        .findOne({
          place_id: placeId,
          place_status: 'PROGRESSING',
        })
        .exec();

      if (place) {
        return { isEmpty: false, place };
      }
    }

    return { isEmpty: true };
  }
}
