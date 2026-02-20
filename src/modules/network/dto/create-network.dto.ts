import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateNetworkNodeDto } from './create-network-node.dto';

export class CreateNetworkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNetworkNodeDto)
  nodes: CreateNetworkNodeDto[];
}
