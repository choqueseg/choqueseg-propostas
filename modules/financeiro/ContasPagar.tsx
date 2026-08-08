"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CartaoFinanceiro, CompraCartao } from "./types";

type SituacaoConta = "Pendente" | "Pago" | "Atrasado";

type ContaPagar = {
  id: string;
  descricao: string;
  categoria: string;
  fornecedor: string;
  valor: number;
  vencimento: string;
  formaPagamento: string;
  contaFinanceira: string;
  cartaoId?: string;
  situacao: SituacaoConta;
  observacao?: string;
  criadoEm: string;
};

const CHAVE_CONTAS_PAGAR = "choqueseg-financeiro-contas-pagar";
const CHAVE_CARTOES = "choqueseg-financeiro-cartoes";

const categorias = [
  "Fornecedor",
  "Material",
  "Combustível",
  "Alimentação",
  "Aluguel",
  "Energia",
  "Internet",
  "Salário",
  "Imposto",
  "Manutenção",
  "Outros",
];

const formasPagamento = [
  "PIX",
  "Dinheiro",
  "Débito",
  "Crédito",
  "Transferência",
  "Boleto",
  "Outro",
];

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [cartoes, setCartoes] = useState<CartaoFinanceiro[]>([]);

  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [cartoesCarregados, setCartoesCarregados] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Fornecedor");
  const [fornecedor, setFornecedor] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [contaFinanceira, setContaFinanceira] = useState("");
  const [cartaoId, setCartaoId] = useState("");
  const [situacao, setSituacao] =
    useState<SituacaoConta>("Pendente");
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState<
    "Todas" | SituacaoConta
  >("Todas");

  useEffect(() => {
    const dadosSalvos = localStorage.getItem(CHAVE_CONTAS_PAGAR);

    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos);
        setContas(Array.isArray(dados) ? dados : []);
      } catch {
        localStorage.removeItem(CHAVE_CONTAS_PAGAR);
        setContas([]);
        setMensagem(
          "Os dados das contas a pagar estavam inválidos e foram reiniciados.",
        );
      }
    }

    setDadosCarregados(true);
  }, []);

  useEffect(() => {
    const cartoesSalvos = localStorage.getItem(CHAVE_CARTOES);

    if (cartoesSalvos) {
      try {
        const dados = JSON.parse(cartoesSalvos);
        setCartoes(Array.isArray(dados) ? dados : []);
      } catch {
        localStorage.removeItem(CHAVE_CARTOES);
        setCartoes([]);
      }
    }

    setCartoesCarregados(true);
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;

    localStorage.setItem(
      CHAVE_CONTAS_PAGAR,
      JSON.stringify(contas),
    );
  }, [contas, dadosCarregados]);

  useEffect(() => {
    if (!cartoesCarregados) return;

    localStorage.setItem(
      CHAVE_CARTOES,
      JSON.stringify(cartoes),
    );
  }, [cartoes, cartoesCarregados]);

  useEffect(() => {
    if (formaPagamento !== "Crédito") {
      setCartaoId("");
    }
  }, [formaPagamento]);

  const cartoesAtivos = useMemo(() => {
    return cartoes.filter((cartao) => cartao.ativo);
  }, [cartoes]);

  const contasAtualizadas = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);

    return contas.map((conta) => {
      if (
        conta.situacao === "Pendente" &&
        conta.vencimento &&
        conta.vencimento < hoje
      ) {
        return {
          ...conta,
          situacao: "Atrasado" as SituacaoConta,
        };
      }

      return conta;
    });
  }, [contas]);

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return contasAtualizadas
      .filter((conta) => {
        const atendeBusca =
          !termo ||
          conta.descricao.toLowerCase().includes(termo) ||
          conta.fornecedor.toLowerCase().includes(termo) ||
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
    let pendente = 0;
    let pago = 0;
    let atrasado = 0;

    for (const conta of contasAtualizadas) {
      if (conta.situacao === "Pago") {
        pago += conta.valor;
      } else if (conta.situacao === "Atrasado") {
        atrasado += conta.valor;
      } else {
        pendente += conta.valor;
      }
    }

    return { pendente, pago, atrasado };
  }, [contasAtualizadas]);

  function salvarConta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const valorNumerico = Number(
      valor.replace(/\./g, "").replace(",", "."),
    );

    if (!descricao.trim()) {
      setMensagem("Informe a descrição da conta.");
      return;
    }

    if (!valorNumerico || valorNumerico <= 0) {
      setMensagem("Informe um valor válido.");
      return;
    }

    if (!vencimento) {
      setMensagem("Informe a data de vencimento.");
      return;
    }

    if (formaPagamento === "Crédito" && !cartaoId) {
      setMensagem("Selecione o cartão utilizado.");
      return;
    }

    if (formaPagamento === "Crédito" && situacao === "Pago") {
      const cartaoSelecionado = cartoes.find(
        (cartao) => cartao.id === cartaoId,
      );

      if (!cartaoSelecionado) {
        setMensagem("O cartão selecionado não foi encontrado.");
        return;
      }

      if (!cartaoSelecionado.ativo) {
        setMensagem("O cartão selecionado está inativo.");
        return;
      }

      const utilizado = cartaoSelecionado.limiteUtilizado ?? 0;

      const disponivel =
        cartaoSelecionado.limite - utilizado;

      if (valorNumerico > disponivel) {
        setMensagem(
          `Limite insuficiente. Disponível: ${formatarMoeda(
            disponivel,
          )}.`,
        );
        return;
      }
    }

    const novaConta: ContaPagar = {
      id: crypto.randomUUID(),
      descricao: descricao.trim(),
      categoria,
      fornecedor: fornecedor.trim(),
      valor: valorNumerico,
      vencimento,
      formaPagamento,
      contaFinanceira:
        formaPagamento === "Crédito"
          ? ""
          : contaFinanceira.trim(),
      cartaoId:
        formaPagamento === "Crédito"
          ? cartaoId
          : undefined,
      situacao,
      observacao: observacao.trim() || undefined,
      criadoEm: new Date().toISOString(),
    };

    if (
      formaPagamento === "Crédito" &&
      situacao === "Pago" &&
      cartaoId
    ) {
      registrarCompraCartao(novaConta);
    }

    setContas((atuais) => [novaConta, ...atuais]);

    setDescricao("");
    setFornecedor("");
    setValor("");
    setVencimento("");
    setContaFinanceira("");
    setCartaoId("");
    setObservacao("");
    setSituacao("Pendente");

    setMensagem("Conta cadastrada com sucesso.");
  }

  function registrarCompraCartao(conta: ContaPagar) {
    if (!conta.cartaoId) return;

    setCartoes((atuais) =>
      atuais.map((cartao) => {
        if (cartao.id !== conta.cartaoId) {
          return cartao;
        }

        const comprasAtuais = cartao.compras ?? [];

        const compraJaExiste = comprasAtuais.some(
          (compra) =>
            compra.contaPagarId === conta.id &&
            compra.situacao !== "Cancelada",
        );

        if (compraJaExiste) {
          return cartao;
        }

        const novaCompra: CompraCartao = {
          id: crypto.randomUUID(),
          descricao: conta.descricao,
          valor: conta.valor,
          data:
            conta.vencimento ||
            new Date().toISOString().slice(0, 10),
          categoria: conta.categoria,
          fornecedor: conta.fornecedor || undefined,
          contaPagarId: conta.id,
          observacao: conta.observacao,
          situacao: "Aberta",
          criadoEm: new Date().toISOString(),
        };

        return {
          ...cartao,
          limiteUtilizado:
            (cartao.limiteUtilizado ?? 0) +
            conta.valor,
          compras: [novaCompra, ...comprasAtuais],
        };
      }),
    );
  }

  function alterarSituacao(
    id: string,
    novaSituacao: SituacaoConta,
  ) {
    const conta = contas.find((item) => item.id === id);

    if (!conta) return;

    if (
      novaSituacao === "Pago" &&
      conta.formaPagamento === "Crédito" &&
      conta.cartaoId
    ) {
      const cartaoSelecionado = cartoes.find(
        (cartao) => cartao.id === conta.cartaoId,
      );

      if (!cartaoSelecionado) {
        setMensagem("O cartão da conta não foi encontrado.");
        return;
      }

      const compraJaExiste = (
        cartaoSelecionado.compras ?? []
      ).some(
        (compra) =>
          compra.contaPagarId === conta.id &&
          compra.situacao !== "Cancelada",
      );

      if (!compraJaExiste) {
        const utilizado =
          cartaoSelecionado.limiteUtilizado ?? 0;

        const disponivel =
          cartaoSelecionado.limite - utilizado;

        if (conta.valor > disponivel) {
          setMensagem(
            `Não foi possível pagar. O cartão ${cartaoSelecionado.nome} possui apenas ${formatarMoeda(
              disponivel,
            )} disponíveis.`,
          );
          return;
        }

        registrarCompraCartao(conta);
      }
    }

    setContas((atuais) =>
      atuais.map((contaAtual) =>
        contaAtual.id === id
          ? {
              ...contaAtual,
              situacao: novaSituacao,
            }
          : contaAtual,
      ),
    );

    setMensagem("Situação atualizada com sucesso.");
  }

  function excluirConta(id: string) {
    const conta = contas.find((item) => item.id === id);

    if (!conta) return;

    const confirmar = window.confirm(
      "Deseja realmente excluir esta conta?",
    );

    if (!confirmar) return;

    if (
      conta.formaPagamento === "Crédito" &&
      conta.cartaoId
    ) {
      setCartoes((atuais) =>
        atuais.map((cartao) => {
          if (cartao.id !== conta.cartaoId) {
            return cartao;
          }

          const comprasAtuais = cartao.compras ?? [];

          const compraRelacionada = comprasAtuais.find(
            (compra) =>
              compra.contaPagarId === conta.id &&
              compra.situacao !== "Cancelada",
          );

          if (!compraRelacionada) {
            return cartao;
          }

          return {
            ...cartao,
            limiteUtilizado: Math.max(
              0,
              (cartao.limiteUtilizado ?? 0) -
                compraRelacionada.valor,
            ),
            compras: comprasAtuais.filter(
              (compra) =>
                compra.id !== compraRelacionada.id,
            ),
          };
        }),
      );
    }

    setContas((atuais) =>
      atuais.filter((contaAtual) => contaAtual.id !== id),
    );

    setMensagem("Conta excluída com sucesso.");
  }

  function nomeCartao(id?: string) {
    if (!id) return "";

    return (
      cartoes.find((cartao) => cartao.id === id)?.nome ??
      "Cartão não encontrado"
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-black p-5">
      <div>
        <p className="text-xs font-black uppercase text-yellow-400">
          Obrigações financeiras
        </p>

        <h3 className="mt-1 text-2xl font-black uppercase text-white">
          Contas a pagar
        </h3>

        <p className="mt-2 text-sm text-zinc-400">
          Controle despesas, vencimentos, fornecedores e pagamentos.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <CardResumo
          titulo="Pendente"
          valor={resumo.pendente}
        />

        <CardResumo
          titulo="Pago"
          valor={resumo.pago}
        />

        <CardResumo
          titulo="Atrasado"
          valor={resumo.atrasado}
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
            placeholder="Ex.: Combustível"
          />

          <CampoSelect
            label="Categoria"
            valor={categoria}
            onChange={setCategoria}
            opcoes={categorias}
          />

          <CampoTexto
            label="Fornecedor"
            valor={fornecedor}
            onChange={setFornecedor}
            placeholder="Ex.: Posto de combustível"
          />

          <CampoTexto
            label="Valor"
            valor={valor}
            onChange={setValor}
            placeholder="Ex.: 350,00"
          />

          <CampoTexto
            label="Vencimento"
            valor={vencimento}
            onChange={setVencimento}
            tipo="date"
          />

          <CampoSelect
            label="Forma de pagamento"
            valor={formaPagamento}
            onChange={setFormaPagamento}
            opcoes={formasPagamento}
          />

          {formaPagamento === "Crédito" ? (
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
                Cartão utilizado
              </label>

              <select
                value={cartaoId}
                onChange={(evento) =>
                  setCartaoId(evento.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option value="">
                  Selecione um cartão
                </option>

                {cartoesAtivos.map((cartao) => {
                  const disponivel =
                    cartao.limite -
                    (cartao.limiteUtilizado ?? 0);

                  return (
                    <option
                      key={cartao.id}
                      value={cartao.id}
                    >
                      {cartao.nome} - disponível{" "}
                      {formatarMoeda(disponivel)}
                    </option>
                  );
                })}
              </select>

              {cartoesAtivos.length === 0 && (
                <p className="mt-2 text-xs font-bold text-red-400">
                  Nenhum cartão ativo cadastrado.
                </p>
              )}
            </div>
          ) : (
            <CampoTexto
              label="Conta financeira"
              valor={contaFinanceira}
              onChange={setContaFinanceira}
              placeholder="Ex.: Banco do Brasil"
            />
          )}

          <CampoSelect
            label="Situação"
            valor={situacao}
            onChange={(valor) =>
              setSituacao(valor as SituacaoConta)
            }
            opcoes={["Pendente", "Pago", "Atrasado"]}
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
            placeholder="Detalhes adicionais"
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
          />
        </div>

        <button
          type="submit"
          className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
        >
          Cadastrar conta
        </button>
      </form>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto
            label="Pesquisar"
            valor={busca}
            onChange={setBusca}
            placeholder="Descrição, fornecedor ou categoria"
          />

          <CampoSelect
            label="Situação"
            valor={filtroSituacao}
            onChange={(valor) =>
              setFiltroSituacao(
                valor as "Todas" | SituacaoConta,
              )
            }
            opcoes={[
              "Todas",
              "Pendente",
              "Pago",
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
            contasFiltradas.map((conta) => (
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
                          conta.situacao === "Pago"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : conta.situacao ===
                                "Atrasado"
                              ? "bg-red-500/15 text-red-400"
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
                      {conta.fornecedor ||
                        "Fornecedor não informado"}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      Vencimento:{" "}
                      {formatarData(conta.vencimento)}
                      {" · "}
                      {conta.formaPagamento}

                      {conta.formaPagamento ===
                        "Crédito" &&
                      conta.cartaoId
                        ? ` · ${nomeCartao(conta.cartaoId)}`
                        : conta.contaFinanceira
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
                    <p className="text-xl font-black text-yellow-400">
                      {formatarMoeda(conta.valor)}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {conta.situacao !== "Pago" && (
                        <button
                          type="button"
                          onClick={() =>
                            alterarSituacao(
                              conta.id,
                              "Pago",
                            )
                          }
                          className="rounded-xl border border-emerald-500/50 px-4 py-2 text-sm font-black uppercase text-emerald-400"
                        >
                          Marcar como pago
                        </button>
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
            ))
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
        onChange={(evento) =>
          onChange(evento.target.value)
        }
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
        onChange={(evento) =>
          onChange(evento.target.value)
        }
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