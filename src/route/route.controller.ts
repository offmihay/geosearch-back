import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enum/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RouteService } from './route.service';
import { User } from 'src/user/schemas/user.schema';
import { CheckRouteUserGuard } from './middlewares/check-route-user.guard';
import { CreateRouteDto } from './dto/create-route.dto';

@Controller('routes')
@UseGuards(AuthGuard(), RolesGuard)
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Get()
  async getUserRoutes(@Req() req) {
    const user: User = req.user;
    const filter = user.admin_preferences.show_all_routes
      ? {}
      : { user: user._id };
    return this.routeService.getRoutes(filter);
  }

  @Post()
  async createRoute(@Body() routeData: CreateRouteDto, @Req() req) {
    return this.routeService.createRoute(routeData, req.user);
  }

  @UseGuards(CheckRouteUserGuard)
  @Delete(':id')
  async deleteRoute(@Param('id') id: string) {
    return this.routeService.deleteRoute(id);
  }

  @UseGuards(CheckRouteUserGuard)
  @Patch(':id/deactivate')
  async deactivateRoute(@Param('id') id: string) {
    return this.routeService.deactivateRoute(id);
  }

  @UseGuards(CheckRouteUserGuard)
  @Get(':id/curr-place')
  async getCurrPlace(
    @Param('id') id: string,
    @Query() query: { nearest: boolean; lat: number; lng: number },
  ) {
    return this.routeService.getCurrPlace(
      id,
      query.nearest,
      query.lat,
      query.lng,
    );
  }
}
