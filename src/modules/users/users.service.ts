import { N9FindCursor, N9MongoDBClient, StringMap } from '@neo9/n9-mongodb-client';
import type { Db, Filter } from '@neo9/n9-mongodb-client/mongodb';
import { Inject, N9Error, N9Log, Service } from '@neo9/n9-node-routing';

import { TokenContent } from '../sessions/sessions.models';
import { Kdo, KdoRequestUpdate, KdoState } from './kdos.models';
import { StatusRequest as StatusRequestUpdate } from './kdos-status-request.models';
import { PasswordInitRequest, UserEntity, UserListItem } from './users.models';
import { UsersUtils } from './users.utils';

@Service()
export class UsersService {
	private mongoClient: N9MongoDBClient<UserEntity, UserEntity>;

	constructor(@Inject('db') db: Db, logger: N9Log) {
		this.mongoClient = new N9MongoDBClient('users', UserEntity, UserListItem, {
			keepHistoric: true,
			db,
			logger,
		});
	}

	public async create(user: UserEntity): Promise<UserEntity> {
		if (user.password) {
			user.password = await UsersUtils.HASH_PASSWORD(user.password);
		}
		return await this.mongoClient.insertOne(user, 'none');
	}

	public async getById(
		userId: string,
		userIdFor?: string,
		projection: StringMap<number> = {},
	): Promise<UserEntity> {
		if (userIdFor && userId === userIdFor) {
			projection['kdos.status'] = 0;
		}
		const user = await this.mongoClient.findOneById(userId, projection);
		if (!user) {
			throw new N9Error('user-not-found', 404, { id: userId });
		}
		return user;
	}

	public async existsById(userId: string): Promise<void> {
		const user = await this.mongoClient.existsById(userId);
		if (!user) {
			throw new N9Error('user-not-found', 404, { id: userId });
		}
	}

	public async getByEmail(email: string, projection?: object): Promise<UserEntity> {
		return await this.mongoClient.findOneByKey(email, 'email', projection);
	}

	public find(query: Filter<UserEntity>, projection: object = {}): N9FindCursor<UserEntity> {
		return this.mongoClient.find(query, 0, 0, { firstName: 1, lastName: 1 }, projection);
	}

	public async setPassword(userId: string, pwd: string, editor: TokenContent): Promise<void> {
		const user = await this.getById(userId);
		user.password = await UsersUtils.HASH_PASSWORD(pwd);
		await this.updateById(userId, user, editor.userId);
	}

	public async updateLastSession(userId: string): Promise<void> {
		const user = await this.getById(userId);
		user.lastSessionAt = new Date();
		await this.updateById(userId, user, userId);
	}

	public async addKdo(kdo: Kdo, userId: string, editor: TokenContent): Promise<UserEntity> {
		const userToUpate = await this.getById(userId);

		if (!userToUpate.kdos) {
			userToUpate.kdos = [];
		}

		userToUpate.kdos.push({
			...kdo,
			status: {
				code: KdoState.FREE,
			},
		});

		return await this.updateById(userId, userToUpate, editor.userId);
	}

	public async editKdo(
		kdoRequestUpdate: KdoRequestUpdate,
		userId: string,
		index: number,
		editor: TokenContent,
	): Promise<void> {
		const userToUpdate = await this.getById(userId);
		const kdoIndex = this.getKdoIndex(userToUpdate.kdos, index, userId === editor.userId);

		userToUpdate.kdos[kdoIndex] = {
			...userToUpdate.kdos[kdoIndex],
			...kdoRequestUpdate,
		};

		await this.updateById(userId, userToUpdate, editor.userId);
	}

	public async setKdoStatus(
		userId: string,
		index: number,
		statusRequestUpdate: StatusRequestUpdate,
		editor: TokenContent,
	): Promise<void> {
		const userToUpate = await this.getById(userId);
		const kdoIndex = this.getKdoIndex(userToUpate.kdos, index, userId === editor.userId);

		if (
			userToUpate.kdos[kdoIndex].status?.code !== KdoState.FREE &&
			userToUpate.kdos[kdoIndex].status?.userId &&
			userToUpate.kdos[kdoIndex].status?.userId !== editor.userId
		) {
			throw new N9Error('can-t-update-status', 401);
		}
		userToUpate.kdos[kdoIndex] = {
			...userToUpate.kdos[kdoIndex],
			status: {
				code: statusRequestUpdate.status,
				userId: editor.userId,
				lastUpdateDate: new Date(),
			},
		};

		await this.updateById(userId, userToUpate, editor.userId);
	}

	public async initPassword(passwordInitRequest: PasswordInitRequest): Promise<UserEntity> {
		const user = await this.getByEmail(passwordInitRequest.email);
		if (!user) throw new N9Error('user-not-found', 404);
		if (user.password) throw new N9Error('password-already-set', 401);

		return await this.updateById(
			user._id,
			{
				...user,
				password: await UsersUtils.HASH_PASSWORD(passwordInitRequest.pwd),
			},
			user._id,
		);
	}

	/**
	 * The owner of a list doesn't see its surprises, so the index it sends is the one of the idea
	 * among the ideas which are not surprises
	 */
	private getKdoIndex(kdos: Kdo[] = [], index: number, isOwner: boolean): number {
		const kdoIndex = isOwner ? kdos.flatMap((k, i) => (k.isSurprise ? [] : [i]))[index] : index;
		if (!kdos[kdoIndex]) {
			throw new N9Error('kdo-not-found', 404, { index });
		}
		return kdoIndex;
	}

	private async updateById(
		userId: string,
		user: UserEntity,
		editorId: string,
	): Promise<UserEntity> {
		return await this.mongoClient.findOneAndUpdateByIdWithLocks(
			userId,
			user,
			editorId,
			false,
			true,
		);
	}
}
