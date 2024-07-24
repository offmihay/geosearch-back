import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enum/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PreferencesDto } from './dto/preferences.dto';

@Controller('user')
@UseGuards(AuthGuard(), RolesGuard)
export class UserController {
  constructor(private routeService: UserService) {}

  @Roles(Role.Admin)
  @Get('preferences')
  getPreferences(@Req() req) {
    return this.routeService.getPreferences(req.user);
  }

  @Roles(Role.Admin)
  @Post('preferences')
  postPreferences(@Req() req, @Body() preferencesDto: PreferencesDto) {
    return this.routeService.postPreferences(req.user, preferencesDto);
  }
}
