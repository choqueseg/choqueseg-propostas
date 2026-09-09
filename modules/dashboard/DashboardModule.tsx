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
  | "orcamento-rapido"
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
  | "funcionarios"
  | "estoque"
  | "vistorias"
  | "engenharia"
  | "treinamentos"
  | "contratos"
  | "sala-ia"
  | "projetos3d"
  | "avaliacoes"
  | "historico-propostas"
  | "convidar"
  | "senhas";

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

type DashboardCardId = Exclude<CategoriaPainel, "hoje">;

const ORDEM_PADRAO_CARDS: DashboardCardId[] = [
  "totalClientes",
  "retorno",
  "orcamentoSolicitado",
  "orcamentoEnviado",
  "servicoFechado",
  "agendado",
  "emExecucao",
  "concluido",
];

const CHAVE_LAYOUT_DASHBOARD = "choqueseg-dashboard-layout-v2";

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


type ModuloDashboard = {
  tela: TelaSistema;
  titulo: string;
  icone: string;
};

const MODULOS_DASHBOARD: ModuloDashboard[] = [
  { tela: "clientes", titulo: "Clientes", icone: "👥" },
  { tela: "funil", titulo: "Funil", icone: "🔷" },
  { tela: "orcamento-rapido", titulo: "Orçamentos Rápidos", icone: "📄" },
  { tela: "agenda", titulo: "Agenda", icone: "🗓️" },
  { tela: "vistorias", titulo: "Vistorias", icone: "🔎" },
  { tela: "engenharia", titulo: "Projetos / Engenharia", icone: "☀️" },
  { tela: "financeiro", titulo: "Financeiro", icone: "💰" },
  { tela: "estoque", titulo: "Estoque", icone: "📦" },
  { tela: "funcionarios", titulo: "Funcionários", icone: "👨‍👩‍👧‍👦" },
  { tela: "sala-ia", titulo: "Sala IA", icone: "🤖" },
  { tela: "propostas", titulo: "Propostas", icone: "📑" },
  { tela: "recibos", titulo: "Recibos", icone: "🧾" },
  { tela: "contratos", titulo: "Contratos", icone: "✍️" },
  { tela: "treinamentos", titulo: "Treinamentos", icone: "🎓" },
  { tela: "avaliacoes", titulo: "Avaliações", icone: "⭐" },
  { tela: "projetos3d", titulo: "Projeto 3D", icone: "🏠" },
  { tela: "historico-propostas", titulo: "Histórico de Propostas", icone: "📁" },
  { tela: "convidar", titulo: "Convidar", icone: "✉️" },
  { tela: "senhas", titulo: "Senhas", icone: "🔐" },
];

const MODULOS_DASHBOARD_PADRAO: TelaSistema[] = [
  "clientes",
  "funil",
  "orcamento-rapido",
  "agenda",
  "vistorias",
  "engenharia",
  "financeiro",
  "estoque",
  "funcionarios",
];

