import { IsEmail, Matches, MinLength } from '@neo9/n9-node-routing';

export class CreateSessionBody {
	@IsEmail()
	public email: string;

	@MinLength(8)
	@Matches(/^(?=.*[a-z])(?=.*\d).{8,}$/i)
	public password?: string;
}

export interface SessionProfile {
	_id: string;
	email: string;
	firstName: string;
	lastName: string;
	familyCodes: string[];
	// The admins send the invitations, see ADMIN_EMAILS
	isAdmin: boolean;
}

export interface Session {
	token: string;
	profile: SessionProfile;
}

export interface TokenContent {
	userId: string;
	email: string;
	firstName: string;
	lastName: string;
	familyCodes: string[];
}
