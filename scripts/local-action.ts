import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const debug = process.argv[2] === '--debug'
const envFile = process.argv[debug ? 3 : 2] ?? process.env['ENV_FILE'] ?? '.env'
if (!existsSync(envFile)) {
  console.error(
    'Missing env file. Copy .env.example to .env or pass a path with npm start -- /path/to/file.',
  )
  process.exit(1)
}

const entry = fileURLToPath(import.meta.resolve('@github/local-action'))
const require = createRequire(entry)
// Resolve the loader from local-action's own dependencies without downloading tools.
const loader = require.resolve('tsx/esm')
const child = spawn(
  process.execPath,
  [
    ...(debug ? ['--inspect-brk=127.0.0.1:9229'] : []),
    '--import',
    loader,
    entry,
    '.',
    'src/main.ts',
    resolve(envFile),
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_PACKAGE_MANAGER: 'npm',
      TARGET_ACTION_PATH: process.cwd(),
      NODE_NO_WARNINGS: '1',
    },
  },
)
child.on('error', (error): void => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', (code, signal): void => {
  process.exitCode = code ?? (signal !== null ? 1 : 0)
})
