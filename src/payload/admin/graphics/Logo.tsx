'use client'

import React from 'react'

const logoStyles = `
  .vx-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
  }

  .vx-logo__svg {
    width: 36px;
    height: 36px;
  }

  .vx-logo__text {
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: -0.5px;
  }
`

/**
 * Admin Panel Logo Component
 * Displayed in admin sidebar/header
 */
export const Logo: React.FC = () => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: logoStyles }} />
      <div className="vx-logo">
        <svg
          className="vx-logo__svg"
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
        <span className="vx-logo__text">Puff puff pass</span>
      </div>
    </>
  )
}

export default Logo
