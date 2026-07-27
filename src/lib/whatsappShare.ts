/**
 * Helper to share a photo directly to a client's WhatsApp number.
 */
export async function sharePhotoOnWhatsApp({
  imageUrl,
  phoneNo,
  clientName,
  title,
}: {
  imageUrl: string;
  phoneNo?: string;
  clientName?: string;
  title?: string;
}) {
  if (!imageUrl) return;

  const cleanPhone = (phoneNo || "").replace(/\D/g, "");
  const formattedPhone =
    cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const greeting = clientName ? `Hello ${clientName}!` : "Hello!";
  const categoryStr = title ? ` (${title})` : "";
  const baseMessage = `${greeting} Here is a photo from KBM Boutique${categoryStr}`;

  // If it's a web HTTP/HTTPS URL (Cloudinary or hosted), share link directly
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    const fullMessage = `${baseMessage}:\n${imageUrl}`;
    const whatsappUrl = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(fullMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
    window.open(whatsappUrl, "_blank");
    return;
  }

  // If it's a Base64 image, attempt Web Share API with binary File object first
  if (imageUrl.startsWith("data:image/")) {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], "kbm-boutique-photo.png", {
        type: blob.type || "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "KBM Boutique Photo",
          text: baseMessage,
        });
        return;
      }
    } catch (_) {
      /* Fallback if Web Share API was dismissed or unsupported */
    }
  }

  // Fallback to direct WhatsApp link
  const whatsappUrl = formattedPhone
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(baseMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(baseMessage)}`;
  window.open(whatsappUrl, "_blank");
}
