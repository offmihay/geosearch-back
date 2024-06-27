import { Body, Controller, Get, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Location } from './schemas/location.schema';
import { Model } from 'mongoose';

@Controller()
export class AppController {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<Location>,
  ) {}

  @Get('/locations')
  getLocations() {
    const query = this.locationModel.find();
    return query.exec();
  }

  @Post('/locations')
  async createLocation(@Body() locations: Location[]) {
    const operations = locations.map((location) => ({
      updateOne: {
        filter: { place_id: location.place_id },
        update: { $set: location },
        upsert: true,
      },
    }));

    return await this.locationModel.bulkWrite(operations);
  }
}
