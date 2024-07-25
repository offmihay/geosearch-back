import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Regions } from 'src/route/enum/regions.enum';

@Schema({ _id: false })
export class AdminPreferences {
  @Prop({ default: false })
  show_all_routes: boolean;
}

export const AdminPreferencesSchema =
  SchemaFactory.createForClass(AdminPreferences);
