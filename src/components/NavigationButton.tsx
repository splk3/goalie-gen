import * as React from "react"
import { Link } from "gatsby"

interface NavigationButtonProps {
  to: string
  children: React.ReactNode
  className?: string
  variant?: "blue" | "red"
}

export default function NavigationButton({ to, children, className = "", variant = "blue" }: NavigationButtonProps) {
  const variantClasses = {
    blue: "bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700",
    red: "bg-usa-red hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
  }
  
  const baseClasses = "text-usa-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors transform hover:scale-105 text-center"
  const defaultClasses = `${baseClasses} ${variantClasses[variant]}`
  
  return (
    <Link
      to={to}
      className={[defaultClasses, className].filter(Boolean).join(" ")}
    >
      {children}
    </Link>
  )
}
