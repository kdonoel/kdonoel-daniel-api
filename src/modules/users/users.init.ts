import type { Db } from '@neo9/n9-mongodb-client/mongodb';
import { Container, N9Log } from '@neo9/n9-node-routing';

import { UsersUtils } from './users.utils';

export default async (logger: N9Log): Promise<void> => {
	const usersCollection = Container.get<Db>('db').collection('users');
	const usersCount = await usersCollection.countDocuments({});

	if (usersCount === 0) {
		logger.info('Insert base user');

		await usersCollection.insertOne({
			email: 'test-kdonoel@yopmail.com',
			firstName: 'Admin',
			lastName: 'Admin',
			password: await UsersUtils.HASH_PASSWORD('azerty123'),
			familyCodes: ['Daniel', 'Chaboud'],
		});

		await usersCollection.insertOne({
			email: 'test-kdonoel2@yopmail.com',
			firstName: 'User2',
			lastName: 'Last Name',
			password: await UsersUtils.HASH_PASSWORD('azerty123'),
			familyCodes: ['Daniel'],
		});

		logger.info('User init OK');
	}
	await usersCollection.createIndex({ email: 1 }, { unique: true });
};
