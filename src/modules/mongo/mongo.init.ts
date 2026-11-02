import { MongoUtils } from '@neo9/n9-mongodb-client';
import { Container, N9Log, N9NodeRouting } from '@neo9/n9-node-routing';

import { Conf } from '../../conf/index.models';

export default async (logger: N9Log, conf: Conf): Promise<void> => {
	const { db, mongodbClient } = await MongoUtils.CONNECT(conf.mongo.url, { logger });
	Container.set('db', db);

	const pingDbs: N9NodeRouting.PingDb[] = Container.get('pingDbs');
	pingDbs.push({
		name: 'MongoDB',
		isConnected: () => MongoUtils.IS_CONNECTED(),
	});

	const callbacksBeforeShutdownAfterExpressEnded: N9NodeRouting.CallbacksBeforeShutdown[] =
		Container.get('callbacksBeforeShutdownAfterExpressEnded');
	callbacksBeforeShutdownAfterExpressEnded.push({
		name: 'MongoDB',
		thisArg: undefined,
		function: async (log: N9Log) => await MongoUtils.DISCONNECT(mongodbClient, log),
	});
};
