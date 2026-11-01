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

import { LoginLinksService } from '../login-links/login-links.service';
import { TokenContent } from '../sessions/sessions.models';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { InvitationRequest, InvitationResponse } from './invitations.models';

@Service()
@JsonController('/invitations')
export class InvitationsController {
	@Inject()
	private logger: N9Log;

	constructor(
		private usersService: UsersService,
		private sessionsService: SessionsService,
		private loginLinksService: LoginLinksService,
	) {}

	/**
	 * Send the yearly invitation, with a personal login link, to the members of a family
	 */
	@Post()
	@Authorized()
	public async sendInvitations(
		@CurrentUser({ required: true }) tokenContent: TokenContent,
		@Body() request: InvitationRequest,
	): Promise<InvitationResponse> {
		const admin = await this.usersService.getById(tokenContent.userId, undefined, { kdos: 0 });
		if (!this.sessionsService.isAdmin(admin)) {
			throw new N9Error('admin-required', 403);
		}
		const users = await this.usersService
			.find({ familyCodes: request.familyCode }, { kdos: 0, password: 0 })
			.toArray();

		// One by one: an error on an address doesn't prevent the others from being invited
		const response: InvitationResponse = { sentCount: 0, failedCount: 0 };
		for (const user of users) {
			try {
				await this.loginLinksService.sendInvitation(user);
				response.sentCount += 1;
			} catch (e) {
				this.logger.error(`Invitation not sent to ${user.email}`, { errString: `${e}` });
				response.failedCount += 1;
			}
		}
		return response;
	}
}
