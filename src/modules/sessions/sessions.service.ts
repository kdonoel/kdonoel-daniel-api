import { Service } from '@neo9/n9-node-routing';
import * as jwt from 'jsonwebtoken';

import { Conf } from '../../conf/index.models';
import { UserEntity } from '../users/users.models';
import { Session, TokenContent } from './sessions.models';

@Service()
export class SessionsService {
	constructor(private conf: Conf) {}

	public generateUserSession(user: UserEntity): Session {
		return {
			token: this.generateAccessToken({
				userId: user._id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				familyCodes: user.familyCodes,
			}),
			profile: {
				_id: user._id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				familyCodes: user.familyCodes,
				isAdmin: this.isAdmin(user),
			},
		};
	}

	public isAdmin(user: UserEntity): boolean {
		return this.conf.adminEmails.includes(user.email.toLowerCase());
	}

	private generateAccessToken(session: TokenContent): string {
		return jwt.sign(session, this.conf.jwt.secret, {
			expiresIn: this.conf.jwt.expiresIn,
		});
	}
}
