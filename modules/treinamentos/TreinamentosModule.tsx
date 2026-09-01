"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type PerfilUsuario =
  | "administrador"
  | "vendedor"
  | "tecnico"
  | "engenheiro"
  | "atendente"
  | "funcionario";

type Funcionario = {
  id: string;
  nome: string;
  status: "Ativo" | "Inativo";
};

type Fornecedor = {
  id: string;
  nome: string;
  contatos: string;
  status: string;
};

type Treinamento = {
  id: string;
  tema: string;
  data: string;
  horario: string;
  responsavel: string;
  fornecedor: string;
  local: string;
  participantes: string[];
  observacoes: string;
  status: "Agendado" | "Concluído" | "Cancelado";
  criadoEm: string;
  criadoPor: string;
};

type FormularioTreinamento = Omit<
  Treinamento,
  "id" | "criadoEm" | "criadoPor"
>;

const TREINAMENTOS_PREDEFINIDOS = [
  "Câmeras IP",
  "Câmeras analógicas",
  "CFTV para condomínios",
  "DVR e NVR",
  "Configuração e acesso remoto de CFTV",
  "Cabeamento e conectividade para CFTV",
  "Redes e Wi-Fi para sistemas de segurança",
  "Cabeamento estruturado",
  "Controle de acesso",
  "Fechaduras digitais",
  "Interfonia e vídeo porteiro",
  "Sistemas de alarme",
  "Cerca elétrica",
  "Sistema de detecção e alarme de incêndio",
  "Centrais e sensores de incêndio",
  "Motores Rossi",
  "Motores PPA",
  "Automação de portões",
  "Centrais de comando para motores",
  "Casa inteligente",
  "Automação residencial",
  "Automação condominial",
  "Interruptores e módulos Wi-Fi",
  "Automação de iluminação",
  "Integração com assistentes de voz",
  "Carregadores veiculares",
  "Infraestrutura elétrica para carregadores veiculares",
  "Energia solar fotovoltaica",
  "Instalação de módulos solares",
  "Inversores fotovoltaicos",
  "Microinversores",
  "Strings, MPPT e dimensionamento",
  "Proteções CC e CA em sistemas solares",
  "Aterramento em sistemas fotovoltaicos",
  "Comissionamento e monitoramento solar",
  "Instalações elétricas residenciais",
  "Instalações elétricas comerciais",
  "Quadros de distribuição",
  "Disjuntores, DR e DPS",
  "Aterramento elétrico",
  "Comandos elétricos",
  "Leitura e interpretação de projetos elétricos",
  "Infraestrutura condominial",
  "NR 10 — Segurança em instalações elétricas",
  "NR 35 — Trabalho em altura",
  "EPIs e segurança na instalação",
  "Outro treinamento",
] as const;

const formularioInicial: FormularioTreinamento = {
  tema: "",
  data: "",
  horario: "",
  responsavel: "",
  fornecedor: "",
  local: "",
  participantes: [],
  observacoes: "",
  status: "Agendado",
};

