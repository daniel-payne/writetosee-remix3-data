/**
 * Shared state store — persists values between separate test file processes
 * by reading/writing a temp JSON file (.test-state.json).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const STATE_FILE = '.test-state.json'

export interface TestState {
  email: string
  password: string
  tutorCode: string
  lessonCode: string
  sessionCookie: string
  classCookie: string
  manuscriptCode: string
}

const defaults: TestState = {
  email: '',
  password: '123ABC',
  tutorCode: '',
  lessonCode: '',
  sessionCookie: '',
  classCookie: '',
  manuscriptCode: '',
}

export function readState(): TestState {
  if (!existsSync(STATE_FILE)) return { ...defaults }
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8')) as TestState
  } catch {
    return { ...defaults }
  }
}

export function writeState(partial: Partial<TestState>): void {
  const current = readState()
  writeFileSync(STATE_FILE, JSON.stringify({ ...current, ...partial }, null, 2))
}

export function initState(): void {
  const email = `test${Math.floor(Math.random() * 100000)}@etl.com`
  writeFileSync(STATE_FILE, JSON.stringify({ ...defaults, email }, null, 2))
}

export function clearState(): void {
  if (existsSync(STATE_FILE)) {
    import('node:fs').then(fs => fs.unlinkSync(STATE_FILE))
  }
}
