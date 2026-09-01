import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

type TipoEnvio = "todos" | "grupo" | "selecionados";

type Funcionario = {
  id: string;
  nome: string;
  perfil: string | null;
  cargo: string | null;
  status: string | null;
};

function base64UrlParaBuffer(valor: string) {
  const base64 = valor.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(base64 + padding, "base64");
}

function verificarParVapid(publicKey: string, privateKey: string) {
  try {
    const ec = crypto.createECDH("prime256v1");
    ec.setPrivateKey(base64UrlParaBuffer(privateKey));
    return ec.getPublicKey().toString("base64url") === publicKey;
  } catch (erro) {
    console.error("Erro ao validar par VAPID:", erro);
    return false;
  }
}

function normalizar(valor: string) {
  return valor.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { erro: "Configuração do Supabase incompleta." },
        { status: 500 },
      );
    }

    if (!publicKey || !privateKey) {
      return NextResponse.json(
        {
          erro: "Configuração VAPID incompleta.",
          publicKeyEncontrada: Boolean(publicKey),
          privateKeyEncontrada: Boolean(privateKey),
        },
        { status: 500 },
      );
    }

    const vapidCorrespondem = verificarParVapid(publicKey, privateKey);

    if (!vapidCorrespondem) {
      return NextResponse.json(
        {
          erro: "As chaves VAPID da Vercel não correspondem ao mesmo par.",
          vapidCorrespondem: false,
        },
        { status: 500 },
      );
    }

    webpush.setVapidDetails(
      "mailto:choqueseg@gmail.com",
      publicKey,
      privateKey,
    );

    const corpo = await request.json();

    const titulo =
      String(corpo.titulo || "").trim() || "CHOQUESEG PRO";

    const mensagem = String(corpo.mensagem || "").trim();

    const tipoEnvio: TipoEnvio =
      corpo.tipoEnvio === "grupo" ||
      corpo.tipoEnvio === "selecionados"
        ? corpo.tipoEnvio
        : "todos";

    const grupo = String(corpo.grupo || "").trim();

    const destinatariosRecebidos = Array.isArray(corpo.destinatarios)
      ? corpo.destinatarios.map((item: unknown) => String(item))
      : [];

    const criadoPor =
      String(corpo.criadoPor || "Administrador CHOQUESEG").trim();

    if (!mensagem) {
      return NextResponse.json(
        {
          erro: "Digite uma mensagem.",
          vapidCorrespondem: true,
        },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    /*
     * 1. BUSCAR FUNCIONÁRIOS ATIVOS
     */
    const { data: funcionariosData, error: erroFuncionarios } =
      await supabase
        .from("funcionarios")
        .select("id,nome,perfil,cargo,status")
        .eq("status", "Ativo");

    if (erroFuncionarios) {
      return NextResponse.json(
        {
          erro: "Erro ao consultar funcionários.",
          detalhe: erroFuncionarios.message,
        },
        { status: 500 },
      );
    }

    const funcionarios = (funcionariosData ?? []) as Funcionario[];

    /*
     * 2. DEFINIR QUEM VAI RECEBER
     */
    let funcionariosDestino: Funcionario[] = [];

    if (tipoEnvio === "todos") {
      funcionariosDestino = funcionarios;
    }

    if (tipoEnvio === "selecionados") {
      const selecionadosNormalizados = destinatariosRecebidos.map(normalizar);

      funcionariosDestino = funcionarios.filter(
        (funcionario) =>
          selecionadosNormalizados.includes(normalizar(funcionario.id)) ||
          selecionadosNormalizados.includes(normalizar(funcionario.nome)),
      );
    }

    if (tipoEnvio === "grupo") {
      const grupoNormalizado = normalizar(grupo);

      funcionariosDestino = funcionarios.filter((funcionario) => {
        const perfil = normalizar(funcionario.perfil || "");
        const cargo = normalizar(funcionario.cargo || "");

        if (grupoNormalizado === "tecnicos") {
          return (
            perfil === "tecnico" ||
            perfil === "funcionario" ||
            cargo.includes("técnico") ||
            cargo.includes("tecnico")
          );
        }

        if (grupoNormalizado === "vendedores") {
          return perfil === "vendedor" || cargo.includes("vendedor");
        }

        if (grupoNormalizado === "atendentes") {
          return perfil === "atendente" || cargo.includes("atendente");
        }

        if (grupoNormalizado === "engenheiros") {
          return perfil === "engenheiro" || cargo.includes("engenheiro");
        }

        return false;
      });
    }

    if (funcionariosDestino.length === 0) {
      return NextResponse.json(
        {
          erro: "Nenhum funcionário foi encontrado para receber esta mensagem.",
        },
        { status: 400 },
      );
    }

    /*
     * 3. CRIAR A NOTIFICAÇÃO NO HISTÓRICO
     */
    const { data: notificacaoCriada, error: erroNotificacao } =
      await supabase
        .from("notificacoes")
        .insert({
          titulo,
          mensagem,
          tipo: "comunicado",
          tipo_envio: tipoEnvio,
          grupo: tipoEnvio === "grupo" ? grupo : null,
          criado_por: criadoPor,
        })
        .select("id")
        .single();

    if (erroNotificacao || !notificacaoCriada) {
      return NextResponse.json(
        {
          erro: "Não foi possível salvar a notificação.",
          detalhe: erroNotificacao?.message,
        },
        { status: 500 },
      );
    }

    /*
     * 4. REGISTRAR CADA DESTINATÁRIO
     */
    const registrosDestinatarios = funcionariosDestino.map(
      (funcionario) => ({
        notificacao_id: notificacaoCriada.id,
        funcionario_id: funcionario.id,
        usuario_nome: funcionario.nome,
        lida: false,
        lida_em: null,
      }),
    );

    const { error: erroDestinatarios } = await supabase
      .from("notificacoes_destinatarios")
      .insert(registrosDestinatarios);

    if (erroDestinatarios) {
      await supabase
        .from("notificacoes")
        .delete()
        .eq("id", notificacaoCriada.id);

      return NextResponse.json(
        {
          erro: "Não foi possível registrar os destinatários.",
          detalhe: erroDestinatarios.message,
        },
        { status: 500 },
      );
    }

    /*
     * 5. PEGAR SOMENTE OS APARELHOS DOS DESTINATÁRIOS
     */
    const nomesDestino = funcionariosDestino.map(
      (funcionario) => funcionario.nome,
    );

    /*
     * A coluna usuario_nome pode ter diferenças de maiúsculas/minúsculas
     * em inscrições antigas. Para envio individual, buscar todas as
     * inscrições e comparar os nomes normalizados evita perder o aparelho
     * do técnico selecionado.
     */
    const { data: inscricoesData, error: erroConsulta } = await supabase
      .from("push_subscriptions")
      .select("id,usuario_nome,endpoint,p256dh,auth");

    const nomesDestinoNormalizados = new Set(
      nomesDestino.map((nome) => normalizar(nome)),
    );

    const inscricoes = (inscricoesData ?? []).filter((item) =>
      nomesDestinoNormalizados.has(normalizar(String(item.usuario_nome || ""))),
    );

    if (erroConsulta) {
      return NextResponse.json(
        {
          erro:
            "A mensagem foi salva, mas houve erro ao consultar os aparelhos.",
          detalhe: erroConsulta.message,
          notificacaoId: notificacaoCriada.id,
          vapidCorrespondem: true,
        },
        { status: 500 },
      );
    }

    const encontrados = inscricoes?.length ?? 0;

    /*
     * Mesmo sem push ativado, a mensagem continua salva
     * na Central de Notificações do funcionário.
     */
    if (encontrados === 0) {
      return NextResponse.json({
        sucesso: true,
        vapidCorrespondem: true,
        notificacaoId: notificacaoCriada.id,
        destinatarios: funcionariosDestino.length,
        encontrados: 0,
        enviados: 0,
        falharam: 0,
        destinatariosNomes: nomesDestino,
        aviso:
          "Mensagem salva na Central de Notificações. Nenhum aparelho com push ativo foi encontrado.",
      });
    }

    /*
     * 6. ENVIAR PUSH
     */
    let enviados = 0;
    let falharam = 0;

    const erros: Array<{
      usuario: string;
      status?: number;
      mensagem: string;
    }> = [];

    for (const item of inscricoes ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: item.endpoint,
            keys: {
              p256dh: item.p256dh,
              auth: item.auth,
            },
          },
          JSON.stringify({
            title: titulo,
            body: mensagem,
            url: "/?tela=notificacoes",
            notificacaoId: notificacaoCriada.id,
          }),
        );

        enviados += 1;
      } catch (erro: unknown) {
        falharam += 1;

        const erroPush = erro as {
          statusCode?: number;
          message?: string;
          body?: string;
        };

        const status = erroPush.statusCode;

        const detalhe =
          erroPush.body ||
          erroPush.message ||
          "Erro desconhecido no envio push.";

        erros.push({
          usuario: item.usuario_nome || "Usuário",
          status,
          mensagem: detalhe,
        });

        /*
         * Remove inscrições expiradas.
         */
        if (status === 404 || status === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", item.id);
        }
      }
    }

    return NextResponse.json({
      sucesso: falharam === 0,
      vapidCorrespondem: true,
      notificacaoId: notificacaoCriada.id,
      destinatarios: funcionariosDestino.length,
      encontrados,
      enviados,
      falharam,
      destinatariosNomes: nomesDestino,
      erros,
    });
  } catch (erro) {
    const detalhe =
      erro instanceof Error
        ? erro.message
        : String(erro ?? "Erro desconhecido");

    return NextResponse.json(
      {
        erro: "Não foi possível processar as notificações.",
        detalhe,
      },
      { status: 500 },
    );
  }
}