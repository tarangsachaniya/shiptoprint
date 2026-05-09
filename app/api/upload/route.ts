import { v2 as cloudinary } from 'cloudinary';
import { getSession } from '@/lib/session';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file') as File | null;
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  const isVideo = file.type.startsWith('video/');
  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: isVideo ? 'video' : 'image',
    folder:        'shiptoprit',
    ...(isVideo ? {} : { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }),
  });

  return Response.json({ url: result.secure_url });
}
