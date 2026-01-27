# Task Manager

A modern, robust task management application built with React, TypeScript, and Tailwind CSS.

## Features

- **Priority Management**: Organize tasks by High, Constant, Medium, or Low priority.
- **Week View**: Visual representation of your week's workload.
- **Unscheduled Tasks**: Keep track of tasks without specific deadlines.
- **Completed History**: Automatically tracks completion dates.
- **Responsive Design**: Works on desktop and tablet.

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

## Deployment

### Using Docker (Recommended)

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

### Static Hosting

Since this is a static site, you can also deploy it to services like:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

Just build the project using `npm run build` and deploy the `dist` folder.
