
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export async function setupStorageBucket(supabase: SupabaseClient) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'presentation_images');
    
    if (!bucketExists) {
      const { error: createBucketError } = await supabase
        .storage
        .createBucket('presentation_images', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg'],
          fileSizeLimit: 5242880, // 5MB
        });

      if (createBucketError) {
        throw createBucketError;
      }
    }
  } catch (error) {
    console.error('Error managing storage bucket:', error);
    throw new Error('Failed to setup storage bucket');
  }
}

export async function uploadAndGetImageUrl(supabase: SupabaseClient, imageBlob: Blob): Promise<string> {
  const filePath = `${crypto.randomUUID()}.png`;
  const { error: uploadError } = await supabase.storage
    .from('presentation_images')
    .upload(filePath, imageBlob, {
      contentType: 'image/png',
      upsert: false
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('presentation_images')
    .getPublicUrl(filePath);

  return publicUrl;
}
