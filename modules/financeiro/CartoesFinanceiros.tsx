"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CartaoFinanceiro } from "./types";

const CHAVE_CARTOES = "choqueseg-financeiro-cartoes";

export default function CartoesFinanceiros() {
  const [cartoes, setCartoes] = useState<CartaoFinanceiro[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [nome, setNome] = useState("");
  const [bandeira, setBandeira] = useState("");
  const [origem, setOrigem] =
    useState<CartaoFinanceiro["origem"]>("Empresa");
  const [limite, setLimite] = useState("");
  const [diaFechamento, setDiaFechamento] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const cartoesSalvos = localStorage.getItem(CHAVE_CARTOES);

    if (cartoesSalvos) {
      try {
        setCartoes(JSON.parse(cartoesSalvos));
      } catch {
        localStorage.removeItem(CHAVE_CARTOES);
        setCartoes([]);
        setMensagem(
          "Os dados dos cartões estavam inválidos e foram reiniciados.",
        );
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

  const resumo = useMemo(() => {
    const ativos = cartoes.filter((cartao) => cartao.ativo);

    const limiteEmpresa = ativos
      .filter((cartao) => cartao.origem === "Empresa")
      .reduce((total, cartao) => total + cartao.limite, 0);

    const limitePessoal = ativos
      .filter((cartao) => cartao.origem === "Pessoal")
      .reduce((total, cartao) => total + cartao.limite, 0);

    return {
      quantidadeAtivos: ativos.length,
      limiteEmpresa,
      limitePessoal,
      limiteTotal: limiteEmpresa + limitePessoal,
    };
  }, [cartoes]);

  function salvarCartao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const limiteNumerico = Number(
      limite.replace(".", "").replace(",", "."),
    );
    const fechamentoNumerico = Number(diaFechamento);
    const vencimentoNumerico = Number(diaVencimento);

    if (!nome.trim()) {
      setMensagem("Informe o nome do cartão.");
      return;
    }

    if (!limiteNumerico || limiteNumerico <= 0) {
      setMensagem("Informe um limite válido.");
      return;
    }

    if (
      fechamentoNumerico < 1 ||
      fechamentoNumerico > 31
    ) {
      setMensagem("Informe um dia de fechamento entre 1 e 31.");
      return;
    }

    if (
      vencimentoNumerico < 1 ||
      vencimentoNumerico > 31
    ) {
      setMensagem("Informe um dia de vencimento entre 1 e 31.");
      return;
    }

   const novoCartao: CartaoFinanceiro = {
  id: crypto.randomUUID(),
  nome: nome.trim(),
  bandeira: bandeira.trim() || undefined,
  origem,
  limite: limiteNumerico,
  limiteUtilizado: 0,
  compras: [],
  diaFechamento: fechamentoNumerico,
  diaVencimento: vencimentoNumerico,
  ativo: true,
};

    setCartoes((atuais) => [...atuais, novoCartao]);

    setNome("");
    setBandeira("");
    setLimite("");
    setDiaFechamento("");
    setDiaVencimento("");
    setMensagem("Cartão cadastrado com sucesso.");
  }

  function alternarStatus(id: string) {
    setCartoes((atuais) =>
      atuais.map((cartao) =>
        cartao.id === id
          ? { ...cartao, ativo: !cartao.ativo }
          : cartao,
      ),
    );
  }

  function excluirCartao(id: string) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este cartão?",
    );

    if (!confirmar) return;

    setCartoes((atuais) =>
      atuais.filter((cartao) => cartao.id !== id),
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-black p-5">
      <div>
        <p className="text-xs font-black uppercase text-yellow-400">
          Controle de crédito
        </p>

        <h3 className="mt-1 text-2xl font-black uppercase text-white">
          Cartões financeiros
        </h3>

        <p className="mt-2 text-sm text-zinc-400">
          Cadastre cartões da empresa e pessoais, com limite,
          fechamento e vencimento.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Cartões ativos"
          valor={String(resumo.quantidadeAtivos)}
        />

        <CardResumo
          titulo="Limite empresa"
          valor={formatarMoeda(resumo.limiteEmpresa)}
        />

        <CardResumo
          titulo="Limite pessoal"
          valor={formatarMoeda(resumo.limitePessoal)}
        />

        <CardResumo
          titulo="Limite total"
          valor={formatarMoeda(resumo.limiteTotal)}
        />
      </div>

      <form
        onSubmit={salvarCartao}
        className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CampoTexto
            label="Nome do cartão"
            valor={nome}
            onChange={setNome}
            placeholder="Ex.: Nubank Empresa"
          />

          <CampoTexto
            label="Bandeira"
            valor={bandeira}
            onChange={setBandeira}
            placeholder="Ex.: Mastercard"
          />

          <CampoSelect
            label="Origem"
            valor={origem}
            onChange={(valor) =>
              setOrigem(valor as CartaoFinanceiro["origem"])
            }
            opcoes={["Empresa", "Pessoal"]}
          />

          <CampoTexto
            label="Limite"
            valor={limite}
            onChange={setLimite}
            placeholder="Ex.: 5000,00"
          />

          <CampoTexto
            label="Dia do fechamento"
            valor={diaFechamento}
            onChange={setDiaFechamento}
            placeholder="Ex.: 10"
            tipo="number"
          />

          <CampoTexto
            label="Dia do vencimento"
            valor={diaVencimento}
            onChange={setDiaVencimento}
            placeholder="Ex.: 17"
            tipo="number"
          />
        </div>

        <button
          type="submit"
          className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
        >
          Cadastrar cartão
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {cartoes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
            Nenhum cartão cadastrado.
          </div>
        ) : (
          cartoes.map((cartao) => (
            <article
              key={cartao.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-black uppercase ${
                        cartao.ativo
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {cartao.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <h4 className="mt-3 text-lg font-black text-white">
                    {cartao.nome}
                  </h4>

                  <p className="mt-1 text-sm text-zinc-400">
  Limite total: {formatarMoeda(cartao.limite)}
</p>

<p className="mt-1 text-sm text-zinc-400">
  Utilizado: {formatarMoeda(cartao.limiteUtilizado ?? 0)}
</p>

<p className="mt-1 text-sm font-bold text-emerald-400">
  Disponível:{" "}
  {formatarMoeda(
    Math.max(
      0,
      cartao.limite - (cartao.limiteUtilizado ?? 0),
    ),
  )}
</p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Fecha dia {cartao.diaFechamento} · vence dia{" "}
                    {cartao.diaVencimento}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => alternarStatus(cartao.id)}
                    className="rounded-xl border border-yellow-400/50 px-4 py-2 text-sm font-black uppercase text-yellow-400"
                  >
                    {cartao.ativo ? "Inativar" : "Ativar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => excluirCartao(cartao.id)}
                    className="rounded-xl border border-red-500/50 px-4 py-2 text-sm font-black uppercase text-red-400"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function CardResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs font-black uppercase text-zinc-500">
        {titulo}
      </p>

      <p className="mt-2 text-xl font-black text-yellow-400">
        {valor}
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
        min={tipo === "number" ? 1 : undefined}
        max={tipo === "number" ? 31 : undefined}
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

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}