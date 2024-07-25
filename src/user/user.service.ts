import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Regions } from 'src/route/enum/regions.enum';
import { PreferencesDto } from './dto/preferences.dto';
import { AdminPreferencesDto } from './dto/admin-preferences.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async getPreferences(user: User) {
    const userModel = await this.userModel.findOne({ _id: user._id }).exec();
    const preferences = userModel.preferences || {};
    return {
      preferences,
      preferences_possibleValues: {
        regions: Object.values(Regions),
      },
    };
  }

  async getAdminPreferences(user: User) {
    const userModel = await this.userModel.findOne({ _id: user._id }).exec();
    const preferences = userModel.admin_preferences || {};
    return {
      preferences,
    };
  }

  async postPreferences(user: User, preferencesDto: PreferencesDto) {
    console.log(preferencesDto);
    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { preferences: preferencesDto.preferences } },
    );
    return { message: 'Updated successfully', data: preferencesDto };
  }

  async postAdminPreferences(user: User, preferencesDto: AdminPreferencesDto) {
    console.log(preferencesDto);
    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { admin_preferences: preferencesDto.preferences } },
    );
    return { message: 'Updated successfully', data: preferencesDto };
  }
}
