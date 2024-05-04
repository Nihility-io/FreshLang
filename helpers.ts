import { useCookie } from "@nihility-io/use-cookie"

/**
 * Compile strings containing variables
 * @param template Template string
 * @param params Variables to replace
 * @example
 * formatString("Hello, {{name}}!", { name: "John Smith" }) // => "Hello, John Smith!"
 */
export const formatString = (template: string, params: Record<string, string>) => {
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
 * Generic version of `translate`. Do not use it. Use `translate` from your translations.gen.ts file
 * @param baseCode Language code of the base language
 * @param supportedLanguages List of supported languages
 * @param translations Translation map
 */
export const helperTranslate = <Language extends string, TranslationKey extends string>(
	baseCode: Language,
	supportedLanguages: Language[],
	translations: Translations<Language, TranslationKey>,
) =>
(lang: Language) =>
(key: TranslationKey, params: Record<string, string> = {}): string => {
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
 * Generic version of `useLanguage`. Do not use it. Use `useLanguage` from your translations.gen.ts file
 * @param initialLanguage Language used until the language cookie is read on the client's side. Optimally set this value using the `state.lang`
 */
export const helperUseLanguage = <Language extends string>(
	initialLanguage: Language,
): [Language, (v: Language) => void] =>
	(typeof document !== "undefined") ? useCookie("lang", initialLanguage) : [initialLanguage, () => {}]
