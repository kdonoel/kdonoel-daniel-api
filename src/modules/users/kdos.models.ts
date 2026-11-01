import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from '@neo9/n9-node-routing';

export enum KdoState {
	FREE = 'free',
	RESERVED = 'reserved',
	BOUGHT = 'bought',
}

export class KdoStatus {
	@IsEnum(KdoState)
	public code: KdoState;

	@IsString()
	public userId?: string;

	public lastUpdateDate?: Date;
}

export class Kdo {
	public title: string;
	public description?: string;
	public status?: KdoStatus;
	public isSurprise?: boolean;
}

export class KdoRequestCreate {
	@IsNotEmpty()
	public title: string;

	@IsString()
	@IsOptional()
	public description?: string;

	@IsBoolean()
	public isSurprise?: boolean;
}

export class KdoRequestUpdate {
	@IsNotEmpty()
	public title: string;

	@IsString()
	@IsOptional()
	public description?: string;
}
