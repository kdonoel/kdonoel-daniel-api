import { join } from 'node:path';

import { generateDocumentationJsonToFile } from '@neo9/n9-node-routing';

function start(): void {
	generateDocumentationJsonToFile({
		path: join(__dirname, 'modules'),
		conf: {
			n9NodeConf: {
				path: join(__dirname, 'conf'),
			},
		},
	});
}

start();
