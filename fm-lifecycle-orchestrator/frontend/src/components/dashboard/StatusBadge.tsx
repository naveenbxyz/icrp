import { Badge } from '../ui/badge'
import { OnboardingStatus, StageStatus, ValidationStatus, OCRStatus, TaskStatus } from '../../types'

interface StatusBadgeProps {
  status: OnboardingStatus | StageStatus | ValidationStatus | OCRStatus | TaskStatus
  type?: 'onboarding' | 'stage' | 'validation' | 'ocr' | 'task'
}

export function StatusBadge({ status, type = 'onboarding' }: StatusBadgeProps) {
  const getVariant = () => {
    if (type === 'onboarding' || type === 'stage') {
      switch (status) {
        case 'completed':
          return 'success'
        case 'in_progress':
          return 'default'
        case 'blocked':
          return 'destructive'
        case 'not_started':
        case 'initiated':
          return 'secondary'
        default:
          return 'default'
      }
    }

    if (type === 'validation') {
      switch (status) {
        case 'validated':
          return 'success'
        case 'rejected':
          return 'destructive'
        case 'pending':
          return 'warning'
        default:
          return 'default'
      }
    }

    if (type === 'ocr') {
      switch (status) {
        case 'completed':
          return 'success'
        case 'processing':
          return 'default'
        case 'failed':
          return 'destructive'
        case 'pending':
          return 'warning'
        default:
          return 'default'
      }
    }

    if (type === 'task') {
      switch (status) {
        case 'completed':
          return 'success'
        case 'in_progress':
          return 'default'
        case 'pending':
          return 'warning'
        default:
          return 'default'
      }
    }

    return 'default'
  }

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Badge variant={getVariant()}>
      {formatStatus(status)}
    </Badge>
  )
}
