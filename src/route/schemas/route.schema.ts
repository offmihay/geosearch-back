import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Place } from 'src/place/schemas/place.schema';
import { User } from 'src/user/schemas/user.schema';

export type RouteDocument = HydratedDocument<Route>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Route {
  _id: mongoose.Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  places_id_set: Place['place_id'][];

  @Prop()
  img_url: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;
}

export const RouteSchema = SchemaFactory.createForClass(Route);
