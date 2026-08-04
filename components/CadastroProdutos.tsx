"use client";

import { useEffect, useMemo, useState } from "react";
import {
  produtosIniciais,
  type CategoriaProduto,
  type Produto,
} from "@/components/produtos";

const CHAVE_PRODUTOS = "choqueseg-produtos";

const categorias: CategoriaProduto[] = [
  "Segurança Eletrônica",
  "Elétrica",
  "Automação",
  "Energia Solar",
  "Mão de Obra",
  "Outros",
];

const produtoVazio: Produto = {
  id: "",
  nome: "",
  descricao: "",
  categoria: "Segurança Eletrônica",
  unidade: "unidade",
  valorCusto: 0,
  valorVenda: 0,
  ativo: true,
};

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function criarId(nome: string) {
  const base = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "produto"}-${Date.now()}`;
}

export default function CadastroProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [formulario, setFormulario] = useState<Produto>(produtoVazio);
  const [produtoEditandoId, setProdutoEditandoId] = useState<string | null>(
    null,
  );
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

  useEffect(() => {
    try {
      const salvos = localStorage.getItem(CHAVE_PRODUTOS);

      if (!salvos) {
        localStorage.setItem(
          CHAVE_PRODUTOS,
          JSON.stringify(produtosIniciais),
        );
        return;
      }

      const lista = JSON.parse(salvos) as Produto[];

      if (Array.isArray(lista)) {
        setProdutos(lista);
      }
    } catch (erro) {
      console.error("Erro ao carregar produtos:", erro);
    }
  }, []);

  function salvarLista(novaLista: Produto[]) {
    setProdutos(novaLista);
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(novaLista));
  }

  function atualizarCampo<K extends keyof Produto>(
    campo: K,
    valor: Produto[K],
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setFormulario(produtoVazio);
    setProdutoEditandoId(null);
  }

  function salvarProduto() {
    const nome = formulario.nome.trim();

    if (!nome) {
      alert("Informe o nome do produto.");
      return;
    }

    const produtoFinal: Produto = {
      ...formulario,
      id: produtoEditandoId || criarId(nome),
      nome,
      descricao: formulario.descricao.trim(),
      unidade: formulario.unidade.trim() || "unidade",
      valorCusto: Math.max(Number(formulario.valorCusto) || 0, 0),
      valorVenda: Math.max(Number(formulario.valorVenda) || 0, 0),
    };

    if (produtoEditandoId) {
      salvarLista(
        produtos.map((produto) =>
          produto.id === produtoEditandoId ? produtoFinal : produto,
        ),
      );
    } else {
      salvarLista([...produtos, produtoFinal]);
    }

    limparFormulario();
  }

  function editarProduto(produto: Produto) {
    setFormulario(produto);
    setProdutoEditandoId(produto.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function excluirProduto(id: string) {
    const confirmado = window.confirm(
      "Deseja realmente excluir este produto?",
    );

    if (!confirmado) return;

    salvarLista(produtos.filter((produto) => produto.id !== id));

    if (produtoEditandoId === id) {
      limparFormulario();
    }
  }

  function alternarStatus(id: string) {
    salvarLista(
      produtos.map((produto) =>
        produto.id === id
          ? { ...produto, ativo: !produto.ativo }
          : produto,
      ),
    );
  }

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((produto) => {
      const correspondeBusca =
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        produto.descricao.toLowerCase().includes(termo);

      const correspondeCategoria =
        categoriaFiltro === "Todas" ||
        produto.categoria === categoriaFiltro;

      return correspondeBusca && correspondeCategoria;
    });
  }, [produtos, busca, categoriaFiltro]);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl border border-yellow-400/40 bg-black p-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-yellow-400">
            CHOQUESEG
          </p>

          <h1 className="mt-1 text-2xl font-black uppercase md:text-4xl">
            Cadastro de Produtos
          </h1>

          <p className="mt-2 text-zinc-400">
            Cadastre e atualize os produtos usados nos orçamentos.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="self-start rounded-3xl border border-yellow-400/40 bg-black p-5 lg:sticky lg:top-5">
            <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-yellow-400">
              {produtoEditandoId ? "Editar produto" : "Novo produto"}
            </h2>

            <div className="space-y-3">
              <Campo
                titulo="Nome"
                valor={formulario.nome}
                aoAlterar={(valor) => atualizarCampo("nome", valor)}
              />

              <Campo
                titulo="Descrição"
                valor={formulario.descricao}
                aoAlterar={(valor) => atualizarCampo("descricao", valor)}
              />

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">
                  Categoria
                </span>

                <select
                  value={formulario.categoria}
                  onChange={(evento) =>
                    atualizarCampo(
                      "categoria",
                      evento.target.value as CategoriaProduto,
                    )
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
                >
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </label>

              <Campo
                titulo="Unidade"
                valor={formulario.unidade}
                aoAlterar={(valor) => atualizarCampo("unidade", valor)}
              />

              <CampoNumero
                titulo="Valor de custo"
                valor={formulario.valorCusto}
                aoAlterar={(valor) =>
                  atualizarCampo("valorCusto", valor)
                }
              />

              <CampoNumero
                titulo="Valor de venda"
                valor={formulario.valorVenda}
                aoAlterar={(valor) =>
                  atualizarCampo("valorVenda", valor)
                }
              />

              <label className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3">
                <input
                  type="checkbox"
                  checked={formulario.ativo}
                  onChange={(evento) =>
                    atualizarCampo("ativo", evento.target.checked)
                  }
                  className="h-5 w-5 accent-yellow-400"
                />

                <span className="font-bold">Produto ativo</span>
              </label>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={salvarProduto}
                className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black"
              >
                {produtoEditandoId ? "Atualizar" : "Salvar"}
              </button>

              <button
                type="button"
                onClick={limparFormulario}
                className="rounded-xl border border-zinc-600 px-4 py-3 text-sm font-black uppercase"
              >
                Limpar
              </button>
            </div>
          </aside>

          <section className="rounded-3xl border border-zinc-800 bg-black p-5">
            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_250px]">
              <input
                type="text"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Pesquisar produto..."
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
              />

              <select
                value={categoriaFiltro}
                onChange={(evento) =>
                  setCategoriaFiltro(evento.target.value)
                }
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option value="Todas">Todas as categorias</option>

                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black uppercase text-yellow-400">
                Produtos cadastrados
              </h2>

              <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm font-bold">
                {produtosFiltrados.length} produtos
              </span>
            </div>

            {produtosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
                Nenhum produto encontrado.
              </div>
            ) : (
              <div className="space-y-3">
                {produtosFiltrados.map((produto) => (
                  <article
                    key={produto.id}
                    className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-white">
                            {produto.nome}
                          </h3>

                          <span className="rounded-full bg-yellow-400/10 px-2 py-1 text-xs font-black text-yellow-400">
                            {produto.categoria}
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-xs font-black ${
                              produto.ativo
                                ? "bg-green-600/20 text-green-400"
                                : "bg-red-600/20 text-red-400"
                            }`}
                          >
                            {produto.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-zinc-400">
                          {produto.descricao || "Sem descrição"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          <span>
                            Custo:{" "}
                            <strong>{moeda(produto.valorCusto)}</strong>
                          </span>

                          <span>
                            Venda:{" "}
                            <strong className="text-yellow-400">
                              {moeda(produto.valorVenda)}
                            </strong>
                          </span>

                          <span>
                            Unidade: <strong>{produto.unidade}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => editarProduto(produto)}
                          className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-black uppercase text-black"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarStatus(produto.id)}
                          className="rounded-xl border border-zinc-600 px-3 py-2 text-xs font-black uppercase"
                        >
                          {produto.ativo ? "Desativar" : "Ativar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirProduto(produto.id)}
                          className="rounded-xl bg-red-700 px-3 py-2 text-xs font-black uppercase"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Campo({
  titulo,
  valor,
  aoAlterar,
}: {
  titulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{titulo}</span>

      <input
        type="text"
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
      />
    </label>
  );
}

function CampoNumero({
  titulo,
  valor,
  aoAlterar,
}: {
  titulo: string;
  valor: number;
  aoAlterar: (valor: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{titulo}</span>

      <input
        type="number"
        min="0"
        step="0.01"
        value={valor}
        onChange={(evento) =>
          aoAlterar(Number(evento.target.value) || 0)
        }
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
      />
    </label>
  );
}