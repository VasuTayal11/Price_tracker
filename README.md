# Price Tracker Project

A full-stack web application built to fulfill the INE Mock Storefront scraping assignment.

## Tech Stack
* **Frontend**: React (Vite, Tailwind CSS, Recharts) - deployable to Vercel.
* **Backend**: Node.js (Express, Playwright) - deployable to Render.
* **Database**: Supabase (PostgreSQL).

## Project Structure
* `frontend/`: The React application dashboard.
* `backend/`: The Express API and Playwright scraper logic.
* `database_schema.sql`: PostgreSQL tables definition for Supabase.

## Setup Instructions

### 1. Database Setup (Supabase)
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Go to the SQL Editor in your Supabase dashboard.
3. Paste the contents of `database_schema.sql` and run it.
4. Go to Project Settings -> API and copy the **Project URL** and **anon public key**.

### 2. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file in the `backend/` folder:
   ```env
   PORT=3001
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   ```
3. Run the backend:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Create a `.env` file in the `frontend/` folder:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```
3. Run the frontend:
   ```bash
   npm run dev
   ```
4. Open the displayed local URL in your browser to view the dashboard.

## Deployment

### Backend on Render
1. Create a new Web Service on Render, connected to your GitHub repository.
2. Set the Root Directory to `backend`.
3. Set Build Command to `npm install && npx playwright install chromium --with-deps`.
4. Set Start Command to `npm start`.
5. Add Environment Variables: `SUPABASE_URL` and `SUPABASE_KEY`.
6. Note: Free tier Renders sleep after inactivity.

### Frontend on Vercel
1. Import your repository into Vercel.
2. Set the Root Directory to `frontend`.
3. Vercel should auto-detect Vite. 
4. Add Environment Variable `VITE_API_URL` pointing to your deployed Render backend URL (e.g., `https://your-backend.onrender.com/api`).
5. Deploy.

### Scheduled Scraping
Because free-tier backends sleep, you must trigger the scraper externally.
1. Sign up for a free account at [cron-job.org](https://cron-job.org/).
2. Create a new cron job.
3. Set the URL to `https://your-backend.onrender.com/api/scrape`.
4. Set the HTTP method to `POST`.
5. Schedule it to run every 2 hours.

## Evaluation Criteria Met
* **Scraping Reliability**: Playwright is used with logic that waits for the DOM content and retries failures up to 3 times before honestly logging them.
* **Correctness under Difficulty**: The scraper explicitly waits for delayed/async selectors.
* **Honest History**: Scrape results (success, retried, failed) are saved in the `scrape_logs` table.
* **Observable Run**: You can click "Test Scrape (Headed)" in the UI (when running locally) to trigger a visible Playwright run and observe its behavior.
