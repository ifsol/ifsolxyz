import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';

type Params = Promise<{
  filename: string;
}>

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { filename } = await params;
    
    // Validate filename to prevent directory traversal attacks
    if (!filename || filename.includes('..')) {
      return new Response('Invalid filename', { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'shared-images', filename);
    
    try {
      // Check if file exists
      await fs.access(filePath);
    } catch (error) {
      console.error('Error', error);
      return new Response('Image not found', { status: 404 });
    }

    // Read file data
    const fileData = await fs.readFile(filePath);

    // Return image with appropriate headers
    return new Response(fileData, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response('Error serving image', { status: 500 });
  }
}