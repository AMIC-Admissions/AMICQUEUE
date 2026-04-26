# Hostinger VPS Setup

This project can keep the front end on GitHub Pages and move the shared database to Hostinger. That is the smallest change needed to make ticket numbers and queue data match across different browsers and devices.

## Recommended topology

- Front end: GitHub Pages
  - `https://amic-admissions.github.io/AMICQUEUE/`
- Shared backend: Hostinger VPS with the PocketBase template
  - example: `https://pb.your-domain.com`
- Optional later: API service on Hostinger if you want server-side WhatsApp or other integrations

## Why this fixes the issue

The current GitHub Pages build falls back to browser-local storage when `VITE_POCKETBASE_URL` is not configured. Local storage is separate per browser, so Chrome, Edge, and mobile all start with different ticket history. Once `VITE_POCKETBASE_URL` points to a real PocketBase instance, all browsers read and write the same queue data.

## Part 1 - Create the PocketBase VPS

Hostinger officially provides a PocketBase VPS template and documents that it comes pre-installed on Ubuntu 24.04.

1. In Hostinger, create a VPS using the `Ubuntu 24.04 with PocketBase` template.
2. Open the VPS IP in the browser:
   - `http://YOUR_VPS_IP`
3. Sign in with the default admin account shown in Hostinger's VPS dashboard.
4. Point a subdomain to the VPS IP:
   - recommended: `pb.your-domain.com`
5. Enable SSL for that subdomain in Hostinger.

Official references:

- PocketBase VPS template: https://www.hostinger.com/support/10490129-how-to-use-the-pocketbase-vps-template-at-hostinger/

## Part 2 - Load this project's PocketBase schema

The repo already contains the PocketBase migrations and hooks:

- `apps/pocketbase/pb_migrations`
- `apps/pocketbase/pb_hooks`

### 1. Connect to the VPS

```bash
ssh root@YOUR_VPS_IP
```

### 2. Clone the repository

```bash
git clone https://github.com/AMIC-Admissions/AMICQUEUE.git
cd AMICQUEUE/apps/pocketbase
```

### 3. Check the existing PocketBase service paths

Hostinger's PocketBase service is managed by `systemd`. Before running migrations, inspect the existing service so you reuse the same data directory:

```bash
sudo systemctl cat pocketbase
```

Look for the `ExecStart=` line and note the `--dir=...` value. Use that exact path in the next command.

### 4. Link the Hostinger PocketBase binary into the repo

Hostinger's template stores PocketBase under `/opt/pocketbase` according to their documentation. Verify that the binary exists:

```bash
ls /opt/pocketbase
```

Then link it into this repo so the project scripts can use it:

```bash
ln -sf /opt/pocketbase/pocketbase ./pocketbase
chmod +x ./pocketbase
```

### 5. Run this project's migrations

Set the required environment variables, then run migrations against the same data directory used by the Hostinger service:

```bash
export PB_ENCRYPTION_KEY='CHANGE_ME_TO_A_LONG_RANDOM_VALUE'
export PB_SUPERUSER_EMAIL='admin@your-domain.com'
export PB_SUPERUSER_PASSWORD='CHANGE_ME_TO_A_STRONG_PASSWORD'
export PUBLIC_APP_URL='https://amic-admissions.github.io/AMICQUEUE'

./pocketbase horizons migrations:up \
  --encryptionEnv=PB_ENCRYPTION_KEY \
  --dir=/PATH_FROM_SYSTEMCTL \
  --migrationsDir=./pb_migrations \
  --hooksDir=./pb_hooks \
  --hooksWatch=false
```

After that, restart PocketBase:

```bash
sudo systemctl restart pocketbase
sudo journalctl -u pocketbase -f
```

## Part 3 - Point GitHub Pages to Hostinger PocketBase

In GitHub, add these repository variables:

- `VITE_POCKETBASE_URL=https://pb.your-domain.com`
- `VITE_USE_LOCAL_DB=false`

Then redeploy GitHub Pages by pushing a commit or rerunning the Pages workflow.

## Part 4 - Optional API deployment later

Right now, the queue itself mainly needs PocketBase. The API can be deployed later if you want server-side integrations.

This project now supports a direct PocketBase URL in the API env file:

- `apps/api/.env.example`

Use:

```env
PORT=3001
CORS_ORIGIN=https://amic-admissions.github.io
POCKETBASE_URL=https://pb.your-domain.com
PB_SUPERUSER_EMAIL=admin@your-domain.com
PB_SUPERUSER_PASSWORD=CHANGE_ME
PUBLIC_APP_URL=https://amic-admissions.github.io/AMICQUEUE
```

If you deploy the API on Hostinger Node.js hosting, Hostinger documents GitHub import and environment variable setup here:

- Node.js deployment: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- Environment variables: https://www.hostinger.com/support/how-to-add-environment-variables-during-node-js-application-deployment/
- GitHub permissions: https://www.hostinger.com/support/how-to-update-github-repository-permissions-for-node-js-hosting/

## Verification checklist

After `VITE_POCKETBASE_URL` is live:

1. Create one ticket in browser A.
2. Open the dashboard in browser B.
3. Confirm the same ticket appears.
4. Create the next ticket in browser B.
5. Confirm browser A sees the same next number.

## Important note

Existing tickets already created in browser-local storage will not automatically move into the new shared PocketBase database. The shared environment will start from the records stored in Hostinger PocketBase.
