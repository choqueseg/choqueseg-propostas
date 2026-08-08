"use client";

import { PointerEvent, useEffect, useRef } from "react";

type Props = {
  assinatura?: string;
  aoAlterar: (assinatura: string) => void;
  bloqueado?: boolean;
};

export default function AssinaturaServico({ assinatura, aoAlterar, bloqueado }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const desenhandoRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const contexto = canvas.getContext("2d");
    if (!contexto) return;

    contexto.clearRect(0, 0, canvas.width, canvas.height);
    contexto.lineWidth = 3;
    contexto.lineCap = "round";
    contexto.strokeStyle = "#ffffff";

    if (assinatura) {
      const imagem = new Image();
      imagem.onload = () => contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
      imagem.src = assinatura;
    }
  }, [assinatura]);

  function obterPosicao(evento: PointerEvent<HTMLCanvasElement>) {
    const canvas = evento.currentTarget;
    const area = canvas.getBoundingClientRect();
    return {
      x: ((evento.clientX - area.left) / area.width) * canvas.width,
      y: ((evento.clientY - area.top) / area.height) * canvas.height,
    };
  }

  function iniciar(evento: PointerEvent<HTMLCanvasElement>) {
    if (bloqueado) return;
    const contexto = evento.currentTarget.getContext("2d");
    if (!contexto) return;

    evento.currentTarget.setPointerCapture(evento.pointerId);
    const posicao = obterPosicao(evento);
    contexto.beginPath();
    contexto.moveTo(posicao.x, posicao.y);
    desenhandoRef.current = true;
  }

  function desenhar(evento: PointerEvent<HTMLCanvasElement>) {
    if (bloqueado || !desenhandoRef.current) return;
    const contexto = evento.currentTarget.getContext("2d");
    if (!contexto) return;

    const posicao = obterPosicao(evento);
    contexto.lineTo(posicao.x, posicao.y);
    contexto.stroke();
  }

  function finalizar(evento: PointerEvent<HTMLCanvasElement>) {
    if (bloqueado || !desenhandoRef.current) return;
    desenhandoRef.current = false;
    aoAlterar(evento.currentTarget.toDataURL("image/png"));
  }

  function limpar() {
    if (bloqueado) return;
    aoAlterar("");
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black uppercase text-yellow-400">
            Assinatura do cliente
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            O cliente pode assinar com o dedo ou com o mouse.
          </p>
        </div>
        {!bloqueado && (
          <button
            type="button"
            onClick={limpar}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black uppercase text-zinc-300"
          >
            Limpar
          </button>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={900}
        height={260}
        onPointerDown={iniciar}
        onPointerMove={desenhar}
        onPointerUp={finalizar}
        onPointerCancel={finalizar}
        className={`mt-4 h-48 w-full rounded-xl border border-zinc-700 bg-black touch-none ${
          bloqueado ? "cursor-not-allowed opacity-80" : "cursor-crosshair"
        }`}
      />
    </section>
  );
}
