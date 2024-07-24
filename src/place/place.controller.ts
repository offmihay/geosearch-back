import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/auth/enum/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PlaceService } from './place.service';
import { Place, PlaceStatus } from './schemas/place.schema';
import { User } from 'src/user/schemas/user.schema';

@Controller('places')
@UseGuards(AuthGuard(), RolesGuard)
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Get()
  async getPlaces(@Req() req) {
    const user = req.user as User;
    return this.placeService.getPlaces(user.preferences.regions);
  }

  @Get(':place_id')
  async getPlaceById(@Param('place_id') placeId: string) {
    return this.placeService.getPlaceById(placeId);
  }

  @Post()
  async createPlace(@Body() placesData: Place | Place[]) {
    return this.placeService.createPlace(placesData);
  }

  @Post('/update-status')
  async updatePlaceStatus(
    @Body('place_id') placeId: string,
    @Body('place_status') placeStatus: PlaceStatus,
  ) {
    return this.placeService.updatePlaceStatus(placeId, placeStatus);
  }

  @Delete(':id')
  async deletePlace(@Param('id') id: string) {
    return this.placeService.deletePlace(id);
  }
}
