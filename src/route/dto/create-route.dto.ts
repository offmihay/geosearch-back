import { IsNotEmpty, IsString } from 'class-validator';
import { Place } from 'src/place/schemas/place.schema';

export class CreateRouteDto {
  @IsNotEmpty()
  @IsString()
  readonly img_url: string;

  @IsNotEmpty()
  readonly name: string;

  @IsNotEmpty()
  readonly places_id_set: Place['place_id'][];
}
