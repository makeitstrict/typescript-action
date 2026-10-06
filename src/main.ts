import * as core from '@actions/core'

export function run(): void {
  try {
    const name = core.getInput('name', { required: true }).trim()
    if (name.length === 0) {
      throw new Error('name must not be empty')
    }

    const greeting = `Hello, ${name}!`
    core.info(greeting)
    core.setOutput('greeting', greeting)
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error))
  }
}
