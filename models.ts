import Record, { type NestedRecord, type NestedRecordField } from "@nihility-io/record"
import Result from "@nihility-io/result"
import z from "zod"

export interface Metadata {
	NativeName: string
	EnglishName: string
	Code: string
	Author: string
}

export interface TranslationDefinition {
	Metadata: Metadata
	Translations: Record<string, string>
}

// deno-lint-ignore prefer-const
let NestedRecordField: z.ZodUnion<
	[z.ZodString, z.ZodLazy<z.ZodType<NestedRecord<string>, z.ZodTypeDef, NestedRecord<string>>>]
>
// deno-lint-ignore prefer-const
let NestedRecord: z.ZodType<NestedRecord<string>>

NestedRecordField = z.string().or(z.lazy(() => NestedRecord))
NestedRecord = z.record(z.string(), NestedRecordField)

const Metadata: z.ZodType = z.object({
	NativeName: z.string(),
	EnglishName: z.string(),
	Code: z.string().regex(/[a-z]{2}/),
	Author: z.string(),
}).strict()

const TranslationDefinition: z.ZodType = z.object({
	Metadata: Metadata,
	Translations: NestedRecord.transform((x) => Record.flatten<string>(x)),
}).strict()

export const parseDefinition = async (data: unknown): Promise<Result<TranslationDefinition>> => {
	// Parse data using Zod
	const res = await TranslationDefinition.safeParseAsync(data)
	if (!res.success) {
		return Result.failure<TranslationDefinition>(res.error)
	}

	return Result.success<TranslationDefinition>(res.data)
}
