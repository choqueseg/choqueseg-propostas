"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type TipoServico =
  | "Energia Solar"
  | "Segurança Eletrônica"
  | "Elétrica"
  | "Automação";

type OrigemCliente =
  | "WhatsApp"
  | "Instagram"
  | "Indicação"
  | "Google"
  | "Outro";

type StatusCliente =
  | "Novo Contato"
  | "Orçamento Solicitado"
  | "Orçamento Enviado"
  | "Retorno em 2 dias"
  | "Negociação"
  | "Serviço Fechado"
  | "Agendado"
  | "Em Execução"
  | "Concluído"
  | "Pós-venda";

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  tipoServico: TipoServico;
  origem: OrigemCliente;
  observacoes: string;
  status: StatusCliente;
  criadoEm: string;
  retornoEm: string;
};

type FormularioCliente = {
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  tipoServico: TipoServico;
  origem: OrigemCliente;
  observacoes: string;
};

const CHAVE_CLIENTES = "choqueseg-pro-clientes";

const formularioInicial: FormularioCliente = {
  nome: "",
  telefone: "",
  cidade: "",
  endereco: "",
  tipoServico: "Energia Solar",
  origem: "WhatsApp",
  observacoes: "",
};

function adicionarDoisDias(data: Date) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + 2);
  return novaData.toISOString();
}

function formatarData(dataIso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dataIso));
}

export default function ClientesModule() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formulario, setFormulario] =
    useState<FormularioCliente>(formularioInicial);
  const [busca, setBusca] = useState("");
  const [clienteEmEdicao, setClienteEmEdicao] =
    useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
 const [dadosCarregados, setDadosCarregados] = useState(false);
  useEffect(() => {
  const dadosSalvos = localStorage.getItem(CHAVE_CLIENTES);

  if (dadosSalvos) {
    try {
      const clientesSalvos = JSON.parse(dadosSalvos) as Cliente[];
      setClientes(clientesSalvos);
    } catch {
      localStorage.removeItem(CHAVE_CLIENTES);
    }
  }

  setDadosCarregados(true);
}, []);

