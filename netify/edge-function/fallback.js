export default async (request, context) => {
    const primaryUrl = "p3k2025.up.railway.app";
    const backupUrl = "https://p3k2025.vercel.app/";
  
    try {
      const response = await fetch(primaryUrl + request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
  
      if (response.ok) {
        return response; // Serve from Railway
      } else {
        throw new Error("Primary down");
      }
    } catch (e) {
      return Response.redirect(backupUrl + request.url, 302); // Redirect to Vercel
    }
  };
  
  export const config = {
    path: "/*",
  };
  