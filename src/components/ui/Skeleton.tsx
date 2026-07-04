'use client'

interface SkeletonProps {
  className?: string
  height?: string | number
  width?: string | number
  rounded?: string
}

export function Skeleton({ className = '', height, width, rounded = 'rounded-md' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${rounded} ${className}`}
      style={{ height, width }}
      aria-hidden="true"
    />
  )
}

export function LoginSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full animate-pulse">
      <div className="flex flex-col gap-2">
        <Skeleton height={14} width={60} rounded="rounded" />
        <Skeleton height={44} rounded="rounded-lg" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton height={14} width={80} rounded="rounded" />
        <Skeleton height={44} rounded="rounded-lg" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton height={14} width={110} rounded="rounded" />
        <Skeleton height={14} width={90} rounded="rounded" />
      </div>
      <Skeleton height={44} rounded="rounded-lg" />
    </div>
  )
}
