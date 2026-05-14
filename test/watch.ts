#!/usr/bin/env bun
/**
 * Watch runner — re-runs the integration suite whenever app/ files change.
 *
 * Usage:
 *   bun run test:watch
 *   TEST_BASE_URL=http://staging.example.com bun run test:watch
 */

import { watch } from 'node:fs'
import { spawnSync } from 'bun'

function runSuite() {
  spawnSync(['bun', 'test/run.ts'], {
    stdout: 'inherit',
    stderr: 'inherit',
    env: { ...process.env },
  })
}

// Run immediately on start
runSuite()

let debounce: ReturnType<typeof setTimeout> | null = null

watch('./app', { recursive: true }, (_event, filename) => {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => {
    console.clear()
    console.log(`\n🔄 ${filename} changed — re-running...\n`)
    runSuite()
  }, 400)
})

console.log('\n👀 Watching app/ for changes. Press Ctrl+C to stop.\n')
