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
		expiresIn: '30 days',
	},
};

export default conf;
