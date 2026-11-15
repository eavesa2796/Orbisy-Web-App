# Admin workflow cleanup

This follow-up keeps the existing client workspace schema, authentication, and supporting tools.

## Changes

- Group the navigation around client work, reveal supporting tools on demand, highlight the current section, and provide a mobile menu with Escape handling and focus restoration.
- Show contact, systems, scope, and support details directly on the client overview. Move editing to `/admin-portal/clients/[id]/edit`; retain the old details fragment as a link to that page.
- Let administrators remove a mistaken workspace/lead relationship without deleting the original lead, inquiry, notes, or history. The exact relationship identifier prevents a stale form from removing a newly recreated link. Changes are audited, and retries are idempotent.
- Exclude linked leads from the lead proposal reminder queue; their workspace proposal status determines the client reminder. Original lead statuses stay unchanged.
- Collapse empty attention queues and link the dashboard metrics to the relevant list or queue.
- Extend the preview-only fictional workspace review with separate overview and editing screens. Its forms remain disabled, it reads no database records, and it returns 404 in production.

## Verification and release

Lint, TypeScript, the full 164-test suite, and the production build are the release checks. Persistence tests run against isolated PGlite, including authorization, record preservation, stale unlink requests, and proposal queue deduplication. Navigation tests cover active sections, mobile disclosure, Escape/focus restoration, and route changes.

No migration or production data writes are required. The existing 0009 workspace migration remains a prerequisite already deployed for the first release.

The preview environment previously lacked the application authentication/database variables needed for a signed-in end-to-end review. The fictional design preview permits visual review without weakening the real administrator gate. Authenticated browser CRUD and real-device mobile verification remain separate checks until that environment is available.

Production deployment is a separate step after reviewing the branch.
