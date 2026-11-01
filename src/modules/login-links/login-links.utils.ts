import { createHash } from 'node:crypto';

export class LoginLinksUtils {
	public static HASH_TOKEN(token: string): string {
		return createHash('sha256').update(token).digest('hex');
	}

	/**
	 * "b•••n@gmail.com": enough to know which mailbox to check
	 */
	public static MASK_EMAIL(email: string): string {
		const [local, domain] = email.split('@');
		const visible =
			local.length > 2 ? `${local[0]}•••${local[local.length - 1]}` : `${local[0]}•••`;
		return `${visible}@${domain}`;
	}
}
