import type { MongoClientOptions } from '@neo9/n9-mongodb-client/mongodb';
import {
	Allow,
	IsNotEmpty,
	IsOptional,
	IsString,
	isStringOrNumber,
	N9NodeRouting,
	SecretTransformer,
	SecretType,
	Transform,
	Type,
	ValidateNested,
} from '@neo9/n9-node-routing';
import type { SignOptions } from 'jsonwebtoken';

export class MongoConf {
	// Hide the password, the configuration is exposed on the /conf route
	@IsString()
	@Transform(SecretTransformer.GET_TRANSFORMER(SecretType.URI))
	public url: string;

	@IsOptional()
	@Allow()
	public options?: MongoClientOptions;
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

export class Conf extends N9NodeRouting.N9NodeRoutingBaseConf {
	@ValidateNested()
	@Type(() => MongoConf)
	public mongo?: MongoConf;

	@ValidateNested()
	@Type(() => JwtConf)
	public jwt?: JwtConf;
}
