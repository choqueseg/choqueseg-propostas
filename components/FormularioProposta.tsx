"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { createClient } from "@/utils/supabase/client";
import PreviewProposta, { DadosPreview, type InstalacaoPortfolio } from "./PreviewProposta";

const supabase = createClient();
import {
  type Equipamento,
  inversoresPadrao,
  microinversoresPadrao,
  modulosPadrao,
} from "./equipamentos";
type KitSolar = {
  id: string;
  nome: string;
  geracao: string;
  potencia: string;
  quantidadeModulos: string;
  moduloId: string;
  quantidadeInversores: string;
  inversorId: string;
  tipoInversor: "String" | "Microinversor";
  valor: string;
};

type Cliente = {
  id: string | number;
  nome: string;
  telefone?: string | null;
  cidade?: string | null;
  endereco?: string | null;
  cpf_cnpj?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
};

const kits: KitSolar[] = [
  { id: "300", nome: "Kit 300 kWh", geracao: "300", potencia: "2,50 kWp", quantidadeModulos: "4", moduloId: "jinko-630", quantidadeInversores: "2", inversorId: "hoymiles-1600", tipoInversor: "Microinversor", valor: "R$ 6.999,00" },
  { id: "400", nome: "Kit 400 kWh", geracao: "400", potencia: "2,84 kWp", quantidadeModulos: "4", moduloId: "jinko-710", quantidadeInversores: "2", inversorId: "hoymiles-2000", tipoInversor: "Microinversor", valor: "R$ 8.399,00" },
  { id: "500", nome: "Kit 500 kWh", geracao: "500", potencia: "3,55 kWp", quantidadeModulos: "5", moduloId: "jinko-710", quantidadeInversores: "1", inversorId: "huawei-3", tipoInversor: "String", valor: "R$ 8.950,00" },
  { id: "600", nome: "Kit 600 kWh", geracao: "600", potencia: "4,37 kWp", quantidadeModulos: "7", moduloId: "jinko-625", quantidadeInversores: "1", inversorId: "huawei-3", tipoInversor: "String", valor: "R$ 10.099,00" },
  { id: "700", nome: "Kit 700 kWh", geracao: "700", potencia: "5,62 kWp", quantidadeModulos: "9", moduloId: "jinko-625", quantidadeInversores: "1", inversorId: "huawei-5", tipoInversor: "String", valor: "R$ 12.799,00" },
  { id: "800", nome: "Kit 800 kWh", geracao: "800", potencia: "6,25 kWp", quantidadeModulos: "10", moduloId: "jinko-625", quantidadeInversores: "1", inversorId: "huawei-5", tipoInversor: "String", valor: "R$ 13.750,00" },
  { id: "900", nome: "Kit 900 kWh", geracao: "900", potencia: "6,88 kWp", quantidadeModulos: "11", moduloId: "jinko-625", quantidadeInversores: "1", inversorId: "huawei-6", tipoInversor: "String", valor: "R$ 14.699,00" },
  { id: "1000", nome: "Kit 1000 kWh", geracao: "1000", potencia: "7,50 kWp", quantidadeModulos: "12", moduloId: "jinko-625", quantidadeInversores: "1", inversorId: "huawei-6", tipoInversor: "String", valor: "R$ 15.999,00" },
  { id: "1200", nome: "Kit 1200 kWh", geracao: "1200", potencia: "9,23 kWp", quantidadeModulos: "13", moduloId: "jinko-710", quantidadeInversores: "1", inversorId: "huawei-8", tipoInversor: "String", valor: "R$ 18.250,00" },
  { id: "1300", nome: "Kit 1300 kWh", geracao: "1300", potencia: "9,23 kWp", quantidadeModulos: "13", moduloId: "jinko-710", quantidadeInversores: "1", inversorId: "huawei-8", tipoInversor: "String", valor: "R$ 19.599,00" },
  { id: "1500", nome: "Kit 1500 kWh", geracao: "1500", potencia: "11,36 kWp", quantidadeModulos: "16", moduloId: "jinko-710", quantidadeInversores: "1", inversorId: "huawei-10", tipoInversor: "String", valor: "R$ 22.799,00" },
];

type Formulario = {
  clienteId: string;
  nome: string;
  telefone: string;
  cidade: string;
  enderecoCliente: string;
  cpfCnpj: string;
  consumo: string;
  valorConta: string;
  kitId: string;
  modoSistema: "kit" | "personalizado";
  geracao: string;
  potencia: string;
  quantidadeModulos: string;
  moduloId: string;
  quantidadeInversores: string;
  inversorId: string;
  tipoInversor: "String" | "Microinversor";
  valorProposta: string;
  percentualCartao: string;
  parcelasCartao: string;
  percentualFinanciamento: string;
  parcelasFinanciamento: string;
  enderecoLoja: string;
  garantiaDesempenhoModulo: string;
  garantiaModulo: string;
  garantiaInversor: string;
  garantiaInstalacao: string;
  temaPDF: "claro" | "escuro";
};

const formularioInicial: Formulario = {
  clienteId: "", nome: "", telefone: "", cidade: "", enderecoCliente: "", cpfCnpj: "",
  consumo: "", valorConta: "", kitId: "",
  modoSistema: "kit", geracao: "", potencia: "", quantidadeModulos: "", moduloId: "",
  quantidadeInversores: "1", inversorId: "", tipoInversor: "String", valorProposta: "",
  percentualCartao: "", parcelasCartao: "18", percentualFinanciamento: "", parcelasFinanciamento: "84",
  enderecoLoja: "",
  garantiaDesempenhoModulo: "25", garantiaModulo: "10", garantiaInversor: "10", garantiaInstalacao: "1",
  temaPDF: "claro",
};

