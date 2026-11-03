import { useEffect } from 'react'
import type { Notification } from '../types'
import { Icon } from './Icon'

function Toast({ notification, onDismiss }: { notification: Notification; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(notification.id), 4500)
    return () => window.clearTimeout(timeout)
  }, [notification.id, onDismiss])

  return <div className={`toast in toast-${notification.tone}`}>
    <span className="toast-ic"><Icon name={notification.tone === 'red' ? 'close' : notification.tone === 'amber' ? 'reset' : 'check'} /></span>
    <div><b>{notification.title}</b><small>{notification.description}</small></div>
    <button className="toast-x" aria-label="Cerrar notificación" onClick={() => onDismiss(notification.id)}><Icon name="close" /></button>
    <span className="toast-bar" aria-hidden="true" />
  </div>
}

export function ToastStack({ notifications, onDismiss }: { notifications: Notification[]; onDismiss: (id: number) => void }) {
  return <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">{notifications.map(notification => <Toast key={notification.id} notification={notification} onDismiss={onDismiss} />)}</div>
}
