# HomeHolidayHunt Backend

Node.js + Express + Sequelize (CLI-managed) + MySQL backend for the Next.js frontend.

## 1. Configure environment

Copy `.env.example` to `.env` and set your MySQL credentials and JWT secret.
`DB_NAME` defaults to `home_holiday_hunt`, `PORT` defaults to `5000`.

## 2. Install dependencies

```bash
npm install
```

## 3. Create the database, run migrations, seed demo data

```bash
npm run db:create    # CREATE DATABASE <DB_NAME>
npm run db:migrate   # create all tables
npm run db:seed      # insert demo event, homes, sponsors, alert
```

Other useful commands:

```bash
npm run db:migrate:undo       # roll back the last migration
npm run db:migrate:undo:all   # roll back every migration
npm run db:seed:undo          # remove all seeded rows
npm run db:reset              # undo all migrations, re-migrate, re-seed
npm run db:drop               # DROP DATABASE <DB_NAME>
```

## 4. Run the API

```bash
npm run dev
```

API: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

## Database structure

```
src/
  config/
    config.js         # Sequelize CLI config (development/test/production, reads .env)
  database/
    migrations/        # one file per table, applied in filename order
    seeders/            # demo data (event, 8 homes, 3 sponsors, 1 alert)
  models/
    index.js           # auto-loads every model file below and wires associations
    User.js Event.js Home.js Nomination.js Tour.js TourStop.js Message.js Sponsor.js Alert.js
.sequelizerc            # tells sequelize-cli where config/migrations/seeders/models live
```

Schema changes from here on should go through a new migration
(`npx sequelize-cli migration:generate --name <description>`) rather than editing
existing migration files or relying on `sequelize.sync()`.

## Current endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/homes`
- `GET /api/homes/:id`
- `POST /api/homes` (homeowner/admin)
- `GET /api/nominations`
- `POST /api/nominations` (authenticated)
- `GET /api/events`
- `GET /api/sponsors`
- `GET /api/alerts`

## Architecture

Next.js -> HTTP/REST -> Express -> Sequelize -> MySQL

`sequelize.sync()` is intentionally used for the initial local development bootstrap. Once the schema stabilizes, move to Sequelize migrations for production-safe database changes.
