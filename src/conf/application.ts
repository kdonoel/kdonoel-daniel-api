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
		// The site is used once a year: each visit extends the session, see POST /sessions/refresh
		expiresIn: '400 days',
	},
	webUrl: process.env.WEB_URL,
	emails: {
		brevoApiKey: process.env.BREVO_API_KEY,
		senderEmail: process.env.EMAIL_SENDER_EMAIL,
	},
};

export default conf;
