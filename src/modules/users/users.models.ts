import { BaseMongoObject } from '@neo9/n9-mongodb-client';
import {
	ArrayMinSize,
	Exclude,
	Expose,
	IsArray,
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MinLength,
} from '@neo9/n9-node-routing';

import { Kdo } from './kdos.models';

@Exclude()
export class UserRequestCreate {
	@IsEmail()
	@Expose()
	public email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	@Expose()
	public firstName: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	@Expose()
	public lastName: string;

	@IsString({ each: true })
	@IsArray()
	@ArrayMinSize(1)
	@IsNotEmpty()
	@Expose()
	public familyCodes: string[];

	@IsOptional()
	@MinLength(8)
	@Matches(/^(?=.*[a-z])(?=.*\d).{8,}$/i)
	public password?: string;
}

export class UserEntity extends BaseMongoObject {
	public token?: string;
	public email: string;
	public firstName: string;
	public lastName: string;
	public password?: string;
	public lastSessionAt?: Date;
	public accessToken?: string;
	public kdos?: Kdo[];
	public familyCodes: string[];
	// Only in the responses, for the user itself
	public hasPassword?: boolean;
}

export class UserListItem extends BaseMongoObject {
	public token?: string;
	public email: string;
	public firstName: string;
	public lastName: string;
	public lastSessionAt?: Date;
	public kdosCount?: number;
	public familyCodes: string[];
}

export class PasswordResetRequest {
	@MinLength(8)
	@Matches(/^(?=.*[a-z])(?=.*\d).{8,}$/i)
	public oldPassword: string;

	@MinLength(8)
	@Matches(/^(?=.*[a-z])(?=.*\d).{8,}$/i)
	public newPassword: string;
}
