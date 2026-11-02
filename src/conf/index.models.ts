import {
	IsArray,
	IsEmail,
	IsNotEmpty,
	IsString,
	isStringOrNumber,
	IsUrl,
	N9NodeRouting,
	SecretTransformer,
	SecretType,
	Transform,
	Type,
	ValidateIf,
	ValidateNested,
} from '@neo9/n9-node-routing';
import type { SignOptions } from 'jsonwebtoken';

export class MongoConf {
	// Hide the password, the configuration is exposed on the /conf route
	@IsString()
	@Transform(SecretTransformer.GET_TRANSFORMER(SecretType.URI))
	public url: string;
}

export class JwtConf {
	// Never expose the secret, the configuration is exposed on the /conf route
	@IsString()
	@IsNotEmpty()
	@Transform(SecretTransformer.GET_TRANSFORMER(SecretType.INVISIBLE))
	public secret: string;

	@isStringOrNumber()
	public expiresIn: SignOptions['expiresIn'];
}

export class EmailsConf {
	// Without key, the emails are only written in the logs, which is not allowed in production
	@ValidateIf(() => process.env.NODE_ENV === 'production')
	@IsString()
	@IsNotEmpty()
	@Transform(SecretTransformer.GET_TRANSFORMER(SecretType.INVISIBLE))
	public brevoApiKey?: string;

	// Validated in Brevo
	@IsEmail()
	public senderEmail: string;
}

export class Conf extends N9NodeRouting.N9NodeRoutingBaseConf {
	@ValidateNested()
	@Type(() => MongoConf)
	public mongo?: MongoConf;

	@ValidateNested()
	@Type(() => JwtConf)
	public jwt?: JwtConf;

	// Public address of the web app, used in the links sent by email
	@IsUrl({ require_tld: false })
	public webUrl?: string;

	@ValidateNested()
	@Type(() => EmailsConf)
	public emails?: EmailsConf;

	// The admins send the invitations, hidden on the /conf route
	@IsArray()
	@IsEmail({}, { each: true })
	@Transform(SecretTransformer.GET_TRANSFORMER(SecretType.INVISIBLE))
	public adminEmails?: string[];
}
