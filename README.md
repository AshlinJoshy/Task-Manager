# Task Manager

A modern, robust task management application built with React, TypeScript, and Tailwind CSS.

## Features

- **Priority Management**: Organize tasks by High, Constant, Medium, or Low priority.
- **Week View**: Visual representation of your week's workload.
- **Unscheduled Tasks**: Keep track of tasks without specific deadlines.
- **Completed History**: Automatically tracks completion dates.
- **Responsive Design**: Works on desktop and tablet.

## Quick Deployment

The easiest way to deploy this app is using Vercel. It's free and takes about 2 minutes.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAshlinJoshy%2FTask-Manager)

**Steps:**
1. Click the "Deploy with Vercel" button above.
2. Sign in with GitHub.
3. It will automatically detect the settings.
4. Click **Deploy**.
5. Once finished, Vercel will give you a live URL (e.g., `https://task-manager-xyz.vercel.app`).

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Other Deployment Options

### Docker

You can run this application on any server with Docker installed.

1. Build the image:
   ```bash
   docker build -t task-manager .
   ```

2. Run the container:
   ```bash
   docker run -d -p 80:80 task-manager
   ```

The application will be available at `http://localhost` (or your server's IP).
