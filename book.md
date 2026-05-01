# Remix 3 — A Practical Developer's Guide

> A living book. Ask for more depth on any chapter and it will be expanded.

---

## Table of Contents

1. [What Is Remix 3?](#1-what-is-remix-3)
2. [Project Layout](#2-project-layout)
3. [Routes — The URL Contract](#3-routes--the-url-contract)
4. [Controllers & Actions](#4-controllers--actions)
5. [Middleware & Server Setup](#5-middleware--server-setup)
6. [Data Access & Validation](#6-data-access--validation)
7. [Auth & Sessions](#7-auth--sessions)
8. [The Component Model](#8-the-component-model)
9. [Testing](#9-testing)
10. [Common Mistakes to Avoid](#10-common-mistakes-to-avoid)
11. [Static Sites with Remix](#11-static-sites-with-remix)
12. [Quick Package Reference](#12-quick-package-reference)

---

## 1. What Is Remix 3?

Remix 3 is a **server-first web framework** built entirely on standard Web APIs — `Request`, `Response`, `URL`, `FormData`. There is no magic framework runtime; everything maps to things the platform already does.

### The Four Pillars

| Pillar | What it does |
|---|---|
| **Routes** (`app/routes.ts`) | Declares the typed URL surface of the app |
| **Controllers / Actions** | Handles requests and returns `Response` objects |
| **Middleware** | Composes request lifecycle — sessions, auth, database |
| **Components** (`remix/ui`) | Renders UI — **not React**, a different model |

### Key Import Rule

There is **no top-level `remix` import**. Everything comes from subpaths:

```typescript
// ✅ Correct
import { createRouter } from 'remix/fetch-router'
import { redirect } from 'remix/response/redirect'
import { session } from 'remix/session-middleware'

// ❌ Wrong — will break
import { createRouter } from 'remix'
```

### The Mental Model

Think of a Remix app as a typed pipeline:

```
Request → Middleware Stack → Router → Controller Action → Response
```

The server path must be correct **before** you add browser interactivity. Always make the route return the right `Response` first.

---

## 2. Project Layout

```
my-app/
├── app/                    ← All runtime application code
│   ├── assets/             ← Client entrypoints, browser-owned behavior
│   ├── controllers/        ← Route handlers and route-local UI
│   ├── data/               ← Schema, queries, migrations, DB setup
│   ├── middleware/         ← Auth, sessions, uploads, DB injection
│   ├── ui/                 ← Shared cross-route UI components
│   ├── utils/              ← Last-resort cross-layer helpers only
│   ├── routes.ts           ← The URL contract (source of truth)
│   └── router.ts           ← Wires routes to controllers
├── db/                     ← Migration files and local DB files
├── public/                 ← Static assets served as-is
├── test/                   ← Shared helpers, fixtures, integration tests
└── tmp/                    ← Uploads, caches, session files
```

### Where Does My Code Go?

Use this decision tree:

1. **Does it belong to one route?** → Put it next to that controller.
2. **Is it shared UI across routes?** → `app/ui/`
3. **Is it request lifecycle setup?** → `app/middleware/`
4. **Is it schema, queries, or DB logic?** → `app/data/`
5. **None of the above?** → `app/utils/` as a last resort.

### Anti-Patterns

- ❌ `app/lib/` — generic dumping ground, don't create it
- ❌ `app/components/` — `app/ui/` already owns this role
- ❌ Putting shared UI inside `app/controllers/`
- ❌ Creating folders for simple leaf actions that don't need them

---

## 3. Routes — The URL Contract

`app/routes.ts` is the **single source of truth** for every URL in your app. Define routes here first, before writing any handlers.

### Basic Route Definition

```typescript
import { form, get, post, resources, route } from 'remix/fetch-router/routes'

export const routes = route({
  home: '/',                         // any method, absolute path
  contact: form('contact'),          // GET + POST pair at /contact
  books: {
    index: '/books',
    show: '/books/:slug',
  },
  auth: route('auth', {             // /auth prefix for all children
    login: form('login'),           // GET /auth/login, POST /auth/login
    logout: post('logout'),         // POST /auth/logout
  }),
  admin: route('admin', {
    index: get('/'),
    books: resources('books', { param: 'bookId' }),
  }),
})
```

### Route Builders

| Builder | HTTP | Result |
|---|---|---|
| `'/'` (string) | ANY | Matches any method |
| `get(path)` | GET | GET only |
| `post(path)` | POST | POST only |
| `put(path)` | PUT | PUT only |
| `del(path)` | DELETE | DELETE only |
| `form(path)` | GET + POST | Creates `.index` and `.action` leaves |
| `resources(name)` | CRUD | Creates `index`, `new`, `create`, `show`, `edit`, `update`, `destroy` |

### Generating URLs with `.href()`

Never hand-write URLs. Use the typed `.href()` method:

```typescript
redirect(routes.home.href())
redirect(routes.books.show.href({ slug: 'my-book' }))
redirect(routes.auth.login.href())
```

This means if you rename a route, every `.href()` call breaks at compile time — a good thing.

---

## 4. Controllers & Actions

### What Is a Controller?

A controller is an object whose `actions` keys mirror the route map. It handles requests and **always returns a `Response`**.

```typescript
import type { Controller } from 'remix/fetch-router'
import type { AppContext } from '../router.ts'
import { routes } from '../routes.ts'

export default {
  actions: {
    async index({ get }) {
      let db = get(Database)
      let books = await db.findMany(booksTable, { orderBy: ['id', 'asc'] })
      return render(<BooksPage books={books} />)
    },

    async show({ get, params }) {
      let db = get(Database)
      let book = await db.findOne(booksTable, { where: { slug: params.slug } })
      if (!book) return new Response('Not Found', { status: 404 })
      return render(<BookPage book={book} />)
    },
  },
} satisfies Controller<typeof routes.books, AppContext>
```

### What an Action Receives

Every action handler gets a context object:

| Property | What it gives you |
|---|---|
| `get(Key)` | A value set by middleware (Database, Session, Auth, FormData) |
| `params` | Typed URL params (e.g. `params.slug`) |
| `url` | The full `URL` object |
| `request` | The raw `Request` |

### Returning Responses

**Render HTML:**
```typescript
return render(<MyPage data={data} />)
```

**Redirect after a mutation (POST → Redirect → GET):**
```typescript
import { redirect } from 'remix/response/redirect'
return redirect(routes.books.index.href(), 303)
```

**Return an error:**
```typescript
if (!book) return new Response('Not Found', { status: 404 })
```

**Re-render a form with validation errors:**
```typescript
let parsed = s.parseSafe(bookSchema, get(FormData))
if (!parsed.success) {
  return render(<NewBookPage errors={parsed.issues} />, { status: 400 })
}
```

**Return JSON** (for API endpoints):
```typescript
return new Response(JSON.stringify({ results }), {
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
})
```

### Registering Routes in `router.ts`

```typescript
import { createRouter } from 'remix/fetch-router'
import { routes } from './routes.ts'
import booksController from './controllers/books/controller.tsx'
import homeController from './controllers/home.tsx'

export const router = createRouter({ middleware })

router.map(routes.books, booksController)  // map = controller with actions
router.map(routes.home, homeController)
router.post(routes.auth.logout, logoutAction)  // single action
```

### Flat vs Folder Controllers

- **Flat file** — `app/controllers/home.tsx` for simple leaf routes
- **Folder** — `app/controllers/books/controller.tsx` when a route has nested routes, multiple actions, or route-local modules

Promote a flat file to a folder only when it genuinely needs it.

---

## 5. Middleware & Server Setup

Middleware is a function `(context, next) => Response`. It runs in order for every request.

### The Golden Rule of Ordering

> **Fast exits first, request enrichment later.**

```typescript
// Recommended order
middleware.push(logger())          // dev only — see requests
middleware.push(compression())     // compress responses
middleware.push(staticFiles('./public'))  // fast-exit for static files
middleware.push(formData())        // parse request bodies
middleware.push(methodOverride())  // allow PUT/DELETE from forms
middleware.push(session(cookie, storage))  // session must come before auth
middleware.push(asyncContext())    // lets helpers call getContext()
middleware.push(loadDatabase())    // inject DB into context
middleware.push(loadAuth())        // resolve identity
```

### Built-in Middleware Catalog

| Middleware | Import | When to use |
|---|---|---|
| `staticFiles(dir)` | `remix/static-middleware` | Serve `public/` |
| `compression()` | `remix/compression-middleware` | Compress text responses |
| `logger()` | `remix/logger-middleware` | Dev request logging |
| `formData()` | `remix/form-data-middleware` | Parse form bodies once |
| `methodOverride()` | `remix/method-override-middleware` | PUT/DELETE from HTML forms |
| `session(cookie, storage)` | `remix/session-middleware` | Cookie-backed sessions |
| `csrf()` | `remix/csrf-middleware` | CSRF protection |
| `asyncContext()` | `remix/async-context-middleware` | `getContext()` in helpers |
| `cors()` | `remix/cors-middleware` | Cross-origin endpoints |
| `auth({ schemes })` | `remix/auth-middleware` | Resolve identity to context |
| `requireAuth()` | `remix/auth-middleware` | Gate a controller or action |

### Writing Custom Middleware

```typescript
import type { Middleware } from 'remix/fetch-router'
import { Database } from 'remix/data-table'

export function loadDatabase(): Middleware {
  return async (context, next) => {
    context.set(Database, db)   // makes db available via get(Database)
    return next()               // continue the chain
  }
}
```

### Middleware Levels

Middleware can be applied at three scopes:

```typescript
// 1. Router-level — every request
let router = createRouter({ middleware: [...] })

// 2. Controller-level — all actions in the subtree
export default {
  middleware: [requireAuth()],
  actions: { ... },
} satisfies Controller<typeof routes.account>

// 3. Action-level — single route
router.get(routes.account, {
  middleware: [requireAuth()],
  handler: accountAction.handler,
})
```

### The AppContext Type

Define a typed context so `get(Database)`, `get(Session)`, `get(Auth)` are fully typed everywhere:

```typescript
// app/router.ts
import type { AnyParams, MiddlewareContext, WithParams } from 'remix/fetch-router'

type RootMiddleware = [
  ReturnType<typeof formData>,
  ReturnType<typeof session>,
  ReturnType<typeof loadDatabase>,
  ReturnType<typeof loadAuth>,
]

export type AppContext<params extends AnyParams = AnyParams> = WithParams<
  MiddlewareContext<RootMiddleware>,
  params
>
```

### Node Server Setup

```typescript
// server.ts
import * as http from 'node:http'
import { createRequestListener } from 'remix/node-fetch-server'
import { router } from './app/router.ts'

let server = http.createServer(
  createRequestListener(async (request) => {
    try {
      return await router.fetch(request)
    } catch (error) {
      console.error(error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }),
)

let port = Number(process.env.PORT) || 3000
server.listen(port, () => console.log(`http://localhost:${port}`))
```

### Bun Server Setup

Bun natively speaks the Fetch API, so no adapter is needed — `router.fetch()` plugs straight into `Bun.serve()`:

```typescript
// server.ts
import { router } from './app/router.ts'

const port = Number(process.env.PORT) || 3000

Bun.serve({
  port,
  async fetch(request) {
    try {
      return await router.fetch(request)
    } catch (error) {
      console.error(error)
      return new Response('Internal Server Error', { status: 500 })
    }
  },
})

console.log(`http://localhost:${port}`)
```

The key difference: Node needs `createRequestListener` to bridge its `http` module to the Fetch API. Bun doesn't — its server handler already receives a `Request` and expects a `Response` back.

---

## 6. Data Access & Validation

### Defining Tables

```typescript
// app/data/schema.ts
import { column as c, table } from 'remix/data-table'
import type { TableRow } from 'remix/data-table'

export const books = table({
  name: 'books',
  columns: {
    id:     c.integer().primaryKey().autoIncrement(),
    slug:   c.text().notNull().unique(),
    title:  c.text().notNull(),
    price:  c.decimal(10, 2).notNull(),
  },
})

export type Book = TableRow<typeof books>
```

### Common Column Types

| Method | SQL type |
|---|---|
| `c.integer()` | INTEGER |
| `c.text()` | TEXT |
| `c.boolean()` | BOOLEAN |
| `c.decimal(p, s)` | DECIMAL |
| `c.enum([...])` | TEXT (enum) |
| `c.uuid()` | UUID / TEXT |

Modifiers: `.primaryKey()`, `.autoIncrement()`, `.notNull()`, `.unique()`, `.references(table, col)`, `.default(value)`

### Database Setup

```typescript
// app/data/db.ts
import BetterSqlite3 from 'better-sqlite3'
import { createDatabase } from 'remix/data-table'
import { createSqliteDatabaseAdapter } from 'remix/data-table-sqlite'

let sqlite = new BetterSqlite3('./db/app.db')
sqlite.pragma('foreign_keys = ON')
export let db = createDatabase(createSqliteDatabaseAdapter(sqlite))
```

### Querying

```typescript
let db = get(Database)

let all    = await db.findMany(books, { orderBy: ['id', 'asc'] })
let one    = await db.find(books, id)
let bySlug = await db.findOne(books, { where: { slug: 'my-book' } })
let count  = await db.count(books, { where: { in_stock: true } })
let new_   = await db.create(books, { slug: 'x', title: 'X', price: 9.99 })
             await db.update(books, id, { title: 'Updated' })
             await db.delete(books, id)
```

### Migrations

```typescript
// db/migrations/20260501120000_create_books.ts
import { column as c, createMigration } from 'remix/data-table/migrations'
import { table } from 'remix/data-table'

export default createMigration({
  async up({ schema }) {
    let books = table({ name: 'books', columns: { id: c.integer().primaryKey().autoIncrement(), slug: c.text().notNull() } })
    await schema.createTable(books)
  },
  async down({ schema }) {
    await schema.dropTable('books')
  },
})
```

Run migrations on startup:

```typescript
import { createMigrationRunner } from 'remix/data-table/migrations'
import { loadMigrations } from 'remix/data-table/migrations/node'

let migrations = await loadMigrations('./db/migrations')
await createMigrationRunner(adapter, migrations).up()
```

### Input Validation

Never trust input from forms, query strings, or external sources. Always parse first.

**Validating plain objects:**
```typescript
import * as s from 'remix/data-schema'
import { email, minLength } from 'remix/data-schema/checks'

let userSchema = s.object({
  name:  s.string().pipe(minLength(1)),
  email: s.string().pipe(email()),
  age:   s.optional(s.number()),
})
```

**Validating FormData (recommended for form actions):**
```typescript
import * as s from 'remix/data-schema'
import * as f from 'remix/data-schema/form-data'

let bookSchema = f.object({
  slug:  f.field(s.string().pipe(minLength(1))),
  title: f.field(s.string().pipe(minLength(1))),
  price: f.field(coerce.coerceNumber()),
})
```

**Safe parsing (returns a result, doesn't throw):**
```typescript
let parsed = s.parseSafe(bookSchema, get(FormData))
if (!parsed.success) {
  // parsed.issues contains the errors to show the user
  return render(<NewBookPage errors={parsed.issues} />, { status: 400 })
}
let { slug, title } = parsed.value  // fully typed
```

> Use `parseSafe` in actions. Validation failure is an *expected outcome*, not an exception.

---

## 7. Auth & Sessions

### Sessions vs Plain Cookies

| Situation | Use |
|---|---|
| Theme, locale, dismissed banner | `remix/cookie` — browser controls it |
| Login state, cart, flash messages | `remix/session` — server-managed, tamper-resistant |
| Identity that survives cookie clearing | Auth provider + account in database |

### Session Setup

```typescript
// app/middleware/session.ts
import { createCookie } from 'remix/cookie'
import { createFsSessionStorage } from 'remix/session/fs-storage'

let secret = process.env.SESSION_SECRET
if (!secret && process.env.NODE_ENV !== 'test') {
  throw new Error('SESSION_SECRET is required')
}

export let sessionCookie = createCookie('session', {
  secrets: [secret ?? 'test-only-secret'],
  httpOnly: true,      // always
  sameSite: 'Lax',    // default
  secure: process.env.NODE_ENV === 'production',
  maxAge: 2592000,     // 30 days
})

export let sessionStorage = createFsSessionStorage('./tmp/sessions')
```

Wire into the middleware stack:
```typescript
import { session } from 'remix/session-middleware'
middleware.push(session(sessionCookie, sessionStorage))
```

### Using Sessions in Actions

```typescript
import { Session } from 'remix/session'

let session = get(Session)

session.get('userId')                  // read
session.set('userId', 42)              // write
session.flash('message', 'Saved!')     // write-once flash
session.unset('userId')                // remove
session.regenerateId(true)             // rotate ID (use after login/logout)
```

### Credentials Login Flow

```typescript
// Login action
import { verifyCredentials, completeAuth } from 'remix/auth'
import { redirect } from 'remix/response/redirect'

async action(context) {
  let user = await verifyCredentials(passwordProvider, context)

  if (!user) {
    let session = context.get(Session)
    session.flash('error', 'Invalid email or password.')
    return redirect(routes.auth.login.href())
  }

  let session = completeAuth(context)
  session.set('auth', { userId: user.id })
  session.regenerateId(true)
  return redirect(routes.home.href())
}
```

### Protecting Routes

```typescript
import { requireAuth } from 'remix/auth-middleware'

// Protect an entire controller subtree
export default {
  middleware: [requireAuth()],
  actions: { /* all actions require login */ },
} satisfies Controller<typeof routes.account>
```

```typescript
// Redirect to login on failure
import { requireAuth } from 'remix/auth-middleware'
import { redirect } from 'remix/response/redirect'

export function requireAuthRedirect() {
  return requireAuth({
    onFailure(context) {
      let returnTo = encodeURIComponent(context.url.pathname)
      return redirect(routes.auth.login.href() + `?returnTo=${returnTo}`, 303)
    },
  })
}
```

---

## 8. The Component Model

> ⚠️ **Remix Component is not React.** Do not reach for hooks. The model is different.

### The Two Phases

Every Remix component is a function that runs **once** (setup) and returns a render function that runs on every update. This is the biggest mental shift from React.

```typescript
import { on, type Handle } from 'remix/ui'

function Counter(handle: Handle<{ initialCount?: number; label: string }>) {
  // === SETUP PHASE — runs once when the component mounts ===
  let count = handle.props.initialCount ?? 0

  // === RENDER PHASE — this function runs on every update ===
  return () => (
    <button
      mix={on('click', () => {
        count++
        handle.update()   // schedule a re-render
      })}
    >
      {handle.props.label}: {count}
    </button>
  )
}
```

### Key Rules

- State lives in **setup-scope variables**, not a state hook.
- Read props as `handle.props.name` (not destructured at setup — values change between renders).
- Call `handle.update()` to schedule a re-render after state changes.
- Do DOM work in **event handlers** or `handle.queueTask(...)`, not in render.
- Derived values (computed from state) go inside the **render function**.

---

### React → Remix: Side-by-Side Examples

#### `useState` → setup-scope variable

React:
```tsx
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

Remix:
```tsx
function Counter(handle: Handle) {
  let count = 0   // plain variable, lives in setup scope

  return () => (
    <button mix={on('click', () => { count++; handle.update() })}>
      {count}
    </button>
  )
}
```

> There is no `setState`. Mutate the variable directly, then call `handle.update()`.

---

#### `useEffect` (on mount) → setup body

React:
```tsx
function Logger() {
  useEffect(() => {
    console.log('mounted')
    return () => console.log('unmounted')
  }, [])
  return <div>Hello</div>
}
```

Remix:
```tsx
function Logger(handle: Handle) {
  // Setup body runs once — this IS your mount effect
  console.log('mounted')
  handle.signal.addEventListener('abort', () => console.log('unmounted'))

  return () => <div>Hello</div>
}
```

> The setup body replaces `useEffect(() => ..., [])`. Cleanup goes on `handle.signal`.

---

#### `useEffect` (on dependency change) → check inside render + `queueTask`

React:
```tsx
function UserCard({ userId }: { userId: number }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setUser(data) })
    return () => { cancelled = true }
  }, [userId])

  return <div>{user?.name ?? 'Loading...'}</div>
}
```

Remix:
```tsx
function UserCard(handle: Handle<{ userId: number }>) {
  let user: any = null
  let lastUserId: number | null = null

  return () => {
    // Detect the dependency change inside render
    if (lastUserId !== handle.props.userId) {
      lastUserId = handle.props.userId
      user = null

      handle.queueTask(async (signal) => {
        let res = await fetch(`/api/users/${handle.props.userId}`, { signal })
        let data = await res.json()
        if (signal.aborted) return
        user = data
        handle.update()
      })
    }

    return <div>{user?.name ?? 'Loading...'}</div>
  }
}
```

> `queueTask` receives an `AbortSignal` that cancels automatically on re-render or unmount — no manual `cancelled` flag needed.

---

#### `useRef` → plain setup-scope variable

React:
```tsx
function InputFocus() {
  const inputRef = useRef<HTMLInputElement>(null)
  return <input ref={inputRef} onFocus={() => inputRef.current?.select()} />
}
```

Remix:
```tsx
import { ref, on, type Handle } from 'remix/ui'

function InputFocus(handle: Handle) {
  let inputEl: HTMLInputElement | null = null

  return () => (
    <input
      mix={[
        ref((el) => { inputEl = el as HTMLInputElement }),
        on('focus', () => inputEl?.select()),
      ]}
    />
  )
}
```

> Use `ref(callback)` from `remix/ui` to capture DOM elements. It's a mixin, not a hook.

---

#### `useContext` → `handle.context.get(Provider)`

React:
```tsx
const ThemeContext = createContext('light')

function ThemedButton() {
  const theme = useContext(ThemeContext)
  return <button className={theme}>Click</button>
}
```

Remix:
```tsx
function ThemeProvider(handle: Handle<{ children?: RemixNode }>) {
  let theme: 'light' | 'dark' = 'light'
  handle.context.set({ theme })

  return () => (
    <div>
      <button mix={on('click', () => {
        theme = theme === 'light' ? 'dark' : 'light'
        handle.context.set({ theme })
        handle.update()
      })}>Toggle</button>
      {handle.props.children}
    </div>
  )
}

function ThemedButton(handle: Handle) {
  return () => {
    let { theme } = handle.context.get(ThemeProvider)
    return <button class={theme}>Click</button>
  }
}
```

> `handle.context.set()` does **not** trigger updates automatically — call `handle.update()` after setting.

---

#### `useMemo` → derive in render, no hook needed

React:
```tsx
function FilteredList({ items, filter }: Props) {
  const filtered = useMemo(
    () => items.filter(i => i.includes(filter)),
    [items, filter]
  )
  return <ul>{filtered.map(i => <li key={i}>{i}</li>)}</ul>
}
```

Remix:
```tsx
function FilteredList(handle: Handle<{ items: string[]; filter: string }>) {
  return () => {
    // Derive directly in render — no memoization hook needed
    let filtered = handle.props.items.filter(i =>
      i.includes(handle.props.filter)
    )
    return <ul>{filtered.map(i => <li>{i}</li>)}</ul>
  }
}
```

> The Remix model doesn't have the double-render issues that motivate `useMemo` in React. Derive directly in the render function.

---

#### Global event listener → `addEventListeners` with `handle.signal`

React:
```tsx
function WindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return <div>{width}px</div>
}
```

Remix:
```tsx
import { addEventListeners, type Handle } from 'remix/ui'

function WindowWidth(handle: Handle) {
  let width = window.innerWidth

  addEventListeners(window, handle.signal, {
    resize() {
      width = window.innerWidth
      handle.update()
    },
  })

  return () => <div>{width}px</div>
}
```

> `addEventListeners` removes the listener automatically when the component unmounts. No cleanup function needed.

---

### The Handle API

| API | React equivalent | What it does |
|---|---|---|
| `handle.props` | component props | Current JSX props — always up to date |
| `handle.update()` | `setState(...)` | Schedule a re-render |
| `handle.queueTask(fn)` | `useEffect` + cleanup | Run after next render; auto-aborted on unmount |
| `handle.signal` | `useEffect` return fn | `AbortSignal` aborted when component is removed |
| `handle.id` | `useId()` | Stable unique ID per instance |
| `handle.context.get(P)` | `useContext(C)` | Read a value from an ancestor component |
| `handle.context.set(v)` | `createContext` | Provide values to descendants |
| `handle.frame.reload()` | — | Reload the containing `<Frame>` |

### When to Use `clientEntry`

Only add browser-side hydration when the component truly needs the browser:

```typescript
// Only when you need interactivity or browser-only APIs
clientEntry(Counter)
run(Counter, { label: 'Clicks', initialCount: 0 })
```

**Server-rendered output is the default.** Don't add `clientEntry` before the server route is correct.

---

## 9. Testing

### The Two Test Shapes

1. **Router / server tests** — drive the router with `router.fetch(new Request(...))`, assert on the `Response`.
2. **Component tests** — render into a real DOM, interact, assert.

Prefer router tests. Most behavior is HTTP behavior.

### Router Test Example

```typescript
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { createBookstoreRouter } from '../app/router.ts'
import { routes } from '../app/routes.ts'

describe('books index', () => {
  it('returns 200 with a list of books', async () => {
    let router = createBookstoreRouter()
    let response = await router.fetch(
      new Request('http://localhost' + routes.books.index.href())
    )

    assert.equal(response.status, 200)
    assert.match(await response.text(), /My Book Title/)
  })
})
```

**Key practices:**
- Build a **fresh router per test** — keeps sessions, storage, and DB state isolated.
- Always use `routes.name.href()` — never hand-write URLs in tests.
- For auth scenarios, inject `createMemorySessionStorage()` and a test cookie.

### Component Test Example

```typescript
import * as assert from 'remix/assert'
import { render } from 'remix/ui/test'

let result = render(<Counter label="Clicks" />)

let button = result.$('button')!
await result.act(() => button.click())

assert.match(result.container.textContent ?? '', /1/)
result.cleanup()
```

### Test Runner Config (`remix-test.config.ts`)

```typescript
export default {
  glob: {
    test: '**/*.test{,.e2e}.{ts,tsx}',
    exclude: 'node_modules/**',
  },
  coverage: {
    dir: '.coverage',
    include: ['app/**/*.{ts,tsx}'],
    statements: 80,
    lines: 80,
  },
}
```

Run tests: `remix test` | With coverage: `remix test --coverage`

---

## 10. Common Mistakes to Avoid

| ❌ Mistake | ✅ Fix |
|---|---|
| `import { x } from 'remix'` | Always import from subpaths: `remix/fetch-router` |
| Adding `clientEntry` before server route works | Make the server route return the right Response first |
| Treating Remix Component like React (hooks, implicit rerender) | Use setup-scope state + `handle.update()` |
| Passing functions or class instances into `clientEntry` props | Only serializable values allowed |
| Calling `getContext()` without `asyncContext()` in the stack | Add `asyncContext()` middleware before any code that calls it |
| Trusting raw `FormData`, params, or cookies | Parse and validate at the boundary with `data-schema` |
| Throwing custom errors for validation/not-found | Return a `Response` — expected outcomes are return values, not exceptions |
| Using `createCookie` for login state | Use `remix/session` — it's tamper-resistant |
| Building JSON-only mutation endpoints | Use redirect-after-POST with a normal form action |
| Skipping resource-level authorization after `requireAuth` | Auth ≠ Authorization. Still check ownership inside handlers |
| Dumping shared code into `utils.ts` / `helpers.ts` | Find the real owner: `app/middleware/`, `app/data/`, `app/ui/` |
| Writing only component tests for route behavior | Route behavior = router test, not component test |

---

## 11. Static Sites with Remix

Remix is server-first, but nothing stops you from pre-rendering routes to plain HTML files at build time and serving them from a CDN or static host (Nginx, GitHub Pages, Netlify, etc.). The approach is straightforward: spin up the router, fetch each route as if it were a real request, and write the response body to disk.

### The Core Idea

Because a Remix route handler is just `(Request) => Promise<Response>`, you can call it from a build script without running a real HTTP server:

```typescript
// scripts/build-static.ts
import { router } from '../app/router.ts'
import { routes } from '../app/routes.ts'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const OUT_DIR = './dist'

async function renderRoute(path: string, filename: string) {
  let request = new Request(`http://localhost${path}`)
  let response = await router.fetch(request)

  if (!response.ok) {
    console.warn(`⚠️  ${path} → ${response.status}`)
    return
  }

  let html = await response.text()
  let outPath = join(OUT_DIR, filename)
  await mkdir(join(OUT_DIR, filename, '..'), { recursive: true })
  await writeFile(outPath, html, 'utf8')
  console.log(`✓  ${path} → ${outPath}`)
}

await renderRoute(routes.home.href(),        'index.html')
await renderRoute(routes.about.href(),       'about/index.html')
await renderRoute(routes.contact.href(),     'contact/index.html')
```

Run with:

```bash
npx tsx scripts/build-static.ts
```

### Pre-rendering Dynamic Routes

For routes with params (e.g. `/books/:slug`), fetch the list of slugs from your database first, then loop:

```typescript
import { db } from '../app/data/db.ts'
import { books } from '../app/data/schema.ts'

let allBooks = await db.findMany(books, { orderBy: ['slug', 'asc'] })

for (let book of allBooks) {
  let path = routes.books.show.href({ slug: book.slug })
  await renderRoute(path, `books/${book.slug}/index.html`)
}
```

### Copying Static Assets

Static assets in `public/` can be copied as-is:

```typescript
import { cp } from 'node:fs/promises'
await cp('./public', OUT_DIR, { recursive: true })
```

### Handling Data at Build Time vs Runtime

| Scenario | Approach |
|---|---|
| Content rarely changes (blog, docs) | Pre-render at build time |
| Content changes often (e-commerce, dashboard) | Keep server-rendered, deploy normally |
| Mixed (static shell + dynamic data) | Pre-render pages, fetch data client-side via JSON endpoints |

### Serving the Output

The `dist/` folder is plain HTML — serve it anywhere:

```bash
# Nginx — point root to ./dist
# GitHub Pages — push dist/ to gh-pages branch
# Netlify / Vercel — set publish directory to dist

# Quick local preview
npx serve dist
```

### Limitations to Keep in Mind

- **Form actions (POST) don't work** on a static host. Pages with forms need a real server or a third-party form service.
- **Session and auth** are server concepts. Static output is always public/unauthenticated.
- **Incremental builds** — pre-rendering scales fine for hundreds of pages; for thousands, add concurrency:

```typescript
import { cpus } from 'node:os'
import pLimit from 'p-limit'    // npm i p-limit

const limit = pLimit(cpus().length)
await Promise.all(allBooks.map(book =>
  limit(() => renderRoute(
    routes.books.show.href({ slug: book.slug }),
    `books/${book.slug}/index.html`
  ))
))
```

---

## 12. Quick Package Reference

### Routing & Server
| Package | Use for |
|---|---|
| `remix/fetch-router` | `createRouter`, controller/middleware types |
| `remix/fetch-router/routes` | `route`, `get`, `post`, `form`, `resources` |
| `remix/node-fetch-server` | `createRequestListener` — bridges Node `http` to router |
| `remix/response/redirect` | `redirect(href, status?)` |
| `remix/response/html` | `createHtmlResponse` for raw HTML strings |
| `remix/headers` | Typed `CacheControl`, `Accept`, `Cookie` builders |

### Data & Validation
| Package | Use for |
|---|---|
| `remix/data-schema` | `parse`, `parseSafe`, schema builders |
| `remix/data-schema/form-data` | `f.object`, `f.field` for FormData validation |
| `remix/data-schema/checks` | `email`, `minLength`, `maxLength` |
| `remix/data-schema/coerce` | Coerce strings to numbers, booleans, dates |
| `remix/data-table` | `table`, `column`, `createDatabase` |
| `remix/data-table-sqlite` | SQLite adapter |
| `remix/data-table/migrations` | `createMigration`, `createMigrationRunner` |

### Auth & Sessions
| Package | Use for |
|---|---|
| `remix/session` | `Session` object — get/set/flash/unset |
| `remix/session-middleware` | Wire session into middleware stack |
| `remix/session/fs-storage` | Filesystem session storage |
| `remix/session/memory-storage` | In-memory (tests) |
| `remix/cookie` | Plain signed cookies for preferences |
| `remix/auth` | Credentials, OAuth, OIDC providers |
| `remix/auth-middleware` | `auth()`, `requireAuth()`, `Auth` context key |

### UI & Browser
| Package | Use for |
|---|---|
| `remix/ui` | Components, mixins, `clientEntry`, `run`, `<Frame>` |
| `remix/ui/server` | `renderToStream`, `renderToString` |
| `remix/ui/test` | `render(...)` for component tests |
| `remix/ui/animation` | `animateEntrance`, `animateExit`, `spring`, `tween` |

### Middleware
| Package | Use for |
|---|---|
| `remix/static-middleware` | `staticFiles(dir)` |
| `remix/compression-middleware` | `compression()` |
| `remix/form-data-middleware` | `formData()` |
| `remix/method-override-middleware` | `methodOverride()` |
| `remix/async-context-middleware` | `asyncContext()`, `getContext()` |
| `remix/csrf-middleware` | `csrf()` |
| `remix/cors-middleware` | `cors()` |

### Testing
| Package | Use for |
|---|---|
| `remix/test` | `describe`, `it`, lifecycle hooks |
| `remix/assert` | Assertion helpers |
| `remix/cli` | `remix test`, `remix routes`, `remix doctor` |

---

## Default Workflow Checklist

When building any feature:

- [ ] 1. **Classify** — does it change the URL, request lifecycle, data model, auth, or just UI?
- [ ] 2. **Start from routes** — add/update `app/routes.ts` before writing handlers
- [ ] 3. **Put code in the narrowest owner** — route-local first, promote only when reuse is real
- [ ] 4. **Make the server path correct first** — right `Response` before any `clientEntry`
- [ ] 5. **Validate input at the boundary** — parse FormData, params, cookies before they touch business logic
- [ ] 6. **Add middleware deliberately** — fast exits early, enrichment later
- [ ] 7. **Hydrate only when necessary** — prefer server-rendered UI
- [ ] 8. **Test the narrowest meaningful layer** — router tests for routes, component tests for DOM behavior
- [ ] 9. **Verify** — re-read route flow, confirm auth + authorization, run typecheck

---

*This book grows with you. Ask for a deeper dive on any chapter.*
