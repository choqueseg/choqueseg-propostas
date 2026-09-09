"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type ClienteBanco = {
  id: string;
  nome: string;
  telefone: string | null;
  cidade: string | null;
  endereco: string | null;
  tipo_servico: string | null;
};

type DadosEmpresa = {
  nome: string;
  subtitulo: string;
  cnpj: string;
  telefone: string;
  instagram: string;
  endereco: string;
  logo: string;
};

type StatusRecibo = "Emitido" | "Cancelado";

type Recibo = {
  id: string;
  numero: string;
  clienteId?: string;
  clienteNome: string;
  clienteTelefone?: string;
  valor: number;
  referenteA: string;
  formaPagamento: string;
  data: string;
  observacao?: string;
  status: StatusRecibo;
  motivoCancelamento?: string;
  criadoEm: string;
};

const supabase = createClient();

const CHAVE_RECIBOS = "choqueseg-recibos";
const CHAVE_EMPRESA = "choqueseg-recibos-empresa";

const EMPRESA_PADRAO: DadosEmpresa = {
  nome: "CHOQUESEG",
  subtitulo: "Sistemas e Energia Solar",
  cnpj: "46.030.083/0001-62",
  telefone: "(79) 9.9939-0653",
  instagram: "@CHOQUESEG",
  endereco: "Rodovia dos Náufragos, Robalo, 710 - Aracaju/SE",
  logo: "/imagens/logo/brasao-choqueseg.png",
};

const FORMAS_PAGAMENTO = [
  "PIX",
  "Dinheiro",
  "Débito",
  "Crédito",
  "Transferência",
  "Boleto",
  "Outro",
];

