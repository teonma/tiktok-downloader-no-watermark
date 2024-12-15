'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { processUrl } from '../lib/snapTikProcessor'

export default function Home() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await processUrl(url)
      setResult(data)
    } catch (err) {
      setError('An error occurred while processing the URL.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (downloadUrl: string, quality: string) => {
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `tiktok_video_${quality}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter TikTok URL"
            className="flex-grow"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Process'}
          </Button>
        </div>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {result && result.type === 'video' && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Download Options:</h2>
          <div className="flex flex-col gap-2">
            {result.data.sources.slice(0, 2).map((source: any, index: number) => (
              <Button
                key={index}
                onClick={() => handleDownload(source.url, `high_quality_server_${index + 1}`)}
                className="w-full"
              >
                Download High Quality (Server {index + 1})
              </Button>
            ))}
            {result.data.sources[2] && (
              <Button
                onClick={() => handleDownload(result.data.sources[2].url, 'lower_quality')}
                className="w-full"
              >
                Download Lower Quality
              </Button>
            )}
          </div>
        </div>
      )}

      {result && result.type === 'photo' && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Download Photo:</h2>
          <Button
            onClick={() => handleDownload(result.data.sources[0].url, 'photo')}
            className="w-full"
          >
            Download Photo
          </Button>
        </div>
      )}

      {result && result.type === 'slideshow' && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Download Slideshow Images:</h2>
          <div className="flex flex-col gap-2">
            {result.data.photos.map((photo: any, index: number) => (
              <Button
                key={index}
                onClick={() => handleDownload(photo.sources[0].url, `slide_${index + 1}`)}
                className="w-full"
              >
                Download Slide {index + 1}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

