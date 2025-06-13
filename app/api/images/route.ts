import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fileName = url.searchParams.get('file');
    
    if (!fileName) {
      return new Response('Missing filename parameter', { status: 400 });
    }
    
    const filePath = path.join(process.cwd(), 'public', 'shared-images', fileName);
    
    const fileData = await fs.readFile(filePath);
    
    return new Response(fileData, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Image serving error:', error);
    return new Response('Image not found', { status: 404 });
  }
}