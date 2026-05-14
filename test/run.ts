#!/usr/bin/env bun
/**
 * Test runner — executes integration test steps in order.
 *
 * Usage:
 *   bun test/run.ts
 *   TEST_BASE_URL=http://staging.example.com bun test/run.ts
 *
 * Each step runs as a separate `bun test` process. State is threaded between
 * steps via .test-state.json. The file is initialised fresh on every run and
 * cleaned up when all steps pass (or left behind on failure for inspection).
 */

import { spawnSync } from 'bun'
import { existsSync, unlinkSync, writeFileSync } from 'node:fs'

console.clear();

const STATE_FILE = '.test-state.json'

// Ordered list of test files to run
const steps = [
  './test/steps/1-add-tutor.step.ts',
  './test/steps/2-open-session.step.ts',
  './test/steps/3-close-session.step.ts',
  './test/steps/4-add-lesson.step.ts',
  './test/steps/5-retrieve-lessons.step.ts',
  './test/steps/6-update-lesson.step.ts',
  './test/steps/7-activate-class.step.ts',
  './test/steps/8-retrieve-class.step.ts',
]

// Initialise a fresh state file with a random test email
const email = `test${Math.floor(Math.random() * 100000)}@etl.com`
writeFileSync(STATE_FILE, JSON.stringify({ email, password: '123ABC', tutorCode: '', lessonCode: '', sessionCookie: '', classCookie: '' }, null, 2))

console.log(`\n🧪 Running integration suite against ${process.env.TEST_BASE_URL ?? 'http://localhost:44100'}\n`)

let failed = false

for (const step of steps) {
  const result = spawnSync(['bun', 'test', step], {
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env },
  })

  const output = [result.stdout, result.stderr]
    .map(b => (b ? Buffer.isBuffer(b) ? b.toString() : String(b) : ''))
    .join('')

  if (result.exitCode !== 0) {
    // Print full output so the error is visible
    process.stdout.write(output)
    console.error(`\n❌ Step failed: ${step}\n`)
    failed = true
    break
  }

  // When piped, bun outputs "(pass)" / "(fail)" instead of unicode ✓/✗
  const lines = output.split('\n')
  const passLines = lines.filter(l => l.includes('(pass)') || l.includes('✓'))
  for (const line of passLines) {
    const cleaned = line.trim().replace(/^\(pass\)\s*/, '').trim()
    const suffix = cleaned.includes('add-tutor') ? `  (${email})` : ''
    console.log(`  ✓ ${cleaned}${suffix}`)
  }
}

if (!failed) {
  console.log('\n✅ All steps passed.\n')
  try { unlinkSync(STATE_FILE) } catch { /* ignore */ }
}

process.exit(failed ? 1 : 0)