useEffect(() => {
  if (!dadosCarregados) return;

  localStorage.setItem(
    CHAVE_CLIENTES,
    JSON.stringify(clientes),
  );
}, [clientes, dadosCarregados]);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return clientes;

    return clientes.filter((cliente) =>
      [
        cliente.nome,
        cliente.telefone,
        cliente.cidade,
        cliente.endereco,
        cliente.tipoServico,
        cliente.origem,
        cliente.status,
      ].some((campo) => campo.toLowerCase().includes(termo)),
    );
  }, [busca, clientes]);

  function atualizarCampo(
    campo: keyof FormularioCliente,
    valor: string,
  ) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function salvarCliente(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    if (!formulario.nome.trim() || !formulario.telefone.trim()) {
      setMensagem("Preencha pelo menos o nome e o telefone.");
      return;
    }

    if (clienteEmEdicao) {
      setClientes((atuais) =>
        atuais.map((cliente) =>
          cliente.id === clienteEmEdicao
            ? {
                ...cliente,
                ...formulario,
              }
            : cliente,
        ),
      );

      setMensagem("Cliente atualizado com sucesso.");
    } else {
      const agora = new Date();

      const novoCliente: Cliente = {
        id: crypto.randomUUID(),
        nome: formulario.nome.trim(),
        telefone: formulario.telefone.trim(),
        cidade: formulario.cidade.trim(),
        endereco: formulario.endereco.trim(),
        tipoServico: formulario.tipoServico,
        origem: formulario.origem,
        observacoes: formulario.observacoes.trim(),
        status: "Novo Contato",
        criadoEm: agora.toISOString(),
        retornoEm: adicionarDoisDias(agora),
      };

      setClientes((atuais) => [novoCliente, ...atuais]);
      setMensagem("Cliente cadastrado e enviado para Novo Contato.");
    }

    setFormulario(formularioInicial);
    setClienteEmEdicao(null);
  }

  function editarCliente(cliente: Cliente) {
    setFormulario({
      nome: cliente.nome,
      telefone: cliente.telefone,
      cidade: cliente.cidade,
      endereco: cliente.endereco,
      tipoServico: cliente.tipoServico,
      origem: cliente.origem,
      observacoes: cliente.observacoes,
    });

    setClienteEmEdicao(cliente.id);
    setMensagem("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setFormulario(formularioInicial);
    setClienteEmEdicao(null);
    setMensagem("");
  }

  function excluirCliente(id: string) {
    const confirmar = window.confirm(
      "Tem certeza de que deseja excluir este cliente?",
    );

    if (!confirmar) return;

    setClientes((atuais) =>
      atuais.filter((cliente) => cliente.id !== id),
    );

    if (clienteEmEdicao === id) {
      cancelarEdicao();
    }
  }

  function atualizarStatus(id: string, status: StatusCliente) {
    setClientes((atuais) =>
      atuais.map((cliente) =>
        cliente.id === id
          ? {
              ...cliente,
              status,
              retornoEm:
                status === "Retorno em 2 dias"
                  ? adicionarDoisDias(new Date())
                  : cliente.retornoEm,
            }
          : cliente,
      ),
    );
  }

  return (
    <section className="p-4 md:p-7">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          CRM CHOQUESEG
        </p>

        <h2 className="mt-1 text-3xl font-black uppercase">
          Cadastro de clientes
        </h2>

        <p className="mt-2 text-zinc-400">
          Cadastre, edite e acompanhe os clientes da CHOQUESEG.
        </p>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={salvarCliente}
          className="rounded-3xl border border-yellow-400/30 bg-black p-5"
        >
          <h3 className="text-xl font-black uppercase text-yellow-400">
            {clienteEmEdicao
              ? "Editar cliente"
              : "Novo cliente"}
          </h3>

          <div className="mt-5 space-y-4">
            <Campo
              label="Nome do cliente"
              valor={formulario.nome}
              placeholder="Digite o nome completo"
              onChange={(valor) => atualizarCampo("nome", valor)}
            />

            <Campo
              label="Telefone"
              valor={formulario.telefone}
              placeholder="(79) 9.9999-9999"
              onChange={(valor) => atualizarCampo("telefone", valor)}
            />

            <Campo
              label="Cidade"
              valor={formulario.cidade}
              placeholder="Ex.: Aracaju"
              onChange={(valor) => atualizarCampo("cidade", valor)}
            />

            <Campo
              label="Endereço"
              valor={formulario.endereco}
              placeholder="Rua, número, bairro e complemento"
              onChange={(valor) => atualizarCampo("endereco", valor)}
            />

            <div>
              <label className="mb-2 block text-sm font-bold uppercase text-zinc-300">
                Tipo de serviço
              </label>

              <select
                value={formulario.tipoServico}
                onChange={(evento) =>
                  atualizarCampo(
                    "tipoServico",
                    evento.target.value,
                  )
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option>Energia Solar</option>
                <option>Segurança Eletrônica</option>
                <option>Elétrica</option>
                <option>Automação</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase text-zinc-300">
                Origem do cliente
              </label>

              <select
                value={formulario.origem}
                onChange={(evento) =>
                  atualizarCampo("origem", evento.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option>WhatsApp</option>
                <option>Instagram</option>
                <option>Indicação</option>
                <option>Google</option>
                <option>Outro</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase text-zinc-300">
                Observações
              </label>

              <textarea
                value={formulario.observacoes}
                onChange={(evento) =>
                  atualizarCampo(
                    "observacoes",
                    evento.target.value,
                  )
                }
                rows={4}
                placeholder="Informações importantes sobre o cliente"
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {mensagem && (
            <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-300">
              {mensagem}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-yellow-400 px-4 py-3 font-black uppercase text-black"
            >
              {clienteEmEdicao
                ? "Salvar alterações"
                : "Cadastrar cliente"}
            </button>

            {clienteEmEdicao && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="rounded-xl border border-zinc-600 px-4 py-3 font-black uppercase text-zinc-300"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-black uppercase text-yellow-400">
                Clientes cadastrados
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Total: {clientes.length}
              </p>
            </div>

            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar nome, telefone, cidade..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400 lg:max-w-sm"
            />
          </div>

          <div className="mt-5 space-y-4">
            {clientesFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-8 text-center">
                <p className="text-4xl">👥</p>

                <p className="mt-3 font-black uppercase text-white">
                  Nenhum cliente encontrado
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  Cadastre o primeiro cliente da CHOQUESEG.
                </p>
              </div>
            ) : (
              clientesFiltrados.map((cliente) => (
                <article
                  key={cliente.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h4 className="text-lg font-black uppercase text-white">
                        {cliente.nome}
                      </h4>

                      <p className="mt-1 text-yellow-400">
                        {cliente.telefone}
                      </p>

                      <p className="mt-2 text-sm text-zinc-400">
                        {cliente.cidade || "Cidade não informada"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {cliente.endereco ||
                          "Endereço não informado"}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-400">
                      {cliente.tipoServico}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                    <Informacao
                      titulo="Origem"
                      valor={cliente.origem}
                    />

                    <Informacao
                      titulo="Status"
                      valor={cliente.status}
                    />

                    <Informacao
                      titulo="Cadastro"
                      valor={formatarData(cliente.criadoEm)}
                    />

                    <Informacao
                      titulo="Próximo retorno"
                      valor={formatarData(cliente.retornoEm)}
                    />
                  </div>

                  {cliente.observacoes && (
                    <div className="mt-4 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-400">
                      {cliente.observacoes}
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-3 xl:flex-row">
                    <select
                      value={cliente.status}
                      onChange={(evento) =>
                        atualizarStatus(
                          cliente.id,
                          evento.target.value as StatusCliente,
                        )
                      }
                      className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm font-bold text-white outline-none focus:border-yellow-400"
                    >
                      <option>Novo Contato</option>
                      <option>Orçamento Solicitado</option>
                      <option>Orçamento Enviado</option>
                      <option>Retorno em 2 dias</option>
                      <option>Negociação</option>
                      <option>Serviço Fechado</option>
                      <option>Agendado</option>
                      <option>Em Execução</option>
                      <option>Concluído</option>
                      <option>Pós-venda</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => editarCliente(cliente)}
                      className="rounded-xl border border-yellow-400 px-4 py-2 text-sm font-black uppercase text-yellow-400"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirCliente(cliente.id)}
                      className="rounded-xl border border-red-500/60 px-4 py-2 text-sm font-black uppercase text-red-400"
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Campo({
  label,
  valor,
  placeholder,
  onChange,
}: {
  label: string;
  valor: string;
  placeholder: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold uppercase text-zinc-300">
        {label}
      </label>

      <input
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function Informacao({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-3">
      <p className="text-xs font-bold uppercase text-zinc-500">
        {titulo}
      </p>

      <p className="mt-1 font-bold text-zinc-200">{valor}</p>
    </div>
  );
}