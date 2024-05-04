import { generate } from "./generate.ts"
import { loadFiles } from "./load.ts"

export interface Config {
	source?: string
	baseLanguage?: string
	importName?: string
}

interface Context {
	state: Record<string, unknown>
	next: () => Promise<Response>
}

interface PluginMiddleware {
	path: string
	middleware: {
		handler: (req: Request, ctx: Context) => Promise<Response>
	}
}

interface Plugin {
	name: string
	middlewares?: PluginMiddleware[]
}

export default (meta: ImportMeta, cfg: Config = {}): Plugin => {
	const supportedLanguages: string[] = []
	;(async () => {
		const [translations, metadata] = await loadFiles(
			cfg.baseLanguage ?? "en",
			new URL(meta.resolve(`./${cfg.source ?? "translations"}`)),
		)
		supportedLanguages.push(...Object.keys(translations))

		const script = generate(
			cfg.importName ?? "@nihility-io/fresh-lang",
			cfg.baseLanguage ?? "en",
			metadata,
			translations,
		)

		await Deno.writeTextFile(new URL(meta.resolve(`./${cfg.source ?? "translations"}/translations.gen.ts`)), script)
	})()

	const getCookies = import("@std/http").then((x) => x.getCookies)

	return {
		name: "@nihility-io/lang",
		middlewares: [
			{
				path: "/",
				middleware: {
					handler: async (req: Request, ctx: Context) => {
						const cookieLang = (await getCookies)(req.headers)["lang"]
						if (cookieLang) {
							ctx.state.lang = cookieLang
						}

						const headerLang = (req.headers.get("Accept-Language") ?? "")
							.split(",")
							.map((lang): [number, string] => {
								const [locale, q = "q=1"] = lang.split(";")
								const trimmedLocale = locale.trim()
								const numQ = Number(q.replace(/q ?=/, ""))
								return [isNaN(numQ) ? 0 : numQ, trimmedLocale]
							})
							.sort(([q1], [q2]) => q2 - q1)
							.flatMap(([_, locale]) => locale === "*" ? [] : locale)
							.find((x) => supportedLanguages.includes(x))

						ctx.state.lang = headerLang ?? cfg.baseLanguage

						return await ctx.next()
					},
				},
			},
		],
	}
}
