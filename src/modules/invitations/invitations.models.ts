import { IsNotEmpty, IsString } from '@neo9/n9-node-routing';

export class InvitationRequest {
	@IsString()
	@IsNotEmpty()
	public familyCode: string;
}

export interface InvitationResponse {
	sentCount: number;
	failedCount: number;
}
