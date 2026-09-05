"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

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
  | "Novo Cliente"
  | "Orçamento Solicitado"
  | "Orçamento Enviado"
  | "Cliente Ainda Não Decidiu"
  | "Cliente Desistiu / Fechou com Outra Empresa"
  | "Serviço Fechado / Adiantamento Pago"
  | "Serviço Agendado"
  | "Em Execução"
  | "Serviço Concluído"
  | "Etapa de Obra"
  | "Projeto Aprovado"
  | "Solicitar Vistoria"
  | "Medidor Trocado"
  | "Pós-venda";

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  cpfCnpj: string;
  tipoServico: TipoServico;
  origem: OrigemCliente;
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
  cpf_cnpj: string | null;
  tipo_servico: string | null;
  origem: string | null;
  observacoes: string | null;
  status: string | null;
  criado_em: string | null;
  retorno_em: string | null;
};

const supabase = createClient();

function normalizarStatusLegado(status?: string | null): StatusCliente {
  const mapa: Record<string, StatusCliente> = {
    "Novo Contato": "Novo Cliente",
    "Novo Cliente": "Novo Cliente",
    "Orçamento Solicitado": "Orçamento Solicitado",
    "Orçamento Enviado": "Orçamento Enviado",
    "Retorno em 2 dias": "Cliente Ainda Não Decidiu",
    "Negociação": "Cliente Ainda Não Decidiu",
    "Cliente Ainda Não Decidiu": "Cliente Ainda Não Decidiu",
    "Cliente Desistiu / Fechou com Outra Empresa":
      "Cliente Desistiu / Fechou com Outra Empresa",
    "Serviço Fechado": "Serviço Fechado / Adiantamento Pago",
    "Serviço Fechado / Adiantamento Pago":
      "Serviço Fechado / Adiantamento Pago",
    "Agendado": "Serviço Agendado",
    "Serviço Agendado": "Serviço Agendado",
    "Em Execução": "Em Execução",
    "Concluído": "Serviço Concluído",
    "Serviço Concluído": "Serviço Concluído",
    "Etapa de Obra": "Etapa de Obra",
    "Projeto Aprovado": "Projeto Aprovado",
    "Solicitar Vistoria": "Solicitar Vistoria",
    "Medidor Trocado": "Medidor Trocado",
    "Pós-venda": "Pós-venda",
  };

  return mapa[String(status ?? "")] ?? "Novo Cliente";
}

function clienteBancoParaApp(item: ClienteBanco): Cliente {
  const agora = new Date().toISOString();

  return {
    id: item.id,
    nome: item.nome,
    telefone: item.telefone ?? "",
    cidade: item.cidade ?? "",
    endereco: item.endereco ?? "",
    cpfCnpj: item.cpf_cnpj ?? "",
    tipoServico: (item.tipo_servico ?? "Energia Solar") as TipoServico,
    origem: (item.origem ?? "WhatsApp") as OrigemCliente,
    observacoes: item.observacoes ?? "",
    status: normalizarStatusLegado(item.status),
    criadoEm: item.criado_em ?? agora,
    retornoEm: item.retorno_em ?? "",
  };
}

function clienteAppParaBanco(cliente: Cliente) {
  return {
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    cidade: cliente.cidade,
    endereco: cliente.endereco,
    cpf_cnpj: cliente.cpfCnpj,
    tipo_servico: cliente.tipoServico,
    origem: cliente.origem,
    observacoes: cliente.observacoes,
    status: cliente.status,
    criado_em: cliente.criadoEm,
    retorno_em: cliente.retornoEm?.trim() ? cliente.retornoEm : null,
  };
}

