# QuickPoll - Real-time Polling Application

QuickPoll is an interactive polling application that allows users to create polls, vote on options, and view real-time results. The application uses Server-Sent Events (SSE) for real-time updates and provides a responsive user interface.

![QuickPoll Logo](frontend/og/fallback.png)

## Features

- **Create Custom Polls**: Create polls with custom questions and 2-4 options
- **Real-time Results**: See voting results update in real-time using Server-Sent Events
- **Result Visualization**: Visual representation of voting results with percentage bars
- **Vote Protection**: Fingerprinting mechanism to prevent duplicate votes
- **Results Privacy**: Option to hide results until a user votes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Insights**: Automatic analysis of poll results
- **QR Code Generation**: Generate QR codes for sharing polls
- **URL Sharing**: Easily share polls via unique URLs

## Technology Stack

### Frontend
- **React**: UI library for building the user interface
- **Vite**: Next-generation frontend build tool
- **JavaScript (ES6+)**: Modern JavaScript syntax
- **CSS3**: Custom styling with responsive design
- **EventSource API**: For SSE real-time communication

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLite**: Lightweight database for data storage
- **SQLAlchemy**: SQL toolkit and ORM
- **Pydantic**: Data validation and settings management
- **Uvicorn**: ASGI server implementation
- **Server-Sent Events**: For real-time updates

## Project Structure

```
quickpoll/
├── backend/               # FastAPI backend
│   ├── database.py        # Database connection and models
│   ├── main.py            # Main FastAPI application
│   ├── models.py          # SQLAlchemy models
│   ├── schemas.py         # Pydantic schemas
│   ├── rules.py           # Business logic for insights
│   ├── sse.py             # Server-Sent Events implementation
│   └── requirements.txt   # Python dependencies
│
├── frontend/              # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── api.js         # API communication layer
│   │   ├── App.jsx        # Main application component
│   │   └── main.jsx       # Application entry point
│   ├── package.json       # NPM dependencies
│   └── vite.config.js     # Vite configuration
│
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- **Node.js** (v14+) and **npm** for frontend development
- **Python** (v3.8+) for backend development
- **Git** for version control

### Local Development Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   # On Windows
   python -m venv venv
   venv\Scripts\activate

   # On macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file (use `.env.example` as a template):
   ```bash
   cp .env.example .env
   ```

5. Run the backend server:
   ```bash
   uvicorn main:app --reload
   ```

   The backend API will be available at `http://localhost:8000/api`.

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (use `.env.example` as a template):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`.

## API Endpoints

### Polls

- `POST /api/polls`: Create a new poll
- `GET /api/polls/{poll_id}`: Get poll details
- `GET /api/polls/{poll_id}/results`: Get poll results
- `POST /api/polls/{poll_id}/vote`: Vote on a poll option
- `GET /api/polls/{poll_id}/sse`: Server-Sent Events endpoint for real-time updates

### Request/Response Examples

#### Create Poll
```json
// POST /api/polls
// Request
{
  "question": "What is your favorite color?",
  "options": [
    {"text": "Red"},
    {"text": "Blue"},
    {"text": "Green"},
    {"text": "Yellow"}
  ],
  "hours": 24,
  "hide_results_until_vote": false
}

// Response
{
  "id": 1
}
```

#### Vote on Poll
```json
// POST /api/polls/1/vote
// Request
{
  "option_id": 2,
  "fingerprint": "fp-12345abcde"
}

// Response
{
  "message": "Vote recorded"
}
```

## Deployment

### Backend Deployment (with Vercel)

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Create a `vercel.json` file in the backend directory:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "main.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "main.py"
       }
     ]
   }
   ```

3. Deploy to Vercel:
   ```bash
   cd backend
   vercel
   ```

### Frontend Deployment (with Vercel)

1. Build the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

## Environment Configuration

### Backend Configuration Options

- `CORS_ORIGINS`: Comma-separated list of allowed origins for CORS
- `DATABASE_URL`: SQLite database URL (default: `sqlite:///./polls.db`)
- `PORT`: Port to run the server on (default: `8000`)
- `HOST`: Host to bind to (default: `0.0.0.0`)
- `API_ROOT_PATH`: Root path for the API (default: `/api`)

### Frontend Configuration Options

- `VITE_API_URL`: URL of the backend API (empty for same-origin)

## Troubleshooting

### Common Issues

#### API requests failing
- Check that `VITE_API_URL` is set correctly in frontend/.env
- Verify that `CORS_ORIGINS` in backend/.env includes your frontend URL
- Check browser console for CORS errors

#### Real-time updates not working
- Check browser console for SSE connection errors
- Verify that your hosting provider supports Server-Sent Events
- Check that the backend server doesn't terminate long-running connections
- Make sure the API URLs are properly formed with the correct base URL

#### Database connection issues
- Verify that the backend has write permissions in its deployment environment
- Consider using an external database service instead of SQLite for production

## Development Workflow

1. Create feature branches from `main`
2. Make changes and test locally
3. Submit pull requests for review
4. Merge approved PRs to `main`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
