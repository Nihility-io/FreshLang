import { useCookie } from "@nihility-io/use-cookie"

export type TrimPrefix<TPrefix extends string, T extends string> = T extends `${TPrefix}.${infer R}` ? R : never

/**
 * Compile strings containing variables
 * @param template Template string
 * @param params Variables to replace
 * @example
 * formatString("Hello, {{name}}!", { name: "John Smith" }) // => "Hello, John Smith!"
 */
export const formatString = (template: string, params: Record<string, string>): string => {
	let res = ""
	let v = ""
	let brackets = 0

	for (const l of template) {
		switch (l) {
			case "{": {
				if (brackets < 0 || brackets > 1) {
					return template
				}
				brackets++
				break
			}
			case "}": {
				if (brackets < 1 || brackets > 2) {
					return template
				}
				brackets--
				if (brackets === 0) {
					res += params[v.trim()] ?? `__INVALID_PARAM__`
					v = ""
				}
				break
			}
			default: {
				if (brackets === 2) {
					v += l
				} else {
					res += l
				}
			}
		}
	}

	return res
}

export type Translations<Language extends string, TranslationKey extends string> = Record<
	Language,
	Record<TranslationKey, string>
>

/**
 * Generic version of `translate`. Do not use it. Use `translate` from your fresh-lang.gen.ts file
 * @param baseCode Language code of the base language
 * @param supportedLanguages List of supported languages
 * @param translations Translation map
 */
export const helperTranslate: <Language extends string, TranslationKey extends string>(
	baseCode: Language,
	supportedLanguages: Language[],
	translations: Translations<Language, TranslationKey>,
) => (lang: Language) => (key: TranslationKey, params?: Record<string, string>) => string =
	(baseCode, supportedLanguages, translations) => (lang) => {
		const trans = helperGetTranslation(baseCode, supportedLanguages, translations)
		return (key, params = {}): string => {
			return trans(lang, key, params)
		}
	}

/**
 * Generic version of `getTranslation`. Do not use it. Use `getTranslation` from your fresh-lang.gen.ts file
 * @param baseCode Language code of the base language
 * @param supportedLanguages List of supported languages
 * @param translations Translation map
 */
export const helperGetTranslation: <Language extends string, TranslationKey extends string>(
	baseCode: Language,
	supportedLanguages: Language[],
	translations: Translations<Language, TranslationKey>,
) => (lang: Language, key: TranslationKey, params?: Record<string, string>) => string =
	(baseCode, supportedLanguages, translations) => (lang, key, params = {}): string => {
		if (!supportedLanguages.includes(lang)) {
			lang = baseCode
		}

		const c = translations[lang][key]

		if (typeof c !== "string") {
			return `{${key}}`
		}

		return formatString(c, params)
	}

/**
 * Generic version of `useLanguage`. Do not use it. Use `useLanguage` from your fresh-lang.gen.ts file
 * @param initialLanguage Language used until the language cookie is read on the client's side. Optimally set this value using the `state.lang`
 */
export const helperUseLanguage = <Language extends string>(
	initialLanguage: Language,
): [Language, (v: Language) => void] =>
	(typeof document !== "undefined") ? useCookie("lang", initialLanguage) : [initialLanguage, () => {}]

/**
 * Parse cookies of a header
 * @param headers The headers instance to get cookies from
 * @return Object with cookie names as keys
 */
export function getCookies(headers: Headers): Record<string, string> {
	const cookie = headers.get("Cookie")
	if (cookie === null) {
		return {}
	}

	const res: Record<string, string> = {}
	for (const kv of cookie.split(";")) {
		const [cookieKey, ...cookieVal] = kv.split("=")
		if (cookieKey === undefined) {
			return {}
		}
		res[cookieKey.trim()] = cookieVal.join("=")
	}

	return res
}
