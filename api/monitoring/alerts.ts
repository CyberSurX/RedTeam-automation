import { Request, Response } from 'express'
import logger from '../utils/logger'

interface Alert {
  id: string
  type: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: number
  acknowledged: boolean
  source: string
  details?: any
}

class AlertManager {
  private static instance: AlertManager
  private alerts: Alert[] = []
  private checkInterval: NodeJS.Timeout | null = null

  private constructor() { }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  startMonitoring() {
    if (this.checkInterval) return

    logger.info('Alert monitoring started')
    // periodic checks could go here
    this.checkInterval = setInterval(() => {
      this.checkSystemHealth()
    }, 60000) // Check every minute
  }

  private checkSystemHealth() {
    // Implement periodic health checks that might trigger alerts
    // For now, just a placeholder
  }

  addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>) {
    const newAlert: Alert = {
      ...alert,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      acknowledged: false
    }
    this.alerts.push(newAlert)

    // Log based on severity
    if (alert.type === 'error' || alert.type === 'critical') {
      logger.error(`Alert: ${alert.message}`, alert.details)
    } else {
      logger.info(`Alert: ${alert.message}`, alert.details)
    }

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }
  }

  getAlerts(filter?: { type?: string, acknowledged?: boolean }) {
    let filtered = this.alerts
    if (filter?.type) {
      filtered = filtered.filter(a => a.type === filter.type)
    }
    if (filter?.acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === filter.acknowledged)
    }
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  clearAlert(id: string) {
    this.alerts = this.alerts.filter(a => a.id !== id)
  }
}

export const startMonitoring = () => {
  AlertManager.getInstance().startMonitoring()
}

export const getAlerts = (req: Request, res: Response) => {
  const alerts = AlertManager.getInstance().getAlerts()
  res.json({ success: true, data: alerts })
}

export const getActiveAlerts = (req: Request, res: Response) => {
  const alerts = AlertManager.getInstance().getAlerts({ acknowledged: false })
  res.json({ success: true, data: alerts })
}

export const clearAlert = (req: Request, res: Response) => {
  const { alertId } = req.params
  AlertManager.getInstance().clearAlert(alertId)
  res.json({ success: true, message: 'Alert cleared' })
}
