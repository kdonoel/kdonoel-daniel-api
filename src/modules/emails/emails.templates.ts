export interface EmailContent {
	subject: string;
	html: string;
	text: string;
}

// French typography: no-break space before the high punctuation
function typography(text: string): string {
	return text.replace(/ ([:;!?])/g, '\u00a0$1');
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function LOGIN_LINK_EMAIL(params: {
	firstName: string;
	url: string;
	expiresAt: Date;
}): EmailContent {
	const time = new Intl.DateTimeFormat('fr-FR', {
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Europe/Paris',
	}).format(params.expiresAt);
	const validity = `Ce lien fonctionne jusqu'à ${time}. Si tu n'as rien demandé, tu peux ignorer cet e-mail.`;
	return {
		subject: 'Ton lien de connexion à Kdos Noël',
		html: `<div style="max-width: 480px; margin: 0 auto; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #212529">
	<p>Bonjour ${escapeHtml(params.firstName)},</p>
	<p>${typography("Clique sur le bouton pour te connecter aux listes d'idées de cadeaux de ta famille :")}</p>
	<p style="margin: 28px 0; text-align: center">
		<a href="${escapeHtml(params.url)}" style="display: inline-block; padding: 14px 28px; border-radius: 8px; background-color: #2b4c9c; color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: none">Me connecter</a>
	</p>
	<p style="color: #6c757d; font-size: 14px">${validity}</p>
</div>`,
		text: [
			`Bonjour ${params.firstName},`,
			'',
			typography("Pour te connecter aux listes d'idées de cadeaux de ta famille, ouvre ce lien :"),
			params.url,
			'',
			validity,
		].join('\n'),
	};
}

export function INVITATION_EMAIL(params: {
	firstName: string;
	url: string;
	expiresAt: Date;
}): EmailContent {
	const year = new Date().getFullYear();
	const parts = new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'Europe/Paris',
	}).formatToParts(params.expiresAt);
	const part = (type: Intl.DateTimeFormatPartTypes): string =>
		parts.find((p) => p.type === type)?.value;
	// "1er janvier 2027", "14 janvier 2027"
	const until = `${part('day') === '1' ? '1er' : part('day')} ${part('month')} ${part('year')}`;
	const intro = typography(
		`Les listes d'idées de cadeaux de Noël ${year} sont ouvertes : note les cadeaux qui te feraient plaisir et découvre les idées de ta famille.`,
	);
	const validity = typography(
		`Pas besoin de mot de passe : ce lien te connecte directement. Il est personnel et fonctionne jusqu'au ${until}, garde cet e-mail pour revenir sur le site.`,
	);
	return {
		subject: `Les listes de cadeaux de Noël ${year} sont ouvertes`,
		html: `<div style="max-width: 480px; margin: 0 auto; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #212529">
	<p>Bonjour ${escapeHtml(params.firstName)},</p>
	<p>${intro}</p>
	<p style="margin: 28px 0; text-align: center">
		<a href="${escapeHtml(params.url)}" style="display: inline-block; padding: 14px 28px; border-radius: 8px; background-color: #2b4c9c; color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: none">Ouvrir les listes de Noël</a>
	</p>
	<p>${validity}</p>
</div>`,
		text: [`Bonjour ${params.firstName},`, '', intro, '', params.url, '', validity].join('\n'),
	};
}
