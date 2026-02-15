# Gemini CLI Context for MotionApp

## Project Overview

MotionApp is a comprehensive web application designed for fitness coaching and client management. It acts as a platform for coaches to manage clients, workout plans, nutrition, and sessions.

**Key Technologies:**

*   **Frontend Framework:** React (via Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, shadcn-ui, Framer Motion
*   **State Management:** Zustand, React Query (`@tanstack/react-query`)
*   **Routing:** React Router (`react-router-dom`)
*   **Backend / BaaS:** Supabase (Database, Auth, Edge Functions)
*   **Testing:** Vitest, React Testing Library
*   **Form Handling:** React Hook Form, Zod

## Architecture

*   **SPA Structure:** The application is a Single Page Application (SPA) built with Vite.
*   **Supabase Integration:** Heavily relies on Supabase for backend services including authentication, database (PostgreSQL), and serverless edge functions (`supabase/functions`).
*   **Component Library:** Uses a set of reusable components in `src/components`, likely built on top of Radix UI primitives and styled with Tailwind (shadcn-ui pattern).
*   **Feature-Based Organization:** Some distinct features seem to be organized under `src/features` (e.g., `admin`, `auth`, `client-workouts`), while shared UI components reside in `src/components`.

## Building and Running

**Prerequisites:**
*   Node.js & npm (or Bun, as `bun.lockb` is present, but `README` suggests npm).

**Key Scripts:**

*   **Development Server:**
    ```bash
    npm run dev
    ```
    Starts the Vite development server (default port 8080).

*   **Production Build:**
    ```bash
    npm run build
    ```
    Builds the application for production using Vite.

*   **Linting:**
    ```bash
    npm run lint
    ```
    Runs ESLint to check for code quality issues.

*   **Testing:**
    (Note: No explicit `test` script in `package.json`, but Vitest is installed)
    ```bash
    npx vitest
    ```

## Development Conventions

*   **Path Aliases:** Use `@/` to import from the `src/` directory (e.g., `import { Button } from "@/components/ui/button"`).
*   **Type Safety:** TypeScript is used, but strictness settings in `tsconfig.json` are currently relaxed (`noImplicitAny: false`, `strictNullChecks: false`).
*   **State Management:**
    *   **Server State:** Use React Query (`useQuery`, `useMutation`) for data fetching and caching.
    *   **Client State:** Use Zustand (`src/stores`) for global client-side state.
*   **Styling:** Utility-first CSS with Tailwind. Avoid standard CSS files where possible; prefer Tailwind utility classes.
*   **Icons:** Lucide React (`lucide-react`) is the standard icon library.

## Key Directories

*   `src/components`: Reusable UI components.
*   `src/features`: Feature-specific logic and components.
*   `src/hooks`: Custom React hooks (e.g., `use-toast`, `use-mobile`).
*   `src/lib`: Utilities and helpers (Supabase client, formatting).
*   `src/pages`: Top-level route components.
*   `src/stores`: Zustand state stores.
*   `supabase/`: Supabase project configuration, migrations, and edge functions.
