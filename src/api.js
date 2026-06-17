export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// base64 data URI-ni serverə (Cloudinary) yüklə, URL qaytar.
// #4: şəkillər DB-də base64 yox, fayl kimi saxlanılır, DB-də yalnız URL olur.
export async function uploadImage(dataUri, folder = 'misc') {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const r = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ image: dataUri, folder }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Şəkil yüklənmədi');
  return d.url;
}

// Upload alınmazsa (Cloudinary açarı yoxdursa və ya xəta) base64-ə geri düş — saxlama sınmasın.
export async function uploadImageSafe(dataUri, folder = 'misc') {
  try { return await uploadImage(dataUri, folder); }
  catch { return dataUri; }
}
