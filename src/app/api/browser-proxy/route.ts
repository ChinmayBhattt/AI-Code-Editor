export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return new Response("Missing target URL parameter", { status: 400 });
    }

    let validUrlStr = targetUrl.trim();
    if (!validUrlStr.startsWith("http://") && !validUrlStr.startsWith("https://")) {
      validUrlStr = "https://" + validUrlStr;
    }

    const urlObj = new URL(validUrlStr);

    // Fetch target webpage from server side (bypassing browser CORS & X-Frame-Options)
    const response = await fetch(urlObj.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") || "text/html";
    let bodyText = await response.text();

    // Inject base tag so relative assets, css, and js resolve correctly to origin server
    const baseHref = `<base href="${urlObj.origin}/" />`;
    if (bodyText.includes("<head>")) {
      bodyText = bodyText.replace("<head>", `<head>${baseHref}`);
    } else if (bodyText.includes("<html>")) {
      bodyText = bodyText.replace("<html>", `<html><head>${baseHref}</head>`);
    }

    // Return HTML response stripping X-Frame-Options & Content-Security-Policy frame headers
    return new Response(bodyText, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "X-Frame-Options": "ALLOWALL",
      },
    });
  } catch (err: any) {
    return new Response(
      `<html><body style="background:#121215;color:#f43f5e;font-family:sans-serif;padding:2rem;">
        <h2>Failed to load webpage</h2>
        <p>${err.message || "Target site refused connection or DNS resolution failed."}</p>
      </body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
