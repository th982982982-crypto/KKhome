const CLOUD_NAME = 'dquitg1pa'
const UPLOAD_PRESET = 'KKhome'

export async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error('Upload thất bại')
  const data = await res.json()
  return data.secure_url as string
}
