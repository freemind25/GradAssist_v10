# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Project Structure and Entry Points

This is a [Next.js](https://nextjs.org/) project bootstrapped with `create-next-app` and configured to use the **App Router**.

Key characteristics:
*   **Framework:** Next.js
*   **Routing:** App Router (files and folders within `src/app/`)
*   **Main Page Component:** `src/app/page.tsx`
*   **Root Layout:** `src/app/layout.tsx`
*   **UI Components:** Primarily ShadCN UI components located in `src/components/ui/` and custom components in `src/components/`.

**Important for External Tools (like Vite-based builders or linters):**
*   This project **does not** use an `src/App.tsx` file as a main application shell in the way typical Vite or Create React App projects do.
*   Routing is handled by the Next.js App Router convention within the `src/app` directory, not a `src/pages` directory for client-side routing managed by a file like `src/App.tsx`.
*   If a tool reports errors like "Cannot find module './pages/Community' from 'src/App.tsx'", it's likely because the tool is expecting a standard Vite/React project structure rather than a Next.js App Router project. Ensure the tool is configured to correctly interpret Next.js App Router projects.
