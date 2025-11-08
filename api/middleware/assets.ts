import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import sharp from 'sharp'

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false)
    }
    cb(null, true)
  },
})

// Image optimization middleware
export const optimizeImage = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next()
  }

  try {
    const { width, height, quality = 80, format = 'webp' } = req.body

    let image = sharp(req.file.buffer)

    // Auto-orient based on EXIF data
    image = image.rotate()

    // Resize if dimensions provided
    if (width || height) {
      image = image.resize({
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    // Convert to specified format
    switch (format) {
      case 'jpeg':
        image = image.jpeg({ quality: parseInt(quality) })
        break
      case 'png':
        image = image.png({ quality: parseInt(quality) })
        break
      case 'webp':
        image = image.webp({ quality: parseInt(quality) })
        break
      default:
        image = image.webp({ quality: parseInt(quality) })
    }

    const optimizedBuffer = await image.toBuffer()

    // Replace original file with optimized version
    req.file = {
      ...req.file,
      buffer: optimizedBuffer,
      size: optimizedBuffer.length,
    }

    next()
  } catch (error) {
    next(error)
  }
}

// File upload middleware
export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName)
}

// Multiple file upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
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

  next()
}

// Asset optimization middleware
export const optimizeAssets = (req: Request, res: Response, next: NextFunction) => {
  // Set appropriate headers for static assets
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    // Set long cache headers for static assets
    res.set('Cache-Control', 'public, max-age=31536000, immutable')
    res.set('Vary', 'Accept-Encoding')
    
    // Enable compression for text-based assets
    if (req.url.match(/\.(css|js|svg|json)$/)) {
      res.set('Content-Encoding', 'gzip')
    }
  }

  next()
}

// CDN optimization
export const cdnOptimization = (req: Request, res: Response, next: NextFunction) => {
  // Add CDN-specific headers
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  // Add timing allow origin for performance monitoring
  res.set('Timing-Allow-Origin', '*')
  
  next()
}