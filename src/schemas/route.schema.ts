import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RouteDocument = HydratedDocument<Route>;

@Schema()
export class Route {
  @Prop()
  name: string;

  @Prop()
  places_id_set: string[];

  @Prop()
  img_url: string;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const RouteSchema = SchemaFactory.createForClass(Route);
