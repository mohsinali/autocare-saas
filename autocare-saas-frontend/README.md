# AutoCare Services Frontend

Next.js 15 application for the AutoCare Services API. It uses a feature-oriented structure, Tailwind CSS 4, shadcn-compatible UI primitives, React Hook Form/Zod, TanStack Query, Axios, and Recharts.

## Local development

```bash
nvm use 20.19.6
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3001` if the API is already using port 3000, or use `npm run dev -- -p 3001`. The backend URL defaults to `http://localhost:3000/api/v1` and can be changed with `NEXT_PUBLIC_API_URL`.

The API's `CORS_ORIGIN` must allow the frontend origin. The included API environment example allows `http://localhost:3000` and `http://localhost:3001`.

Run `npm run lint` and `npm run build` before merging changes.
