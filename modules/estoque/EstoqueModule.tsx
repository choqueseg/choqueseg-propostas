"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  CategoriaEstoque,
  ProdutoEstoque,
  UnidadeEstoque,
} from "./types";
import MovimentacoesEstoque from "./MovimentacoesEstoque";
import {
  catalogoProdutos,
  segmentosCatalogo,
} from "./catalogoProdutos";

const supabase = createClient();

const CHAVE_PRODUTOS = "choqueseg-estoque-produtos";

const categorias: CategoriaEstoque[] = [
  "Módulo solar",
  "Inversor",
  "Estrutura",
  "Cabo",
  "Proteção elétrica",
  "Câmera",
  "Alarme",
  "Automação",
  "Ferramenta",
  "Outros",
];

const unidades: UnidadeEstoque[] = [
  "Unidade",
  "Metro",
  "Rolo",
  "Caixa",
  "Kit",
  "Par",
];


type FornecedorEstoque = {
  id: string;
  nome: string;
  contatos: string;
  tipo: string;
  status: string;
};

export default function EstoqueModule() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorEstoque[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] =
    useState<CategoriaEstoque>("Módulo solar");
  const [fabricante, setFabricante] = useState("");
  const [modelo, setModelo] = useState("");
  const [unidade, setUnidade] =
    useState<UnidadeEstoque>("Unidade");
  const [quantidadeAtual, setQuantidadeAtual] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [custoUnitario, setCustoUnitario] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [localArmazenamento, setLocalArmazenamento] =
    useState("");
  const [observacao, setObservacao] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [paginaProdutoUrl, setPaginaProdutoUrl] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [codigo, setCodigo] = useState("");
  const [especificacoes, setEspecificacoes] =
    useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState<
    "resumo" | "produtos" | "cadastro" | "movimentacoes"
  >("resumo");

  const [usarCatalogo, setUsarCatalogo] = useState(true);
  const [segmentoCatalogo, setSegmentoCatalogo] = useState("");
  const [categoriaCatalogo, setCategoriaCatalogo] = useState("");
  const [marcaCatalogo, setMarcaCatalogo] = useState("");
  const [linhaCatalogo, setLinhaCatalogo] = useState("");
  const [produtoCatalogoId, setProdutoCatalogoId] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<
    "Todas" | CategoriaEstoque
  >("Todas");

  useEffect(() => {
    const dadosSalvos = localStorage.getItem(CHAVE_PRODUTOS);

    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos);
        setProdutos(Array.isArray(dados) ? dados : []);
      } catch {
        localStorage.removeItem(CHAVE_PRODUTOS);
        setProdutos([]);
        setMensagem(
          "Os dados do estoque estavam inválidos e foram reiniciados.",
        );
      }
    }

    async function carregarFornecedores() {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id,nome,contatos,tipo,status")
        .eq("status", "Ativo")
        .order("nome", { ascending: true });

      if (error) {
        console.error("Erro ao carregar fornecedores:", error);
        return;
      }

      setFornecedores(
        (data ?? [])
          .filter(
            (item) =>
              String(item.tipo ?? "").trim().toLowerCase() !==
              "treinamento interno",
          )
          .map((item) => ({
            id: String(item.id),
            nome: item.nome ?? "",
            contatos: item.contatos ?? "",
            tipo: item.tipo ?? "",
            status: item.status ?? "Ativo",
          })),
      );
    }

    void carregarFornecedores();
    setDadosCarregados(true);
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;

    localStorage.setItem(
      CHAVE_PRODUTOS,
      JSON.stringify(produtos),
    );
  }, [produtos, dadosCarregados]);

  const categoriasCatalogo = useMemo(() => {
    return Array.from(
      new Set(
        catalogoProdutos
          .filter(
            (item) =>
              !segmentoCatalogo ||
              item.segmento === segmentoCatalogo,
          )
          .map((item) => item.categoriaCatalogo),
      ),
    ).sort();
  }, [segmentoCatalogo]);

  const marcasCatalogo = useMemo(() => {
    return Array.from(
      new Set(
        catalogoProdutos
          .filter(
            (item) =>
              (!segmentoCatalogo ||
                item.segmento === segmentoCatalogo) &&
              (!categoriaCatalogo ||
                item.categoriaCatalogo === categoriaCatalogo),
          )
          .map((item) => item.marca),
      ),
    ).sort();
  }, [segmentoCatalogo, categoriaCatalogo]);

  const linhasCatalogo = useMemo(() => {
    return Array.from(
      new Set(
        catalogoProdutos
          .filter(
            (item) =>
              (!segmentoCatalogo ||
                item.segmento === segmentoCatalogo) &&
              (!categoriaCatalogo ||
                item.categoriaCatalogo === categoriaCatalogo) &&
              (!marcaCatalogo || item.marca === marcaCatalogo),
          )
          .map((item) => item.linha),
      ),
    ).sort();
  }, [segmentoCatalogo, categoriaCatalogo, marcaCatalogo]);

  const produtosCatalogoFiltrados = useMemo(() => {
    return catalogoProdutos.filter((item) => {
      if (
        segmentoCatalogo &&
        item.segmento !== segmentoCatalogo
      ) {
        return false;
      }

      if (
        categoriaCatalogo &&
        item.categoriaCatalogo !== categoriaCatalogo
      ) {
        return false;
      }

      if (marcaCatalogo && item.marca !== marcaCatalogo) {
        return false;
      }

      if (linhaCatalogo && item.linha !== linhaCatalogo) {
        return false;
      }

      return true;
    });
  }, [
    segmentoCatalogo,
    categoriaCatalogo,
    marcaCatalogo,
    linhaCatalogo,
  ]);

  function selecionarProdutoCatalogo(id: string) {
    setProdutoCatalogoId(id);

    const item = catalogoProdutos.find(
      (produto) => produto.id === id,
    );

    if (!item) return;

    setNome(item.nome);
    setCategoria(item.categoriaEstoque);
    setFabricante(item.marca);
    setModelo(item.linha);
    setUnidade(item.unidade);
    setCodigo(item.codigo ?? "");
    setImagemUrl(item.imagemUrl ?? "");
    setPaginaProdutoUrl(item.paginaProdutoUrl ?? "");
    setManualUrl(item.manualUrl ?? "");
    setEspecificacoes(item.especificacoes ?? {});
    setObservacao(item.observacao ?? "");
  }

  function atualizarProdutos(
    produtosAtualizados: ProdutoEstoque[],
  ) {
    setProdutos(produtosAtualizados);
  }

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos
      .filter((produto) => {
        const atendeBusca =
          !termo ||
          produto.nome.toLowerCase().includes(termo) ||
          produto.fabricante?.toLowerCase().includes(termo) ||
          produto.modelo?.toLowerCase().includes(termo) ||
          produto.fornecedor?.toLowerCase().includes(termo);

        const atendeCategoria =
          filtroCategoria === "Todas" ||
          produto.categoria === filtroCategoria;

        return atendeBusca && atendeCategoria;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos, busca, filtroCategoria]);

  const resumo = useMemo(() => {
    let totalProdutos = 0;
    let estoqueBaixo = 0;
    let valorEstoque = 0;

    for (const produto of produtos) {
      if (!produto.ativo) continue;

      totalProdutos += 1;
      valorEstoque +=
        produto.quantidadeAtual * produto.custoUnitario;

      if (produto.quantidadeAtual <= produto.estoqueMinimo) {
        estoqueBaixo += 1;
      }
    }

    return {
      totalProdutos,
      estoqueBaixo,
      valorEstoque,
    };
  }, [produtos]);

  function salvarProduto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const quantidade = converterNumero(quantidadeAtual);
    const minimo = converterNumero(estoqueMinimo);
    const custo = converterNumero(custoUnitario);

    if (!nome.trim()) {
      setMensagem("Informe o nome do produto.");
      return;
    }

    if (quantidade < 0) {
      setMensagem("A quantidade não pode ser negativa.");
      return;
    }

    if (minimo < 0) {
      setMensagem("O estoque mínimo não pode ser negativo.");
      return;
    }

    if (custo < 0) {
      setMensagem("O custo unitário não pode ser negativo.");
      return;
    }

    const novoProduto: ProdutoEstoque = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      categoria,
      fabricante: fabricante.trim() || undefined,
      modelo: modelo.trim() || undefined,
      codigo: codigo.trim() || undefined,
      unidade,
      quantidadeAtual: quantidade,
      estoqueMinimo: minimo,
      custoUnitario: custo,
      fornecedor: fornecedor.trim() || undefined,
      localArmazenamento:
        localArmazenamento.trim() || undefined,
      observacao: observacao.trim() || undefined,
      imagemUrl: imagemUrl.trim() || undefined,
      paginaProdutoUrl: paginaProdutoUrl.trim() || undefined,
      manualUrl: manualUrl.trim() || undefined,
      especificacoes:
        Object.keys(especificacoes).length > 0
          ? especificacoes
          : undefined,
      ativo: true,
      criadoEm: new Date().toISOString(),
    };

    setProdutos((atuais) => [...atuais, novoProduto]);

    setNome("");
    setFabricante("");
    setModelo("");
    setQuantidadeAtual("");
    setEstoqueMinimo("");
    setCustoUnitario("");
    setFornecedor("");
    setLocalArmazenamento("");
    setObservacao("");
    setImagemUrl("");
    setPaginaProdutoUrl("");
    setManualUrl("");
    setCodigo("");
    setEspecificacoes({});
    setMensagem("Produto cadastrado com sucesso.");
    setSecaoAtiva("produtos");
  }

  function alternarStatus(id: string) {
    setProdutos((atuais) =>
      atuais.map((produto) =>
        produto.id === id
          ? { ...produto, ativo: !produto.ativo }
          : produto,
      ),
    );
  }

  function excluirProduto(id: string) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este produto?",
    );

    if (!confirmar) return;

    setProdutos((atuais) =>
      atuais.filter((produto) => produto.id !== id),
    );
  }

  return (
    <section className="p-4 md:p-7">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          Controle de estoque
        </p>
        <h2 className="mt-1 text-3xl font-black uppercase text-white">
          Estoque CHOQUESEG
        </h2>
        <p className="mt-2 text-zinc-400">
          Escolha uma opção no menu para consultar, cadastrar ou movimentar materiais.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-zinc-800 bg-black p-2">
            <p className="px-3 py-2 text-xs font-black uppercase text-zinc-500">
              Menu do estoque
            </p>

            <nav className="flex flex-col gap-2">
              {[
                ["resumo", "📊", "Resumo"],
                ["produtos", "📦", "Produtos cadastrados"],
                ["cadastro", "➕", "Cadastrar produto"],
                ["movimentacoes", "🔄", "Movimentações"],
              ].map(([id, icone, titulo]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSecaoAtiva(id as typeof secaoAtiva)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
                    secaoAtiva === id
                      ? "bg-yellow-400 text-black"
                      : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
                  }`}
                >
                  <span className="text-lg">{icone}</span>
                  <span>{titulo}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {secaoAtiva === "resumo" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
              <p className="text-xs font-black uppercase text-yellow-400">
                Visão geral
              </p>
              <h3 className="mt-1 mb-5 text-xl font-black uppercase text-white">
                Resumo do estoque
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
  <CardResumo
    titulo="Produtos ativos"
    valor={String(resumo.totalProdutos)}
  />

  <CardResumo
    titulo="Estoque baixo"
    valor={String(resumo.estoqueBaixo)}
  />

  <CardResumo
    titulo="Valor em estoque"
    valor={formatarMoeda(resumo.valorEstoque)}
  />
</div>
            </section>
          )}

          {secaoAtiva === "cadastro" && (
            <form
  onSubmit={salvarProduto}
  className="rounded-3xl border border-yellow-400/30 bg-black p-5"
>
  <h3 className="text-xl font-black uppercase text-yellow-400">
    Cadastrar produto
  </h3>

  <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
    <label className="flex items-center gap-3 text-sm font-black uppercase text-yellow-400">
      <input
        type="checkbox"
        checked={usarCatalogo}
        onChange={(evento) =>
          setUsarCatalogo(evento.target.checked)
        }
      />
      Usar produto pré-definido do catálogo
    </label>

    {usarCatalogo && (
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <CampoSelect
          label="Segmento"
          valor={segmentoCatalogo}
          onChange={(valor) => {
            setSegmentoCatalogo(valor);
            setCategoriaCatalogo("");
            setMarcaCatalogo("");
            setLinhaCatalogo("");
            setProdutoCatalogoId("");
          }}
          opcoes={["", ...segmentosCatalogo]}
        />

        <CampoSelect
          label="Categoria"
          valor={categoriaCatalogo}
          onChange={(valor) => {
            setCategoriaCatalogo(valor);
            setMarcaCatalogo("");
            setLinhaCatalogo("");
            setProdutoCatalogoId("");
          }}
          opcoes={["", ...categoriasCatalogo]}
        />

        <CampoSelect
          label="Marca"
          valor={marcaCatalogo}
          onChange={(valor) => {
            setMarcaCatalogo(valor);
            setLinhaCatalogo("");
            setProdutoCatalogoId("");
          }}
          opcoes={["", ...marcasCatalogo]}
        />

        <CampoSelect
          label="Linha/tipo"
          valor={linhaCatalogo}
          onChange={(valor) => {
            setLinhaCatalogo(valor);
            setProdutoCatalogoId("");
          }}
          opcoes={["", ...linhasCatalogo]}
        />

        <CampoSelect
          label="Produto"
          valor={produtoCatalogoId}
          onChange={selecionarProdutoCatalogo}
          opcoes={[
            "",
            ...produtosCatalogoFiltrados.map(
              (item) => item.id,
            ),
          ]}
          rotulos={[
            "Selecione um produto",
            ...produtosCatalogoFiltrados.map(
              (item) => item.nome,
            ),
          ]}
        />
      </div>
    )}

    {usarCatalogo && produtoCatalogoId && (
      <div className="mt-4 grid gap-4 rounded-2xl border border-yellow-400/20 bg-black p-4 md:grid-cols-[180px_1fr]">
        <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          {imagemUrl ? (
            <img
              src={imagemUrl}
              alt={nome || "Imagem do produto"}
              className="h-40 w-full object-contain p-3"
            />
          ) : (
            <div className="text-center text-zinc-500">
              <div className="text-5xl">📦</div>
              <p className="mt-2 text-xs font-bold uppercase">
                Imagem ainda não cadastrada
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-black uppercase text-yellow-400">
            Produto selecionado
          </p>
          <h4 className="mt-2 text-xl font-black text-white">
            {nome}
          </h4>
          <p className="mt-1 text-sm text-zinc-400">
            {[fabricante, modelo].filter(Boolean).join(" · ")}
          </p>

          {codigo && (
            <p className="mt-2 text-sm text-zinc-400">
              Código: {codigo}
            </p>
          )}

          {Object.keys(especificacoes).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(especificacoes).map(
                ([chave, valor]) => (
                  <span
                    key={chave}
                    className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                  >
                    {chave}: {valor}
                  </span>
                ),
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {paginaProdutoUrl && (
              <a
                href={paginaProdutoUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-yellow-400/50 px-4 py-2 text-xs font-black uppercase text-yellow-400"
              >
                Página oficial
              </a>
            )}

            {manualUrl && (
              <a
                href={manualUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-blue-500/50 px-4 py-2 text-xs font-black uppercase text-blue-400"
              >
                Manual
              </a>
            )}
          </div>
        </div>
      </div>
    )}
  </div>

  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <CampoTexto
      label="Nome do produto"
      valor={nome}
      onChange={setNome}
      placeholder="Ex.: Módulo Jinko 630W"
    />

    <CampoSelect
      label="Categoria"
      valor={categoria}
      onChange={(valor) =>
        setCategoria(valor as CategoriaEstoque)
      }
      opcoes={categorias}
    />

    <CampoTexto
      label="Fabricante"
      valor={fabricante}
      onChange={setFabricante}
      placeholder="Ex.: Jinko"
    />

    <CampoTexto
      label="Modelo"
      valor={modelo}
      onChange={setModelo}
      placeholder="Ex.: Tiger Neo"
    />

    <CampoSelect
      label="Unidade"
      valor={unidade}
      onChange={(valor) =>
        setUnidade(valor as UnidadeEstoque)
      }
      opcoes={unidades}
    />

    <CampoTexto
      label="Quantidade atual"
      valor={quantidadeAtual}
      onChange={setQuantidadeAtual}
      placeholder="Ex.: 20"
    />

    <CampoTexto
      label="Estoque mínimo"
      valor={estoqueMinimo}
      onChange={setEstoqueMinimo}
      placeholder="Ex.: 5"
    />

    <CampoTexto
      label="Custo unitário"
      valor={custoUnitario}
      onChange={setCustoUnitario}
      placeholder="Ex.: 650,00"
    />

    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        Fornecedor
      </label>

      <select
        value={fornecedor}
        onChange={(evento) => setFornecedor(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        <option value="">Selecione o fornecedor</option>
        {fornecedores.map((item) => (
          <option key={item.id} value={item.nome}>
            {item.nome}
            {item.contatos ? ` (${item.contatos})` : ""}
          </option>
        ))}
      </select>
    </div>

    <CampoTexto
      label="Local de armazenamento"
      valor={localArmazenamento}
      onChange={setLocalArmazenamento}
      placeholder="Ex.: Prateleira A"
    />

    <CampoTexto
      label="Código do produto"
      valor={codigo}
      onChange={setCodigo}
      placeholder="Ex.: VHD 1230 B"
    />

    <CampoTexto
      label="URL da imagem"
      valor={imagemUrl}
      onChange={setImagemUrl}
      placeholder="Imagem oficial ou própria"
    />

    <CampoTexto
      label="Página oficial"
      valor={paginaProdutoUrl}
      onChange={setPaginaProdutoUrl}
      placeholder="Link da página do fabricante"
    />

    <CampoTexto
      label="Manual"
      valor={manualUrl}
      onChange={setManualUrl}
      placeholder="Link do manual em PDF"
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
      placeholder="Detalhes adicionais do produto"
      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
    />
  </div>

  <button
    type="submit"
    className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
  >
    Cadastrar produto
  </button>
</form>
          )}

          {secaoAtiva === "produtos" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
  <div className="grid gap-4 md:grid-cols-2">
    <CampoTexto
      label="Pesquisar"
      valor={busca}
      onChange={setBusca}
      placeholder="Produto, fabricante, modelo ou fornecedor"
    />

    <CampoSelect
      label="Categoria"
      valor={filtroCategoria}
      onChange={(valor) =>
        setFiltroCategoria(
          valor as "Todas" | CategoriaEstoque,
        )
      }
      opcoes={["Todas", ...categorias]}
    />
  </div>

  <div className="mt-6 space-y-3">
    {produtosFiltrados.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
        Nenhum produto encontrado.
      </div>
    ) : (
      produtosFiltrados.map((produto) => {
        const estoqueBaixo =
          produto.quantidadeAtual <=
          produto.estoqueMinimo;

        return (
          <article
            key={produto.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
                    {produto.categoria}
                  </span>

                  <span
                    className={`rounded-lg px-3 py-1 text-xs font-black uppercase ${
                      produto.ativo
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {produto.ativo ? "Ativo" : "Inativo"}
                  </span>

                  {estoqueBaixo && produto.ativo && (
                    <span className="rounded-lg bg-red-500/15 px-3 py-1 text-xs font-black uppercase text-red-400">
                      Estoque baixo
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black">
                    {produto.imagemUrl ? (
                      <img
                        src={produto.imagemUrl}
                        alt={produto.nome}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-white">
                      {produto.nome}
                    </h4>

                    {produto.codigo && (
                      <p className="mt-1 text-xs font-bold text-yellow-400">
                        {produto.codigo}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-1 text-sm text-zinc-400">
                  {[produto.fabricante, produto.modelo]
                    .filter(Boolean)
                    .join(" · ") || "Sem fabricante ou modelo"}
                </p>

                <p className="mt-2 text-sm text-zinc-300">
                  Quantidade:{" "}
                  <strong>
                    {produto.quantidadeAtual} {produto.unidade}
                  </strong>
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Mínimo: {produto.estoqueMinimo} · Custo:{" "}
                  {formatarMoeda(produto.custoUnitario)}
                </p>

                {produto.localArmazenamento && (
                  <p className="mt-1 text-sm text-zinc-500">
                    Local: {produto.localArmazenamento}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {produto.paginaProdutoUrl && (
                  <a
                    href={produto.paginaProdutoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-blue-500/50 px-4 py-2 text-sm font-black uppercase text-blue-400"
                  >
                    Página
                  </a>
                )}

                {produto.manualUrl && (
                  <a
                    href={produto.manualUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-black uppercase text-zinc-300"
                  >
                    Manual
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => alternarStatus(produto.id)}
                  className="rounded-xl border border-yellow-400/50 px-4 py-2 text-sm font-black uppercase text-yellow-400"
                >
                  {produto.ativo ? "Inativar" : "Ativar"}
                </button>

                <button
                  type="button"
                  onClick={() => excluirProduto(produto.id)}
                  className="rounded-xl border border-red-500/50 px-4 py-2 text-sm font-black uppercase text-red-400"
                >
                  Excluir
                </button>
              </div>
            </div>
          </article>
        );
      })
    )}
  </div>
</section>
          )}

          {secaoAtiva === "movimentacoes" && (
            <MovimentacoesEstoque
              produtos={produtos}
              aoAtualizarProdutos={atualizarProdutos}
            />
          )}
        </main>
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
    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
      <p className="text-xs font-black uppercase text-zinc-500">
        {titulo}
      </p>

      <p className="mt-3 text-2xl font-black text-yellow-400">
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
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function CampoSelect({
  label,
  valor,
  onChange,
  opcoes,
  rotulos,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: string[];
  rotulos?: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>

      <select
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        {opcoes.map((opcao, indice) => (
          <option key={`${opcao}-${indice}`} value={opcao}>
            {rotulos?.[indice] ?? (opcao || "Todos")}
          </option>
        ))}
      </select>
    </div>
  );
}

function converterNumero(valor: string) {
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