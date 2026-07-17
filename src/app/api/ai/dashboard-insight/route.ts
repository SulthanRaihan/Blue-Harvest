import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'llama-3.1-8b-instant'

interface DashboardInsightRequest {
  deltaPendapatanPct: number | null
  totalPendapatan: number
  totalModal: number
  menungguApproval: number
  siklusAktif: number
  roiPerKategori: { kategori: string; roiRata: number; jumlahSiklus: number }[]
  komoditasBreakdown: { komoditas: string; jumlah: number }[]
}

export interface DashboardInsightResponse {
  insight: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as DashboardInsightRequest
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY belum dikonfigurasi' }, { status: 500 })

    const rupiah = (n: number) => `Rp${Math.round(n).toLocaleString('id-ID')}`

    const roiText = body.roiPerKategori.length > 0
      ? body.roiPerKategori.map(r => `${r.kategori} (${r.jumlahSiklus} siklus): rata-rata ROI ${r.roiRata.toFixed(1)}%`).join('; ')
      : 'belum ada siklus selesai yang cukup untuk dianalisis'

    const komoditasText = body.komoditasBreakdown.length > 0
      ? body.komoditasBreakdown.map(k => `${k.komoditas} (${k.jumlah} siklus)`).join(', ')
      : 'tidak ada siklus aktif'

    const systemPrompt = `Kamu adalah asisten analisis bisnis untuk pemilik (Owner) usaha tambak budidaya di Indonesia.
Tugasmu: baca ringkasan data dashboard, lalu berikan SATU insight singkat (2-3 kalimat) dalam Bahasa Indonesia yang:
1. Menyebutkan kondisi terkini secara ringkas
2. Mengaitkan dengan data yang relevan (jangan cuma deskriptif, tapi arahkan ke rekomendasi/tindakan)
3. Kalau data ROI per kategori risiko menunjukkan pola (kategori risiko tinggi = ROI lebih rendah, atau sebaliknya tidak ada beda), sebutkan implikasinya untuk keputusan approval berikutnya
Jangan mengarang angka yang tidak ada di data. Kalau data terlalu sedikit untuk kesimpulan kuat, katakan itu secara jujur.
PENTING: kembalikan HANYA JSON valid: {"insight": "..."}`

    const userPrompt = `Data dashboard Owner saat ini:
- Delta pendapatan bulan ini vs bulan lalu: ${body.deltaPendapatanPct === null ? 'tidak cukup data' : `${body.deltaPendapatanPct.toFixed(1)}%`}
- Total pendapatan (all-time): ${rupiah(body.totalPendapatan)}
- Total modal dialokasikan (all-time): ${rupiah(body.totalModal)}
- Rencana menunggu approval: ${body.menungguApproval}
- Siklus sedang berjalan: ${body.siklusAktif}
- ROI rata-rata per kategori risiko (siklus selesai): ${roiText}
- Komoditas pada siklus aktif: ${komoditasText}`

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error('Groq API error:', err)
      return NextResponse.json({ error: 'Gagal menghubungi AI' }, { status: 502 })
    }

    const groqData = await groqRes.json()
    const content = groqData.choices?.[0]?.message?.content
    if (!content) return NextResponse.json({ error: 'Respons AI kosong' }, { status: 502 })

    const parsed = JSON.parse(content) as DashboardInsightResponse
    return NextResponse.json(parsed)
  } catch (e) {
    console.error('Dashboard insight error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
