# TypeScript Action

A minimal template for GitHub Actions with Node.js 24, TypeScript, esbuild,
Vitest, ESLint and Prettier. npm manages dependencies and provides commands for
local development and CI.

## Setup

Use Node.js 24.12 or newer within the 24.x release line and npm. CI selects Node
24 explicitly. The devcontainer provides Node 24 and installs dependencies on
creation. `.npmrc` enables `engine-strict`, so npm refuses unsupported Node
versions.

```sh
npm ci
npm run check
npm run build
```

The action reads `name` (default: `World`), trims surrounding whitespace, logs
`Hello, <name>!` and returns it as the `greeting` output. Empty names fail the
step. GitHub supplies the default from `action.yml`; a direct process invocation
must set `INPUT_NAME` itself.

## Commands

Run `npm run` for the command list.

| Command                | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `npm ci`               | Install dependencies from the lockfile        |
| `npm run format`       | Format files                                  |
| `npm run format:check` | Check formatting                              |
| `npm run lint`         | Run typed ESLint; warnings fail               |
| `npm run lint:fix`     | Apply ESLint fixes explicitly                 |
| `npm run typecheck`    | Check source, tests and configuration types   |
| `npm test`             | Run Vitest                                    |
| `npm run test:watch`   | Watch tests                                   |
| `npm run coverage`     | Print coverage and write an LCOV report       |
| `npm run build`        | Build the standalone action and source map    |
| `npm run check`        | Check formatting, lint, types and tests       |
| `npm run check:ci`     | Check formatting, lint, types and coverage    |
| `npm run check-dist`   | Rebuild and compare dist with committed files |
| `npm start`            | Run source with local-action                  |
| `npm run debug`        | Start source with Node Inspector              |

`npm run check` stops at the first failing check without changing source.
`npm run check:ci` runs the same checks with coverage instead of ordinary tests.
`npm run build` writes only `dist/`. Coverage reports stay in the ignored
`coverage/` directory. All source modules except the entrypoint must reach 100%
statements, branches, functions and lines, including modules not imported by
tests. The entrypoint is verified through standalone bundle tests. Scripts and
configuration files are outside the coverage measurement.

## Code standard

TypeScript checks all source, tests, scripts and JS configurations with the same
strict settings. Indexed access can return `undefined`; optional properties do
not implicitly accept `undefined`; dictionary keys use bracket notation. Return
paths, switch fallthrough, overrides, unreachable code and unused labels are
checked as well.

The GitHub-installed `@mstrict-actions/dev-tools` package supplies the common
ESLint, Prettier, TypeScript and Vitest configurations. ESLint uses
`strictTypeChecked` and `stylisticTypeChecked`, followed by the project rules
and `eslint-config-prettier`. Every TypeScript function, including test and
event callbacks, needs an explicit return type. JavaScript configs use JSDoc and
`checkJs`. Conditions must be boolean. Promises must be awaited, returned or
have an explicit rejection handler; `void` alone does not handle rejection.
Async functions must perform async work. A switch over a union or enum must
handle all variants or provide a default.

Use `import type`, `const` where possible, and braces for control flow. Values
use camelCase and types use PascalCase; external object keys and environment
variable names retain their original spelling. Explicit `any` and unsafe use of
`any` are errors. Ordinary type assertions and non-null assertions are
forbidden; `as const` and `satisfies` are allowed.

Formatting uses two spaces, single quotes, no semicolons, trailing commas in
multiline constructs, an 80-column target, LF and wrapped Markdown prose.
Prettier handles formatting separately from ESLint.

Rare local lint exceptions require a comment explaining the reason and review.
Unused disable comments fail linting. Never disable the type-assertion or
non-null-assertion bans, and do not use TypeScript suppression comments to
bypass them. Tests follow the same rules; intentionally throwing a non-Error
value is a documented, local exception for an error-handling test.
Disable-comment policy is enforced through review, not an additional plugin.

