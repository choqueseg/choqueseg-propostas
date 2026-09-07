"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import CentralVozGlobal from "./CentralVozGlobal";

type StatusCliente =
  | "Novo Contato"
  | "Novo Cliente"
  | "Orçamento Solicitado"
  | "Orçamento Enviado"
  | "Retorno em 2 dias"
  | "Cliente Ainda Não Decidiu"
  | "Negociação"
  | "Cliente Desistiu / Fechou com Outra Empresa"
  | "Serviço Fechado"
  | "Serviço Fechado / Adiantamento Pago"
  | "Agendado"
  | "Serviço Agendado"
  | "Em Execução"
  | "Concluído"
  | "Serviço Concluído"
  | "Etapa de Obra"
  | "Projeto Aprovado"
  | "Instalação Concluída"
  | "Solicitar Vistoria"
  | "Medidor Trocado"
  | "Pós-venda";

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  tipoServico: string;
  origem: string;
  observacoes: string;
  status: StatusCliente;
  criadoEm: string;
  retornoEm: string;
};

type ClienteBanco = {
  id: string;
  nome: string;
  telefone: string | null;
  cidade: string | null;
  endereco: string | null;
  tipo_servico: string | null;
  origem: string | null;
  observacoes: string | null;
  status: string | null;
  criado_em: string | null;
  retorno_em: string | null;
};

type ServicoDashboard = {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  tipoServico: string;
  data: string;
  horario: string;
  horarioFim: string;
  endereco: string;
  cidade: string;
  equipe: string;
  descricao: string;
  status: string;
};

type CompromissoDashboard = {
  id: string;
  tipo: string;
  titulo: string;
  data: string;
  horario: string;
  horarioFim: string;
  responsavel: string;
  local: string;
  descricao: string;
};

type TreinamentoDashboard = {
  id: string;
  tema: string;
  data: string;
  horario: string;
  horarioFim: string;
  responsavel: string;
  local: string;
  participantes: string[];
  status: string;
};

type TelaSistema =
  | "dashboard"
  | "propostas"
  | "energia-solar"
  | "seguranca-eletronica"
  | "eletrica"
  | "automacao"
  | "cadastro-produtos"
  | "clientes"
  | "funil"
  | "agenda"
  | "financeiro"
  | "recibos"
  | "funcionarios";

type CategoriaPainel =
  | "totalClientes"
  | "retorno"
  | "orcamentoSolicitado"
  | "orcamentoEnviado"
  | "servicoFechado"
  | "agendado"
  | "emExecucao"
  | "concluido"
  | "hoje";

type ItemPainel = {
  id: string;
  origem: "cliente" | "servico" | "compromisso" | "treinamento";
  titulo: string;
  telefone?: string;
  tipo: string;
  horario?: string;
  subtitulo?: string;
  tela: TelaSistema;
  dados: Cliente | ServicoDashboard | CompromissoDashboard | TreinamentoDashboard;
};

const CHAVE_CLIENTES = "choqueseg-pro-clientes";
const supabase = createClient();

