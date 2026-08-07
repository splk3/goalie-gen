import { isValidDrillVideoUrl } from "./drillVideo";

export const getYouTubeVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/);
  return match ? match[1] : "";
};

export const getVimeoVideoId = (url: string): string => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : "";
};

export const getVimeoVideoHash = (url: string): string => {
  // Handles https://vimeo.com/ID/HASH format (unlisted videos)
  const match = url.match(/vimeo\.com\/\d+\/([\w]+)/);
  return match ? match[1] : "";
};

export const getEmbedUrl = (videoUrl: string): string => {
  if (!isValidDrillVideoUrl(videoUrl)) return "";
  const youtubeId = getYouTubeVideoId(videoUrl);
  if (youtubeId) return `https://www.youtube.com/embed/${youtubeId}`;
  const vimeoId = getVimeoVideoId(videoUrl);
  if (vimeoId) {
    const vimeoHash = getVimeoVideoHash(videoUrl);
    return vimeoHash
      ? `https://player.vimeo.com/video/${vimeoId}?h=${vimeoHash}`
      : `https://player.vimeo.com/video/${vimeoId}`;
  }
  return "";
};

export const getVideoThumbnail = (videoUrl: string): string => {
  const youtubeId = getYouTubeVideoId(videoUrl);
  return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : "";
};

export const getVideoThumbnailUrl = async (videoUrl: string): Promise<string> => {
  const youtubeThumbnail = getVideoThumbnail(videoUrl);
  if (youtubeThumbnail) return youtubeThumbnail;
  const vimeoId = getVimeoVideoId(videoUrl);
  if (vimeoId) {
    try {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`);
      const data = await res.json();
      if (data && data.thumbnail_url) {
        return data.thumbnail_url;
      }
    } catch (err) {
      console.error("Failed to fetch Vimeo thumbnail URL:", err);
    }
  }
  return "";
};
