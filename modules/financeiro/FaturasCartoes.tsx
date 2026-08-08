"use client";

import { useEffect, useMemo, useState } from "react";
import { CartaoFinanceiro, CompraCartao } from "./types";

const CHAVE_CARTOES = "choqueseg-financeiro-cartoes";
const CHAVE_LANCAMENTOS = "choqueseg-financeiro-lancamentos";

type LancamentoBasico = {
  id: string;
  tipo: "Entrada" | "Saída";
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  origem: string;
  formaPagamento: string;
  cartaoId?: string;
  observacao?: string;
  criadoEm: string;
  criadoPor: string;
};

export default function FaturasCartoes() {
  const [cartoes, setCartoes] = useState<CartaoFinanceiro[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const dadosSalvos = localStorage.getItem(CHAVE_CARTOES);

    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos);
        setCartoes(Array.isArray(dados) ? dados : []);
      } catch {
        localStorage.removeItem(CHAVE_CARTOES);
        setCartoes([]);
      }
    }

    setDadosCarregados(true);
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;

    localStorage.setItem(
      CHAVE_CARTOES,
      JSON.stringify(cartoes),
    );
  }, [cartoes, dadosCarregados]);

  const cartoesComFatura = useMemo(() => {
    return cartoes.map((cartao) => {
      const compras = cartao.compras ?? [];

      const abertas = compras.filter(
        (compra) => compra.situacao === "Aberta",
      );

      const pagas = compras.filter(
        (compra) => compra.situacao === "Paga",
      );

      const totalAberto = abertas.reduce(
        (total, compra) => total + compra.valor,
        0,
      );

      return {
        cartao,
        abertas,
        pagas,
        totalAberto,
      };
    });
  }, [cartoes]);

  function pagarFatura(cartaoId: string) {
    setMensagem("");

    const cartao = cartoes.find(
      (item) => item.id === cartaoId,
    );

    if (!cartao) {
      setMensagem("Cartão não encontrado.");
      return;
    }

    const comprasAbertas = (cartao.compras ?? []).filter(
      (compra) => compra.situacao === "Aberta",
    );

    if (comprasAbertas.length === 0) {
      setMensagem("Este cartão não possui fatura aberta.");
      return;
    }

    const totalFatura = comprasAbertas.reduce(
      (total, compra) => total + compra.valor,
      0,
    );

    const confirmar = window.confirm(
      `Deseja pagar a fatura de ${formatarMoeda(
        totalFatura,
      )} do cartão ${cartao.nome}?`,
    );

    if (!confirmar) return;

    const agora = new Date().toISOString();

    setCartoes((atuais) =>
      atuais.map((item) => {
        if (item.id !== cartaoId) {
          return item;
        }

        const comprasAtualizadas = (item.compras ?? []).map(
          (compra) =>
            compra.situacao === "Aberta"
              ? {
                  ...compra,
                  situacao: "Paga" as const,
                }
              : compra,
        );

        return {
          ...item,
          limiteUtilizado: 0,
          compras: comprasAtualizadas,
        };
      }),
    );

    registrarPagamentoFinanceiro(
      cartao,
      totalFatura,
      agora,
    );

    setMensagem(
      `Fatura do cartão ${cartao.nome} paga com sucesso.`,
    );
  }

  function registrarPagamentoFinanceiro(
    cartao: CartaoFinanceiro,
    valor: number,
    criadoEm: string,
  ) {
    let lancamentos: LancamentoBasico[] = [];

    const dadosSalvos = localStorage.getItem(
      CHAVE_LANCAMENTOS,
    );

    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos);

        if (Array.isArray(dados)) {
          lancamentos = dados;
        }
      } catch {
        lancamentos = [];
      }
    }

    const novoLancamento: LancamentoBasico = {
      id: crypto.randomUUID(),
      tipo: "Saída",
      descricao: `Pagamento fatura - ${cartao.nome}`,
      valor,
      data: new Date().toISOString().slice(0, 10),
      categoria: "Fornecedor",
      origem: cartao.origem,
      formaPagamento: "Crédito",
      cartaoId: cartao.id,
      observacao: `Pagamento da fatura do cartão ${cartao.nome}`,
      criadoEm,
      criadoPor: "Sistema",
    };

    localStorage.setItem(
      CHAVE_LANCAMENTOS,
      JSON.stringify([
        novoLancamento,
        ...lancamentos,
      ]),
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-black p-5">
      <div>
        <p className="text-xs font-black uppercase text-yellow-400">
          Controle de faturas
        </p>

        <h3 className="mt-1 text-2xl font-black uppercase text-white">
          Faturas dos cartões
        </h3>

        <p className="mt-2 text-sm text-zinc-400">
          Acompanhe compras, limite utilizado e pagamento das faturas.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-6 space-y-5">
        {cartoesComFatura.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
            Nenhum cartão cadastrado.
          </div>
        ) : (
          cartoesComFatura.map(
            ({
              cartao,
              abertas,
              pagas,
              totalAberto,
            }) => {
              const utilizado =
                cartao.limiteUtilizado ?? 0;

              const disponivel = Math.max(
                0,
                cartao.limite - utilizado,
              );

              return (
                <article
                  key={cartao.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-300">
                          {cartao.origem}
                        </span>

                        {cartao.bandeira && (
                          <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
                            {cartao.bandeira}
                          </span>
                        )}
                      </div>

                      <h4 className="mt-3 text-xl font-black text-white">
                        {cartao.nome}
                      </h4>

                      <p className="mt-2 text-sm text-zinc-400">
                        Limite total:{" "}
                        {formatarMoeda(cartao.limite)}
                      </p>

                      <p className="mt-1 text-sm text-zinc-400">
                        Utilizado:{" "}
                        {formatarMoeda(utilizado)}
                      </p>

                      <p className="mt-1 text-sm font-bold text-emerald-400">
                        Disponível:{" "}
                        {formatarMoeda(disponivel)}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Fecha dia {cartao.diaFechamento} ·
                        vence dia {cartao.diaVencimento}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-4 lg:min-w-72">
                      <p className="text-xs font-black uppercase text-zinc-500">
                        Fatura aberta
                      </p>

                      <p className="mt-2 text-2xl font-black text-yellow-400">
                        {formatarMoeda(totalAberto)}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {abertas.length} compra(s) em aberto
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          pagarFatura(cartao.id)
                        }
                        disabled={abertas.length === 0}
                        className="mt-4 w-full rounded-xl bg-yellow-400 px-4 py-3 font-black uppercase text-black disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Pagar fatura
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h5 className="text-sm font-black uppercase text-yellow-400">
                      Compras em aberto
                    </h5>

                    <div className="mt-3 space-y-2">
                      {abertas.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-700 p-5 text-sm text-zinc-500">
                          Nenhuma compra em aberto.
                        </div>
                      ) : (
                        abertas.map((compra) => (
                          <CompraLinha
                            key={compra.id}
                            compra={compra}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {pagas.length > 0 && (
                    <div className="mt-6">
                      <h5 className="text-sm font-black uppercase text-emerald-400">
                        Histórico pago
                      </h5>

                      <div className="mt-3 space-y-2">
                        {pagas.map((compra) => (
                          <CompraLinha
                            key={compra.id}
                            compra={compra}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            },
          )
        )}
      </div>
    </section>
  );
}

function CompraLinha({
  compra,
}: {
  compra: CompraCartao;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-white">
            {compra.descricao}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {formatarData(compra.data)}
            {compra.categoria
              ? ` · ${compra.categoria}`
              : ""}
            {compra.fornecedor
              ? ` · ${compra.fornecedor}`
              : ""}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="font-black text-yellow-400">
            {formatarMoeda(compra.valor)}
          </p>

          <p
            className={`mt-1 text-xs font-black uppercase ${
              compra.situacao === "Paga"
                ? "text-emerald-400"
                : compra.situacao === "Cancelada"
                  ? "text-red-400"
                  : "text-yellow-300"
            }`}
          >
            {compra.situacao}
          </p>
        </div>
      </div>
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