export default function DashboardModule({
  alterarTela,
  abrirOrcamentoRapido,
  tema = "escuro",
  usuarioNome = "usuario-local",
}: {
  alterarTela: (tela: TelaSistema) => void;
  abrirOrcamentoRapido?: (tipo: "seguranca-eletronica" | "eletrica" | "automacao") => void;
  tema?: "escuro" | "claro";
  usuarioNome?: string;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<ServicoDashboard[]>([]);
  const [compromissos, setCompromissos] = useState<CompromissoDashboard[]>([]);
  const [treinamentos, setTreinamentos] = useState<TreinamentoDashboard[]>([]);
  const [contagensExtras, setContagensExtras] = useState({
    propostas: 0,
    funcionarios: 0,
    convitesPendentes: 0,
    senhasTemporarias: 0,
    vistorias: 0,
    contratos: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [categoriaAberta, setCategoriaAberta] = useState<CategoriaPainel | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState<ItemPainel | null>(null);
  const [versaoFinanceiro, setVersaoFinanceiro] = useState(0);
  const [modoOrganizar, setModoOrganizar] = useState(false);
  const [ordemCards, setOrdemCards] = useState<DashboardCardId[]>(ORDEM_PADRAO_CARDS);
  const [cardsOcultos, setCardsOcultos] = useState<DashboardCardId[]>([]);
  const [chaveLayoutUsuario, setChaveLayoutUsuario] = useState<string>("");

  const [modulosTelaInicial, setModulosTelaInicial] =
    useState<TelaSistema[]>(MODULOS_DASHBOARD_PADRAO);

  const chaveModulosDashboard = `choqueseg-dashboard-modulos:${usuarioNome.trim() || "usuario-local"}`;

  useEffect(() => {
    function carregarModulos() {
      try {
        const salvo = localStorage.getItem(chaveModulosDashboard);
        if (!salvo) {
          setModulosTelaInicial(MODULOS_DASHBOARD_PADRAO);
          return;
        }
        const lista = JSON.parse(salvo);
        if (!Array.isArray(lista)) return;
        const validos = lista.filter((tela) =>
          MODULOS_DASHBOARD.some((modulo) => modulo.tela === tela),
        );
        setModulosTelaInicial(validos);
      } catch (e) {
        console.warn("Não foi possível carregar os módulos da tela inicial:", e);
      }
    }

    carregarModulos();

    const atualizar = () => carregarModulos();
    window.addEventListener("choqueseg-dashboard-modulos-atualizados", atualizar);
    window.addEventListener("storage", atualizar);

    return () => {
      window.removeEventListener("choqueseg-dashboard-modulos-atualizados", atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, [chaveModulosDashboard]);

  function salvarModulosTelaInicial(lista: TelaSistema[]) {
    setModulosTelaInicial(lista);
    try {
      localStorage.setItem(chaveModulosDashboard, JSON.stringify(lista));
      window.dispatchEvent(new CustomEvent("choqueseg-dashboard-modulos-atualizados"));
    } catch (e) {
      console.warn("Não foi possível salvar os módulos da tela inicial:", e);
    }
  }

  function moverModulo(tela: TelaSistema, deslocamento: number) {
    const indice = modulosTelaInicial.indexOf(tela);
    if (indice < 0) return;
    const destino = Math.max(
      0,
      Math.min(modulosTelaInicial.length - 1, indice + deslocamento),
    );
    if (destino === indice) return;

    const nova = [...modulosTelaInicial];
    const [movido] = nova.splice(indice, 1);
    nova.splice(destino, 0, movido);
    salvarModulosTelaInicial(nova);
  }

  function removerModulo(tela: TelaSistema) {
    salvarModulosTelaInicial(
      modulosTelaInicial.filter((item) => item !== tela),
    );
  }

  function adicionarModulo(tela: TelaSistema) {
    if (modulosTelaInicial.includes(tela)) return;
    salvarModulosTelaInicial([...modulosTelaInicial, tela]);
  }

  useEffect(() => {
    let ativo = true;

    async function prepararLayoutUsuario() {
      try {
        const { data } = await supabase.auth.getUser();
        const usuario = data.user?.id || "usuario-local";
        const chave = `${CHAVE_LAYOUT_DASHBOARD}:${usuario}`;
        if (!ativo) return;
        setChaveLayoutUsuario(chave);

        const salvo = localStorage.getItem(chave);
        if (!salvo) return;

        const parsed = JSON.parse(salvo) as {
          ordem?: DashboardCardId[];
          ocultos?: DashboardCardId[];
        };

        const ordemValida = (parsed.ordem || []).filter((id) =>
          ORDEM_PADRAO_CARDS.includes(id),
        );
        const faltantes = ORDEM_PADRAO_CARDS.filter((id) => !ordemValida.includes(id));
        setOrdemCards([...ordemValida, ...faltantes]);
        setCardsOcultos((parsed.ocultos || []).filter((id) => ORDEM_PADRAO_CARDS.includes(id)));
      } catch (e) {
        console.warn("Não foi possível carregar a organização do Dashboard:", e);
      }
    }

    void prepararLayoutUsuario();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!chaveLayoutUsuario) return;
    try {
      localStorage.setItem(
        chaveLayoutUsuario,
        JSON.stringify({ ordem: ordemCards, ocultos: cardsOcultos }),
      );
    } catch (e) {
      console.warn("Não foi possível salvar a organização do Dashboard:", e);
    }
  }, [chaveLayoutUsuario, ordemCards, cardsOcultos]);

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
            .update({ status: "Cliente Ainda Não Decidiu" })
            .in("id", ids);

          if (erroAtualizacao) throw erroAtualizacao;

          listaClientes = listaClientes.map((cliente) =>
            ids.includes(cliente.id)
              ? { ...cliente, status: "Cliente Ainda Não Decidiu" as StatusCliente }
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

  useEffect(() => {
    let ativo = true;

    async function carregarContagensExtras() {
      const [
        propostasResp,
        funcionariosResp,
        convitesResp,
        senhasResp,
        vistoriasResp,
        contratosResp,
      ] = await Promise.all([
        supabase.from("propostas").select("id", { count: "exact", head: true }),
        supabase.from("funcionarios").select("id", { count: "exact", head: true }),
        supabase
          .from("convites_usuarios")
          .select("id", { count: "exact", head: true })
          .eq("status", "Pendente"),
        supabase
          .from("funcionarios")
          .select("id", { count: "exact", head: true })
          .eq("senha_temporaria", true),
        supabase.from("vistorias").select("id", { count: "exact", head: true }),
        supabase.from("contratos").select("id", { count: "exact", head: true }),
      ]);

      if (!ativo) return;

      setContagensExtras({
        propostas: propostasResp.count ?? 0,
        funcionarios: funcionariosResp.count ?? 0,
        convitesPendentes: convitesResp.count ?? 0,
        senhasTemporarias: senhasResp.count ?? 0,
        vistorias: vistoriasResp.count ?? 0,
        contratos: contratosResp.count ?? 0,
      });
    }

    void carregarContagensExtras();

    const aoAtualizar = () => void carregarContagensExtras();
    window.addEventListener("focus", aoAtualizar);
    window.addEventListener("choqueseg-dashboard-contagens-atualizadas", aoAtualizar);

    return () => {
      ativo = false;
      window.removeEventListener("focus", aoAtualizar);
      window.removeEventListener("choqueseg-dashboard-contagens-atualizadas", aoAtualizar);
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

    const pagarAbertas = contasPagar.filter(
      (conta) => conta && conta.situacao !== "Pago",
    );
    const receberAbertas = contasReceber.filter(
      (conta) => conta && conta.situacao !== "Recebido",
    );

    return {
      pagar,
      receber,
      totalPagar,
      totalReceber,
      quantidade: pagar.length + receber.length,
      quantidadePagarAberta: pagarAbertas.length,
      quantidadeReceberAberta: receberAbertas.length,
      quantidadeAberta: pagarAbertas.length + receberAbertas.length,
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

  function metricasModulo(tela: TelaSistema): {
    valor: number | null;
    detalhe?: string;
  } {
    const projetosAtivos = clientes.filter((cliente) =>
      [
        "Etapa de Obra",
        "Projeto Aprovado",
        "Instalação Concluída",
        "Solicitar Vistoria",
        "Medidor Trocado",
      ].includes(String(cliente.status)),
    ).length;

    const orcamentosRapidos = clientes.filter((cliente) =>
      String(cliente.origem || "")
        .toLowerCase()
        .includes("orçamento"),
    ).length;

    switch (tela) {
      case "clientes":
        return { valor: indicadores.totalClientes, detalhe: "Cadastrados" };
      case "funil":
        return {
          valor: clientes.length,
          detalhe: `${indicadores.retorno} retorno(s) pendente(s)`,
        };
      case "orcamento-rapido":
        return { valor: orcamentosRapidos, detalhe: "Registrados no CRM" };
      case "agenda":
        return { valor: indicadores.agendado, detalhe: "Serviços agendados" };
      case "vistorias":
        return { valor: contagensExtras.vistorias, detalhe: "Vistorias registradas" };
      case "engenharia":
        return { valor: projetosAtivos, detalhe: "Projetos em andamento" };
      case "financeiro":
        return {
          valor: financeiroProximosVencimentos.quantidadeAberta,
          detalhe: `Pagar ${financeiroProximosVencimentos.quantidadePagarAberta} • Receber ${financeiroProximosVencimentos.quantidadeReceberAberta}`,
        };
      case "funcionarios":
        return { valor: contagensExtras.funcionarios, detalhe: "Usuários/funcionários" };
      case "propostas":
      case "historico-propostas":
        return { valor: contagensExtras.propostas, detalhe: "Propostas salvas" };
      case "contratos":
        return { valor: contagensExtras.contratos, detalhe: "Contratos registrados" };
      case "treinamentos":
        return { valor: treinamentos.length, detalhe: "Treinamentos" };
      case "convidar":
        return { valor: contagensExtras.convitesPendentes, detalhe: "Convites pendentes" };
      case "senhas":
        return { valor: contagensExtras.senhasTemporarias, detalhe: "Senhas temporárias" };
      default:
        return { valor: null };
    }
  }

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
      icone: "🟢👥",
    },
    {
      titulo: "Aguardando retorno",
      valor: indicadores.retorno,
      detalhe: "Retornos que precisam de ação",
      categoria: "retorno",
      icone: "🔴⏰",
    },
    {
      titulo: "Orçamentos solicitados",
      valor: indicadores.orcamentoSolicitado,
      detalhe: "Precisam de proposta",
      categoria: "orcamentoSolicitado",
      icone: "🟣📄",
    },
    {
      titulo: "Orçamentos enviados",
      valor: indicadores.orcamentoEnviado,
      detalhe: "Aguardando prazo de retorno",
      categoria: "orcamentoEnviado",
      icone: "🔵📤",
    },
    {
      titulo: "Serviços fechados",
      valor: indicadores.servicoFechado,
      detalhe: "Aguardando agendamento",
      categoria: "servicoFechado",
      icone: "🟡🤝",
    },
    {
      titulo: "Serviços agendados",
      valor: indicadores.agendado,
      detalhe: "Agenda da equipe",
      categoria: "agendado",
      icone: "🟣📅",
    },
    {
      titulo: "Em execução",
      valor: indicadores.emExecucao,
      detalhe: "Serviços em andamento",
      categoria: "emExecucao",
      icone: "🟠🚚",
    },
    {
      titulo: "Concluídos",
      valor: indicadores.concluido,
      detalhe: "Serviços finalizados",
      categoria: "concluido",
      icone: "🟢✅",
    },
  ];

  const cardsVisiveis = ordemCards
    .filter((id) => !cardsOcultos.includes(id))
    .map((id) => cards.find((card) => card.categoria === id))
    .filter(Boolean) as typeof cards;

  const cardsDisponiveisParaAdicionar = cards.filter((card) =>
    cardsOcultos.includes(card.categoria as DashboardCardId),
  );

  function moverCard(id: DashboardCardId, deslocamento: number) {
    setOrdemCards((atual) => {
      const visiveis = atual.filter((item) => !cardsOcultos.includes(item));
      const origemVisivel = visiveis.indexOf(id);
      if (origemVisivel < 0) return atual;

      const destinoVisivel = Math.max(0, Math.min(visiveis.length - 1, origemVisivel + deslocamento));
      if (destinoVisivel === origemVisivel) return atual;

      const novoVisiveis = [...visiveis];
      const [movido] = novoVisiveis.splice(origemVisivel, 1);
      novoVisiveis.splice(destinoVisivel, 0, movido);

      const ocultosNaOrdem = atual.filter((item) => cardsOcultos.includes(item));
      return [...novoVisiveis, ...ocultosNaOrdem];
    });
  }

  function removerCardDaTelaInicial(id: DashboardCardId) {
    setCardsOcultos((atual) => (atual.includes(id) ? atual : [...atual, id]));
  }

  function adicionarCardNaTelaInicial(id: DashboardCardId) {
    setCardsOcultos((atual) => atual.filter((item) => item !== id));
  }

  function restaurarLayoutPadrao() {
    setOrdemCards(ORDEM_PADRAO_CARDS);
    setCardsOcultos([]);
  }

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
    <section className={`min-h-screen p-3 md:p-6 ${tema === "claro" ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"}`}>
      <div className={`sticky top-0 z-40 -mx-3 border-b border-yellow-400/20 px-3 pb-3 pt-1 backdrop-blur md:-mx-6 md:px-6 ${tema === "claro" ? "bg-white/95" : "bg-zinc-950/95"}`}>
        {indicadores.retorno > 0 && (
          <button
            type="button"
            onClick={() => setCategoriaAberta("retorno")}
            className="tema-card mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-orange-400/60 bg-orange-400/10 p-3 text-left transition hover:border-orange-400"
          >
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-orange-400">
                🔔 Retornos de orçamento
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {indicadores.retorno} cliente(s) precisam de contato hoje.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Toque para ver os clientes e preparar a mensagem de follow-up.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-orange-400 px-3 py-1.5 text-lg font-black text-black">
              {indicadores.retorno}
            </span>
          </button>
        )}

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-yellow-400">
              CHOQUESEG PRO
            </p>
            <h2 className="truncate text-xl font-black uppercase md:text-2xl">Dashboard</h2>
          </div>

          <button
            type="button"
            onClick={() => setModoOrganizar((valor) => !valor)}
            className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-black uppercase transition ${
              modoOrganizar
                ? "border-yellow-400 bg-yellow-400 text-black"
                : "border-yellow-400/40 bg-black text-yellow-300 hover:border-yellow-400"
            }`}
          >
            {modoOrganizar ? "Concluir" : "Organizar"}
          </button>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2">
          <div className="min-w-0 overflow-hidden rounded-xl border border-yellow-400/30 bg-black/80 [&>div]:!p-2 [&>section]:!p-2 [&_p]:!hidden [&_h1]:!text-sm [&_h2]:!text-sm [&_h3]:!text-sm [&_button]:!min-h-0 [&_button]:!py-2 [&_button]:!px-2 [&_button]:!text-xs">
            <CentralVozGlobal alterarTela={alterarTela} />
          </div>

          <button
            type="button"
            onClick={() => setCategoriaAberta("hoje")}
            className="min-w-0 rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-2.5 text-left transition hover:border-yellow-400"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase leading-tight text-yellow-300 sm:text-xs">📅 Compromissos de hoje</p>
                <p className={`mt-1 line-clamp-2 text-[11px] font-black leading-tight sm:text-sm ${tema === "claro" ? "text-zinc-950" : "text-white"}`}>
                  {itensHoje.length === 0 ? "Nenhum compromisso para hoje." : resumoHoje}
                </p>
                <p className="mt-1 text-[10px] text-zinc-400 sm:text-xs">{formatarData(hoje)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-yellow-400 px-2.5 py-1 text-sm font-black text-black sm:text-base">
                {itensHoje.length}
              </span>
            </div>

            {itensHoje.length > 0 && (
              <div className="mt-1 hidden gap-1 sm:grid sm:grid-cols-2">
                {itensHoje.slice(0, 2).map((item) => (
                  <div key={`dashboard-hoje-${item.id}`} className="min-w-0 rounded-lg border border-yellow-400/15 bg-black/30 px-2 py-1.5">
                    <p className="truncate text-xs font-black text-white">
                      {item.horario ? `${item.horario} • ` : ""}{item.titulo}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="pt-4">
        {erro && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
            {erro}
          </div>
        )}

        {carregando && (
          <div className="mb-4 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm font-bold text-zinc-400">
            Atualizando informações do Dashboard...
          </div>
        )}

        {financeiroProximosVencimentos.quantidade > 0 && (
          <section className="mb-4 rounded-2xl border border-orange-400/50 bg-orange-400/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-orange-300">💰 Próximos vencimentos</p>
                <p className="mt-1 text-sm font-black leading-snug">
                  {financeiroProximosVencimentos.quantidade} compromisso(s) financeiro(s) exigem atenção.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alterarTela("financeiro")}
                className="shrink-0 rounded-lg bg-orange-400 px-3 py-2 text-xs font-black uppercase text-black"
              >
                Abrir
              </button>
            </div>
          </section>
        )}

        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-yellow-400">Painel inicial</p>
            <p className="text-xs text-zinc-500">
              Seus módulos favoritos — 3 por linha no celular
            </p>
          </div>

          {modoOrganizar && (
            <button
              type="button"
              onClick={() => salvarModulosTelaInicial(MODULOS_DASHBOARD_PADRAO)}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-[11px] font-black uppercase text-zinc-300"
            >
              Restaurar padrão
            </button>
          )}
        </div>

        <div className="grid min-w-0 grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-4">
          {modulosTelaInicial.map((tela) => {
            const modulo = MODULOS_DASHBOARD.find((item) => item.tela === tela);
            if (!modulo) return null;

            return (
              <div
                key={`modulo-dashboard-${modulo.tela}`}
                className={`tema-card relative min-w-0 overflow-hidden rounded-xl border bg-black p-2.5 transition md:p-4 ${
                  modoOrganizar
                    ? "border-yellow-400/60"
                    : "border-zinc-800 hover:border-yellow-400/70"
                }`}
              >
                {modoOrganizar && (
                  <button
                    type="button"
                    onClick={() => removerModulo(modulo.tela)}
                    className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-red-500/60 bg-black text-xs font-black text-red-400"
                    title="Remover somente da tela inicial"
                  >
                    ×
                  </button>
                )}

                <button
                  type="button"
                  disabled={modoOrganizar}
                  onClick={() => alterarTela(modulo.tela)}
                  className="w-full min-w-0 text-left disabled:cursor-default"
                >
                  <span className="text-2xl drop-shadow-sm md:text-3xl">
                    {modulo.icone}
                  </span>
                  <p className="tema-titulo mt-2 min-h-[2.3rem] break-words text-[10px] font-black uppercase leading-tight text-zinc-300 sm:text-[11px] md:text-sm">
                    {modulo.titulo}
                  </p>

                  {(() => {
                    const metrica = metricasModulo(modulo.tela);
                    return (
                      <>
                        {metrica.valor !== null && (
                          <p className="tema-valor mt-1 text-2xl font-black leading-none text-yellow-400 md:text-3xl">
                            {metrica.valor}
                          </p>
                        )}
                        {metrica.detalhe && (
                          <p className="mt-1 line-clamp-2 text-[9px] font-bold leading-tight text-zinc-500 sm:text-[10px]">
                            {metrica.detalhe}
                          </p>
                        )}
                      </>
                    );
                  })()}

                  <p className="mt-2 text-[10px] font-black uppercase text-yellow-400">
                    Abrir →
                  </p>
                </button>

                {modoOrganizar && (
                  <div className="mt-2 grid grid-cols-4 gap-1">
                    <button type="button" onClick={() => moverModulo(modulo.tela, -1)} className="rounded-md border border-zinc-700 py-1 text-xs">←</button>
                    <button type="button" onClick={() => moverModulo(modulo.tela, 1)} className="rounded-md border border-zinc-700 py-1 text-xs">→</button>
                    <button type="button" onClick={() => moverModulo(modulo.tela, -3)} className="rounded-md border border-zinc-700 py-1 text-xs">↑</button>
                    <button type="button" onClick={() => moverModulo(modulo.tela, 3)} className="rounded-md border border-zinc-700 py-1 text-xs">↓</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {modoOrganizar && (
          <div className="mt-4 rounded-2xl border border-dashed border-yellow-400/40 bg-yellow-400/5 p-3">
            <p className="text-xs font-black uppercase text-yellow-300">
              Adicionar à tela inicial
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MODULOS_DASHBOARD
                .filter((modulo) => !modulosTelaInicial.includes(modulo.tela))
                .map((modulo) => (
                  <button
                    key={`adicionar-modulo-${modulo.tela}`}
                    type="button"
                    onClick={() => adicionarModulo(modulo.tela)}
                    className="rounded-lg border border-yellow-400/30 bg-black px-3 py-2 text-xs font-black text-yellow-300"
                  >
                    + {modulo.icone} {modulo.titulo}
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="tema-card mt-4 rounded-2xl border border-yellow-400/30 bg-black p-3">
          <button
            type="button"
            onClick={() => alterarTela("funil")}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <h3 className="text-base font-black uppercase text-yellow-400 md:text-xl">Resumo do funil</h3>
            <span className="text-[11px] font-black uppercase text-yellow-300">Abrir funil →</span>
          </button>
          <div className="mt-3 grid min-w-0 grid-cols-3 gap-2">
            <Resumo
              nome="Novo contato"
              valor={indicadores.novoContato}
              onClick={() => alterarTela("funil")}
            />
            <Resumo
              nome="Negociação"
              valor={indicadores.negociacao}
              onClick={() => alterarTela("funil")}
            />
            <Resumo
              nome="Pós-venda"
              valor={indicadores.posVenda}
              onClick={() => alterarTela("funil")}
            />
          </div>
        </div>

        <div className="tema-card mt-4 rounded-2xl border border-yellow-400/30 bg-black p-3">
          <h3 className="text-base font-black uppercase text-yellow-400 md:text-xl">⚡ Orçamento rápido</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Atalho
              nome="Segurança"
              icone="📷"
              onClick={() =>
                abrirOrcamentoRapido
                  ? abrirOrcamentoRapido("seguranca-eletronica")
                  : alterarTela("orcamento-rapido")
              }
            />
            <Atalho
              nome="Elétrica"
              icone="🔌"
              onClick={() =>
                abrirOrcamentoRapido
                  ? abrirOrcamentoRapido("eletrica")
                  : alterarTela("orcamento-rapido")
              }
            />
            <Atalho
              nome="Automação"
              icone="🏠"
              onClick={() =>
                abrirOrcamentoRapido
                  ? abrirOrcamentoRapido("automacao")
                  : alterarTela("orcamento-rapido")
              }
            />
          </div>
        </div>

        <div className="tema-card mt-4 rounded-2xl border border-zinc-800 bg-black p-3">
          <h3 className="text-base font-black uppercase text-yellow-400 md:text-xl">Acessos rápidos</h3>
          <div className="mt-3 grid min-w-0 grid-cols-3 gap-2 md:grid-cols-5">
            <Atalho nome="Novo cliente" icone="👤" onClick={() => alterarTela("clientes")} />
            <Atalho nome="Abrir funil" icone="📊" onClick={() => alterarTela("funil")} />
            <Atalho nome="Proposta" icone="📄" onClick={() => alterarTela("propostas")} />
            <Atalho nome="Agenda" icone="📅" onClick={() => alterarTela("agenda")} />
            <Atalho nome="Recibo" icone="🧾" onClick={() => alterarTela("recibos")} />
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
      className="flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-yellow-400/30 bg-zinc-950 px-2 py-2 text-[10px] font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black sm:text-[11px] md:flex-row md:gap-2 md:px-3 md:py-3 md:text-[13px]"
    >
      <span className="shrink-0 text-base">{icone}</span>
      <span className="min-w-0 break-words text-center leading-tight">{nome}</span>
    </button>
  );
}

function Resumo({
  nome,
  valor,
  onClick,
}: {
  nome: string;
  valor: number;
  onClick?: () => void;
}) {
  const conteudo = (
    <>
      <span className="min-w-0 break-words text-[10px] font-bold leading-tight text-zinc-300 sm:text-xs md:text-sm">
        {nome}
      </span>
      <span className="shrink-0 rounded-full bg-yellow-400 px-3 py-1 text-sm font-black text-black">
        {valor}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-left transition hover:border-yellow-400/70 hover:bg-yellow-400/5"
        title={`Abrir Funil — ${nome}`}
      >
        {conteudo}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3">
      {conteudo}
    </div>
  );
}
