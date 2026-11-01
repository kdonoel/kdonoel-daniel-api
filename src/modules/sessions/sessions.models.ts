import { IsEmail, Matches, MinLength } from '@neo9/n9-node-routing';

import { UserEntity } from '../users/users.models';

export class CreateSessionBody {
	@IsEmail()
	public email: string;

	@MinLength(8)
	@Matches(/^(?=.*[a-z])(?=.*\d).{8,}$/i)
	public password?: string;
}

export interface Session {
	token: string;
	profile: UserEntity;
}

export interface TokenContent {
	userId: string;
	email: string;
	firstName: string;
	lastName: string;
	familyCodes: string[];
}
