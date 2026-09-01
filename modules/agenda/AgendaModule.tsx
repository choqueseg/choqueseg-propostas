"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import CardServico from "./CardServico";
import ModalServico from "./ModalServico";
import { Cliente, Funcionario, PerfilUsuario, Servico } from "./types";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const CHAVE_AGENDA = "choqueseg-pro-agenda";

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
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [equipesSelecionadas, setEquipesSelecionadas] = useState<string[]>([]);
  const [descricao, setDescricao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState<"servicos" | "agendar">("servicos");
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState<string | null>(null);
  const [notificacaoServico, setNotificacaoServico] = useState<{
    titulo: string;
    mensagem: string;
  } | null>(null);

  const ehAdministrador = perfil === "administrador";

  useEffect(() => {
    void carregarDados();
  }, []);

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

    if (!usuarioEstaNaEquipe(equipe)) return;

    const clienteNome = String(registro.cliente_nome ?? "Cliente");
    const tipoServico = String(registro.tipo_servico ?? "Serviço");
    const dataServico = String(registro.data ?? "");
    const horarioServico = String(registro.horario ?? "");

    const dataFormatada = dataServico
      ? dataServico.split("-").reverse().join("/")
      : "";

    const titulo =
      tipo === "INSERT"
        ? "🔔 NOVO SERVIÇO AGENDADO"
        : "🔄 SERVIÇO ATUALIZADO";

    const detalhesData = [dataFormatada, horarioServico && `às ${horarioServico}`]
      .filter(Boolean)
      .join(" ");

    setNotificacaoServico({
      titulo,
      mensagem: `${clienteNome} • ${tipoServico}${
        detalhesData ? ` • ${detalhesData}` : ""
      }`,
    });

    tocarSomNotificacao();

    window.setTimeout(() => {
      setNotificacaoServico(null);
    }, 10000);
  }

  useEffect(() => {
    if (ehAdministrador) return;

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

  async function carregarDados() {
    setMensagem("");

    const [clientesResposta, funcionariosResposta, servicosResposta] =
      await Promise.all([
        supabase
          .from("clientes")
          .select("id,nome,telefone,cidade,endereco,tipo_servico")
          .order("nome", { ascending: true }),
        supabase
          .from("funcionarios")
          .select("id,nome,usuario,status")
          .order("nome", { ascending: true }),
        supabase
          .from("servicos")
          .select(
            "id,cliente_id,cliente_nome,cliente_telefone,tipo_servico,data,horario,endereco,cidade,equipe,descricao,status,checklist,materiais,fotos,vistoria_solar,observacoes_tecnico,assinatura_cliente,saida_empresa_em,chegada_cliente_em,iniciado_em,iniciado_por,concluido_em,concluido_por,quilometragem_inicial,quilometragem_final,despesas,historico,criado_em,atualizado_em",
          )
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
        (clientesResposta.data ?? []).map((item) => ({
          id: item.id,
          nome: item.nome ?? "",
          telefone: item.telefone ?? "",
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
        (funcionariosResposta.data ?? []).map((item) => ({
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
        (item) => ({
          id: item.id,
          clienteId: item.cliente_id,
          clienteNome: item.cliente_nome ?? "",
          clienteTelefone: item.cliente_telefone ?? "",
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
    return [...servicos].sort((a, b) =>
      `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`),
    );
  }, [servicos]);

  const servicoSelecionado = servicoSelecionadoId
    ? servicos.find((servico) => servico.id === servicoSelecionadoId) ?? null
    : null;

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

    setServicos((atuais) => [...atuais, novoServico]);
    setClienteId("");
    setData("");
    setHorario("");
    setEquipesSelecionadas([]);
    setDescricao("");
    setMensagem("Serviço agendado e sincronizado com a nuvem.");
    setSecaoAtiva("servicos");
  }

  async function salvarServico(atualizado: Servico) {
    const { error } = await supabase
      .from("servicos")
      .update(servicoParaBanco(atualizado))
      .eq("id", atualizado.id);

    if (error) {
      console.error("Erro ao salvar serviço:", error);
      setMensagem(`Erro ao salvar serviço na nuvem: ${error.message}`);
      return;
    }

    setServicos((atuais) =>
      atuais.map((servico) =>
        servico.id === atualizado.id ? atualizado : servico,
      ),
    );
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
    <section className="p-4 md:p-7">
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

            <button
              type="button"
              onClick={() => setNotificacaoServico(null)}
              className="rounded-lg border border-black/30 px-3 py-1 text-xs font-black uppercase"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0">
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
  {servicosVisiveis.length === 0 ? (
    <div className="rounded-3xl border border-dashed border-zinc-700 bg-black p-10 text-center">
      <p className="text-5xl">📅</p>
      <p className="mt-4 font-black uppercase">Nenhum serviço agendado</p>
    </div>
  ) : (
    servicosVisiveis.map((servico) => (
      <CardServico
        key={servico.id}
        servico={servico}
        ehAdministrador={ehAdministrador}
        aoAbrir={(item) => setServicoSelecionadoId(item.id)}
        aoExcluir={excluirServico}
        aoAlterarStatus={alterarStatus}
        aoAbrirMaps={abrirMaps}
      />
    ))
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
    podeVerContatoCliente={podeVerContatoCliente}
    aoFechar={() => setServicoSelecionadoId(null)}
    aoSalvar={salvarServico}
    aoAbrirMaps={abrirMaps}
  />
)}
    </section>
  );
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