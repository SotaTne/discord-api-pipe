export default {
	async fetch(request, env, ctx): Promise<Response> {
		// Discord REST API のベースURL
		const DISCORD_API_BASE = 'https://discord.com/api';

		// オリジナルのリクエストURLからパスとクエリ文字列を取得
		const url = new URL(request.url);
		const discordUrl = new URL(url.pathname + url.search, DISCORD_API_BASE);

		// オリジナルのヘッダーをクローンし、必要なヘッダーの調整を実施
		const newHeaders = new Headers(request.headers);
		// 不要なホスト情報は削除
		newHeaders.delete('host');

		// Bot Token を環境変数から取得し、Authorization ヘッダーに設定
		const token = env.DISCORD_BOT_TOKEN;
		if (!token) {
			return new Response('Server configuration error: missing Discord token', { status: 500 });
		}
		newHeaders.set('Authorization', `Bot ${token}`);

		// リクエストボディは、ストリームの場合の再利用に注意（Workers ではリクエストボディは一度しか読めないため）
		const newRequestInit: RequestInit = {
			method: request.method,
			headers: newHeaders,
			// GET や HEAD 以外の場合、body をそのまま転送
			body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
			redirect: 'follow',
		};

		const newRequest = new Request(discordUrl.toString(), newRequestInit);

		// Discord API へリクエストを転送
		const response = await fetch(newRequest);

		// Discord からのレスポンスをそのまま返す
		return response;
	},
} satisfies ExportedHandler<Env>;
