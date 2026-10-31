import 'server-only'
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

/** Stamp every page with the student's university ID (diagonal, faint) + a licence line. */
export async function stampPdf(bytes: Uint8Array, uid: string, email: string) {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const font = await pdf.embedFont(StandardFonts.HelveticaBold)
  const small = await pdf.embedFont(StandardFonts.Helvetica)
  const label = `${uid}`
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize()
    const size = Math.max(18, Math.min(width, height) / 16)
    const w = font.widthOfTextAtSize(label, size)
    for (let y = -height; y < height * 1.6; y += size * 6) {
      for (let x = -width; x < width * 1.6; x += w + size * 4) {
        page.drawText(label, { x, y, size, font, color: rgb(0.06, 0.22, 0.42), opacity: 0.07, rotate: degrees(32) })
      }
    }
    page.drawText(`Licensed to ${uid} (${email}) — personal use only. Do not share.`, {
      x: 24, y: 10, size: 7, font: small, color: rgb(0.45, 0.5, 0.58), opacity: 0.9,
    })
  }
  return pdf.save()
}
