import z from "zod"
import Record, { type NestedRecord, type NestedRecordField } from "@nihility-io/record"

// deno-lint-ignore prefer-const
let NestedRecordField: z.ZodUnion<
	[z.ZodString, z.ZodLazy<z.ZodType<NestedRecord<string>, z.ZodTypeDef, NestedRecord<string>>>]
>
// deno-lint-ignore prefer-const
let NestedRecord: z.ZodType<NestedRecord<string>>

NestedRecordField = z.string().or(z.lazy(() => NestedRecord))
NestedRecord = z.record(z.string(), NestedRecordField)

export const Metadata = z.object({
	NativeName: z.string(),
	EnglishName: z.string(),
	Code: z.string().regex(/[a-z]{2}/),
	Author: z.string(),
}).strict()

export interface Metadata extends z.infer<typeof Metadata> {}

export const TranslationDefinition = z.object({
	Metadata: Metadata,
	Translations: NestedRecord.transform((x) => Record.flatten<string>(x)),
}).strict()

export interface TranslationDefinition extends z.infer<typeof TranslationDefinition> {}
