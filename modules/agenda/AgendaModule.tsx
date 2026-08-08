"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import CardServico from "./CardServico";
import ModalServico from "./ModalServico";
import { Cliente, Funcionario, PerfilUsuario, Servico } from "./types";

const CHAVE_CLIENTES = "choqueseg-pro-clientes";
const CHAVE_AGENDA = "choqueseg-pro-agenda";
const CHAVE_FUNCIONARIOS = "choqueseg-funcionarios";

export default function AgendaModule({
  perfil,
  usuarioNome,
}: {
  perfil: PerfilUsuario;
  usuarioNome: string;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [equipe, setEquipe] = useState("");
  const [descricao, setDescricao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState<string | null>(null);

  const ehAdministrador = perfil === "administrador";

  useEffect(() => {
    const clientesSalvos = localStorage.getItem(CHAVE_CLIENTES);
    const agendaSalva = localStorage.getItem(CHAVE_AGENDA);
    const funcionariosSalvos = localStorage.getItem(CHAVE_FUNCIONARIOS);

    try {
      if (clientesSalvos) setClientes(JSON.parse(clientesSalvos));
      if (funcionariosSalvos) setFuncionarios(JSON.parse(funcionariosSalvos));
      if (agendaSalva) setServicos(JSON.parse(agendaSalva));
    } catch {
      localStorage.removeItem(CHAVE_AGENDA);
      setServicos([]);
      setMensagem("Alguns dados da agenda estavam inválidos e foram reiniciados.");
    }

    setDadosCarregados(true);
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;
    localStorage.setItem(CHAVE_AGENDA, JSON.stringify(servicos));
  }, [servicos, dadosCarregados]);

  const servicosVisiveis = useMemo(() => {
    return [...servicos].sort((a, b) =>
      `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`),
    );
  }, [servicos]);

  const servicoSelecionado = servicoSelecionadoId
    ? servicos.find((servico) => servico.id === servicoSelecionadoId) ?? null
    : null;

  function agendarServico(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const cliente = clientes.find((item) => item.id === clienteId);

    if (!cliente) {
      setMensagem("Selecione um cliente.");
      return;
    }

    if (!data || !horario || !equipe.trim()) {
      setMensagem("Preencha data, horário e funcionário responsável.");
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
      equipe: equipe.trim(),
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

    setServicos((atuais) => [...atuais, novoServico]);
    setClienteId("");
    setData("");
    setHorario("");
    setEquipe("");
    setDescricao("");
    setMensagem("Serviço agendado com sucesso.");
  }

  function salvarServico(atualizado: Servico) {
    setServicos((atuais) =>
      atuais.map((servico) =>
        servico.id === atualizado.id ? atualizado : servico,
      ),
    );
  }

  function alterarStatus(
    servicoId: string,
    novoStatus: Servico["status"],
  ) {
    if (!ehAdministrador) return;

    setServicos((atuais) =>
      atuais.map((servico) =>
        servico.id === servicoId
          ? {
              ...servico,
              status: novoStatus,
              historico: [
                ...(servico.historico ?? []),
                {
                  id: crypto.randomUUID(),
                  dataHora: new Date().toISOString(),
                  usuario: usuarioNome,
                  descricao: `Status alterado para ${novoStatus}`,
                },
              ],
            }
          : servico,
      ),
    );
  }

  function excluirServico(servicoId: string) {
    if (!ehAdministrador) return;

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
          "Agenda de serviços"
        </h2>
        <p className="mt-2 text-zinc-400">
          {ehAdministrador
            ? "Agende serviços, selecione o responsável e acompanhe o andamento."
            : "Consulte e execute os serviços da equipe CHOQUESEG."}
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

            <Campo label="Data" tipo="date" valor={data} onChange={setData} />
            <Campo label="Horário" tipo="time" valor={horario} onChange={setHorario} />

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-zinc-400">
                Funcionário responsável
              </label>
              <select
                value={equipe}
                onChange={(evento) => setEquipe(evento.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option value="">Selecione um funcionário</option>
                {funcionarios
                  .filter((funcionario) => funcionario.status === "Ativo")
                  .map((funcionario) => (
                    <option key={funcionario.id} value={funcionario.nome}>
                      {funcionario.nome}
                    </option>
                  ))}
              </select>
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

      <div className="mt-7 space-y-4">
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

      {servicoSelecionado && (
        <ModalServico
          servico={servicoSelecionado}
          usuarioNome={usuarioNome}
          ehAdministrador={ehAdministrador}
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