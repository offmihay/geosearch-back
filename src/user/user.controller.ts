import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enum/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PreferencesDto } from './dto/preferences.dto';
import { AdminPreferencesDto } from './dto/admin-preferences.dto';

@Controller('user')
@UseGuards(AuthGuard(), RolesGuard)
export class UserController {
  constructor(private routeService: UserService) {}

  @Get('preferences')
  getPreferences(@Req() req) {
    return this.routeService.getPreferences(req.user);
  }

  @Post('preferences')
  postPreferences(@Req() req, @Body() preferencesDto: PreferencesDto) {
    return this.routeService.postPreferences(req.user, preferencesDto);
  }

  @Roles(Role.Admin)
  @Get('admin-preferences')
  getAdminPreferences(@Req() req) {
    return this.routeService.getAdminPreferences(req.user);
  }

  @Roles(Role.Admin)
  @Post('admin-preferences')
  postAdminPreferences(
    @Req() req,
    @Body() preferencesDto: AdminPreferencesDto,
  ) {
    return this.routeService.postAdminPreferences(req.user, preferencesDto);
  }

  @Roles(Role.Admin)
  @Get('/admin-access')
  adminAcccess() {
    return { success: true };
  }
}
