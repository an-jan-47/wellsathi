import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const allowedOrigins = [
  "http://localhost:5173",
  "https://wellsathi-connect.vercel.app",
  "https://wellsathi.in"
];

serve(async (req: Request) => {
  // Handle CORS
  const origin = req.headers.get("Origin") || "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ensure it's a multipart form data request
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return new Response(JSON.stringify({ error: 'Invalid form data' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const file = formData.get('image') as File;
    const doctorId = formData.get('doctor_id') as string;

    if (!file || !doctorId) {
      return new Response(JSON.stringify({ error: 'Missing image or doctor_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Security: Validate File Size (Edge limits to 100KB to be safe, optimally <30KB as per instructions but allowing minor overhead)
    if (file.size > 100 * 1024) {
      return new Response(JSON.stringify({ error: 'Image exceeds secure size limit (100KB)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Convert File to Uint8Array to check magic numbers
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Security: Validate Magic Numbers for WebP (RIFF....WEBP)
    // WebP signature: bytes 0-3 are 'RIFF', bytes 8-11 are 'WEBP'
    if (
      bytes.length < 12 ||
      bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46 ||
      bytes[8] !== 0x57 || bytes[9] !== 0x45 || bytes[10] !== 0x42 || bytes[11] !== 0x50
    ) {
      return new Response(JSON.stringify({ error: 'Invalid file signature. Only secure WebP formats accepted.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Init Admin Client to bypass RLS for Storage (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate secure filename
    const uuid = crypto.randomUUID();
    const filePath = `doctors/${doctorId}/${uuid}.webp`;

    // Upload to Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('doctor-profiles')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get Public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('doctor-profiles')
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({ url: publicUrlData.publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
