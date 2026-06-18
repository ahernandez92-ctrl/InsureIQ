import { supabaseAdmin } from "@/lib/supabase";

const BUCKET_NAME = "insureiq-reports";

/**
 * Upload a PDF report to Supabase Storage
 * @param profileId The client profile ID (used as folder name)
 * @param pdfBuffer The PDF data
 * @returns The public URL of the uploaded file
 */
export async function uploadReportPdf(
  profileId: string,
  pdfBuffer: Buffer
): Promise<string | null> {
  if (!supabaseAdmin) {
    console.error("Supabase Admin client not initialized. Missing SUPABASE_SERVICE_ROLE_KEY?");
    return null;
  }

  const filename = `${profileId}/report-${Date.now()}.pdf`;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filename, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return null;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error("Unexpected error during PDF upload:", error);
    return null;
  }
}

/**
 * Delete a PDF report from Supabase Storage
 */
export async function deleteReportPdf(path: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([path]);

    return !error;
  } catch {
    return false;
  }
}
