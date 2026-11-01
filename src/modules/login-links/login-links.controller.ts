import { Body, JsonController, N9Error, Post, Service } from '@neo9/n9-node-routing';

import { Session } from '../sessions/sessions.models';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { LoginLinkRequest, LoginLinkResponse, LoginLinkTokenRequest } from './login-links.models';
import { LoginLinksService } from './login-links.service';
import { LoginLinksUtils } from './login-links.utils';

@Service()
@JsonController('/sessions/links')
export class LoginLinksController {
	constructor(
		private loginLinksService: LoginLinksService,
		private usersService: UsersService,
		private sessionsService: SessionsService,
	) {}

	/**
	 * Send a login link by email. The user is found with its email address, or with its names when
	 * the address is forgotten: the link is then sent to the saved address, partially displayed.
	 */
	@Post()
	public async sendLoginLink(@Body() request: LoginLinkRequest): Promise<LoginLinkResponse> {
		const users = request.email
			? [await this.usersService.getByEmail(request.email.toLowerCase(), { kdos: 0 })].filter(
					Boolean,
				)
			: await this.usersService.findByNames(request.firstName, request.lastName);
		if (!users.length) {
			throw new N9Error('user-not-found', 404);
		}

		for (const user of users) {
			await this.loginLinksService.sendLoginLink(user);
		}
		return { emails: users.map((user) => LoginLinksUtils.MASK_EMAIL(user.email)) };
	}

	@Post('/login')
	public async login(@Body() request: LoginLinkTokenRequest): Promise<Session> {
		const userId = await this.loginLinksService.getUserId(request.token);
		const user = await this.usersService.getById(userId, undefined, { kdos: 0 });
		await this.usersService.updateLastSession(user._id);
		return this.sessionsService.generateUserSession(user);
	}

	/**
	 * Send a new link to the owner of an expired one, nothing to type
	 */
	@Post('/renew')
	public async renew(@Body() request: LoginLinkTokenRequest): Promise<LoginLinkResponse> {
		const userId = await this.loginLinksService.getUserId(request.token, true);
		const user = await this.usersService.getById(userId, undefined, { kdos: 0 });
		await this.loginLinksService.sendLoginLink(user);
		return { emails: [LoginLinksUtils.MASK_EMAIL(user.email)] };
	}
}
