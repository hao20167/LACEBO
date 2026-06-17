const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const TIKTOK_HOSTS = new Set([
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vm.tiktok.com',
  'vt.tiktok.com',
]);

const getYouTubeId = (url) => {
  if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] || null;
  }

  if (url.pathname === '/watch') {
    return url.searchParams.get('v');
  }

  const parts = url.pathname.split('/').filter(Boolean);
  if (['embed', 'shorts', 'live'].includes(parts[0])) {
    return parts[1] || null;
  }

  return null;
};

const getTikTokId = (url) => {
  const parts = url.pathname.split('/').filter(Boolean);
  const videoIndex = parts.indexOf('video');
  if (videoIndex !== -1) return parts[videoIndex + 1] || null;
  if (parts[0] === 'embed' && parts[1] === 'v2') return parts[2] || null;
  return null;
};

export const getVideoEmbed = (value) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (YOUTUBE_HOSTS.has(hostname)) {
      const id = getYouTubeId(url);
      if (!id || !/^[\w-]{6,}$/.test(id)) return null;
      return {
        provider: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(id)}`,
        title: 'YouTube video',
        aspectClass: 'aspect-video',
      };
    }

    if (TIKTOK_HOSTS.has(hostname)) {
      const id = getTikTokId(url);
      if (!id || !/^\d{10,}$/.test(id)) return null;
      return {
        provider: 'tiktok',
        embedUrl: `https://www.tiktok.com/embed/v2/${encodeURIComponent(id)}`,
        title: 'TikTok video',
        aspectClass: 'aspect-[9/16]',
      };
    }
  } catch {
    return null;
  }

  return null;
};

export const isSupportedVideoUrl = (value) => Boolean(getVideoEmbed(value));
