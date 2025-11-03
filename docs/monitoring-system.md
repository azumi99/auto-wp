# Real-Time Scheduler Monitoring System

## Overview

The Real-Time Scheduler Monitoring System provides comprehensive monitoring and management capabilities for your scheduled article generation tasks. It features real-time updates, animated visualizations, error handling, and success tracking.

## Features

### 🔄 Real-Time Monitoring
- **Server-Sent Events (SSE)** for live updates
- **Animated progress indicators** for running tasks
- **Live status updates** every 5 seconds
- **Connection status** monitoring

### 📊 Visual Feedback
- **Animated counters** for statistics
- **Progress bars** with smooth animations
- **Pulsing indicators** for system status
- **Task timeline** visualization
- **Success celebrations** with confetti animations

### 🚨 Error Handling
- **Error Boundary** for catching React errors
- **Categorized error display** (critical, error, warning, info)
- **Error timeline** with filtering options
- **Dismissible alerts** with detailed information

###  Success Tracking
- **Success metrics** with animated counters
- **Achievement celebrations** for milestones
- **Success timeline** with performance trends
- **Performance summaries** with streaks and rates

## Components

### Core Components

1. **SchedulerMonitor** (`components/scheduler-monitor.tsx`)
   - Main monitoring component with real-time updates
   - Active task tracking with progress bars
   - Recent events timeline
   - System health indicators

2. **SchedulerAnimations** (`components/scheduler-animations.tsx`)
   - AnimatedProgress: Smooth progress bar animations
   - PulsingDot: Status indicators with pulse effects
   - ProcessingAnimation: Loading states with animated dots
   - TaskTimeline: Visual task execution timeline
   - AnimatedCounter: Counting animations for numbers

3. **ErrorDisplay** (`components/error-display.tsx`)
   - ErrorDisplay: Individual error alert component
   - ErrorList: List of errors with filtering
   - useErrorManager: Hook for error state management

4. **SuccessDisplay** (`components/success-display.tsx`)
   - SuccessDisplay: Success notification with metrics
   - SuccessTimeline: Achievement timeline
   - SuccessSummary: Performance statistics card

5. **ErrorBoundary** (`components/error-boundary.tsx`)
   - React error boundary for catching component errors
   - Fallback UI for error states
   - useErrorHandler hook for functional components

## API Endpoints

### GET /api/scheduler
Returns current scheduler status and health information.

### POST /api/scheduler
Control scheduler actions:
- `start`: Start the scheduler
- `stop`: Stop the scheduler
- `restart`: Restart with new configuration
- `run_now`: Execute scheduled job immediately

### GET /api/scheduler/events ⭐
Server-Sent Events endpoint for real-time updates.

### GET /api/scheduler/stats
Returns scheduler statistics and performance metrics.

### GET /api/scheduler/export
Export scheduler logs and data as JSON.

## Usage

### Accessing Monitoring UI

The monitoring system is accessible through multiple entry points:

1. **Sidebar Navigation** - Main "Monitoring" menu with submenus:
   - **Real-Time Monitor** (`/dashboard/monitoring`) - Full monitoring dashboard
   - **Scheduler Control** (`/dashboard/scheduler`) - Enhanced scheduler dashboard
   - **System Logs** (`/dashboard/logs`) - Log viewing and export

2. **Dashboard Widgets** - Quick access monitoring widgets on main dashboard:
   - System Monitor status
   - Scheduler status overview
   - Recent logs summary

3. **Direct URLs**:
   - `/dashboard/monitoring` - Comprehensive monitoring dashboard
   - `/dashboard/scheduler` - Scheduler with real-time monitoring
   - `/dashboard/logs` - System logs and export functionality

### Basic Integration

```tsx
import { SchedulerMonitor } from '@/components/scheduler-monitor'
import { ErrorBoundary } from '@/components/error-boundary'

function Dashboard() {
  return (
    <ErrorBoundary>
      <SchedulerMonitor />
    </ErrorBoundary>
  )
}
```

### Error Management

```tsx
import { useErrorManager, ErrorDisplay } from '@/components/error-display'

function MyComponent() {
  const { errors, addError, dismissError } = useErrorManager()

  const handleAction = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      addError({
        type: 'error',
        title: 'Operation Failed',
        message: error.message
      })
    }
  }

  return (
    <div>
      {errors.map(error => (
        <ErrorDisplay
          key={error.id}
          {...error}
          onDismiss={() => dismissError(error.id)}
        />
      ))}
      <button onClick={handleAction}>Run Action</button>
    </div>
  )
}
```

### Success Notifications

```tsx
import { SuccessDisplay } from '@/components/success-display'

function SuccessExample() {
  return (
    <SuccessDisplay
      title="Task Completed!"
      message="All articles were processed successfully"
      variant="celebration"
      showConfetti={true}
      metrics={[
        { label: 'Processed', value: 25 },
        { label: 'Success Rate', value: 100, suffix: '%' }
      ]}
    />
  )
}
```

## Real-Time Events

The system emits the following event types through SSE:

- `status_update`: Scheduler status changes
- `task_started`: New task execution begins
- `task_progress`: Task progress updates
- `task_completed`: Task finished successfully
- `task_failed`: Task execution failed
- `error`: System errors

### Event Structure

```typescript
interface MonitoringEvent {
  type: string
  timestamp: string
  data: any
}
```

## Customization

### Colors and Themes

The system uses Tailwind CSS classes and can be customized by modifying the color schemes in the components:

```typescript
const colorClasses = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500'
}
```

### Animation Durations

Animation durations can be adjusted in the component props:

```tsx
<AnimatedProgress value={75} duration={2000} animated={true} />
<AnimatedCounter value={1000} duration={1500} />
```

### Error Types

Supported error types with corresponding styling:

- `critical`: Red styling with highest priority
- `error`: Red styling for general errors
- `warning`: Yellow styling for warnings
- `info`: Blue styling for informational messages
- `success`: Green styling for success messages

## Performance Considerations

1. **Connection Management**: SSE connections automatically reconnect on failure
2. **Memory Management**: Active tasks are cleaned up after completion
3. **Event Limits**: Recent events limited to last 20 items
4. **Error Limits**: Error list limited to prevent memory leaks
5. **Auto-refresh**: Status updates every 30 seconds when SSE not available

## Troubleshooting

### Common Issues

1. **SSE Connection Fails**
   - Check network connectivity
   - Verify API endpoint is accessible
   - Check browser console for errors

2. **Animations Not Working**
   - Ensure CSS animations are enabled
   - Check for reduced motion preferences
   - Verify Tailwind CSS is properly loaded

3. **Error Boundary Triggering**
   - Check component code for errors
   - Review error details in development mode
   - Ensure error reporting is configured

### Debug Mode

Enable debug logging by setting:

```typescript
const DEBUG = true // Add to component for verbose logging
```

## Future Enhancements

- [ ] WebSocket support for bi-directional communication
- [ ] Performance charts and graphs
- [ ] Alert configuration and thresholds
- [ ] Export to different formats (CSV, PDF)
- [ ] Mobile-responsive design improvements
- [ ] Dark mode support
- [ ] Internationalization (i18n)

## Contributing

When contributing to the monitoring system:

1. Follow the existing component patterns
2. Add proper TypeScript types
3. Include error handling for new features
4. Test animations don't impact performance
5. Update documentation for new features

## Support

For issues and questions about the monitoring system:

1. Check the browser console for errors
2. Review the network tab for API responses
3. Verify SSE connection status
4. Check system health indicators
5. Review recent events timeline