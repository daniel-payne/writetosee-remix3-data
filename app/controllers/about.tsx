import type { BuildAction } from 'remix/fetch-router'
import { on, type Handle } from 'remix/ui'

import type { routes } from '../routes.ts'
import { Layout } from '../ui/layout.tsx'
import { render } from '../utils/render.tsx'

export const about: BuildAction<'GET', typeof routes.about> = {
  handler({ request }) {
    return render(<AboutPage />, request)
  },
}

function AboutPage(handle: Handle) {
  return () => (
    <Layout title="About - My Remix App">
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1>About This App</h1>
        <p>
          This is a simple Remix 3 application scaffolded with the new Remix architecture.
        </p>
        <p>
          It features a server-first approach using Web APIs and a unique component model.
        </p>
        <button
          mix={on('click', () => {
            alert('Hello from the About page!')
          })}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Click Me
        </button>
      </div>
    </Layout>
  )
}