Strict preset contents may change as typescript-eslint is updated. Review rule
changes with dependency updates rather than weakening project rules to make a
check pass. Compatible dependency ranges and the committed lockfile provide
reproducible CI installs; keep Vitest and its coverage provider aligned when
updating them.

## Local execution and debugging

```sh
cp .env.example .env
npm start
npm run debug
```

Edit `INPUT_NAME` in `.env`, or use `npm start -- /path/to/example.env`. Both
commands run `src/main.ts` through the installed `@github/local-action`. An
alternative env file also works with `npm run debug -- /path/to/example.env`, or
by setting `ENV_FILE`. Missing env files produce setup instructions.

`npm run debug` listens on `127.0.0.1:9229` and pauses before execution. Open
`chrome://inspect` in Chrome, attach to the Node process, set a breakpoint in
`src/main.ts`, and resume. No editor extension is required. Stop with Ctrl+C.

local-action emulates the GitHub Actions Toolkit. Its current core emulation is
based on core 2.x, while this action uses core 3.x. Tests also execute
standalone bundles with the real toolkit and a temporary `GITHUB_OUTPUT` file.

## Use the action

```yaml
steps:
  - uses: makeitstrict/typescript-action@v1
    id: greeting
    with:
      name: Ada
  - name: Print greeting
    env:
      GREETING: ${{ steps.greeting.outputs.greeting }}
    run: printf '%s\n' "$GREETING"
```

The `@v1` reference is an example for a published release. Until a release
exists, use a commit SHA that contains the built action. When you copy this
template, update the package metadata, action author and usage reference for
your repository.

## Build and CI

`src/index.ts` invokes the exported synchronous `run(): void` function in
`src/main.ts`. esbuild bundles source and runtime dependencies into
`dist/index.js`, targeting Node 24 ESM. Node built-ins remain external.
TypeScript checks types separately with `tsc --noEmit`.

Small configuration entrypoints live at the repository root so tools and editors
can find them automatically. Shared rules live in
[mstrict-actions/dev-tools](https://github.com/mstrict-actions/dev-tools),
installed from a fixed Git commit over HTTPS. Prettier uses the package
reference in `package.json`; TypeScript extends its base config. The dev-tools
package needs no build or registry publication. Update its commit reference and
lockfile to adopt a reviewed standard change. `tests/` contains unit and
standalone bundle tests; `scripts/` contains the local-action launcher and the
committed-bundle check. Configurations and the build script are plain ESM
JavaScript. The launcher scripts use native Node TypeScript support. Type
checking covers source, tests, scripts and JavaScript configurations.

Commit `dist/index.js` and its source map whenever source or runtime
dependencies change. Consumers run the committed bundle without installing npm
dependencies. Tests run both a fresh isolated bundle and the committed bundle
without access to this repository's `node_modules`.

```sh
npm run check
npm run build
# Review and commit source, package-lock.json and dist/ together.
npm run check-dist
```

`npm run check-dist` compares with the Git commit, so it fails until updated
dist files are committed. It detects modified, deleted and new files, including
staged files.

CI runs `npm run check:ci` and has separate source-check, dist-check and action
smoke-test jobs. The smoke test checks both an explicit name and the metadata
default. CodeQL runs separately; Dependabot checks npm and GitHub Actions
weekly. Dependencies use stable compatible versions. TypeScript currently stays
on 6.0.x to match typescript-eslint support.

## Release

After CI passes for the commit containing the current `dist/`, update the
version in `package.json` and its lockfile, commit it, and create a version tag:

```sh
git tag -a v1.0.0 -m 'v1.0.0'
git push origin v1.0.0
```

For the first release, create and push a matching major tag (`v1`). For
subsequent releases, move that major tag to the tested release commit and
explicitly push its update. Create a GitHub release for the version tag. These
are manual publishing steps; development commands do not publish or push.

## License

[MIT](LICENSE).
