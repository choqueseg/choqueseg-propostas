"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";

type AbaProjeto = "telhado" | "parede";

type CorElemento = "branco" | "preto" | "cinza" | "vermelho" | "azul";
type MarcaInversor = "Huawei" | "Growatt" | "Solplanet" | "AUXSOL" | "Genérico";
type TipoStringBox = "cc" | "ca";

type ElementoVisual = {
  id: string;
  tipo: "modulo" | "inversor" | "eletroduto" | "caixa4x2" | "stringbox";
  x: number;
  y: number;
  largura: number;
  altura: number;
  rotacao: number;
  escala: number;
  cor?: CorElemento;
  marcaInversor?: MarcaInversor;
  tipoStringBox?: TipoStringBox;
  grupoId?: string;
};

type ArrasteAtivo = {
  id: string;
  contexto: AbaProjeto;
  inicioX: number;
  inicioY: number;
  posicoesIniciais: Record<string, { x: number; y: number }>;
} | null;

type GestoToque = {
  id: string;
  contexto: AbaProjeto;
  ponteiros: Map<number, { x: number; y: number }>;
  baseX: number;
  baseY: number;
  baseEscala: number;
  baseRotacao: number;
  baseCentroX: number;
  baseCentroY: number;
  baseDistancia: number;
  baseAngulo: number;
} | null;

const MODULO_PADRAO = {
  largura: 94,
  altura: 176,
};

const INVERSOR_PADRAO = {
  largura: 110,
  altura: 150,
};

const IMAGENS_INVERSORES: Partial<Record<MarcaInversor, string>> = {
  Huawei: "/imagens/projetos3d/inversor-huawei.png",
  Growatt: "/imagens/projetos3d/inversor-growatt.jpg",
  Solplanet: "/imagens/projetos3d/inversor-solplanet.png",
  AUXSOL: "/imagens/projetos3d/inversor-auxsol.jpg",
};

const IMAGEM_STRINGBOX_CC = "/imagens/projetos3d/stringbox-clamper.png";
const IMAGEM_STRINGBOX_CA = "/imagens/projetos3d/caixa-sobrepor-tramontina-referencia.png";

type Projetos3DModuleProps = {
  aoSair?: () => void;
};

