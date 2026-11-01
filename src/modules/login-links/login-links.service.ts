import { randomBytes } from 'node:crypto';

import { N9MongoDBClient } from '@neo9/n9-mongodb-client';
import type { Db } from '@neo9/n9-mongodb-client/mongodb';
import { Inject, N9Error, N9Log, Service } from '@neo9/n9-node-routing';

import { Conf } from '../../conf/index.models';
import { EmailsService } from '../emails/emails.service';
import { LOGIN_LINK_EMAIL } from '../emails/emails.templates';
import { UserEntity } from '../users/users.models';
import { LoginToken } from './login-links.models';
import { LoginLinksUtils } from './login-links.utils';

const HOUR_MS = 3_600_000;
const LINK_VALIDITY_MS = HOUR_MS;
// Links asked per user and per day, so that nobody can flood a mailbox
const MAX_LINKS_PER_DAY = 5;
// The expired links can still ask for a new one, even those of the last Christmas
const RETENTION_DAYS = 400;

/**
 * Links sent by email to log in without password
 */
@Service()
export class LoginLinksService {
	private mongoClient: N9MongoDBClient<LoginToken, LoginToken>;

	constructor(
		@Inject('db') db: Db,
		logger: N9Log,
		private conf: Conf,
		private emailsService: EmailsService,
	) {
		this.mongoClient = new N9MongoDBClient('loginTokens', LoginToken, LoginToken, { db, logger });
	}

	public async createIndexes(): Promise<void> {
		await this.mongoClient.createUniqueIndex('tokenHash');
		// MongoDB deletes the tokens once the retention is passed
		await this.mongoClient.createExpirationIndex(RETENTION_DAYS);
	}

	public async sendLoginLink(user: UserEntity): Promise<void> {
		const linksCount = await this.mongoClient.count({
			'userId': user._id,
			'objectInfos.creation.date': { $gt: new Date(Date.now() - 24 * HOUR_MS) },
		});
		if (linksCount >= MAX_LINKS_PER_DAY) {
			throw new N9Error('too-many-login-links', 429);
		}

		const expiresAt = new Date(Date.now() + LINK_VALIDITY_MS);
		const url = await this.createLink(user, expiresAt);
		await this.emailsService.send(
			user,
			LOGIN_LINK_EMAIL({ firstName: user.firstName, url, expiresAt }),
		);
	}

	/**
	 * The links can be used several times until their expiration: some email filters open the links
	 * before the users. An expired link can still be used to send a new one.
	 */
	public async getUserId(token: string, allowExpired: boolean = false): Promise<string> {
		const loginToken = await this.mongoClient.findOneByKey(
			LoginLinksUtils.HASH_TOKEN(token),
			'tokenHash',
		);
		if (!loginToken) {
			throw new N9Error('login-link-not-found', 404);
		}
		if (!allowExpired && loginToken.expiresAt < new Date()) {
			throw new N9Error('login-link-expired', 401);
		}
		return loginToken.userId;
	}

	// The token is in the fragment of the link: the browsers never send it to the servers
	private async createLink(user: UserEntity, expiresAt: Date): Promise<string> {
		const token = randomBytes(32).toString('base64url');
		await this.mongoClient.insertOne(
			{ tokenHash: LoginLinksUtils.HASH_TOKEN(token), userId: user._id, expiresAt },
			'none',
		);
		return `${this.conf.webUrl}/login/link#${token}`;
	}
}
