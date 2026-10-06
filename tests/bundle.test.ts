import { execFileSync, spawnSync } from 'node:child_process'
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Build outside dist/ so tests never repair a stale committed bundle.
let directory: string
beforeAll((): void => {
  directory = mkdtempSync(join(tmpdir(), 'typescript-action-'))
  execFileSync(process.execPath, [
    resolve('build.config.mjs'),
    join(directory, 'index.mjs'),
  ])
  copyFileSync(resolve('dist/index.js'), join(directory, 'committed.mjs'))
})
afterAll((): void => {
  if (typeof directory === 'string') {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe.each(['index.mjs', 'committed.mjs'])(
  'standalone bundle %s',
  (entry): void => {
    it.each([
      ['Ada', 'Hello, Ada!'],
      ['World', 'Hello, World!'],
      ['  Ada  ', 'Hello, Ada!'],
    ])('writes output for %j without node_modules', (name, greeting): void => {
      const output = join(directory, 'output')
      writeFileSync(output, '')
      const result = spawnSync(process.execPath, [join(directory, entry)], {
        cwd: directory,
        encoding: 'utf8',
        env: {
          ...process.env,
          INPUT_NAME: name,
          GITHUB_OUTPUT: output,
          NODE_PATH: '',
        },
      })
      expect(result.error).toBeUndefined()
      expect(result.status, result.stderr).toBe(0)
      expect(result.stdout).toContain(greeting)
      const contents = readFileSync(output, 'utf8')
      expect(contents).toMatch(/^greeting<<([^\r\n]+)\r?\n/)
      const firstLine = contents.split(/\r?\n/)[0]
      if (firstLine === undefined) {
        throw new Error('Missing greeting output header')
      }
      const delimiter = firstLine.slice('greeting<<'.length)
      expect(contents.replaceAll('\r\n', '\n')).toBe(
        `greeting<<${delimiter}\n${greeting}\n${delimiter}\n`,
      )
    })

    it.each(['', '   '])('fails for empty input %j', (name): void => {
      const output = join(directory, 'output')
      writeFileSync(output, '')
      const result = spawnSync(process.execPath, [join(directory, entry)], {
        cwd: directory,
        encoding: 'utf8',
        env: {
          ...process.env,
          INPUT_NAME: name,
          GITHUB_OUTPUT: output,
          NODE_PATH: '',
        },
      })
      expect(result.error).toBeUndefined()
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('::error::')
      expect(readFileSync(output, 'utf8')).toBe('')
    })
  },
)
