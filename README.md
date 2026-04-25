# AMIC Queue

Queue management app with a React/Vite frontend, API service, and PocketBase backend.

## Notes

- `apps/pocketbase/pocketbase` is not committed because it is larger than GitHub's browser upload limit. Download PocketBase `0.36.7` for your target platform and place the executable at `apps/pocketbase/pocketbase`.
- Runtime database files in `apps/pocketbase/pb_data/` are not committed. The schema is managed through `apps/pocketbase/pb_migrations/`.
- Copy `apps/api/.env.example` to `apps/api/.env` when running locally.
