import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from '../enum/role.enum';
import { Region } from 'src/route/enum/region.enum';

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class User {
  @Prop({ unique: [true, 'Username has already existed!'] })
  username: string;

  @Prop()
  password: string;

  @Prop({ default: [Role.User] })
  roles: Role[];

  @Prop({ default: [Region.Kyiv] })
  regions: Region[];
}

export const UserSchema = SchemaFactory.createForClass(User);
