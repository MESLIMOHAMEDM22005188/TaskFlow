# TaskFlow on AlwaysData

## Application type

- Backend: Node.js + Express
- Frontend: React + Vite static build
- Database: MySQL
- Media: Cloudinary

## Expected deployment model

1. Build the frontend into `frontend/dist`
2. Run the backend with Node.js on AlwaysData
3. Let Express serve both the API under `/api` and the built frontend

## Required environment variables

Backend:

- `NODE_ENV=production`
- `PORT=8100`
- `HOST=0.0.0.0`
- `DATABASE_URL=mysql://user:password@mysql-example.alwaysdata.net:3306/database_name`
- `DB_HOST=mysql-example.alwaysdata.net`
- `DB_PORT=3306`
- `DB_USER=user`
- `DB_PASS=password`
- `DB_NAME=database_name`
- `DB_CONNECTION_LIMIT=10`
- `JWT_SECRET=<long-random-secret>`
- `CORS_ALLOWED_ORIGINS=https://your-app.alwaysdata.net`
- `CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>`
- `CLOUDINARY_API_KEY=<cloudinary-api-key>`
- `CLOUDINARY_API_SECRET=<cloudinary-api-secret>`

Frontend:

- `VITE_API_URL=https://your-app.alwaysdata.net`

## Build commands

Frontend:

```powershell
cd frontend
npm install
npm run build
```

Backend:

```powershell
cd backend
npm install
npm start
```

## AlwaysData application settings

Node application:

- Application type: `Node.js`
- Working directory: `/www/TaskFlow/backend` or the directory where `backend/app.js` is deployed
- Startup file: `app.js`
- Node version: `20.x` or newer
- Environment: `production`

MySQL:

- Create a MySQL database in AlwaysData
- Copy the host, database name, username, and password into the backend environment variables

Domain:

- Point your app domain to the Node application
- Use the same public origin in `VITE_API_URL` and `CORS_ALLOWED_ORIGINS`

## Deployment sequence

1. Upload the repository
2. Install backend dependencies in `backend/`
3. Install frontend dependencies in `frontend/`
4. Build the frontend
5. Configure AlwaysData environment variables
6. Start the Node application
7. Verify:
   - `GET /api/health`
   - `GET /`
   - login/signup flows
   - authenticated API routes
   - avatar upload

## Important manual actions

- Rotate all secrets that were previously committed into `.env`
- Remove tracked secret files from version control history if this repository has been shared
- Rebuild the frontend after every frontend change
- Keep the MySQL schema in sync manually until proper migrations are added
