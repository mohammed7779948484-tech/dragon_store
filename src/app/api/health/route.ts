/**
 * Health Check API Endpoint
 *
 * Returns system status, timestamp, and database connectivity.
 * Used for monitoring, load balancer health probes, and uptime verification.
 *
 * @see Constitution: Health check endpoint required in Monitoring Checklist
 * @see impl-plan.md: Task 15.2 — Health Check Endpoint
 */

import { getPayloadClient } from '@/lib/payload'

interface HealthResponse {
    status: 'healthy' | 'degraded'
    timestamp: string
    version: string | undefined
    database: 'connected' | 'error'
    uptime: number
}

export async function GET(): Promise<Response> {
    const startTime = Date.now()
    let dbStatus: 'connected' | 'error' = 'error'

    try {
        // Verify database connectivity via Payload
        const payload = await getPayloadClient()
        await payload.find({
            collection: 'users',
            limit: 1,
            overrideAccess: true,
        })
        dbStatus = 'connected'
    } catch {
        dbStatus = 'error'
    }

    const responseTime = Date.now() - startTime

    const health: HealthResponse = {
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version,
        database: dbStatus,
        uptime: process.uptime(),
    }

    return Response.json(health, {
        status: dbStatus === 'connected' ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Response-Time': `${responseTime}ms`,
        },
    })
}
