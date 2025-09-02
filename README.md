# Features
Google OAuth Authentication - Secure login with Google accounts
AI-Powered Transaction Entry - Natural language processing using OpenAI GPT-4
Interactive Dashboard - Financial insights with beautiful charts
Responsive Design - Works perfectly on desktop and mobile devices
Dark/Light Mode - Toggle between color themes
Transaction Management - Add, edit, delete, and categorize transactions
--------------------------------------------------------------------------

# Tech Stack
Frontend: React (Vite) + Tailwind CSS
Backend: Node.js + Express
Database: MongoDB with Mongoose ODM
Authentication: Google OAuth 2.0 + JWT
AI Integration: OpenAI GPT-4 API
Charts: Recharts
Icons: @fortawesome/fontawesome-free
----------------------------------------------------------------------

# Prerequisites
Node.js (v16 or higher)
npm or yarn package manager
MongoDB (local installation or MongoDB Atlas account)
Google Cloud Platform account (for OAuth)
OpenAI API account
-------------------------------------------------------------------

# Installation & Setup
1. Clone the Repository
git clone https://github.com/Shaiphali23/finance-ai-tracker.git
cd finance-ai-tracker

2. Backend Setup
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Edit the .env file with your configuration:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance-tracker
JWT_SECRET=your_jwt_secret_here_change_in_production
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development

3. Frontend Setup
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Edit the .env file:
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id

4. Configure Google OAuth
Go to the Google Cloud Console
Create a new project or select an existing one
Enable the Google+ API
Create OAuth 2.0 credentials (Web application)
Add authorized JavaScript origins: http://localhost:5173
Add authorized redirect URIs: http://localhost:5000/auth/google/callback
Copy the Client ID and Client Secret to your environment variables

5. Configure OpenAI API
Sign up for an account at OpenAI
Generate an API key from the dashboard
Add the API key to your backend environment variables

6. Database Setup
Option 1: Local MongoDB
Install MongoDB Community Edition
Make sure MongoDB is running on your system

Option 2: MongoDB Atlas (Cloud)
Create a free account at MongoDB Atlas
Create a new cluster
Get the connection string and update MONGODB_URI in your .env file

7. Run the Application
# Start backend server (from backend directory)
npm run dev

# Start frontend development server (from frontend directory, in a new terminal)
npm run dev

8. Access the Application
Open your browser and navigate to: http://localhost:5173
---------------------------------------------------------------------------------

# Usage Guide
1. Authentication
Click "Sign in with Google" on the landing page
Complete the OAuth flow with your Google account
You'll be redirected to the dashboard upon successful authentication


2. Adding Transactions
Enter transactions using natural language in input field:
"Coffee at Starbucks $6.50"
"Gas station $40"
"Monthly salary $4500"
"Netflix subscription $15.99"
"Grocery shopping at Whole Foods $120"
Review the AI-parsed transaction details
Confirm to save the transaction

3. Viewing Dashboard
See financial summary cards (Income, Expenses, Savings)
Analyze spending patterns with interactive charts:
Pie chart for category-wise spending
Line chart for trends over time
Browse recent transactions with filtering options

4. Managing Transactions
View all transactions in the history section
Edit transaction details by clicking the edit icon
Delete transactions by clicking the delete icon
Filter transactions by category or date range
-------------------------------------------------------------------

# Project Structure
finance-ai-tracker/
├── backend/
│   ├── config/               # DB Connections
|   ├── controllers/          # Route controllers
│   ├── middleware/           # Custom Middleware
│   ├── models/               # MongoDB models
│   ├── routes/               # API routes
│   ├── services/
|   ├── utils/                # Helper functions
│   ├── .env                  # Environment variables
│   └── server.js             # Server entry point
├── frontend/
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/pages/utils # Reusable components          
│   │   ├── contextAPI/            # React context
│   ├── .env                       # Frontend environment variables
│   └── vite.config.js             # Vite configuration
├── docs/                          # Documentation & screenshots
└── README.md                      # This file

