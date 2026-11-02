import { Container } from '@neo9/n9-node-routing';

import { LoginLinksService } from './login-links.service';

export default async (): Promise<void> => {
	await Container.get(LoginLinksService).createIndexes();
};
