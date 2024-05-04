# FreshLang
Basic implementation for multi language support with Fresh.

#### Warning
*__This is probably not a very good implementation for multi language support. It works my my use cases. You are free to use it too, if this implementation works for you as well.__*

## Usage
### Setup
1. Install the package using `deno add @nihility-io/fresh-lang`.
2. Create a folder named `translations` in the root of you project.
3. Add the following to you `deno.json`:
```json
{
	...
	"imports": {
        ...
		"lang": "./fresh-lang.gen.ts"
	},
    ...
}
```
4. Add the Fresh plugin to your `fresh.config.ts`:
```ts
import tailwind from "$fresh/plugins/tailwind.ts"
import { defineConfig } from "$fresh/server.ts"
import { LangPlugin } from "@nihility-io/fresh-lang"

export default defineConfig({
	plugins: [
		tailwind(),
		LangPlugin(import.meta, { baseLanguage: "en" }),
	],
})

```
5. Create your translation files e.g. `translations/en.yaml`:
```yaml
Metadata:
  NativeName: English
  EnglishName: English
  Code: en
  Author: Nihility.io
Translations:
  Home:
    Greeting: Hello, {{name}}!
```

### Using Translations
First let me explain how the language detection works. FreshLang determines the appropriate language by looking into each client request. At first it checks if there is a cookie named lang which specifies a supported language. If that is not the case, FreshLang checks if the Accept-Language header mentions any supported language. If this also fails it will use the base language you set.

The detected language is added to the request state. It's important that you use it. If you want to use translations inside islands or components, pass `lang` along using props.

Now you can add FreshLang to your routes. Here is an example:
```ts
import { useTranslation } from "lang"

export default ({ state: { lang } }: PageProps<unknown, { lang: string }>) => {
    const $ = useTranslation(lang)
    return (
        <h1>$("Home.Greeting", { name: "John Smith" })</h1>
    )
}
```