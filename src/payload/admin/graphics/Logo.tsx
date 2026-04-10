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
        <img src="/logo.png" alt="Dragon Logo" className="vx-logo__svg object-cover rounded-md" />
        <span className="vx-logo__text">Dragon</span>
      </div>
    </>
  )
}

export default Logo
