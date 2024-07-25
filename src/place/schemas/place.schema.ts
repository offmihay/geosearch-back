import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

export type PlaceDocument = HydratedDocument<Place>;

export enum PlaceStatus {
  TO_DO = 'TO_DO',
  DONE = 'DONE',
  PROGRESSING = 'PROGRESSING',
  NOT_EXIST = 'NOT_EXIST',
}
@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
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
  region: string;

  @Prop()
  national_phone_number: string;

  @Prop()
  display_name: string;

  @Prop({ default: 'TO_DO' })
  place_status: PlaceStatus;

  @Prop()
  done_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user_done: User;
}

export const PlaceSchema = SchemaFactory.createForClass(Place);
