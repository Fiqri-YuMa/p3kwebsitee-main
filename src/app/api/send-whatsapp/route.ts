// app/api/send-whatsapp/route.ts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const text = searchParams.get('text');
    
    // Gunakan response langsung tanpa variabel
    const apiResponse = await fetch(
      `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${text}&apikey=6242351`
    );
  
    return new Response(await apiResponse.text(), {
      status: apiResponse.status,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }