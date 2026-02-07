import * as React from "react"
import { Link } from "gatsby"

interface NavigationButtonProps {
  to: string
  children: React.ReactNode
  className?: string
}

export default function NavigationButton({ to, children, className = "" }: NavigationButtonProps) {
  const defaultClasses = "bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105"
  
  return (
    <Link
      to={to}
      className={[defaultClasses, className].filter(Boolean).join(" ")}
    >
      {children}
    </Link>
  )
}
