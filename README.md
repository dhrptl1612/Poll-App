# QuickPoll - Real-time Polling Application

QuickPoll is an interactive polling application that allows users to create polls, vote on options, and view real-time results. The application uses Server-Sent Events (SSE) for real-time updates and provides a responsive user interface.


## Deployment Information

This application is currently deployed and accessible at:

- **Frontend**: [https://poll-app-puce-delta.vercel.app](https://poll-app-puce-delta.vercel.app)
- **Backend**: Deployed on Render.com

## Live Demo

To try out the application:
1. Visit the [QuickPoll App](https://poll-app-puce-delta.vercel.app)
2. Create a poll with your custom question and options
3. Share the generated link or QR code with others to collect votes
4. Watch results update in real-time as votes are cast

## Features

- **Create Custom Polls**: Create polls with custom questions and 2-4 options
- **Real-time Results**: See voting results update in real-time using Server-Sent Events
- **Result Visualization**: Visual representation of voting results with percentage bars
- **Vote Protection**: Fingerprinting mechanism to prevent duplicate votes
- **Results Privacy**: Option to hide results until a user votes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Insights**: Automatic analysis of poll results based on voting patterns
- **QR Code Generation**: Generate QR codes for easy poll sharing on mobile
- **URL Sharing**: Easily share polls via unique, shareable URLs
- **Poll Duration Setting**: Set custom expiration time for polls
- **Open Graph Support**: Rich previews when sharing polls on social media
- **Cross-Platform Compatibility**: Works on all modern browsers and devices

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

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Create and activate a virtual environment (optional but recommended):
   ```bash
   # On Windows
   python -m venv venv
   venv\Scripts\activate

   # On macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file (use `.env.example` as a template):
   ```bash
   cp .env.example .env
   ```
   
   Ensure it contains the following settings:
   ```
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   DATABASE_URL=sqlite:///./polls.db
   ```

6. Initialize the database and seed initial data (if needed):
   ```bash
   python seed.py
   ```

7. Run the backend server:
   ```bash
   uvicorn main:app --reload
   ```

   The backend API will be available at `http://localhost:8000/api`.

#### Frontend Setup

1. Navigate to the frontend directory (from the project root):
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
   
   Ensure it contains:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`.
   
5. Open your browser and navigate to `http://localhost:5173` to use the application locally.

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

### Current Deployment

The application is currently deployed at:

- **Frontend**: [https://poll-app-puce-delta.vercel.app](https://poll-app-puce-delta.vercel.app)
- **Backend**: Hosted on Render.com

### Deployment Instructions

#### Backend Deployment (with Render.com)

1. Create a new Web Service on Render.com.

2. Connect your GitHub repository.

3. Configure the service:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `CORS_ORIGINS`: Your frontend URL (e.g., `https://poll-app-puce-delta.vercel.app`)
     - Set any other environment variables defined in `.env.example`

4. Deploy the service.

#### Frontend Deployment (with Vercel)

1. Create a `vercel.json` file in the frontend directory (already added):
   ```json
   {
     "routes": [
       {
         "src": "/[^.]+",
         "dest": "/",
         "status": 200
       }
     ]
   }
   ```

2. Connect your repository to Vercel.

3. Configure the deployment:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: Your backend API URL

4. Deploy the project.

5. Ensure all routes are properly handled by adding the `vercel.json` configuration (this is crucial for client-side routing to work correctly).

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

#### 404 Not Found on Shareable Links
- Ensure the `vercel.json` file exists in the frontend directory with the correct configuration for client-side routing
- After making changes to the configuration, redeploy the frontend application
- Check that the route matches exactly what's defined in your React Router setup

#### Real-time updates not working
- Check browser console for SSE connection errors
- Verify that your hosting provider supports Server-Sent Events (Render.com does support this)
- Check that the backend server doesn't terminate long-running connections
- Make sure the API URLs are properly formed with the correct base URL

#### Database connection issues
- Verify that the backend has write permissions in its deployment environment
- Consider using an external database service instead of SQLite for production

## License

This project is licensed under the MIT License - see the LICENSE file for details.
