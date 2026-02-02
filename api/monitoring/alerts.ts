// @ts-nocheck
import { Request, Response } from 'express'
import os from 'os'
import axios from 'axios'
import logger from '../utils/logger'

interface Alert {
  id: string
  type: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: number
  acknowledged: boolean
  source: string
  details?: unknown
}

interface NotificationConfig {
  webhookUrl?: string
  platform: 'slack' | 'discord' | 'webhook'
  enabled: boolean
}

class AlertManager {
  private static instance: AlertManager
  private alerts: Alert[] = []
  private checkInterval: NodeJS.Timeout | null = null
  private notifications: NotificationConfig[] = []

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
    this.checkInterval = setInterval(() => {
      this.checkSystemHealth()
    }, 60000)

    // Load initial notification config from env
    if (process.env.SLACK_WEBHOOK_URL) {
      this.notifications.push({
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        platform: 'slack',
        enabled: true
      })
    }
  }

  private checkSystemHealth() {
    const cpus = os.cpus().length
    const loadAvg = os.loadavg()[0]
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memUsage = (usedMem / totalMem) * 100

    const cpuThreshold = 0.8 * cpus
    if (loadAvg > cpuThreshold) {
      const severity = loadAvg > (0.9 * cpus) ? 'critical' : 'warning'
      this.addAlert({
        type: severity,
        message: `High CPU usage: ${loadAvg.toFixed(2)} (threshold: ${cpuThreshold.toFixed(2)})`,
        source: 'system_health',
        details: {
          loadAvg,
          cpuThreshold,
          cpuCount: cpus
        }
      })
    }

    if (memUsage > 90) {
      this.addAlert({
        type: 'critical',
        message: `High memory usage: ${memUsage.toFixed(2)}%`,
        source: 'system_health',
        details: {
          usedMem,
          totalMem,
          memUsage
        }
      })
    }
  }

  addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>) {
    const newAlert: Alert = {
      ...alert,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      acknowledged: false
    }
    this.alerts.push(newAlert)

    if (alert.type === 'error' || alert.type === 'critical') {
      logger.error(`Alert: ${alert.message}`, alert.details)
    } else {
      logger.info(`Alert: ${alert.message}`, alert.details)
    }

    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }

    if (newAlert.type === 'critical' || newAlert.type === 'error') {
      this.sendNotifications(newAlert)
    }
  }

  private async sendNotifications(alert: Alert) {
    for (const config of this.notifications) {
      if (!config.enabled || !config.webhookUrl) continue

      try {
        if (config.platform === 'slack') {
          await axios.post(config.webhookUrl, {
            text: `🚨 *${alert.type.toUpperCase()} ALERT*: ${alert.message}\nSource: ${alert.source}\nDetails: \`\`\`${JSON.stringify(alert.details, null, 2)}\`\`\``
          })
        } else if (config.platform === 'discord') {
          await axios.post(config.webhookUrl, {
            content: `🚨 **${alert.type.toUpperCase()} ALERT**: ${alert.message}\nSource: ${alert.source}`
          })
        }
      } catch (err) {
        logger.error(`Failed to send ${config.platform} notification:`, err)
      }
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