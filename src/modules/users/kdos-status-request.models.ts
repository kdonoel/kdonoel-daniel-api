import { IsEnum, IsNotEmpty } from '@neo9/n9-node-routing';

import { KdoState } from './kdos.models';

export class StatusRequest {
	@IsNotEmpty()
	@IsEnum(KdoState)
	public status: KdoState;
}
