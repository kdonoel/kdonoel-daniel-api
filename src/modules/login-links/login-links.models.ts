import { BaseMongoObject } from '@neo9/n9-mongodb-client';
import { IsEmail, IsNotEmpty, IsString, ValidateIf } from '@neo9/n9-node-routing';

export class LoginToken extends BaseMongoObject {
	// Only the hash is saved, the token itself is only in the email
	public tokenHash: string;
	public userId: string;
	public expiresAt: Date;
}

/**
 * The email address, or the first and last names when the address is forgotten
 */
export class LoginLinkRequest {
	@ValidateIf((request: LoginLinkRequest) => !request.firstName && !request.lastName)
	@IsEmail()
	public email?: string;

	@ValidateIf((request: LoginLinkRequest) => !request.email)
	@IsString()
	@IsNotEmpty()
	public firstName?: string;

	@ValidateIf((request: LoginLinkRequest) => !request.email)
	@IsString()
	@IsNotEmpty()
	public lastName?: string;
}

export class LoginLinkTokenRequest {
	@IsString()
	@IsNotEmpty()
	public token: string;
}

export interface LoginLinkResponse {
	// Addresses the links were sent to, partially hidden
	emails: string[];
}
