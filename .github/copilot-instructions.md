Project: EduPlatforma

Use Polish in user-facing content unless the task explicitly requires otherwise.

Architecture notes:

- App Router Next.js project with TypeScript and Tailwind CSS.
- Public landing page at `/`.
- Login page at `/login` with demo role selection.
- Teacher dashboard at `/teacher` for chapters, materials, and tests.
- Student dashboard at `/student` for learning and test taking.

Implementation notes:

- Keep the UI clean, modern, and responsive.
- Prefer small reusable components over duplicated markup.
- Treat `localStorage` auth as a starter implementation only.
- Preserve current route names and Polish labels when extending the app.