export default function TreinamentosModule({
  usuarioNome,
  perfil,
}: {
  usuarioNome: string;
  perfil: PerfilUsuario;
}) {
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [formulario, setFormulario] =
    useState<FormularioTreinamento>(formularioInicial);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [secaoAtiva, setSecaoAtiva] = useState<"lista" | "cadastro">("lista");
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");

  const ehAdministrador = perfil === "administrador";

  useEffect(() => {
    void carregarDados();
  }, []);

  async function carregarDados() {
    setMensagem("");

    const [treinamentosResposta, funcionariosResposta, fornecedoresResposta] = await Promise.all([
      supabase
        .from("treinamentos")
        .select(
          "id,tema,data,horario,responsavel,fornecedor,local,participantes,observacoes,status,criado_em,criado_por",
        )
        .order("data", { ascending: true })
        .order("horario", { ascending: true }),
      supabase
        .from("funcionarios")
        .select("id,nome,status")
        .eq("status", "Ativo")
        .order("nome", { ascending: true }),
      supabase
        .from("fornecedores")
        .select("id,nome,contatos,status")
        .eq("status", "Ativo")
        .order("nome", { ascending: true }),
    ]);

    if (treinamentosResposta.error) {
      console.error(
        "Erro ao carregar treinamentos:",
        treinamentosResposta.error,
      );
      setMensagem(
        `Erro ao carregar treinamentos: ${treinamentosResposta.error.message}`,
      );
      setTreinamentos([]);
    } else {
      setTreinamentos(
        (treinamentosResposta.data ?? []).map((item) => ({
          id: String(item.id),
          tema: item.tema ?? "",
          data: item.data ?? "",
          horario: item.horario ?? "",
          responsavel: item.responsavel ?? "",
          fornecedor: item.fornecedor ?? "",
          local: item.local ?? "",
          participantes: Array.isArray(item.participantes)
            ? item.participantes
            : [],
          observacoes: item.observacoes ?? "",
          status: (item.status ?? "Agendado") as Treinamento["status"],
          criadoEm: item.criado_em ?? "",
          criadoPor: item.criado_por ?? "",
        })),
      );
    }

    if (funcionariosResposta.error) {
      console.error(
        "Erro ao carregar funcionários:",
        funcionariosResposta.error,
      );
      setMensagem(
        `Erro ao carregar funcionários: ${funcionariosResposta.error.message}`,
      );
      setFuncionarios([]);
    } else {
      setFuncionarios(
        (funcionariosResposta.data ?? []).map((item) => ({
          id: item.id,
          nome: item.nome ?? "",
          status: (item.status ?? "Ativo") as Funcionario["status"],
        })),
      );
    }

    if (fornecedoresResposta.error) {
      console.error(
        "Erro ao carregar fornecedores:",
        fornecedoresResposta.error,
      );
      setMensagem(
        `Erro ao carregar fornecedores: ${fornecedoresResposta.error.message}`,
      );
      setFornecedores([]);
    } else {
      setFornecedores(
        (fornecedoresResposta.data ?? []).map((item) => ({
          id: item.id,
          nome: item.nome ?? "",
          contatos: item.contatos ?? "",
          status: item.status ?? "Ativo",
        })),
      );
    }
  }

  const treinamentosVisiveis = useMemo(() => {
    const base = ehAdministrador
      ? treinamentos
      : treinamentos.filter((treinamento) =>
          treinamento.participantes.some(
            (nome) => nome.trim().toLowerCase() === usuarioNome.trim().toLowerCase(),
          ),
        );

    const termo = busca.trim().toLowerCase();
    if (!termo) return base;

    return base.filter((treinamento) =>
      [
        treinamento.tema,
        treinamento.responsavel,
        treinamento.fornecedor,
        treinamento.local,
        treinamento.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [treinamentos, busca, ehAdministrador, usuarioNome]);

  function limparFormulario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
  }

  function alternarParticipante(nome: string) {
    setFormulario((atual) => {
      const existe = atual.participantes.includes(nome);

      return {
        ...atual,
        participantes: existe
          ? atual.participantes.filter((item) => item !== nome)
          : [...atual.participantes, nome],
      };
    });
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!ehAdministrador) return;

    if (!formulario.tema.trim() || !formulario.data || !formulario.horario) {
      setMensagem("Preencha tema, data e horário.");
      return;
    }

    if (formulario.participantes.length === 0) {
      setMensagem("Selecione pelo menos um participante.");
      return;
    }

    const dadosBanco = {
      tema: formulario.tema.trim(),
      data: formulario.data,
      horario: formulario.horario,
      responsavel: formulario.responsavel.trim(),
      fornecedor: formulario.fornecedor.trim(),
      local: formulario.local.trim(),
      participantes: formulario.participantes,
      observacoes: formulario.observacoes.trim(),
      status: formulario.status,
    };

    if (editandoId) {
      const { error } = await supabase
        .from("treinamentos")
        .update(dadosBanco)
        .eq("id", editandoId);

      if (error) {
        console.error("Erro ao atualizar treinamento:", error);
        setMensagem(`Erro ao atualizar treinamento: ${error.message}`);
        return;
      }

      setMensagem("Treinamento atualizado e sincronizado com a nuvem.");
    } else {
      const agora = new Date().toISOString();

      const { error } = await supabase.from("treinamentos").insert({
        ...dadosBanco,
        criado_em: agora,
        criado_por: usuarioNome,
      });

      if (error) {
        console.error("Erro ao cadastrar treinamento:", error);
        setMensagem(`Erro ao cadastrar treinamento: ${error.message}`);
        return;
      }

      setMensagem("Treinamento cadastrado e sincronizado com a nuvem.");
    }

    await carregarDados();
    limparFormulario();
    setSecaoAtiva("lista");
  }

  function editar(treinamento: Treinamento) {
    if (!ehAdministrador) return;

    setFormulario({
      tema: treinamento.tema,
      data: treinamento.data,
      horario: treinamento.horario,
      responsavel: treinamento.responsavel,
      fornecedor: treinamento.fornecedor,
      local: treinamento.local,
      participantes: treinamento.participantes,
      observacoes: treinamento.observacoes,
      status: treinamento.status,
    });
    setEditandoId(treinamento.id);
    setMensagem("");
    setSecaoAtiva("cadastro");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(id: string) {
    if (!ehAdministrador) return;
    if (!window.confirm("Deseja realmente excluir este treinamento?")) return;

    const { error } = await supabase
      .from("treinamentos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir treinamento:", error);
      setMensagem(`Erro ao excluir treinamento: ${error.message}`);
      return;
    }

    setTreinamentos((atuais) =>
      atuais.filter((treinamento) => treinamento.id !== id),
    );
    setMensagem("Treinamento excluído da nuvem.");
  }

  return (
    <section className="p-4 md:p-7">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          Equipe CHOQUESEG
        </p>
        <h2 className="mt-1 text-3xl font-black uppercase">Treinamentos</h2>
        <p className="mt-2 text-zinc-400">
          {ehAdministrador
            ? "Cadastre treinamentos internos, de fornecedores e parceiros."
            : "Consulte os treinamentos destinados a você."}
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-zinc-800 bg-black p-2">
            <p className="px-3 py-2 text-xs font-black uppercase text-zinc-500">
              Menu de treinamentos
            </p>

            <nav className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setSecaoAtiva("lista")}
                className={`rounded-xl px-4 py-3 text-left text-sm font-black uppercase ${
                  secaoAtiva === "lista"
                    ? "bg-yellow-400 text-black"
                    : "border border-zinc-800 bg-zinc-950 text-zinc-300"
                }`}
              >
                📚 Treinamentos
              </button>

              {ehAdministrador && (
                <button
                  type="button"
                  onClick={() => {
                    limparFormulario();
                    setSecaoAtiva("cadastro");
                  }}
                  className={`rounded-xl px-4 py-3 text-left text-sm font-black uppercase ${
                    secaoAtiva === "cadastro"
                      ? "bg-yellow-400 text-black"
                      : "border border-zinc-800 bg-zinc-950 text-zinc-300"
                  }`}
                >
                  ➕ Novo treinamento
                </button>
              )}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {secaoAtiva === "cadastro" && ehAdministrador && (
            <form
              onSubmit={salvar}
              className="rounded-3xl border border-yellow-400/30 bg-black p-5"
            >
              <h3 className="text-xl font-black uppercase text-yellow-400">
                {editandoId ? "Editar treinamento" : "Novo treinamento"}
              </h3>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-xs font-black uppercase text-zinc-400">
                    Tema *
                  </span>
                  <select
                    value={
                      TREINAMENTOS_PREDEFINIDOS.includes(
                        formulario.tema as (typeof TREINAMENTOS_PREDEFINIDOS)[number],
                      )
                        ? formulario.tema
                        : formulario.tema
                          ? "Outro treinamento"
                          : ""
                    }
                    onChange={(evento) => {
                      const valor = evento.target.value;
                      setFormulario({
                        ...formulario,
                        tema: valor === "Outro treinamento" ? "" : valor,
                      });
                    }}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                  >
                    <option value="">Selecione o treinamento</option>
                    {TREINAMENTOS_PREDEFINIDOS.map((tema) => (
                      <option key={tema} value={tema}>
                        {tema}
                      </option>
                    ))}
                  </select>

                  {!TREINAMENTOS_PREDEFINIDOS.includes(
                    formulario.tema as (typeof TREINAMENTOS_PREDEFINIDOS)[number],
                  ) && (
                    <input
                      type="text"
                      value={formulario.tema}
                      onChange={(evento) =>
                        setFormulario({
                          ...formulario,
                          tema: evento.target.value,
                        })
                      }
                      placeholder="Digite o tema do treinamento"
                      className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                    />
                  )}
                </label>
                <Campo
                  label="Responsável / instrutor"
                  valor={formulario.responsavel}
                  onChange={(valor) =>
                    setFormulario({ ...formulario, responsavel: valor })
                  }
                />
                <label>
                  <span className="mb-2 block text-xs font-black uppercase text-zinc-400">
                    Fornecedor / parceiro
                  </span>
                  <select
                    value={formulario.fornecedor}
                    onChange={(evento) =>
                      setFormulario({
                        ...formulario,
                        fornecedor: evento.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                  >
                    <option value="">Selecione o fornecedor</option>
                    {fornecedores.map((fornecedor) => (
                      <option key={fornecedor.id} value={fornecedor.nome}>
                        {fornecedor.nome}
                        {fornecedor.contatos
                          ? ` (${fornecedor.contatos})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <Campo
                  label="Local ou link"
                  valor={formulario.local}
                  onChange={(valor) =>
                    setFormulario({ ...formulario, local: valor })
                  }
                />
                <Campo
                  label="Data *"
                  tipo="date"
                  valor={formulario.data}
                  onChange={(valor) =>
                    setFormulario({ ...formulario, data: valor })
                  }
                />
                <Campo
                  label="Horário *"
                  tipo="time"
                  valor={formulario.horario}
                  onChange={(valor) =>
                    setFormulario({ ...formulario, horario: valor })
                  }
                />
              </div>

              <div className="mt-5">
                <p className="mb-3 text-xs font-black uppercase text-zinc-400">
                  Participantes
                </p>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {funcionarios.map((funcionario) => (
                    <label
                      key={funcionario.id}
                      className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={formulario.participantes.includes(
                          funcionario.nome,
                        )}
                        onChange={() => alternarParticipante(funcionario.nome)}
                        className="h-5 w-5 accent-yellow-400"
                      />
                      <span className="font-bold text-zinc-200">
                        {funcionario.nome}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-xs font-black uppercase text-zinc-400">
                    Status
                  </span>
                  <select
                    value={formulario.status}
                    onChange={(evento) =>
                      setFormulario({
                        ...formulario,
                        status: evento.target
                          .value as FormularioTreinamento["status"],
                      })
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                  >
                    <option>Agendado</option>
                    <option>Concluído</option>
                    <option>Cancelado</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-xs font-black uppercase text-zinc-400">
                    Observações
                  </span>
                  <textarea
                    value={formulario.observacoes}
                    onChange={(evento) =>
                      setFormulario({
                        ...formulario,
                        observacoes: evento.target.value,
                      })
                    }
                    rows={4}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    limparFormulario();
                    setSecaoAtiva("lista");
                  }}
                  className="rounded-xl border border-zinc-700 px-5 py-3 font-black uppercase text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black"
                >
                  {editandoId ? "Salvar alterações" : "Cadastrar treinamento"}
                </button>
              </div>
            </form>
          )}

          {secaoAtiva === "lista" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase text-yellow-400">
                    Treinamentos programados
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Consulte tema, data, instrutor e participantes.
                  </p>
                </div>

                <input
                  type="text"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Pesquisar treinamento..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400 md:max-w-sm"
                />
              </div>

              <div className="mt-5 space-y-3">
                {treinamentosVisiveis.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
                    Nenhum treinamento encontrado.
                  </div>
                ) : (
                  treinamentosVisiveis.map((treinamento) => (
                    <article
                      key={treinamento.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-black text-white">
                              {treinamento.tema}
                            </h4>
                            <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-400">
                              {treinamento.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-zinc-300">
                            {treinamento.data} às {treinamento.horario}
                          </p>
                          {treinamento.local && (
                            <p className="mt-1 text-sm text-zinc-400">
                              Local: {treinamento.local}
                            </p>
                          )}
                          {treinamento.responsavel && (
                            <p className="mt-1 text-sm text-zinc-400">
                              Responsável: {treinamento.responsavel}
                            </p>
                          )}
                          {treinamento.fornecedor && (
                            <p className="mt-1 text-sm text-zinc-400">
                              Fornecedor/parceiro: {treinamento.fornecedor}
                            </p>
                          )}
                          <p className="mt-2 text-sm text-zinc-500">
                            Participantes:{" "}
                            {treinamento.participantes.join(", ") || "—"}
                          </p>
                          {treinamento.observacoes && (
                            <p className="mt-2 text-sm text-zinc-500">
                              {treinamento.observacoes}
                            </p>
                          )}
                        </div>

                        {ehAdministrador && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => editar(treinamento)}
                              className="rounded-xl border border-yellow-400 px-4 py-2 text-xs font-black uppercase text-yellow-400"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => excluir(treinamento.id)}
                              className="rounded-xl border border-red-500 px-4 py-2 text-xs font-black uppercase text-red-400"
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </section>
  );
}

function Campo({
  label,
  valor,
  onChange,
  tipo = "text",
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  tipo?: "text" | "date" | "time";
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase text-zinc-400">
        {label}
      </span>
      <input
        type={tipo}
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </label>
  );
}