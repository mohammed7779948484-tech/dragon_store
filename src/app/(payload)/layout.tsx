/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { ServerFunctionClient } from 'payload'

import config from '@payload-config'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import { importMap } from './admin/importMap'


import { Inter } from 'next/font/google'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
})

export default async function Layout({ children }: { children: React.ReactNode }) {
    const serverFunction: ServerFunctionClient = async function (args) {
        'use server'
        return handleServerFunctions({
            ...args,
            config,
            importMap,
        })
    }

    return (
        <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
            <style dangerouslySetInnerHTML={{
                __html: `
                  :root {
                    --font-sans: ${inter.style.fontFamily};
                    --font-body: ${inter.style.fontFamily};
                  }
                  body, .payload-default {
                    font-family: var(--font-sans), system-ui, sans-serif !important;
                  }
                `
            }} />
            <div className={inter.variable}>
                {children}
            </div>
        </RootLayout>
    )
}
