# Nuvoxel Launcher

Desktop Tauri launcher, public website and the Nuvoxel social API.

## Run locally

- Launcher: `npm run tauri:dev`
- Website: `npm run dev:website`
- API: `npm run api:dev`

## Persistent API data

Accounts, chat history, moderation records and shared Claude packs are stored in `nuvolexlauncher-social.json`. For a deployed API, set `NUVOXEL_DATA_DIR` to a mounted persistent disk directory. Without persistent storage, providers that recreate containers will erase accounts and chat data on restart.

The API writes atomically, preventing a server stop during a write from corrupting the social database.
