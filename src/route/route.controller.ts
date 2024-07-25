import {
  BadRequestException,
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
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enum/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RouteService } from './route.service';
import { Route } from './schemas/route.schema';
import { User } from 'src/user/schemas/user.schema';
import { CheckRouteUserGuard } from './middlewares/check-route-user.guard';

@Controller('routes')
@UseGuards(AuthGuard(), RolesGuard)
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Roles(Role.Admin)
  @Get('all')
  async getRoutes() {
    const filter = {};
    return this.routeService.getRoutes(filter);
  }

  @Get()
  async getUserRoutes(@Req() req) {
    const user: User = req.user;
    const filter = user.admin_preferences.show_all_routes
      ? {}
      : { user: user._id };
    return this.routeService.getRoutes(filter);
  }

  @Post()
  async createRoute(@Body() routeData: Route | Route[], @Req() req) {
    return this.routeService.createRoute(routeData, req.user);
  }

  @Roles(Role.Admin)
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
  async getCurrPlace(@Param('id') id: string) {
    return this.routeService.getCurrPlace(id);
  }
}
