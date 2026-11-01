import { Conf } from './index.models';

const conf: Conf = {
	n9NodeRoutingOptions: {
		http: {
			port: process.env.PORT || 6686,
		},
		enableLogFormatJSON: false,
		prometheus: {
			isEnabled: true,
		},
	},
	mongo: {
		url: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kdos',
	},
	jwt: {
		secret: process.env.JWT_SECRET,
		expiresIn: '30 days',
	},
};

export default conf;
