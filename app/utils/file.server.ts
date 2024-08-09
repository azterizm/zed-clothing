import fs from 'fs'

export function toDataUri(imgPath: string) {
  // Read data
  const bitmap = fs.readFileSync(imgPath);

  // convert binary data to base64 encoded string
  const base64Image = Buffer.from(bitmap).toString('base64');

  // Get image file extension
  const ext = imgPath.split('.').pop();

  // complete data URI
  const uri = `data:image/${ext};base64,${base64Image}`;

  return uri;
}
