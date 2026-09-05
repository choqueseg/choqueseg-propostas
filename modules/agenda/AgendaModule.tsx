"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import CardServico from "./CardServico";
import ModalServico from "./ModalServico";
import { Cliente, Funcionario, PerfilUsuario, Servico } from "./types";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const CHAVE_AGENDA = "choqueseg-pro-agenda";
const CHAVE_TREINAMENTOS_AGENDA = "choqueseg-pro-agenda-treinamentos";

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
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [equipesSelecionadas, setEquipesSelecionadas] = useState<string[]>([]);
  const [descricao, setDescricao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState<"servicos" | "agendar">("servicos");
  const [visualizacao, setVisualizacao] = useState<"semana" | "mes" | "lista">("semana");
  const [dataReferencia, setDataReferencia] = useState(() => dataLocalISO(new Date()));
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState<string | null>(null);
  const [treinamentoSelecionadoId, setTreinamentoSelecionadoId] = useState<string | null>(null);
  const [notificacaoServico, setNotificacaoServico] = useState<{
    titulo: string;
    mensagem: string;
    servicoId?: string;
  } | null>(null);

  const ehAdministrador = perfil === "administrador";
  const [cargoUsuario, setCargoUsuario] = useState("");

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

    const dataFormatada = dataServico
      ? dataServico.split("-").reverse().join("/")
      : "";

    const detalhesData = [dataFormatada, horarioServico && `às ${horarioServico}`]
      .filter(Boolean)
      .join(" ");

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

  async function carregarDados() {
    setMensagem("");

    // O telefone não é solicitado ao Supabase quando o perfil não pode vê-lo.
    // Isso evita expor o contato na resposta de rede da Agenda.
    const camposClientes = podeVerContato
      ? "id,nome,telefone,cidade,endereco,tipo_servico"
      : "id,nome,cidade,endereco,tipo_servico";

    const camposServicosBase =
      "id,cliente_id,cliente_nome,tipo_servico,data,horario,endereco,cidade,equipe,descricao,status,checklist,materiais,fotos,vistoria_solar,observacoes_tecnico,assinatura_cliente,saida_empresa_em,chegada_cliente_em,iniciado_em,iniciado_por,concluido_em,concluido_por,quilometragem_inicial,quilometragem_final,despesas,historico,criado_em,atualizado_em";

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
      localStorage.setItem(CHAVE_AGENDA, JSON.stringify(listaNuvem));
    }

    await carregarTreinamentosAgenda();

    setDadosCarregados(true);
  }

  useEffect(() => {
    if (!dadosCarregados) return;
    localStorage.setItem(CHAVE_AGENDA, JSON.stringify(servicos));
  }, [servicos, dadosCarregados]);

  function servicoParaBanco(servico: Servico) {
    return {
      id: servico.id,
      cliente_id: servico.clienteId,
      cliente_nome: servico.clienteNome,
      cliente_telefone: servico.clienteTelefone ?? "",
      tipo_servico: servico.tipoServico,
      data: servico.data,
      horario: servico.horario,
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
    if (servico.status === "Concluído") return "Serviço Concluído" as const;
    if (servico.status === "Em execução") return "Em Execução" as const;
    if (servico.status === "Agendado" || servico.status === "Em deslocamento") {
      return "Serviço Agendado" as const;
    }

    return null;
  }

  async function agendarServico(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const cliente = clientes.find((item) => item.id === clienteId);

    if (!cliente) {
      setMensagem("Selecione um cliente.");
      return;
    }

    if (!data || !horario || equipesSelecionadas.length === 0) {
      setMensagem("Preencha data, horário e selecione pelo menos um técnico responsável.");
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
    setEquipesSelecionadas([]);
    setDescricao("");
    setMensagem("Serviço agendado e sincronizado com a nuvem.");
    setSecaoAtiva("servicos");
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

  async function excluirServico(servicoId: string) {
    if (!ehAdministrador) return;

    const confirmar = window.confirm(
      "Deseja realmente excluir este serviço?",
    );
    if (!confirmar) return;

    const { error } = await supabase
      .from("servicos")
      .delete()
      .eq("id", servicoId);

    if (error) {
      console.error("Erro ao excluir serviço:", error);
      setMensagem(`Erro ao excluir serviço da nuvem: ${error.message}`);
      return;
    }

    setServicos((atuais) =>
      atuais.filter((servico) => servico.id !== servicoId),
    );
    setMensagem("Serviço excluído da nuvem.");
  }

  function abrirMaps(endereco: string, cidade: string) {
    const destino = encodeURIComponent(`${endereco}, ${cidade}`);
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
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {secaoAtiva === "agendar" && ehAdministrador && (
            <form
  onSubmit={agendarServico}
  className="mt-7 rounded-3xl border border-yellow-400/30 bg-black p-5"
>
  <h3 className="text-xl font-black uppercase text-yellow-400">
    Novo agendamento
  </h3>

  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
    <div>
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

    <Campo label="Data" tipo="date" valor={data} onChange={setData} />
    <Campo label="Horário" tipo="time" valor={horario} onChange={setHorario} />

    <div>
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

    <Campo
      label="Descrição"
      valor={descricao}
      placeholder="Ex.: instalação de 4 câmeras"
      onChange={setDescricao}
    />
  </div>

  <button
    type="submit"
    className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
  >
    Agendar serviço
  </button>
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

              {servicosVisiveis.length === 0 && treinamentosVisiveis.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-700 bg-black p-10 text-center">
                  <p className="text-5xl">📅</p>
                  <p className="mt-4 font-black uppercase">
                    Nenhum evento agendado
                  </p>
                </div>
              ) : visualizacao === "lista" ? (
                <div className="space-y-3">
                  {[
                    ...servicosVisiveis.map((servico) => ({
                      tipo: "servico" as const,
                      data: servico.data,
                      horario: servico.horario,
                      servico,
                    })),
                    ...treinamentosVisiveis.map((treinamento) => ({
                      tipo: "treinamento" as const,
                      data: treinamento.data,
                      horario: treinamento.horario,
                      treinamento,
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
                          aoExcluir={excluirServico}
                          aoAlterarStatus={alterarStatus}
                          aoAbrirMaps={abrirMaps}
                        />
                      ) : (
                        <CardTreinamentoAgenda
                          key={`t-${item.treinamento.id}`}
                          treinamento={item.treinamento}
                          onClick={() => setTreinamentoSelecionadoId(item.treinamento.id)}
                        />
                      ),
                    )}
                </div>
              ) : visualizacao === "semana" ? (
                <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                  <div className="grid w-full grid-cols-7">
                    {diasSemana.map((dia) => {
                      const servicosDia = servicosVisiveis.filter(
                        (servico) => servico.data === dia,
                      );
                      const treinamentosDia = treinamentosVisiveis.filter(
                        (treinamento) => treinamento.data === dia,
                      );
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
                      ].sort((a, b) => a.horario.localeCompare(b.horario));
                      const hoje = dia === dataLocalISO(new Date());

                      return (
                        <div
                          key={dia}
                          className="min-w-0 border-r border-zinc-800 p-1 last:border-r-0 sm:p-2 lg:min-h-[420px]"
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
                                ) : (
                                  <EventoTreinamento
                                    key={`t-${item.treinamento.id}`}
                                    treinamento={item.treinamento}
                                    onClick={() =>
                                      setTreinamentoSelecionadoId(item.treinamento.id)
                                    }
                                  />
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
                <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                  <div className="grid w-full grid-cols-7 border-b border-zinc-800 bg-zinc-950">
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

                  <div className="grid w-full grid-cols-7">
                    {diasMes.map((dia) => {
                      const servicosDia = servicosVisiveis.filter(
                        (servico) => servico.data === dia,
                      );
                      const treinamentosDia = treinamentosVisiveis.filter(
                        (treinamento) => treinamento.data === dia,
                      );
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
                              ) : (
                                <EventoTreinamento
                                  key={`t-${item.treinamento.id}`}
                                  treinamento={item.treinamento}
                                  compacto
                                  onClick={() =>
                                    setTreinamentoSelecionadoId(item.treinamento.id)
                                  }
                                />
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
    aoAbrirMaps={abrirMaps}
  />
)}

      {treinamentoSelecionado && (
        <ModalTreinamentoAgenda
          treinamento={treinamentoSelecionado}
          onClose={() => setTreinamentoSelecionadoId(null)}
        />
      )}
    </section>
  );
}


type TreinamentoAgenda = {
  id: string;
  tema: string;
  data: string;
  horario: string;
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
          {treinamento.data.split("-").reverse().join("/")} • {treinamento.horario}
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
      title={`${treinamento.horario} • Treinamento • ${treinamento.tema}`}
    >
      <p className="truncate text-[9px] font-black text-blue-300 sm:text-[10px] md:text-xs">
        {treinamento.horario || "--:--"}
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
  onClose,
}: {
  treinamento: TreinamentoAgenda;
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
          <DetalheTreinamento label="Horário" valor={treinamento.horario || "—"} />
          <DetalheTreinamento label="Local / link" valor={treinamento.local || "—"} />
          <DetalheTreinamento label="Responsável / instrutor" valor={treinamento.responsavel || "—"} />
          <DetalheTreinamento label="Fornecedor / parceiro" valor={treinamento.fornecedor || "—"} />
          <DetalheTreinamento label="Status" valor={treinamento.status || "—"} />
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
      title={`${servico.horario} • ${servico.clienteNome} • ${servico.tipoServico}`}
    >
      <p className="truncate text-[9px] font-black text-yellow-400 sm:text-[10px] md:text-xs">
        {servico.horario || "--:--"}
      </p>
      <p className="mt-0.5 truncate text-[8px] font-black uppercase text-white sm:text-[9px] md:mt-1 md:text-xs">
        {servico.clienteNome}
      </p>
      <p className="mt-0.5 truncate text-[7px] font-bold leading-tight text-zinc-400 sm:text-[8px] md:mt-1 md:text-[10px]">
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