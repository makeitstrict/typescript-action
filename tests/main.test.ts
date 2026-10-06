import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as core from '@actions/core'
import { run } from '../src/main.ts'

vi.mock(
  '@actions/core',
  (): Pick<typeof core, 'getInput' | 'info' | 'setOutput' | 'setFailed'> => ({
    getInput: vi.fn(),
    info: vi.fn(),
    setOutput: vi.fn(),
    setFailed: vi.fn(),
  }),
)

describe('greeting action', (): void => {
  beforeEach((): void => {
    vi.resetAllMocks()
    vi.mocked(core.getInput).mockReturnValue('World')
  })

  it.each([
    ['Ada', 'Hello, Ada!'],
    ['World', 'Hello, World!'],
    ['  Ada  ', 'Hello, Ada!'],
  ])('greets %j', (name, greeting): void => {
    vi.mocked(core.getInput).mockReturnValue(name)
    run()
    expect(core.getInput).toHaveBeenCalledWith('name', { required: true })
    expect(core.info).toHaveBeenCalledWith(greeting)
    expect(core.setOutput).toHaveBeenCalledWith('greeting', greeting)
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it.each(['', '   '])('rejects empty name %j', (name): void => {
    vi.mocked(core.getInput).mockReturnValue(name)
    run()
    expect(core.setFailed).toHaveBeenCalledWith('name must not be empty')
    expect(core.setOutput).not.toHaveBeenCalled()
  })

  it.each([new Error('input unavailable'), 'input unavailable'])(
    'reports a thrown value %j',
    (error): void => {
      vi.mocked(core.getInput).mockImplementation((): never => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- Verify toolkit handling of non-Error thrown values.
        throw error
      })
      run()
      expect(core.setFailed).toHaveBeenCalledWith('input unavailable')
      expect(core.setOutput).not.toHaveBeenCalled()
    },
  )

  it('reports output failures', (): void => {
    vi.mocked(core.setOutput).mockImplementation((): never => {
      throw new Error('output unavailable')
    })
    run()
    expect(core.setFailed).toHaveBeenCalledWith('output unavailable')
  })
})
