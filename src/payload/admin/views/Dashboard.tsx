'use client'

import React from 'react'

/**
 * Custom Admin Dashboard Component
 *
 * Extends the default Payload admin dashboard with custom widgets
 * and quick actions for vape store management.
 *
 * Note: Payload Admin views run inside Payload's own React tree.
 * We use a scoped <style> tag to avoid inline styles (Constitution compliance)
 * while keeping styles self-contained within the admin frame.
 */

const dashboardStyles = `
  .vx-dashboard {
    padding: 32px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .vx-dashboard__title {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #ffffff;
  }

  .vx-dashboard__subtitle {
    font-size: 16px;
    color: #a1a1aa;
    margin-bottom: 32px;
  }

  .vx-dashboard__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
  }

  .vx-card {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 24px;
    transition: border-color 0.2s ease;
  }

  .vx-card:hover {
    border-color: #3f3f46;
  }

  .vx-card__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .vx-card__icon {
    font-size: 24px;
  }

  .vx-card__label {
    font-size: 14px;
    color: #a1a1aa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .vx-card__value {
    font-size: 32px;
    font-weight: 700;
    color: #ffffff;
  }

  .vx-card__value--accent {
    color: #f8b97e;
  }

  .vx-card__description {
    font-size: 14px;
    color: #71717a;
    margin-top: 8px;
  }

  .vx-actions {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 24px;
  }

  .vx-actions__title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #ffffff;
  }

  .vx-actions__list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .vx-actions__btn {
    display: inline-flex;
    align-items: center;
    padding: 12px 20px;
    color: #ffffff;
    border-radius: 8px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: opacity 0.2s ease;
  }

  .vx-actions__btn:hover {
    opacity: 0.85;
  }

  .vx-actions__btn--primary {
    background: #657f66;
  }

  .vx-actions__btn--secondary {
    background: #27272a;
  }
`

export const Dashboard: React.FC = () => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
      <div className="vx-dashboard">
        <h1 className="vx-dashboard__title">Welcome to Puff puff pass Admin</h1>
        <p className="vx-dashboard__subtitle">
          Manage your products, orders, and store settings from this dashboard.
        </p>

        {/* Quick Stats Grid */}
        <div className="vx-dashboard__grid">
          {/* New Orders Card */}
          <div className="vx-card">
            <div className="vx-card__header">
              <span className="vx-card__icon">🛒</span>
              <span className="vx-card__label">New Orders</span>
            </div>
            <div className="vx-card__value">View Orders</div>
            <p className="vx-card__description">
              Check pending and processing orders
            </p>
          </div>

          {/* Products Card */}
          <div className="vx-card">
            <div className="vx-card__header">
              <span className="vx-card__icon">📦</span>
              <span className="vx-card__label">Products</span>
            </div>
            <div className="vx-card__value">Manage Products</div>
            <p className="vx-card__description">
              Add, edit, or remove products
            </p>
          </div>

          {/* Low Stock Card */}
          <div className="vx-card">
            <div className="vx-card__header">
              <span className="vx-card__icon">⚠️</span>
              <span className="vx-card__label">Low Stock</span>
            </div>
            <div className="vx-card__value vx-card__value--accent">
              Check Stock
            </div>
            <p className="vx-card__description">
              Review low inventory items
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="vx-actions">
          <h2 className="vx-actions__title">Quick Actions</h2>
          <div className="vx-actions__list">
            <a
              href="/admin/collections/products/create"
              className="vx-actions__btn vx-actions__btn--primary"
            >
              + Create Product
            </a>
            <a
              href="/admin/collections/orders"
              className="vx-actions__btn vx-actions__btn--secondary"
            >
              📋 View Orders
            </a>
            <a
              href="/admin/globals/site-settings"
              className="vx-actions__btn vx-actions__btn--secondary"
            >
              ⚙️ Site Settings
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
