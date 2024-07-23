import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Regions } from 'src/route/enum/regions.enum';

@Schema({ _id: false })
export class Preferences {
  @Prop({ default: [Regions.Kyiv] })
  regions: Regions[];
}

export const PreferencesSchema = SchemaFactory.createForClass(Preferences);
