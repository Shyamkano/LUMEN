import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'post-images';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`[Upload API] Starting upload for bucket: ${bucket}, file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    const ext = file.name.split('.').pop()?.toLowerCase();
    let effectiveType = file.type;
    
    // Fallback if browser doesn't provide type
    if (!effectiveType && ext) {
      if (['jpg', 'jpeg'].includes(ext)) effectiveType = 'image/jpeg';
      else if (ext === 'png') effectiveType = 'image/png';
      else if (ext === 'gif') effectiveType = 'image/gif';
      else if (ext === 'webp') effectiveType = 'image/webp';
      else if (ext === 'avif') effectiveType = 'image/avif';
      else if (ext === 'mp3') effectiveType = 'audio/mpeg';
      else if (ext === 'wav') effectiveType = 'audio/wav';
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'];
    const allowedTypes = bucket === 'audio-posts' ? allowedAudioTypes : allowedImageTypes;

    if (!allowedTypes.includes(effectiveType)) {
      console.warn(`[Upload API] Invalid file type: ${effectiveType} (original: ${file.type}, ext: ${ext})`);
      return NextResponse.json({ error: `Invalid file type: ${effectiveType || 'unknown'}. Allowed: ${allowedTypes.join(', ')}` }, { status: 400 });
    }

    // Max file size: 50MB for audio, 10MB for images
    const maxSize = bucket === 'audio-posts' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.warn(`[Upload API] File too large: ${file.size} > ${maxSize}`);
      return NextResponse.json({ error: `File too large. Max size is ${maxSize / (1024 * 1024)}MB` }, { status: 400 });
    }

    const fileName = `${user.id}/${Date.now()}.${ext}`;
    console.log(`[Upload API] Target path: ${fileName}`);

    // Convert File to Buffer for Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error(`[Upload API] Supabase storage error:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log(`[Upload API] Success! URL: ${urlData.publicUrl}`);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
      size: file.size,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error(`[Upload API] Unexpected error:`, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
