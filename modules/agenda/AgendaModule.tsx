"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type PerfilUsuario = "administrador" | "funcionario";

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  tipoServico: string;
};

type Servico = {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipoServico: string;
  data: string;
  horario: string;
  endereco: string;
  cidade: string;
  equipe: string;
  descricao: string;
  status: "Agendado" | "Em execução" | "Concluído";
};

const CHAVE_CLIENTES = "choqueseg-pro-clientes";
const CHAVE_AGENDA = "choqueseg-pro-agenda";

export default function AgendaModule({
  perfil,
}: {
  perfil: PerfilUsuario;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [equipe, setEquipe] = useState("");
  const [descricao, setDescricao] = useState("");
  const [mensagem, setMensagem] = useState("");

  const ehAdministrador = perfil === "administrador";

  useEffect(() => {
    const clientesSalvos = localStorage.getItem(CHAVE_CLIENTES);
    const agendaSalva = localStorage.getItem(CHAVE_AGENDA);

    try {
      if (clientesSalvos) {
        setClientes(JSON.parse(clientesSalvos));
      }

      if (agendaSalva) {
        setServicos(JSON.parse(agendaSalva));
      }
    } catch {
      localStorage.removeItem(CHAVE_AGENDA);
      setServicos([]);
    }

    setDadosCarregados(true);
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;

    localStorage.setItem(CHAVE_AGENDA, JSON.stringify(servicos));
  }, [servicos, dadosCarregados]);

  const servicosOrdenados = useMemo(() => {
    return [...servicos].sort((a, b) => {
      return `${a.data}T${a.horario}`.localeCompare(
        `${b.data}T${b.horario}`,
      );
    });
  }, [servicos]);

  function agendarServico(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const cliente = clientes.find((item) => item.id === clienteId);

    if (!cliente) {
      setMensagem("Selecione um cliente.");
      return;
    }

    if (!data || !horario || !equipe.trim()) {
      setMensagem("Preencha data, horário e equipe.");
      return;
    }

    const novoServico: Servico = {
      id: crypto.randomUUID(),
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      tipoServico: cliente.tipoServico,
      data,
      horario,
      endereco: cliente.endereco,
      cidade: cliente.cidade,
      equipe: equipe.trim(),
      descricao: descricao.trim(),
      status: "Agendado",
    };

    setServicos((atuais) => [...atuais, novoServico]);

    setClienteId("");
    setData("");
    setHorario("");
    setEquipe("");
    setDescricao("");

    setMensagem("Serviço agendado com sucesso.");
  }

  function alterarStatus(
    servicoId: string,
    novoStatus: Servico["status"],
  ) {
    setServicos((atuais) =>
      atuais.map((servico) =>
        servico.id === servicoId
          ? {
              ...servico,
              status: novoStatus,
            }
          : servico,
      ),
    );
  }

  function excluirServico(servicoId: string) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este serviço?",
    );

    if (!confirmar) return;

    setServicos((atuais) =>
      atuais.filter((servico) => servico.id !== servicoId),
    );
  }

  function abrirMaps(endereco: string, cidade: string) {
    const destino = encodeURIComponent(`${endereco}, ${cidade}`);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${destino}`,
      "_blank",
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
          Agende serviços, selecione a equipe e acompanhe o andamento.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      {ehAdministrador && (
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

            <Campo
              label="Data"
              tipo="date"
              valor={data}
              onChange={setData}
            />

            <Campo
              label="Horário"
              tipo="time"
              valor={horario}
              onChange={setHorario}
            />

            <Campo
              label="Equipe"
              valor={equipe}
              placeholder="Ex.: Carlos e Marcos"
              onChange={setEquipe}
            />

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

      <div className="mt-7 space-y-4">
        {servicosOrdenados.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-700 bg-black p-10 text-center">
            <p className="text-5xl">📅</p>

            <p className="mt-4 font-black uppercase">
              Nenhum serviço agendado
            </p>
          </div>
        ) : (
          servicosOrdenados.map((servico) => (
            <article
              key={servico.id}
              className="rounded-2xl border border-zinc-800 bg-black p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase">
                    {servico.clienteNome}
                  </h3>

                  <div className="mt-2 space-y-1 text-sm text-zinc-400">
                    <p>
                      📅 {servico.data} às {servico.horario}
                    </p>
                    <p>🛠 {servico.tipoServico}</p>
                    <p>👷 {servico.equipe}</p>
                    <p>
                      📍 {servico.endereco}, {servico.cidade}
                    </p>
                    {servico.descricao && (
                      <p>📝 {servico.descricao}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      abrirMaps(servico.endereco, servico.cidade)
                    }
                    className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black uppercase text-black"
                  >
                    Abrir no Maps
                  </button>

                  <select
                    value={servico.status}
                    onChange={(evento) =>
                      alterarStatus(
                        servico.id,
                        evento.target.value as Servico["status"],
                      )
                    }
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-bold text-white"
                  >
                    <option>Agendado</option>
                    <option>Em execução</option>
                    <option>Concluído</option>
                  </select>

                  {ehAdministrador && (
                    <button
                      type="button"
                      onClick={() => excluirServico(servico.id)}
                      className="rounded-xl border border-red-500/60 px-4 py-2 text-sm font-black uppercase text-red-400"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
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