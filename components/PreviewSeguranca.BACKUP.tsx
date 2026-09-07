"use client";

import { forwardRef } from "react";

export type UnidadeOrcamento =
  | "Unidade"
  | "Metro"
  | "Rolo"
  | "Caixa"
  | "Kit"
  | "Par"
  | "Serviço";

export type ItemSegurancaPreview = {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: UnidadeOrcamento;
  valorUnitario: number;
};

export type DadosPreviewSeguranca = {
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  observacoes: string;
  itens: ItemSegurancaPreview[];
  subtotal: number;
  desconto: number;
  total: number;
  parcelasCartao: number;
  totalCartao: number;
  parcelaCartao: number;
  temaPDF: "claro" | "escuro";
  enderecoEmpresa: string;
};

type Props = {
  dados: DadosPreviewSeguranca;
};

type TemaSeguranca =
  | "camera"
  | "cerca"
  | "alarme"
  | "motor"
  | "acesso"
  | "geral";

const LOGO = "/imagens/logo/brasao-choqueseg.png";
const WHATSAPP_CHOQUESEG = "5579999390653";

const CAPAS: Record<TemaSeguranca, string> = {
  camera: "/imagens/seguranca/cabecalho-camera.svg",
  cerca: "/imagens/seguranca/cabecalho-cerca.svg",
  alarme: "/imagens/seguranca/cabecalho-alarme.svg",
  motor: "/imagens/seguranca/cabecalho-motor.svg",
  acesso: "/imagens/seguranca/cabecalho-acesso.svg",
  geral: "/imagens/seguranca/cabecalho-geral.svg",
};

const IMAGENS_ITENS: Record<TemaSeguranca, string> = {
  camera: "/imagens/seguranca/item-camera.svg",
  cerca: "/imagens/seguranca/item-cerca.svg",
  alarme: "/imagens/seguranca/item-alarme.svg",
  motor: "/imagens/seguranca/item-motor.svg",
  acesso: "/imagens/seguranca/item-acesso.svg",
  geral: "/imagens/seguranca/item-geral.svg",
};

function moeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataHoje() {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function detectarTemaPeloTexto(texto: string): TemaSeguranca {
  const valor = normalizar(texto);

  if (
    valor.includes("camera") ||
    valor.includes("dvr") ||
    valor.includes("nvr") ||
    valor.includes("cftv") ||
    valor.includes("hd ")
  ) return "camera";

  if (valor.includes("cerca")) return "cerca";

  if (
    valor.includes("alarme") ||
    valor.includes("sirene") ||
    valor.includes("sensor")
  ) return "alarme";

  if (
    valor.includes("motor") ||
    valor.includes("portao") ||
    valor.includes("automatizador") ||
    valor.includes("cremalheira")
  ) return "motor";

  if (
    valor.includes("controle de acesso") ||
    valor.includes("interfone") ||
    valor.includes("video porteiro") ||
    valor.includes("fechadura")
  ) return "acesso";

  return "geral";
}

function detectarTemaPrincipal(itens: ItemSegurancaPreview[]): TemaSeguranca {
  const contagem: Record<TemaSeguranca, number> = {
    camera: 0,
    cerca: 0,
    alarme: 0,
    motor: 0,
    acesso: 0,
    geral: 0,
  };

  for (const item of itens) {
    const tema = detectarTemaPeloTexto(item.descricao);
    contagem[tema] += Math.max(Number(item.quantidade) || 1, 1);
  }

  const prioridades: TemaSeguranca[] = ["camera", "cerca", "alarme", "motor", "acesso"];
  let melhor: TemaSeguranca = "geral";
  let maior = 0;

  for (const tema of prioridades) {
    if (contagem[tema] > maior) {
      maior = contagem[tema];
      melhor = tema;
    }
  }

  return melhor;
}

function beneficioTema(tema: TemaSeguranca) {
  switch (tema) {
    case "camera":
      return {
        titulo: "Veja o que acontece mesmo quando você não está no local",
        texto:
          "Com o sistema de CFTV, as imagens podem ficar gravadas no equipamento e, quando o modelo permitir, você poderá acompanhar câmeras pelo celular. Mais controle, registro e tranquilidade no dia a dia.",
      };
    case "cerca":
      return {
        titulo: "Uma barreira a mais antes que o invasor chegue ao imóvel",
        texto:
          "A cerca elétrica ajuda a proteger o perímetro e funciona como elemento de inibição contra tentativas de invasão. Instalada corretamente, reforça a segurança da residência ou empresa.",
      };
    case "alarme":
      return {
        titulo: "Detecção rápida para aumentar sua segurança",
        texto:
          "Sensores e sirenes ajudam a identificar movimentações ou acessos indevidos e alertam rapidamente sobre situações de risco, oferecendo mais proteção ao patrimônio.",
      };
    case "motor":
      return {
        titulo: "Mais praticidade e segurança para entrar e sair",
        texto:
          "O automatizador de portão evita a necessidade de descer do veículo para abrir o acesso, trazendo conforto em dias de chuva e reduzindo o tempo de exposição na rua.",
      };
    case "acesso":
      return {
        titulo: "Controle de acesso com mais organização e segurança",
        texto:
          "Fechaduras, interfones e soluções de acesso ajudam a controlar quem entra e sai, oferecendo praticidade sem abrir mão da segurança.",
      };
    default:
      return {
        titulo: "Tecnologia trabalhando para proteger o que importa",
        texto:
          "A CHOQUESEG integra equipamentos e instalação profissional para entregar uma solução objetiva, organizada e adequada às necessidades do cliente.",
      };
  }
}

function fraseTema(tema: TemaSeguranca) {
  switch (tema) {
    case "camera":
      return "Mais visão. Mais controle. Mais tranquilidade.";
    case "cerca":
      return "Proteção perimetral com instalação profissional.";
    case "alarme":
      return "Detecção rápida para proteger seu patrimônio.";
    case "motor":
      return "Praticidade e segurança no acesso ao seu imóvel.";
    case "acesso":
      return "Controle, tecnologia e segurança para o seu acesso.";
    default:
      return "Segurança e tranquilidade para sua família.";
  }
}

function paginasNecessarias(tema: TemaSeguranca, quantidadeItens: number) {
  if (tema === "motor" && quantidadeItens <= 5) return 1;
  if (quantidadeItens <= 6) return 2;
  return 3;
}

const PreviewSeguranca = forwardRef<HTMLDivElement, Props>(
  function PreviewSeguranca({ dados }, ref) {
    const temaPrincipal = detectarTemaPrincipal(dados.itens);
    const totalPaginas = paginasNecessarias(temaPrincipal, dados.itens.length);
    const beneficio = beneficioTema(temaPrincipal);

    const mensagemFechamento = [
      "Olá, CHOQUESEG! Analisei minha proposta de Segurança Eletrônica e quero fechar o serviço.",
      "",
      `Cliente: ${dados.nome || "Não informado"}`,
      `Cidade: ${dados.cidade || "Não informada"}`,
      `Telefone: ${dados.telefone || "Não informado"}`,
      `Valor: ${moeda(dados.total)}`,
      "",
      "Quero dar continuidade ao fechamento.",
    ].join("\n");

    const linkFechamento = `https://wa.me/${WHATSAPP_CHOQUESEG}?text=${encodeURIComponent(
      mensagemFechamento,
    )}`;

    if (totalPaginas === 1) {
      return (
        <div ref={ref} className="grid items-start gap-5">
          <Pagina numeroPagina={1} totalPaginas={1} tema={dados.temaPDF}>
            <Cabecalho tema={temaPrincipal} frase={fraseTema(temaPrincipal)} />
            <DadosCliente nome={dados.nome} cidade={dados.cidade} data={dataHoje()} tema={dados.temaPDF} />

            <TituloSecao pequeno="Solução completa CHOQUESEG" titulo="O que está incluso na sua instalação" />

            <div className="mt-3 grid grid-cols-2 gap-3">
              {dados.itens.map((item) => (
                <CardItem key={item.id} item={item} temaPDF={dados.temaPDF} />
              ))}
            </div>

            <Beneficio titulo={beneficio.titulo} texto={beneficio.texto} tema={temaPrincipal} />

            <ResumoFinanceiro dados={dados} linkFechamento={linkFechamento} compacto />

            <Rodape tema={dados.temaPDF} enderecoEmpresa={dados.enderecoEmpresa} />
          </Pagina>
        </div>
      );
    }

    return (
      <div ref={ref} className="grid items-start gap-5">
        <Pagina numeroPagina={1} totalPaginas={totalPaginas} tema={dados.temaPDF}>
          <Cabecalho tema={temaPrincipal} frase={fraseTema(temaPrincipal)} />
          <DadosCliente nome={dados.nome} cidade={dados.cidade} data={dataHoje()} tema={dados.temaPDF} />

          <TituloSecao pequeno="Solução completa CHOQUESEG" titulo="O que está incluso na sua instalação" />

          <div className="mt-3 grid grid-cols-2 gap-3">
            {dados.itens.slice(0, 8).map((item) => (
              <CardItem key={item.id} item={item} temaPDF={dados.temaPDF} />
            ))}
          </div>

          {dados.itens.length > 8 && (
            <p className="mt-3 text-center text-[12px] font-black text-zinc-500">
              + {dados.itens.length - 8} item(ns) detalhado(s) no fechamento da proposta.
            </p>
          )}

          <Beneficio titulo={beneficio.titulo} texto={beneficio.texto} tema={temaPrincipal} />

          <Rodape tema={dados.temaPDF} enderecoEmpresa={dados.enderecoEmpresa} />
        </Pagina>

        {totalPaginas >= 2 && (
          <Pagina numeroPagina={2} totalPaginas={totalPaginas} tema={dados.temaPDF}>
            <Cabecalho tema={temaPrincipal} frase="Instalação profissional do início ao fim." compacto />

            <TituloSecao pequeno="Do planejamento à entrega" titulo="Etapas do seu serviço" />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Etapa numero="1" titulo="Levantamento técnico" texto="Análise do local e definição do melhor posicionamento e solução." tema={dados.temaPDF} />
              <Etapa numero="2" titulo="Conferência do escopo" texto="Validação dos equipamentos, quantidades e materiais previstos." tema={dados.temaPDF} />
              <Etapa numero="3" titulo="Instalação" texto="Execução profissional com organização, acabamento e segurança." tema={dados.temaPDF} />
              <Etapa numero="4" titulo="Configuração e testes" texto="Ajustes, testes de funcionamento e acesso pelo celular quando aplicável." tema={dados.temaPDF} />
              <Etapa numero="5" titulo="Orientação ao cliente" texto="Explicação de uso, operação e cuidados com o sistema instalado." tema={dados.temaPDF} />
              <Etapa numero="6" titulo="Suporte pós-venda" texto="Acompanhamento da equipe CHOQUESEG após a entrega." tema={dados.temaPDF} />
            </div>

            <div className={`mt-4 rounded-2xl border border-yellow-400 p-5 ${
              dados.temaPDF === "escuro" ? "bg-black text-white" : "bg-yellow-50 text-zinc-950"
            }`}>
              <p className="text-[12px] font-black uppercase text-yellow-500">Observações importantes</p>
              <p className="mt-2 whitespace-pre-line text-[15px] font-bold leading-relaxed">
                {dados.observacoes ||
                  "Os equipamentos, quantidades e condições desta proposta correspondem ao orçamento apresentado. Alterações no escopo poderão exigir revisão de valores."}
              </p>
            </div>

            {totalPaginas === 2 ? (
              <ResumoFinanceiro dados={dados} linkFechamento={linkFechamento} />
            ) : (
              <div className={`mt-4 rounded-2xl border border-yellow-400 p-5 ${
                dados.temaPDF === "escuro" ? "bg-black text-white" : "bg-white text-zinc-950"
              }`}>
                <p className="text-[12px] font-black uppercase text-yellow-500">Garantias e suporte</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Diferencial texto="Garantia dos equipamentos conforme o fabricante." tema={dados.temaPDF} />
                  <Diferencial texto="Garantia do serviço conforme o escopo contratado." tema={dados.temaPDF} />
                  <Diferencial texto="Orientação de uso na entrega do sistema." tema={dados.temaPDF} />
                  <Diferencial texto="Suporte pós-venda da equipe CHOQUESEG." tema={dados.temaPDF} />
                </div>
              </div>
            )}

            <Rodape tema={dados.temaPDF} enderecoEmpresa={dados.enderecoEmpresa} />
          </Pagina>
        )}

        {totalPaginas === 3 && (
          <Pagina numeroPagina={3} totalPaginas={3} tema={dados.temaPDF}>
            <Cabecalho tema={temaPrincipal} frase="Transparência no investimento e facilidade para fechar." compacto />

            <TituloSecao pequeno="Fechamento da proposta" titulo="Investimento" />

            <div className={`mt-4 overflow-hidden rounded-2xl border ${
              dados.temaPDF === "escuro" ? "border-zinc-700 bg-black" : "border-zinc-300 bg-white"
            }`}>
              <div className={`grid grid-cols-[minmax(0,1fr)_65px_80px_115px_115px] px-3 py-3 text-[11px] font-black uppercase ${
                dados.temaPDF === "escuro" ? "bg-zinc-900 text-zinc-300" : "bg-zinc-200 text-zinc-700"
              }`}>
                <span>Item</span>
                <span className="text-center">Qtd.</span>
                <span className="text-center">Un.</span>
                <span className="text-right">Unitário</span>
                <span className="text-right">Total</span>
              </div>

              {dados.itens.map((item, indice) => (
                <div
                  key={item.id}
                  className={`grid grid-cols-[minmax(0,1fr)_65px_80px_115px_115px] items-center px-3 py-3 text-[13px] ${
                    dados.temaPDF === "escuro"
                      ? indice % 2 === 0 ? "bg-black" : "bg-zinc-950"
                      : indice % 2 === 0 ? "bg-white" : "bg-zinc-50"
                  }`}
                >
                  <strong className="break-words pr-2">{item.descricao}</strong>
                  <span className="text-center">{item.quantidade}</span>
                  <span className="text-center text-[11px] opacity-70">{item.unidade}</span>
                  <span className="text-right">{moeda(item.valorUnitario)}</span>
                  <strong className="text-right text-yellow-500">
                    {moeda(item.quantidade * item.valorUnitario)}
                  </strong>
                </div>
              ))}
            </div>

            <ResumoFinanceiro dados={dados} linkFechamento={linkFechamento} />

            <Rodape tema={dados.temaPDF} enderecoEmpresa={dados.enderecoEmpresa} />
          </Pagina>
        )}
      </div>
    );
  },
);

export default PreviewSeguranca;

function Pagina({
  children,
  numeroPagina,
  totalPaginas,
  tema,
}: {
  children: React.ReactNode;
  numeroPagina: number;
  totalPaginas: number;
  tema: "claro" | "escuro";
}) {
  return (
    <article
      data-pagina-proposta
      className={`relative flex h-[1123px] w-[794px] shrink-0 flex-col overflow-hidden p-[10px] font-sans shadow-2xl ${
        tema === "escuro" ? "bg-zinc-950 text-white" : "bg-white text-zinc-950"
      }`}
      style={{ boxSizing: "border-box" }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[24px] border-2 border-yellow-400" />
      <div className="absolute right-[16px] top-[10px] z-40 rounded-bl-xl bg-yellow-400 px-4 py-1.5 text-[12px] font-black uppercase text-black">
        Página {numeroPagina}/{totalPaginas}
      </div>
      {children}
    </article>
  );
}

function Cabecalho({
  tema,
  frase,
  compacto = false,
}: {
  tema: TemaSeguranca;
  frase: string;
  compacto?: boolean;
}) {
  return (
    <header className={`relative shrink-0 overflow-hidden rounded-2xl border border-yellow-400 bg-black ${
      compacto ? "h-[150px]" : "h-[165px]"
    }`}>
      <img
        src={CAPAS[tema]}
        alt="Cabeçalho de Segurança Eletrônica CHOQUESEG"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/88 to-black/25" />

      <div className="relative z-10 flex h-full items-center gap-5 px-6">
        <img
          src={LOGO}
          alt="Brasão oficial da CHOQUESEG"
          className="h-[104px] w-[104px] shrink-0 object-contain"
        />
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white">
            Proposta comercial
          </p>
          <h1 className="mt-1 text-[33px] font-black uppercase leading-none text-yellow-400">
            Segurança Eletrônica
          </h1>
          <p className="mt-3 max-w-[520px] text-[13px] font-black uppercase leading-tight text-white">
            {frase}
          </p>
        </div>
      </div>
    </header>
  );
}

function DadosCliente({
  nome,
  cidade,
  data,
  tema,
}: {
  nome: string;
  cidade: string;
  data: string;
  tema: "claro" | "escuro";
}) {
  return (
    <section className={`mt-3 grid shrink-0 grid-cols-3 gap-2 rounded-2xl p-3 ${
      tema === "escuro" ? "bg-zinc-900" : "bg-zinc-100"
    }`}>
      <InfoCliente icone="👤" titulo="Cliente" valor={nome || "Cliente"} />
      <InfoCliente icone="📍" titulo="Cidade" valor={cidade || "—"} />
      <InfoCliente icone="📅" titulo="Data" valor={data} />
    </section>
  );
}

function InfoCliente({
  icone,
  titulo,
  valor,
}: {
  icone: string;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-xl text-black">
        {icone}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase opacity-55">{titulo}</p>
        <p className="break-words text-[15px] font-black leading-tight">{valor}</p>
      </div>
    </div>
  );
}

function TituloSecao({ pequeno, titulo }: { pequeno: string; titulo: string }) {
  return (
    <div className="mt-4 shrink-0">
      <span className="inline-flex rounded-lg bg-yellow-400 px-3 py-1 text-[12px] font-black uppercase text-black">
        {pequeno}
      </span>
      <h2 className="mt-2 text-[30px] font-black uppercase leading-[0.98]">{titulo}</h2>
    </div>
  );
}

function CardItem({
  item,
  temaPDF,
}: {
  item: ItemSegurancaPreview;
  temaPDF: "claro" | "escuro";
}) {
  const tema = detectarTemaPeloTexto(item.descricao);

  return (
    <div className={`grid min-h-[88px] grid-cols-[1fr_78px] overflow-hidden rounded-2xl border ${
      temaPDF === "escuro"
        ? "border-zinc-700 bg-zinc-900"
        : "border-zinc-300 bg-white"
    }`}>
      <div className="flex min-w-0 gap-3 p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
          ✓
        </span>
        <div className="min-w-0">
          <p className="break-words text-[15px] font-black uppercase leading-tight">
            {item.descricao}
          </p>
          <p className="mt-1 text-[12px] font-bold opacity-60">
            {item.quantidade} {item.unidade}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white">
        <img
          src={IMAGENS_ITENS[tema]}
          alt=""
          className="h-full w-full object-contain p-2"
        />
      </div>
    </div>
  );
}

function Beneficio({
  titulo,
  texto,
  tema,
}: {
  titulo: string;
  texto: string;
  tema: TemaSeguranca;
}) {
  return (
    <section className="mt-4 shrink-0 rounded-2xl bg-yellow-400 p-5 text-zinc-950">
      <div className="grid grid-cols-[72px_1fr] items-center gap-4">
        <img src={IMAGENS_ITENS[tema]} alt="" className="h-[68px] w-[68px] object-contain" />
        <div>
          <p className="text-[20px] font-black uppercase leading-tight">{titulo}</p>
          <p className="mt-2 text-[14px] font-bold leading-relaxed">{texto}</p>
        </div>
      </div>
    </section>
  );
}

function Etapa({
  numero,
  titulo,
  texto,
  tema,
}: {
  numero: string;
  titulo: string;
  texto: string;
  tema: "claro" | "escuro";
}) {
  return (
    <div className={`flex min-h-[92px] items-start gap-3 rounded-2xl border border-yellow-400/70 p-3 ${
      tema === "escuro" ? "bg-zinc-900" : "bg-white"
    }`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-lg font-black text-black">
        {numero}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-black uppercase">{titulo}</p>
        <p className="mt-1 text-[13px] font-bold leading-relaxed opacity-65">{texto}</p>
      </div>
    </div>
  );
}

function Diferencial({
  texto,
  tema,
}: {
  texto: string;
  tema: "claro" | "escuro";
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${
      tema === "escuro"
        ? "border-zinc-800 bg-zinc-950"
        : "border-zinc-300 bg-zinc-50"
    }`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
        ✓
      </span>
      <p className="text-[13px] font-bold leading-snug">{texto}</p>
    </div>
  );
}

function ResumoFinanceiro({
  dados,
  linkFechamento,
  compacto = false,
}: {
  dados: DadosPreviewSeguranca;
  linkFechamento: string;
  compacto?: boolean;
}) {
  return (
    <section className={`${compacto ? "mt-3" : "mt-4"} shrink-0`}>
      <div className="grid grid-cols-3 gap-3">
        <Resumo titulo="Subtotal" valor={moeda(dados.subtotal)} tema={dados.temaPDF} />
        <Resumo titulo="Desconto" valor={moeda(dados.desconto)} tema={dados.temaPDF} />
        <Resumo titulo="Valor à vista" valor={moeda(dados.total)} tema={dados.temaPDF} destaque />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <CondicaoPagamento
          titulo="Pagamento à vista"
          valor={moeda(dados.total)}
          descricao="Valor final da proposta"
          tema={dados.temaPDF}
        />
        <CondicaoPagamento
          titulo="Cartão de crédito"
          valor={
            dados.parcelasCartao > 1
              ? `${dados.parcelasCartao}x de ${moeda(dados.parcelaCartao)}`
              : "Não informado"
          }
          descricao={
            dados.parcelasCartao > 1
              ? `Total no cartão: ${moeda(dados.totalCartao)}`
              : "Defina o parcelamento no formulário"
          }
          tema={dados.temaPDF}
        />
      </div>

      <div className="mt-3 grid grid-cols-[1fr_0.95fr] gap-3">
        <div className="rounded-2xl bg-yellow-400 p-4 text-black">
          <p className="text-[11px] font-black uppercase">Segurança e tranquilidade</p>
          <p className="mt-1 text-[20px] font-black uppercase leading-tight">
            Proteja o que realmente importa com a CHOQUESEG.
          </p>
        </div>

        <a
          href={linkFechamento}
          data-cta-fechamento
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center rounded-2xl border-2 border-yellow-400 px-5 text-center text-[17px] font-black uppercase leading-tight ${
            dados.temaPDF === "escuro"
              ? "bg-black text-white"
              : "bg-zinc-950 text-white"
          }`}
        >
          Quero fechar com a CHOQUESEG! ›
        </a>
      </div>
    </section>
  );
}

function Resumo({
  titulo,
  valor,
  tema,
  destaque = false,
}: {
  titulo: string;
  valor: string;
  tema: "claro" | "escuro";
  destaque?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${
      destaque
        ? "border-yellow-400 bg-yellow-400 text-black"
        : tema === "escuro"
          ? "border-yellow-400/70 bg-zinc-900 text-white"
          : "border-yellow-400/70 bg-white text-zinc-950"
    }`}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em]">{titulo}</p>
      <strong className="mt-2 block text-[19px] font-black">{valor}</strong>
    </div>
  );
}

function CondicaoPagamento({
  titulo,
  valor,
  descricao,
  tema,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  tema: "claro" | "escuro";
}) {
  return (
    <div className={`rounded-2xl border border-yellow-400/70 p-4 ${
      tema === "escuro" ? "bg-zinc-900 text-white" : "bg-white text-zinc-950"
    }`}>
      <p className="text-[11px] font-black uppercase opacity-70">{titulo}</p>
      <p className="mt-2 text-[19px] font-black text-yellow-500">{valor}</p>
      <p className="mt-1 text-[11px] font-bold opacity-55">{descricao}</p>
    </div>
  );
}

function Rodape({ tema, enderecoEmpresa }: { tema: "claro" | "escuro"; enderecoEmpresa: string }) {
  return (
    <footer className={`mt-auto grid min-h-[72px] shrink-0 grid-cols-[84px_1fr_150px] items-center gap-4 rounded-2xl px-4 py-2 ${
      tema === "escuro" ? "bg-black text-white" : "bg-zinc-950 text-white"
    }`}>
      <img src={LOGO} alt="CHOQUESEG" className="h-[58px] w-[76px] object-contain" />

      <div className="min-w-0 border-l border-yellow-400 pl-4 text-[11px] font-black leading-relaxed">
        <p>☎ (79) 9.9939-0653 &nbsp; • &nbsp; @CHOQUESEG</p>
        <p className="break-words">📍 {enderecoEmpresa || "Endereço da CHOQUESEG"}</p>
      </div>

      <div className="border-l border-yellow-400 pl-4 text-center">
        <p className="text-[9px] font-black uppercase">Credenciado</p>
        <p className="mt-1 text-[19px] font-black lowercase text-emerald-400">intelbras</p>
      </div>
    </footer>
  );
}
