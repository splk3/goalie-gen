export const getYouTubeVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/)
  return match ? match[1] : ''
}

export const getVimeoVideoId = (url: string): string => {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? match[1] : ''
}

export const getEmbedUrl = (videoUrl: string): string => {
  const youtubeId = getYouTubeVideoId(videoUrl)
  if (youtubeId) return `https://www.youtube.com/embed/${youtubeId}`
  const vimeoId = getVimeoVideoId(videoUrl)
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`
  return ''
}

export const getVideoThumbnail = (videoUrl: string): string => {
  const youtubeId = getYouTubeVideoId(videoUrl)
  return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : ''
}

export const getVideoThumbnailUrl = async (videoUrl: string): Promise<string> => {
  const youtubeThumbnail = getVideoThumbnail(videoUrl)
  if (youtubeThumbnail) return youtubeThumbnail
  const vimeoId = getVimeoVideoId(videoUrl)
  if (vimeoId) {
    try {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`)
      const data = await res.json()
      if (data && data.thumbnail_url) {
        return data.thumbnail_url
      }
    } catch (err) {
      console.error('Failed to fetch Vimeo thumbnail URL:', err)
    }
  }
  return ''
}
