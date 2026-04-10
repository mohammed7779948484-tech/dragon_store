import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary'
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import { env } from '@/core/config/env'
import fs from 'fs'

// Explicitly configure Cloudinary using validated environment variables
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true,
    })
}

export const cloudinaryAdapter = (): Adapter => {
    return ({ collection, prefix }) => {
        return {
            name: 'cloudinary',
            generateURL: ({ filename, data }) => {
                if (!env.CLOUDINARY_CLOUD_NAME) {
                    throw new Error('CLOUDINARY_CLOUD_NAME is not configured')
                }

                // Return persisted secure_url if available
                if (data?.cloudinary_secure_url) {
                    return data.cloudinary_secure_url as string
                }

                // If standard url exists (after our new fix), return it
                if (data?.url) {
                    return data.url as string
                }

                // Fallback logical URL generation
                const folder = prefix ? `${prefix}/${collection.slug}` : collection.slug
                return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${folder}/${filename}`
            },
            handleDelete: async ({ doc, filename }) => {
                try {
                    // Always prefer stored public_id
                    let public_id = (doc as any).cloudinary_public_id

                    if (!public_id) {
                        // Fallback: derive from filename
                        const folder = prefix ? `${prefix}/${collection.slug}` : collection.slug
                        const filenameWithoutExt = filename.split('.').slice(0, -1).join('.')
                        public_id = `${folder}/${filenameWithoutExt}`
                    }

                    await cloudinary.uploader.destroy(public_id)
                } catch (error) {
                    console.error('Cloudinary deletion failed. Continuing Payload operation gracefully.', error)
                }
            },
            handleUpload: ({ file }): Promise<any> => {
                return new Promise((resolve, reject) => {
                    const folder = prefix ? `${prefix}/${collection.slug}` : collection.slug
                    const parts = file.filename.split('.')
                    const filenameWithoutExt = parts.length > 1 ? parts.slice(0, -1).join('.') : file.filename

                    const options: UploadApiOptions = {
                        folder,
                        public_id: filenameWithoutExt,
                        resource_type: 'auto',
                        overwrite: true,
                    }

                    const uploadCallback = (error: any, result?: UploadApiResponse) => {
                        if (error || !result) {
                            return reject(error || new Error('Upload failed without error message'))
                        }

                        // Return metadata to be merged dynamically into the document.
                        // We include standard `url`, `width`, and `height` for Payload Admin preview, alongside custom fields
                        resolve({
                            url: result.secure_url,
                            width: result.width,
                            height: result.height,
                            cloudinary_public_id: result.public_id,
                            cloudinary_secure_url: result.secure_url,
                        } as any)
                    }

                    // Properly support Streams (tempFilePath) OR raw buffers
                    if (file.tempFilePath) {
                        const stream = cloudinary.uploader.upload_stream(options, uploadCallback)
                        fs.createReadStream(file.tempFilePath).pipe(stream)
                    } else if (file.buffer) {
                        const stream = cloudinary.uploader.upload_stream(options, uploadCallback)
                        stream.end(file.buffer)
                    } else {
                        reject(new Error('No buffer or tempFilePath found in file upload'))
                    }
                })
            },
            staticHandler: (_req, _args) => {
                return new Response(null, { status: 404, statusText: 'Not Found' })
            },
        }
    }
}
