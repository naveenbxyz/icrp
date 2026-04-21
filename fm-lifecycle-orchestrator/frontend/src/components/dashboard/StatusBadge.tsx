import { Badge, type BadgeProps } from '../ui/badge'

interface StatusBadgeProps {
  status: string
  type?: 'onboarding' | 'stage' | 'validation' | 'ocr' | 'task'
}

export function StatusBadge({ status, type = 'onboarding' }: StatusBadgeProps) {
  const variant: BadgeProps['variant'] = resolveVariant(status, type)

  return <Badge variant={variant}>{formatStatus(status)}</Badge>
}

function resolveVariant(status: string, type: string): BadgeProps['variant'] {
  if (type === 'onboarding' || type === 'stage') {
    switch (status) {
      case 'completed':
        return 'subtle-success'
      case 'in_progress':
        return 'subtle-primary'
      case 'blocked':
        return 'subtle-destructive'
      case 'not_started':
      case 'initiated':
        return 'subtle-default'
    }
  }

  if (type === 'validation') {
    switch (status) {
      case 'validated':
        return 'subtle-success'
      case 'rejected':
        return 'subtle-destructive'
      case 'pending':
        return 'subtle-warning'
    }
  }

  if (type === 'ocr') {
    switch (status) {
      case 'completed':
        return 'subtle-success'
      case 'processing':
        return 'subtle-primary'
      case 'failed':
        return 'subtle-destructive'
      case 'pending':
        return 'subtle-warning'
    }
  }

  if (type === 'task') {
    switch (status) {
      case 'completed':
        return 'subtle-success'
      case 'in_progress':
        return 'subtle-primary'
      case 'pending':
        return 'subtle-warning'
    }
  }

  return 'subtle-default'
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
