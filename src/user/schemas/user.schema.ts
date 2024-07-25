import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from '../../auth/enum/role.enum';
import { PreferencesSchema, Preferences } from './user.preferences.schema';
import mongoose from 'mongoose';
import {
  AdminPreferences,
  AdminPreferencesSchema,
} from './user.admin-preferences.schema';

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class User {
  _id: mongoose.Types.ObjectId;

  @Prop({ unique: [true, 'Username has already existed!'] })
  username: string;

  @Prop()
  password: string;

  @Prop({ default: [Role.User] })
  roles: Role[];

  @Prop({ type: PreferencesSchema, default: {} })
  preferences: Preferences;

  @Prop({ type: AdminPreferencesSchema, default: {} })
  admin_preferences: AdminPreferences;
}

export const UserSchema = SchemaFactory.createForClass(User);