export default function Projetos3DModule({
  aoSair,
}: Projetos3DModuleProps) {
  const [aba, setAba] = useState<AbaProjeto>("telhado");
  const [quantidadeModulosPorClique, setQuantidadeModulosPorClique] = useState<1 | 2 | 3>(1);
  const [mostrarGrade, setMostrarGrade] = useState(false);

  const [imagemTelhado, setImagemTelhado] = useState<string>("");
  const [imagemParede, setImagemParede] = useState<string>("");

  const [elementosTelhado, setElementosTelhado] = useState<ElementoVisual[]>([]);
  const [elementosParede, setElementosParede] = useState<ElementoVisual[]>([]);

  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [arraste, setArraste] = useState<ArrasteAtivo>(null);
  const gestoToqueRef = useRef<GestoToque>(null);
  const elementosTelhadoRef = useRef<ElementoVisual[]>([]);
  const elementosParedeRef = useRef<ElementoVisual[]>([]);

  const [marcaDaguaAtiva, setMarcaDaguaAtiva] = useState(true);
  const [marcaDaguaProcessada, setMarcaDaguaProcessada] = useState<string>("");
  const [recorteBrasaoAtivo, setRecorteBrasaoAtivo] = useState(true);
  const [marcaDaguaPosicao, setMarcaDaguaPosicao] = useState<
    "superior-esquerdo" | "superior-direito" | "inferior-esquerdo" | "inferior-direito"
  >("inferior-direito");
  const [marcaDaguaTamanho, setMarcaDaguaTamanho] = useState(110);
  const [marcaDaguaOpacidade, setMarcaDaguaOpacidade] = useState(0.55);
  const [logoPersonalizada, setLogoPersonalizada] = useState<string>("");

  const [ajusteTelhado, setAjusteTelhado] = useState<"contain" | "cover">("cover");
  const [ajusteParede, setAjusteParede] = useState<"contain" | "cover">("cover");
  const [rotacaoFotoTelhado, setRotacaoFotoTelhado] = useState(0);
  const [rotacaoFotoParede, setRotacaoFotoParede] = useState(0);
  const [posicaoFotoTelhado, setPosicaoFotoTelhado] = useState("50% 50%");
  const [posicaoFotoParede, setPosicaoFotoParede] = useState("50% 50%");

  const [escalaXTelhado, setEscalaXTelhado] = useState(1);
  const [escalaYTelhado, setEscalaYTelhado] = useState(1);
  const [escalaXParede, setEscalaXParede] = useState(1);
  const [escalaYParede, setEscalaYParede] = useState(1);

  const [offsetXTelhado, setOffsetXTelhado] = useState(0);
  const [offsetYTelhado, setOffsetYTelhado] = useState(0);
  const [offsetXParede, setOffsetXParede] = useState(0);
  const [offsetYParede, setOffsetYParede] = useState(0);

  const areaTelhadoRef = useRef<HTMLDivElement>(null);
  const areaParedeRef = useRef<HTMLDivElement>(null);
  const areaCompartilhadaRef = useRef<HTMLDivElement>(null);

  const elementos =
    aba === "parede" ? elementosParede : elementosTelhado;
  const setElementos = aba === "telhado" ? setElementosTelhado : setElementosParede;
  const imagemAtual =
    aba === "parede" ? imagemParede : imagemTelhado;
  const ajusteImagem = aba === "telhado" ? ajusteTelhado : ajusteParede;
  const rotacaoFoto = aba === "telhado" ? rotacaoFotoTelhado : rotacaoFotoParede;
  const posicaoFoto = aba === "telhado" ? posicaoFotoTelhado : posicaoFotoParede;
  const escalaXFoto = aba === "telhado" ? escalaXTelhado : escalaXParede;
  const escalaYFoto = aba === "telhado" ? escalaYTelhado : escalaYParede;
  const offsetXFoto = aba === "telhado" ? offsetXTelhado : offsetXParede;
  const offsetYFoto = aba === "telhado" ? offsetYTelhado : offsetYParede;
  const areaAtualRef =
    aba === "parede" ? areaParedeRef : areaTelhadoRef;

  const posicaoVerticalBase =
    posicaoFoto === "50% 0%" ? "0%" : posicaoFoto === "50% 100%" ? "100%" : "50%";

  const posicaoFotoComOffset =
    `calc(50% + ${offsetXFoto}px) calc(${posicaoVerticalBase} + ${offsetYFoto}px)`;

  const selecionado = useMemo(
    () => elementos.find((item) => item.id === selecionadoId) ?? null,
    [elementos, selecionadoId],
  );

  useEffect(() => {
    elementosTelhadoRef.current = elementosTelhado;
  }, [elementosTelhado]);

  useEffect(() => {
    elementosParedeRef.current = elementosParede;
  }, [elementosParede]);

  function lerImagem(arquivo: File | null, destino: AbaProjeto) {
    if (!arquivo) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultado = String(reader.result ?? "");
      if (destino === "telhado") setImagemTelhado(resultado);
      else setImagemParede(resultado);
    };
    reader.readAsDataURL(arquivo);
  }

  function adicionarModulos(quantidade: 1 | 2 | 3 = quantidadeModulosPorClique) {
    setAba("telhado");

    setElementosTelhado((atuais) => {
      const modulosAtuais = atuais.filter((item) => item.tipo === "modulo");

      // O próximo módulo nasce ao lado do módulo que estiver selecionado.
      // Se nenhum módulo estiver selecionado, usa o último módulo criado.
      const moduloSelecionado =
        modulosAtuais.find((item) => item.id === selecionadoId) ?? null;
      const moduloBase =
        moduloSelecionado ??
        (modulosAtuais.length > 0 ? modulosAtuais[modulosAtuais.length - 1] : null);

      const escala = moduloBase?.escala ?? 0.7;
      const rotacao = moduloBase?.rotacao ?? 0;
      const larguraVisual = MODULO_PADRAO.largura * escala;

      // Deixa os módulos do mesmo lote praticamente encostados.
      const espacamentoInterno = 0;
      const espacamentoEntreLotes = 8;

      const xInicial = moduloBase
        ? moduloBase.x + larguraVisual + espacamentoEntreLotes
        : 60;
      const yInicial = moduloBase?.y ?? 60;

      const grupoId =
        quantidade > 1 ? `grupo-modulos-${crypto.randomUUID()}` : undefined;

      const novos: ElementoVisual[] = Array.from(
        { length: quantidade },
        (_, indice) => ({
          id: crypto.randomUUID(),
          tipo: "modulo" as const,
          x: xInicial + indice * (larguraVisual + espacamentoInterno),
          y: yInicial,
          largura: MODULO_PADRAO.largura,
          altura: MODULO_PADRAO.altura,
          rotacao,
          escala,
          grupoId,
        }),
      );

      setSelecionadoId(novos[novos.length - 1].id);
      return [...atuais, ...novos];
    });
  }

  function adicionarModulo() {
    adicionarModulos(quantidadeModulosPorClique);
  }

  function adicionarInversor() {
    const novo: ElementoVisual = {
      id: crypto.randomUUID(),
      tipo: "inversor",
      x: 100,
      y: 80,
      largura: INVERSOR_PADRAO.largura,
      altura: INVERSOR_PADRAO.altura,
      rotacao: 0,
      escala: 1,
      cor: "branco",
      marcaInversor: "Genérico",
    };
    setElementosParede((atuais) => [...atuais, novo]);
    setAba("parede");
    setSelecionadoId(novo.id);
  }

  function adicionarEletroduto() {
    const novo: ElementoVisual = {
      id: crypto.randomUUID(),
      tipo: "eletroduto",
      x: 120,
      y: 250,
      largura: 220,
      altura: 10,
      rotacao: 90,
      escala: 1,
      cor: "branco",
    };
    setElementosParede((atuais) => [...atuais, novo]);
    setAba("parede");
    setSelecionadoId(novo.id);
  }

  function adicionarCaixa4x2() {
    const novo: ElementoVisual = {
      id: crypto.randomUUID(),
      tipo: "caixa4x2",
      x: 180,
      y: 220,
      largura: 72,
      altura: 42,
      rotacao: 0,
      escala: 1,
      cor: "branco",
    };
    setElementosParede((atuais) => [...atuais, novo]);
    setAba("parede");
    setSelecionadoId(novo.id);
  }

  function adicionarStringBox(tipoStringBox: TipoStringBox) {
    const novo: ElementoVisual = {
      id: crypto.randomUUID(),
      tipo: "stringbox",
      x: 280,
      y: 170,
      largura: 180,
      altura: 150,
      rotacao: 0,
      escala: 1,
      cor: "branco",
      tipoStringBox,
    };
    setElementosParede((atuais) => [...atuais, novo]);
    setAba("parede");
    setSelecionadoId(novo.id);
  }

  async function removerFundoExternoDoBrasao(src: string) {
    return new Promise<string>((resolve) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;
        const visitado = new Uint8Array(width * height);
        const fila: number[] = [];

        function distanciaCor(
          r1: number,
          g1: number,
          b1: number,
          r2: number,
          g2: number,
          b2: number,
        ) {
          return Math.sqrt(
            (r1 - r2) ** 2 +
            (g1 - g2) ** 2 +
            (b1 - b2) ** 2,
          );
        }

        // Usa a média dos quatro cantos para identificar a cor do fundo externo
        // do arquivo do brasão, seja ela preta, branca ou cinza.
        const cantos = [
          [0, 0],
          [width - 1, 0],
          [0, height - 1],
          [width - 1, height - 1],
        ];

        let fundoR = 0;
        let fundoG = 0;
        let fundoB = 0;

        for (const [x, y] of cantos) {
          const p = (y * width + x) * 4;
          fundoR += data[p];
          fundoG += data[p + 1];
          fundoB += data[p + 2];
        }

        fundoR /= cantos.length;
        fundoG /= cantos.length;
        fundoB /= cantos.length;

        function ehFundoExterno(indicePixel: number) {
          const p = indicePixel * 4;
          const r = data[p];
          const g = data[p + 1];
          const b = data[p + 2];
          const a = data[p + 3];

          if (a === 0) return false;

          return distanciaCor(r, g, b, fundoR, fundoG, fundoB) < 85;
        }

        function adicionar(x: number, y: number) {
          if (x < 0 || y < 0 || x >= width || y >= height) return;

          const indice = y * width + x;
          if (visitado[indice] || !ehFundoExterno(indice)) return;

          visitado[indice] = 1;
          fila.push(indice);
        }

        for (let x = 0; x < width; x++) {
          adicionar(x, 0);
          adicionar(x, height - 1);
        }

        for (let y = 0; y < height; y++) {
          adicionar(0, y);
          adicionar(width - 1, y);
        }

        let cursor = 0;

        while (cursor < fila.length) {
          const indice = fila[cursor++];
          const x = indice % width;
          const y = Math.floor(indice / width);
          const p = indice * 4;

          data[p + 3] = 0;

          adicionar(x - 1, y);
          adicionar(x + 1, y);
          adicionar(x, y - 1);
          adicionar(x, y + 1);
        }

        // Suaviza apenas a borda externa para não deixar halo/preto/branco
        // ao redor do brasão.
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const indice = y * width + x;
            const p = indice * 4;

            if (data[p + 3] === 0) continue;

            let vizinhoTransparente = false;

            for (let yy = -1; yy <= 1 && !vizinhoTransparente; yy++) {
              for (let xx = -1; xx <= 1; xx++) {
                const vizinho = ((y + yy) * width + (x + xx)) * 4;
                if (data[vizinho + 3] === 0) {
                  vizinhoTransparente = true;
                  break;
                }
              }
            }

            if (vizinhoTransparente) {
              const dist = distanciaCor(
                data[p],
                data[p + 1],
                data[p + 2],
                fundoR,
                fundoG,
                fundoB,
              );

              if (dist < 120) {
                data[p + 3] = Math.min(data[p + 3], 90);
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => resolve(src);
      img.src = src;
    });
  }


  function lerLogoPersonalizada(arquivo: File | null) {
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const original = String(reader.result ?? "");
      setLogoPersonalizada(original);
      const processada = await removerFundoExternoDoBrasao(original);
      setMarcaDaguaProcessada(processada);
    };
    reader.readAsDataURL(arquivo);
  }

  function classeCor(cor: CorElemento | undefined, tipo: ElementoVisual["tipo"]) {
    if (tipo === "inversor") {
      return cor === "azul"
        ? { fundo: "#1463a5", borda: "#0b3e6b", texto: "#ffffff", detalhe: "#dbeafe" }
        : { fundo: "#f4f4f5", borda: "#d4d4d8", texto: "#27272a", detalhe: "#d4d4d8" };
    }

    switch (cor) {
      case "preto":
        return { fundo: "#111111", borda: "#27272a", texto: "#ffffff", detalhe: "#3f3f46" };
      case "cinza":
        return { fundo: "#9ca3af", borda: "#6b7280", texto: "#111827", detalhe: "#d1d5db" };
      case "vermelho":
        return { fundo: "#dc2626", borda: "#991b1b", texto: "#ffffff", detalhe: "#fecaca" };
      default:
        return { fundo: "#ffffff", borda: "#d4d4d8", texto: "#18181b", detalhe: "#e4e4e7" };
    }
  }

  function atualizarSelecionado(parcial: Partial<ElementoVisual>) {
    if (!selecionadoId) return;
    setElementos((atuais) =>
      atuais.map((item) =>
        item.id === selecionadoId ? { ...item, ...parcial } : item,
      ),
    );
  }

  function girarSelecionado(delta: number) {
    if (!selecionadoId) return;
    setElementos((atuais) =>
      atuais.map((item) =>
        item.id === selecionadoId
          ? { ...item, rotacao: (item.rotacao + delta + 360) % 360 }
          : item,
      ),
    );
  }

  function redimensionarSelecionado(fator: number) {
    if (!selecionadoId) return;
    setElementos((atuais) =>
      atuais.map((item) =>
        item.id === selecionadoId
          ? {
              ...item,
              escala: Math.min(3, Math.max(0.2, Number((item.escala * fator).toFixed(3)))),
            }
          : item,
      ),
    );
  }

  function duplicarSelecionado() {
    if (!selecionado) return;
    const copia: ElementoVisual = {
      ...selecionado,
      id: crypto.randomUUID(),
      x: selecionado.x + 24,
      y: selecionado.y + 24,
    };
    setElementos((atuais) => [...atuais, copia]);
    setSelecionadoId(copia.id);
  }

  function excluirSelecionado() {
    if (!selecionadoId) return;

    // Mesmo que o módulo pertença a um grupo, apaga somente o item selecionado.
    setElementos((atuais) =>
      atuais.filter((item) => item.id !== selecionadoId),
    );
    setSelecionadoId(null);
  }

  function excluirElementoDaCena(id: string, contexto: AbaProjeto) {
    if (contexto === "telhado") {
      setElementosTelhado((atuais) => atuais.filter((item) => item.id !== id));
    } else {
      setElementosParede((atuais) => atuais.filter((item) => item.id !== id));
    }

    gestoToqueRef.current = null;
    setArraste(null);
    setSelecionadoId((atual) => (atual === id ? null : atual));
  }

  function obterElementoAtual(contexto: AbaProjeto, id: string) {
    const lista =
      contexto === "telhado"
        ? elementosTelhadoRef.current
        : elementosParedeRef.current;
    return lista.find((item) => item.id === id) ?? null;
  }

  function atualizarElementoNoContexto(
    contexto: AbaProjeto,
    id: string,
    atualizador: (item: ElementoVisual) => ElementoVisual,
  ) {
    const aplicar = (atuais: ElementoVisual[]) => {
      const novos = atuais.map((item) =>
        item.id === id ? atualizador(item) : item,
      );

      if (contexto === "telhado") elementosTelhadoRef.current = novos;
      else elementosParedeRef.current = novos;

      return novos;
    };

    if (contexto === "telhado") setElementosTelhado(aplicar);
    else setElementosParede(aplicar);
  }

  function distanciaPontos(
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function anguloPontos(
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) {
    return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  }

  function centroPontos(
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    };
  }

  function diferencaAngular(atual: number, inicial: number) {
    let delta = atual - inicial;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    return delta;
  }

  function rebasearGesto(gesto: NonNullable<GestoToque>) {
    const elemento = obterElementoAtual(gesto.contexto, gesto.id);
    if (!elemento) return;

    const pontos = Array.from(gesto.ponteiros.values());
    gesto.baseX = elemento.x;
    gesto.baseY = elemento.y;
    gesto.baseEscala = elemento.escala;
    gesto.baseRotacao = elemento.rotacao;

    if (pontos.length >= 2) {
      const [a, b] = pontos;
      const centro = centroPontos(a, b);
      gesto.baseCentroX = centro.x;
      gesto.baseCentroY = centro.y;
      gesto.baseDistancia = Math.max(1, distanciaPontos(a, b));
      gesto.baseAngulo = anguloPontos(a, b);
    } else if (pontos.length === 1) {
      gesto.baseCentroX = pontos[0].x;
      gesto.baseCentroY = pontos[0].y;
      gesto.baseDistancia = 1;
      gesto.baseAngulo = 0;
    }
  }

  function aplicarGestoToque(gesto: NonNullable<GestoToque>) {
    const pontos = Array.from(gesto.ponteiros.values());
    if (pontos.length === 0) return;

    if (pontos.length === 1) {
      const ponto = pontos[0];
      const dx = ponto.x - gesto.baseCentroX;
      const dy = ponto.y - gesto.baseCentroY;

      atualizarElementoNoContexto(gesto.contexto, gesto.id, (item) => ({
        ...item,
        x: Math.max(0, gesto.baseX + dx),
        y: Math.max(0, gesto.baseY + dy),
      }));
      return;
    }

    const [a, b] = pontos;
    const centro = centroPontos(a, b);
    const distancia = Math.max(1, distanciaPontos(a, b));
    const angulo = anguloPontos(a, b);

    const fatorEscala = distancia / Math.max(1, gesto.baseDistancia);
    const novaEscala = Math.min(
      3,
      Math.max(0.2, gesto.baseEscala * fatorEscala),
    );
    const novaRotacao =
      (gesto.baseRotacao +
        diferencaAngular(angulo, gesto.baseAngulo) +
        360) %
      360;

    atualizarElementoNoContexto(gesto.contexto, gesto.id, (item) => ({
      ...item,
      x: Math.max(0, gesto.baseX + (centro.x - gesto.baseCentroX)),
      y: Math.max(0, gesto.baseY + (centro.y - gesto.baseCentroY)),
      escala: Number(novaEscala.toFixed(3)),
      rotacao: novaRotacao,
    }));
  }

  function iniciarArraste(
    evento: React.PointerEvent<HTMLDivElement>,
    elemento: ElementoVisual,
  ) {
    // No celular, gestos são tratados por Touch Events nativos.
    // Pointer Events ficam somente para mouse/caneta, preservando o desktop.
    if (evento.pointerType === "touch") return;

    evento.preventDefault();
    evento.stopPropagation();
    evento.currentTarget.setPointerCapture(evento.pointerId);

    const contexto: AbaProjeto =
      elemento.tipo === "modulo" ? "telhado" : "parede";

    setAba(contexto);
    setSelecionadoId(elemento.id);

    const posicoesIniciais = {
      [elemento.id]: { x: elemento.x, y: elemento.y },
    };

    setArraste({
      id: elemento.id,
      contexto,
      inicioX: evento.clientX,
      inicioY: evento.clientY,
      posicoesIniciais,
    });
  }

  function moverArraste(evento: React.PointerEvent<HTMLDivElement>) {
    if (evento.pointerType === "touch") return;
    if (!arraste) return;

    const dx = evento.clientX - arraste.inicioX;
    const dy = evento.clientY - arraste.inicioY;

    const atualizarPosicao = (atuais: ElementoVisual[]) =>
      atuais.map((item) => {
        const inicio = arraste.posicoesIniciais[item.id];
        if (!inicio) return item;

        return {
          ...item,
          x: Math.max(0, inicio.x + dx),
          y: Math.max(0, inicio.y + dy),
        };
      });

    if (arraste.contexto === "telhado") {
      setElementosTelhado(atualizarPosicao);
    } else {
      setElementosParede(atualizarPosicao);
    }
  }

  function finalizarArraste(evento?: React.PointerEvent<HTMLDivElement>) {
    if (evento?.pointerType === "touch") return;
    setArraste(null);
  }

  function pontosDoTouch(
    touches: React.TouchList | TouchList,
  ) {
    const mapa = new Map<number, { x: number; y: number }>();

    for (let indice = 0; indice < touches.length; indice++) {
      const toque = touches.item(indice);
      if (!toque) continue;

      mapa.set(toque.identifier, {
        x: toque.clientX,
        y: toque.clientY,
      });
    }

    return mapa;
  }

  function iniciarGestoTouchElemento(
    evento: React.TouchEvent<HTMLDivElement>,
    elemento: ElementoVisual,
  ) {
    evento.preventDefault();
    evento.stopPropagation();

    const contexto: AbaProjeto =
      elemento.tipo === "modulo" ? "telhado" : "parede";

    setAba(contexto);
    setSelecionadoId(elemento.id);

    const ponteiros = pontosDoTouch(evento.touches);
    const pontos = Array.from(ponteiros.values());

    const gesto: NonNullable<GestoToque> = {
      id: elemento.id,
      contexto,
      ponteiros,
      baseX: elemento.x,
      baseY: elemento.y,
      baseEscala: elemento.escala,
      baseRotacao: elemento.rotacao,
      baseCentroX: pontos[0]?.x ?? 0,
      baseCentroY: pontos[0]?.y ?? 0,
      baseDistancia: 1,
      baseAngulo: 0,
    };

    gestoToqueRef.current = gesto;
    rebasearGesto(gesto);
  }

  function iniciarTouchNaArea(
    evento: React.TouchEvent<HTMLDivElement>,
    contexto: AbaProjeto,
  ) {
    const gesto = gestoToqueRef.current;
    if (!gesto || gesto.contexto !== contexto) return;

    evento.preventDefault();

    const quantidadeAnterior = gesto.ponteiros.size;
    gesto.ponteiros = pontosDoTouch(evento.touches);

    // Quando entra o segundo dedo, cria uma nova referência exatamente
    // no estado atual para a pinça/giro começar sem salto.
    if (gesto.ponteiros.size !== quantidadeAnterior) {
      rebasearGesto(gesto);
    }
  }

  function moverTouchNaArea(
    evento: React.TouchEvent<HTMLDivElement>,
    contexto: AbaProjeto,
  ) {
    const gesto = gestoToqueRef.current;
    if (!gesto || gesto.contexto !== contexto) return;

    evento.preventDefault();

    gesto.ponteiros = pontosDoTouch(evento.touches);
    aplicarGestoToque(gesto);
  }

  function finalizarTouchNaArea(
    evento: React.TouchEvent<HTMLDivElement>,
    contexto: AbaProjeto,
  ) {
    const gesto = gestoToqueRef.current;
    if (!gesto || gesto.contexto !== contexto) return;

    evento.preventDefault();

    gesto.ponteiros = pontosDoTouch(evento.touches);

    if (gesto.ponteiros.size === 0) {
      gestoToqueRef.current = null;
      return;
    }

    rebasearGesto(gesto);
  }

  useEffect(() => {
    function atalhoTeclado(evento: KeyboardEvent) {
      if (!selecionadoId) return;

      const alvo = evento.target as HTMLElement | null;
      if (
        alvo?.tagName === "INPUT" ||
        alvo?.tagName === "TEXTAREA" ||
        alvo?.tagName === "SELECT"
      ) {
        return;
      }

      if (evento.key === "Delete") {
        evento.preventDefault();
        setElementos((atuais) =>
          atuais.filter((item) => item.id !== selecionadoId),
        );
        setSelecionadoId(null);
        return;
      }

      const teclaMais =
        evento.key === "+" ||
        evento.code === "NumpadAdd" ||
        (evento.key === "=" && evento.shiftKey);

      if (teclaMais) {
        evento.preventDefault();

        const original = elementos.find((item) => item.id === selecionadoId);

        if (original?.tipo === "modulo") {
          adicionarModulos(quantidadeModulosPorClique);
          return;
        }

        setElementos((atuais) => {
          const itemOriginal = atuais.find((item) => item.id === selecionadoId);
          if (!itemOriginal) return atuais;

          const copia: ElementoVisual = {
            ...itemOriginal,
            id: crypto.randomUUID(),
            x: itemOriginal.x + 18,
            y: itemOriginal.y + 18,
          };

          setSelecionadoId(copia.id);
          return [...atuais, copia];
        });

        return;
      }

      const passo = evento.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (evento.key === "ArrowLeft") dx = -passo;
      else if (evento.key === "ArrowRight") dx = passo;
      else if (evento.key === "ArrowUp") dy = -passo;
      else if (evento.key === "ArrowDown") dy = passo;
      else return;

      evento.preventDefault();

      setElementos((atuais) => {
        return atuais.map((item) => {
          if (item.id !== selecionadoId) return item;

          return {
            ...item,
            x: Math.max(0, item.x + dx),
            y: Math.max(0, item.y + dy),
          };
        });
      });
    }

    window.addEventListener("keydown", atalhoTeclado);
    return () => window.removeEventListener("keydown", atalhoTeclado);
  }, [selecionadoId, aba, quantidadeModulosPorClique, elementos]);

  async function gerarImagem() {
    const area = areaCompartilhadaRef.current;
    if (!area) return;

    const canvas = await html2canvas(area, {
      scale: 2,
      backgroundColor: "#111111",
      useCORS: true,
    });

    const link = document.createElement("a");
    link.download = "simulacao-completa-choqueseg.png";
    link.href = canvas.toDataURL("image/png", 1);
    link.click();
  }

  function renderElemento(elemento: ElementoVisual) {
    const selecionado = elemento.id === selecionadoId;

    const comum = {
      left: elemento.x,
      top: elemento.y,
      width: elemento.largura,
      height: elemento.altura,
      transform: `rotate(${elemento.rotacao}deg) scale(${elemento.escala})`,
      transformOrigin: "center center",
      touchAction: "none" as const,
      userSelect: "none" as const,
      WebkitUserSelect: "none" as const,
      WebkitTouchCallout: "none" as const,
    };

    const contextoElemento: AbaProjeto =
      elemento.tipo === "modulo" ? "telhado" : "parede";

    const botaoExcluir = selecionado ? (
      <button
        type="button"
        aria-label="Excluir este elemento"
        onPointerDown={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
        }}
        onPointerUp={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
        }}
        onClick={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          excluirElementoDaCena(elemento.id, contextoElemento);
        }}
        className="absolute right-1 top-1 z-[100] flex h-8 w-8 touch-manipulation items-center justify-center rounded-full border-2 border-white bg-red-600 text-xl font-black leading-none text-white shadow-2xl"
        style={{
          transform: `rotate(${-elemento.rotacao}deg) scale(${1 / Math.max(elemento.escala, 0.2)})`,
          transformOrigin: "center center",
        }}
      >
        ×
      </button>
    ) : null;

    if (elemento.tipo === "modulo") {
      return (
        <div
          key={elemento.id}
          onPointerDown={(evento) => iniciarArraste(evento, elemento)}
          onTouchStart={(evento) => iniciarGestoTouchElemento(evento, elemento)}
          onPointerMove={moverArraste}
          onPointerUp={(evento) => finalizarArraste(evento)}
          onPointerCancel={(evento) => finalizarArraste(evento)}
          style={comum}
          className={`absolute cursor-move rounded-md border-2 bg-[#0b2238]/95 shadow-xl ${
            selecionado ? "border-yellow-400 ring-2 ring-yellow-400/60" : "border-sky-300"
          }`}
        >
          {botaoExcluir}
          <div className="grid h-full grid-cols-2 grid-rows-4 gap-[2px] p-[3px]">
            {Array.from({ length: 8 }).map((_, indice) => (
              <div
                key={indice}
                className="rounded-[2px] border border-sky-200/50 bg-sky-900/40"
              />
            ))}
          </div>
        </div>
      );
    }

    if (elemento.tipo === "inversor") {
      const marca = elemento.marcaInversor ?? "Huawei";
      const imagem = IMAGENS_INVERSORES[marca] ?? IMAGENS_INVERSORES.Huawei;

      return (
        <div
          key={elemento.id}
          onPointerDown={(evento) => iniciarArraste(evento, elemento)}
          onTouchStart={(evento) => iniciarGestoTouchElemento(evento, elemento)}
          onPointerMove={moverArraste}
          onPointerUp={(evento) => finalizarArraste(evento)}
          onPointerCancel={(evento) => finalizarArraste(evento)}
          style={comum}
          className={`absolute cursor-move overflow-hidden rounded-lg ${
            selecionado ? "ring-4 ring-yellow-400/80" : ""
          }`}
        >
          {botaoExcluir}
          <img
            src={imagem}
            alt={`Inversor solar ${marca}`}
            className="h-full w-full select-none object-contain"
            draggable={false}
          />
        </div>
      );
    }

    if (elemento.tipo === "stringbox") {
      const tipo = elemento.tipoStringBox ?? "cc";
      const imagem =
        tipo === "cc" ? IMAGEM_STRINGBOX_CC : IMAGEM_STRINGBOX_CA;

      return (
        <div
          key={elemento.id}
          onPointerDown={(evento) => iniciarArraste(evento, elemento)}
          onTouchStart={(evento) => iniciarGestoTouchElemento(evento, elemento)}
          onPointerMove={moverArraste}
          onPointerUp={(evento) => finalizarArraste(evento)}
          onPointerCancel={(evento) => finalizarArraste(evento)}
          style={comum}
          className={`absolute cursor-move overflow-hidden rounded-lg ${
            selecionado ? "ring-4 ring-yellow-400/80" : ""
          }`}
        >
          {botaoExcluir}
          <img
            src={imagem}
            alt={
              tipo === "cc"
                ? "String Box CLAMPER"
                : "Caixa de proteção CA de sobrepor"
            }
            className="h-full w-full select-none object-contain"
            draggable={false}
          />
        </div>
      );
    }

    if (elemento.tipo === "caixa4x2") {
      const cores = classeCor(elemento.cor, "caixa4x2");
      return (
        <div
          key={elemento.id}
          onPointerDown={(evento) => iniciarArraste(evento, elemento)}
          onTouchStart={(evento) => iniciarGestoTouchElemento(evento, elemento)}
          onPointerMove={moverArraste}
          onPointerUp={(evento) => finalizarArraste(evento)}
          onPointerCancel={(evento) => finalizarArraste(evento)}
          style={{
            ...comum,
            backgroundColor: cores.fundo,
            borderColor: selecionado ? "#facc15" : cores.borda,
          }}
          className={`absolute cursor-move rounded-md border-2 shadow-lg ${
            selecionado ? "ring-2 ring-yellow-400/60" : ""
          }`}
        >
          {botaoExcluir}
          <div className="flex h-full items-center justify-center">
            <div
              className="h-2 w-2 rounded-full border"
              style={{ borderColor: cores.borda, backgroundColor: cores.detalhe }}
            />
          </div>
        </div>
      );
    }

    const cores = classeCor(elemento.cor, "eletroduto");
    return (
      <div
        key={elemento.id}
        onPointerDown={(evento) => iniciarArraste(evento, elemento)}
          onTouchStart={(evento) => iniciarGestoTouchElemento(evento, elemento)}
        onPointerMove={moverArraste}
        onPointerUp={(evento) => finalizarArraste(evento)}
        onPointerCancel={(evento) => finalizarArraste(evento)}
        style={{
          ...comum,
          transform: `rotate(${elemento.rotacao}deg) scale(${elemento.escala})`,
          backgroundColor: cores.fundo,
          borderColor: cores.borda,
        }}
        className={`absolute cursor-move rounded-full border shadow-lg ${
          selecionado ? "ring-4 ring-yellow-400/70" : ""
        }`}
      >
        {botaoExcluir}
      </div>
    );
  }

  function renderCenaCompartilhada(
    tipo: "telhado" | "parede",
    imagem: string | null,
    itens: ElementoVisual[],
  ) {
    const ajuste = tipo === "telhado" ? ajusteTelhado : ajusteParede;
    const escalaX = tipo === "telhado" ? escalaXTelhado : escalaXParede;
    const escalaY = tipo === "telhado" ? escalaYTelhado : escalaYParede;
    const rotacao =
      tipo === "telhado" ? rotacaoFotoTelhado : rotacaoFotoParede;
    const posicao =
      tipo === "telhado" ? posicaoFotoTelhado : posicaoFotoParede;
    const offsetX =
      tipo === "telhado" ? offsetXTelhado : offsetXParede;
    const offsetY =
      tipo === "telhado" ? offsetYTelhado : offsetYParede;

    const verticalBase =
      posicao === "50% 0%"
        ? "0%"
        : posicao === "50% 100%"
          ? "100%"
          : "50%";

    const backgroundPosition =
      `calc(50% + ${offsetX}px) calc(${verticalBase} + ${offsetY}px)`;

    return (
      <div className="relative min-h-0 flex-1 overflow-hidden bg-zinc-900">
        {imagem ? (
          <div
            className="absolute inset-0"
            style={{
              transform: `rotate(${rotacao}deg) scaleX(${escalaX}) scaleY(${escalaY})`,
              transformOrigin: "center center",
              backgroundImage: `url("${imagem}")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition,
              backgroundSize: ajuste === "cover" ? "cover" : "contain",
              backgroundColor: "#18181b",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-black uppercase text-zinc-500">
            {tipo === "telhado"
              ? "Carregue a foto do telhado"
              : "Carregue a foto da parede"}
          </div>
        )}

        {mostrarGrade && (
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        )}

        {itens.map(renderElemento)}

        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/75 px-3 py-1.5 text-[10px] font-black uppercase text-yellow-400">
          {tipo === "telhado" ? "Telhado / Módulos" : "Parede / Equipamentos"}
        </div>
      </div>
    );
  }


  return (
    <section className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto w-full max-w-none px-3 py-3 md:px-4">
        <header className="mb-3 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/imagens/logo/brasao-choqueseg.png"
              alt="Brasão oficial da CHOQUESEG"
              className="h-14 w-14 shrink-0 object-contain"
            />
            <div>
              <div className="flex items-end gap-2">
                <h2 className="text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
                  Projetos <span className="text-yellow-400">3D</span>
                </h2>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
                CHOQUESEG
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-yellow-400/60 px-5 py-2 text-center text-sm font-bold text-zinc-200">
            Telhado em cima. <span className="text-yellow-400">Parede embaixo.</span> Apresente.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const confirmarSaida = window.confirm(
                  "Tem certeza que deseja sair do Projeto 3D?"
                );

                if (!confirmarSaida) return;

                if (aoSair) {
                  aoSair();
                  return;
                }

                window.location.href =
                  window.location.origin + window.location.pathname;
              }}
              className="rounded-xl border border-red-500/70 bg-black px-4 py-2 text-xs font-black uppercase text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              ← Sair do Projeto 3D
            </button>

            <button
              type="button"
              onClick={() => setMostrarGrade((atual) => !atual)}
              className={`rounded-xl border px-4 py-2 text-xs font-black uppercase ${
                mostrarGrade
                  ? "border-yellow-400 bg-yellow-400 text-black"
                  : "border-zinc-700 bg-zinc-950 text-zinc-300"
              }`}
            >
              ▦ Grade
            </button>

            <button
              type="button"
              onClick={() => {
                if (!window.confirm("Limpar os elementos desta área?")) return;
                setElementos([]);
                setSelecionadoId(null);
              }}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs font-black uppercase text-zinc-300"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={gerarImagem}
              disabled={!imagemAtual}
              className="rounded-xl bg-yellow-400 px-5 py-2 text-xs font-black uppercase text-black disabled:opacity-40"
            >
              Salvar imagem
            </button>
          </div>
        </header>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setAba("telhado");
              setSelecionadoId(null);
            }}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase ${
              aba === "telhado"
                ? "bg-yellow-400 text-black"
                : "border border-zinc-700 bg-black text-zinc-300"
            }`}
          >
            ☀️ Telhado / Módulos
          </button>

          <button
            type="button"
            onClick={() => {
              setAba("parede");
              setSelecionadoId(null);
            }}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase ${
              aba === "parede"
                ? "bg-yellow-400 text-black"
                : "border border-zinc-700 bg-black text-zinc-300"
            }`}
          >
            ⚡ Parede / Equipamentos
          </button>

        </div>

        <div className="grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)_250px] lg:items-stretch xl:grid-cols-[285px_minmax(0,1fr)_285px]">
          <aside className="flex h-[calc(100vh-190px)] min-h-[560px] max-h-[760px] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-black">
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
              <div className="border-b border-zinc-800 pb-4">
                <p className="text-sm font-black uppercase text-yellow-400">
                  📷 Foto / Fundo
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  Carregue e enquadre a foto. A área central permanece fixa.
                </p>

                <label className="mt-4 block cursor-pointer rounded-xl bg-yellow-400 px-4 py-4 text-center text-sm font-black uppercase text-black">
                  📷 Enviar foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(evento) =>
                      lerImagem(evento.target.files?.[0] ?? null, aba)
                    }
                  />
                </label>
              </div>

              {imagemAtual && (
                <div className="space-y-4 border-b border-zinc-800 py-4">
                  <div>
                    <p className="text-xs font-black uppercase text-zinc-400">
                      Ajuste rápido
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          aba === "telhado"
                            ? setAjusteTelhado("cover")
                            : setAjusteParede("cover")
                        }
                        className={`rounded-lg border px-2 py-3 text-[11px] font-black uppercase ${
                          ajusteImagem === "cover"
                            ? "border-yellow-400 bg-yellow-400 text-black"
                            : "border-zinc-700 bg-zinc-950 text-zinc-300"
                        }`}
                      >
                        Preencher
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          aba === "telhado"
                            ? setAjusteTelhado("contain")
                            : setAjusteParede("contain")
                        }
                        className={`rounded-lg border px-2 py-3 text-[11px] font-black uppercase ${
                          ajusteImagem === "contain"
                            ? "border-yellow-400 bg-yellow-400 text-black"
                            : "border-zinc-700 bg-zinc-950 text-zinc-300"
                        }`}
                      >
                        Mostrar inteira
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase text-zinc-400">
                      Mover foto
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div />
                      <button
                        type="button"
                        onClick={() =>
                          aba === "telhado"
                            ? setOffsetYTelhado((v) => v - 10)
                            : setOffsetYParede((v) => v - 10)
                        }
                        className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                      >
                        ↑
                      </button>
                      <div />

                      <button
                        type="button"
                        onClick={() =>
                          aba === "telhado"
                            ? setOffsetXTelhado((v) => v - 10)
                            : setOffsetXParede((v) => v - 10)
                        }
                        className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (aba === "telhado") {
                            setOffsetXTelhado(0);
                            setOffsetYTelhado(0);
                          } else {
                            setOffsetXParede(0);
                            setOffsetYParede(0);
                          }
                        }}
                        className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                      >
                        ⌂
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          aba === "telhado"
                            ? setOffsetXTelhado((v) => v + 10)
                            : setOffsetXParede((v) => v + 10)
                        }
                        className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                      >
                        →
                      </button>

                      <div />
                      <button
                        type="button"
                        onClick={() =>
                          aba === "telhado"
                            ? setOffsetYTelhado((v) => v + 10)
                            : setOffsetYParede((v) => v + 10)
                        }
                        className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                      >
                        ↓
                      </button>
                      <div />
                    </div>
                  </div>

                  <label className="block">
                    <div className="flex items-center justify-between text-xs font-black uppercase text-zinc-400">
                      <span>Largura</span>
                      <span>{Math.round(escalaXFoto * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={escalaXFoto}
                      onChange={(evento) => {
                        const valor = Number(evento.target.value);
                        aba === "telhado"
                          ? setEscalaXTelhado(valor)
                          : setEscalaXParede(valor);
                      }}
                      className="mt-2 w-full accent-yellow-400"
                    />
                  </label>

                  <label className="block">
                    <div className="flex items-center justify-between text-xs font-black uppercase text-zinc-400">
                      <span>Altura</span>
                      <span>{Math.round(escalaYFoto * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={escalaYFoto}
                      onChange={(evento) => {
                        const valor = Number(evento.target.value);
                        aba === "telhado"
                          ? setEscalaYTelhado(valor)
                          : setEscalaYParede(valor);
                      }}
                      className="mt-2 w-full accent-yellow-400"
                    />
                  </label>

                  <div>
                    <p className="text-xs font-black uppercase text-zinc-400">
                      Girar foto
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          aba === "telhado"
                            ? setRotacaoFotoTelhado((v) => (v - 90 + 360) % 360)
                            : setRotacaoFotoParede((v) => (v - 90 + 360) % 360)
                        }
                        className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-xs font-black uppercase"
                      >
                        ↶ 90°
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          aba === "telhado"
                            ? setRotacaoFotoTelhado((v) => (v + 90) % 360)
                            : setRotacaoFotoParede((v) => (v + 90) % 360)
                        }
                        className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-xs font-black uppercase"
                      >
                        ↷ 90°
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase text-zinc-400">
                      Enquadramento
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {[
                        ["Topo", "50% 0%"],
                        ["Centro", "50% 50%"],
                        ["Baixo", "50% 100%"],
                      ].map(([rotulo, valor]) => (
                        <button
                          key={valor}
                          type="button"
                          onClick={() =>
                            aba === "telhado"
                              ? setPosicaoFotoTelhado(valor)
                              : setPosicaoFotoParede(valor)
                          }
                          className={`rounded-lg border px-2 py-2 text-[10px] font-black uppercase ${
                            posicaoFoto === valor
                              ? "border-yellow-400 bg-yellow-400 text-black"
                              : "border-zinc-700 bg-zinc-950 text-zinc-300"
                          }`}
                        >
                          {rotulo}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (aba === "telhado") {
                        setEscalaXTelhado(1);
                        setEscalaYTelhado(1);
                        setOffsetXTelhado(0);
                        setOffsetYTelhado(0);
                        setRotacaoFotoTelhado(0);
                        setPosicaoFotoTelhado("50% 50%");
                      } else {
                        setEscalaXParede(1);
                        setEscalaYParede(1);
                        setOffsetXParede(0);
                        setOffsetYParede(0);
                        setRotacaoFotoParede(0);
                        setPosicaoFotoParede("50% 50%");
                      }
                    }}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-xs font-black uppercase text-zinc-300"
                  >
                    ↻ Restaurar foto
                  </button>
                </div>
              )}

              {aba === "telhado" && (
                <div className="pt-4">
                  <p className="text-sm font-black uppercase text-yellow-400">
                    Adicionar módulos
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Quantidade por clique ou pela tecla +.
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {([1, 2, 3] as const).map((quantidade) => (
                      <button
                        key={quantidade}
                        type="button"
                        onClick={() => setQuantidadeModulosPorClique(quantidade)}
                        className={`min-w-0 rounded-xl border px-1 py-3 text-[11px] font-black uppercase ${
                          quantidadeModulosPorClique === quantidade
                            ? "border-yellow-400 bg-yellow-400 text-black"
                            : "border-zinc-700 bg-zinc-950 text-zinc-300"
                        }`}
                      >
                        {quantidade}x
                        <span className="mt-1 block text-[9px]">
                          {quantidade === 1 ? "Módulo" : "Módulos"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={adicionarModulo}
                    className="mt-3 w-full rounded-xl bg-sky-700 px-4 py-3 text-sm font-black uppercase text-white"
                  >
                    + Adicionar módulo
                  </button>
                </div>
              )}
            </div>
          </aside>

          <div
            ref={areaCompartilhadaRef}
            className="relative flex h-[calc(100vh-190px)] min-h-[560px] max-h-[760px] min-w-0 flex-col overflow-hidden rounded-2xl border border-yellow-400/50 bg-black p-1"
          >
            {selecionado && (
              <div className="absolute bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-yellow-400/70 bg-black/95 p-2 shadow-2xl lg:hidden">
                <button
                  type="button"
                  aria-label="Diminuir elemento"
                  onPointerDown={(evento) => evento.stopPropagation()}
                  onClick={(evento) => {
                    evento.stopPropagation();
                    redimensionarSelecionado(0.92);
                  }}
                  className="touch-manipulation min-h-12 min-w-12 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xl font-black text-white active:bg-yellow-400 active:text-black"
                >
                  −
                </button>

                <button
                  type="button"
                  aria-label="Girar para a esquerda"
                  onPointerDown={(evento) => evento.stopPropagation()}
                  onClick={(evento) => {
                    evento.stopPropagation();
                    girarSelecionado(-5);
                  }}
                  className="touch-manipulation min-h-12 min-w-12 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xl font-black text-white active:bg-yellow-400 active:text-black"
                >
                  ↶
                </button>

                <div className="min-w-[68px] text-center">
                  <div className="text-[10px] font-black uppercase text-yellow-400">
                    {Math.round(selecionado.escala * 100)}%
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400">
                    {Math.round(selecionado.rotacao)}°
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Girar para a direita"
                  onPointerDown={(evento) => evento.stopPropagation()}
                  onClick={(evento) => {
                    evento.stopPropagation();
                    girarSelecionado(5);
                  }}
                  className="touch-manipulation min-h-12 min-w-12 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xl font-black text-white active:bg-yellow-400 active:text-black"
                >
                  ↷
                </button>

                <button
                  type="button"
                  aria-label="Aumentar elemento"
                  onPointerDown={(evento) => evento.stopPropagation()}
                  onClick={(evento) => {
                    evento.stopPropagation();
                    redimensionarSelecionado(1.08);
                  }}
                  className="touch-manipulation min-h-12 min-w-12 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xl font-black text-white active:bg-yellow-400 active:text-black"
                >
                  +
                </button>
              </div>
            )}
            <div className="grid h-full min-h-0 grid-rows-2 gap-1 overflow-hidden rounded-xl">
              <div
                className={`relative min-h-0 overflow-hidden bg-zinc-900 ${
                  aba === "telhado" ? "ring-2 ring-inset ring-yellow-400" : ""
                }`}
                onClick={() => setAba("telhado")}
              >
                <div
                  ref={areaTelhadoRef}
                  className="absolute inset-0"
                  style={{ touchAction: "none", overscrollBehavior: "contain" }}
                  onTouchStartCapture={(evento) => iniciarTouchNaArea(evento, "telhado")}
                  onTouchMoveCapture={(evento) => moverTouchNaArea(evento, "telhado")}
                  onTouchEndCapture={(evento) => finalizarTouchNaArea(evento, "telhado")}
                  onTouchCancelCapture={(evento) => finalizarTouchNaArea(evento, "telhado")}
                >
                  {imagemTelhado ? (
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: `rotate(${rotacaoFotoTelhado}deg) scaleX(${escalaXTelhado}) scaleY(${escalaYTelhado})`,
                        transformOrigin: "center center",
                        backgroundImage: `url("${imagemTelhado}")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: `calc(50% + ${offsetXTelhado}px) calc(${
                          posicaoFotoTelhado === "50% 0%"
                            ? "0%"
                            : posicaoFotoTelhado === "50% 100%"
                              ? "100%"
                              : "50%"
                        } + ${offsetYTelhado}px)`,
                        backgroundSize:
                          ajusteTelhado === "cover" ? "cover" : "contain",
                        backgroundColor: "#18181b",
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <div>
                        <p className="text-4xl">🏠</p>
                        <p className="mt-2 text-sm font-black uppercase text-zinc-300">
                          Foto do telhado
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Clique em Telhado / Módulos e carregue a foto.
                        </p>
                      </div>
                    </div>
                  )}

                  {mostrarGrade && (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                      }}
                    />
                  )}

                  {elementosTelhado.map(renderElemento)}
                </div>

                <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/75 px-3 py-1.5 text-[10px] font-black uppercase text-yellow-400">
                  Telhado / Módulos
                </div>
              </div>

              <div
                className={`relative min-h-0 overflow-hidden bg-zinc-900 ${
                  aba === "parede" ? "ring-2 ring-inset ring-yellow-400" : ""
                }`}
                onClick={() => setAba("parede")}
              >
                <div
                  ref={areaParedeRef}
                  className="absolute inset-0"
                  style={{ touchAction: "none", overscrollBehavior: "contain" }}
                  onTouchStartCapture={(evento) => iniciarTouchNaArea(evento, "parede")}
                  onTouchMoveCapture={(evento) => moverTouchNaArea(evento, "parede")}
                  onTouchEndCapture={(evento) => finalizarTouchNaArea(evento, "parede")}
                  onTouchCancelCapture={(evento) => finalizarTouchNaArea(evento, "parede")}
                >
                  {imagemParede ? (
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: `rotate(${rotacaoFotoParede}deg) scaleX(${escalaXParede}) scaleY(${escalaYParede})`,
                        transformOrigin: "center center",
                        backgroundImage: `url("${imagemParede}")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: `calc(50% + ${offsetXParede}px) calc(${
                          posicaoFotoParede === "50% 0%"
                            ? "0%"
                            : posicaoFotoParede === "50% 100%"
                              ? "100%"
                              : "50%"
                        } + ${offsetYParede}px)`,
                        backgroundSize:
                          ajusteParede === "cover" ? "cover" : "contain",
                        backgroundColor: "#18181b",
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <div>
                        <p className="text-4xl">🧱</p>
                        <p className="mt-2 text-sm font-black uppercase text-zinc-300">
                          Foto da parede
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Clique em Parede / Equipamentos e carregue a foto.
                        </p>
                      </div>
                    </div>
                  )}

                  {mostrarGrade && (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                      }}
                    />
                  )}

                  {elementosParede.map(renderElemento)}
                </div>

                <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/75 px-3 py-1.5 text-[10px] font-black uppercase text-yellow-400">
                  Parede / Equipamentos
                </div>
              </div>
            </div>
          </div>

          <aside className="flex h-[calc(100vh-190px)] min-h-[560px] max-h-[760px] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-black">
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
              <div className="border-b border-zinc-800 pb-4">
                <p className="text-sm font-black uppercase text-yellow-400">
                  Adicionar componentes
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  Clique no componente para adicionar na área central.
                </p>

                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={adicionarInversor}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm font-black uppercase hover:border-yellow-400"
                  >
                    <span>⚡ + Inversor</span><span>+</span>
                  </button>
                  <button
                    type="button"
                    onClick={adicionarEletroduto}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm font-black uppercase hover:border-yellow-400"
                  >
                    <span>│ + Eletroduto</span><span>+</span>
                  </button>
                  <button
                    type="button"
                    onClick={adicionarCaixa4x2}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm font-black uppercase hover:border-yellow-400"
                  >
                    <span>□ + Caixa 4x2</span><span>+</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => adicionarStringBox("cc")}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm font-black uppercase hover:border-yellow-400"
                  >
                    <span>⚠ + String Box CC (CLAMPER)</span><span>+</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => adicionarStringBox("ca")}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm font-black uppercase hover:border-yellow-400"
                  >
                    <span>□ + Caixa CA (Tramontina)</span><span>+</span>
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm font-black uppercase text-yellow-400">
                  Ajustes do elemento
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  {selecionado
                    ? "Use os controles abaixo para ajustar o item selecionado."
                    : "Selecione um elemento na imagem para editar."}
                </p>

                {selecionado && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3">
                      <p className="text-xs font-black uppercase text-yellow-400">
                        Movimento rápido no celular
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                        Arraste o item com um dedo. Use os botões grandes abaixo para girar e mudar o tamanho com precisão.
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => girarSelecionado(-5)}
                          className="touch-manipulation rounded-xl border border-zinc-700 bg-black px-3 py-4 text-sm font-black uppercase text-white active:bg-yellow-400 active:text-black"
                        >
                          ↶ Girar 5°
                        </button>
                        <button
                          type="button"
                          onClick={() => girarSelecionado(5)}
                          className="touch-manipulation rounded-xl border border-zinc-700 bg-black px-3 py-4 text-sm font-black uppercase text-white active:bg-yellow-400 active:text-black"
                        >
                          ↷ Girar 5°
                        </button>
                        <button
                          type="button"
                          onClick={() => redimensionarSelecionado(0.95)}
                          className="touch-manipulation rounded-xl border border-zinc-700 bg-black px-3 py-4 text-sm font-black uppercase text-white active:bg-yellow-400 active:text-black"
                        >
                          − Diminuir
                        </button>
                        <button
                          type="button"
                          onClick={() => redimensionarSelecionado(1.05)}
                          className="touch-manipulation rounded-xl border border-zinc-700 bg-black px-3 py-4 text-sm font-black uppercase text-white active:bg-yellow-400 active:text-black"
                        >
                          + Aumentar
                        </button>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => girarSelecionado(-1)}
                          className="touch-manipulation rounded-lg border border-zinc-800 bg-black px-2 py-3 text-xs font-black text-zinc-300"
                        >
                          −1°
                        </button>
                        <div className="flex items-center justify-center rounded-lg border border-zinc-800 bg-black px-2 py-3 text-center text-[11px] font-black text-yellow-400">
                          {Math.round(selecionado.rotacao)}° · {Math.round(selecionado.escala * 100)}%
                        </div>
                        <button
                          type="button"
                          onClick={() => girarSelecionado(1)}
                          className="touch-manipulation rounded-lg border border-zinc-800 bg-black px-2 py-3 text-xs font-black text-zinc-300"
                        >
                          +1°
                        </button>
                      </div>
                    </div>

                    {selecionado.tipo === "modulo" && selecionado.grupoId && (
                      <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-3 py-2 text-[11px] font-bold text-yellow-300">
                        Este módulo foi adicionado em um lote, mas pode ser movimentado individualmente. O próximo módulo será criado ao lado do módulo que estiver selecionado.
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-black uppercase text-zinc-400">
                        Posição
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <div />
                        <button
                          type="button"
                          onClick={() =>
                            atualizarSelecionado({ y: Math.max(0, selecionado.y - 5) })
                          }
                          className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={duplicarSelecionado}
                          className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                          title="Duplicar"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            atualizarSelecionado({ x: Math.max(0, selecionado.x - 5) })
                          }
                          className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => atualizarSelecionado({ x: 60, y: 60 })}
                          className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                        >
                          ⌂
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            atualizarSelecionado({ x: selecionado.x + 5 })
                          }
                          className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                        >
                          →
                        </button>

                        <div />
                        <button
                          type="button"
                          onClick={() =>
                            atualizarSelecionado({ y: selecionado.y + 5 })
                          }
                          className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            atualizarSelecionado({
                              rotacao: (selecionado.rotacao + 15) % 360,
                            })
                          }
                          className="rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-lg"
                          title="Girar"
                        >
                          ↻
                        </button>
                      </div>
                    </div>

                    {selecionado.tipo === "eletroduto" ? (
                      <label className="block">
                        <div className="flex items-center justify-between text-xs font-black uppercase text-zinc-400">
                          <span>Comprimento</span>
                          <span>{Math.round(selecionado.largura)}px</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="600"
                          step="5"
                          value={selecionado.largura}
                          onChange={(evento) =>
                            atualizarSelecionado({
                              largura: Number(evento.target.value),
                              altura: 10,
                              escala: 1,
                            })
                          }
                          className="mt-2 w-full accent-yellow-400"
                        />
                      </label>
                    ) : (
                      <label className="block">
                        <div className="flex items-center justify-between text-xs font-black uppercase text-zinc-400">
                          <span>Tamanho</span>
                          <span>{Math.round(selecionado.escala * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.3"
                          max="2"
                          step="0.05"
                          value={selecionado.escala}
                          onChange={(evento) =>
                            atualizarSelecionado({
                              escala: Number(evento.target.value),
                            })
                          }
                          className="mt-2 w-full accent-yellow-400"
                        />
                      </label>
                    )}

                    {selecionado.tipo === "inversor" && (
                      <div>
                        <p className="text-xs font-black uppercase text-zinc-400">
                          Marca do inversor
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {(["Huawei", "Growatt", "Solplanet", "AUXSOL", "Genérico"] as MarcaInversor[]).map(
                            (marca) => (
                              <button
                                key={marca}
                                type="button"
                                onClick={() =>
                                  atualizarSelecionado({ marcaInversor: marca })
                                }
                                className={`rounded-lg border px-2 py-2 text-[10px] font-black uppercase ${
                                  selecionado.marcaInversor === marca
                                    ? "border-yellow-400 bg-yellow-400 text-black"
                                    : "border-zinc-700 bg-zinc-950 text-zinc-300"
                                }`}
                              >
                                {marca}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {(selecionado.tipo === "eletroduto" ||
                      selecionado.tipo === "caixa4x2" ||
                      selecionado.tipo === "inversor") && (
                      <div>
                        <p className="text-xs font-black uppercase text-zinc-400">
                          Cor
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(selecionado.tipo === "inversor"
                            ? (["branco", "azul"] as CorElemento[])
                            : (["branco", "preto", "cinza", "vermelho"] as CorElemento[])
                          ).map((cor) => (
                            <button
                              key={cor}
                              type="button"
                              onClick={() => atualizarSelecionado({ cor })}
                              className={`rounded-lg border px-2 py-2 text-[10px] font-black uppercase ${
                                selecionado.cor === cor
                                  ? "border-yellow-400 bg-yellow-400 text-black"
                                  : "border-zinc-700 bg-zinc-950 text-zinc-300"
                              }`}
                            >
                              {cor}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={excluirSelecionado}
                      className="w-full rounded-xl border border-red-500 px-4 py-3 text-sm font-black uppercase text-red-400"
                    >
                      🗑 Excluir elemento
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-3 hidden items-center justify-center gap-6 rounded-xl border border-zinc-800 bg-black px-4 py-2 text-[11px] text-zinc-400 lg:flex">
          <span className="font-black uppercase text-zinc-300">Atalhos (PC)</span>
          <span><kbd className="rounded bg-zinc-800 px-2 py-1 text-white">+</kbd> adicionar módulos</span>
          <span><kbd className="rounded bg-zinc-800 px-2 py-1 text-white">Setas</kbd> mover elemento</span>
          <span><kbd className="rounded bg-zinc-800 px-2 py-1 text-white">Shift + setas</kbd> movimento rápido</span>
          <span><kbd className="rounded bg-zinc-800 px-2 py-1 text-white">Delete</kbd> excluir selecionado</span>
        </footer>
      </div>
    </section>
  );
}