'use client'

import { useEffect, useState } from 'react'
import { activityRepository, type ActivityItem } from '@/lib/repositories/activity.repository'

export function useRecentActivity(limit = 8) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    activityRepository.getRecent(limit)
      .then(res => { if (active) setActivities(res) })
      .catch(() => { if (active) setActivities([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [limit])

  return { activities, loading }
}
