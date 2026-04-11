'use client'

import React from 'react'

const iconStyles = `
  .vx-icon {
    width: 32px;
    height: 32px;
  }
`

/**
 * Admin Panel Icon Component
 * Displayed in browser tab and admin navigation
 */
export const Icon: React.FC = () => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: iconStyles }} />
      <svg
        className="vx-icon"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="6" fill="#657f66" />
        <path
          d="M16 6C11.58 6 8 9.58 8 14v8c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4v-8c0-4.42-3.58-8-8-8zm0 2c3.31 0 6 2.69 6 6v8c0 1.1-.9 2-2 2h-8c-1.1 0-2-.9-2-2v-8c0-3.31 2.69-6 6-6z"
          fill="white"
        />
        <circle cx="16" cy="13" r="2" fill="white" />
        <path
          d="M13 18c0 1.66 1.34 3 3 3s3-1.34 3-3"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </>
  )
}

export default Icon