function dataLocalISO(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarData(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
}

function normalizarHorario(valor: string | null | undefined) {
  return String(valor ?? "").slice(0, 5);
}

function clienteBancoParaApp(item: ClienteBanco): Cliente {
  return {
    id: item.id,
    nome: item.nome,
    telefone: item.telefone ?? "",
    cidade: item.cidade ?? "",
    endereco: item.endereco ?? "",
    tipoServico: item.tipo_servico ?? "",
    origem: item.origem ?? "",
    observacoes: item.observacoes ?? "",
    status: (item.status ?? "Novo Contato") as StatusCliente,
    criadoEm: item.criado_em ?? new Date().toISOString(),
    retornoEm: item.retorno_em ?? "",
  };
}

function retornoVencido(cliente: Cliente) {
  if (cliente.status === "Retorno em 2 dias" || cliente.status === "Cliente Ainda Não Decidiu") return true;
  if (cliente.status !== "Orçamento Enviado" || !cliente.retornoEm) return false;

  const retorno = new Date(cliente.retornoEm).getTime();
  return Number.isFinite(retorno) && retorno <= Date.now();
}

export default function DashboardModule({
  alterarTela,
}: {
  alterarTela: (tela: TelaSistema) => void;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<ServicoDashboard[]>([]);
  const [compromissos, setCompromissos] = useState<CompromissoDashboard[]>([]);
  const [treinamentos, setTreinamentos] = useState<TreinamentoDashboard[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [categoriaAberta, setCategoriaAberta] = useState<CategoriaPainel | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState<ItemPainel | null>(null);
  const [versaoFinanceiro, setVersaoFinanceiro] = useState(0);

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      try {
        setErro("");

        const [
          clientesResposta,
          servicosResposta,
          compromissosResposta,
          treinamentosResposta,
        ] = await Promise.all([
          supabase
            .from("clientes")
            .select(
              "id,nome,telefone,cidade,endereco,tipo_servico,origem,observacoes,status,criado_em,retorno_em",
            )
            .order("criado_em", { ascending: false }),
          supabase
            .from("servicos")
            .select(
              "id,cliente_id,cliente_nome,cliente_telefone,tipo_servico,data,horario,horario_fim,endereco,cidade,equipe,descricao,status",
            )
            .order("data", { ascending: true })
            .order("horario", { ascending: true }),
          supabase
            .from("agenda_compromissos")
            .select(
              "id,tipo,titulo,data,horario,horario_fim,responsavel,local,descricao",
            )
            .order("data", { ascending: true })
            .order("horario", { ascending: true }),
          supabase
            .from("treinamentos")
            .select(
              "id,tema,data,horario,horario_fim,responsavel,local,participantes,status",
            )
            .order("data", { ascending: true })
            .order("horario", { ascending: true }),
        ]);

        if (clientesResposta.error) throw clientesResposta.error;
        if (servicosResposta.error) throw servicosResposta.error;
        if (compromissosResposta.error) throw compromissosResposta.error;
        if (treinamentosResposta.error) throw treinamentosResposta.error;

        let listaClientes = (clientesResposta.data ?? []).map((item) =>
          clienteBancoParaApp(item as ClienteBanco),
        );

        const agora = Date.now();
        const vencidos = listaClientes.filter((cliente) => {
          if (cliente.status !== "Orçamento Enviado" || !cliente.retornoEm) {
            return false;
          }

          const retorno = new Date(cliente.retornoEm).getTime();
          return Number.isFinite(retorno) && retorno <= agora;
        });

        if (vencidos.length > 0) {
          const ids = vencidos.map((cliente) => cliente.id);

          const { error: erroAtualizacao } = await supabase
            .from("clientes")
            .update({ status: "Retorno em 2 dias" })
            .in("id", ids);

          if (erroAtualizacao) throw erroAtualizacao;

          listaClientes = listaClientes.map((cliente) =>
            ids.includes(cliente.id)
              ? { ...cliente, status: "Retorno em 2 dias" as StatusCliente }
              : cliente,
          );
        }

        const listaServicos: ServicoDashboard[] = (servicosResposta.data ?? []).map(
          (item: any) => ({
            id: String(item.id),
            clienteId: String(item.cliente_id ?? ""),
            clienteNome: String(item.cliente_nome ?? "Cliente"),
            clienteTelefone: String(item.cliente_telefone ?? ""),
            tipoServico: String(item.tipo_servico ?? "Serviço"),
            data: String(item.data ?? ""),
            horario: normalizarHorario(item.horario),
            horarioFim: normalizarHorario(item.horario_fim),
            endereco: String(item.endereco ?? ""),
            cidade: String(item.cidade ?? ""),
            equipe: String(item.equipe ?? ""),
            descricao: String(item.descricao ?? ""),
            status: String(item.status ?? "Agendado"),
          }),
        );

        const listaCompromissos: CompromissoDashboard[] = (
          compromissosResposta.data ?? []
        ).map((item: any) => ({
          id: String(item.id),
          tipo: String(item.tipo ?? "Outro"),
          titulo: String(item.titulo ?? "Compromisso"),
          data: String(item.data ?? ""),
          horario: normalizarHorario(item.horario),
          horarioFim: normalizarHorario(item.horario_fim),
          responsavel: String(item.responsavel ?? ""),
          local: String(item.local ?? ""),
          descricao: String(item.descricao ?? ""),
        }));

        const listaTreinamentos: TreinamentoDashboard[] = (
          treinamentosResposta.data ?? []
        ).map((item: any) => ({
          id: String(item.id),
          tema: String(item.tema ?? "Treinamento"),
          data: String(item.data ?? ""),
          horario: normalizarHorario(item.horario),
          horarioFim: normalizarHorario(item.horario_fim),
          responsavel: String(item.responsavel ?? ""),
          local: String(item.local ?? ""),
          participantes: Array.isArray(item.participantes)
            ? item.participantes.map(String)
            : [],
          status: String(item.status ?? "Agendado"),
        }));

        if (!ativo) return;

        setClientes(listaClientes);
        setServicos(listaServicos);
        setCompromissos(listaCompromissos);
        setTreinamentos(listaTreinamentos);

        try {
          localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(listaClientes));
        } catch {
          // O Supabase é a fonte oficial; cache local é apenas auxiliar.
        }
      } catch (e: any) {
        console.error("Erro ao atualizar Dashboard:", e);
        if (!ativo) return;
        setErro(e?.message ? `Erro ao atualizar Dashboard: ${e.message}` : "Erro ao atualizar Dashboard.");

        try {
          const dadosSalvos = localStorage.getItem(CHAVE_CLIENTES);
          if (dadosSalvos) {
            setClientes(JSON.parse(dadosSalvos) as Cliente[]);
          }
        } catch {
          // Mantém o Dashboard operacional mesmo sem cache.
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarDashboard();

    // Mantém o Dashboard sincronizado em tempo real com Agenda/Funil.
    // Isso evita mostrar um compromisso que já foi excluído ou alterado em outra tela.
    const canalServicos = supabase
      .channel("dashboard-servicos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "servicos" },
        () => { void carregarDashboard(); },
      )
      .subscribe();

    const canalCompromissos = supabase
      .channel("dashboard-compromissos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agenda_compromissos" },
        () => { void carregarDashboard(); },
      )
      .subscribe();

    const canalTreinamentos = supabase
      .channel("dashboard-treinamentos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "treinamentos" },
        () => { void carregarDashboard(); },
      )
      .subscribe();

    const canalClientes = supabase
      .channel("dashboard-clientes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clientes" },
        () => { void carregarDashboard(); },
      )
      .subscribe();

    const intervalo = window.setInterval(() => {
      void carregarDashboard();
    }, 60_000);

    const aoFocar = () => {
      void carregarDashboard();
    };

    const aoVoltarParaAba = () => {
      if (document.visibilityState === "visible") {
        void carregarDashboard();
      }
    };

    window.addEventListener("focus", aoFocar);
    document.addEventListener("visibilitychange", aoVoltarParaAba);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
      window.removeEventListener("focus", aoFocar);
      document.removeEventListener("visibilitychange", aoVoltarParaAba);
      void supabase.removeChannel(canalServicos);
      void supabase.removeChannel(canalCompromissos);
      void supabase.removeChannel(canalTreinamentos);
      void supabase.removeChannel(canalClientes);
    };
  }, []);


  useEffect(() => {
    const atualizarFinanceiro = () =>
      setVersaoFinanceiro((versao) => versao + 1);

    window.addEventListener(
      "choqueseg-financeiro-atualizado",
      atualizarFinanceiro,
    );
    window.addEventListener("storage", atualizarFinanceiro);
    window.addEventListener("focus", atualizarFinanceiro);

    return () => {
      window.removeEventListener(
        "choqueseg-financeiro-atualizado",
        atualizarFinanceiro,
      );
      window.removeEventListener("storage", atualizarFinanceiro);
      window.removeEventListener("focus", atualizarFinanceiro);
    };
  }, []);

  const hoje = dataLocalISO();


  const financeiroProximosVencimentos = useMemo(() => {
    const hojeFinanceiro = dataLocalISO();

    function diasAte(dataISO: string) {
      if (!dataISO) return Number.POSITIVE_INFINITY;

      const inicio = new Date(`${hojeFinanceiro}T12:00:00`);
      const fim = new Date(`${dataISO}T12:00:00`);

      return Math.round(
        (fim.getTime() - inicio.getTime()) / 86_400_000,
      );
    }

    let contasPagar: any[] = [];
    let contasReceber: any[] = [];

    try {
      const dados = JSON.parse(
        localStorage.getItem("choqueseg-financeiro-contas-pagar") || "[]",
      );
      contasPagar = Array.isArray(dados) ? dados : [];
    } catch {
      contasPagar = [];
    }

    try {
      const dados = JSON.parse(
        localStorage.getItem("choqueseg-financeiro-contas-receber") || "[]",
      );
      contasReceber = Array.isArray(dados) ? dados : [];
    } catch {
      contasReceber = [];
    }

    const pagar = contasPagar
      .filter((conta) => {
        if (!conta || conta.situacao === "Pago") return false;
        return diasAte(String(conta.vencimento || "")) <= 2;
      })
      .sort((a, b) =>
        String(a.vencimento || "").localeCompare(
          String(b.vencimento || ""),
        ),
      );

    const receber = contasReceber
      .filter((conta) => {
        if (!conta || conta.situacao === "Recebido") return false;
        return diasAte(String(conta.vencimento || "")) <= 2;
      })
      .sort((a, b) =>
        String(a.vencimento || "").localeCompare(
          String(b.vencimento || ""),
        ),
      );

    const totalPagar = pagar.reduce(
      (total, conta) => total + Number(conta.valor || 0),
      0,
    );

    const totalReceber = receber.reduce((total, conta) => {
      const restante = Math.max(
        0,
        Number(conta.valorTotal || 0) -
          Number(conta.valorRecebido || 0),
      );
      return total + restante;
    }, 0);

    return {
      pagar,
      receber,
      totalPagar,
      totalReceber,
      quantidade: pagar.length + receber.length,
    };
  }, [versaoFinanceiro]);

  const indicadores = useMemo(() => {
    function contarCliente(status: StatusCliente) {
      return clientes.filter((cliente) => cliente.status === status).length;
    }

    const aguardandoRetorno = clientes.filter(retornoVencido).length;
    const orcamentosEnviadosAguardandoPrazo = clientes.filter(
      (cliente) =>
        cliente.status === "Orçamento Enviado" && !retornoVencido(cliente),
    ).length;

    return {
      totalClientes: clientes.length,
      novoContato: contarCliente("Novo Contato") + contarCliente("Novo Cliente"),
      orcamentoSolicitado: contarCliente("Orçamento Solicitado"),
      orcamentoEnviado: orcamentosEnviadosAguardandoPrazo,
      retorno: aguardandoRetorno,
      negociacao: contarCliente("Negociação") + contarCliente("Cliente Ainda Não Decidiu"),
      servicoFechado: contarCliente("Serviço Fechado") + contarCliente("Serviço Fechado / Adiantamento Pago"),
      agendado: servicos.filter((servico) => servico.status === "Agendado").length,
      emExecucao: servicos.filter((servico) =>
        ["Em execução", "Em Execução", "Em deslocamento"].includes(servico.status),
      ).length,
      concluido: servicos.filter((servico) => servico.status === "Concluído").length,
      posVenda: contarCliente("Pós-venda"),
    };
  }, [clientes, servicos]);

  const itensHoje = useMemo<ItemPainel[]>(() => {
    const itens: ItemPainel[] = [];

    servicos
      .filter(
        (servico) =>
          servico.data === hoje &&
          String(servico.status).trim().toLowerCase() === "agendado",
      )
      .forEach((servico) => {
        itens.push({
          id: `servico-${servico.id}`,
          origem: "servico",
          titulo: servico.clienteNome,
          telefone: servico.clienteTelefone,
          tipo: servico.tipoServico,
          horario: `${servico.horario}${servico.horarioFim ? ` às ${servico.horarioFim}` : ""}`,
          subtitulo: servico.status,
          tela: "agenda",
          dados: servico,
        });
      });

    compromissos
      .filter((compromisso) => compromisso.data === hoje)
      .forEach((compromisso) => {
        itens.push({
          id: `compromisso-${compromisso.id}`,
          origem: "compromisso",
          titulo: compromisso.titulo,
          tipo: compromisso.tipo,
          horario: `${compromisso.horario}${compromisso.horarioFim ? ` às ${compromisso.horarioFim}` : ""}`,
          subtitulo: compromisso.responsavel,
          tela: "agenda",
          dados: compromisso,
        });
      });

    treinamentos
      .filter(
        (treinamento) =>
          treinamento.data === hoje && treinamento.status !== "Cancelado",
      )
      .forEach((treinamento) => {
        itens.push({
          id: `treinamento-${treinamento.id}`,
          origem: "treinamento",
          titulo: treinamento.tema,
          tipo: "Treinamento",
          horario: `${treinamento.horario}${treinamento.horarioFim ? ` às ${treinamento.horarioFim}` : ""}`,
          subtitulo: treinamento.responsavel,
          tela: "agenda",
          dados: treinamento,
        });
      });

    return itens.sort((a, b) => (a.horario ?? "").localeCompare(b.horario ?? ""));
  }, [servicos, compromissos, treinamentos, hoje]);

  const resumoHoje = useMemo(() => {
    const atendimentos = itensHoje.filter((item) => item.origem === "servico").length;
    const outros = itensHoje.length - atendimentos;

    if (itensHoje.length === 0) return "Nenhum atendimento ou compromisso agendado para hoje.";
    if (outros === 0) return `Hoje você tem ${atendimentos} atendimento(s) agendado(s).`;
    if (atendimentos === 0) return `Hoje você tem ${outros} compromisso(s) na Agenda.`;

    return `Hoje você tem ${atendimentos} atendimento(s) e ${outros} outro(s) compromisso(s).`;
  }, [itensHoje]);

  const proximosCompromissos = useMemo(() => {
    const inicio = new Date(`${hoje}T12:00:00`);
    const limite = new Date(inicio);
    limite.setDate(limite.getDate() + 2);

    const dentroDosProximosDoisDias = (data: string) => {
      if (!data || data <= hoje) return false;
      const alvo = new Date(`${data}T12:00:00`);
      return alvo.getTime() <= limite.getTime();
    };

    const itens: { id: string; titulo: string; tipo: string; data: string; horario: string }[] = [];

    servicos
      .filter((item) => dentroDosProximosDoisDias(item.data) && String(item.status).toLowerCase() !== "concluído")
      .forEach((item) => itens.push({
        id: `prox-servico-${item.id}`,
        titulo: item.clienteNome,
        tipo: item.tipoServico || "Serviço",
        data: item.data,
        horario: item.horario,
      }));

    compromissos
      .filter((item) => dentroDosProximosDoisDias(item.data))
      .forEach((item) => itens.push({
        id: `prox-compromisso-${item.id}`,
        titulo: item.titulo,
        tipo: item.tipo || "Compromisso",
        data: item.data,
        horario: item.horario,
      }));

    treinamentos
      .filter((item) => dentroDosProximosDoisDias(item.data) && item.status !== "Cancelado")
      .forEach((item) => itens.push({
        id: `prox-treinamento-${item.id}`,
        titulo: item.tema,
        tipo: "Treinamento",
        data: item.data,
        horario: item.horario,
      }));

    return itens.sort((a, b) => `${a.data}-${a.horario}`.localeCompare(`${b.data}-${b.horario}`));
  }, [servicos, compromissos, treinamentos, hoje]);

  function clientesPorStatus(status: StatusCliente) {
    return clientes.filter((cliente) => cliente.status === status);
  }

  const itensCategoria = useMemo<ItemPainel[]>(() => {
    if (!categoriaAberta) return [];

    if (categoriaAberta === "hoje") return itensHoje;

    const clientesParaItens = (lista: Cliente[], tipoFallback: string, tela: TelaSistema) =>
      lista.map<ItemPainel>((cliente) => ({
        id: `cliente-${cliente.id}`,
        origem: "cliente",
        titulo: cliente.nome,
        telefone: cliente.telefone,
        tipo: cliente.tipoServico || tipoFallback,
        subtitulo: cliente.status,
        tela,
        dados: cliente,
      }));

    switch (categoriaAberta) {
      case "totalClientes":
        return clientesParaItens(clientes, "Cliente", "clientes");
      case "retorno":
        return clientesParaItens(clientes.filter(retornoVencido), "Retorno", "funil");
      case "orcamentoSolicitado":
        return clientesParaItens(clientesPorStatus("Orçamento Solicitado"), "Proposta", "funil");
      case "orcamentoEnviado":
        return clientesParaItens(
          clientes.filter(
            (cliente) =>
              cliente.status === "Orçamento Enviado" && !retornoVencido(cliente),
          ),
          "Proposta enviada",
          "funil",
        );
      case "servicoFechado":
        return clientesParaItens(clientesPorStatus("Serviço Fechado"), "Serviço", "funil");
      case "agendado":
        return servicos
          .filter((servico) => servico.status === "Agendado")
          .map((servico) => ({
            id: `servico-${servico.id}`,
            origem: "servico" as const,
            titulo: servico.clienteNome,
            telefone: servico.clienteTelefone,
            tipo: servico.tipoServico,
            horario: `${formatarData(servico.data)} • ${servico.horario}${servico.horarioFim ? ` às ${servico.horarioFim}` : ""}`,
            subtitulo: servico.equipe,
            tela: "agenda" as TelaSistema,
            dados: servico,
          }));
      case "emExecucao":
        return servicos
          .filter((servico) =>
            ["Em execução", "Em Execução", "Em deslocamento"].includes(servico.status),
          )
          .map((servico) => ({
            id: `servico-${servico.id}`,
            origem: "servico" as const,
            titulo: servico.clienteNome,
            telefone: servico.clienteTelefone,
            tipo: servico.tipoServico,
            horario: `${formatarData(servico.data)} • ${servico.horario}${servico.horarioFim ? ` às ${servico.horarioFim}` : ""}`,
            subtitulo: servico.status,
            tela: "agenda" as TelaSistema,
            dados: servico,
          }));
      case "concluido":
        return servicos
          .filter((servico) => servico.status === "Concluído")
          .map((servico) => ({
            id: `servico-${servico.id}`,
            origem: "servico" as const,
            titulo: servico.clienteNome,
            telefone: servico.clienteTelefone,
            tipo: servico.tipoServico,
            horario: `${formatarData(servico.data)} • ${servico.horario}${servico.horarioFim ? ` às ${servico.horarioFim}` : ""}`,
            subtitulo: servico.status,
            tela: "agenda" as TelaSistema,
            dados: servico,
          }));
      default:
        return [];
    }
  }, [categoriaAberta, clientes, servicos, itensHoje]);

  const cards: {
    titulo: string;
    valor: number;
    detalhe: string;
    categoria: CategoriaPainel;
    icone: string;
  }[] = [
    {
      titulo: "Total de clientes",
      valor: indicadores.totalClientes,
      detalhe: "Clientes cadastrados",
      categoria: "totalClientes",
      icone: "👥",
    },
    {
      titulo: "Aguardando retorno",
      valor: indicadores.retorno,
      detalhe: "Retornos que precisam de ação",
      categoria: "retorno",
      icone: "⏰",
    },
    {
      titulo: "Orçamentos solicitados",
      valor: indicadores.orcamentoSolicitado,
      detalhe: "Precisam de proposta",
      categoria: "orcamentoSolicitado",
      icone: "📝",
    },
    {
      titulo: "Orçamentos enviados",
      valor: indicadores.orcamentoEnviado,
      detalhe: "Aguardando prazo de retorno",
      categoria: "orcamentoEnviado",
      icone: "📤",
    },
    {
      titulo: "Serviços fechados",
      valor: indicadores.servicoFechado,
      detalhe: "Aguardando agendamento",
      categoria: "servicoFechado",
      icone: "🤝",
    },
    {
      titulo: "Serviços agendados",
      valor: indicadores.agendado,
      detalhe: "Agenda da equipe",
      categoria: "agendado",
      icone: "📅",
    },
    {
      titulo: "Em execução",
      valor: indicadores.emExecucao,
      detalhe: "Serviços em andamento",
      categoria: "emExecucao",
      icone: "🚚",
    },
    {
      titulo: "Concluídos",
      valor: indicadores.concluido,
      detalhe: "Serviços finalizados",
      categoria: "concluido",
      icone: "✅",
    },
  ];

  const tituloCategoria: Record<CategoriaPainel, string> = {
    totalClientes: "Clientes cadastrados",
    retorno: "Aguardando retorno",
    orcamentoSolicitado: "Orçamentos solicitados",
    orcamentoEnviado: "Orçamentos enviados",
    servicoFechado: "Serviços fechados",
    agendado: "Serviços agendados",
    emExecucao: "Serviços em execução",
    concluido: "Serviços concluídos",
    hoje: "Agenda de hoje",
  };

  async function excluirItemSelecionado(item: ItemPainel): Promise<boolean> {
    const confirmar = window.confirm(
      `Deseja realmente excluir "${item.titulo}"?\n\nEsta ação removerá o registro da nuvem.`,
    );

    if (!confirmar) return false;

    try {
      if (item.origem === "servico") {
        const servico = item.dados as ServicoDashboard;
        const { error } = await supabase.from("servicos").delete().eq("id", servico.id);
        if (error) throw error;
        setServicos((atuais) => atuais.filter((registro) => registro.id !== servico.id));
      } else if (item.origem === "compromisso") {
        const compromisso = item.dados as CompromissoDashboard;
        const { error } = await supabase
          .from("agenda_compromissos")
          .delete()
          .eq("id", compromisso.id);
        if (error) throw error;
        setCompromissos((atuais) =>
          atuais.filter((registro) => registro.id !== compromisso.id),
        );
      } else if (item.origem === "treinamento") {
        const treinamento = item.dados as TreinamentoDashboard;
        const { error } = await supabase
          .from("treinamentos")
          .delete()
          .eq("id", treinamento.id);
        if (error) throw error;
        setTreinamentos((atuais) =>
          atuais.filter((registro) => registro.id !== treinamento.id),
        );
      } else {
        window.alert(
          "Clientes não são excluídos por este atalho para preservar propostas, contratos e histórico.",
        );
        return false;
      }

      setItemSelecionado(null);
      return true;
    } catch (e: any) {
      console.error("Erro ao excluir registro pelo Dashboard:", e);
      window.alert(
        e?.message
          ? `Não foi possível excluir: ${e.message}`
          : "Não foi possível excluir este registro.",
      );
      return false;
    }
  }


  return (
    <section className="p-4 md:p-7">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          Painel administrativo
        </p>

        <h2 className="mt-1 text-3xl font-black uppercase">
          Dashboard CHOQUESEG PRO
        </h2>

        <p className="mt-2 text-zinc-400">
          Acompanhe clientes, oportunidades, serviços e compromissos em tempo real.
        </p>
      </div>

      <div className="mt-5 grid min-w-0 items-stretch gap-4 lg:grid-cols-2">
        <CentralVozGlobal alterarTela={alterarTela} />

        <button
          type="button"
          onClick={() => setCategoriaAberta("hoje")}
          className="h-full min-w-0 w-full rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-4 text-left transition hover:border-yellow-400"
        >
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-yellow-300">
                    📅 Compromissos de hoje
                  </p>
                  <p className="mt-2 break-words text-lg font-black leading-tight text-white">
                    {resumoHoje}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {formatarData(hoje)}
                  </p>
                </div>

                <span className="rounded-full bg-yellow-400 px-3 py-1 text-xl font-black text-black">
                  {itensHoje.length}
                </span>
              </div>

              {itensHoje.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {itensHoje.slice(0, 2).map((item) => (
                    <div
                      key={`dashboard-hoje-${item.id}`}
                      className="rounded-xl border border-yellow-400/20 bg-black/30 px-3 py-2"
                    >
                      <p className="font-black text-white">
                        {item.horario ? `${item.horario} • ` : ""}
                        {item.titulo}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {item.tipo}
                      </p>
                    </div>
                  ))}

                  {itensHoje.length > 2 && (
                    <p className="text-xs font-black uppercase text-yellow-300">
                      +{itensHoje.length - 2} compromisso(s)
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-yellow-400/30 p-4 text-sm text-zinc-400">
                  Nenhum serviço ou compromisso marcado para hoje.
                </div>
              )}
            </div>

            <p className="text-xs font-black uppercase text-yellow-300">
              Clique para ver todos os detalhes
            </p>
          </div>
        </button>
      </div>

      {erro && (
        <div className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
          {erro}
        </div>
      )}

      {carregando && (
        <div className="mt-5 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm font-bold text-zinc-400">
          Atualizando informações do Dashboard...
        </div>
      )}

      {financeiroProximosVencimentos.quantidade > 0 && (
        <section className="mt-4 rounded-2xl border border-orange-400/50 bg-orange-400/10 p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-orange-300">
                💰 Próximos vencimentos
              </p>
              <p className="mt-2 break-words text-lg font-black leading-tight text-white">
                Você tem {financeiroProximosVencimentos.quantidade} compromisso(s)
                financeiro(s) vencido(s) ou com vencimento nos próximos 2 dias.
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Clique para abrir o Financeiro e conferir os lançamentos.
              </p>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <button
                type="button"
                onClick={() => alterarTela("financeiro")}
                className="min-w-0 rounded-xl border border-red-400/50 bg-black/40 p-4 text-left transition hover:border-red-400"
              >
                <p className="text-xs font-black uppercase text-red-300">
                  A pagar
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {financeiroProximosVencimentos.pagar.length}
                </p>
                <p className="mt-1 break-words text-sm font-bold text-red-300">
                  {formatarMoedaDashboard(
                    financeiroProximosVencimentos.totalPagar,
                  )}
                </p>
              </button>

              <button
                type="button"
                onClick={() => alterarTela("financeiro")}
                className="min-w-0 rounded-xl border border-emerald-400/50 bg-black/40 p-4 text-left transition hover:border-emerald-400"
              >
                <p className="text-xs font-black uppercase text-emerald-300">
                  A receber
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {financeiroProximosVencimentos.receber.length}
                </p>
                <p className="mt-1 break-words text-sm font-bold text-emerald-300">
                  {formatarMoedaDashboard(
                    financeiroProximosVencimentos.totalReceber,
                  )}
                </p>
              </button>
            </div>
          </div>
        </section>
      )}


      <div className="mt-5 grid min-w-0 gap-3 grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.titulo}
            type="button"
            onClick={() => setCategoriaAberta(card.categoria)}
            className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-black p-4 text-left transition hover:border-yellow-400/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="break-words text-sm font-bold uppercase leading-tight text-zinc-400">
                  {card.titulo}
                </p>

                <p className="mt-2 text-3xl font-black text-yellow-400">
                  {card.valor}
                </p>

                <p className="mt-1 hidden break-words text-xs leading-snug text-zinc-500 md:block">
                  {card.detalhe}
                </p>
                <p className="mt-1 text-[11px] font-black uppercase text-yellow-300">
                  Clique para abrir
                </p>
              </div>

              <span className="text-2xl">{card.icone}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl border border-yellow-400/30 bg-black p-4">
          <h3 className="text-xl font-black uppercase text-yellow-400">
            Resumo do funil
          </h3>

          <div className="mt-4 grid min-w-0 gap-3 grid-cols-3">
            <Resumo nome="Novo contato" valor={indicadores.novoContato} />
            <Resumo nome="Negociação" valor={indicadores.negociacao} />
            <Resumo nome="Pós-venda" valor={indicadores.posVenda} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <h3 className="text-xl font-black uppercase text-yellow-400">
            Acessos rápidos
          </h3>

          <div className="mt-4 grid min-w-0 gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
            <Atalho nome="Novo cliente" icone="👤" onClick={() => alterarTela("clientes")} />
            <Atalho nome="Abrir funil" icone="📊" onClick={() => alterarTela("funil")} />
            <Atalho nome="Nova proposta" icone="📄" onClick={() => alterarTela("propostas")} />
            <Atalho nome="Agenda" icone="📅" onClick={() => alterarTela("agenda")} />
            <Atalho nome="Novo recibo" icone="🧾" onClick={() => alterarTela("recibos")} />
          </div>
        </div>
      </div>

      {categoriaAberta && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto w-full max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-zinc-800 bg-black/95 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase text-yellow-400">Resumo</p>
                <h3 className="mt-1 text-2xl font-black uppercase text-white">
                  {tituloCategoria[categoriaAberta]}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCategoriaAberta(null)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black uppercase text-zinc-300"
              >
                Fechar
              </button>
            </header>

            <div className="p-4 md:p-5">
              {itensCategoria.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
                  Nenhum registro nesta categoria.
                </div>
              ) : (
                <div className="space-y-3">
                  {itensCategoria.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setItemSelecionado(item)}
                      className="w-full rounded-2xl border border-zinc-800 bg-black p-4 text-left transition hover:border-yellow-400/60"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-black uppercase text-white">
                            {item.titulo}
                          </p>
                          <p className="mt-1 text-sm font-bold text-yellow-300">
                            {item.tipo || "Não informado"}
                          </p>
                          {item.telefone && (
                            <p className="mt-1 text-sm text-zinc-400">
                              📞 {item.telefone}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          {item.horario && (
                            <p className="text-sm font-black text-white">{item.horario}</p>
                          )}
                          {item.subtitulo && (
                            <p className="mt-1 text-xs font-bold uppercase text-zinc-500">
                              {item.subtitulo}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] font-black uppercase text-yellow-300">
                            Ver detalhes
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {itemSelecionado && (
        <DetalhesItem
          item={itemSelecionado}
          aoFechar={() => setItemSelecionado(null)}
          aoAbrirModulo={() => {
            setItemSelecionado(null);
            setCategoriaAberta(null);
            alterarTela(itemSelecionado.tela);
          }}
          aoExcluir={
            itemSelecionado.origem === "servico" ||
            itemSelecionado.origem === "compromisso" ||
            itemSelecionado.origem === "treinamento"
              ? () => excluirItemSelecionado(itemSelecionado)
              : undefined
          }
        />
      )}
    </section>
  );
}

function DetalhesItem({
  item,
  aoFechar,
  aoAbrirModulo,
  aoExcluir,
}: {
  item: ItemPainel;
  aoFechar: () => void;
  aoAbrirModulo: () => void;
  aoExcluir?: () => Promise<boolean>;
}) {
  const dados = item.dados;

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-black/90 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-yellow-400/30 bg-zinc-950 shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 bg-black px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase text-yellow-400">{item.tipo}</p>
            <h3 className="mt-1 text-2xl font-black uppercase text-white">{item.titulo}</h3>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black uppercase text-zinc-300"
          >
            Fechar
          </button>
        </header>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {item.origem === "cliente" && (
            <>
              <Info titulo="Telefone / WhatsApp" valor={(dados as Cliente).telefone || "—"} />
              <Info titulo="Status" valor={(dados as Cliente).status} />
              <Info titulo="Tipo de serviço" valor={(dados as Cliente).tipoServico || "—"} />
              <Info titulo="Cidade" valor={(dados as Cliente).cidade || "—"} />
              <div className="sm:col-span-2">
                <Info
                  titulo="Endereço"
                  valor={(dados as Cliente).endereco || "—"}
                />
              </div>
              <div className="sm:col-span-2">
                <Info
                  titulo="Observações"
                  valor={(dados as Cliente).observacoes || "—"}
                />
              </div>
            </>
          )}

          {item.origem === "servico" && (
            <>
              <Info titulo="Telefone / WhatsApp" valor={(dados as ServicoDashboard).clienteTelefone || "—"} />
              <Info titulo="Status" valor={(dados as ServicoDashboard).status} />
              <Info titulo="Tipo de serviço" valor={(dados as ServicoDashboard).tipoServico || "—"} />
              <Info titulo="Data" valor={formatarData((dados as ServicoDashboard).data)} />
              <Info
                titulo="Horário"
                valor={`${(dados as ServicoDashboard).horario}${(dados as ServicoDashboard).horarioFim ? ` às ${(dados as ServicoDashboard).horarioFim}` : ""}`}
              />
              <Info titulo="Equipe" valor={(dados as ServicoDashboard).equipe || "—"} />
              <div className="sm:col-span-2">
                <Info
                  titulo="Endereço"
                  valor={`${(dados as ServicoDashboard).endereco || "—"}${(dados as ServicoDashboard).cidade ? `, ${(dados as ServicoDashboard).cidade}` : ""}`}
                />
              </div>
              <div className="sm:col-span-2">
                <Info titulo="Descrição" valor={(dados as ServicoDashboard).descricao || "—"} />
              </div>
            </>
          )}

          {item.origem === "compromisso" && (
            <>
              <Info titulo="Tipo" valor={(dados as CompromissoDashboard).tipo} />
              <Info titulo="Responsável" valor={(dados as CompromissoDashboard).responsavel || "—"} />
              <Info titulo="Data" valor={formatarData((dados as CompromissoDashboard).data)} />
              <Info
                titulo="Horário"
                valor={`${(dados as CompromissoDashboard).horario}${(dados as CompromissoDashboard).horarioFim ? ` às ${(dados as CompromissoDashboard).horarioFim}` : ""}`}
              />
              <Info titulo="Local" valor={(dados as CompromissoDashboard).local || "—"} />
              <div className="sm:col-span-2">
                <Info titulo="Descrição" valor={(dados as CompromissoDashboard).descricao || "—"} />
              </div>
            </>
          )}

          {item.origem === "treinamento" && (
            <>
              <Info titulo="Responsável" valor={(dados as TreinamentoDashboard).responsavel || "—"} />
              <Info titulo="Status" valor={(dados as TreinamentoDashboard).status || "—"} />
              <Info titulo="Data" valor={formatarData((dados as TreinamentoDashboard).data)} />
              <Info
                titulo="Horário"
                valor={`${(dados as TreinamentoDashboard).horario}${(dados as TreinamentoDashboard).horarioFim ? ` às ${(dados as TreinamentoDashboard).horarioFim}` : ""}`}
              />
              <Info titulo="Local" valor={(dados as TreinamentoDashboard).local || "—"} />
              <div className="sm:col-span-2">
                <Info
                  titulo="Participantes"
                  valor={(dados as TreinamentoDashboard).participantes.join(", ") || "—"}
                />
              </div>
            </>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-zinc-800 bg-black p-4 sm:flex-row sm:justify-end">
          {aoExcluir && (
            <button
              type="button"
              onClick={() => { void aoExcluir(); }}
              className="rounded-xl border border-red-500 px-5 py-3 font-black uppercase text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              Excluir
            </button>
          )}
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-black uppercase text-zinc-300"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={aoAbrirModulo}
            className="rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black"
          >
            Abrir módulo completo
          </button>
        </footer>
      </div>
    </div>
  );
}


function formatarMoedaDashboard(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4">
      <p className="text-xs font-black uppercase text-zinc-500">{titulo}</p>
      <p className="mt-1 break-words font-bold text-zinc-200">{valor || "—"}</p>
    </div>
  );
}

function Atalho({
  nome,
  icone,
  onClick,
}: {
  nome: string;
  icone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl border border-yellow-400/30 bg-zinc-950 px-3 py-3 text-[12px] font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black md:text-[13px]"
    >
      <span className="shrink-0 text-base">{icone}</span>
      <span className="min-w-0 whitespace-nowrap text-center leading-none">{nome}</span>
    </button>
  );
}

function Resumo({ nome, valor }: { nome: string; valor: number }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3">
      <span className="min-w-0 truncate text-sm font-bold text-zinc-300">{nome}</span>
      <span className="shrink-0 rounded-full bg-yellow-400 px-3 py-1 text-sm font-black text-black">
        {valor}
      </span>
    </div>
  );
}
