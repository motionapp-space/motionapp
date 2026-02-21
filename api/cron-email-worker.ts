export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const workerSecret = process.env.WORKER_SECRET;

  if (!supabaseUrl || !workerSecret) {
    console.error('Missing environment variables: VITE_SUPABASE_URL or WORKER_SECRET');
    return res.status(500).json({ 
      error: 'Missing environment variables: VITE_SUPABASE_URL or WORKER_SECRET' 
    });
  }

  try {
    // Ensure URL doesn't end with slash before appending path
    const baseUrl = supabaseUrl.replace(/\/$/, '');
    const functionUrl = `${baseUrl}/functions/v1/email-worker`;
    
    console.log(`Triggering Supabase function: ${functionUrl}`);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-secret': workerSecret,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
       console.error(`Supabase function failed with status ${response.status}`);
       return res.status(response.status).json({ 
         error: 'Supabase function failed', 
         details: data 
       });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error triggering Supabase function:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal Server Error' 
    });
  }
}