type FormularioCliente = {
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  cpfCnpj: string;
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
  cpfCnpj: "",
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
  if (!dataIso) return "Não definido";

  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return "Não definido";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export default function ClientesModule() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formulario, setFormulario] =
    useState<FormularioCliente>(formularioInicial);
  const [busca, setBusca] = useState("");
  const [clienteEmEdicao, setClienteEmEdicao] =
    useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState<"lista" | "cadastro">("lista");
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    void carregarClientes();
  }, []);

  async function carregarClientes() {
    setCarregando(true);
    setMensagem("");

    const { data, error } = await supabase
      .from("clientes")
      .select(
        "id,nome,telefone,cidade,endereco,cpf_cnpj,tipo_servico,origem,observacoes,status,criado_em,retorno_em",
      )
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar clientes do Supabase:", error);
      setMensagem(`Erro ao carregar clientes da nuvem: ${error.message}`);
      setCarregando(false);
      return;
    }

    let listaNuvem = (data ?? []).map((item) =>
      clienteBancoParaApp(item as ClienteBanco),
    );

    // Se a nuvem ainda estiver vazia, migra os clientes que já existiam
    // no navegador para evitar perda de dados.
    if (listaNuvem.length === 0) {
      const dadosLocais = localStorage.getItem(CHAVE_CLIENTES);

      if (dadosLocais) {
        try {
          const antigosBrutos = JSON.parse(dadosLocais) as Cliente[];
          const antigos = Array.isArray(antigosBrutos)
            ? antigosBrutos.map((cliente) => ({
                ...cliente,
                status: normalizarStatusLegado(String(cliente.status)),
                retornoEm: cliente.retornoEm ?? "",
              }))
            : [];

          if (antigos.length > 0) {
            const { data: migrados, error: erroMigracao } = await supabase
              .from("clientes")
              .upsert(antigos.map(clienteAppParaBanco), { onConflict: "id" })
              .select(
                "id,nome,telefone,cidade,endereco,cpf_cnpj,tipo_servico,origem,observacoes,status,criado_em,retorno_em",
              );

            if (erroMigracao) {
              console.error("Erro ao migrar clientes:", erroMigracao);
              setMensagem(`Falha ao migrar clientes antigos: ${erroMigracao.message}`);
            } else {
              listaNuvem = (migrados ?? []).map((item) =>
                clienteBancoParaApp(item as ClienteBanco),
              );
              setMensagem("Clientes antigos migrados para a nuvem com sucesso.");
            }
          }
        } catch (erro) {
          console.error("Erro ao ler clientes locais:", erro);
        }
      }
    }

    setClientes(listaNuvem);

    // Cópia temporária para os módulos que ainda dependem de localStorage.
    localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(listaNuvem));
    setCarregando(false);
  }

