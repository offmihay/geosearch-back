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
    return this.locationModel.find().exec();
  }

  @Post('/locations')
  async createLocation(@Body() location: Location[]) {
    return await this.locationModel.create(location);
  }
}
