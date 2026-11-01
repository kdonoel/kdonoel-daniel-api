import { N9Error, N9Log, Service } from '@neo9/n9-node-routing';

import { Conf } from '../../conf/index.models';
import { UserEntity } from '../users/users.models';
import { EmailContent } from './emails.templates';

// See https://developers.brevo.com/reference/sendtransacemail
const BREVO_EMAILS_URL = 'https://api.brevo.com/v3/smtp/email';

@Service()
export class EmailsService {
	constructor(
		private conf: Conf,
		private logger: N9Log,
	) {}

	public async send(user: UserEntity, content: EmailContent): Promise<void> {
		const { brevoApiKey, senderEmail } = this.conf.emails;
		if (!brevoApiKey) {
			// Development only, the configuration requires a key in production
			this.logger.info(`Email to ${user.email} not sent, no Brevo API key: ${content.subject}`, {
				text: content.text,
			});
			return;
		}

		const response = await fetch(BREVO_EMAILS_URL, {
			method: 'POST',
			headers: {
				'accept': 'application/json',
				'api-key': brevoApiKey,
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				sender: { email: senderEmail, name: 'Kdos Noël' },
				to: [{ email: user.email, name: `${user.firstName} ${user.lastName}` }],
				subject: content.subject,
				htmlContent: content.html,
				textContent: content.text,
			}),
			signal: AbortSignal.timeout(10_000),
		});
		if (!response.ok) {
			this.logger.error(`Email to ${user.email} not sent by Brevo: ${response.status}`, {
				body: await response.text(),
			});
			throw new N9Error('email-not-sent', 502);
		}
	}
}
