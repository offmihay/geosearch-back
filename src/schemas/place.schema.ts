import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlaceDocument = HydratedDocument<Place>;

@Schema()
export class Place {
  @Prop()
  place_id: string;

  @Prop()
  lat: number;

  @Prop()
  lng: number;

  @Prop()
  formatted_address: string;

  @Prop()
  business_status: string;

  @Prop()
  google_maps_URI: string;

  @Prop()
  city: string;

  @Prop()
  national_phone_number: string;

  @Prop()
  display_name: string;

  @Prop({ default: 'TO_DO' })
  place_status: 'TO_DO' | 'DONE' | 'PROGRESSING' | 'NOT_EXIST' | 'CLOSED';

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop()
  done_at: Date;

  // @Prop()
  // done_by_user: string;
}

export const PlaceSchema = SchemaFactory.createForClass(Place);
