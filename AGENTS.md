<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Development Guidelines & Invariants

### 1. File Encoding (UTF-8 Without BOM)
- Always write/generate source and configuration files (`.toml`, `.json`, `.kts`, `.xml`, `.tsx`, `.ts`) using standard **UTF-8 without BOM**.
- Avoid PowerShell's default `[System.Text.Encoding]::UTF8` as it injects `\ufeff` (BOM), which breaks Gradle and JSON parsers.

### 2. Localization & Translations
- Ensure all UI keys referenced via `t("...")` exist in `src/lib/prefs.tsx` in both Bengali (`bn`) and English (`en`).
- Prevent intrusive "Not Found" error banners on static routes (such as `/contact` or `/about`) when rendering content bodies.

### 3. Asset Processing
- For image mirror/flip or cropping requests, process the binary asset file directly (e.g. with `sharp`) in addition to any CSS styling, ensuring immediate effect across all viewports and cache layers.

### 4. Local Build Environment
- Java JDK 17: `C:\Users\Alam M\.tools\jdk-17.0.14+7`
- Android SDK: `C:\Users\Alam M\.tools\android-sdk`

