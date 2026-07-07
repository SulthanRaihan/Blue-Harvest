import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'llama-3.1-8b-instant'

interface SkoringSuggestionRequest {
  komoditas: 'bandeng' | 'nila' | 'udang_vaname'
  luas_ha: number
  jumlah_benih: number
  modal_rp: number
  tanggal_rencana: string
}

interface FaktorSaran {
  nama_faktor: 'hama' | 'cuaca' | 'pasar' | 'sdm'
  nilai_potensi: number
  nilai_dampak: number
  alasan: string
}

export interface SkoringSuggestionResponse {
  saran: FaktorSaran[]
  konteks: string
}

const KOMODITAS_INFO = {
  bandeng: {
    label: 'Ikan Bandeng',
    karakteristik: 'toleran salinitas luas, rentan penyakit bakterial di suhu > 32°C, harga relatif stabil, siklus 4-6 bulan',
  },
  nila: {
    label: 'Ikan Nila',
    karakteristik: 'air tawar/payau, rentan parasit di kepadatan tinggi, harga pasar lokal fluktuatif, siklus 4-5 bulan',
  },
  udang_vaname: {
    label: 'Udang Vaname',
    karakteristik: 'nilai ekspor tinggi, sangat rentan WSSV/EHP, butuh manajemen kualitas air ketat, harga volatile, siklus 3-4 bulan',
  },
}

function getBulanMusim(tanggal: string): string {
  const bulan = new Date(tanggal).getMonth() + 1
  if ([12, 1, 2, 3].includes(bulan)) return 'musim hujan (Desember–Maret) — curah hujan tinggi, risiko banjir dan kualitas air tidak stabil'
  if ([4, 5].includes(bulan)) return 'peralihan hujan ke kemarau (April–Mei) — perubahan salinitas mendadak'
  if ([6, 7, 8, 9].includes(bulan)) return 'musim kemarau (Juni–September) — kualitas air cenderung stabil, sedikit risiko cuaca'
  return 'peralihan kemarau ke hujan (Oktober–November) — awal musim hujan, waspada lonjakan hama'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SkoringSuggestionRequest
    const { komoditas, luas_ha, jumlah_benih, modal_rp, tanggal_rencana } = body

    if (!komoditas || !luas_ha || !jumlah_benih || !modal_rp || !tanggal_rencana) {
      return NextResponse.json({ error: 'Data rencana tidak lengkap' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY belum dikonfigurasi' }, { status: 500 })

    const kepadatan = (jumlah_benih / (luas_ha * 10000)).toFixed(0)
    const info = KOMODITAS_INFO[komoditas]
    const musim = getBulanMusim(tanggal_rencana)

    const systemPrompt = `Kamu adalah asisten analisis risiko budidaya tambak di Indonesia.
Berikan saran nilai potensi (1–5) dan dampak (1–5) untuk 4 faktor risiko berdasarkan data rencana tebar.
Skala: 1=sangat rendah, 3=sedang, 5=sangat tinggi.
PENTING: Selalu kembalikan JSON valid, tidak ada teks di luar JSON.`

    const userPrompt = `Data rencana tebar:
- Komoditas: ${info.label} — ${info.karakteristik}
- Luas kolam: ${luas_ha} ha
- Jumlah benih: ${jumlah_benih.toLocaleString('id-ID')} ekor (kepadatan ≈ ${kepadatan} ekor/m²)
- Modal: Rp ${modal_rp.toLocaleString('id-ID')}
- Waktu tebar: ${new Date(tanggal_rencana).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} — ${musim}

Berikan analisis 4 faktor risiko dalam format JSON berikut (tidak ada teks lain):
{
  "konteks": "1–2 kalimat ringkasan kondisi umum rencana ini",
  "saran": [
    {
      "nama_faktor": "hama",
      "nilai_potensi": <1-5>,
      "nilai_dampak": <1-5>,
      "alasan": "penjelasan singkat 1 kalimat"
    },
    {
      "nama_faktor": "cuaca",
      "nilai_potensi": <1-5>,
      "nilai_dampak": <1-5>,
      "alasan": "penjelasan singkat 1 kalimat"
    },
    {
      "nama_faktor": "pasar",
      "nilai_potensi": <1-5>,
      "nilai_dampak": <1-5>,
      "alasan": "penjelasan singkat 1 kalimat"
    },
    {
      "nama_faktor": "sdm",
      "nilai_potensi": <1-5>,
      "nilai_dampak": <1-5>,
      "alasan": "penjelasan singkat 1 kalimat"
    }
  ]
}`

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 600,
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

    const parsed = JSON.parse(content) as SkoringSuggestionResponse

    // Validasi dan clamp nilai 1–5
    parsed.saran = parsed.saran.map(s => ({
      ...s,
      nilai_potensi: Math.max(1, Math.min(5, Math.round(s.nilai_potensi))),
      nilai_dampak:  Math.max(1, Math.min(5, Math.round(s.nilai_dampak))),
    }))

    return NextResponse.json(parsed)
  } catch (e) {
    console.error('Scoring suggestion error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
