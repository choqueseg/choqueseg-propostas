"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SituacaoRecebimento =
  | "Pendente"
  | "Recebido"
  | "Atrasado"
  | "Parcial";

type ContaReceber = {
  id: string;
  descricao: string;
  cliente: string;
  categoria: string;
  valorTotal: number;
  valorRecebido: number;
  vencimento: string;
  formaRecebimento: string;
  contaFinanceira: string;
  situacao: SituacaoRecebimento;
  observacao?: string;
  criadoEm: string;
};

const CHAVE_CONTAS_RECEBER =
  "choqueseg-financeiro-contas-receber";

const categorias = [
  "Venda",
  "Serviço",
  "Energia Solar",
  "Segurança Eletrônica",
  "Elétrica",
  "Automação",
  "Manutenção",
  "Outros",
];

const formasRecebimento = [
  "PIX",
  "Dinheiro",
  "Débito",
  "Crédito",
  "Transferência",
  "Boleto",
  "Outro",
];

export default function ContasReceber() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [cliente, setCliente] = useState("");
  const [categoria, setCategoria] = useState("Venda");
  const [valorTotal, setValorTotal] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [formaRecebimento, setFormaRecebimento] =
    useState("PIX");
  const [contaFinanceira, setContaFinanceira] = useState("");
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState<
    "Todas" | SituacaoRecebimento
  >("Todas");

  useEffect(() => {
    const dadosSalvos = localStorage.getItem(
      CHAVE_CONTAS_RECEBER,
    );

    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos);
        setContas(Array.isArray(dados) ? dados : []);
      } catch {
        localStorage.removeItem(CHAVE_CONTAS_RECEBER);
        setContas([]);
        setMensagem(
          "Os dados das contas a receber estavam inválidos e foram reiniciados.",
        );
      }
    }

    setDadosCarregados(true);
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;

    localStorage.setItem(
      CHAVE_CONTAS_RECEBER,
      JSON.stringify(contas),
    );
  }, [contas, dadosCarregados]);

  function calcularSituacao(
    valor: number,
    recebido: number,
    vencimentoConta: string,
  ): SituacaoRecebimento {
    const hoje = new Date().toISOString().slice(0, 10);

    if (recebido >= valor) return "Recebido";
    if (recebido > 0) return "Parcial";
    if (vencimentoConta && vencimentoConta < hoje) {
      return "Atrasado";
    }

    return "Pendente";
  }

  const contasAtualizadas = useMemo(() => {
    return contas.map((conta) => ({
      ...conta,
      situacao: calcularSituacao(
        conta.valorTotal,
        conta.valorRecebido,
        conta.vencimento,
      ),
    }));
  }, [contas]);

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return contasAtualizadas
      .filter((conta) => {
        const atendeBusca =
          !termo ||
          conta.descricao.toLowerCase().includes(termo) ||
          conta.cliente.toLowerCase().includes(termo) ||
          conta.categoria.toLowerCase().includes(termo);

        const atendeSituacao =
          filtroSituacao === "Todas" ||
          conta.situacao === filtroSituacao;

        return atendeBusca && atendeSituacao;
      })
      .sort((a, b) =>
        a.vencimento.localeCompare(b.vencimento),
      );
  }, [contasAtualizadas, busca, filtroSituacao]);

  const resumo = useMemo(() => {
    let totalPrevisto = 0;
    let totalRecebido = 0;
    let totalPendente = 0;
    let totalAtrasado = 0;

    for (const conta of contasAtualizadas) {
      const restante = Math.max(
        0,
        conta.valorTotal - conta.valorRecebido,
      );

      totalPrevisto += conta.valorTotal;
      totalRecebido += conta.valorRecebido;

      if (conta.situacao === "Atrasado") {
        totalAtrasado += restante;
      } else if (
        conta.situacao === "Pendente" ||
        conta.situacao === "Parcial"
      ) {
        totalPendente += restante;
      }
    }

    return {
      totalPrevisto,
      totalRecebido,
      totalPendente,
      totalAtrasado,
    };
  }, [contasAtualizadas]);

  function salvarConta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const total = converterValor(valorTotal);
    const recebido = converterValor(valorRecebido || "0");

    if (!descricao.trim()) {
      setMensagem("Informe a descrição do recebimento.");
      return;
    }

    if (!cliente.trim()) {
      setMensagem("Informe o cliente.");
      return;
    }

    if (!total || total <= 0) {
      setMensagem("Informe um valor total válido.");
      return;
    }

    if (recebido < 0 || recebido > total) {
      setMensagem(
        "O valor recebido deve estar entre zero e o valor total.",
      );
      return;
    }

    if (!vencimento) {
      setMensagem("Informe a data de vencimento.");
      return;
    }

    const novaConta: ContaReceber = {
      id: crypto.randomUUID(),
      descricao: descricao.trim(),
      cliente: cliente.trim(),
      categoria,
      valorTotal: total,
      valorRecebido: recebido,
      vencimento,
      formaRecebimento,
      contaFinanceira: contaFinanceira.trim(),
      situacao: calcularSituacao(
        total,
        recebido,
        vencimento,
      ),
      observacao: observacao.trim() || undefined,
      criadoEm: new Date().toISOString(),
    };

    setContas((atuais) => [novaConta, ...atuais]);

    setDescricao("");
    setCliente("");
    setValorTotal("");
    setValorRecebido("");
    setVencimento("");
    setContaFinanceira("");
    setObservacao("");
    setMensagem("Conta a receber cadastrada com sucesso.");
  }

  function registrarRecebimento(conta: ContaReceber) {
    const valorInformado = window.prompt(
      `Informe o valor recebido. Restante: ${formatarMoeda(
        Math.max(
          0,
          conta.valorTotal - conta.valorRecebido,
        ),
      )}`,
    );

    if (valorInformado === null) return;

    const valor = converterValor(valorInformado);

    if (!valor || valor <= 0) {
      window.alert("Informe um valor válido.");
      return;
    }

    const novoTotalRecebido =
      conta.valorRecebido + valor;

    if (novoTotalRecebido > conta.valorTotal) {
      window.alert(
        "O recebimento ultrapassa o valor total da conta.",
      );
      return;
    }

    setContas((atuais) =>
      atuais.map((item) =>
        item.id === conta.id
          ? {
              ...item,
              valorRecebido: novoTotalRecebido,
              situacao: calcularSituacao(
                item.valorTotal,
                novoTotalRecebido,
                item.vencimento,
              ),
            }
          : item,
      ),
    );
  }

  function marcarRecebido(conta: ContaReceber) {
    setContas((atuais) =>
      atuais.map((item) =>
        item.id === conta.id
          ? {
              ...item,
              valorRecebido: item.valorTotal,
              situacao: "Recebido",
            }
          : item,
      ),
    );
  }

  function excluirConta(id: string) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta conta a receber?",
    );

    if (!confirmar) return;

    setContas((atuais) =>
      atuais.filter((conta) => conta.id !== id),
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-black p-5">
      <div>
        <p className="text-xs font-black uppercase text-yellow-400">
          Recebimentos
        </p>

        <h3 className="mt-1 text-2xl font-black uppercase text-white">
          Contas a receber
        </h3>

        <p className="mt-2 text-sm text-zinc-400">
          Controle valores de clientes, recebimentos parciais,
          vencimentos e atrasos.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Total previsto"
          valor={resumo.totalPrevisto}
        />

        <CardResumo
          titulo="Recebido"
          valor={resumo.totalRecebido}
        />

        <CardResumo
          titulo="Pendente"
          valor={resumo.totalPendente}
        />

        <CardResumo
          titulo="Atrasado"
          valor={resumo.totalAtrasado}
        />
      </div>

      <form
        onSubmit={salvarConta}
        className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CampoTexto
            label="Descrição"
            valor={descricao}
            onChange={setDescricao}
            placeholder="Ex.: Instalação solar"
          />

          <CampoTexto
            label="Cliente"
            valor={cliente}
            onChange={setCliente}
            placeholder="Nome do cliente"
          />

          <CampoSelect
            label="Categoria"
            valor={categoria}
            onChange={setCategoria}
            opcoes={categorias}
          />

          <CampoTexto
            label="Valor total"
            valor={valorTotal}
            onChange={setValorTotal}
            placeholder="Ex.: 9200,00"
          />

          <CampoTexto
            label="Valor já recebido"
            valor={valorRecebido}
            onChange={setValorRecebido}
            placeholder="Ex.: 2000,00"
          />

          <CampoTexto
            label="Vencimento"
            valor={vencimento}
            onChange={setVencimento}
            tipo="date"
          />

          <CampoSelect
            label="Forma de recebimento"
            valor={formaRecebimento}
            onChange={setFormaRecebimento}
            opcoes={formasRecebimento}
          />

          <CampoTexto
            label="Conta financeira"
            valor={contaFinanceira}
            onChange={setContaFinanceira}
            placeholder="Ex.: Banco do Brasil"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
            Observação
          </label>

          <textarea
            value={observacao}
            onChange={(evento) =>
              setObservacao(evento.target.value)
            }
            rows={3}
            placeholder="Detalhes do recebimento ou parcelamento"
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
          />
        </div>

        <button
          type="submit"
          className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
        >
          Cadastrar recebimento
        </button>
      </form>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto
            label="Pesquisar"
            valor={busca}
            onChange={setBusca}
            placeholder="Descrição, cliente ou categoria"
          />

          <CampoSelect
            label="Situação"
            valor={filtroSituacao}
            onChange={(valor) =>
              setFiltroSituacao(
                valor as "Todas" | SituacaoRecebimento,
              )
            }
            opcoes={[
              "Todas",
              "Pendente",
              "Parcial",
              "Recebido",
              "Atrasado",
            ]}
          />
        </div>

        <div className="mt-6 space-y-3">
          {contasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
              Nenhuma conta encontrada.
            </div>
          ) : (
            contasFiltradas.map((conta) => {
              const restante = Math.max(
                0,
                conta.valorTotal - conta.valorRecebido,
              );

              return (
                <article
                  key={conta.id}
                  className="rounded-2xl border border-zinc-800 bg-black p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
                          {conta.categoria}
                        </span>

                        <span
                          className={`rounded-lg px-3 py-1 text-xs font-black uppercase ${
                            conta.situacao === "Recebido"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : conta.situacao === "Atrasado"
                                ? "bg-red-500/15 text-red-400"
                                : conta.situacao === "Parcial"
                                  ? "bg-blue-500/15 text-blue-400"
                                  : "bg-yellow-400/15 text-yellow-300"
                          }`}
                        >
                          {conta.situacao}
                        </span>
                      </div>

                      <h4 className="mt-3 text-lg font-black text-white">
                        {conta.descricao}
                      </h4>

                      <p className="mt-1 text-sm text-zinc-400">
                        Cliente: {conta.cliente}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        Vencimento:{" "}
                        {formatarData(conta.vencimento)}
                        {" · "}
                        {conta.formaRecebimento}
                        {conta.contaFinanceira
                          ? ` · ${conta.contaFinanceira}`
                          : ""}
                      </p>

                      {conta.observacao && (
                        <p className="mt-2 text-sm text-zinc-400">
                          {conta.observacao}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <div className="text-sm">
                        <p className="font-bold text-white">
                          Total:{" "}
                          {formatarMoeda(conta.valorTotal)}
                        </p>

                        <p className="text-emerald-400">
                          Recebido:{" "}
                          {formatarMoeda(conta.valorRecebido)}
                        </p>

                        <p className="font-black text-yellow-400">
                          Restante: {formatarMoeda(restante)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {conta.situacao !== "Recebido" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                registrarRecebimento(conta)
                              }
                              className="rounded-xl border border-blue-500/50 px-4 py-2 text-sm font-black uppercase text-blue-400"
                            >
                              Receber parcial
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                marcarRecebido(conta)
                              }
                              className="rounded-xl border border-emerald-500/50 px-4 py-2 text-sm font-black uppercase text-emerald-400"
                            >
                              Marcar recebido
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            excluirConta(conta.id)
                          }
                          className="rounded-xl border border-red-500/50 px-4 py-2 text-sm font-black uppercase text-red-400"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </section>
  );
}

function CardResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs font-black uppercase text-zinc-500">
        {titulo}
      </p>

      <p className="mt-2 text-xl font-black text-yellow-400">
        {formatarMoeda(valor)}
      </p>
    </div>
  );
}

function CampoTexto({
  label,
  valor,
  onChange,
  placeholder,
  tipo = "text",
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  tipo?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>

      <input
        type={tipo}
        value={valor}
        placeholder={placeholder}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function CampoSelect({
  label,
  valor,
  onChange,
  opcoes,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>

      <select
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </div>
  );
}

function converterValor(valor: string) {
  const numero = Number(
    valor.replace(/\./g, "").replace(",", "."),
  );

  return Number.isNaN(numero) ? 0 : numero;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: string) {
  if (!data) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(`${data}T00:00:00`));
}