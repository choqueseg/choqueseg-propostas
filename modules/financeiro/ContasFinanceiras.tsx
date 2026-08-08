"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ContaFinanceira } from "./types";

const CHAVE_CONTAS = "choqueseg-financeiro-contas";

export default function ContasFinanceiras() {
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] =
    useState<ContaFinanceira["tipo"]>("Conta bancária");
  const [origem, setOrigem] =
    useState<ContaFinanceira["origem"]>("Empresa");
  const [saldoInicial, setSaldoInicial] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const contasSalvas = localStorage.getItem(CHAVE_CONTAS);

    if (contasSalvas) {
      try {
        const dados = JSON.parse(contasSalvas);
        setContas(Array.isArray(dados) ? dados : []);
      } catch {
        localStorage.removeItem(CHAVE_CONTAS);
        setContas([]);
        setMensagem(
          "Os dados das contas estavam inválidos e foram reiniciados.",
        );
      }
    }

    setDadosCarregados(true);
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;

    localStorage.setItem(CHAVE_CONTAS, JSON.stringify(contas));
  }, [contas, dadosCarregados]);

  const resumo = useMemo(() => {
    let saldoEmpresa = 0;
    let saldoPessoal = 0;

    for (const conta of contas) {
      if (!conta.ativa) continue;

      if (conta.origem === "Empresa") {
        saldoEmpresa += Number(conta.saldoInicial || 0);
      } else {
        saldoPessoal += Number(conta.saldoInicial || 0);
      }
    }

    return {
      saldoEmpresa,
      saldoPessoal,
      total: saldoEmpresa + saldoPessoal,
    };
  }, [contas]);

  function salvarConta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const saldo = Number(
      saldoInicial.replace(/\./g, "").replace(",", "."),
    );

    if (!nome.trim()) {
      setMensagem("Informe o nome da conta.");
      return;
    }

    if (Number.isNaN(saldo)) {
      setMensagem("Informe um saldo inicial válido.");
      return;
    }

    const novaConta: ContaFinanceira = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      tipo,
      origem,
      saldoInicial: saldo,
      ativa: true,
    };

    setContas((atuais) => [...atuais, novaConta]);
    setNome("");
    setSaldoInicial("");
    setMensagem("Conta cadastrada com sucesso.");
  }

  function alternarStatus(id: string) {
    setContas((atuais) =>
      atuais.map((conta) =>
        conta.id === id
          ? { ...conta, ativa: !conta.ativa }
          : conta,
      ),
    );
  }

  function excluirConta(id: string) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta conta?",
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
          Contas e caixa
        </p>

        <h3 className="mt-1 text-2xl font-black uppercase text-white">
          Contas financeiras
        </h3>

        <p className="mt-2 text-sm text-zinc-400">
          Cadastre bancos, caixa físico e carteiras digitais da empresa ou pessoais.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <CardResumo titulo="Empresa" valor={resumo.saldoEmpresa} />
        <CardResumo titulo="Pessoal" valor={resumo.saldoPessoal} />
        <CardResumo titulo="Total cadastrado" valor={resumo.total} />
      </div>

      <form
        onSubmit={salvarConta}
        className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CampoTexto
            label="Nome da conta"
            valor={nome}
            onChange={setNome}
            placeholder="Ex.: Banco do Brasil"
          />

          <CampoSelect
            label="Tipo"
            valor={tipo}
            onChange={(valor) =>
              setTipo(valor as ContaFinanceira["tipo"])
            }
            opcoes={[
              "Conta bancária",
              "Caixa",
              "Carteira digital",
            ]}
          />

          <CampoSelect
            label="Origem"
            valor={origem}
            onChange={(valor) =>
              setOrigem(valor as ContaFinanceira["origem"])
            }
            opcoes={["Empresa", "Pessoal"]}
          />

          <CampoTexto
            label="Saldo inicial"
            valor={saldoInicial}
            onChange={setSaldoInicial}
            placeholder="Ex.: 2500,00"
          />
        </div>

        <button
          type="submit"
          className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
        >
          Cadastrar conta
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {contas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
            Nenhuma conta cadastrada.
          </div>
        ) : (
          contas.map((conta) => (
            <article
              key={conta.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
                      {conta.tipo}
                    </span>

                    <span className="rounded-lg bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-300">
                      {conta.origem}
                    </span>

                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-black uppercase ${
                        conta.ativa
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {conta.ativa ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <h4 className="mt-3 text-lg font-black text-white">
                    {conta.nome}
                  </h4>

                  <p className="mt-1 text-sm text-zinc-400">
                    Saldo inicial: {formatarMoeda(conta.saldoInicial)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => alternarStatus(conta.id)}
                    className="rounded-xl border border-yellow-400/50 px-4 py-2 text-sm font-black uppercase text-yellow-400"
                  >
                    {conta.ativa ? "Inativar" : "Ativar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => excluirConta(conta.id)}
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
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>

      <input
        type="text"
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