const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Wraps newsletter HTML content in a responsive email layout.
 */
export function wrapNewsletterHtml({
  content,
  senderName,
  brandName,
  unsubscribeUrl,
  trackingPixelUrl,
}: {
  content: string;
  senderName: string;
  brandName?: string;
  unsubscribeUrl: string;
  trackingPixelUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${brandName || senderName}</title>
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    
    /* Email styles */
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f4f4f5; }
    .email-wrapper { width: 100%; background-color: #f4f4f5; padding: 32px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
    .email-header { padding: 32px 32px 24px; border-bottom: 1px solid #e4e4e7; }
    .email-header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #09090b; }
    .email-body { padding: 32px; }
    .email-body h1 { font-size: 24px; font-weight: 700; margin: 0 0 16px; color: #09090b; }
    .email-body h2 { font-size: 20px; font-weight: 600; margin: 24px 0 12px; color: #09090b; }
    .email-body h3 { font-size: 16px; font-weight: 600; margin: 20px 0 8px; color: #09090b; }
    .email-body p { margin: 0 0 16px; font-size: 16px; line-height: 1.65; color: #3f3f46; }
    .email-body a { color: #2563eb; text-decoration: underline; }
    .email-body img { max-width: 100%; height: auto; border-radius: 6px; margin: 16px 0; }
    .email-body blockquote { margin: 16px 0; padding: 12px 20px; border-left: 3px solid #e4e4e7; background: #fafafa; color: #52525b; }
    .email-body ul, .email-body ol { margin: 0 0 16px; padding-left: 24px; }
    .email-body li { margin-bottom: 8px; font-size: 16px; color: #3f3f46; }
    .email-body hr { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
    .email-footer { padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7; text-align: center; }
    .email-footer p { margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5; }
    .email-footer a { color: #71717a; text-decoration: underline; }
    
    /* Button styles */
    .email-body .button { display: inline-block; padding: 12px 24px; background-color: #09090b; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; }
    
    /* Mobile styles */
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; border-radius: 0 !important; }
      .email-body, .email-header, .email-footer { padding: 24px 20px !important; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center">
          <div class="email-container">
            <div class="email-header">
              <h1>${brandName || senderName}</h1>
            </div>
            <div class="email-body">
              ${content}
            </div>
            <div class="email-footer">
              <p>
                You received this email because you subscribed to ${brandName || senderName}.<br>
                <a href="${unsubscribeUrl}">Unsubscribe</a> &middot; 
                Sent via <a href="${APP_URL}">LetterDrop</a>
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
    ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />` : ""}
  </div>
</body>
</html>`;
}

/**
 * Generates the double opt-in confirmation email HTML.
 */
export function confirmationEmailHtml({
  brandName,
  confirmUrl,
}: {
  brandName: string;
  confirmUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your subscription</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f4f4f5; margin: 0; padding: 0; }
    .wrapper { max-width: 500px; margin: 40px auto; background: #fff; border-radius: 12px; padding: 48px 40px; text-align: center; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
    p { color: #52525b; font-size: 15px; margin: 0 0 24px; }
    .button { display: inline-block; padding: 14px 32px; background: #09090b; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .subtext { font-size: 12px; color: #a1a1aa; margin-top: 32px; }
    .subtext a { color: #71717a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <h1>Confirm your subscription</h1>
    <p>You've been invited to subscribe to <strong>${brandName}</strong>. Click the button below to confirm.</p>
    <a href="${confirmUrl}" class="button">Confirm Subscription</a>
    <p class="subtext">If you didn't request this, you can safely ignore this email.<br>Powered by <a href="${APP_URL}">LetterDrop</a></p>
  </div>
</body>
</html>`;
}

/**
 * Rewrites links in HTML content to go through the tracking redirect.
 * Returns the modified HTML and a list of original URLs.
 */
export function rewriteLinksForTracking(
  html: string,
  sendId: string,
  baseUrl: string
): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_match, url) => {
      const trackUrl = `${baseUrl}/api/track/click/${sendId}?url=${encodeURIComponent(url)}`;
      return `href="${trackUrl}"`;
    }
  );
}
