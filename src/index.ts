// Add source map supports
import 'source-map-support/register';

import { join } from 'node:path';

// Dependencies
import n9NodeRouting, { Container, N9NodeRouting, safeStringify } from '@neo9/n9-node-routing';

import { Conf } from './conf/index.models';
import { SessionsUtils } from './modules/sessions/sessions.utils';

// Start method
async function start(confOverride: Partial<Conf> = {}): Promise<N9NodeRouting.ReturnObject<Conf>> {
	// Filled by the mongo init module once connected
	const pingDbs: N9NodeRouting.PingDb[] = [];
	Container.set('pingDbs', pingDbs);
	const callbacksBeforeShutdownAfterExpressEnded: N9NodeRouting.CallbacksBeforeShutdown[] = [];
	Container.set(
		'callbacksBeforeShutdownAfterExpressEnded',
		callbacksBeforeShutdownAfterExpressEnded,
	);

	// Load the conf, the modules and start the server
	return await n9NodeRouting<Conf>({
		hasProxy: false,
		path: join(__dirname, 'modules'),
		conf: {
			n9NodeConf: {
				path: join(__dirname, 'conf'),
				extendConfig: {
					key: {
						name: 'starterApi',
					},
					path: {
						relative: './env/env.yaml',
					},
				},
				override: {
					value: confOverride,
				},
			},
			validation: {
				isEnabled: true,
				classType: Conf,
			},
		},
		http: {
			beforeRoutingControllerLaunchHook: ({ expressApp, log, conf }) => {
				log.info('Add JWT decoder');
				SessionsUtils.SET_JWT_LOADER(conf, log, expressApp);
			},
			ping: {
				dbs: pingDbs,
			},
			routingController: {
				currentUserChecker: (action) => {
					const token = action.request.headers['x-jwt-token'];
					return SessionsUtils.GET_TOKEN_CONTENT(token, Container.get(Conf).jwt.secret);
				},
			},
		},
		shutdown: {
			callbacksBeforeShutdownAfterExpressEnded,
		},
		// The other init modules need the MongoDB connection
		firstSequentialInitFileNames: ['mongo'],
	});
}

// Start server if not in test mode
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
	start()
		.then(({ logger }) => {
			logger.info('Launch SUCCESS !');
		})
		.catch((e) => {
			// eslint-disable-next-line no-console
			console.error(`Error on launch : `, {
				errString: safeStringify(e),
			});
			throw e;
		});
}

export default start;
