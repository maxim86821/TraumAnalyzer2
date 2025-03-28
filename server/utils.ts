import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directory
const UPLOAD_DIR = path.join(__dirname, '../uploads');

/**
 * Ensures the upload directory exists
 */
export async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw error;
  }
}

/**
 * Saves a base64 image to the uploads directory
 * @param base64Data Base64 encoded image data
 * @param mimeType Image MIME type
 * @returns Path to the saved image
 */
export async function saveBase64Image(base64Data: string, mimeType: string): Promise<string> {
  try {
    await ensureUploadDir();
    
    // Generate a unique filename
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const filename = `${randomUUID()}.${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    
    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(filePath, buffer);
    
    // Return the relative path to the file for storage in the database
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Failed to save image:', error);
    throw error;
  }
}

/**
 * Deletes an image from the uploads directory
 * @param imagePath Path to the image
 */
export async function deleteImage(imagePath: string): Promise<void> {
  if (!imagePath) return;

  try {
    // Extract the filename from the path
    const filename = path.basename(imagePath);
    const filePath = path.join(UPLOAD_DIR, filename);
    
    // Check if the file exists before attempting to delete
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (err) {
      // File doesn't exist, no need to do anything
      console.log(`File ${filePath} doesn't exist or cannot be accessed.`);
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
    throw error;
  }
}
