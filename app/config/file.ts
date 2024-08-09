import { unstable_createFileUploadHandler } from '@remix-run/node'

export const fileHandler = unstable_createFileUploadHandler({
  directory: 'uploads',
  maxPartSize: 6e8,
  avoidFileConflicts: true,
  file: (file) => file.filename,
})

