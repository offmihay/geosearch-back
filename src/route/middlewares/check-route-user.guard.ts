import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Route, RouteDocument } from '../schemas/route.schema';

@Injectable()
export class CheckRouteUserGuard implements CanActivate {
  constructor(
    @InjectModel(Route.name) private routeModel: Model<RouteDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const routeId = request.params.id;
    const userId = request.user._id;

    if (!isValidObjectId(routeId)) {
      throw new BadRequestException(`Invalid route ID: ${routeId}`);
    }

    const route = await this.routeModel.findById(routeId).exec();

    if (!route) {
      throw new BadRequestException(`Route with ID ${routeId} not found.`);
    }

    if (route.user.toString() !== userId.toString()) {
      throw new UnauthorizedException(
        'You are not authorized to access this route',
      );
    }

    return true;
  }
}
