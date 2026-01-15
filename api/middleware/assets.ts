typescript
import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import sharp from 'sharp'

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_QUALITY = 80
const DEFAULT_FORMAT = 'webp'
const MAX_FILE_COUNT = 5

// Allowed image formats
const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg']
const SUPPORTED_OUTPUT_FORMATS = ['jpeg', 'png', 'webp']

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed'))
    }

    // Validate file extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase()
    if (!fileExtension || !ALLOWED_FORMATS.includes(fileExtension)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Invalid file format'))
    }

    cb(null, true)
  },
})

// Multer error handler middleware
export const handleMulterError = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the 5MB limit',
      })
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid file type',
      })
    }
    return res.status(400).json({
      success: false,
      message: 'File upload failed',
    })
  }
  next(err)
}

// Image optimization middleware
export const optimizeImage = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next()
  }

  try {
    const { width, height, quality = DEFAULT_QUALITY, format = DEFAULT_FORMAT } = req.body

    // Validate input parameters
    const validationErrors: string[] = []

    if (width && (isNaN(Number(width)) || Number(width) <= 0)) {
      validationErrors.push('Width must be a positive number')
    }

    if (height && (isNaN(Number(height)) || Number(height) <= 0)) {
      validationErrors.push('Height must be a positive number')
    }

    const qualityNum = Number(quality)
    if (isNaN(qualityNum) || qualityNum < 1 || qualityNum > 100) {
      validationErrors.push('Quality must be a number between 1 and 100')
    }

    if (!SUPPORTED_OUTPUT_FORMATS.includes(format.toLowerCase())) {
      validationErrors.push(`Format must be one of: ${SUPPORTED_OUTPUT_FORMATS.join(', ')}`)
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid optimization parameters',
        errors: validationErrors,
      })
    }

    let image = sharp(req.file.buffer)

    // Auto-orient based on EXIF data
    image = image.rotate()

    // Resize if dimensions provided
    if (width || height) {
      const resizeOptions: sharp.ResizeOptions = {
        fit: 'inside',
        withoutEnlargement: true,
      }

      if (width) {
        resizeOptions.width = Math.min(Math.max(1, Math.floor(Number(width))), 10000)
      }

      if (height) {
        resizeOptions.height = Math.min(Math.max(1, Math.floor(Number(height))), 10000)
      }

      image = image.resize(resizeOptions)
    }

    // Convert to specified format with validated quality
    const validatedQuality = Math.min(Math.max(1, Math.floor(qualityNum)), 100)

    switch (format.toLowerCase()) {
      case 'jpeg':
        image = image.jpeg({ quality: validatedQuality })
        break
      case 'png':
        image = image.png({ quality: validatedQuality })
        break
      case 'webp':
        image = image.webp({ quality: validatedQuality })
        break
      default:
        image = image.webp({ quality: validatedQuality })
    }

    const optimizedBuffer = await image.toBuffer()

    // Check if optimization actually reduced size
    if (optimizedBuffer.length > req.file.buffer.length) {
      console.warn('Image optimization did not reduce file size')
    }

    // Replace original file with optimized version
    req.file = {
      ...req.file,
      buffer: optimizedBuffer,
      size: optimizedBuffer.length,
      mimetype: `image/${format.toLowerCase() === 'jpeg' ? 'jpeg' : format.toLowerCase()}`,
    }

    next()
  } catch (error) {
    if (error instanceof sharp.SharpError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to process image',
        error: 'Invalid image file',
      })
    }
    next(error)
  }
}

// File upload middleware
export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName)
}

// Multiple file upload
export const uploadMultiple = (fieldName: string, maxCount: number = MAX_FILE_COUNT) => {
  if (maxCount < 1 || maxCount > 10) {
    throw new Error('maxCount must be between 1 and 10')
  }
  return upload.array(fieldName, maxCount)
}

// File validation middleware
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    })
  }

  // Validate single file
  if (req.file) {
    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is empty',
      })
    }
  }

  // Validate multiple files
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files as Express.Multer.File[]) {
      if (!file.buffer || file.buffer.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'One or more uploaded files are empty',
        })
      }
    }
  }

  next()
}

// Asset optimization middleware
export const optimizeAssets = (req: Request, res: Response, next: NextFunction) => {
  // Set appropriate headers for static assets
  const staticAssetRegex = /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)$/
  
  if (req.url.match(staticAssetRegex)) {
    // Set long cache headers for static assets
    res.set('Cache-Control', 'public, max-age=31536000, immutable')
    res.set('Vary', 'Accept-Encoding')
  }

  next()
}

// CDN optimization middleware
export const cdnOptimization = (req: Request, res: Response, next: NextFunction) => {
  // Add CDN-specific headers
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-Frame-Options', 'DENY')
  res.set('X-XSS-Protection', '1; mode=block')
  
  // Add security headers for CDN
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)$/)) {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  next()
}

// Export multer instance for custom usage
export { upload }