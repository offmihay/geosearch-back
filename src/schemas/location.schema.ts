import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LocationDocument = HydratedDocument<Location>;

@Schema()
export class Location {
  @Prop()
  place_id: string;

  @Prop()
  lat: string;

  @Prop()
  lng: string;

  @Prop()
  business_status: string;

  @Prop()
  route_status: string;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