const instalacoesIniciais: InstalacaoPortfolio[] = Array.from({ length: 4 }, () => ({
  foto: "",
  cidade: "",
  descricao: "",
}));

async function comprimirImagem(arquivo: File): Promise<string> {
  if (!arquivo.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem.");
  }

  const urlTemporaria = URL.createObjectURL(arquivo);

  try {
    const imagem = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
      img.src = urlTemporaria;
    });

    const limiteLargura = 1400;
    const limiteAltura = 900;
    const proporcao = Math.min(
      limiteLargura / imagem.naturalWidth,
      limiteAltura / imagem.naturalHeight,
      1,
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(imagem.naturalWidth * proporcao));
    canvas.height = Math.max(1, Math.round(imagem.naturalHeight * proporcao));

    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("Não foi possível processar a imagem.");

    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    URL.revokeObjectURL(urlTemporaria);
  }
}

function numero(valor?: string | number | null) {
  const texto = String(valor ?? "");

  const limpo = texto
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const convertido = Number(limpo);

  return Number.isFinite(convertido) ? convertido : 0;
}

function dinheiro(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function esperarImagens(elemento: HTMLElement) {
  const imagens = Array.from(elemento.querySelectorAll("img"));

  await Promise.all(
    imagens.map(
      (imagem) =>
        new Promise<void>((resolve) => {
          // Mesmo que a imagem tenha falhado, não deixa o PDF travado.
          if (imagem.complete) {
            resolve();
            return;
          }

          const finalizar = () => resolve();

          imagem.addEventListener("load", finalizar, { once: true });
          imagem.addEventListener("error", finalizar, { once: true });

          // Segurança: libera a geração após 5 segundos.
          setTimeout(finalizar, 5000);
        }),
    ),
  );
}

export default function FormularioProposta() {
  const [formulario, setFormulario] = useState<Formulario>(formularioInicial);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [gerandoPDFCelular, setGerandoPDFCelular] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState<number | null>(null);
  const [instalacoes, setInstalacoes] = useState<InstalacaoPortfolio[]>(instalacoesIniciais);
  const [modulos, setModulos] = useState<Equipamento[]>(modulosPadrao);
  const [inversores, setInversores] = useState<Equipamento[]>(inversoresPadrao);
  const [microinversores, setMicroinversores] = useState<Equipamento[]>(microinversoresPadrao);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [erroClientes, setErroClientes] = useState("");
  const [escalaPreview, setEscalaPreview] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewCelularRef = useRef<HTMLDivElement>(null);
  const previewAreaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const salvos = localStorage.getItem("choqueseg-equipamentos");
      if (!salvos) return;
      const dados = JSON.parse(salvos) as { modulos?: Equipamento[]; inversores?: Equipamento[]; microinversores?: Equipamento[] };
      if (dados.modulos?.length) setModulos(dados.modulos);
      if (dados.inversores?.length) setInversores(dados.inversores);
      if (dados.microinversores?.length) setMicroinversores(dados.microinversores);
    } catch (erro) {
      console.error("Não foi possível carregar os equipamentos:", erro);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarClientes() {
      setCarregandoClientes(true);
      setErroClientes("");

      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome", { ascending: true });

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar clientes:", error);
        setErroClientes(`Não foi possível carregar os clientes: ${error.message}`);
        setClientes([]);
      } else {
        setClientes((data ?? []) as Cliente[]);
      }

      setCarregandoClientes(false);
    }

    void carregarClientes();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const elemento = previewAreaRef.current;
    if (!elemento) return;

    const ajustar = () => {
      const larguraDisponivel = Math.max(elemento.clientWidth - 16, 280);
      const novaEscala = Math.min(1, Math.max(0.32, larguraDisponivel / 794));
      setEscalaPreview(novaEscala);
    };

    ajustar();

    const observador = new ResizeObserver(ajustar);
    observador.observe(elemento);
    window.addEventListener("resize", ajustar);

    return () => {
      observador.disconnect();
      window.removeEventListener("resize", ajustar);
    };
  }, []);

  useEffect(() => {
    const enderecoSalvo = localStorage.getItem("choqueseg-endereco-loja") || "";
    if (enderecoSalvo) {
      setFormulario((anterior) => ({ ...anterior, enderecoLoja: enderecoSalvo }));
    }
  }, []);

  useEffect(() => {
    const temaSalvo = localStorage.getItem("choqueseg-tema-pdf");
    if (temaSalvo === "claro" || temaSalvo === "escuro") {
      setFormulario((anterior) => ({ ...anterior, temaPDF: temaSalvo }));
    }
  }, []);

  function salvarEquipamentos(novosModulos: Equipamento[], novosInversores: Equipamento[], novosMicroinversores: Equipamento[]) {
    localStorage.setItem("choqueseg-equipamentos", JSON.stringify({ modulos: novosModulos, inversores: novosInversores, microinversores: novosMicroinversores }));
  }

  const listaInversores = formulario.tipoInversor === "Microinversor" ? microinversores : inversores;
  const moduloSelecionado = modulos.find((item) => item.id === formulario.moduloId);
  const inversorSelecionado = listaInversores.find((item) => item.id === formulario.inversorId);

  const potenciaCalculada = useMemo(() => {
    if (formulario.modoSistema !== "personalizado") return formulario.potencia;
    const quantidade = numero(formulario.quantidadeModulos);
    const watts = numero(moduloSelecionado?.potencia || "");
    if (!quantidade || !watts) return "";
    return `${((quantidade * watts) / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWp`;
  }, [formulario.modoSistema, formulario.potencia, formulario.quantidadeModulos, moduloSelecionado]);

  const calculos = useMemo(() => {
    const valorBase = numero(formulario.valorProposta);
    const percentualCartao = numero(formulario.percentualCartao);
    const parcelasCartao = Math.max(Math.round(numero(formulario.parcelasCartao)), 1);
    const percentualFinanciamento = numero(formulario.percentualFinanciamento);
    const parcelasFinanciamento = Math.max(Math.round(numero(formulario.parcelasFinanciamento)), 1);
    const totalCartao = valorBase * (1 + percentualCartao / 100);
    const totalFinanciamento = valorBase * (1 + percentualFinanciamento / 100);
    return {
      valorBase, totalCartao, parcelasCartao,
      parcelaCartao: totalCartao / parcelasCartao,
      totalFinanciamento, parcelasFinanciamento,
      parcelaFinanciamento: totalFinanciamento / parcelasFinanciamento,
    };
  }, [formulario.valorProposta, formulario.percentualCartao, formulario.parcelasCartao, formulario.percentualFinanciamento, formulario.parcelasFinanciamento]);

  const validacaoEconomia = useMemo(() => {
    const consumo = numero(formulario.consumo);
    const conta = numero(formulario.valorConta);
    const geracao = numero(formulario.geracao);

    if (!consumo || !conta || !geracao) {
      return { mostrar: false, texto: "" };
    }

    const custoMedioKwh = conta / consumo;
    if (custoMedioKwh < 0.35 || custoMedioKwh > 2.5) {
      return {
        mostrar: true,
        texto: `Confira a conta mensal informada. Ela equivale a ${dinheiro(custoMedioKwh)}/kWh, valor fora da faixa usual. Isso altera economia e payback.`,
      };
    }

    return { mostrar: false, texto: "" };
  }, [formulario.consumo, formulario.valorConta, formulario.geracao]);

  function atualizarCampo(campo: keyof Formulario, valor: string) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    if (campo === "enderecoLoja") {
      localStorage.setItem("choqueseg-endereco-loja", valor);
    }
    if (campo === "temaPDF") {
      localStorage.setItem("choqueseg-tema-pdf", valor);
    }
  }

  function selecionarCliente(clienteId: string) {
    const cliente = clientes.find((item) => String(item.id) === clienteId);

    if (!cliente) {
      setFormulario((anterior) => ({
        ...anterior,
        clienteId: "",
        nome: "",
        telefone: "",
        cidade: "",
        enderecoCliente: "",
        cpfCnpj: "",
      }));
      return;
    }

    const cpfCnpj =
      cliente.cpf_cnpj?.trim() ||
      cliente.cpf?.trim() ||
      cliente.cnpj?.trim() ||
      "";

    setFormulario((anterior) => ({
      ...anterior,
      clienteId: String(cliente.id),
      nome: cliente.nome ?? "",
      telefone: cliente.telefone ?? "",
      cidade: cliente.cidade ?? "",
      enderecoCliente: cliente.endereco ?? "",
      cpfCnpj,
    }));
  }

  function mudarModo(modoSistema: Formulario["modoSistema"]) {
    setFormulario((anterior) => ({
      ...formularioInicial,
      clienteId: anterior.clienteId,
      nome: anterior.nome,
      telefone: anterior.telefone,
      cidade: anterior.cidade,
      enderecoCliente: anterior.enderecoCliente,
      cpfCnpj: anterior.cpfCnpj,
      consumo: anterior.consumo,
      valorConta: anterior.valorConta,
      percentualCartao: anterior.percentualCartao, parcelasCartao: anterior.parcelasCartao,
      percentualFinanciamento: anterior.percentualFinanciamento, parcelasFinanciamento: anterior.parcelasFinanciamento,
      enderecoLoja: anterior.enderecoLoja,
      garantiaDesempenhoModulo: anterior.garantiaDesempenhoModulo, garantiaModulo: anterior.garantiaModulo,
      garantiaInversor: anterior.garantiaInversor, garantiaInstalacao: anterior.garantiaInstalacao,
      temaPDF: anterior.temaPDF,
      modoSistema,
    }));
  }

  function selecionarKit(kitId: string) {
    const kit = kits.find((item) => item.id === kitId);
    if (!kit) {
      setFormulario((anterior) => ({ ...anterior, kitId: "", geracao: "", potencia: "", quantidadeModulos: "", moduloId: "", quantidadeInversores: "1", inversorId: "", tipoInversor: "String", valorProposta: "" }));
      return;
    }
    setFormulario((anterior) => ({ ...anterior, kitId: kit.id, geracao: kit.geracao, potencia: kit.potencia, quantidadeModulos: kit.quantidadeModulos, moduloId: kit.moduloId, quantidadeInversores: kit.quantidadeInversores, inversorId: kit.inversorId, tipoInversor: kit.tipoInversor, valorProposta: kit.valor }));
  }

  function adicionarEquipamento(tipo: "modulo" | "inversor" | "microinversor") {
    const marca = window.prompt("Marca do equipamento:")?.trim();
    if (!marca) return;
    const modelo = window.prompt("Modelo do equipamento:")?.trim() || "";
    const potencia = window.prompt("Potência (ex.: 630 W ou 6 kW):")?.trim();
    if (!potencia) return;
    const id = `${tipo}-${Date.now()}`;
    const novo: Equipamento = { id, marca, modelo, potencia };
    if (tipo === "modulo") {
      const bifacial = window.confirm("Este módulo é bifacial?");
      novo.bifacial = bifacial;
      const novaLista = [...modulos, novo];
      setModulos(novaLista);
      salvarEquipamentos(novaLista, inversores, microinversores);
      atualizarCampo("moduloId", id);
    } else if (tipo === "inversor") {
      const novaLista = [...inversores, novo];
      setInversores(novaLista);
      salvarEquipamentos(modulos, novaLista, microinversores);
      atualizarCampo("inversorId", id);
    } else {
      const novaLista = [...microinversores, novo];
      setMicroinversores(novaLista);
      salvarEquipamentos(modulos, inversores, novaLista);
      atualizarCampo("inversorId", id);
    }
  }

  function atualizarInstalacao(
    indice: number,
    campo: keyof InstalacaoPortfolio,
    valor: string,
  ) {
    setInstalacoes((anteriores) =>
      anteriores.map((instalacao, posicao) =>
        posicao === indice ? { ...instalacao, [campo]: valor } : instalacao,
      ),
    );
  }

  async function escolherFoto(indice: number, arquivo?: File) {
    if (!arquivo) return;

    try {
      setProcessandoFoto(indice);
      const fotoComprimida = await comprimirImagem(arquivo);
      atualizarInstalacao(indice, "foto", fotoComprimida);
    } catch (erro) {
      console.error("Erro ao carregar foto:", erro);
      alert(erro instanceof Error ? erro.message : "Não foi possível carregar a foto.");
    } finally {
      setProcessandoFoto(null);
    }
  }

  function removerFoto(indice: number) {
    atualizarInstalacao(indice, "foto", "");
  }

  const dadosPreview: DadosPreview = {
    nome: formulario.nome, telefone: formulario.telefone, cidade: formulario.cidade,
    consumo: formulario.consumo, valorConta: formulario.valorConta, geracao: formulario.geracao,
    potencia: formulario.modoSistema === "personalizado" ? potenciaCalculada : formulario.potencia,
    quantidadeModulos: formulario.quantidadeModulos,
    marcaModulo: moduloSelecionado?.marca || "",
    modeloModulo: moduloSelecionado?.modelo || "",
    potenciaModulo: moduloSelecionado?.potencia || "",
    moduloBifacial: Boolean(moduloSelecionado?.bifacial),
    quantidadeInversores: formulario.quantidadeInversores,
    marcaInversor: inversorSelecionado?.marca || "",
    modeloInversor: inversorSelecionado?.modelo || "",
    potenciaInversor: inversorSelecionado?.potencia || "",
    tipoInversor: formulario.tipoInversor,
    valorProposta: calculos.valorBase > 0 ? dinheiro(calculos.valorBase) : formulario.valorProposta,
    parcelasCartao: calculos.parcelasCartao,
    totalCartao: calculos.totalCartao > 0 ? dinheiro(calculos.totalCartao) : "—",
    parcelaCartao: calculos.parcelaCartao > 0 ? dinheiro(calculos.parcelaCartao) : "—",
    parcelasFinanciamento: calculos.parcelasFinanciamento,
    totalFinanciamento: calculos.totalFinanciamento > 0 ? dinheiro(calculos.totalFinanciamento) : "—",
    parcelaFinanciamento: calculos.parcelaFinanciamento > 0 ? dinheiro(calculos.parcelaFinanciamento) : "—",
    instalacoes,
    enderecoLoja: formulario.enderecoLoja,
    garantiaDesempenhoModulo: formulario.garantiaDesempenhoModulo,
    garantiaModulo: formulario.garantiaModulo,
    garantiaInversor: formulario.garantiaInversor,
    garantiaInstalacao: formulario.garantiaInstalacao,
    temaPDF: formulario.temaPDF,
  };

  function adicionarLinkFechamento(pdf: jsPDF, indicePagina: number) {
    if (indicePagina !== 2) return;

    const url =
      "https://wa.me/5579999390653?text=" +
      encodeURIComponent(
        "Olá, quero fechar minha proposta de Energia Solar com a CHOQUESEG.",
      );

    // Área clicável sobre o botão da página 3.
    pdf.link(126, 251, 73, 21, { url });
  }

 async function gerarPDF() {
  const raiz = previewCelularRef.current;

  if (!raiz) {
    alert("Não foi possível localizar a proposta.");
    return;
  }

  try {
    setGerandoPDF(true);

    const paginas = Array.from(
      raiz.querySelectorAll<HTMLElement>("[data-pagina-proposta]"),
    );

    if (paginas.length === 0) {
      alert("Nenhuma página da proposta foi encontrada.");
      return;
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let indice = 0; indice < paginas.length; indice += 1) {
      const pagina = paginas[indice];

      console.log(`Iniciando página ${indice + 1}`);

      const captura = html2canvas(pagina, {
        scale: 0.8,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#000000",
        logging: true,
        imageTimeout: 5000,
        removeContainer: true,
      });

      const limiteTempo = new Promise<never>((_, rejeitar) => {
        setTimeout(() => {
          rejeitar(
            new Error(
              `A página ${indice + 1} demorou mais de 20 segundos para ser processada.`,
            ),
          );
        }, 20000);
      });

      const canvas = await Promise.race([captura, limiteTempo]);

      console.log(`Página ${indice + 1} capturada`);

      const imagem = canvas.toDataURL("image/jpeg", 0.6);

      if (indice > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        imagem,
        "JPEG",
        0,
        0,
        210,
        297,
        undefined,
        "FAST",
      );

      adicionarLinkFechamento(pdf, indice);

      canvas.width = 1;
      canvas.height = 1;
    }

    const nomeCliente =
      formulario.nome
        .trim()
        .replace(/[^a-zA-ZÀ-ÿ0-9]+/g, "-") || "Cliente";

    pdf.save(`Proposta-CHOQUESEG-${nomeCliente}.pdf`);

    alert("PDF gerado com sucesso.");
  } catch (erro) {
    console.error("Erro detalhado ao gerar PDF:", erro);

    alert(
      erro instanceof Error
        ? erro.message
        : "Ocorreu um erro desconhecido ao gerar o PDF.",
    );
  } finally {
    setGerandoPDF(false);
  }
 }

  async function gerarPDFCelular() {
    const raiz = previewCelularRef.current;
    if (!raiz) {
      alert("Não foi possível localizar a proposta para celular.");
      return;
    }

    try {
      setGerandoPDFCelular(true);
      const paginas = Array.from(
        raiz.querySelectorAll<HTMLElement>("[data-pagina-proposta]"),
      );

      if (paginas.length === 0) {
        alert("Nenhuma página da proposta para celular foi encontrada.");
        return;
      }

      const larguraPdf = 210;
      const alturaPdf = 297;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      for (let indice = 0; indice < paginas.length; indice += 1) {
        const pagina = paginas[indice];
        await esperarImagens(pagina);

        const canvas = await html2canvas(pagina, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 5000,
          removeContainer: true,
        });

        const imagem = canvas.toDataURL("image/jpeg", 0.9);
        if (indice > 0) pdf.addPage("a4", "portrait");

        pdf.addImage(
          imagem, "JPEG", 0, 0, larguraPdf, alturaPdf, undefined, "FAST",
        );
        adicionarLinkFechamento(pdf, indice);

        canvas.width = 1;
        canvas.height = 1;
      }

      const nomeCliente =
        formulario.nome.trim().replace(/[^a-zA-ZÀ-ÿ0-9]+/g, "-") || "Cliente";

      pdf.save(`Proposta-CHOQUESEG-Celular-${nomeCliente}.pdf`);
      alert("PDF para celular gerado com sucesso.");
    } catch (erro) {
      console.error("Erro ao gerar PDF para celular:", erro);
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível gerar o PDF para celular.",
      );
    } finally {
      setGerandoPDFCelular(false);
    }
  }


   

  function montarMensagemWhatsApp() {
    const nome = formulario.nome.trim() || "cliente";
    const potenciaSistema =
      formulario.modoSistema === "personalizado"
        ? potenciaCalculada
        : formulario.potencia;

    const valorVista =
      calculos.valorBase > 0
        ? dinheiro(calculos.valorBase)
        : formulario.valorProposta || "—";

    const cartao =
      calculos.parcelaCartao > 0
        ? `${calculos.parcelasCartao}x de ${dinheiro(calculos.parcelaCartao)}`
        : `até ${calculos.parcelasCartao}x`;

    return [
      `Olá, ${nome}! Segue sua proposta de Energia Solar da CHOQUESEG.`,
      formulario.geracao ? `Geração estimada: ${formulario.geracao} kWh/mês.` : "",
      potenciaSistema ? `Potência do sistema: ${potenciaSistema}.` : "",
      `Valor à vista: ${valorVista}.`,
      `Cartão: ${cartao}.`,
      "Financiamento em até 84 meses, sujeito à análise e aprovação.",
      "Materiais, equipamentos e garantias estão detalhados no PDF.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function abrirWhatsApp() {
    const telefone = formulario.telefone.replace(/\D/g, "");
    if (telefone.length < 10) {
      alert("Informe um telefone válido do cliente antes de abrir o WhatsApp.");
      return;
    }

    const destino = telefone.startsWith("55") ? telefone : `55${telefone}`;
    const mensagemPadrao = montarMensagemWhatsApp();
    const mensagemEditada = window.prompt(
      "Revise a mensagem que acompanhará o PDF. Você pode alterar antes de enviar:",
      mensagemPadrao,
    );

    if (mensagemEditada === null) return;

    const mensagem = encodeURIComponent(mensagemEditada.trim() || mensagemPadrao);
    window.open(`https://wa.me/${destino}?text=${mensagem}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-yellow-400/40 bg-black/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">ChoqueSeg</p><h1 className="text-lg font-black uppercase md:text-2xl">Gerador de proposta solar</h1></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={gerarPDF} disabled={gerandoPDF} className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black disabled:opacity-60">{gerandoPDF ? "Gerando PDF..." : "Gerar PDF"}</button>
            <button type="button" onClick={gerarPDFCelular} disabled={gerandoPDFCelular} className="rounded-xl border border-yellow-400 bg-black px-4 py-3 text-sm font-black uppercase text-yellow-400 disabled:opacity-60">{gerandoPDFCelular ? "Gerando celular..." : "📱 PDF Celular"}</button>
            <button
              type="button"
              onClick={() => atualizarCampo("temaPDF", "claro")}
              className={`rounded-xl border px-3 py-3 text-xs font-black uppercase ${
                formulario.temaPDF === "claro"
                  ? "border-yellow-400 bg-white text-black"
                  : "border-zinc-600 bg-zinc-900 text-white"
              }`}
            >
              PDF Claro
            </button>
            <button
              type="button"
              onClick={() => atualizarCampo("temaPDF", "escuro")}
              className={`rounded-xl border px-3 py-3 text-xs font-black uppercase ${
                formulario.temaPDF === "escuro"
                  ? "border-yellow-400 bg-black text-yellow-400"
                  : "border-zinc-600 bg-zinc-900 text-white"
              }`}
            >
              PDF Escuro
            </button>
            <button type="button" onClick={abrirWhatsApp} className="rounded-xl bg-green-600 px-4 py-3 text-sm font-black uppercase text-white">Abrir WhatsApp</button>
            <button type="button" onClick={() => {
              setFormulario((anterior) => ({
                ...formularioInicial,
                enderecoLoja: anterior.enderecoLoja,
                temaPDF: anterior.temaPDF,
              }));
              setInstalacoes(instalacoesIniciais);
            }} className="rounded-xl border border-zinc-600 px-4 py-3 text-sm font-black uppercase text-white">Limpar</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1920px] gap-3 p-3 xl:grid-cols-[minmax(270px,30%)_minmax(0,70%)] xl:p-4">
        <aside className="min-w-0 self-start rounded-3xl border border-yellow-400/50 bg-black p-4 xl:sticky xl:top-24">
          <div className="mb-6 text-center"><img src="/imagens/logo/brasao-choqueseg.png" alt="Brasão ChoqueSeg" className="mx-auto h-24 w-24 object-contain" /><p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-yellow-400">Preenchimento da proposta</p></div>
          <div className="space-y-5">
            <SecaoFormulario titulo="Cliente">
              <Select
                titulo={carregandoClientes ? "Carregando clientes..." : "Cliente cadastrado"}
                valor={formulario.clienteId}
                aoAlterar={selecionarCliente}
                opcoes={clientes.map((cliente) => ({
                  valor: String(cliente.id),
                  texto: cliente.nome,
                }))}
              />

              {erroClientes && (
                <div className="rounded-xl border border-red-500/60 bg-red-950/30 px-3 py-2 text-xs font-bold text-red-200">
                  {erroClientes}
                </div>
              )}

              <p className="text-xs leading-relaxed text-zinc-400">
                Ao selecionar um cliente, nome, telefone, cidade, endereço e CPF/CNPJ são preenchidos automaticamente. Todos continuam editáveis.
              </p>

              <Campo titulo="Nome" valor={formulario.nome} aoAlterar={(v) => atualizarCampo("nome", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Campo titulo="Telefone" valor={formulario.telefone} aoAlterar={(v) => atualizarCampo("telefone", v)} />
                <Campo titulo="Cidade" valor={formulario.cidade} aoAlterar={(v) => atualizarCampo("cidade", v)} />
              </div>
              <Campo titulo="Endereço do cliente" valor={formulario.enderecoCliente} aoAlterar={(v) => atualizarCampo("enderecoCliente", v)} />
              <Campo titulo="CPF / CNPJ" valor={formulario.cpfCnpj} aoAlterar={(v) => atualizarCampo("cpfCnpj", v)} />

              <div className="grid grid-cols-2 gap-3">
                <Campo titulo="Consumo kWh" valor={formulario.consumo} aoAlterar={(v) => atualizarCampo("consumo", v)} />
                <Campo titulo="Conta mensal (R$)" valor={formulario.valorConta} aoAlterar={(v) => atualizarCampo("valorConta", v)} />
              </div>

              {validacaoEconomia.mostrar && (
                <div className="rounded-xl border border-red-500/70 bg-red-950/40 px-3 py-2 text-xs font-bold leading-relaxed text-red-200">
                  ⚠ {validacaoEconomia.texto}
                </div>
              )}
            </SecaoFormulario>

            <SecaoFormulario titulo="Sistema solar">
              <div className="grid grid-cols-2 gap-2"><BotaoModo ativo={formulario.modoSistema === "kit"} texto="Kit pronto" aoClicar={() => mudarModo("kit")} /><BotaoModo ativo={formulario.modoSistema === "personalizado"} texto="Personalizado" aoClicar={() => mudarModo("personalizado")} /></div>
              {formulario.modoSistema === "kit" && <Select titulo="Kit" valor={formulario.kitId} aoAlterar={selecionarKit} opcoes={kits.map((kit) => ({ valor: kit.id, texto: `${kit.nome} — ${kit.valor}` }))} />}
              <div className="grid grid-cols-2 gap-3"><Campo titulo="Geração/mês" valor={formulario.geracao} somenteLeitura={formulario.modoSistema === "kit"} aoAlterar={(v) => atualizarCampo("geracao", v)} /><Campo titulo="Potência" valor={formulario.modoSistema === "personalizado" ? potenciaCalculada : formulario.potencia} somenteLeitura aoAlterar={() => undefined} /></div>
              <div className="grid grid-cols-2 gap-3"><Campo titulo="Qtd. módulos" valor={formulario.quantidadeModulos} somenteLeitura={formulario.modoSistema === "kit"} aoAlterar={(v) => atualizarCampo("quantidadeModulos", v)} /><Select titulo="Tipo de inversor" valor={formulario.tipoInversor} aoAlterar={(v) => setFormulario((anterior) => ({ ...anterior, tipoInversor: v as Formulario["tipoInversor"], inversorId: "" }))} opcoes={[{ valor: "String", texto: "Inversor String" }, { valor: "Microinversor", texto: "Microinversor" }]} /></div>
              <SelectComAdicionar titulo="Módulo" valor={formulario.moduloId} aoAlterar={(v) => atualizarCampo("moduloId", v)} opcoes={modulos.map((item) => ({ valor: item.id, texto: `${item.marca} ${item.modelo} ${item.potencia}` }))} aoAdicionar={() => adicionarEquipamento("modulo")} />
              <div className="grid grid-cols-[100px_1fr] gap-3"><Campo titulo="Quantidade" valor={formulario.quantidadeInversores} aoAlterar={(v) => atualizarCampo("quantidadeInversores", v)} /><SelectComAdicionar titulo={formulario.tipoInversor === "Microinversor" ? "Microinversor" : "Inversor"} valor={formulario.inversorId} aoAlterar={(v) => atualizarCampo("inversorId", v)} opcoes={listaInversores.map((item) => ({ valor: item.id, texto: `${item.marca} ${item.modelo} ${item.potencia}` }))} aoAdicionar={() => adicionarEquipamento(formulario.tipoInversor === "Microinversor" ? "microinversor" : "inversor")} /></div>
              <Campo titulo="Valor da proposta" valor={formulario.valorProposta} aoAlterar={(v) => atualizarCampo("valorProposta", v)} />
            </SecaoFormulario>

            <SecaoFormulario titulo="Pagamento">
              <p className="text-xs leading-relaxed text-zinc-400">Os percentuais aparecem somente no gerador. O cliente verá o valor final e as parcelas.</p>
              <PagamentoFormulario titulo="Cartão" percentual={formulario.percentualCartao} parcelas={formulario.parcelasCartao} parcelaCalculada={calculos.parcelaCartao} aoPercentual={(v) => atualizarCampo("percentualCartao", v)} aoParcelas={(v) => atualizarCampo("parcelasCartao", v)} />
              <PagamentoFormulario titulo="Financiamento" percentual={formulario.percentualFinanciamento} parcelas={formulario.parcelasFinanciamento} parcelaCalculada={calculos.parcelaFinanciamento} aoPercentual={(v) => atualizarCampo("percentualFinanciamento", v)} aoParcelas={(v) => atualizarCampo("parcelasFinanciamento", v)} />
            </SecaoFormulario>

            <SecaoFormulario titulo="Rodapé da proposta">
              <Campo titulo="Endereço da loja CHOQUESEG" valor={formulario.enderecoLoja} aoAlterar={(v) => atualizarCampo("enderecoLoja", v)} />
              <p className="text-xs leading-relaxed text-zinc-400">Este campo é somente o endereço da loja da CHOQUESEG. Ele fica salvo neste computador e aparece automaticamente no rodapé das duas páginas. Não usa o endereço do cliente.</p>
            </SecaoFormulario>

            <SecaoFormulario titulo="Garantias">
              <div className="grid grid-cols-2 gap-3">
                <Campo titulo="Desempenho do módulo (anos)" valor={formulario.garantiaDesempenhoModulo} aoAlterar={(v) => atualizarCampo("garantiaDesempenhoModulo", v)} />
                <Campo titulo="Garantia do módulo (anos)" valor={formulario.garantiaModulo} aoAlterar={(v) => atualizarCampo("garantiaModulo", v)} />
                <Campo titulo="Garantia do inversor (anos)" valor={formulario.garantiaInversor} aoAlterar={(v) => atualizarCampo("garantiaInversor", v)} />
                <Campo titulo="Garantia da instalação (anos)" valor={formulario.garantiaInstalacao} aoAlterar={(v) => atualizarCampo("garantiaInstalacao", v)} />
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">Os valores são editáveis para acompanhar exatamente as garantias dos equipamentos selecionados na proposta.</p>
            </SecaoFormulario>

            <SecaoFormulario titulo="Fotos das instalações">
              <div className="rounded-2xl border border-yellow-400 bg-yellow-400/10 p-3">
                <p className="text-sm font-black uppercase text-yellow-400">
                  Escolha as fotos que aparecerão nesta proposta
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                  Em cada bloco, selecione uma foto do celular, informe a cidade/local e escreva a descrição da instalação.
                </p>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                Escolha até quatro fotos do celular e informe o local e a descrição.
                As imagens são reduzidas automaticamente para o PDF não travar.
              </p>

              <div className="space-y-4">
                {instalacoes.map((instalacao, indice) => (
                  <div
                    key={indice}
                    className="rounded-2xl border border-zinc-700 bg-zinc-900 p-3"
                  >
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-yellow-400">
                      Instalação {indice + 1}
                    </p>

                    <label className="block cursor-pointer">
                      <span className="mb-2 block rounded-xl border border-dashed border-yellow-400/70 bg-black px-3 py-3 text-center text-sm font-black uppercase text-yellow-400">
                        {processandoFoto === indice
                          ? "Processando foto..."
                          : instalacao.foto
                            ? "Trocar foto"
                            : "Escolher foto"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={processandoFoto !== null}
                        onChange={(evento) => {
                          const arquivo = evento.target.files?.[0];
                          void escolherFoto(indice, arquivo);
                          evento.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {instalacao.foto && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-zinc-700">
                        <img
                          src={instalacao.foto}
                          alt={`Prévia da instalação ${indice + 1}`}
                          className="aspect-[16/7] w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removerFoto(indice)}
                          className="w-full bg-red-700 px-3 py-2 text-xs font-black uppercase text-white"
                        >
                          Remover foto
                        </button>
                      </div>
                    )}

                    <div className="mt-3 space-y-3">
                      <Campo
                        titulo="Cidade / local"
                        valor={instalacao.cidade}
                        aoAlterar={(valor) => atualizarInstalacao(indice, "cidade", valor)}
                      />
                      <Campo
                        titulo="Descrição"
                        valor={instalacao.descricao}
                        aoAlterar={(valor) => atualizarInstalacao(indice, "descricao", valor)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SecaoFormulario>
          </div>
        </aside>
        <section
          ref={previewAreaRef}
          className="min-w-0 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 p-2"
        >
          <div className="flex w-full justify-center overflow-hidden">
            <div
              className="w-[794px] origin-top"
              style={{ zoom: escalaPreview } as CSSProperties}
            >
              <PreviewProposta ref={previewRef} dados={dadosPreview} />
            </div>
          </div>
        </section>
        <div aria-hidden="true" className="pointer-events-none fixed left-[-10000px] top-0 w-[794px] bg-white">
          <PreviewProposta ref={previewCelularRef} dados={dadosPreview} />
        </div>
      </div>
    </main>
  );
}

function SecaoFormulario({ titulo, children }: { titulo: string; children: React.ReactNode }) { return <section className="space-y-3 border-t border-zinc-800 pt-5 first:border-t-0 first:pt-0"><h2 className="text-sm font-black uppercase tracking-[0.18em] text-yellow-400">{titulo}</h2>{children}</section>; }
function Campo({ titulo, valor, aoAlterar, somenteLeitura = false }: { titulo: string; valor: string; aoAlterar: (valor: string) => void; somenteLeitura?: boolean }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-zinc-200">{titulo}</span><input type="text" value={valor} readOnly={somenteLeitura} autoComplete="off" onChange={(e) => aoAlterar(e.target.value)} className={`w-full rounded-xl border px-3 py-3 text-white outline-none ${somenteLeitura ? "cursor-not-allowed border-zinc-800 bg-zinc-800 text-zinc-400" : "border-zinc-700 bg-zinc-900 focus:border-yellow-400"}`} /></label>; }
function Select({ titulo, valor, aoAlterar, opcoes }: { titulo: string; valor: string; aoAlterar: (valor: string) => void; opcoes: { valor: string; texto: string }[] }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-zinc-200">{titulo}</span><select value={valor} onChange={(e) => aoAlterar(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"><option value="">Selecione</option>{opcoes.map((opcao) => <option key={opcao.valor} value={opcao.valor}>{opcao.texto}</option>)}</select></label>; }
function SelectComAdicionar({ titulo, valor, aoAlterar, opcoes, aoAdicionar }: { titulo: string; valor: string; aoAlterar: (valor: string) => void; opcoes: { valor: string; texto: string }[]; aoAdicionar: () => void }) { return <div><div className="mb-1.5 flex items-center justify-between gap-2"><span className="text-sm font-bold text-zinc-200">{titulo}</span><button type="button" onClick={aoAdicionar} className="text-xs font-black uppercase text-yellow-400 hover:text-yellow-300">+ Adicionar</button></div><select value={valor} onChange={(e) => aoAlterar(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"><option value="">Selecione</option>{opcoes.map((opcao) => <option key={opcao.valor} value={opcao.valor}>{opcao.texto}</option>)}</select></div>; }
function PagamentoFormulario({ titulo, percentual, parcelas, parcelaCalculada, aoPercentual, aoParcelas }: { titulo: string; percentual: string; parcelas: string; parcelaCalculada: number; aoPercentual: (valor: string) => void; aoParcelas: (valor: string) => void }) { return <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-3"><p className="mb-3 font-black uppercase text-yellow-400">{titulo}</p><div className="grid grid-cols-2 gap-3"><Campo titulo="Acréscimo %" valor={percentual} aoAlterar={aoPercentual} /><Campo titulo="Parcelas" valor={parcelas} aoAlterar={aoParcelas} /></div><p className="mt-3 text-sm font-bold">{Math.max(Math.round(numero(parcelas)), 1)}x de <span className="text-yellow-400">{parcelaCalculada > 0 ? dinheiro(parcelaCalculada) : "—"}</span></p></div>; }
function BotaoModo({ ativo, texto, aoClicar }: { ativo: boolean; texto: string; aoClicar: () => void }) { return <button type="button" onClick={aoClicar} className={`rounded-xl border px-3 py-3 text-sm font-black uppercase ${ativo ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-700 bg-zinc-900 text-white"}`}>{texto}</button>; }