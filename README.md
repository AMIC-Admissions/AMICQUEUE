# AMIC Queue

Queue management app with a React/Vite frontend, API service, and PocketBase backend.

## Notes

- `apps/pocketbase/pocketbase` is not committed because it is larger than GitHub's browser upload limit. Download PocketBase `0.36.7` for your target platform and place the executable at `apps/pocketbase/pocketbase`.
- Runtime database files in `apps/pocketbase/pb_data/` are not committed. The schema is managed through `apps/pocketbase/pb_migrations/`.
- Copy `apps/api/.env.example` to `apps/api/.env` when running locally.

## GitHub Pages

The deployed GitHub Pages build falls back to a browser-local database (`localStorage`) when no shared backend URL is configured. In that mode, data is saved on the same browser/device only and is not shared between different devices or browsers.

For a Hostinger VPS setup that makes queue data shared across browsers, see [HOSTINGER_VPS_SETUP.md](./HOSTINGER_VPS_SETUP.md).

Default local login:

- Email: `admin@amic.com`
- Password: `admin123`

Configure these repository variables before deploying if PocketBase/API are hosted somewhere else:

- `VITE_USE_LOCAL_DB`: optional override. Set to `true` only if you explicitly want browser-local storage even when a backend URL is configured.
- `VITE_POCKETBASE_URL`: full PocketBase URL, for example `https://example.com/hcgi/platform`
- `VITE_API_SERVER_URL`: full API URL, for example `https://example.com/hcgi/api`
- `PUBLIC_APP_URL`: public frontend URL used by PocketBase hooks when sending tracking links