export default function RecibosModule() {
  const [clientes, setClientes] = useState<ClienteBanco[]>([]);
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [empresa, setEmpresa] = useState<DadosEmpresa>(EMPRESA_PADRAO);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [aba, setAba] = useState<"novo" | "historico" | "empresa">("novo");

  const [clienteId, setClienteId] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteManual, setClienteManual] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState("");

  const [valor, setValor] = useState("");
  const [referenteA, setReferenteA] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [data, setData] = useState(dataLocalISO());
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [buscaHistorico, setBuscaHistorico] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState<"Todos" | StatusRecibo>("Todos");

  useEffect(() => {
    async function carregarClientes() {
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("id,nome,telefone,cidade,endereco,tipo_servico")
          .order("nome", { ascending: true });

        if (error) throw error;

        setClientes((data ?? []) as ClienteBanco[]);
      } catch (erro) {
        console.error("Erro ao carregar clientes para recibos:", erro);
      }
    }

    void carregarClientes();

    try {
      const recibosSalvos = localStorage.getItem(CHAVE_RECIBOS);
      const empresaSalva = localStorage.getItem(CHAVE_EMPRESA);

      if (recibosSalvos) {
        const dados = JSON.parse(recibosSalvos);
        setRecibos(Array.isArray(dados) ? dados : []);
      }

      if (empresaSalva) {
        const dados = JSON.parse(empresaSalva);
        setEmpresa({
          ...EMPRESA_PADRAO,
          ...(dados && typeof dados === "object" ? dados : {}),
        });
      }
    } catch (erro) {
      console.error("Erro ao carregar dados de recibos:", erro);
    } finally {
      setDadosCarregados(true);
    }
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;
    localStorage.setItem(CHAVE_RECIBOS, JSON.stringify(recibos));
  }, [recibos, dadosCarregados]);

  useEffect(() => {
    if (!dadosCarregados) return;
    localStorage.setItem(CHAVE_EMPRESA, JSON.stringify(empresa));
  }, [empresa, dadosCarregados]);

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase();

    if (!termo) return clientes.slice(0, 25);

    return clientes
      .filter((cliente) => {
        return (
          cliente.nome.toLowerCase().includes(termo) ||
          String(cliente.telefone ?? "").toLowerCase().includes(termo) ||
          String(cliente.cidade ?? "").toLowerCase().includes(termo)
        );
      })
      .slice(0, 25);
  }, [clientes, buscaCliente]);

  const recibosFiltrados = useMemo(() => {
    const termo = buscaHistorico.trim().toLowerCase();

    return recibos
      .filter((recibo) => {
        const atendeStatus =
          filtroStatus === "Todos" || recibo.status === filtroStatus;

        const atendeBusca =
          !termo ||
          recibo.numero.toLowerCase().includes(termo) ||
          recibo.clienteNome.toLowerCase().includes(termo) ||
          recibo.referenteA.toLowerCase().includes(termo) ||
          formatarMoeda(recibo.valor).toLowerCase().includes(termo) ||
          recibo.data.includes(termo);

        return atendeStatus && atendeBusca;
      })
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }, [recibos, buscaHistorico, filtroStatus]);

  const resumo = useMemo(() => {
    const emitidos = recibos.filter((recibo) => recibo.status === "Emitido");
    const cancelados = recibos.filter((recibo) => recibo.status === "Cancelado");

    return {
      emitidos: emitidos.length,
      cancelados: cancelados.length,
      totalEmitido: emitidos.reduce((total, recibo) => total + recibo.valor, 0),
    };
  }, [recibos]);

  function selecionarCliente(cliente: ClienteBanco) {
    setClienteId(cliente.id);
    setClienteNome(cliente.nome);
    setClienteTelefone(cliente.telefone ?? "");
    setBuscaCliente(cliente.nome);
    setClienteManual(false);

    if (!referenteA.trim() && cliente.tipo_servico) {
      setReferenteA(`Pagamento referente ao serviço de ${cliente.tipo_servico}.`);
    }
  }

  function alternarClienteManual() {
    setClienteManual((atual) => !atual);
    setClienteId("");
    setClienteNome("");
    setClienteTelefone("");
    setBuscaCliente("");
  }

  function proximoNumeroRecibo() {
    const ano = new Date().getFullYear();

    const numerosDoAno = recibos
      .map((recibo) => {
        const match = recibo.numero.match(
          new RegExp(`^REC-${ano}-(\\d+)$`),
        );

        return match ? Number(match[1]) : 0;
      })
      .filter((numero) => numero > 0);

    const proximo =
      numerosDoAno.length > 0 ? Math.max(...numerosDoAno) + 1 : 1;

    return `REC-${ano}-${String(proximo).padStart(4, "0")}`;
  }

  function montarReciboParaPrevia(): Recibo | null {
    const valorNumerico = converterValor(valor);

    if (!clienteNome.trim()) {
      setMensagem("Informe ou selecione o cliente.");
      return null;
    }

    if (!valorNumerico || valorNumerico <= 0) {
      setMensagem("Informe um valor válido.");
      return null;
    }

    if (!referenteA.trim()) {
      setMensagem("Informe a que se refere o pagamento.");
      return null;
    }

    if (!data) {
      setMensagem("Informe a data do recebimento.");
      return null;
    }

    setMensagem("");

    return {
      id: `previa-${Date.now()}`,
      numero: proximoNumeroRecibo(),
      clienteId: clienteId || undefined,
      clienteNome: clienteNome.trim(),
      clienteTelefone: clienteTelefone.trim() || undefined,
      valor: valorNumerico,
      referenteA: referenteA.trim(),
      formaPagamento,
      data,
      observacao: observacao.trim() || undefined,
      status: "Emitido",
      criadoEm: new Date().toISOString(),
    };
  }

  function visualizarReciboAntesDeEmitir() {
    const previa = montarReciboParaPrevia();
    if (!previa) return;
    abrirRecibo(previa, true);
  }

  function salvarRecibo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const valorNumerico = converterValor(valor);

    if (!clienteNome.trim()) {
      setMensagem("Informe ou selecione o cliente.");
      return;
    }

    if (!valorNumerico || valorNumerico <= 0) {
      setMensagem("Informe um valor válido.");
      return;
    }

    if (!referenteA.trim()) {
      setMensagem("Informe a que se refere o pagamento.");
      return;
    }

    if (!data) {
      setMensagem("Informe a data do recebimento.");
      return;
    }

    const novoRecibo: Recibo = {
      id: crypto.randomUUID(),
      numero: proximoNumeroRecibo(),
      clienteId: clienteId || undefined,
      clienteNome: clienteNome.trim(),
      clienteTelefone: clienteTelefone.trim() || undefined,
      valor: valorNumerico,
      referenteA: referenteA.trim(),
      formaPagamento,
      data,
      observacao: observacao.trim() || undefined,
      status: "Emitido",
      criadoEm: new Date().toISOString(),
    };

    setRecibos((atuais) => [novoRecibo, ...atuais]);
    setMensagem(`Recibo ${novoRecibo.numero} emitido com sucesso.`);

    if (
      window.confirm(
        `Recibo ${novoRecibo.numero} emitido. Deseja abrir para imprimir ou salvar em PDF?`,
      )
    ) {
      abrirRecibo(novoRecibo);
    }

    limparFormulario();
  }

  function limparFormulario() {
    setClienteId("");
    setClienteNome("");
    setClienteTelefone("");
    setBuscaCliente("");
    setClienteManual(false);
    setValor("");
    setReferenteA("");
    setFormaPagamento("PIX");
    setData(dataLocalISO());
    setObservacao("");
  }

  function salvarDadosEmpresa(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    localStorage.setItem(CHAVE_EMPRESA, JSON.stringify(empresa));
    setMensagem("Dados da empresa atualizados com sucesso.");
  }

  function cancelarRecibo(recibo: Recibo) {
    if (recibo.status === "Cancelado") return;

    const motivo = window.prompt(
      `Informe o motivo do cancelamento do recibo ${recibo.numero}:`,
    );

    if (motivo === null) return;

    if (!motivo.trim()) {
      window.alert("Informe o motivo do cancelamento.");
      return;
    }

    const confirmar = window.confirm(
      `Confirmar o cancelamento do recibo ${recibo.numero}?\n\nO recibo permanecerá no histórico.`,
    );

    if (!confirmar) return;

    setRecibos((atuais) =>
      atuais.map((item) =>
        item.id === recibo.id
          ? {
              ...item,
              status: "Cancelado",
              motivoCancelamento: motivo.trim(),
            }
          : item,
      ),
    );

    setMensagem(`Recibo ${recibo.numero} cancelado e mantido no histórico.`);
  }

  function abrirWhatsApp(recibo: Recibo) {
    const telefone = String(recibo.clienteTelefone ?? "").replace(/\D/g, "");

    if (!telefone) {
      window.alert(
        "Este recibo não possui telefone. Informe o WhatsApp do cliente no cadastro do recibo.",
      );
      return;
    }

    const numero = telefone.startsWith("55") ? telefone : `55${telefone}`;

    const texto = [
      `Olá, ${recibo.clienteNome}.`,
      "",
      `Segue a confirmação do pagamento de ${formatarMoeda(recibo.valor)}.`,
      `Referente a: ${recibo.referenteA}`,
      `Recibo: ${recibo.numero}`,
      `Data: ${formatarData(recibo.data)}`,
      "",
      `${empresa.nome} ${empresa.subtitulo}`,
      `CNPJ: ${empresa.cnpj}`,
    ].join("\n");

    window.open(
      `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function abrirRecibo(recibo: Recibo, modoPrevia = false) {
    const janela = window.open("", "_blank", "width=860,height=920");

    if (!janela) {
      window.alert(
        "O navegador bloqueou a abertura do recibo. Permita pop-ups para o CHOQUESEG PRO.",
      );
      return;
    }

    const statusCancelado = recibo.status === "Cancelado";

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>${recibo.numero} - ${recibo.clienteNome}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 28px;
              font-family: Arial, Helvetica, sans-serif;
              background: #f3f4f6;
              color: #111827;
            }
            .pagina {
              max-width: 760px;
              margin: 0 auto;
              background: white;
              border: 3px solid #facc15;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,.12);
            }
            .topo {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 8px;
              padding: 20px 26px 18px;
              background: #050505;
              color: white;
              border-bottom: 5px solid #facc15;
              text-align: center;
            }
            .logo {
              width: 88px;
              height: 88px;
              object-fit: contain;
              display: block;
              margin: 0 auto;
            }
            .empresa {
              font-size: 30px;
              font-weight: 900;
              color: #facc15;
              letter-spacing: .6px;
              line-height: 1;
              text-align: center;
            }
            .conteudo { padding: 30px; }
            .titulo {
              margin: 0;
              text-align: center;
              font-size: 32px;
              font-weight: 900;
            }
            .numero {
              margin-top: 7px;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
              font-weight: 800;
            }
            .cancelado {
              margin: 20px 0;
              border: 2px solid #ef4444;
              background: #fef2f2;
              color: #b91c1c;
              padding: 13px;
              border-radius: 12px;
              text-align: center;
              font-weight: 900;
            }
            .valor {
              margin: 24px 0;
              border-radius: 16px;
              background: #facc15;
              padding: 20px;
              text-align: center;
              color: #050505;
            }
            .valor small {
              display: block;
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
            }
            .valor strong {
              display: block;
              margin-top: 5px;
              font-size: 38px;
            }
            .linha {
              display: grid;
              grid-template-columns: 155px minmax(0,1fr);
              gap: 10px;
              padding: 11px 0;
              border-bottom: 1px solid #e5e7eb;
              font-size: 15px;
              line-height: 1.45;
            }
            .linha strong { font-weight: 900; }
            .declaracao {
              margin: 24px 0 0;
              font-size: 17px;
              line-height: 1.65;
            }
            .rodape {
              margin-top: 30px;
              border-top: 2px solid #111827;
              padding-top: 18px;
              font-size: 13px;
              line-height: 1.65;
            }
            .rodape strong {
              font-size: 15px;
            }
            .acoes {
              max-width: 760px;
              margin: 16px auto;
              display: flex;
              justify-content: center;
              gap: 10px;
            }
            button, .botao-link {
              border: 0;
              border-radius: 11px;
              padding: 13px 18px;
              background: #facc15;
              color: #050505;
              font-weight: 900;
              cursor: pointer;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .whatsapp {
              background: #16a34a;
              color: #fff;
            }
            .voltar {
              background: #111827;
              color: #fff;
            }
            .aviso-previa {
              max-width: 760px;
              margin: 16px auto 0;
              border: 1px solid #facc15;
              background: #fffbeb;
              color: #713f12;
              padding: 10px 14px;
              border-radius: 10px;
              font-size: 12px;
              font-weight: 800;
              text-align: center;
            }
            @media (max-width: 640px) {
              body { padding: 10px; }
              .conteudo { padding: 20px; }
              .topo { padding: 16px; }
              .logo { width: 72px; height: 72px; }
              .empresa { font-size: 25px; }
              .titulo { font-size: 27px; }
              .linha { grid-template-columns: 1fr; gap: 3px; }
            }
            @media print {
              body { background: white; padding: 0; }
              .acoes { display: none !important; }
              .pagina {
                box-shadow: none;
                border-radius: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="pagina">
            <div class="topo">
              <img
                src="/imagens/logo/brasao-choqueseg.png"
                class="logo"
                alt="Brasão oficial da CHOQUESEG"
              />
              <div class="empresa">${escaparHtml(empresa.nome)}</div>
            </div>

            <div class="conteudo">
              <h1 class="titulo">RECIBO DE PAGAMENTO</h1>
              <div class="numero">${escaparHtml(recibo.numero)}</div>

              ${
                statusCancelado
                  ? `<div class="cancelado">RECIBO CANCELADO<br /><small>${escaparHtml(
                      recibo.motivoCancelamento || "",
                    )}</small></div>`
                  : ""
              }

              <div class="valor">
                <small>Valor recebido</small>
                <strong>${formatarMoeda(recibo.valor)}</strong>
              </div>

              <div class="linha"><strong>Cliente</strong><span>${escaparHtml(
                recibo.clienteNome,
              )}</span></div>
              <div class="linha"><strong>Referente a</strong><span>${escaparHtml(
                recibo.referenteA,
              )}</span></div>
              <div class="linha"><strong>Forma de pagamento</strong><span>${escaparHtml(
                recibo.formaPagamento,
              )}</span></div>
              <div class="linha"><strong>Data</strong><span>${formatarData(
                recibo.data,
              )}</span></div>
              ${
                recibo.observacao
                  ? `<div class="linha"><strong>Observação</strong><span>${escaparHtml(
                      recibo.observacao,
                    )}</span></div>`
                  : ""
              }

              <p class="declaracao">
                Declaramos, para os devidos fins, que recebemos de
                <strong>${escaparHtml(recibo.clienteNome)}</strong> a importância de
                <strong>${formatarMoeda(recibo.valor)}</strong>, referente a
                <strong>${escaparHtml(recibo.referenteA)}</strong>.
              </p>

              <div class="rodape">
                <strong>${escaparHtml(empresa.nome)} ${escaparHtml(
                  empresa.subtitulo,
                )}</strong><br />
                CNPJ: ${escaparHtml(empresa.cnpj)}<br />
                Telefone: ${escaparHtml(empresa.telefone)} &nbsp; | &nbsp;
                Instagram: ${escaparHtml(empresa.instagram)}<br />
                Endereço: ${escaparHtml(empresa.endereco)}
              </div>
            </div>
          </div>

          ${
            modoPrevia
              ? `<div class="aviso-previa">PRÉVIA DO RECIBO — confira os dados antes de emitir ou enviar.</div>`
              : ""
          }

          <div class="acoes">
            <button onclick="window.print()">🧾 Imprimir / Salvar PDF</button>
            ${
              recibo.clienteTelefone
                ? `<a
                    class="botao-link whatsapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://wa.me/${String(recibo.clienteTelefone).replace(/\D/g, "").startsWith("55") ? String(recibo.clienteTelefone).replace(/\D/g, "") : `55${String(recibo.clienteTelefone).replace(/\D/g, "")}`}?text=${encodeURIComponent(
                      `Olá, ${recibo.clienteNome}. Segue o recibo referente a ${recibo.referenteA}, no valor de ${formatarMoeda(recibo.valor)}. Recibo ${recibo.numero}.`,
                    )}"
                  >📲 Enviar pelo WhatsApp</a>`
                : ""
            }
            <button class="voltar" onclick="window.close()">← Voltar e editar</button>
          </div>
        </body>
      </html>
    `;

    janela.document.open();
    janela.document.write(html);
    janela.document.close();
  }

  return (
    <section className="p-4 md:p-7">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm font-black uppercase text-yellow-400">
            Documentos financeiros
          </p>
          <h2 className="mt-1 text-3xl font-black uppercase text-white">
            Recibos CHOQUESEG
          </h2>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Emita recibos, consulte o histórico e mantenha os dados da empresa
            atualizados em um único lugar.
          </p>
        </div>

        {mensagem && (
          <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
            {mensagem}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setAba("novo")}
            className={classeAba(aba === "novo")}
          >
            🧾 Novo recibo
          </button>
          <button
            type="button"
            onClick={() => setAba("historico")}
            className={classeAba(aba === "historico")}
          >
            📁 Histórico de recibos
          </button>
          <button
            type="button"
            onClick={() => setAba("empresa")}
            className={classeAba(aba === "empresa")}
          >
            🏢 Dados da empresa
          </button>
        </div>

        {aba === "novo" && (
          <form
            onSubmit={salvarRecibo}
            className="mt-6 rounded-3xl border border-zinc-800 bg-black p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black uppercase text-yellow-400">
                  Novo recibo
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Selecione um cliente cadastrado ou use o preenchimento manual.
                </p>
              </div>

              <button
                type="button"
                onClick={alternarClienteManual}
                className="rounded-xl border border-yellow-400/50 px-4 py-3 text-sm font-black uppercase text-yellow-400"
              >
                {clienteManual ? "Buscar cliente cadastrado" : "Cliente manual"}
              </button>
            </div>

            {!clienteManual && (
              <div className="mt-5">
                <CampoTexto
                  label="Buscar cliente"
                  valor={buscaCliente}
                  onChange={(novoValor) => {
                    setBuscaCliente(novoValor);
                    if (novoValor !== clienteNome) {
                      setClienteId("");
                      setClienteNome("");
                      setClienteTelefone("");
                    }
                  }}
                  placeholder="Digite nome, telefone ou cidade"
                />

                {buscaCliente.trim() && !clienteId && (
                  <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-2">
                    {clientesFiltrados.length === 0 ? (
                      <p className="p-3 text-sm text-zinc-500">
                        Nenhum cliente encontrado.
                      </p>
                    ) : (
                      clientesFiltrados.map((cliente) => (
                        <button
                          key={cliente.id}
                          type="button"
                          onClick={() => selecionarCliente(cliente)}
                          className="mb-1 w-full rounded-lg border border-transparent p-3 text-left transition hover:border-yellow-400/40 hover:bg-black"
                        >
                          <p className="font-black text-white">{cliente.nome}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {cliente.telefone || "Sem telefone"}
                            {cliente.cidade ? ` · ${cliente.cidade}` : ""}
                            {cliente.tipo_servico
                              ? ` · ${cliente.tipo_servico}`
                              : ""}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {clienteId && (
                  <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="font-black text-emerald-300">
                      ✓ {clienteNome}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {clienteTelefone || "Telefone não cadastrado"}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {clienteManual && (
                <>
                  <CampoTexto
                    label="Nome do cliente"
                    valor={clienteNome}
                    onChange={setClienteNome}
                    placeholder="Nome completo"
                  />
                  <CampoTexto
                    label="Telefone / WhatsApp"
                    valor={clienteTelefone}
                    onChange={setClienteTelefone}
                    placeholder="Ex.: 79999999999"
                  />
                </>
              )}

              <CampoTexto
                label="Valor recebido"
                valor={valor}
                onChange={setValor}
                placeholder="Ex.: 2.000,00"
              />

              <CampoSelect
                label="Forma de pagamento"
                valor={formaPagamento}
                onChange={setFormaPagamento}
                opcoes={FORMAS_PAGAMENTO}
              />

              <CampoTexto
                label="Data"
                valor={data}
                onChange={setData}
                tipo="date"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
                Referente a
              </label>
              <textarea
                value={referenteA}
                onChange={(evento) => setReferenteA(evento.target.value)}
                rows={4}
                placeholder="Ex.: Pagamento referente à instalação de sistema de segurança eletrônica com 8 câmeras."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
                Observação
              </label>
              <textarea
                value={observacao}
                onChange={(evento) => setObservacao(evento.target.value)}
                rows={3}
                placeholder="Opcional"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={visualizarReciboAntesDeEmitir}
                className="rounded-xl border border-blue-500 bg-blue-500/10 px-6 py-3 font-black uppercase text-blue-400"
              >
                👁️ Visualizar recibo
              </button>

              <button
                type="submit"
                className="rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
              >
                Emitir recibo
              </button>
              <button
                type="button"
                onClick={limparFormulario}
                className="rounded-xl border border-zinc-700 px-6 py-3 font-black uppercase text-zinc-300"
              >
                Limpar
              </button>
            </div>
          </form>
        )}

        {aba === "historico" && (
          <section className="mt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <CardResumo titulo="Recibos emitidos" valor={String(resumo.emitidos)} />
              <CardResumo titulo="Cancelados" valor={String(resumo.cancelados)} />
              <CardResumo
                titulo="Total emitido"
                valor={formatarMoeda(resumo.totalEmitido)}
              />
            </div>

            <div className="mt-5 rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <CampoTexto
                  label="Pesquisar"
                  valor={buscaHistorico}
                  onChange={setBuscaHistorico}
                  placeholder="Número, cliente, serviço, valor ou data"
                />
                <CampoSelect
                  label="Status"
                  valor={filtroStatus}
                  onChange={(valor) =>
                    setFiltroStatus(valor as "Todos" | StatusRecibo)
                  }
                  opcoes={["Todos", "Emitido", "Cancelado"]}
                />
              </div>

              <div className="mt-5 space-y-3">
                {recibosFiltrados.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
                    Nenhum recibo encontrado.
                  </div>
                ) : (
                  recibosFiltrados.map((recibo) => (
                    <article
                      key={recibo.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-lg bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-300">
                              {recibo.numero}
                            </span>
                            <span
                              className={`rounded-lg px-3 py-1 text-xs font-black uppercase ${
                                recibo.status === "Emitido"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-red-500/15 text-red-400"
                              }`}
                            >
                              {recibo.status}
                            </span>
                          </div>

                          <h4 className="mt-3 break-words text-lg font-black text-white">
                            {recibo.clienteNome}
                          </h4>
                          <p className="mt-1 break-words text-sm text-zinc-400">
                            {recibo.referenteA}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            {formatarData(recibo.data)} · {recibo.formaPagamento}
                          </p>

                          {recibo.status === "Cancelado" &&
                            recibo.motivoCancelamento && (
                              <p className="mt-2 break-words text-sm font-bold text-red-400">
                                Motivo: {recibo.motivoCancelamento}
                              </p>
                            )}
                        </div>

                        <div className="xl:text-right">
                          <p className="text-xl font-black text-yellow-400">
                            {formatarMoeda(recibo.valor)}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2 xl:justify-end">
                            <button
                              type="button"
                              onClick={() => abrirRecibo(recibo)}
                              className="rounded-xl border border-yellow-400/50 px-4 py-2 text-sm font-black uppercase text-yellow-300"
                            >
                              Visualizar / PDF
                            </button>

                            {recibo.clienteTelefone && (
                              <button
                                type="button"
                                onClick={() => abrirWhatsApp(recibo)}
                                className="rounded-xl border border-emerald-500/50 px-4 py-2 text-sm font-black uppercase text-emerald-400"
                              >
                                WhatsApp
                              </button>
                            )}

                            {recibo.status === "Emitido" && (
                              <button
                                type="button"
                                onClick={() => cancelarRecibo(recibo)}
                                className="rounded-xl border border-red-500/50 px-4 py-2 text-sm font-black uppercase text-red-400"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {aba === "empresa" && (
          <form
            onSubmit={salvarDadosEmpresa}
            className="mt-6 rounded-3xl border border-zinc-800 bg-black p-5"
          >
            <h3 className="text-xl font-black uppercase text-yellow-400">
              Dados fixos dos recibos
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Altere aqui quando telefone, endereço ou outro dado da empresa mudar.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <CampoTexto
                label="Nome da empresa"
                valor={empresa.nome}
                onChange={(valor) =>
                  setEmpresa((atual) => ({ ...atual, nome: valor }))
                }
              />
              <CampoTexto
                label="Subtítulo"
                valor={empresa.subtitulo}
                onChange={(valor) =>
                  setEmpresa((atual) => ({ ...atual, subtitulo: valor }))
                }
              />
              <CampoTexto
                label="CNPJ"
                valor={empresa.cnpj}
                onChange={(valor) =>
                  setEmpresa((atual) => ({ ...atual, cnpj: valor }))
                }
              />
              <CampoTexto
                label="Telefone"
                valor={empresa.telefone}
                onChange={(valor) =>
                  setEmpresa((atual) => ({ ...atual, telefone: valor }))
                }
              />
              <CampoTexto
                label="Instagram"
                valor={empresa.instagram}
                onChange={(valor) =>
                  setEmpresa((atual) => ({ ...atual, instagram: valor }))
                }
              />
              <CampoTexto
                label="Endereço"
                valor={empresa.endereco}
                onChange={(valor) =>
                  setEmpresa((atual) => ({ ...atual, endereco: valor }))
                }
              />
              <div className="md:col-span-2">
                <CampoTexto
                  label="Caminho do brasão"
                  valor={empresa.logo}
                  onChange={(valor) =>
                    setEmpresa((atual) => ({ ...atual, logo: valor }))
                  }
                  placeholder="/imagens/logo/brasao-choqueseg.png"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
            >
              Salvar dados da empresa
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function classeAba(ativa: boolean) {
  return `rounded-xl border px-4 py-4 text-left font-black uppercase transition ${
    ativa
      ? "border-yellow-400 bg-yellow-400 text-black"
      : "border-zinc-800 bg-black text-zinc-300 hover:border-yellow-400/50"
  }`;
}

function CardResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-4">
      <p className="text-xs font-black uppercase text-zinc-500">{titulo}</p>
      <p className="mt-2 break-words text-xl font-black text-yellow-400">
        {valor}
      </p>
    </div>
  );
}

function CampoTexto({
  label,
  valor,
  onChange,
  placeholder,
  tipo = "text",
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  tipo?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>
      <input
        type={tipo}
        value={valor}
        placeholder={placeholder}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function CampoSelect({
  label,
  valor,
  onChange,
  opcoes,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>
      <select
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </div>
  );
}

function converterValor(valor: string) {
  const numero = Number(
    valor.replace(/\./g, "").replace(",", "."),
  );

  return Number.isNaN(numero) ? 0 : numero;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function dataLocalISO() {
  const agora = new Date();
  const local = new Date(
    agora.getTime() - agora.getTimezoneOffset() * 60_000,
  );

  return local.toISOString().slice(0, 10);
}

function formatarData(data: string) {
  if (!data) return "—";

  const [ano, mes, dia] = data.split("-");

  return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
}

function escaparHtml(valor: string) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
