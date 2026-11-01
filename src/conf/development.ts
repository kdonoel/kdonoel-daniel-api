import { Conf } from './index.models';

const conf: Conf = {
	n9NodeRoutingOptions: {
		shutdown: {
			waitDurationBeforeStop: 500,
		},
	},
	mongo: {
		url: 'mongodb://mongo-kdos:27017/kdos',
	},
	jwt: {
		secret: 'secret_key',
		// The site is used once a year: each visit extends the session, see POST /sessions/refresh
		expiresIn: '400 days',
	},
};

export default conf;
