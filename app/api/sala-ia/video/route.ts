import { NextRequest, NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/videos";

function headersOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada.");
  return { Authorization: `Bearer ${apiKey}` };
}

function montarPrompt(cena: any, continuidade: boolean) {
  const fala = String(cena?.fala || "").trim();
  const temFala = fala && !fala.startsWith("Sem fala");

  return [
    continuidade
      ? "CONTINUAÇÃO DIRETA DO VÍDEO ANTERIOR. Preserve exatamente o mesmo apresentador, rosto, cabelo, barba, idade aparente, corpo, roupa, cenário e iluminação. Não troque o ator."
      : "Crie um vídeo comercial vertical, realista e profissional com um único apresentador consistente.",
    `Título da cena: ${cena?.titulo || ""}.`,
    `Personagem: ${cena?.personagem || "Apresentador CHOQUESEG"}.`,
    `Cenário: ${cena?.cenario || ""}.`,
    `Figurino: ${cena?.figurino || ""}.`,
    `Enquadramento: ${cena?.enquadramento || ""}.`,
    `Ação e direção: ${cena?.acao || ""}.`,
    temFala
      ? `FALA OBRIGATÓRIA EM PORTUGUÊS BRASILEIRO. Diga exatamente, sem resumir, trocar ou improvisar palavras: "${fala}"`
      : "Sem diálogo falado nesta cena.",
    cena?.textoTela ? `Texto na tela: ${cena.textoTela}` : "Não invente textos extras na tela.",
    "Estética de publicidade brasileira, movimentos naturais e continuidade visual cinematográfica.",
  ].filter(Boolean).join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const { cena, continuarDeVideoId } = await request.json();

    if (!cena) {
      return NextResponse.json({ erro: "Cena não informada." }, { status: 400 });
    }

    const continuidade =
      typeof continuarDeVideoId === "string" &&
      /^video_[A-Za-z0-9_-]+$/.test(continuarDeVideoId);

    const prompt = montarPrompt(cena, continuidade);
    let resposta: Response;

    if (continuidade) {
      resposta = await fetch(`${OPENAI_URL}/extensions`, {
        method: "POST",
        headers: {
          ...headersOpenAI(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video: { id: continuarDeVideoId },
          prompt,
          seconds: "8",
        }),
        cache: "no-store",
      });
    } else {
      const form = new FormData();
      form.set("model", "sora-2");
      form.set("prompt", prompt);
      form.set("seconds", "8");
      form.set("size", "720x1280");

      resposta = await fetch(OPENAI_URL, {
        method: "POST",
        headers: headersOpenAI(),
        body: form,
        cache: "no-store",
      });
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
      return NextResponse.json(
        { erro: dados?.error?.message || dados?.message || "A OpenAI não iniciou a geração do vídeo." },
        { status: resposta.status },
      );
    }

    return NextResponse.json({
      id: dados.id,
      status: dados.status,
      progress: dados.progress ?? 0,
      continuidade,
    });
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro interno ao iniciar o vídeo." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    const content = request.nextUrl.searchParams.get("content");

    if (!id || !/^video_[A-Za-z0-9_-]+$/.test(id)) {
      return NextResponse.json({ erro: "ID de vídeo inválido." }, { status: 400 });
    }

    if (content === "1") {
      const resposta = await fetch(`${OPENAI_URL}/${id}/content`, {
        headers: headersOpenAI(),
        cache: "no-store",
      });

      if (!resposta.ok) {
        return NextResponse.json({ erro: "Não foi possível obter o arquivo do vídeo." }, { status: resposta.status });
      }

      return new NextResponse(resposta.body, {
        status: 200,
        headers: {
          "Content-Type": resposta.headers.get("content-type") || "video/mp4",
          "Cache-Control": "no-store",
          "Content-Disposition": `inline; filename="${id}.mp4"`,
        },
      });
    }

    const resposta = await fetch(`${OPENAI_URL}/${id}`, {
      headers: headersOpenAI(),
      cache: "no-store",
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      return NextResponse.json(
        { erro: dados?.error?.message || dados?.message || "Não foi possível consultar o vídeo." },
        { status: resposta.status },
      );
    }

    return NextResponse.json({
      id: dados.id,
      status: dados.status,
      progress: dados.progress ?? 0,
      erro: dados?.error?.message || null,
    });
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro interno ao consultar o vídeo." },
      { status: 500 },
    );
  }
}