const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return clientes;

    return clientes.filter((cliente) =>
      [
        cliente.nome,
        cliente.telefone,
        cliente.cidade,
        cliente.endereco,
        cliente.cpfCnpj,
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

  async function salvarCliente(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    if (!formulario.nome.trim() || !formulario.telefone.trim()) {
      setMensagem("Preencha pelo menos o nome e o telefone.");
      return;
    }

    if (clienteEmEdicao) {
      const clienteAtual = clientes.find(
        (cliente) => cliente.id === clienteEmEdicao,
      );

      if (!clienteAtual) return;

      const atualizado: Cliente = {
        ...clienteAtual,
        ...formulario,
        nome: formulario.nome.trim(),
        telefone: formulario.telefone.trim(),
        cidade: formulario.cidade.trim(),
        endereco: formulario.endereco.trim(),
        cpfCnpj: formulario.cpfCnpj.trim(),
        observacoes: formulario.observacoes.trim(),
      };

      const { error } = await supabase
        .from("clientes")
        .update(clienteAppParaBanco(atualizado))
        .eq("id", clienteEmEdicao);

      if (error) {
        console.error("Erro ao atualizar cliente:", error);
        setMensagem(`Erro ao atualizar cliente: ${error.message}`);
        return;
      }

      const novaLista = clientes.map((cliente) =>
        cliente.id === clienteEmEdicao ? atualizado : cliente,
      );

      setClientes(novaLista);
      localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(novaLista));
      setMensagem("Cliente atualizado e sincronizado com a nuvem.");
    } else {
      const agora = new Date();

      const novoCliente: Cliente = {
        id: crypto.randomUUID(),
        nome: formulario.nome.trim(),
        telefone: formulario.telefone.trim(),
        cidade: formulario.cidade.trim(),
        endereco: formulario.endereco.trim(),
        cpfCnpj: formulario.cpfCnpj.trim(),
        tipoServico: formulario.tipoServico,
        origem: formulario.origem,
        observacoes: formulario.observacoes.trim(),
        status: "Novo Cliente",
        criadoEm: agora.toISOString(),
        retornoEm: "",
      };

      const { error } = await supabase
        .from("clientes")
        .insert(clienteAppParaBanco(novoCliente));

      if (error) {
        console.error("Erro ao cadastrar cliente:", error);
        setMensagem(`Erro ao cadastrar cliente: ${error.message}`);
        return;
      }

      const novaLista = [novoCliente, ...clientes];
      setClientes(novaLista);
      localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(novaLista));
      setMensagem("Cliente cadastrado e sincronizado com a nuvem.");
    }

    setFormulario(formularioInicial);
    setClienteEmEdicao(null);
    setSecaoAtiva("lista");
  }

  function editarCliente(cliente: Cliente) {
    setFormulario({
      nome: cliente.nome,
      telefone: cliente.telefone,
      cidade: cliente.cidade,
      endereco: cliente.endereco,
      cpfCnpj: cliente.cpfCnpj,
      tipoServico: cliente.tipoServico,
      origem: cliente.origem,
      observacoes: cliente.observacoes,
    });

    setClienteEmEdicao(cliente.id);
    setSecaoAtiva("cadastro");
    setMensagem("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setFormulario(formularioInicial);
    setClienteEmEdicao(null);
    setMensagem("");
  }

  async function excluirCliente(id: string) {
    const confirmar = window.confirm(
      "Tem certeza de que deseja excluir este cliente?",
    );

    if (!confirmar) return;

    const { error } = await supabase.from("clientes").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir cliente:", error);
      setMensagem(`Erro ao excluir cliente: ${error.message}`);
      return;
    }

    const novaLista = clientes.filter((cliente) => cliente.id !== id);
    setClientes(novaLista);
    localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(novaLista));

    if (clienteEmEdicao === id) {
      cancelarEdicao();
    }

    setMensagem("Cliente excluído da nuvem.");
  }

  async function atualizarStatus(id: string, status: StatusCliente) {
    const clienteAtual = clientes.find((cliente) => cliente.id === id);
    if (!clienteAtual) return;

    const retornoEm =
      status === "Orçamento Enviado"
        ? adicionarDoisDias(new Date())
        : clienteAtual.retornoEm;

    const { error } = await supabase
      .from("clientes")
      .update({
        status,
        retorno_em: retornoEm?.trim() ? retornoEm : null,
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar status:", error);
      setMensagem(`Erro ao atualizar status: ${error.message}`);
      return;
    }

    const novaLista = clientes.map((cliente) =>
      cliente.id === id
        ? {
            ...cliente,
            status,
            retornoEm,
          }
        : cliente,
    );

    setClientes(novaLista);
    localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(novaLista));
  }

  return (
    <section className="p-4 md:p-7">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          CRM CHOQUESEG
        </p>
        <h2 className="mt-1 text-3xl font-black uppercase">Clientes</h2>
        <p className="mt-2 text-zinc-400">
          Escolha uma opção no menu para cadastrar ou consultar clientes.
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-zinc-800 bg-black p-2">
            <p className="px-3 py-2 text-xs font-black uppercase text-zinc-500">
              Menu de clientes
            </p>

            <nav className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setSecaoAtiva("lista");
                  cancelarEdicao();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
                  secaoAtiva === "lista"
                    ? "bg-yellow-400 text-black"
                    : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
                }`}
              >
                <span className="text-lg">👥</span>
                <span>Clientes cadastrados</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cancelarEdicao();
                  setSecaoAtiva("cadastro");
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
                  secaoAtiva === "cadastro"
                    ? "bg-yellow-400 text-black"
                    : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
                }`}
              >
                <span className="text-lg">➕</span>
                <span>Novo cliente</span>
              </button>
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {mensagem && (
            <div className="mb-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-300">
              {mensagem}
            </div>
          )}

          {secaoAtiva === "cadastro" && (
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
      label="CPF / CNPJ"
      valor={formulario.cpfCnpj}
      placeholder="Digite o CPF ou CNPJ"
      onChange={(valor) => atualizarCampo("cpfCnpj", valor)}
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
          )}

          {secaoAtiva === "lista" && (
            <div className="rounded-3xl border border-zinc-800 bg-black p-5">
              {carregando && (
                <div className="mb-4 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-sm font-bold text-yellow-300">
                  Sincronizando clientes com a nuvem...
                </div>
              )}
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

              {cliente.cpfCnpj && (
                <p className="mt-1 text-sm text-zinc-400">
                  CPF/CNPJ: {cliente.cpfCnpj}
                </p>
              )}

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
              <option>Novo Cliente</option>
              <option>Orçamento Solicitado</option>
              <option>Orçamento Enviado</option>
              <option>Cliente Ainda Não Decidiu</option>
              <option>Cliente Desistiu / Fechou com Outra Empresa</option>
              <option>Serviço Fechado / Adiantamento Pago</option>
              <option>Serviço Agendado</option>
              <option>Em Execução</option>
              <option>Serviço Concluído</option>
              <option>Etapa de Obra</option>
              <option>Projeto Aprovado</option>
              <option>Solicitar Vistoria</option>
              <option>Medidor Trocado</option>
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
          )}
        </main>
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