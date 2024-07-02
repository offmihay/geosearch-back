import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Place, PlaceDocument } from './schemas/place.schema';
import { Route, RouteDocument } from './schemas/route.schema';

@Controller()
export class AppController {
  constructor(
    @InjectModel(Place.name) private PlaceModel: Model<PlaceDocument>,
    @InjectModel(Route.name) private RouteModel: Model<RouteDocument>,
  ) {}

  @Get('/places')
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

  @Get('/places/:place_id')
  async getPlaceById(@Param('place_id') placeId: string) {
    const place = await this.PlaceModel.findOne({ place_id: placeId }).exec();
    if (!place) {
      throw new BadRequestException(
        `Place with place_id ${placeId} not found.`,
      );
    }
    return place;
  }

  @Post('places')
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

  @Post('/places/update-status')
  async updatePlaceStatus(
    @Body('place_id') placeId: string,
    @Body('place_status')
    placeStatus: 'TO_DO' | 'DONE' | 'PROGRESSING' | 'NOT_EXIST' | 'CLOSED',
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

  @Delete('/places/:id')
  async deletePlace(@Param('id') id: string) {
    const result = await this.PlaceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new BadRequestException(`Place with ID ${id} not found.`);
    }
    return { message: 'Place deleted successfully' };
  }

  @Get('/routes')
  async getRoutes() {
    const routes = await this.RouteModel.find().exec();
    const routesWithStatus = await Promise.all(
      routes.map(async (route) => {
        const places = await this.PlaceModel.find({
          place_id: { $in: route.places_id_set },
        }).exec();
        const totalPlaces = places.length;
        const donePlaces = places.filter(
          (place) => place.place_status === 'DONE',
        ).length;
        const routeStatusPercentage =
          totalPlaces > 0 ? (donePlaces / totalPlaces) * 100 : 0;

        // Set is_active to false if routeStatusPercentage is 100
        if (routeStatusPercentage === 100) {
          route.is_active = false;
          await route.save(); // Save the updated route to the database
        }

        return {
          ...route.toObject(),
          route_status_percentage: routeStatusPercentage.toFixed(0),
        };
      }),
    );
    return routesWithStatus;
  }

  @Post('/routes')
  async createRoute(@Body() routeData: Route | Route[]) {
    const routes = Array.isArray(routeData) ? routeData : [routeData];

    // Validate that no place has place_status set to 'DONE'
    for (const route of routes) {
      const places = await this.PlaceModel.find({
        place_id: { $in: route.places_id_set },
      }).exec();
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
    const newRoutes = routes.map((route) => new this.RouteModel(route));
    const result = await this.RouteModel.insertMany(newRoutes);

    // Update place_status to PROGRESSING for the places in places_id_set
    for (const route of routes) {
      await this.PlaceModel.updateMany(
        { place_id: { $in: route.places_id_set } },
        { $set: { place_status: 'PROGRESSING' } },
      );
    }

    return result;
  }

  @Delete('/routes/:id')
  async deleteRoute(@Param('id') id: string) {
    const result = await this.RouteModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new BadRequestException(`Route with ID ${id} not found.`);
    }
    return { message: 'Route deleted successfully' };
  }

  @Post('/routes/:id/deactivate')
  async deactivateRoute(@Param('id') id: string) {
    const route = await this.RouteModel.findById(id).exec();
    if (!route) {
      throw new BadRequestException(`Route with ID ${id} not found.`);
    }

    route.is_active = false;
    await route.save();

    await this.PlaceModel.updateMany(
      { place_id: { $in: route.places_id_set }, place_status: 'PROGRESSING' },
      { $set: { place_status: 'TO_DO' } },
    );

    return { message: 'Route deactivated and places updated successfully' };
  }

  @Get('/routes/:id/curr-place')
  async getCurrPlace(@Param('id') id: string) {
    const route = await this.RouteModel.findById(id).exec();
    if (!route) {
      throw new BadRequestException(`Route with ID ${id} not found.`);
    }

    for (const placeId of route.places_id_set) {
      const place = await this.PlaceModel.findOne({
        place_id: placeId,
        place_status: 'PROGRESSING',
      }).exec();

      if (place) {
        return { isEmpty: false, place };
      }
    }

    return { isEmpty: true };
  }
}
