import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
    return this.placeService.getPlaces(user);
  }

  @Get('/done')
  async getDonePlaces(@Req() req) {
    const user = req.user as User;
    return this.placeService.getDonePlaces(user);
  }

  @Roles(Role.Admin)
  @Post('/stats')
  async getStats(@Body() body: { daterange: [Date, Date] }) {
    return this.placeService.getStats(body.daterange);
  }

  @Patch(':id')
  async patchPlace(@Param('id') id: string, @Body() placeData: Place) {
    return this.placeService.patchPlace(id, placeData);
  }

  @Get(':place_id')
  async getPlaceById(@Param('place_id') placeId: string) {
    return this.placeService.getPlaceById(placeId);
  }

  @Roles(Role.Admin)
  @Post()
  async createPlace(@Body() placesData: Place | Place[]) {
    return this.placeService.createPlace(placesData);
  }

  @Post('/update-status')
  async updatePlaceStatus(
    @Req() req,
    @Body('place_id') placeId: string,
    @Body('place_status') placeStatus: PlaceStatus,
  ) {
    const user = req.user as User;
    return this.placeService.updatePlaceStatus(placeId, placeStatus, user);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  async deletePlace(@Param('id') id: string) {
    return this.placeService.deletePlace(id);
  }
}
