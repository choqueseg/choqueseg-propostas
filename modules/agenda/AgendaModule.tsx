"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import CardServico from "./CardServico";
import ModalServico from "./ModalServico";
import { Cliente, Funcionario, PerfilUsuario, Servico } from "./types";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const CHAVE_TREINAMENTOS_AGENDA = "choqueseg-pro-agenda-treinamentos";

function normalizarHorario(valor: string | null | undefined) {
  return String(valor ?? "").slice(0, 5);
}

export default function AgendaModule({
  perfil,
  usuarioNome,
  podeVerContatoCliente,
}: {
  perfil: PerfilUsuario;
  usuarioNome: string;
  podeVerContatoCliente: boolean;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [treinamentos, setTreinamentos] = useState<TreinamentoAgenda[]>([]);
  const [compromissos, setCompromissos] = useState<CompromissoAgenda[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [equipesSelecionadas, setEquipesSelecionadas] = useState<string[]>([]);
  const [descricao, setDescricao] = useState("");
  const [compromissoTipo, setCompromissoTipo] = useState<CompromissoAgenda["tipo"]>("Reunião");
  const [compromissoTitulo, setCompromissoTitulo] = useState("");
  const [compromissoData, setCompromissoData] = useState("");
  const [compromissoHorario, setCompromissoHorario] = useState("");
  const [compromissoHorarioFim, setCompromissoHorarioFim] = useState("");
  const [compromissoResponsavel, setCompromissoResponsavel] = useState(usuarioNome);
  const [compromissoLocal, setCompromissoLocal] = useState("");
  const [compromissoDescricao, setCompromissoDescricao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState<"servicos" | "agendar" | "compromisso">("servicos");
  const [visualizacao, setVisualizacao] = useState<"semana" | "mes" | "lista">("semana");
  const [mostrarDisponibilidade, setMostrarDisponibilidade] = useState(false);
  const [periodoDisponibilidade, setPeriodoDisponibilidade] = useState<"semana" | "mes">("semana");
  const [diaDisponibilidadeSelecionado, setDiaDisponibilidadeSelecionado] = useState<string | null>(null);
  const [filtroAgenda, setFiltroAgenda] = useState<
    "todos" | "servicos" | "treinamentos" | "reunioes" | "pessoal" | "outros"
  >("todos");
  const [ouvindoVoz, setOuvindoVoz] = useState(false);
  const [dataReferencia, setDataReferencia] = useState(() => dataLocalISO(new Date()));
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState<string | null>(null);
  const [treinamentoSelecionadoId, setTreinamentoSelecionadoId] = useState<string | null>(null);
  const [compromissoSelecionadoId, setCompromissoSelecionadoId] = useState<string | null>(null);
  const [notificacaoServico, setNotificacaoServico] = useState<{
    titulo: string;
    mensagem: string;
    servicoId?: string;
  } | null>(null);

  const ehAdministrador = perfil === "administrador";
  const [cargoUsuario, setCargoUsuario] = useState("");

  useEffect(() => {
    // Remove o cache antigo da Agenda que podia ultrapassar o limite do navegador
    // por conter fotos/assinaturas em base64. O Supabase continua sendo a fonte oficial.
    try {
      localStorage.removeItem("choqueseg-pro-agenda");
    } catch {
      // Falha ao limpar cache local não impede o funcionamento da Agenda.
    }
  }, []);

  const cargoNormalizado = cargoUsuario
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  const ehGerencia =
    cargoNormalizado.includes("gerente") ||
    cargoNormalizado.includes("gerencia") ||
    cargoNormalizado.includes("supervisor") ||
    cargoNormalizado.includes("diretoria");

  const podeVerContato =
    ehAdministrador || ehGerencia || podeVerContatoCliente;

  const agendaRestritaAoUsuario =
    perfil === "funcionario";

  useEffect(() => {
    let ativo = true;

    async function carregarCargoUsuario() {
      if (ehAdministrador) {
        setCargoUsuario("Administrador");
        return;
      }

      const { data, error } = await supabase
        .from("funcionarios")
        .select("cargo")
        .ilike("nome", usuarioNome)
        .maybeSingle();

      if (!ativo) return;

      if (error) {
        console.error("Erro ao verificar cargo do usuário:", error);
        setCargoUsuario("");
        return;
      }

      setCargoUsuario(String(data?.cargo ?? ""));
    }

    void carregarCargoUsuario();

    return () => {
      ativo = false;
    };
  }, [ehAdministrador, usuarioNome]);

  useEffect(() => {
    void carregarDados();
  }, [podeVerContato]);

  function usuarioEstaNaEquipe(equipe: string | null | undefined) {
    if (ehAdministrador) return false;

    const nomeAtual = usuarioNome.trim().toLowerCase();

    return String(equipe ?? "")
      .split(",")
      .map((nome) => nome.trim().toLowerCase())
      .filter(Boolean)
      .includes(nomeAtual);
  }

  function tocarSomNotificacao() {
    if (typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioContextClass) return;

      const contexto = new AudioContextClass();
      const oscilador = contexto.createOscillator();
      const ganho = contexto.createGain();

      oscilador.type = "sine";
      oscilador.frequency.setValueAtTime(880, contexto.currentTime);

      ganho.gain.setValueAtTime(0.0001, contexto.currentTime);
      ganho.gain.exponentialRampToValueAtTime(
        0.18,
        contexto.currentTime + 0.02,
      );
      ganho.gain.exponentialRampToValueAtTime(
        0.0001,
        contexto.currentTime + 0.45,
      );

      oscilador.connect(ganho);
      ganho.connect(contexto.destination);

      oscilador.start();
      oscilador.stop(contexto.currentTime + 0.45);

      oscilador.addEventListener("ended", () => {
        void contexto.close();
      });
    } catch (erro) {
      console.warn("Não foi possível tocar o som da notificação:", erro);
    }
  }

  function mostrarNotificacaoServico(
    tipo: "INSERT" | "UPDATE",
    registro: Record<string, unknown>,
  ) {
    const equipe = String(registro.equipe ?? "");
    const status = String(registro.status ?? "");
    const servicoId = String(registro.id ?? "");

    if (ehAdministrador) {
      // Para o administrador, a notificação operacional importante é a conclusão.
      if (tipo !== "UPDATE" || status !== "Concluído") return;
    } else {
      if (!usuarioEstaNaEquipe(equipe)) return;
    }

    const clienteNome = String(registro.cliente_nome ?? "Cliente");
    const tipoServico = String(registro.tipo_servico ?? "Serviço");
    const dataServico = String(registro.data ?? "");
    const horarioServico = String(registro.horario ?? "");
    const horarioFimServico = String(registro.horario_fim ?? "");

    const dataFormatada = dataServico
      ? dataServico.split("-").reverse().join("/")
      : "";

    const faixaHorario = horarioServico
      ? horarioFimServico
        ? `${horarioServico.slice(0, 5)} às ${horarioFimServico.slice(0, 5)}`
        : horarioServico.slice(0, 5)
      : "";

    const detalhesData = [dataFormatada, faixaHorario]
      .filter(Boolean)
      .join(" • ");

    const fotos = Array.isArray(registro.fotos) ? registro.fotos.length : 0;
    const materiais = Array.isArray(registro.materiais)
      ? registro.materiais.length
      : 0;

    const titulo = ehAdministrador
      ? "✅ SERVIÇO CONCLUÍDO"
      : tipo === "INSERT"
        ? "🔔 NOVO SERVIÇO AGENDADO"
        : "🔄 SERVIÇO ATUALIZADO";

    const complementoAdministrador = ehAdministrador
      ? ` • ${fotos} foto(s) • ${materiais} material(is)`
      : "";

    setNotificacaoServico({
      titulo,
      mensagem: `${clienteNome} • ${tipoServico}${
        detalhesData ? ` • ${detalhesData}` : ""
      }${complementoAdministrador}`,
      servicoId: servicoId || undefined,
    });

    tocarSomNotificacao();

    window.setTimeout(() => {
      setNotificacaoServico(null);
    }, 15000);
  }

  useEffect(() => {
    const canal = supabase
      .channel(`agenda-servicos-${usuarioNome}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "servicos",
        },
        (payload) => {
          mostrarNotificacaoServico(
            "INSERT",
            payload.new as Record<string, unknown>,
          );
          void carregarDados();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "servicos",
        },
        (payload) => {
          mostrarNotificacaoServico(
            "UPDATE",
            payload.new as Record<string, unknown>,
          );
          void carregarDados();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [ehAdministrador, usuarioNome]);

  useEffect(() => {
    // Mostra imediatamente o último estado conhecido enquanto a nuvem atualiza.
    try {
      const cache = localStorage.getItem(CHAVE_TREINAMENTOS_AGENDA);
      if (cache) {
        const listaCache = JSON.parse(cache) as TreinamentoAgenda[];
        if (Array.isArray(listaCache)) setTreinamentos(listaCache);
      }
    } catch {
      // Cache inválido não impede a consulta da nuvem.
    }

    // Carrega imediatamente e repete nos primeiros segundos.
    // Isso cobre o instante em que a sessão do Supabase ainda está sendo restaurada.
    void carregarTreinamentosAgenda();
    const retry1 = window.setTimeout(() => {
      void carregarTreinamentosAgenda();
    }, 800);
    const retry2 = window.setTimeout(() => {
      void carregarTreinamentosAgenda();
    }, 2200);

    const canalTreinamentos = supabase
      .channel(`agenda-treinamentos-${usuarioNome}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "treinamentos",
        },
        () => {
          void carregarTreinamentosAgenda();
        },
      )
      .subscribe();

    const recarregarAoVoltar = () => {
      if (document.visibilityState === "visible") {
        void carregarTreinamentosAgenda();
      }
    };

    window.addEventListener("focus", recarregarAoVoltar);
    document.addEventListener("visibilitychange", recarregarAoVoltar);

    // Segurança extra: atualiza automaticamente mesmo se o Realtime oscilar.
    const intervaloAtualizacao = window.setInterval(() => {
      void carregarTreinamentosAgenda();
    }, 20_000);

    return () => {
      void supabase.removeChannel(canalTreinamentos);
      window.removeEventListener("focus", recarregarAoVoltar);
      document.removeEventListener("visibilitychange", recarregarAoVoltar);
      window.clearTimeout(retry1);
      window.clearTimeout(retry2);
      window.clearInterval(intervaloAtualizacao);
    };
  }, [usuarioNome]);

  useEffect(() => {
    const canalCompromissos = supabase
      .channel(`agenda-compromissos-${usuarioNome}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agenda_compromissos" },
        () => { void carregarCompromissosAgenda(); },
      )
      .subscribe();

    return () => { void supabase.removeChannel(canalCompromissos); };
  }, [usuarioNome]);

  async function carregarTreinamentosAgenda() {
    const { data, error } = await supabase
      .from("treinamentos")
      .select("*")
      .order("data", { ascending: true })
      .order("horario", { ascending: true });

    if (error) {
      // Em falha temporária de rede/sessão, preserva os dados que já estavam na tela.
      // Não zera a agenda, evitando o "sumir" dos treinamentos.
      console.error("Erro ao carregar treinamentos na Agenda:", error);
      return false;
    }

    const lista: TreinamentoAgenda[] = (data ?? []).map((item) => ({
      id: String(item.id),
      tema: String(item.tema ?? ""),
      data: String(item.data ?? ""),
      horario: String(item.horario ?? ""),
      horarioFim: String(item.horario_fim ?? ""),
      responsavel: String(item.responsavel ?? ""),
      fornecedor: String(item.fornecedor ?? ""),
      local: String(item.local ?? ""),
      participantes: Array.isArray(item.participantes)
        ? item.participantes.map(String)
        : [],
      observacoes: String(item.observacoes ?? ""),
      status: String(item.status ?? "Agendado"),
    }));

    setTreinamentos(lista);

    if (typeof window !== "undefined") {
      localStorage.setItem(CHAVE_TREINAMENTOS_AGENDA, JSON.stringify(lista));
    }

    return true;
  }

  async function carregarCompromissosAgenda() {
    const { data, error } = await supabase
      .from("agenda_compromissos")
      .select("id,tipo,titulo,data,horario,horario_fim,responsavel,local,descricao,status,criado_por,criado_em,atualizado_em")
      .order("data", { ascending: true })
      .order("horario", { ascending: true });

    if (error) {
      console.error("Erro ao carregar compromissos da Agenda:", error);
      return false;
    }

    setCompromissos(
      (data ?? []).map((item: any) => ({
        id: String(item.id),
        tipo: String(item.tipo ?? "Outro") as CompromissoAgenda["tipo"],
        titulo: String(item.titulo ?? ""),
        data: String(item.data ?? ""),
        horario: String(item.horario ?? ""),
        horarioFim: String(item.horario_fim ?? ""),
        responsavel: String(item.responsavel ?? ""),
        local: String(item.local ?? ""),
        descricao: String(item.descricao ?? ""),
        status: String(item.status ?? "Agendado") as CompromissoAgenda["status"],
        criadoPor: String(item.criado_por ?? ""),
      })),
    );
    return true;
  }

  async function carregarDados() {
    setMensagem("");

    // O telefone não é solicitado ao Supabase quando o perfil não pode vê-lo.
    // Isso evita expor o contato na resposta de rede da Agenda.
    const camposClientes = podeVerContato
      ? "id,nome,telefone,cidade,endereco,tipo_servico"
      : "id,nome,cidade,endereco,tipo_servico";

    const camposServicosBase =
      "id,cliente_id,cliente_nome,tipo_servico,data,horario,horario_fim,endereco,cidade,equipe,descricao,status,checklist,materiais,fotos,vistoria_solar,observacoes_tecnico,assinatura_cliente,saida_empresa_em,chegada_cliente_em,iniciado_em,iniciado_por,concluido_em,concluido_por,quilometragem_inicial,quilometragem_final,despesas,historico,criado_em,atualizado_em";

    const camposServicos = podeVerContato
      ? `${camposServicosBase},cliente_telefone`
      : camposServicosBase;

    const [clientesResposta, funcionariosResposta, servicosResposta] =
      await Promise.all([
        supabase
          .from("clientes")
          .select(camposClientes)
          .order("nome", { ascending: true }),
        supabase
          .from("funcionarios")
          .select("id,nome,usuario,status")
          .order("nome", { ascending: true }),
        supabase
          .from("servicos")
          .select(camposServicos)
          .order("data", { ascending: true })
          .order("horario", { ascending: true }),
      ]);

    if (clientesResposta.error) {
      console.error("Erro ao carregar clientes:", clientesResposta.error);
      setMensagem(
        `Erro ao carregar clientes da nuvem: ${clientesResposta.error.message}`,
      );
    } else {
      setClientes(
        (clientesResposta.data ?? []).map((item: any) => ({
          id: item.id,
          nome: item.nome ?? "",
          telefone: podeVerContato ? String(item.telefone ?? "") : "",
          cidade: item.cidade ?? "",
          endereco: item.endereco ?? "",
          tipoServico: item.tipo_servico ?? "",
        })),
      );
    }

    if (funcionariosResposta.error) {
      console.error(
        "Erro ao carregar funcionários:",
        funcionariosResposta.error,
      );
      setMensagem(
        `Erro ao carregar funcionários da nuvem: ${funcionariosResposta.error.message}`,
      );
    } else {
      setFuncionarios(
        (funcionariosResposta.data ?? []).map((item: any) => ({
          id: item.id,
          nome: item.nome ?? "",
          usuario: item.usuario ?? "",
          nivelAcesso: "",
          status: (item.status ?? "Ativo") as Funcionario["status"],
        })),
      );
    }

    if (servicosResposta.error) {
      console.error("Erro ao carregar serviços:", servicosResposta.error);
      setMensagem(
        `Erro ao carregar serviços da nuvem: ${servicosResposta.error.message}`,
      );
      setServicos([]);
    } else {
      const listaNuvem: Servico[] = (servicosResposta.data ?? []).map(
        (item: any) => ({
          id: item.id,
          clienteId: item.cliente_id,
          clienteNome: item.cliente_nome ?? "",
          clienteTelefone: podeVerContato ? String(item.cliente_telefone ?? "") : "",
          tipoServico: item.tipo_servico ?? "",
          data: item.data ?? "",
          horario: item.horario ?? "",
          horarioFim: item.horario_fim ?? "",
          endereco: item.endereco ?? "",
          cidade: item.cidade ?? "",
          equipe: item.equipe ?? "",
          descricao: item.descricao ?? "",
          status: (item.status ?? "Agendado") as Servico["status"],
          checklist: item.checklist ?? [],
          materiais: item.materiais ?? [],
          fotos: item.fotos ?? [],
          vistoriaSolar: item.vistoria_solar ?? undefined,
          observacoesTecnico: item.observacoes_tecnico ?? "",
          assinaturaCliente: item.assinatura_cliente ?? "",
          saidaEmpresaEm: item.saida_empresa_em ?? undefined,
          chegadaClienteEm: item.chegada_cliente_em ?? undefined,
          iniciadoEm: item.iniciado_em ?? undefined,
          iniciadoPor: item.iniciado_por ?? undefined,
          concluidoEm: item.concluido_em ?? undefined,
          concluidoPor: item.concluido_por ?? undefined,
          quilometragemInicial:
            item.quilometragem_inicial === null
              ? undefined
              : Number(item.quilometragem_inicial),
          quilometragemFinal:
            item.quilometragem_final === null
              ? undefined
              : Number(item.quilometragem_final),
          despesas: item.despesas ?? undefined,
          historico: item.historico ?? [],
        }),
      );

      setServicos(listaNuvem);
    }

    await Promise.all([carregarTreinamentosAgenda(), carregarCompromissosAgenda()]);

  }

  function servicoParaBanco(servico: Servico) {
    return {
      id: servico.id,
      cliente_id: servico.clienteId,
      cliente_nome: servico.clienteNome,
      cliente_telefone: servico.clienteTelefone ?? "",
      tipo_servico: servico.tipoServico,
      data: servico.data,
      horario: servico.horario,
      horario_fim: servico.horarioFim || null,
      endereco: servico.endereco,
      cidade: servico.cidade,
      equipe: servico.equipe,
      descricao: servico.descricao,
      status: servico.status,
      checklist: servico.checklist ?? [],
      materiais: servico.materiais ?? [],
      fotos: servico.fotos ?? [],
      vistoria_solar: servico.vistoriaSolar ?? null,
      observacoes_tecnico: servico.observacoesTecnico ?? "",
      assinatura_cliente: servico.assinaturaCliente ?? "",
      saida_empresa_em: servico.saidaEmpresaEm ?? null,
      chegada_cliente_em: servico.chegadaClienteEm ?? null,
      iniciado_em: servico.iniciadoEm ?? null,
      iniciado_por: servico.iniciadoPor ?? null,
      concluido_em: servico.concluidoEm ?? null,
      concluido_por: servico.concluidoPor ?? null,
      quilometragem_inicial: servico.quilometragemInicial ?? null,
      quilometragem_final: servico.quilometragemFinal ?? null,
      despesas: servico.despesas ?? null,
      historico: servico.historico ?? [],
      atualizado_em: new Date().toISOString(),
    };
  }

  const servicosVisiveis = useMemo(() => {
    const nomeAtual = usuarioNome.trim().toLowerCase();

    return servicos
      .filter((servico) => {
        if (ehAdministrador) return true;

        return String(servico.equipe ?? "")
          .split(",")
          .map((nome) => nome.trim().toLowerCase())
          .filter(Boolean)
          .includes(nomeAtual);
      })
      .sort((a, b) =>
        `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`),
      );
  }, [servicos, ehAdministrador, usuarioNome]);

  const treinamentosVisiveis = useMemo(() => {
    const nomeAtual = usuarioNome.trim().toLowerCase();

    return treinamentos
      .filter((treinamento) => {
        if (!agendaRestritaAoUsuario) return true;
        return treinamento.participantes.some(
          (nome) => nome.trim().toLowerCase() === nomeAtual,
        );
      })
      .filter((treinamento) => treinamento.status !== "Cancelado")
      .sort((a, b) =>
        `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`),
      );
  }, [treinamentos, agendaRestritaAoUsuario, usuarioNome]);

  const compromissosVisiveis = useMemo(() => {
    const nomeAtual = usuarioNome.trim().toLowerCase();
    return compromissos
      .filter((compromisso) => {
        if (!agendaRestritaAoUsuario) return true;
        return compromisso.responsavel.trim().toLowerCase() === nomeAtual;
      })
      .sort((a, b) => `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`));
  }, [compromissos, agendaRestritaAoUsuario, usuarioNome]);

  const servicosExibidos = useMemo(
    () => (filtroAgenda === "todos" || filtroAgenda === "servicos" ? servicosVisiveis : []),
    [filtroAgenda, servicosVisiveis],
  );

  const treinamentosExibidos = useMemo(
    () => (filtroAgenda === "todos" || filtroAgenda === "treinamentos" ? treinamentosVisiveis : []),
    [filtroAgenda, treinamentosVisiveis],
  );

  const compromissosExibidos = useMemo(() => {
    if (filtroAgenda === "todos") return compromissosVisiveis;
    if (filtroAgenda === "reunioes") {
      return compromissosVisiveis.filter((item) => item.tipo === "Reunião");
    }
    if (filtroAgenda === "pessoal") {
      return compromissosVisiveis.filter((item) => item.tipo === "Compromisso pessoal");
    }
    if (filtroAgenda === "outros") {
      return compromissosVisiveis.filter((item) => item.tipo === "Outro");
    }
    return [];
  }, [filtroAgenda, compromissosVisiveis]);

  function eventosDetalhadosDoDia(dia: string) {
    const eventos: {
      id: string;
      categoria: "Serviço" | "Treinamento" | "Reunião" | "Compromisso pessoal" | "Outro";
      titulo: string;
      inicio: string;
      fim?: string;
      responsavel?: string;
      aoAbrir?: () => void;
    }[] = [];

    servicosVisiveis
      .filter((servico) => servico.data === dia && servico.status !== "Concluído")
      .forEach((servico) => {
        eventos.push({
          id: `servico-${servico.id}`,
          categoria: "Serviço",
          titulo: `${servico.clienteNome} — ${servico.tipoServico || "Serviço"}`,
          inicio: normalizarHorario(servico.horario),
          fim: normalizarHorario(servico.horarioFim),
          responsavel: servico.equipe,
          aoAbrir: () => setServicoSelecionadoId(servico.id),
        });
      });

    treinamentosVisiveis
      .filter((treinamento) => treinamento.data === dia && treinamento.status !== "Cancelado")
      .forEach((treinamento) => {
        eventos.push({
          id: `treinamento-${treinamento.id}`,
          categoria: "Treinamento",
          titulo: treinamento.tema || "Treinamento",
          inicio: normalizarHorario(treinamento.horario),
          fim: normalizarHorario(treinamento.horarioFim),
          responsavel: treinamento.responsavel,
          aoAbrir: () => setTreinamentoSelecionadoId(treinamento.id),
        });
      });

    compromissosVisiveis
      .filter((compromisso) => compromisso.data === dia)
      .forEach((compromisso) => {
        eventos.push({
          id: `compromisso-${compromisso.id}`,
          categoria: compromisso.tipo,
          titulo: compromisso.titulo,
          inicio: normalizarHorario(compromisso.horario),
          fim: normalizarHorario(compromisso.horarioFim),
          responsavel: compromisso.responsavel,
          aoAbrir: () => setCompromissoSelecionadoId(compromisso.id),
        });
      });

    return eventos.sort((a, b) => a.inicio.localeCompare(b.inicio));
  }

  function eventosAtivosDoDia(dia: string) {
    return eventosDetalhadosDoDia(dia).map((evento) => ({
      inicio: evento.inicio,
      fim: evento.fim,
    }));
  }

  function selecionarDiaDisponibilidade(dia: string) {
    setDiaDisponibilidadeSelecionado((atual) => (atual === dia ? null : dia));
  }

  function novoServicoNoDia(dia: string) {
    setData(dia);
    setHorario("");
    setHorarioFim("");
    setSecaoAtiva("agendar");
    setMensagem(`Data ${dia.split("-").reverse().join("/")} selecionada. Informe cliente e horário inicial/final.`);
  }

  function novoCompromissoNoDia(dia: string) {
    setCompromissoData(dia);
    setCompromissoHorario("");
    setCompromissoHorarioFim("");
    setSecaoAtiva("compromisso");
    setMensagem(`Data ${dia.split("-").reverse().join("/")} selecionada. Informe o compromisso e o horário inicial/final.`);
  }

  function periodoOcupado(
    eventos: { inicio: string; fim?: string }[],
    inicioPeriodo: string,
    fimPeriodo: string,
  ) {
    return eventos.some((evento) => {
      const inicio = normalizarHorario(evento.inicio);
      const fim = normalizarHorario(evento.fim);
      if (!inicio) return false;
      if (!fim) return inicio >= inicioPeriodo && inicio < fimPeriodo;
      return inicio < fimPeriodo && fim > inicioPeriodo;
    });
  }

  function disponibilidadeDoDia(dia: string) {
    const eventos = eventosAtivosDoDia(dia);
    const manhaOcupada = periodoOcupado(eventos, "08:00", "12:00");
    const tardeOcupada = periodoOcupado(eventos, "13:00", "18:00");

    if (!manhaOcupada && !tardeOcupada) {
      return { rotulo: "Livre", detalhe: "Manhã e tarde disponíveis", eventos: eventos.length };
    }
    if (!manhaOcupada && tardeOcupada) {
      return { rotulo: "Livre pela manhã", detalhe: "Há compromisso à tarde", eventos: eventos.length };
    }
    if (manhaOcupada && !tardeOcupada) {
      return { rotulo: "Livre à tarde", detalhe: "Há compromisso pela manhã", eventos: eventos.length };
    }
    return { rotulo: "Ocupado", detalhe: "Há compromissos pela manhã e à tarde", eventos: eventos.length };
  }

  function abrirDisponibilidade(periodo: "semana" | "mes") {
    setPeriodoDisponibilidade(periodo);
    setMostrarDisponibilidade(true);
  }

  function normalizarBusca(valor: string) {
    return valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function aplicarComandoVoz(transcricao: string) {
    const texto = transcricao.trim();
    const textoNormalizado = normalizarBusca(texto);

    const clienteEncontrado = [...clientes]
      .sort((a, b) => b.nome.length - a.nome.length)
      .find((cliente) => textoNormalizado.includes(normalizarBusca(cliente.nome)));

    const dataEncontrada = texto.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/);
    const horariosEncontrados = Array.from(
      texto.matchAll(/\b([01]?\d|2[0-3])(?::|h)([0-5]\d)\b/gi),
    );

    const tecnicoEncontrado = [...funcionarios]
      .filter((funcionario) => funcionario.status === "Ativo")
      .sort((a, b) => b.nome.length - a.nome.length)
      .find((funcionario) => textoNormalizado.includes(normalizarBusca(funcionario.nome)));

    const descricaoEncontrada =
      texto.match(/servi[cç]o(?:\s+de)?\s+(.+?)\s+agendad[oa]\s+para/i)?.[1]?.trim() ?? "";

    if (clienteEncontrado) setClienteId(clienteEncontrado.id);

    if (dataEncontrada) {
      const [, diaVoz, mesVoz, anoVoz] = dataEncontrada;
      setData(
        `${anoVoz}-${String(Number(mesVoz)).padStart(2, "0")}-${String(Number(diaVoz)).padStart(2, "0")}`,
      );
    }

    if (horariosEncontrados[0]) {
      setHorario(
        `${String(Number(horariosEncontrados[0][1])).padStart(2, "0")}:${horariosEncontrados[0][2]}`,
      );
    }
    if (horariosEncontrados[1]) {
      setHorarioFim(
        `${String(Number(horariosEncontrados[1][1])).padStart(2, "0")}:${horariosEncontrados[1][2]}`,
      );
    }

    if (tecnicoEncontrado) {
      setEquipesSelecionadas((atuais) =>
        atuais.includes(tecnicoEncontrado.nome)
          ? atuais
          : [...atuais, tecnicoEncontrado.nome],
      );
    }

    if (descricaoEncontrada) setDescricao(descricaoEncontrada);

    const faltando: string[] = [];
    if (!clienteEncontrado) faltando.push("cliente");
    if (!dataEncontrada) faltando.push("data");
    if (horariosEncontrados.length < 2) faltando.push("horário inicial e final");
    if (!tecnicoEncontrado) faltando.push("técnico");

    setSecaoAtiva("agendar");
    setMensagem(
      faltando.length === 0
        ? `Comando reconhecido: ${texto}. Confira os dados e clique em Agendar serviço.`
        : `Comando reconhecido parcialmente. Confira os dados. Faltou identificar: ${faltando.join(", ")}.`,
    );
  }

  function iniciarAgendamentoPorVoz() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMensagem(
        "O navegador atual não oferece reconhecimento de voz. Use o preenchimento manual ou tente pelo Chrome/Edge.",
      );
      return;
    }

    const reconhecimento = new SpeechRecognition();
    reconhecimento.lang = "pt-BR";
    reconhecimento.interimResults = false;
    reconhecimento.maxAlternatives = 1;

    reconhecimento.onstart = () => {
      setOuvindoVoz(true);
      setMensagem("Ouvindo... diga cliente, data, horário inicial, horário final e, se possível, o técnico.");
    };

    reconhecimento.onend = () => setOuvindoVoz(false);
    reconhecimento.onerror = () => {
      setOuvindoVoz(false);
      setMensagem("Não foi possível reconhecer o comando de voz. Tente novamente ou preencha manualmente.");
    };

    reconhecimento.onresult = (evento: any) => {
      const transcricao = String(evento?.results?.[0]?.[0]?.transcript ?? "");
      if (!transcricao) {
        setMensagem("Não consegui entender o comando de voz.");
        return;
      }
      aplicarComandoVoz(transcricao);
    };

    reconhecimento.start();
  }

  const inicioSemana = useMemo(
    () => inicioDaSemana(dataReferencia),
    [dataReferencia],
  );

  const diasSemana = useMemo(
    () => Array.from({ length: 7 }, (_, indice) => somarDias(inicioSemana, indice)),
    [inicioSemana],
  );

  const diasMes = useMemo(
    () => montarGradeMes(dataReferencia),
    [dataReferencia],
  );

  function navegarAgenda(direcao: -1 | 1) {
    setDataReferencia((atual) => {
      if (visualizacao === "semana") return somarDias(atual, direcao * 7);
      if (visualizacao === "mes") return somarMeses(atual, direcao);
      return somarDias(atual, direcao * 7);
    });
  }

  const servicoSelecionado = servicoSelecionadoId
    ? servicos.find((servico) => servico.id === servicoSelecionadoId) ?? null
    : null;

  const treinamentoSelecionado = treinamentoSelecionadoId
    ? treinamentos.find((treinamento) => treinamento.id === treinamentoSelecionadoId) ?? null
    : null;

  const compromissoSelecionado = compromissoSelecionadoId
    ? compromissos.find((compromisso) => compromisso.id === compromissoSelecionadoId) ?? null
    : null;

  async function sincronizarClienteComFunil(
    clienteId: string,
    status: "Serviço Agendado" | "Em Execução" | "Serviço Concluído",
  ) {
    if (!clienteId) return true;

    const { error } = await supabase
      .from("clientes")
      .update({
        status,
        retorno_em: null,
      })
      .eq("id", clienteId);

    if (error) {
      console.error("Erro ao sincronizar cliente com o Funil:", error);
      setMensagem(
        `A ordem foi salva, mas não foi possível atualizar o Funil: ${error.message}`,
      );
      return false;
    }

    return true;
  }

  function statusFunilDoServico(servico: Servico) {
    if (String(servico.status) === "Concluído") return "Serviço Concluído" as const;
    if (String(servico.status) === "Em execução") return "Em Execução" as const;
    if (["Agendado", "Confirmado", "Em deslocamento"].includes(String(servico.status))) {
      return "Serviço Agendado" as const;
    }

    return null;
  }

  function nomesEquipe(equipe: string | null | undefined) {
    return String(equipe ?? "")
      .split(",")
      .map((nome) => nome.trim())
      .filter(Boolean);
  }

  function mesmoTecnico(equipeServico: string, selecionados: string[]) {
    const existentes = nomesEquipe(equipeServico).map((nome) =>
      nome.toLocaleLowerCase("pt-BR"),
    );

    return selecionados.filter((nome) =>
      existentes.includes(nome.trim().toLocaleLowerCase("pt-BR")),
    );
  }

  function encontrarConflitosAgenda(
    dataNova: string,
    inicioNovo: string,
    fimNovo: string,
    ignorar?: { tipo: "servico" | "treinamento" | "compromisso"; id: string },
  ) {
    const inicio = normalizarHorario(inicioNovo);
    const fim = normalizarHorario(fimNovo);
    const sobrepoe = (inicioExistente: string, fimExistente?: string) => {
      const ini = normalizarHorario(inicioExistente);
      const fimEx = normalizarHorario(fimExistente);
      if (!fimEx) return ini === inicio;
      return inicio < fimEx && fim > ini;
    };

    const conflitos: ConflitoAgenda[] = [];

    servicos.forEach((servico) => {
      if (ignorar?.tipo === "servico" && ignorar.id === servico.id) return;
      if (servico.data !== dataNova || ["Concluído", "Cancelado"].includes(String(servico.status))) return;
      if (!sobrepoe(servico.horario, servico.horarioFim)) return;
      conflitos.push({
        tipo: "Serviço",
        titulo: `${servico.clienteNome} — ${servico.tipoServico || "Serviço"}`,
        horario: servico.horario,
        horarioFim: servico.horarioFim,
        responsavel: servico.equipe,
      });
    });

    treinamentos.forEach((treinamento) => {
      if (ignorar?.tipo === "treinamento" && ignorar.id === treinamento.id) return;
      if (treinamento.data !== dataNova || treinamento.status === "Cancelado") return;
      if (!sobrepoe(treinamento.horario, treinamento.horarioFim)) return;
      conflitos.push({
        tipo: "Treinamento",
        titulo: treinamento.tema,
        horario: treinamento.horario,
        horarioFim: treinamento.horarioFim,
        responsavel: treinamento.responsavel || treinamento.participantes.join(", "),
      });
    });

    compromissos.forEach((compromisso) => {
      if (ignorar?.tipo === "compromisso" && ignorar.id === compromisso.id) return;
      if (compromisso.data !== dataNova || compromisso.status === "Cancelado" || compromisso.status === "Concluído") return;
      if (!sobrepoe(compromisso.horario, compromisso.horarioFim)) return;
      conflitos.push({
        tipo: compromisso.tipo,
        titulo: compromisso.titulo,
        horario: compromisso.horario,
        horarioFim: compromisso.horarioFim,
        responsavel: compromisso.responsavel,
      });
    });

    return conflitos;
  }

  function confirmarConflitos(conflitos: ConflitoAgenda[], inicio: string, fim: string) {
    if (conflitos.length === 0) return true;
    const resumo = conflitos.slice(0, 5).map((conflito) => {
      const faixa = conflito.horarioFim
        ? `${normalizarHorario(conflito.horario)} às ${normalizarHorario(conflito.horarioFim)}`
        : `${normalizarHorario(conflito.horario)} (sem horário final)`;
      return `• ${conflito.tipo}: ${conflito.titulo} — ${faixa}${conflito.responsavel ? ` — ${conflito.responsavel}` : ""}`;
    }).join("\n");
    const extras = conflitos.length > 5 ? `\n• +${conflitos.length - 5} outro(s)` : "";
    return window.confirm(
      `ATENÇÃO: já existe compromisso nesse período.\n\n${resumo}${extras}\n\nNovo horário: ${normalizarHorario(inicio)} às ${normalizarHorario(fim)}.\n\nDeseja continuar mesmo assim?`,
    );
  }

  async function agendarServico(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const cliente = clientes.find((item) => item.id === clienteId);

    if (!cliente) {
      setMensagem("Selecione um cliente.");
      return;
    }

    if (!data || !horario || !horarioFim || equipesSelecionadas.length === 0) {
      setMensagem(
        "Preencha data, horário inicial, horário final e selecione pelo menos um técnico responsável.",
      );
      return;
    }

    if (normalizarHorario(horarioFim) <= normalizarHorario(horario)) {
      setMensagem("O horário final deve ser maior que o horário inicial.");
      return;
    }

    const conflitos = encontrarConflitosAgenda(data, horario, horarioFim);
    if (!confirmarConflitos(conflitos, horario, horarioFim)) {
      setMensagem("Agendamento cancelado porque existe conflito de horário.");
      return;
    }

    const novoServico: Servico = {
      id: crypto.randomUUID(),
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      clienteTelefone: cliente.telefone,
      tipoServico: cliente.tipoServico,
      data,
      horario,
      horarioFim,
      endereco: cliente.endereco,
      cidade: cliente.cidade,
      equipe: equipesSelecionadas.join(", "),
      descricao: descricao.trim(),
      status: "Agendado",
      historico: [
        {
          id: crypto.randomUUID(),
          dataHora: new Date().toISOString(),
          usuario: usuarioNome,
          descricao: "Serviço agendado",
        },
      ],
    };

    const { error } = await supabase
      .from("servicos")
      .insert({
        ...servicoParaBanco(novoServico),
        criado_em: new Date().toISOString(),
      });

    if (error) {
      console.error("Erro ao agendar serviço:", error);
      setMensagem(`Erro ao agendar serviço na nuvem: ${error.message}`);
      return;
    }

    await sincronizarClienteComFunil(cliente.id, "Serviço Agendado");

    setServicos((atuais) => [...atuais, novoServico]);
    setClienteId("");
    setData("");
    setHorario("");
    setHorarioFim("");
    setEquipesSelecionadas([]);
    setDescricao("");
    setMensagem("Serviço agendado e sincronizado com a nuvem.");
    setSecaoAtiva("servicos");
  }

  async function agendarCompromisso(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");
    if (!compromissoTitulo.trim() || !compromissoData || !compromissoHorario || !compromissoHorarioFim) {
      setMensagem("Preencha título, data, horário inicial e horário final do compromisso.");
      return;
    }
    if (normalizarHorario(compromissoHorarioFim) <= normalizarHorario(compromissoHorario)) {
      setMensagem("O horário final deve ser maior que o horário inicial.");
      return;
    }
    const conflitos = encontrarConflitosAgenda(compromissoData, compromissoHorario, compromissoHorarioFim);
    if (!confirmarConflitos(conflitos, compromissoHorario, compromissoHorarioFim)) {
      setMensagem("Compromisso não salvo porque existe conflito de horário.");
      return;
    }

    const novo: CompromissoAgenda = {
      id: crypto.randomUUID(), tipo: compromissoTipo, titulo: compromissoTitulo.trim(),
      data: compromissoData, horario: compromissoHorario, horarioFim: compromissoHorarioFim,
      responsavel: compromissoResponsavel.trim() || usuarioNome,
      local: compromissoLocal.trim(), descricao: compromissoDescricao.trim(), status: "Agendado", criadoPor: usuarioNome,
    };
    const { error } = await supabase.from("agenda_compromissos").insert({
      id: novo.id, tipo: novo.tipo, titulo: novo.titulo, data: novo.data,
      horario: novo.horario, horario_fim: novo.horarioFim,
      responsavel: novo.responsavel, local: novo.local, descricao: novo.descricao,
      status: novo.status, criado_por: usuarioNome, atualizado_em: new Date().toISOString(),
    });
    if (error) {
      console.error("Erro ao criar compromisso:", error);
      setMensagem(`Erro ao criar compromisso: ${error.message}`);
      return;
    }
    setCompromissos((atuais) => [...atuais, novo]);
    setCompromissoTitulo(""); setCompromissoData(""); setCompromissoHorario("");
    setCompromissoHorarioFim(""); setCompromissoLocal(""); setCompromissoDescricao("");
    setMensagem("Compromisso salvo na Agenda."); setSecaoAtiva("servicos");
  }

  async function salvarCompromisso(atualizado: CompromissoAgenda): Promise<boolean> {
    if (!atualizado.titulo.trim() || !atualizado.data || !atualizado.horario || !atualizado.horarioFim) {
      setMensagem("Preencha título, data, horário inicial e horário final."); return false;
    }
    if (normalizarHorario(atualizado.horarioFim) <= normalizarHorario(atualizado.horario)) {
      setMensagem("O horário final deve ser maior que o horário inicial."); return false;
    }
    const conflitos = encontrarConflitosAgenda(atualizado.data, atualizado.horario, atualizado.horarioFim, { tipo: "compromisso", id: atualizado.id });
    if (!confirmarConflitos(conflitos, atualizado.horario, atualizado.horarioFim)) return false;
    const { error } = await supabase.from("agenda_compromissos").update({
      tipo: atualizado.tipo, titulo: atualizado.titulo.trim(), data: atualizado.data,
      horario: atualizado.horario, horario_fim: atualizado.horarioFim,
      responsavel: atualizado.responsavel, local: atualizado.local,
      descricao: atualizado.descricao, status: atualizado.status, atualizado_em: new Date().toISOString(),
    }).eq("id", atualizado.id);
    if (error) { setMensagem(`Erro ao atualizar compromisso: ${error.message}`); return false; }
    setCompromissos((atuais) => atuais.map((item) => item.id === atualizado.id ? atualizado : item));
    setMensagem("Compromisso atualizado."); return true;
  }

  async function cancelarCompromisso(id: string): Promise<boolean> {
    if (!ehAdministrador) return false;
    const atual = compromissos.find((item) => item.id === id);
    if (!atual) return false;
    if (!window.confirm(`Marcar "${atual.titulo}" como CANCELADO/DESMARCADO?\n\nO compromisso continuará visível no histórico da Agenda.`)) return false;
    const { error } = await supabase.from("agenda_compromissos").update({
      status: "Cancelado", atualizado_em: new Date().toISOString(),
    }).eq("id", id);
    if (error) { setMensagem(`Erro ao cancelar compromisso: ${error.message}`); return false; }
    setCompromissos((atuais) => atuais.map((item) => item.id === id ? { ...item, status: "Cancelado" } : item));
    setMensagem("Compromisso marcado como cancelado e mantido no histórico.");
    return true;
  }

  async function excluirCompromisso(id: string): Promise<boolean> {
    if (!ehAdministrador) return false;
    if (!window.confirm("EXCLUIR DEFINITIVAMENTE este compromisso?\n\nUse esta opção somente para erro ou duplicidade. O registro não aparecerá mais no histórico.")) return false;
    const { error } = await supabase.from("agenda_compromissos").delete().eq("id", id);
    if (error) { setMensagem(`Erro ao excluir compromisso: ${error.message}`); return false; }
    setCompromissos((atuais) => atuais.filter((item) => item.id !== id));
    setCompromissoSelecionadoId(null); setMensagem("Compromisso excluído definitivamente da Agenda."); return true;
  }

  function normalizarNomeEstoque(valor: string) {
    return String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  async function vincularMateriaisAoEstoque(materiais: any[]) {
    if (!Array.isArray(materiais) || materiais.length === 0) {
      return materiais ?? [];
    }

    const { data, error } = await supabase
      .from("estoque_produtos")
      .select("id,nome,unidade,ativo")
      .eq("ativo", true);

    if (error) {
      console.error("Erro ao consultar estoque para vincular materiais:", error);
      return materiais;
    }

    const produtos = data ?? [];

    return materiais.map((material) => {
      if (material?.produtoId) return material;

      const descricao = normalizarNomeEstoque(material?.descricao ?? "");
      if (!descricao) return material;

      const exatos = produtos.filter(
        (produto) => normalizarNomeEstoque(produto.nome) === descricao,
      );

      if (exatos.length === 1) {
        return {
          ...material,
          produtoId: String(exatos[0].id),
          unidade: String(exatos[0].unidade ?? ""),
        };
      }

      const parciais = produtos.filter((produto) => {
        const nome = normalizarNomeEstoque(produto.nome);
        return nome.includes(descricao) || descricao.includes(nome);
      });

      if (parciais.length === 1) {
        return {
          ...material,
          produtoId: String(parciais[0].id),
          unidade: String(parciais[0].unidade ?? ""),
        };
      }

      return material;
    });
  }

  async function salvarServico(
    atualizado: Servico,
  ): Promise<boolean | string> {
    const anterior = servicos.find((servico) => servico.id === atualizado.id);

    const estaConcluindoAgora =
      atualizado.status === "Concluído" &&
      anterior?.status !== "Concluído";

    let atualizadoParaSalvar = atualizado;
    let avisoEstoque = "";

    if (estaConcluindoAgora) {
      const materiaisOriginais = Array.isArray(atualizado.materiais)
        ? atualizado.materiais
        : [];

      const materiaisVinculados = await vincularMateriaisAoEstoque(
        materiaisOriginais as any[],
      );

      atualizadoParaSalvar = {
        ...atualizado,
        materiais: materiaisVinculados,
      };

      if (materiaisVinculados.length > 0) {
        const { data: resultadoEstoque, error: erroEstoque } = await supabase.rpc(
          "baixar_estoque_servico",
          {
            p_servico_id: atualizado.id,
            p_cliente_nome: atualizado.clienteNome,
            p_usuario: usuarioNome,
            p_materiais: materiaisVinculados,
          },
        );

        if (erroEstoque) {
          console.error(
            "Erro ao baixar estoque da Ordem de Serviço:",
            erroEstoque,
          );

          avisoEstoque =
            `Serviço concluído, mas o estoque NÃO foi baixado: ${erroEstoque.message}`;
        } else {
          const baixados =
            resultadoEstoque &&
            typeof resultadoEstoque === "object" &&
            "baixados" in resultadoEstoque
              ? Number(
                  (resultadoEstoque as { baixados?: unknown }).baixados ?? 0,
                )
              : 0;

          const vinculados = materiaisVinculados.filter(
            (material: any) => Boolean(material?.produtoId),
          ).length;

          if (materiaisOriginais.length > 0 && vinculados === 0) {
            avisoEstoque =
              "Serviço concluído, mas nenhum material da OS estava vinculado a um produto do estoque.";
          } else if (
            materiaisOriginais.length > 0 &&
            vinculados > 0 &&
            baixados === 0
          ) {
            avisoEstoque =
              "Serviço concluído. Não houve nova baixa no estoque porque esta OS já pode ter sido processada anteriormente.";
          }
        }
      }
    }

    const { error } = await supabase
      .from("servicos")
      .update(servicoParaBanco(atualizadoParaSalvar))
      .eq("id", atualizadoParaSalvar.id);

    if (error) {
      console.error("Erro ao salvar serviço:", error);
      setMensagem(`Erro ao salvar serviço na nuvem: ${error.message}`);
      return false;
    }

    const statusFunil = statusFunilDoServico(atualizadoParaSalvar);
    if (statusFunil) {
      await sincronizarClienteComFunil(
        atualizadoParaSalvar.clienteId,
        statusFunil,
      );
    }

    setServicos((atuais) =>
      atuais.map((servico) =>
        servico.id === atualizadoParaSalvar.id
          ? atualizadoParaSalvar
          : servico,
      ),
    );

    if (estaConcluindoAgora) {
      if (avisoEstoque) {
        setMensagem(avisoEstoque);
        return avisoEstoque;
      }

      const sucesso =
        "Serviço concluído. Materiais vinculados foram baixados automaticamente do estoque.";
      setMensagem(sucesso);
      return sucesso;
    }

    return true;
  }

  async function alterarStatus(
    servicoId: string,
    novoStatus: Servico["status"],
  ) {
    if (!ehAdministrador) return;

    const atual = servicos.find((servico) => servico.id === servicoId);
    if (!atual) return;

    const atualizado: Servico = {
      ...atual,
      status: novoStatus,
      historico: [
        ...(atual.historico ?? []),
        {
          id: crypto.randomUUID(),
          dataHora: new Date().toISOString(),
          usuario: usuarioNome,
          descricao: `Status alterado para ${novoStatus}`,
        },
      ],
    };

    await salvarServico(atualizado);
  }

  async function atualizarFunilAposCancelarServico(servico: Servico) {
    if (!servico.clienteId) return true;

    const { data: outrosServicos, error: erroBusca } = await supabase
      .from("servicos")
      .select("id,status")
      .eq("cliente_id", servico.clienteId)
      .neq("id", servico.id);

    if (erroBusca) {
      console.error("Erro ao verificar outros agendamentos do cliente:", erroBusca);
      setMensagem(`Registro atualizado, mas não foi possível verificar o Funil: ${erroBusca.message}`);
      return false;
    }

    const existeOutroAtivo = (outrosServicos ?? []).some((item) =>
      ["Agendado", "Confirmado", "Em execução", "Em Execução", "Em deslocamento"].includes(String(item.status ?? "")),
    );

    if (!existeOutroAtivo) {
      const { error: erroFunil } = await supabase
        .from("clientes")
        .update({ status: "Serviço Fechado / Adiantamento Pago", retorno_em: null })
        .eq("id", servico.clienteId);

      if (erroFunil) {
        console.error("Erro ao devolver cliente no Funil:", erroFunil);
        setMensagem(`Agenda atualizada, mas o Funil não foi alterado: ${erroFunil.message}`);
        return false;
      }
    }
    return true;
  }

  async function cancelarServico(servicoId: string): Promise<boolean> {
    if (!ehAdministrador) return false;
    const servico = servicos.find((item) => item.id === servicoId);
    if (!servico) { setMensagem("Não foi possível localizar este agendamento."); return false; }

    const confirmar = window.confirm(
      `Cancelar/desmarcar o agendamento de ${servico.clienteNome}?\n\n` +
      "Ele continuará aparecendo na Agenda com status CANCELADO para preservar o histórico.",
    );
    if (!confirmar) return false;

    const historico = [
      ...(servico.historico ?? []),
      { id: crypto.randomUUID(), dataHora: new Date().toISOString(), usuario: usuarioNome, descricao: "Agendamento cancelado / desmarcado" },
    ];

    const { error } = await supabase.from("servicos").update({
      status: "Cancelado", historico, atualizado_em: new Date().toISOString(),
    }).eq("id", servicoId);
    if (error) { setMensagem(`Erro ao cancelar agendamento: ${error.message}`); return false; }

    setServicos((atuais) => atuais.map((item) => item.id === servicoId ? ({ ...item, status: "Cancelado" as Servico["status"], historico }) : item));
    await atualizarFunilAposCancelarServico(servico);
    setMensagem("Agendamento cancelado e mantido no histórico da Agenda.");
    return true;
  }

  async function excluirServico(servicoId: string): Promise<boolean> {
    if (!ehAdministrador) return false;

    const servico = servicos.find((item) => item.id === servicoId);
    if (!servico) return false;

    if (
      !window.confirm(
        `EXCLUIR DEFINITIVAMENTE o registro de ${servico.clienteNome}?\n\n` +
          "Use esta opção somente para erro ou duplicidade. O registro não aparecerá mais no histórico.",
      )
    ) {
      return false;
    }

    const { error } = await supabase.from("servicos").delete().eq("id", servicoId);

    if (error) {
      setMensagem(`Erro ao excluir serviço: ${error.message}`);
      return false;
    }

    setServicos((atuais) => atuais.filter((item) => item.id !== servicoId));
    setServicoSelecionadoId((atual) => (atual === servicoId ? null : atual));

    await atualizarFunilAposCancelarServico(servico);

    setMensagem("Registro excluído definitivamente da Agenda.");
    return true;
  }

  async function alterarStatusTreinamento(treinamentoId: string, novoStatus: string): Promise<boolean> {
    if (!ehAdministrador) return false;
    const { error } = await supabase.from("treinamentos").update({ status: novoStatus, atualizado_em: new Date().toISOString() }).eq("id", treinamentoId);
    if (error) { setMensagem(`Erro ao atualizar treinamento: ${error.message}`); return false; }
    setTreinamentos((atuais) => atuais.map((item) => item.id === treinamentoId ? { ...item, status: novoStatus } : item));
    setMensagem(`Treinamento marcado como ${novoStatus}.`);
    return true;
  }

  async function cancelarTreinamento(treinamentoId: string): Promise<boolean> {
    if (!window.confirm("Marcar este treinamento como CANCELADO?\n\nEle continuará visível no histórico da Agenda.")) return false;
    return alterarStatusTreinamento(treinamentoId, "Cancelado");
  }

  async function excluirTreinamento(treinamentoId: string): Promise<boolean> {
    if (!ehAdministrador) return false;

    const confirmar = window.confirm(
      "EXCLUIR DEFINITIVAMENTE este treinamento?\n\nUse somente para erro ou duplicidade. O registro não aparecerá mais no histórico.",
    );
    if (!confirmar) return false;

    const { error } = await supabase
      .from("treinamentos")
      .delete()
      .eq("id", treinamentoId);

    if (error) {
      console.error("Erro ao excluir treinamento:", error);
      setMensagem(`Erro ao excluir treinamento da nuvem: ${error.message}`);
      return false;
    }

    setTreinamentos((atuais) => {
      const novaLista = atuais.filter((treinamento) => treinamento.id !== treinamentoId);
      if (typeof window !== "undefined") {
        localStorage.setItem(CHAVE_TREINAMENTOS_AGENDA, JSON.stringify(novaLista));
      }
      return novaLista;
    });
    setTreinamentoSelecionadoId(null);
    setMensagem("Treinamento excluído definitivamente da Agenda e da nuvem.");
    return true;
  }

  function abrirMaps(endereco: string, cidade?: string) {
    const destino = encodeURIComponent(
      [endereco, cidade].filter(Boolean).join(", "),
    );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${destino}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <section className="p-2 sm:p-4 md:p-5">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          Operação CHOQUESEG
        </p>
        <h2 className="mt-1 text-3xl font-black uppercase">
          Agenda de serviços
        </h2>
        <p className="mt-2 text-zinc-400">
          {ehAdministrador
            ? "Escolha no menu se deseja consultar os serviços ou criar um novo agendamento."
            : "Consulte e execute os serviços da equipe CHOQUESEG."}
        </p>
      </div>

      {notificacaoServico && (
        <div className="mt-5 rounded-2xl border border-yellow-400 bg-yellow-400 px-4 py-4 text-black shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-black uppercase">
                {notificacaoServico.titulo}
              </p>
              <p className="mt-1 text-sm font-bold">
                {notificacaoServico.mensagem}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {notificacaoServico.servicoId && (
                <button
                  type="button"
                  onClick={() => {
                    setServicoSelecionadoId(notificacaoServico.servicoId ?? null);
                    setNotificacaoServico(null);
                  }}
                  className="rounded-lg bg-black px-3 py-1 text-xs font-black uppercase text-yellow-300"
                >
                  Abrir ordem
                </button>
              )}

              <button
                type="button"
                onClick={() => setNotificacaoServico(null)}
                className="rounded-lg border border-black/30 px-3 py-1 text-xs font-black uppercase"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="lg:sticky lg:top-4 lg:w-44 lg:shrink-0 xl:w-48">
          <div className="rounded-2xl border border-zinc-800 bg-black p-2">
            <p className="px-3 py-2 text-xs font-black uppercase text-zinc-500">
              Menu da agenda
            </p>

            <nav className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setSecaoAtiva("servicos")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
                  secaoAtiva === "servicos"
                    ? "bg-yellow-400 text-black"
                    : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
                }`}
              >
                <span className="text-lg">📅</span>
                <span>{ehAdministrador ? "Serviços agendados" : "Minha agenda"}</span>
              </button>

              {ehAdministrador && (
                <button
                  type="button"
                  onClick={() => setSecaoAtiva("agendar")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
                    secaoAtiva === "agendar"
                      ? "bg-yellow-400 text-black"
                      : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
                  }`}
                >
                  <span className="text-lg">➕</span>
                  <span>Novo agendamento</span>
                </button>
              )}

              {ehAdministrador && (
                <button
                  type="button"
                  onClick={() => setSecaoAtiva("compromisso")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
                    secaoAtiva === "compromisso"
                      ? "bg-yellow-400 text-black"
                      : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
                  }`}
                >
                  <span className="text-lg">🗓️</span>
                  <span>Novo compromisso</span>
                </button>
              )}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {secaoAtiva === "agendar" && ehAdministrador && data && (
            <div className="mb-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase text-yellow-300">Horários já ocupados</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {data.split("-").reverse().join("/")} — confira antes de escolher o novo horário.
                  </p>
                </div>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-black text-zinc-300">
                  {eventosDetalhadosDoDia(data).length} compromisso(s)
                </span>
              </div>

              {eventosDetalhadosDoDia(data).length === 0 ? (
                <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-300">
                  Dia livre nos períodos já cadastrados.
                </p>
              ) : (
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {eventosDetalhadosDoDia(data).map((evento) => (
                    <div key={`ocupado-agendar-${evento.id}`} className="rounded-xl border border-zinc-800 bg-black px-3 py-2">
                      <p className="text-xs font-black uppercase text-zinc-500">{evento.categoria}</p>
                      <p className="mt-1 text-sm font-black text-white">
                        {evento.inicio}{evento.fim ? ` às ${evento.fim}` : ""}
                      </p>
                      <p className="mt-1 truncate text-xs text-zinc-400">{evento.titulo}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {secaoAtiva === "agendar" && ehAdministrador && (
            <form
  onSubmit={agendarServico}
  className="mt-7 rounded-3xl border border-yellow-400/30 bg-black p-5"
>
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h3 className="text-xl font-black uppercase text-yellow-400">
        Novo agendamento
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        Preencha manualmente ou use o comando de voz para agilizar o cadastro.
      </p>
    </div>

    <button
      type="button"
      onClick={iniciarAgendamentoPorVoz}
      disabled={ouvindoVoz}
      className="rounded-xl border border-yellow-400 px-4 py-3 text-sm font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
    >
      {ouvindoVoz ? "🎙️ Ouvindo..." : "🎙️ Agendar por voz"}
    </button>
  </div>

  <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-400">
    Exemplo: “Cliente Pedro, serviço de cerca elétrica agendado para 09/08/2026, das 08:00 às 12:00, técnico João”.
  </div>

  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
    <div className="xl:col-span-3">
      <label className="mb-2 block text-xs font-bold uppercase text-zinc-400">
        Cliente
      </label>
      <select
        value={clienteId}
        onChange={(evento) => setClienteId(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        <option value="">Selecione um cliente</option>
        {clientes.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.nome}
          </option>
        ))}
      </select>
    </div>

    <div className="xl:col-span-3">
      <Campo label="Data" tipo="date" valor={data} onChange={setData} />
    </div>
    <div className="xl:col-span-3">
      <Campo
        label="Horário inicial"
        tipo="time"
        valor={horario}
        onChange={setHorario}
      />
    </div>
    <div className="xl:col-span-3">
      <Campo
        label="Horário final"
        tipo="time"
        valor={horarioFim}
        onChange={setHorarioFim}
      />
    </div>

    <div className="xl:col-span-12">
      <label className="mb-2 block text-xs font-bold uppercase text-zinc-400">
        Técnicos responsáveis
      </label>

      <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3">
        <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
          {funcionarios
            .filter((funcionario) => funcionario.status === "Ativo")
            .map((funcionario) => {
              const marcado = equipesSelecionadas.includes(funcionario.nome);

              return (
                <label
                  key={funcionario.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${
                    marcado
                      ? "border-yellow-400 bg-yellow-400/10"
                      : "border-zinc-800 bg-black"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={(evento) => {
                      setEquipesSelecionadas((atuais) =>
                        evento.target.checked
                          ? [...atuais, funcionario.nome]
                          : atuais.filter((nome) => nome !== funcionario.nome),
                      );
                    }}
                    className="h-5 w-5 accent-yellow-400"
                  />
                  <span className="font-bold text-white">{funcionario.nome}</span>
                </label>
              );
            })}
        </div>

        <div className="mt-3 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-400">
          {equipesSelecionadas.length === 0
            ? "Nenhum técnico selecionado"
            : `Selecionados: ${equipesSelecionadas.join(", ")}`}
        </div>
      </div>
    </div>

    <div className="md:col-span-2 xl:col-span-12">
      <Campo
        label="Descrição"
        valor={descricao}
        placeholder="Ex.: instalação de 4 câmeras"
        onChange={setDescricao}
      />
    </div>
  </div>

  <button
    type="submit"
    className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
  >
    Agendar serviço
  </button>
</form>
          )}

          {secaoAtiva === "compromisso" && ehAdministrador && (
            <form onSubmit={agendarCompromisso} className="mt-7 rounded-3xl border border-yellow-400/30 bg-black p-5">
              <h3 className="text-xl font-black uppercase text-yellow-400">Novo compromisso</h3>
              <p className="mt-2 text-sm text-zinc-400">Reunião, compromisso pessoal ou outro bloqueio de agenda.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
                <div className="xl:col-span-2"><label className="mb-2 block text-xs font-bold uppercase text-zinc-400">Tipo</label><select value={compromissoTipo} onChange={(e) => setCompromissoTipo(e.target.value as CompromissoAgenda["tipo"])} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"><option>Reunião</option><option>Compromisso pessoal</option><option>Outro</option></select></div>
                <div className="xl:col-span-3"><Campo label="Título" valor={compromissoTitulo} placeholder="Ex.: Reunião com fornecedor" onChange={setCompromissoTitulo} /></div>
                <div className="xl:col-span-3"><Campo label="Data" tipo="date" valor={compromissoData} onChange={setCompromissoData} /></div>
                <div className="xl:col-span-2"><Campo label="Horário inicial" tipo="time" valor={compromissoHorario} onChange={setCompromissoHorario} /></div>
                <div className="xl:col-span-2"><Campo label="Horário final" tipo="time" valor={compromissoHorarioFim} onChange={setCompromissoHorarioFim} /></div>
                <div className="xl:col-span-3"><Campo label="Responsável" valor={compromissoResponsavel} onChange={setCompromissoResponsavel} /></div>
                <div className="xl:col-span-3"><Campo label="Local" valor={compromissoLocal} placeholder="Opcional" onChange={setCompromissoLocal} /></div>
                <div className="xl:col-span-6"><Campo label="Descrição" valor={compromissoDescricao} placeholder="Opcional" onChange={setCompromissoDescricao} /></div>
              </div>
              <button type="submit" className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black">Salvar compromisso</button>
            </form>
          )}

          {secaoAtiva === "servicos" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-black p-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <BotaoVisualizacao
                      ativo={visualizacao === "semana"}
                      onClick={() => setVisualizacao("semana")}
                    >
                      Semana
                    </BotaoVisualizacao>
                    <BotaoVisualizacao
                      ativo={visualizacao === "mes"}
                      onClick={() => setVisualizacao("mes")}
                    >
                      Mês
                    </BotaoVisualizacao>
                    <BotaoVisualizacao
                      ativo={visualizacao === "lista"}
                      onClick={() => setVisualizacao("lista")}
                    >
                      Lista
                    </BotaoVisualizacao>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={filtroAgenda}
                      onChange={(evento) =>
                        setFiltroAgenda(
                          evento.target.value as
                            | "todos"
                            | "servicos"
                            | "treinamentos"
                            | "reunioes"
                            | "pessoal"
                            | "outros",
                        )
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-yellow-400"
                      title="Filtrar eventos da Agenda"
                    >
                      <option value="todos">Todos os eventos</option>
                      <option value="servicos">Serviços</option>
                      <option value="treinamentos">Treinamentos</option>
                      <option value="reunioes">Reuniões</option>
                      <option value="pessoal">Compromissos pessoais</option>
                      <option value="outros">Outros</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => abrirDisponibilidade("semana")}
                      className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm font-black uppercase text-emerald-300 transition hover:border-emerald-400"
                    >
                      Como está minha semana?
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirDisponibilidade("mes")}
                      className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm font-black uppercase text-emerald-300 transition hover:border-emerald-400"
                    >
                      Como está meu mês?
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navegarAgenda(-1)}
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 font-black text-white transition hover:border-yellow-400 hover:text-yellow-400"
                    >
                      ←
                    </button>

                    <button
                      type="button"
                      onClick={() => setDataReferencia(dataLocalISO(new Date()))}
                      className="rounded-xl border border-yellow-400/50 bg-yellow-400/10 px-4 py-2 text-sm font-black uppercase text-yellow-400"
                    >
                      Hoje
                    </button>

                    <button
                      type="button"
                      onClick={() => navegarAgenda(1)}
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 font-black text-white transition hover:border-yellow-400 hover:text-yellow-400"
                    >
                      →
                    </button>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-black uppercase text-zinc-300">
                      {visualizacao === "mes"
                        ? tituloMes(dataReferencia)
                        : tituloSemana(inicioSemana)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-yellow-300">
                  Serviço
                </span>
                <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-blue-300">
                  Treinamento
                </span>
                <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-violet-300">
                  Reunião
                </span>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                  Compromisso pessoal
                </span>
                <span className="rounded-full border border-zinc-600 bg-zinc-900 px-3 py-1 text-zinc-300">
                  Outro
                </span>
              </div>

              {mostrarDisponibilidade && (
                <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-emerald-300">Disponibilidade</p>
                      <h3 className="mt-1 text-xl font-black uppercase text-white">
                        {periodoDisponibilidade === "semana"
                          ? `Semana ${tituloSemana(inicioSemana)}`
                          : tituloMes(dataReferencia)}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Referência operacional: manhã 08:00–12:00 e tarde 13:00–18:00.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMostrarDisponibilidade(false)}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black uppercase text-zinc-300"
                    >
                      Fechar
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {(periodoDisponibilidade === "semana"
                      ? diasSemana
                      : diasMes.filter((dia) => mesmoMes(dia, dataReferencia))
                    ).map((dia) => {
                      const disponibilidade = disponibilidadeDoDia(dia);
                      const eventosDia = eventosDetalhadosDoDia(dia);
                      const primeiroEvento = eventosDia[0];
                      const diaAberto = diaDisponibilidadeSelecionado === dia;
                      return (
                        <div
                          key={`disp-${dia}`}
                          className={`rounded-xl border bg-black p-3 transition ${
                            diaAberto ? "border-yellow-400" : "border-zinc-800 hover:border-yellow-400/50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => selecionarDiaDisponibilidade(dia)}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-black uppercase text-zinc-500">
                                  {nomeDiaSemana(dia)}
                                </p>
                                <p className="mt-1 font-black text-white">
                                  {dia.split("-").reverse().join("/")}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${
                                  disponibilidade.rotulo === "Livre"
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : disponibilidade.rotulo.includes("Livre")
                                      ? "bg-yellow-400/10 text-yellow-300"
                                      : "bg-red-500/10 text-red-300"
                                }`}
                              >
                                {disponibilidade.rotulo}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-zinc-400">
                              {disponibilidade.detalhe}
                            </p>

                            {primeiroEvento && (
                              <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                                <p className="truncate text-xs font-black text-white">
                                  {primeiroEvento.inicio}
                                  {primeiroEvento.fim ? `–${primeiroEvento.fim}` : ""} • {primeiroEvento.titulo}
                                </p>
                                {eventosDia.length > 1 && (
                                  <p className="mt-1 text-[11px] font-bold text-yellow-300">
                                    +{eventosDia.length - 1} compromisso(s)
                                  </p>
                                )}
                              </div>
                            )}

                            <p className="mt-2 text-xs font-bold text-zinc-500">
                              {disponibilidade.eventos} compromisso(s) no dia • Clique para abrir
                            </p>
                          </button>

                          {diaAberto && (
                            <div className="mt-3 border-t border-zinc-800 pt-3">
                              <p className="text-xs font-black uppercase text-yellow-300">
                                Agenda do dia
                              </p>

                              {eventosDia.length === 0 ? (
                                <p className="mt-2 text-xs text-zinc-400">Nenhum compromisso neste dia.</p>
                              ) : (
                                <div className="mt-2 space-y-2">
                                  {eventosDia.map((evento) => (
                                    <button
                                      key={evento.id}
                                      type="button"
                                      onClick={evento.aoAbrir}
                                      className="min-w-0 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-left transition hover:border-yellow-400/50"
                                    >
                                      <p className="text-[11px] font-black uppercase text-zinc-500">
                                        {evento.categoria}
                                      </p>
                                      <p className="mt-1 break-words text-sm font-black leading-tight text-white">{evento.titulo}</p>
                                      <p className="mt-1 break-words text-xs leading-tight text-zinc-400">
                                        {evento.inicio}{evento.fim ? ` às ${evento.fim}` : ""}
                                        {evento.responsavel ? ` • ${evento.responsavel}` : ""}
                                      </p>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {ehAdministrador && (
                                <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() => novoServicoNoDia(dia)}
                                    className="min-w-0 rounded-lg bg-yellow-400 px-2 py-2 text-[10px] font-black uppercase leading-tight text-black whitespace-normal break-words sm:text-xs"
                                  >
                                    + Serviço neste dia
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => novoCompromissoNoDia(dia)}
                                    className="min-w-0 rounded-lg border border-yellow-400 px-2 py-2 text-[10px] font-black uppercase leading-tight text-yellow-300 whitespace-normal break-words sm:text-xs"
                                  >
                                    + Compromisso neste dia
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {servicosExibidos.length === 0 && treinamentosExibidos.length === 0 && compromissosExibidos.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-700 bg-black p-10 text-center">
                  <p className="text-5xl">📅</p>
                  <p className="mt-4 font-black uppercase">
                    Nenhum evento agendado
                  </p>
                </div>
              ) : visualizacao === "lista" ? (
                <div className="space-y-3">
                  {[
                    ...servicosExibidos.map((servico) => ({
                      tipo: "servico" as const,
                      data: servico.data,
                      horario: servico.horario,
                      servico,
                    })),
                    ...treinamentosExibidos.map((treinamento) => ({
                      tipo: "treinamento" as const,
                      data: treinamento.data,
                      horario: treinamento.horario,
                      treinamento,
                    })),
                    ...compromissosExibidos.map((compromisso) => ({
                      tipo: "compromisso" as const, data: compromisso.data, horario: compromisso.horario, compromisso,
                    })),
                  ]
                    .sort((a, b) =>
                      `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`),
                    )
                    .map((item) =>
                      item.tipo === "servico" ? (
                        <CardServico
                          key={`s-${item.servico.id}`}
                          servico={item.servico}
                          ehAdministrador={ehAdministrador}
                          aoAbrir={(servico) => setServicoSelecionadoId(servico.id)}
                          aoCancelar={cancelarServico}
                            aoExcluir={async (servicoId) => {
                            await excluirServico(servicoId);
                          }}
                          aoAlterarStatus={alterarStatus}
                          aoAbrirMaps={abrirMaps}
                        />
                      ) : item.tipo === "treinamento" ? (
                        <CardTreinamentoAgenda
                          key={`t-${item.treinamento.id}`}
                          treinamento={item.treinamento}
                          onClick={() => setTreinamentoSelecionadoId(item.treinamento.id)}
                        />
                      ) : (
                        <CardCompromissoAgenda key={`c-${item.compromisso.id}`} compromisso={item.compromisso} onClick={() => setCompromissoSelecionadoId(item.compromisso.id)} />
                      ),
                    )}
                </div>
              ) : visualizacao === "semana" ? (
                <div className="w-full overflow-x-auto rounded-2xl border border-zinc-800 bg-black">
                  <div className="grid min-w-[1120px] grid-cols-7">
                    {diasSemana.map((dia) => {
                      const servicosDia = servicosExibidos.filter(
                        (servico) => servico.data === dia,
                      );
                      const treinamentosDia = treinamentosExibidos.filter(
                        (treinamento) => treinamento.data === dia,
                      );
                      const compromissosDia = compromissosExibidos.filter((compromisso) => compromisso.data === dia);
                      const itensDia = [
                        ...servicosDia.map((servico) => ({
                          tipo: "servico" as const,
                          horario: servico.horario,
                          servico,
                        })),
                        ...treinamentosDia.map((treinamento) => ({
                          tipo: "treinamento" as const,
                          horario: treinamento.horario,
                          treinamento,
                        })),
                        ...compromissosDia.map((compromisso) => ({ tipo: "compromisso" as const, horario: compromisso.horario, compromisso })),
                      ].sort((a, b) => a.horario.localeCompare(b.horario));
                      const hoje = dia === dataLocalISO(new Date());

                      return (
                        <div
                          key={dia}
                          className="min-w-[160px] border-r border-zinc-800 p-2 last:border-r-0 lg:min-h-[420px]"
                        >
                          <div
                            className={`mb-2 rounded-lg px-1 py-2 text-center sm:px-2 ${
                              hoje
                                ? "bg-yellow-400 text-black"
                                : "bg-zinc-950 text-white"
                            }`}
                          >
                            <p className="text-[9px] font-black uppercase sm:text-[10px] md:text-xs">
                              {nomeDiaSemana(dia)}
                            </p>
                            <p className="mt-1 text-sm font-black sm:text-base md:text-lg">
                              {formatarDiaMes(dia)}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {itensDia.length === 0 ? (
                              <p className="py-4 text-center text-[9px] font-bold text-zinc-600 sm:text-[10px] md:text-xs">
                                <span className="hidden sm:inline">Sem eventos</span>
                                <span className="sm:hidden">—</span>
                              </p>
                            ) : (
                              itensDia.map((item) =>
                                item.tipo === "servico" ? (
                                  <EventoAgenda
                                    key={`s-${item.servico.id}`}
                                    servico={item.servico}
                                    onClick={() =>
                                      setServicoSelecionadoId(item.servico.id)
                                    }
                                  />
                                ) : item.tipo === "treinamento" ? (
                                  <EventoTreinamento
                                    key={`t-${item.treinamento.id}`}
                                    treinamento={item.treinamento}
                                    onClick={() => setTreinamentoSelecionadoId(item.treinamento.id)}
                                  />
                                ) : (
                                  <EventoCompromisso key={`c-${item.compromisso.id}`} compromisso={item.compromisso} onClick={() => setCompromissoSelecionadoId(item.compromisso.id)} />
                                ),
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="w-full overflow-x-auto rounded-2xl border border-zinc-800 bg-black">
                  <div className="grid min-w-[980px] grid-cols-7 border-b border-zinc-800 bg-zinc-950">
                    {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map(
                      (dia) => (
                        <div
                          key={dia}
                          className="min-w-0 border-r border-zinc-800 px-1 py-2 text-center text-[9px] font-black text-zinc-400 last:border-r-0 sm:text-[10px] md:text-xs"
                        >
                          {dia}
                        </div>
                      ),
                    )}
                  </div>

                  <div className="grid min-w-[980px] grid-cols-7">
                    {diasMes.map((dia) => {
                      const servicosDia = servicosExibidos.filter(
                        (servico) => servico.data === dia,
                      );
                      const treinamentosDia = treinamentosExibidos.filter(
                        (treinamento) => treinamento.data === dia,
                      );
                      const compromissosDia = compromissosExibidos.filter((compromisso) => compromisso.data === dia);
                      const itensDia = [
                        ...servicosDia.map((servico) => ({
                          tipo: "servico" as const,
                          horario: servico.horario,
                          servico,
                        })),
                        ...treinamentosDia.map((treinamento) => ({
                          tipo: "treinamento" as const,
                          horario: treinamento.horario,
                          treinamento,
                        })),
                        ...compromissosDia.map((compromisso) => ({ tipo: "compromisso" as const, horario: compromisso.horario, compromisso })),
                      ].sort((a, b) => a.horario.localeCompare(b.horario));
                      const doMesAtual = mesmoMes(dia, dataReferencia);
                      const hoje = dia === dataLocalISO(new Date());

                      return (
                        <div
                          key={dia}
                          className={`min-w-0 min-h-[76px] border-b border-r border-zinc-800 p-1 sm:min-h-[100px] sm:p-1.5 md:min-h-[130px] md:p-2 ${
                            doMesAtual ? "bg-black" : "bg-zinc-950/70"
                          }`}
                        >
                          <div className="mb-1 flex justify-end sm:mb-2">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black sm:h-6 sm:w-6 sm:text-[10px] md:h-7 md:w-7 md:text-xs ${
                                hoje
                                  ? "bg-yellow-400 text-black"
                                  : doMesAtual
                                    ? "text-white"
                                    : "text-zinc-600"
                              }`}
                            >
                              {Number(dia.slice(8, 10))}
                            </span>
                          </div>

                          <div className="space-y-1">
                            {itensDia.slice(0, 3).map((item) =>
                              item.tipo === "servico" ? (
                                <EventoAgenda
                                  key={`s-${item.servico.id}`}
                                  servico={item.servico}
                                  compacto
                                  onClick={() =>
                                    setServicoSelecionadoId(item.servico.id)
                                  }
                                />
                              ) : item.tipo === "treinamento" ? (
                                <EventoTreinamento
                                  key={`t-${item.treinamento.id}`}
                                  treinamento={item.treinamento}
                                  compacto
                                  onClick={() => setTreinamentoSelecionadoId(item.treinamento.id)}
                                />
                              ) : (
                                <EventoCompromisso key={`c-${item.compromisso.id}`} compromisso={item.compromisso} compacto onClick={() => setCompromissoSelecionadoId(item.compromisso.id)} />
                              ),
                            )}

                            {itensDia.length > 3 && (
                              <p className="px-1 text-xs font-black text-yellow-400">
                                + {itensDia.length - 3} evento(s)
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {servicoSelecionado && (
  <ModalServico
    servico={servicoSelecionado}
    usuarioNome={usuarioNome}
    ehAdministrador={ehAdministrador}
    podeVerContatoCliente={podeVerContato}
    aoFechar={() => setServicoSelecionadoId(null)}
    aoSalvar={salvarServico}
                            aoExcluir={excluirServico}
    aoAbrirMaps={abrirMaps}
  />
)}

      {treinamentoSelecionado && (
        <ModalTreinamentoAgenda
          treinamento={treinamentoSelecionado}
          ehAdministrador={ehAdministrador}
          onStatus={alterarStatusTreinamento}
          onCancel={cancelarTreinamento}
          onDelete={excluirTreinamento}
          onClose={() => setTreinamentoSelecionadoId(null)}
        />
      )}

      {compromissoSelecionado && (
        <ModalCompromissoAgenda compromisso={compromissoSelecionado} ehAdministrador={ehAdministrador} onSave={salvarCompromisso} onCancel={cancelarCompromisso} onDelete={excluirCompromisso} onClose={() => setCompromissoSelecionadoId(null)} />
      )}
    </section>
  );
}


type ConflitoAgenda = { tipo: string; titulo: string; horario: string; horarioFim?: string; responsavel?: string };

type CompromissoAgenda = {
  id: string; tipo: "Reunião" | "Compromisso pessoal" | "Outro"; titulo: string;
  data: string; horario: string; horarioFim: string; responsavel: string;
  local: string; descricao: string; status: "Agendado" | "Confirmado" | "Concluído" | "Cancelado"; criadoPor?: string;
};

function estiloCompromisso(tipo: CompromissoAgenda["tipo"]) {
  if (tipo === "Reunião") {
    return {
      card: "border-violet-500/30 bg-violet-500/10 hover:border-violet-400",
      evento: "border-violet-500/40 bg-violet-500/10 hover:border-violet-300",
      badge: "bg-violet-500/20 text-violet-300",
      texto: "text-violet-300",
    };
  }
  if (tipo === "Compromisso pessoal") {
    return {
      card: "border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400",
      evento: "border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-300",
      badge: "bg-emerald-500/20 text-emerald-300",
      texto: "text-emerald-300",
    };
  }
  return {
    card: "border-zinc-700 bg-zinc-900/70 hover:border-zinc-500",
    evento: "border-zinc-700 bg-zinc-900/70 hover:border-zinc-500",
    badge: "bg-zinc-800 text-zinc-300",
    texto: "text-zinc-300",
  };
}

function CardCompromissoAgenda({ compromisso, onClick }: { compromisso: CompromissoAgenda; onClick: () => void }) {
  const estilo = estiloCompromisso(compromisso.tipo);
  return <button type="button" onClick={onClick} className={`w-full rounded-2xl border p-4 text-left transition ${estilo.card}`}>
    <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${estilo.badge}`}>{compromisso.tipo}</span><span className={`text-sm font-black ${estilo.texto}`}>{compromisso.data.split("-").reverse().join("/")} • {normalizarHorario(compromisso.horario)} às {normalizarHorario(compromisso.horarioFim)}</span></div>
    <div className="mt-2 flex flex-wrap items-center gap-2"><h4 className="font-black uppercase text-white">{compromisso.titulo}</h4><span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-black uppercase text-zinc-300">{compromisso.status}</span></div>{compromisso.responsavel && <p className="mt-1 text-sm text-zinc-400">Responsável: {compromisso.responsavel}</p>}{compromisso.local && <p className="mt-1 text-sm text-zinc-500">Local: {compromisso.local}</p>}
  </button>;
}

function EventoCompromisso({ compromisso, compacto = false, onClick }: { compromisso: CompromissoAgenda; compacto?: boolean; onClick: () => void }) {
  const estilo = estiloCompromisso(compromisso.tipo);
  return <button type="button" onClick={onClick} className={`min-w-0 w-full overflow-hidden rounded-md border p-1 text-left transition sm:rounded-lg sm:p-1.5 md:p-2 ${estilo.evento}`} title={`${normalizarHorario(compromisso.horario)} às ${normalizarHorario(compromisso.horarioFim)} • ${compromisso.tipo} • ${compromisso.titulo}`}>
    <p className={`truncate text-[9px] font-black sm:text-[10px] md:text-xs ${estilo.texto}`}>{normalizarHorario(compromisso.horario)} às {normalizarHorario(compromisso.horarioFim)}</p>
    <p className={`mt-0.5 truncate text-[7px] font-black uppercase sm:text-[8px] md:text-[10px] ${estilo.texto}`}>{compromisso.tipo}</p>
    <p className="mt-0.5 truncate text-[8px] font-black uppercase text-white sm:text-[9px] md:text-xs">{compromisso.titulo} • {compromisso.status}</p>
    {!compacto && compromisso.responsavel && <p className="mt-0.5 hidden truncate text-[8px] font-bold text-zinc-500 md:block md:text-[10px]">{compromisso.responsavel}</p>}
  </button>;
}

function ModalCompromissoAgenda({ compromisso, ehAdministrador, onSave, onCancel, onDelete, onClose }: { compromisso: CompromissoAgenda; ehAdministrador: boolean; onSave: (c: CompromissoAgenda) => Promise<boolean>; onCancel: (id: string) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>; onClose: () => void }) {
  const [rascunho, setRascunho] = useState<CompromissoAgenda>({ ...compromisso });
  const [mensagemLocal, setMensagemLocal] = useState("");
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4"><div className="w-full max-w-3xl rounded-3xl border border-violet-500/40 bg-zinc-950 p-5 shadow-2xl">
    <div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-black uppercase text-violet-300">{rascunho.tipo}</span><h3 className="mt-3 text-2xl font-black uppercase text-white">{rascunho.titulo}</h3></div><button type="button" onClick={onClose} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm font-black text-zinc-300">Fechar</button></div>
    {mensagemLocal && <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">{mensagemLocal}</div>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div><label className="mb-2 block text-xs font-black uppercase text-zinc-500">Tipo</label><select disabled={!ehAdministrador} value={rascunho.tipo} onChange={(e)=>setRascunho({...rascunho,tipo:e.target.value as CompromissoAgenda["tipo"]})} className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white"><option>Reunião</option><option>Compromisso pessoal</option><option>Outro</option></select></div>
      <div><label className="mb-2 block text-xs font-black uppercase text-zinc-500">Status</label><select disabled={!ehAdministrador} value={rascunho.status} onChange={(e)=>setRascunho({...rascunho,status:e.target.value as CompromissoAgenda["status"]})} className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white"><option>Agendado</option><option>Confirmado</option><option>Concluído</option><option>Cancelado</option></select></div>
      <EditCampo label="Título" value={rascunho.titulo} disabled={!ehAdministrador} onChange={(v)=>setRascunho({...rascunho,titulo:v})}/>
      <EditCampo label="Data" type="date" value={rascunho.data} disabled={!ehAdministrador} onChange={(v)=>setRascunho({...rascunho,data:v})}/>
      <div className="grid grid-cols-2 gap-3"><EditCampo label="Início" type="time" value={normalizarHorario(rascunho.horario)} disabled={!ehAdministrador} onChange={(v)=>setRascunho({...rascunho,horario:v})}/><EditCampo label="Fim" type="time" value={normalizarHorario(rascunho.horarioFim)} disabled={!ehAdministrador} onChange={(v)=>setRascunho({...rascunho,horarioFim:v})}/></div>
      <EditCampo label="Responsável" value={rascunho.responsavel} disabled={!ehAdministrador} onChange={(v)=>setRascunho({...rascunho,responsavel:v})}/>
      <EditCampo label="Local" value={rascunho.local} disabled={!ehAdministrador} onChange={(v)=>setRascunho({...rascunho,local:v})}/>
      <div className="sm:col-span-2"><EditCampo label="Descrição" value={rascunho.descricao} disabled={!ehAdministrador} onChange={(v)=>setRascunho({...rascunho,descricao:v})}/></div>
    </div>
    {ehAdministrador && <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end"><button type="button" onClick={async()=>{const ok=await onSave(rascunho); if(ok){setMensagemLocal("Alterações salvas."); onClose();}}} className="rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black">Salvar / atualizar</button><button type="button" onClick={async()=>{const ok=await onCancel(rascunho.id); if(ok) onClose();}} className="rounded-xl border border-orange-500/70 px-5 py-3 font-black uppercase text-orange-300">Cancelar / desmarcar</button><button type="button" onClick={async()=>{const ok=await onDelete(rascunho.id); if(ok) onClose();}} className="rounded-xl border border-red-500/60 px-5 py-3 font-black uppercase text-red-400">Excluir definitivamente</button></div>}
  </div></div>;
}

function EditCampo({ label, value, onChange, type="text", disabled=false }: { label:string; value:string; onChange:(v:string)=>void; type?:string; disabled?:boolean }) { return <div><label className="mb-2 block text-xs font-black uppercase text-zinc-500">{label}</label><input type={type} value={value} disabled={disabled} onChange={(e)=>onChange(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white disabled:opacity-70"/></div>; }

type TreinamentoAgenda = {
  id: string;
  tema: string;
  data: string;
  horario: string;
  horarioFim?: string;
  responsavel: string;
  fornecedor: string;
  local: string;
  participantes: string[];
  observacoes: string;
  status: string;
};

function CardTreinamentoAgenda({
  treinamento,
  onClick,
}: {
  treinamento: TreinamentoAgenda;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-left transition hover:border-blue-400"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black uppercase text-blue-300">
          Treinamento
        </span>
        <span className="text-sm font-black text-blue-300">
          {treinamento.data.split("-").reverse().join("/")} • {normalizarHorario(treinamento.horario)}{treinamento.horarioFim ? ` às ${normalizarHorario(treinamento.horarioFim)}` : ""}
        </span>
      </div>
      <h4 className="mt-2 font-black uppercase text-white">{treinamento.tema}</h4>
      {treinamento.local && <p className="mt-1 text-sm text-zinc-400">Local: {treinamento.local}</p>}
      {treinamento.responsavel && <p className="mt-1 text-sm text-zinc-400">Responsável: {treinamento.responsavel}</p>}
      <p className="mt-1 text-sm text-zinc-500">
        Participantes: {treinamento.participantes.join(", ") || "—"}
      </p>
    </button>
  );
}

function EventoTreinamento({
  treinamento,
  compacto = false,
  onClick,
}: {
  treinamento: TreinamentoAgenda;
  compacto?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-0 w-full overflow-hidden rounded-md border border-blue-500/40 bg-blue-500/10 p-1 text-left transition hover:border-blue-300 sm:rounded-lg sm:p-1.5 md:p-2"
      title={`${normalizarHorario(treinamento.horario)}${treinamento.horarioFim ? ` às ${normalizarHorario(treinamento.horarioFim)}` : ""} • Treinamento • ${treinamento.tema}`}
    >
      <p className="truncate text-[9px] font-black text-blue-300 sm:text-[10px] md:text-xs">
        {normalizarHorario(treinamento.horario) || "--:--"}{treinamento.horarioFim ? ` às ${normalizarHorario(treinamento.horarioFim)}` : ""}
      </p>
      <p className="mt-0.5 truncate text-[7px] font-black uppercase text-blue-300 sm:text-[8px] md:text-[10px]">
        TREINAMENTO
      </p>
      <p className="mt-0.5 truncate text-[8px] font-black uppercase text-white sm:text-[9px] md:text-xs">
        {treinamento.tema}
      </p>
      {!compacto && treinamento.local && (
        <p className="mt-0.5 hidden truncate text-[8px] font-bold text-zinc-500 md:block md:text-[10px]">
          {treinamento.local}
        </p>
      )}
    </button>
  );
}

function ModalTreinamentoAgenda({
  treinamento,
  ehAdministrador,
  onStatus,
  onCancel,
  onDelete,
  onClose,
}: {
  treinamento: TreinamentoAgenda;
  ehAdministrador: boolean;
  onStatus: (treinamentoId: string, novoStatus: string) => Promise<boolean>;
  onCancel: (treinamentoId: string) => Promise<boolean>;
  onDelete: (treinamentoId: string) => Promise<boolean>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-blue-500/40 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black uppercase text-blue-300">
              Treinamento
            </span>
            <h3 className="mt-3 text-2xl font-black uppercase text-white">
              {treinamento.tema}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm font-black text-zinc-300 hover:border-blue-400 hover:text-blue-300"
          >
            Fechar
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DetalheTreinamento label="Data" valor={treinamento.data ? treinamento.data.split("-").reverse().join("/") : "—"} />
          <DetalheTreinamento label="Horário" valor={`${normalizarHorario(treinamento.horario) || "—"}${treinamento.horarioFim ? ` às ${normalizarHorario(treinamento.horarioFim)}` : ""}`} />
          <DetalheTreinamento label="Local / link" valor={treinamento.local || "—"} />
          <DetalheTreinamento label="Responsável / instrutor" valor={treinamento.responsavel || "—"} />
          <DetalheTreinamento label="Fornecedor / parceiro" valor={treinamento.fornecedor || "—"} />
          {ehAdministrador ? <div><p className="text-xs font-black uppercase text-zinc-500">Status</p><select value={treinamento.status || "Agendado"} onChange={(e)=>void onStatus(treinamento.id,e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 font-bold text-white"><option>Agendado</option><option>Confirmado</option><option>Concluído</option><option>Cancelado</option></select></div> : <DetalheTreinamento label="Status" valor={treinamento.status || "—"} />}
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-4">
          <p className="text-xs font-black uppercase text-zinc-500">Participantes</p>
          <p className="mt-2 font-bold text-zinc-200">
            {treinamento.participantes.join(", ") || "—"}
          </p>
        </div>

        {treinamento.observacoes && (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-4">
            <p className="text-xs font-black uppercase text-zinc-500">Observações</p>
            <p className="mt-2 whitespace-pre-wrap text-zinc-300">
              {treinamento.observacoes}
            </p>
          </div>
        )}

        {ehAdministrador && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={async()=>{const ok=await onCancel(treinamento.id); if(ok) onClose();}} className="rounded-xl border border-orange-500/70 px-4 py-3 text-sm font-black uppercase text-orange-300">Cancelar / desmarcar</button>
            <button type="button" onClick={async()=>{const ok=await onDelete(treinamento.id); if(ok) onClose();}} className="rounded-xl border border-red-500/60 px-4 py-3 text-sm font-black uppercase text-red-400">Excluir definitivamente</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetalheTreinamento({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-4">
      <p className="text-xs font-black uppercase text-zinc-500">{label}</p>
      <p className="mt-1 break-words font-bold text-white">{valor}</p>
    </div>
  );
}

function BotaoVisualizacao({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-black uppercase transition ${
        ativo
          ? "bg-yellow-400 text-black"
          : "border border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-yellow-400/60 hover:text-yellow-400"
      }`}
    >
      {children}
    </button>
  );
}

function EventoAgenda({
  servico,
  onClick,
  compacto = false,
}: {
  servico: Servico;
  onClick: () => void;
  compacto?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-0 w-full overflow-hidden rounded-md border border-yellow-400/30 bg-yellow-400/10 p-1 text-left transition hover:border-yellow-400 sm:rounded-lg sm:p-1.5 md:p-2"
      title={`${normalizarHorario(servico.horario)}${servico.horarioFim ? ` às ${normalizarHorario(servico.horarioFim)}` : ""} • ${servico.clienteNome} • ${servico.tipoServico}`}
    >
      <p className="whitespace-nowrap text-[10px] font-black text-yellow-400 sm:text-xs">
        {normalizarHorario(servico.horario) || "--:--"}
        {servico.horarioFim ? ` às ${normalizarHorario(servico.horarioFim)}` : ""}
      </p>
      <p className="mt-1 whitespace-normal break-words text-[10px] font-black uppercase leading-tight text-white sm:text-xs">
        {servico.clienteNome}
      </p>
      <p className="mt-1 whitespace-normal break-words text-[9px] font-bold leading-tight text-zinc-400 sm:text-[10px]">
        {servico.tipoServico || "Serviço"}
      </p>
      {!compacto && (
        <p className="mt-0.5 hidden truncate text-[8px] font-bold uppercase text-zinc-500 md:block md:mt-1 md:text-[10px]">
          {servico.status}
        </p>
      )}
    </button>
  );
}

function dataLocalISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function dataDeISO(valor: string) {
  const [ano, mes, dia] = valor.split("-").map(Number);
  return new Date(ano, mes - 1, dia, 12, 0, 0, 0);
}

function somarDias(valor: string, quantidade: number) {
  const data = dataDeISO(valor);
  data.setDate(data.getDate() + quantidade);
  return dataLocalISO(data);
}

function somarMeses(valor: string, quantidade: number) {
  const data = dataDeISO(valor);
  data.setDate(1);
  data.setMonth(data.getMonth() + quantidade);
  return dataLocalISO(data);
}

function inicioDaSemana(valor: string) {
  const data = dataDeISO(valor);
  const diaSemana = data.getDay();
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  data.setDate(data.getDate() + deslocamento);
  return dataLocalISO(data);
}

function montarGradeMes(valor: string) {
  const data = dataDeISO(valor);
  const primeiroDiaMes = new Date(
    data.getFullYear(),
    data.getMonth(),
    1,
    12,
    0,
    0,
    0,
  );
  const inicio = inicioDaSemana(dataLocalISO(primeiroDiaMes));

  return Array.from({ length: 42 }, (_, indice) => somarDias(inicio, indice));
}

function mesmoMes(a: string, b: string) {
  return a.slice(0, 7) === b.slice(0, 7);
}

function nomeDiaSemana(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
  })
    .format(dataDeISO(valor))
    .replace(".", "")
    .toUpperCase();
}

function formatarDiaMes(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(dataDeISO(valor));
}

function tituloMes(valor: string) {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(dataDeISO(valor));

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function tituloSemana(inicio: string) {
  const fim = somarDias(inicio, 6);
  return `${formatarDiaMes(inicio)} — ${formatarDiaMes(fim)}`;
}

function Campo({
  label,
  valor,
  placeholder,
  tipo = "text",
  onChange,
}: {
  label: string;
  valor: string;
  placeholder?: string;
  tipo?: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase text-zinc-400">
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