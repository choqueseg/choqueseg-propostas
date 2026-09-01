import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 45_000,
  maxRetries: 1,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ideia = String(body?.ideia ?? "").trim();
    const acao = String(body?.acao ?? "corrigir");

    if (!ideia) {
      return NextResponse.json(
        { erro: "Informe uma ideia para a Sala IA." },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { erro: "A chave OPENAI_API_KEY não foi encontrada no servidor." },
        { status: 500 },
      );
    }

    if (acao === "gerar-roteiro") {
      const personagens = Array.isArray(body?.personagens)
        ? body.personagens
        : [];

      const contexto = {
        categoria: String(body?.categoria ?? ""),
        cenario: String(body?.cenario ?? "IA escolher automaticamente"),
        descricaoCenario: String(body?.descricaoCenario ?? ""),
        tipoHistoria: String(body?.tipoHistoria ?? "Fictícia"),
        figurino: String(body?.figurino ?? "IA escolher"),
        personagens,
        temFotoMomento: Boolean(body?.temFotoMomento),
      };

      const response = await openai.responses.create({
        model: "gpt-5.6",
        instructions: `Você é roteirista e diretor criativo da Sala IA da CHOQUESEG.
Crie roteiros comerciais em português do Brasil, naturais, convincentes e próprios para vídeo vertical.
Transforme uma ideia simples do usuário em uma produção completa.

Regras:
- Preserve fatos fornecidos pelo usuário.
- Nunca invente economia, valores, resultados ou experiências pessoais como se fossem fatos reais.
- Quando o cenário estiver como "IA escolher automaticamente", escolha um cenário coerente com a história.
- Quando houver vários personagens, crie diálogos naturais entre eles.
- Se houver apenas um personagem, use apresentação, atuação ou narração conforme fizer sentido.
- Descreva ações, ambiente, enquadramento e transições de forma objetiva para futura geração de vídeo.
- Considere o figurino informado.
- Se houver personagem do momento por foto, indique onde ele participa, sem inventar características físicas não fornecidas.
- Para depoimento pessoal ou caso real, mantenha tom autêntico e não fabrique acontecimentos.
- O nome da empresa é CHOQUESEG. Não altere a grafia.
- Não tente redesenhar nem descrever um novo logotipo; quando necessário, indique "aplicar brasão oficial da CHOQUESEG".
- Termine com uma chamada comercial coerente.
- Para Energia Solar, quando combinar com a história, pode usar a assinatura "Deixe o sol pagar pelo seu conforto".
- Entregue somente o roteiro, sem explicações antes ou depois.

Estruture preferencialmente em:
TÍTULO
CONCEITO
DURAÇÃO SUGERIDA
PERSONAGENS
CENÁRIO
CENA 1, CENA 2... com VISUAL/AÇÃO e FALA
ENCERRAMENTO / CTA`,
        input: `IDEIA DO USUÁRIO:
${ideia}

CONTEXTO DA PRODUÇÃO:
${JSON.stringify(contexto, null, 2)}`,
      });

      const texto = String(response.output_text ?? "").trim();

      if (!texto) {
        return NextResponse.json(
          { erro: "A inteligência artificial não retornou um roteiro." },
          { status: 502 },
        );
      }

      return NextResponse.json({ texto });
    }

    const response = await openai.responses.create({
      model: "gpt-5.6",
      instructions:
        "Você é o assistente da Sala IA da CHOQUESEG. Responda em português do Brasil. Corrija ortografia, pontuação e concordância sem mudar o sentido, os fatos, os valores nem a intenção comercial do usuário. Retorne somente o texto corrigido.",
      input: ideia,
    });

    const texto = String(response.output_text ?? "").trim();

    if (!texto) {
      return NextResponse.json(
        { erro: "A inteligência artificial não retornou o texto corrigido." },
        { status: 502 },
      );
    }

    return NextResponse.json({ texto });
  } catch (erro: any) {
    console.error("Erro na Sala IA:", erro);

    const mensagem = String(
      erro?.message ??
        "Não foi possível acessar a inteligência artificial.",
    );

    if (
      mensagem.toLowerCase().includes("timeout") ||
      mensagem.toLowerCase().includes("timed out")
    ) {
      return NextResponse.json(
        {
          erro:
            "A IA demorou mais de 45 segundos para responder. Tente novamente.",
        },
        { status: 504 },
      );
    }

    return NextResponse.json(
      {
        erro: mensagem || "Não foi possível acessar a inteligência artificial.",
      },
      { status: 500 },
    );
  }
}