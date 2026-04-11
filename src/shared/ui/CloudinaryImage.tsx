'use client'

import Image, { ImageProps } from 'next/image'
import { CldImage, CldImageProps } from 'next-cloudinary'

export type CloudinaryImageProps = Omit<ImageProps, 'src'> & {
    src?: string | null
    publicId?: string | null
    /** Optional Cloudinary specific props (e.g. transformations) */
    cldProps?: Omit<CldImageProps, 'src' | 'alt' | 'width' | 'height'>
}

/**
 * Universal Image Wrapper
 * Decides whether to use standard Next.js <Image /> or <CldImage /> natively.
 * Enforces Option 2: public_id as the primary source of truth.
 */
export function CloudinaryImage({ src, publicId, alt, cldProps, ...props }: CloudinaryImageProps) {
    if (publicId) {
        return (
            <CldImage
                src={publicId}
                alt={alt || ''}
                width={props.width as number}
                height={props.height as number}
                format="auto"    // Cloudinary 2026 automatic quality & format
                quality="auto"
                {...cldProps}
                {...props}
            />
        )
    }

    if (src) {
        return (
            <Image
                src={src}
                alt={alt || ''}
                {...props}
            />
        )
    }

    // Render nothing or placeholder if neither is provided
    return null
}
