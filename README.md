# WP-Auto - WordPress Content Management with AI Scheduling

A powerful Next.js application for automated WordPress content management with AI-powered article generation and scheduled publishing using n8n workflows.

## ✨ Features

- **Automated Article Scheduling**: Schedule articles based on database `schedule_at` datetime
- **n8n Integration**: Seamlessly integrates with n8n workflows for AI content generation
- **Real-time Progress Tracking**: Watch article generation progress with animated UI
- **Cron-based Scheduler**: Built-in cron job system that works in both development and production
- **Dashboard Management**: Monitor and control scheduled articles from a beautiful dashboard
- **Multi-tenant Architecture**: User-based system with proper authentication and RLS
- **WordPress Integration**: Direct posting to WordPress sites
- **Error Handling**: Comprehensive error tracking and retry logic

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Supabase project (for database)
- n8n instance (for AI workflows)

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd wp-auto

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure your environment variables (see .env.example)
# Edit .env.local with your Supabase and n8n URLs

# Run database migrations
npm run migrate
```

### 3. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 4. Access Scheduler Dashboard

Navigate to [http://localhost:3000/dashboard/scheduler](http://localhost:3000/dashboard/scheduler) to monitor and control your article scheduler.

## 📋 Environment Configuration

Required environment variables in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n Webhook Configuration
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/article-generation

# Scheduler Configuration
CRON_SCHEDULE=*/5 * * * *  # Every 5 minutes
TZ=Asia/Jakarta
NODE_ENV=development
```

## 🎯 Core Components

### 1. Article Scheduler (`src/lib/scheduler/article-scheduler.ts`)
- Automated cron job processing
- Works in both development and production
- Health checks and monitoring
- Manual control via API

### 2. n8n Webhook Integration (`app/api/webhooks/n8n/route.ts`)
- Receives progress updates from n8n workflows
- Updates article status in real-time
- Handles completion and error states

### 3. Progress Tracker UI (`components/article-progress-tracker.tsx`)
- Real-time animated progress indicators
- Status badges and detailed information
- Auto-refresh functionality

### 4. Dashboard (`app/dashboard/scheduler/page.tsx`)
- Monitor scheduler status
- Start/stop/restart controls
- View scheduled articles and their progress

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Database
npm run migrate      # Run database migrations
npm run migrate:check  # Check for pending migrations

# Testing
node scripts/test-scheduler.js  # Test scheduler functionality

# Deployment
./scripts/deploy-scheduler.sh  # Production deployment script
```

## 📚 Documentation

- **[Complete Scheduler Setup Guide](docs/SCHEDULER_SETUP.md)** - Comprehensive setup and configuration
- **[API Documentation](docs/API.md)** - API endpoints and usage
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🏗️ Architecture

```
├── app/
│   ├── api/
│   │   ├── scheduler/          # Scheduler control API
│   │   └── webhooks/n8n/       # n8n webhook endpoint
│   ├── dashboard/scheduler/    # Scheduler dashboard UI
│   └── ...
├── components/
│   ├── article-progress-tracker.tsx  # Progress tracking UI
│   └── ...
├── src/lib/
│   ├── scheduler/
│   │   ├── article-scheduler.ts      # Core scheduler logic
│   │   └── init.ts                   # Scheduler initialization
│   ├── articles/
│   │   ├── scheduled-articles.ts     # Scheduled articles processing
│   │   └── types.ts                  # Type definitions
│   └── ...
├── scripts/
│   ├── deploy-scheduler.sh    # Production deployment
│   └── test-scheduler.js      # Test suite
└── docs/
    └── SCHEDULER_SETUP.md     # Complete setup guide
```

## 🔄 How It Works

1. **Scheduling**: Articles are scheduled in the database with a `scheduled_at` datetime
2. **Cron Processing**: The scheduler runs every 5 minutes (configurable) to find due articles
3. **Webhook Trigger**: For each due article, the system sends a webhook to n8n
4. **Progress Updates**: n8n can send progress updates back to the application
5. **Completion**: When finished, the article status is updated and WordPress posting is handled

## 🎨 Dashboard Features

- **Scheduler Status**: Real-time monitoring of scheduler health
- **Article List**: View all scheduled articles with their current status
- **Progress Animation**: Watch articles being generated in real-time
- **Manual Control**: Start, stop, restart scheduler or trigger manual runs
- **Auto-refresh**: Dashboard automatically updates every 30 seconds

## 🚀 Production Deployment

The system is designed for easy production deployment:

```bash
# Using the deployment script
./scripts/deploy-scheduler.sh

# Or manually
npm run build
npm start
```

### Production Considerations

- Set `NODE_ENV=production`
- Use appropriate cron schedule (e.g., every 5 minutes)
- Configure secure webhook URLs
- Set up proper monitoring and logging
- Consider using PM2 for process management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. Check the [Scheduler Setup Guide](docs/SCHEDULER_SETUP.md)
2. Review the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
3. Check the application logs for error messages
4. Test with the provided test script: `node scripts/test-scheduler.js`

---

**Built with ❤️ using Next.js, Supabase, and n8n**

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
