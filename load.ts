import Result, { Failure } from "@nihility-io/result"
import * as YAML from "@std/yaml"
import { Metadata, parseDefinition, TranslationDefinition } from "./models.ts"
import Record from "@nihility-io/record"

/**
 * Reads and parses a translation YAML file
 * @param path Path to the translation YAML
 */
const loadFile = async (file: string): Promise<Result<TranslationDefinition>> => {
	// Load and parse YAML
	const data = await Result.fromPromise(Deno.readTextFile(file).then(YAML.parse))
	if (!data.isSuccess()) {
		return data as Failure<TranslationDefinition>
	}

	return parseDefinition(data.value)
}

/**
 * Load and parse all translation YAML files
 * @param baseLanguage Default language
 * @param resolve Function that resolves a file name to a file URL
 */
export const loadFiles = async (
	baseLanguage: string,
	translationsFolder: URL,
): Promise<[Record<string, Record<string, string>>, Record<string, Metadata>]> => {
	const fs = await import("@std/fs")

	// Loop through all translation files
	const definitions: Record<string, TranslationDefinition> = {}
	for await (const f of fs.walk(translationsFolder, { maxDepth: 1, includeDirs: false, exts: [".yaml", ".yml"] })) {
		const tf = await loadFile(f.path)
		if (!tf.isSuccess()) {
			console.error((tf as Failure<unknown>).error)
			continue
		}

		definitions[tf.value.Metadata.Code] = tf.value
	}

	const metadata: Record<string, Metadata> = {}
	const translations: Record<string, Record<string, string>> = {}

	// Base language
	const base = definitions[baseLanguage].Translations

	// Loop through all translations and merge them with base in case other languages are incomplete translations
	for (const { Metadata, Translations } of Record.values(definitions)) {
		metadata[Metadata.Code] = Metadata
		translations[Metadata.Code] = Record.map(base, (k, v) => Translations[k] ? Translations[k] : v)
	}

	return [translations, metadata]
}
