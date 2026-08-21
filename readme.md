# Galactic Spacefarer Adventure

A demo SAP CAP project: a Fiori elements List Report / Object Page app for managing "Spacefarers" (crew members), built to showcase multi-tenant (planet-scoped) data isolation, draft-based editing, and CAP event handlers.

## Tech stack

- **SAP Fiori elements** (List Report + Object Page, `sap.fe.templates`) — [app/spacefarers](app/spacefarers)
- **SAP CAP** (Node.js runtime, CDS data model + service) — [db/schema.cds](db/schema.cds), [srv/service.cds](srv/service.cds), [srv/spacefarers-service.js](srv/spacefarers-service.js)
- **SQLite** (`@cap-js/sqlite`) as the local, in-memory development database, seeded from CSV files in [db/data](db/data)

## Prerequisites

- Node.js
- The CDS CLI, installed globally: `npm i -g @sap/cds-dk`
- Recommended: the [SAP Fiori Tools Extension Pack](https://marketplace.visualstudio.com/items?itemName=SAPSE.sap-ux-fiori-tools-extension-pack) VS Code extension — the [app/spacefarers](app/spacefarers) UI was mainly generated and scaffolded with the SAP Fiori Application Generator that ships with it, and it also helps with previewing/editing the annotations and manifest.

## Getting started

```bash
# 1. Install dependencies (root + app/spacefarers workspace)
npm ci

# 2. Create your local env file with mocked auth users
cp .env.example .env

# 3. Start the server (reseeds the in-memory SQLite DB on every restart)
cds watch
```

`cds watch` compiles the CDS model, serves the OData service, and mounts the Fiori app. It also watches all `.cds`/`.js`/`.csv` files and restarts automatically on change.

### About `.env`

[.env.example](.env.example) defines the mocked login users (used only because auth is `kind: mocked` for local development, see [package.json](package.json)) via the `CDS_REQUIRES_AUTH_USERS` env var — copy it to `.env` before starting so you have valid credentials to log in with. Never commit your real `.env`.

## Main addresses (after `cds watch` is running)

| What | URL |
|---|---|
| Fiori app (List Report) | <http://localhost:4004/spacefarers/index.html> |
| OData service root | <http://localhost:4004/galactic/> |
| OData `$metadata` | <http://localhost:4004/galactic/$metadata> |

## Authentication (demo only)

For local development, auth uses CAP's `mocked` strategy with HTTP **Basic Auth** and the users defined in `.env` (e.g. `planetXUser` / `secret`, `planetYUser` / `secret`, `adminUser` / `secret`). This is **not** how you'd secure a real deployment — it exists purely so the exercise can demonstrate tenant isolation locally without a full identity provider.

In a real/production CAP application, authentication would instead be handled via **JWT tokens issued by for example an OAuth2 provider**. CAP validates the incoming JWT automatically and populates `request.user`/`req.user.attr` the same way the mocked users do here, so the authorization logic in [spacefarers-service.js](srv/spacefarers-service.js) needs no changes to work with real tokens.

## Sample API requests

All requests require Basic Auth with one of the users from `.env`.

```bash
# List all Spacefarers visible to this user's planet
curl -u planetXUser:secret http://localhost:4004/galactic/Spacefarers

# Filter by name and select specific fields
curl -u planetXUser:secret \
  "http://localhost:4004/galactic/Spacefarers?\$filter=contains(firstName,'Zolt')&\$select=firstName,lastName,stardustCollected"

# Read a single Spacefarer by key
curl -u planetXUser:secret \
  "http://localhost:4004/galactic/Spacefarers(id='01M0G8JD40017H4K2QWMXYZSAB',IsActiveEntity=true)"

# Same query as planetYUser only returns Planet Y's own Spacefarers (tenant isolation)
curl -u planetYUser:secret http://localhost:4004/galactic/Spacefarers

# adminUser bypasses the tenant filter entirely
curl -u adminUser:secret http://localhost:4004/galactic/Spacefarers
```

## Project layout

File or Folder | Purpose
---------|----------
`app/spacefarers/` | Fiori elements UI (List Report + Object Page)
`db/schema.cds` | Data model (Spacefarers, Planets, Departments, Positions, Users, NavigationLog)
`db/data/` | CSV seed data, loaded into SQLite on every `cds watch` start
`srv/service.cds` | OData service definition, draft-enabled, tenant-checked
`srv/spacefarers-service.js` | Custom event handlers: validation, stardust/skill normalization, tenant enforcement, ULID generation
`.env.example` | Template for local mocked-auth credentials