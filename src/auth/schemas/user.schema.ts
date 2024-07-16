import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum UserPermission {
  DEFAULT = 'default',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ unique: [true, 'Username has already existed!'] })
  username: string;

  @Prop()
  password: string;

  @Prop({ default: UserPermission.DEFAULT })
  role: UserPermission;
}

export const UserSchema = SchemaFactory.createForClass(User);
