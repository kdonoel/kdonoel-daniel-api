import {
	Authorized,
	Body,
	CurrentUser,
	Get,
	JsonController,
	N9Error,
	Param,
	Post,
	Put,
	QueryParam,
	Service,
} from '@neo9/n9-node-routing';
import * as _ from 'lodash';

import { TokenContent } from '../sessions/sessions.models';
import { KdoRequestCreate, KdoRequestUpdate } from './kdos.models';
import { StatusRequest } from './kdos-status-request.models';
import { PasswordResetRequest, UserEntity, UserListItem, UserRequestCreate } from './users.models';
import { UsersService } from './users.service';
import { UsersUtils } from './users.utils';

@Service()
@JsonController('/users')
export class UsersController {
	constructor(private usersService: UsersService) {}

	/**
	 * Sign-up a new user
	 *
	 * @param userBody
	 * @returns {Promise<UserEntity>}
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
	@Authorized()
	public async createUser(@Body() userBody: UserRequestCreate): Promise<UserEntity> {
		// sanitize email to lowercase
		userBody.email = userBody.email.toLowerCase();
		// Check if user by email already exists
		const userExists = await this.usersService.getByEmail(userBody.email);
		if (userExists) {
			throw new N9Error('user-already-exists', 409, { email: userBody.email });
		}
		// Add user to database
		const user = await this.usersService.create(userBody);
		// Send back the user created
		return _.omit(user, 'password');
	}

	/**
	 * Get a user by its ID
	 *
	 * @param tokenContent session User
	 * @param userId ID Mongo
	 * @returns {Promise<UserEntity>}
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
	@Get('/:id([0-9a-f]{24})')
	@Authorized()
	public async getUserById(
		@CurrentUser({ required: true }) tokenContent: TokenContent,
		@Param('id') userId: string,
	): Promise<UserEntity> {
		await this.usersService.existsById(tokenContent.userId);
		return await this.getUserView(userId, tokenContent.userId);
	}

	@Post('/:userId([0-9a-f]{24})/kdos')
	@Authorized()
	public async addKdoToUser(
		@CurrentUser({ required: true }) tokenContent: TokenContent,
		@Body() kdo: KdoRequestCreate,
		@Param('userId') userId: string,
	): Promise<UserEntity> {
		await this.usersService.existsById(tokenContent.userId);
		await this.usersService.addKdo(kdo, userId, tokenContent);
		return await this.getUserView(userId, tokenContent.userId);
	}

	@Put('/:userId([0-9a-f]{24})/kdos/:index')
	@Authorized()
	public async editKdo(
		@CurrentUser({ required: true }) tokenContent: TokenContent,
		@Body() kdo: KdoRequestUpdate,
		@Param('index') index: number,
		@Param('userId') userId: string,
	): Promise<UserEntity> {
		await this.usersService.existsById(tokenContent.userId);
		await this.usersService.editKdo(kdo, userId, index, tokenContent);
		return await this.getUserView(userId, tokenContent.userId);
	}

	@Get()
	@Authorized()
	public async getUsers(
		@CurrentUser({ required: true }) tokenContent: TokenContent,
		@QueryParam('family-code', { required: true }) familyCode: string,
	): Promise<UserListItem[]> {
		const fullUser = await this.usersService.getById(tokenContent.userId, null);
		if (!fullUser.familyCodes?.includes(familyCode)) {
			throw new N9Error('wrong-family', 400, { familyCode });
		}
		const users: UserEntity[] = await this.usersService
			.find(
				{
					familyCodes: familyCode,
				},
				{ password: 0, historic: 0 },
			)
			.toArray();

		return users.map((u): UserListItem => {
			const isItself = u._id === tokenContent.userId;

			return {
				_id: u._id,
				email: u.email,
				firstName: u.firstName,
				lastName: u.lastName,
				kdosCount: u.kdos ? u.kdos.filter((k) => (isItself ? !k.isSurprise : true)).length : 0,
				objectInfos: u.objectInfos,
				lastSessionAt: u.lastSessionAt,
				familyCodes: undefined,
			};
		});
	}

	@Post('/reset/password')
	@Authorized()
	public async resetPassword(
		@CurrentUser({ required: true }) user: TokenContent,
		@Body() passwordResetRequest: PasswordResetRequest,
	): Promise<void> {
		const fullUser = await this.usersService.getById(user.userId, null);
		const match = await UsersUtils.VERIFY_PASSWORD(
			fullUser.password,
			passwordResetRequest.oldPassword,
		);
		if (!match) throw new N9Error('invalid-credentials', 401);

		await this.usersService.setPassword(user.userId, passwordResetRequest.newPassword, user);
	}

	@Put('/:userId([0-9a-f]{24})/kdos/:index([0-9]+)/status')
	@Authorized()
	public async setKdoStatus(
		@CurrentUser({ required: true }) tokenContent: TokenContent,
		@Param('userId') userId: string,
		@Param('index') index: number,
		@Body() status: StatusRequest,
	): Promise<UserEntity> {
		if (userId === tokenContent.userId) {
			throw new N9Error('user-not-valid', 401);
		}
		await this.usersService.existsById(tokenContent.userId);

		await this.usersService.setKdoStatus(userId, index, status, tokenContent);
		return await this.getUserView(userId, tokenContent.userId);
	}

	/**
	 * The user as seen by the viewer: never the password, and the owner of the list sees neither the
	 * surprises nor the statuses of its ideas (removed by the projection)
	 */
	private async getUserView(userId: string, viewerId: string): Promise<UserEntity> {
		const user = await this.usersService.getById(userId, viewerId);
		if (userId === viewerId) {
			user.kdos = user.kdos?.filter((k) => !k.isSurprise);
			user.hasPassword = !!user.password;
		}
		return _.omit(user, 'password');
	}
}
