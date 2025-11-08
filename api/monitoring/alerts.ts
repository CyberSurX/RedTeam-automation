import { logger } from '../utils/logger'
import { getSystemMetrics } from './health'
import { MetricsCollector } from './metrics'

interface Alert {
  id: string
  type: 'error_rate' | 'response_time' | 'memory_usage' | 'cpu_usage' | 'disk_usage'
  severity: 'warning' | 'critical'
  message: string
  timestamp: number
  value: number
  threshold: number
}

export class AlertManager {
  private static instance: AlertManager
  private alerts: Alert[] = []
  private thresholds = {
    error_rate: 10, // 10% error rate
    response_time: 2000, // 2 seconds
    memory_usage: 90, // 90% memory usage
    cpu_usage: 80, // 80% CPU usage
    disk_usage: 85, // 85% disk usage
  }

  private constructor() {}

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  async checkAlerts() {
    const metrics = MetricsCollector.getInstance().getMetrics()
    const systemMetrics = getSystemMetrics()

    // Check error rate
    if (metrics.errorRate > this.thresholds.error_rate) {
      this.createAlert('error_rate', 'critical', metrics.errorRate, this.thresholds.error_rate)
    }

    // Check response time
    if (metrics.averageResponseTime > this.thresholds.response_time) {
      this.createAlert('response_time', 'warning', metrics.averageResponseTime, this.thresholds.response_time)
    }

    // Check system metrics
    if (systemMetrics.memory.percentage > this.thresholds.memory_usage) {
      this.createAlert('memory_usage', 'critical', systemMetrics.memory.percentage, this.thresholds.memory_usage)
    }

    if ((systemMetrics.cpu.usage / systemMetrics.cpu.cores * 100) > this.thresholds.cpu_usage) {
      this.createAlert('cpu_usage', 'warning', systemMetrics.cpu.usage / systemMetrics.cpu.cores * 100, this.thresholds.cpu_usage)
    }

    if (systemMetrics.disk.percentage > this.thresholds.disk_usage) {
      this.createAlert('disk_usage', 'warning', systemMetrics.disk.percentage, this.thresholds.disk_usage)
    }
  }

  private createAlert(type: Alert['type'], severity: Alert['severity'], value: number, threshold: number) {
    const alert: Alert = {
      id: `${type}_${Date.now()}`,
      type,
      severity,
      message: this.getAlertMessage(type, value, threshold),
      timestamp: Date.now(),
      value,
      threshold,
    }

    this.alerts.push(alert)
    
    // Log alert
    const alertLogger = severity === 'critical' ? logger.error : logger.warn
    alertLogger(`ALERT: ${alert.message}`, {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      value: alert.value,
      threshold: alert.threshold,
    })

    // Send notification (placeholder for external alerting system)
    this.sendNotification(alert)

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }
  }

  private getAlertMessage(type: Alert['type'], value: number, threshold: number): string {
    const messages = {
      error_rate: `Error rate is ${value.toFixed(1)}% (threshold: ${threshold}%)`,
      response_time: `Average response time is ${value.toFixed(0)}ms (threshold: ${threshold}ms)`,
      memory_usage: `Memory usage is ${value.toFixed(1)}% (threshold: ${threshold}%)`,
      cpu_usage: `CPU usage is ${value.toFixed(1)}% (threshold: ${threshold}%)`,
      disk_usage: `Disk usage is ${value.toFixed(1)}% (threshold: ${threshold}%)`,
    }
    return messages[type]
  }

  private sendNotification(alert: Alert) {
    // Placeholder for external notification system
    // This could integrate with services like:
    // - Slack webhooks
    // - PagerDuty
    // - Email notifications
    // - SMS alerts
    
    logger.info(`Notification sent for alert: ${alert.id}`, {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
    })
  }

  getAlerts() {
    return this.alerts
  }

  getActiveAlerts() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    return this.alerts.filter(alert => alert.timestamp > fiveMinutesAgo)
  }

  clearAlert(alertId: string) {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId)
    logger.info(`Alert cleared: ${alertId}`)
  }
}

// Start monitoring loop
export const startMonitoring = () => {
  const alertManager = AlertManager.getInstance()
  
  // Check alerts every 30 seconds
  setInterval(() => {
    alertManager.checkAlerts()
  }, 30000)

  logger.info('Monitoring and alerting started')
}

export const getAlerts = (req: Request, res: Response) => {
  const alertManager = AlertManager.getInstance()
  const alerts = alertManager.getAlerts()
  
  res.json({
    success: true,
    data: alerts,
  })
}

export const getActiveAlerts = (req: Request, res: Response) => {
  const alertManager = AlertManager.getInstance()
  const activeAlerts = alertManager.getActiveAlerts()
  
  res.json({
    success: true,
    data: activeAlerts,
  })
}

export const clearAlert = (req: Request, res: Response) => {
  const { alertId } = req.params
  const alertManager = AlertManager.getInstance()
  
  alertManager.clearAlert(alertId)
  
  res.json({
    success: true,
    message: 'Alert cleared successfully',
  })
}