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
  cpf_cnpj?: string | null;
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
  clienteCpfCnpj?: string;
  clienteCidade?: string;
  clienteEndereco?: string;
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
  const [clienteCpfCnpj, setClienteCpfCnpj] = useState("");
  const [clienteCidade, setClienteCidade] = useState("");
  const [clienteEndereco, setClienteEndereco] = useState("");
  const [salvarClienteNovo, setSalvarClienteNovo] = useState(false);
  const [clienteManual, setClienteManual] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState("");

  const [valor, setValor] = useState("");
  const [referenteA, setReferenteA] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [data, setData] = useState(dataLocalISO());
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [buscaHistorico, setBuscaHistorico] = useState("");
  const [reciboExpandidoId, setReciboExpandidoId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] =
    useState<"Todos" | StatusRecibo>("Todos");

  useEffect(() => {
    async function carregarClientes() {
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("id,nome,telefone,cidade,endereco,tipo_servico,cpf_cnpj")
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
    setClienteCpfCnpj(cliente.cpf_cnpj ?? "");
    setClienteCidade(cliente.cidade ?? "");
    setClienteEndereco(cliente.endereco ?? "");
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
    setClienteCpfCnpj("");
    setClienteCidade("");
    setClienteEndereco("");
    setSalvarClienteNovo(false);
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

  async function salvarRecibo(evento: FormEvent<HTMLFormElement>) {
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

    let clienteVinculadoId = clienteId;

    if (clienteManual && salvarClienteNovo && !clienteVinculadoId) {
      const novoClienteId = crypto.randomUUID();
      const { error: erroCliente } = await supabase.from("clientes").insert({
        id: novoClienteId,
        nome: clienteNome.trim(),
        telefone: clienteTelefone.trim() || null,
        cpf_cnpj: clienteCpfCnpj.trim() || null,
        cidade: clienteCidade.trim() || null,
        endereco: clienteEndereco.trim() || null,
        tipo_servico: null,
        origem: "Recibo",
        observacoes: "Cliente cadastrado a partir do módulo de Recibos.",
        status: "Novo Cliente",
        criado_em: new Date().toISOString(),
        retorno_em: null,
      });

      if (erroCliente) {
        setMensagem(`Não foi possível cadastrar o cliente: ${erroCliente.message}`);
        return;
      }

      clienteVinculadoId = novoClienteId;
      setClientes((atuais) =>
        [...atuais, {
          id: novoClienteId,
          nome: clienteNome.trim(),
          telefone: clienteTelefone.trim() || null,
          cpf_cnpj: clienteCpfCnpj.trim() || null,
          cidade: clienteCidade.trim() || null,
          endereco: clienteEndereco.trim() || null,
          tipo_servico: null,
        }].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
    }

    const novoRecibo: Recibo = {
      id: crypto.randomUUID(),
      numero: proximoNumeroRecibo(),
      clienteId: clienteVinculadoId || undefined,
      clienteNome: clienteNome.trim(),
      clienteTelefone: clienteTelefone.trim() || undefined,
      clienteCpfCnpj: clienteCpfCnpj.trim() || undefined,
      clienteCidade: clienteCidade.trim() || undefined,
      clienteEndereco: clienteEndereco.trim() || undefined,
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
    setClienteCpfCnpj("");
    setClienteCidade("");
    setClienteEndereco("");
    setSalvarClienteNovo(false);
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

  function abrirRecibo(recibo: Recibo) {
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

            :root {
              --amarelo: #facc15;
              --preto: #050505;
              --cinza: #f3f4f6;
              --cinza-borda: #d1d5db;
              --texto: #111827;
            }

            body {
              margin: 0;
              padding: 24px;
              font-family: Arial, Helvetica, sans-serif;
              background: #e5e7eb;
              color: var(--texto);
            }

            .pagina {
              width: min(100%, 860px);
              margin: 0 auto;
              background: white;
              border: 2px solid var(--amarelo);
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 0 18px 50px rgba(0,0,0,.16);
            }

            .topo {
              position: relative;
              display: grid;
              grid-template-columns: 120px minmax(0,1fr);
              align-items: center;
              gap: 22px;
              min-height: 155px;
              padding: 22px 28px;
              background:
                radial-gradient(circle at 82% 18%, rgba(250,204,21,.30), transparent 24%),
                linear-gradient(135deg, #050505 0%, #0b0b0b 68%, #111827 100%);
              color: white;
              border-bottom: 6px solid var(--amarelo);
            }

            .topo::after {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              opacity: .10;
              background:
                repeating-linear-gradient(
                  -16deg,
                  transparent 0 30px,
                  rgba(250,204,21,.25) 31px 32px
                );
            }

            .logo {
              position: relative;
              z-index: 1;
              width: 112px;
              height: 112px;
              object-fit: contain;
            }

            .marca {
              position: relative;
              z-index: 1;
            }

            .empresa {
              color: var(--amarelo);
              font-size: 34px;
              line-height: 1;
              font-weight: 1000;
              letter-spacing: .8px;
            }

            .subtitulo {
              margin-top: 7px;
              font-size: 15px;
              font-weight: 800;
            }

            .slogan {
              margin-top: 12px;
              color: #d1d5db;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: .6px;
            }

            .conteudo {
              padding: 28px;
            }

            .titulo-area {
              display: grid;
              grid-template-columns: minmax(0,1fr) 220px;
              align-items: start;
              gap: 20px;
              margin-bottom: 22px;
            }

            .titulo {
              margin: 0;
              font-size: 38px;
              line-height: 1;
              font-weight: 1000;
              text-transform: uppercase;
            }

            .titulo strong {
              color: var(--amarelo);
            }

            .subtitulo-doc {
              margin-top: 8px;
              color: #4b5563;
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: .5px;
            }

            .numero-box {
              border-radius: 18px;
              background: linear-gradient(180deg, #f9fafb, #e5e7eb);
              padding: 15px 16px;
              text-align: center;
              border: 1px solid #d1d5db;
            }

            .numero-box small {
              display: block;
              color: #4b5563;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
            }

            .numero-box strong {
              display: block;
              margin-top: 4px;
              font-size: 18px;
              font-weight: 1000;
            }

            .numero-box .data {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #d1d5db;
            }

            .cancelado {
              margin: 0 0 18px;
              border: 2px solid #ef4444;
              background: #fef2f2;
              color: #b91c1c;
              padding: 13px;
              border-radius: 12px;
              text-align: center;
              font-weight: 900;
            }

            .secao {
              position: relative;
              margin-top: 16px;
              border: 1px solid #9ca3af;
              border-radius: 16px;
              padding: 24px 18px 16px;
              background: linear-gradient(180deg, #ffffff, #fafafa);
            }

            .secao-titulo {
              position: absolute;
              top: -13px;
              left: 16px;
              display: inline-flex;
              align-items: center;
              gap: 7px;
              min-width: 210px;
              padding: 7px 14px;
              border-radius: 10px 10px 10px 0;
              background: var(--amarelo);
              color: #050505;
              font-size: 14px;
              font-weight: 1000;
              text-transform: uppercase;
            }

            .grid-empresa {
              display: grid;
              grid-template-columns: minmax(0,1.4fr) minmax(220px,.8fr);
              gap: 18px;
              align-items: center;
            }

            .empresa-dados strong {
              font-size: 17px;
            }

            .empresa-dados p,
            .contatos p {
              margin: 5px 0;
              font-size: 13px;
              line-height: 1.45;
            }

            .contatos {
              border-left: 1px solid #d1d5db;
              padding-left: 18px;
            }

            .linha-dado {
              display: grid;
              grid-template-columns: 135px minmax(0,1fr);
              gap: 12px;
              padding: 9px 0;
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
            }

            .linha-dado:last-child {
              border-bottom: 0;
            }

            .linha-dado strong {
              font-weight: 900;
            }

            .pagamento-grid {
              display: grid;
              grid-template-columns: minmax(0,1fr) 280px;
              gap: 18px;
              align-items: stretch;
            }

            .valor-box {
              display: flex;
              min-height: 150px;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border-radius: 18px;
              background: linear-gradient(135deg, #fde047, #facc15);
              color: #050505;
              text-align: center;
              padding: 18px;
              box-shadow: inset 0 0 0 1px rgba(0,0,0,.08);
            }

            .valor-box small {
              display: block;
              font-size: 11px;
              font-weight: 1000;
              text-transform: uppercase;
            }

            .valor-box strong {
              display: block;
              margin-top: 7px;
              font-size: 40px;
              line-height: 1;
              font-weight: 1000;
            }

            .declaracao {
              margin-top: 18px;
              border-radius: 16px;
              background: #f3f4f6;
              padding: 18px 20px;
              font-size: 15px;
              line-height: 1.65;
            }

            .assinatura {
              margin: 34px auto 10px;
              max-width: 420px;
              text-align: center;
            }

            .assinatura .linha {
              margin: 0 auto 8px;
              width: 100%;
              border-top: 1px solid #111827;
            }

            .assinatura strong {
              display: block;
              font-size: 14px;
            }

            .assinatura span {
              display: block;
              margin-top: 4px;
              color: #4b5563;
              font-size: 12px;
            }

            .rodape-servicos {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 0;
              background: #050505;
              border-top: 6px solid var(--amarelo);
              color: white;
            }

            .servico {
              min-height: 92px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 7px;
              padding: 14px 8px;
              text-align: center;
              border-right: 1px solid #374151;
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
            }

            .servico:last-child {
              border-right: 0;
            }

            .servico .icone {
              color: var(--amarelo);
              font-size: 26px;
            }

            .faixa-final {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              padding: 12px 22px;
              background: #050505;
              color: white;
              border-top: 1px solid #374151;
              font-size: 11px;
              font-weight: 800;
            }

            .faixa-final strong {
              color: var(--amarelo);
              text-transform: uppercase;
            }

            .acoes {
              width: min(100%, 860px);
              margin: 16px auto;
              display: flex;
              justify-content: center;
              gap: 10px;
            }

            button {
              border: 0;
              border-radius: 11px;
              padding: 13px 18px;
              background: var(--amarelo);
              color: #050505;
              font-weight: 900;
              cursor: pointer;
            }

            @media (max-width: 680px) {
              body { padding: 8px; }
              .pagina { border-radius: 16px; }
              .topo {
                grid-template-columns: 84px minmax(0,1fr);
                min-height: 118px;
                padding: 16px;
              }
              .logo { width: 78px; height: 78px; }
              .empresa { font-size: 24px; }
              .subtitulo { font-size: 12px; }
              .slogan { display: none; }
              .conteudo { padding: 18px; }
              .titulo-area { grid-template-columns: 1fr; }
              .titulo { font-size: 28px; }
              .numero-box { text-align: left; }
              .grid-empresa,
              .pagamento-grid { grid-template-columns: 1fr; }
              .contatos {
                border-left: 0;
                border-top: 1px solid #d1d5db;
                padding-left: 0;
                padding-top: 12px;
              }
              .linha-dado {
                grid-template-columns: 1fr;
                gap: 3px;
              }
              .rodape-servicos {
                grid-template-columns: repeat(2, 1fr);
              }
              .servico:nth-child(2) { border-right: 0; }
              .servico:nth-child(-n+2) { border-bottom: 1px solid #374151; }
              .faixa-final {
                flex-direction: column;
                align-items: flex-start;
              }
            }

            @media print {
              @page {
                size: A4;
                margin: 8mm;
              }

              body {
                background: white;
                padding: 0;
              }

              .pagina {
                width: 100%;
                box-shadow: none;
                border-radius: 0;
              }

              .acoes {
                display: none !important;
              }
            }
          </style>
        </head>

        <body>
          <div class="pagina">
            <header class="topo">
              <img src="${escaparHtml(empresa.logo)}" class="logo" alt="CHOQUESEG" />
              <div class="marca">
                <div class="empresa">${escaparHtml(empresa.nome)}</div>
                <div class="subtitulo">${escaparHtml(empresa.subtitulo)}</div>
                <div class="slogan">Segurança, conforto, economia e tecnologia para o seu patrimônio</div>
              </div>
            </header>

            <main class="conteudo">
              <div class="titulo-area">
                <div>
                  <h1 class="titulo">RECIBO <strong>DE PAGAMENTO</strong></h1>
                  <p class="subtitulo-doc">Comprovante oficial CHOQUESEG</p>
                </div>

                <div class="numero-box">
                  <small>Nº do recibo</small>
                  <strong>${escaparHtml(recibo.numero)}</strong>
                  <div class="data">
                    <small>Data de emissão</small>
                    <strong>${formatarData(recibo.data)}</strong>
                  </div>
                </div>
              </div>

              ${
                statusCancelado
                  ? `<div class="cancelado">RECIBO CANCELADO<br /><small>${escaparHtml(
                      recibo.motivoCancelamento || "",
                    )}</small></div>`
                  : ""
              }

              <section class="secao">
                <div class="secao-titulo">🏢 Dados da empresa</div>

                <div class="grid-empresa">
                  <div class="empresa-dados">
                    <strong>${escaparHtml(empresa.nome)} – ${escaparHtml(empresa.subtitulo)}</strong>
                    <p>CNPJ: ${escaparHtml(empresa.cnpj)}</p>
                    <p>${escaparHtml(empresa.endereco)}</p>
                  </div>

                  <div class="contatos">
                    <p>📞 ${escaparHtml(empresa.telefone)}</p>
                    <p>◎ ${escaparHtml(empresa.instagram)}</p>
                    <p>✓ Credenciado Intelbras</p>
                  </div>
                </div>
              </section>

              <section class="secao">
                <div class="secao-titulo">👤 Dados do cliente</div>

                <div class="linha-dado">
                  <strong>Nome</strong>
                  <span>${escaparHtml(recibo.clienteNome)}</span>
                </div>

                ${
                  recibo.clienteCpfCnpj
                    ? `<div class="linha-dado"><strong>CPF / CNPJ</strong><span>${escaparHtml(recibo.clienteCpfCnpj)}</span></div>`
                    : ""
                }

                ${
                  recibo.clienteTelefone
                    ? `<div class="linha-dado"><strong>Telefone</strong><span>${escaparHtml(recibo.clienteTelefone)}</span></div>`
                    : ""
                }

                ${
                  recibo.clienteEndereco || recibo.clienteCidade
                    ? `<div class="linha-dado"><strong>Endereço</strong><span>${escaparHtml(
                        [recibo.clienteEndereco, recibo.clienteCidade].filter(Boolean).join(" - "),
                      )}</span></div>`
                    : ""
                }
              </section>

              <section class="secao">
                <div class="secao-titulo">💳 Dados do pagamento</div>

                <div class="pagamento-grid">
                  <div>
                    <div class="linha-dado">
                      <strong>Referente a</strong>
                      <span>${escaparHtml(recibo.referenteA)}</span>
                    </div>

                    <div class="linha-dado">
                      <strong>Forma</strong>
                      <span>${escaparHtml(recibo.formaPagamento)}</span>
                    </div>

                    <div class="linha-dado">
                      <strong>Data</strong>
                      <span>${formatarData(recibo.data)}</span>
                    </div>

                    ${
                      recibo.observacao
                        ? `<div class="linha-dado"><strong>Observação</strong><span>${escaparHtml(recibo.observacao)}</span></div>`
                        : ""
                    }
                  </div>

                  <div class="valor-box">
                    <small>Valor recebido</small>
                    <strong>${formatarMoeda(recibo.valor)}</strong>
                  </div>
                </div>
              </section>

              <div class="declaracao">
                Recebemos de <strong>${escaparHtml(recibo.clienteNome)}</strong>
                a importância de <strong>${formatarMoeda(recibo.valor)}</strong>,
                referente a <strong>${escaparHtml(recibo.referenteA)}</strong>,
                conforme descrito neste recibo.
              </div>

              <div class="assinatura">
                <div class="linha"></div>
                <strong>${escaparHtml(empresa.nome)}</strong>
                <span>${escaparHtml(empresa.subtitulo)} · CNPJ ${escaparHtml(empresa.cnpj)}</span>
              </div>
            </main>

            <footer>
              <div class="rodape-servicos">
                <div class="servico">
                  <span class="icone">☀</span>
                  <span>Energia Solar</span>
                </div>
                <div class="servico">
                  <span class="icone">📹</span>
                  <span>Segurança Eletrônica</span>
                </div>
                <div class="servico">
                  <span class="icone">⚡</span>
                  <span>Elétrica Residencial</span>
                </div>
                <div class="servico">
                  <span class="icone">⌂</span>
                  <span>Casa Inteligente</span>
                </div>
              </div>

              <div class="faixa-final">
                <strong>Tecnologia que valoriza o seu patrimônio</strong>
                <span>Obrigado pela confiança!</span>
              </div>
            </footer>
          </div>

          <div class="acoes">
            <button onclick="window.print()">Imprimir / Salvar PDF</button>
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
                      {clienteCpfCnpj ? ` · ${clienteCpfCnpj}` : ""}
                    </p>
                    {(clienteEndereco || clienteCidade) && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {[clienteEndereco, clienteCidade].filter(Boolean).join(" · ")}
                      </p>
                    )}
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
                  <CampoTexto
                    label="CPF / CNPJ"
                    valor={clienteCpfCnpj}
                    onChange={setClienteCpfCnpj}
                    placeholder="Opcional"
                  />
                  <CampoTexto
                    label="Cidade"
                    valor={clienteCidade}
                    onChange={setClienteCidade}
                    placeholder="Cidade"
                  />
                  <div className="md:col-span-2 xl:col-span-2">
                    <CampoTexto
                      label="Endereço"
                      valor={clienteEndereco}
                      onChange={setClienteEndereco}
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-4 py-3 text-sm font-bold text-zinc-200 md:col-span-2 xl:col-span-2">
                    <input
                      type="checkbox"
                      checked={salvarClienteNovo}
                      onChange={(evento) => setSalvarClienteNovo(evento.target.checked)}
                      className="h-4 w-4 accent-yellow-400"
                    />
                    Salvar este cliente no cadastro da CHOQUESEG
                  </label>
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
                type="submit"
                className="rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
              >
                Gerar recibo
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
                  recibosFiltrados.map((recibo) => {
                    const expandido = reciboExpandidoId === recibo.id;
                    return (
                      <article
                        key={recibo.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setReciboExpandidoId((atual) =>
                              atual === recibo.id ? null : recibo.id,
                            )
                          }
                          className="flex w-full min-w-0 items-center justify-between gap-3 p-4 text-left"
                        >
                          <div className="min-w-0">
                            <h4 className="truncate text-base font-black uppercase text-white">
                              {recibo.clienteNome}
                            </h4>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                              <span className="font-black text-yellow-400">
                                {formatarMoeda(recibo.valor)}
                              </span>
                              <span className="text-zinc-500">{formatarData(recibo.data)}</span>
                              <span className={recibo.status === "Emitido" ? "font-black text-emerald-400" : "font-black text-red-400"}>
                                {recibo.status}
                              </span>
                              <span className="text-zinc-500">{recibo.numero}</span>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-black text-zinc-300">
                            {expandido ? "▲" : "▼"}
                          </span>
                        </button>

                        {expandido && (
                          <div className="border-t border-zinc-800 p-4">
                            <p className="text-sm text-zinc-300">{recibo.referenteA}</p>
                            <p className="mt-2 text-sm text-zinc-500">
                              {recibo.formaPagamento}
                              {recibo.clienteTelefone ? ` · ${recibo.clienteTelefone}` : ""}
                            </p>
                            {recibo.status === "Cancelado" && recibo.motivoCancelamento && (
                              <p className="mt-2 text-sm font-bold text-red-400">
                                Motivo: {recibo.motivoCancelamento}
                              </p>
                            )}
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button type="button" onClick={() => abrirRecibo(recibo)} className="rounded-xl border border-yellow-400/50 px-4 py-2 text-sm font-black uppercase text-yellow-300">
                                Visualizar / PDF
                              </button>
                              {recibo.clienteTelefone && (
                                <button type="button" onClick={() => abrirWhatsApp(recibo)} className="rounded-xl border border-emerald-500/50 px-4 py-2 text-sm font-black uppercase text-emerald-400">
                                  WhatsApp
                                </button>
                              )}
                              {recibo.status === "Emitido" && (
                                <button type="button" onClick={() => cancelarRecibo(recibo)} className="rounded-xl border border-red-500/50 px-4 py-2 text-sm font-black uppercase text-red-400">
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })
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
