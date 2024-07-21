import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from 'src/auth/schemas/user.schema';

export type RouteDocument = HydratedDocument<Route>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Route {
  @Prop()
  name: string;

  @Prop()
  places_id_set: string[];

  @Prop()
  img_url: string;

  @Prop()
  route_status_percentage: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;
}

export const RouteSchema = SchemaFactory.createForClass(Route);
