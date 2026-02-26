// Force rebuild v2 - 2026-01-19T19:05
import { createClient } from "npm:@supabase/supabase-js@2";
import { previewEmail, previewEmailMock, getMockTemplateData } from "../_shared/emails/preview.ts";
import { listAvailableTemplates } from "../_shared/emails/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  console.log('[email-preview] v2 - Request received:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    if (req.method === 'GET') {
      const type = url.searchParams.get('type');
      
      if (!type) {
        return new Response(
          JSON.stringify({ available_templates: listAvailableTemplates() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const mockData = getMockTemplateData(type);
      if (Object.keys(mockData).length === 0) {
        return new Response(
          JSON.stringify({ error: `No mock data for type: ${type}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const result = await previewEmailMock(type, mockData);
      return new Response(
        JSON.stringify({ type, template_data: mockData, ...result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (req.method === 'POST') {
      const body = await req.json();
      const { emailMessageId, type, templateData } = body;
      
      let result;
      
      if (emailMessageId) {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );
        result = await previewEmail(emailMessageId, supabaseAdmin);
      } else if (type) {
        const data = templateData || getMockTemplateData(type);
        const rendered = await previewEmailMock(type, data);
        result = { type, template_data: data, ...rendered };
      } else {
        return new Response(
          JSON.stringify({ error: 'Provide emailMessageId or type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (err) {
    const error = err as Error;
    console.error('[email-preview] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
