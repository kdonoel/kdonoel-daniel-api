import {
	Authorized,
	Body,
	CurrentUser,
	Inject,
	JsonController,
	N9Error,
	N9Log,
	Post,
	Service,
} from '@neo9/n9-node-routing';

import { UsersService } from '../users/users.service';
import { UsersUtils } from '../users/users.utils';
import { CreateSessionBody, Session, TokenContent } from './sessions.models';
import { SessionsService } from './sessions.service';

@Service()
@JsonController('/sessions')
export class SessionsController {
	@Inject()
	private logger: N9Log;

	constructor(
		private usersService: UsersService,
		private sessionsService: SessionsService,
	) {}

	/**
	 * Sign-up a new user
	 *
	 * @param createSessionBody body
	 * @returns {Promise<Session>}
	 * Sample :
	 * <pre><code>
	 *  {
	 * 	_id: '591427845bb9a818da5b3246',
	 * 	firstName: 'Bruce',
	 * 	lastName: 'Wayne',
	 * 	email: 'bruce@neo9.fr',
	 * 	createdAt: new Date().toJSON()
	 * }
	 * </code></pre>
	 */
	@Post()
	public async createSession(@Body() createSessionBody: CreateSessionBody): Promise<Session> {
		// The emails are saved in lowercase, the phones often capitalize the first letter
		const email = createSessionBody.email.toLowerCase();
		const password = createSessionBody.password;

		const user = await this.usersService.getByEmail(email, { kdos: 0 });
		if (!user) {
			this.logger.info(`Invalid credential due to user not found : ${email}`);
			throw new N9Error('invalid-credentials', 401);
		}

		if (!user.password) throw new N9Error('init-password-required', 401);

		const match = await UsersUtils.VERIFY_PASSWORD(user.password, password);
		if (!match) {
			this.logger.info(`Invalid credential due to wrong password for ${email}`);
			throw new N9Error('invalid-credentials', 401);
		}

		await this.usersService.updateLastSession(user._id);
		return this.sessionsService.generateUserSession(user);
	}

	/**
	 * New session for the connected user. The web app calls it at each visit, so that the users stay
	 * logged in from one Christmas to the next.
	 */
	@Post('/refresh')
	@Authorized()
	public async refreshSession(
		@CurrentUser({ required: true }) tokenContent: TokenContent,
	): Promise<Session> {
		const user = await this.usersService.getById(tokenContent.userId, undefined, { kdos: 0 });
		await this.usersService.updateLastSession(user._id);
		return this.sessionsService.generateUserSession(user);
	}
}
