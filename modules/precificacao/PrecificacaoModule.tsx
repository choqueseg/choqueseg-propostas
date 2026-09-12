"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();
type Segmento = "Energia Solar" | "Segurança Eletrônica" | "Elétrica" | "Casa Inteligente";
type Aba = "nova" | "historico" | "reservas" | "resumo";
type Cliente = { id:string; nome:string; telefone:string; cidade:string; endereco:string };
type Funcionario = { id:string; nome:string };
type Simulacao = any;
type Movimento = any;
const SEGMENTOS: Segmento[] = ["Energia Solar","Segurança Eletrônica","Elétrica","Casa Inteligente"];
const CATEGORIAS = ["Capital de giro","Manutenção futura / garantia","Emergência","Ferramentas / outros"];

function n(v:any){ const x=Number(v); return Number.isFinite(x)?x:0; }
function moeda(v:number){ return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n(v)); }
function dataBR(v:string){ if(!v)return "—"; return new Date(v).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}); }

export default function PrecificacaoModule({usuarioNome=""}:{usuarioNome?:string}){
 const [aba,setAba]=useState<Aba>("nova");
 const [clientes,setClientes]=useState<Cliente[]>([]), [funcionarios,setFuncionarios]=useState<Funcionario[]>([]);
 const [historico,setHistorico]=useState<Simulacao[]>([]), [movimentos,setMovimentos]=useState<Movimento[]>([]);
 const [segmento,setSegmento]=useState<Segmento>("Energia Solar"), [clienteId,setClienteId]=useState("");
 const [nome,setNome]=useState(""),[telefone,setTelefone]=useState(""),[cidade,setCidade]=useState(""),[endereco,setEndereco]=useState("");
 const [cadastrarCliente,setCadastrarCliente]=useState(false),[identificacao,setIdentificacao]=useState("");
 const [consumo,setConsumo]=useState(0),[kwp,setKwp]=useState(0);
 const [compra,setCompra]=useState(0),[material,setMaterial]=useState(0),[projeto,setProjeto]=useState(0),[maoObra,setMaoObra]=useState(0),[venda,setVenda]=useState(0);
 const [temComissao,setTemComissao]=useState(false),[tipoBenef,setTipoBenef]=useState("funcionario"),[funcId,setFuncId]=useState(""),[benefManual,setBenefManual]=useState("");
 const [tipoComissao,setTipoComissao]=useState("percentual"),[comissaoInput,setComissaoInput]=useState(0);
 const [pctCapital,setPctCapital]=useState(0),[pctManut,setPctManut]=useState(0),[pctEmerg,setPctEmerg]=useState(0),[pctFerr,setPctFerr]=useState(0);
 const [obs,setObs]=useState(""),[msg,setMsg]=useState(""),[salvando,setSalvando]=useState(false);
 const [busca,setBusca]=useState(""),[filtroStatus,setFiltroStatus]=useState("Todos"),[selecionada,setSelecionada]=useState<Simulacao|null>(null);
 const agora=new Date(); const [mes,setMes]=useState(agora.getMonth()+1),[ano,setAno]=useState(agora.getFullYear());
 const [catRetirada,setCatRetirada]=useState(CATEGORIAS[0]),[valorRetirada,setValorRetirada]=useState(0),[motivoRetirada,setMotivoRetirada]=useState("");

 async function carregar(){
  const [c,f,h,m]=await Promise.all([
   supabase.from("clientes").select("id,nome,telefone,cidade,endereco").order("nome"),
   supabase.from("funcionarios").select("id,nome").order("nome"),
   supabase.from("precificacao_simulacoes").select("*").order("criada_em",{ascending:false}),
   supabase.from("precificacao_reserva_movimentos").select("*").order("criada_em",{ascending:false}),
  ]);
  if(!c.error)setClientes((c.data??[]) as Cliente[]); if(!f.error)setFuncionarios((f.data??[]) as Funcionario[]);
  if(!h.error)setHistorico(h.data??[]); if(!m.error)setMovimentos(m.data??[]);
 }
 useEffect(()=>{void carregar()},[]);

 const total=useMemo(()=>{
  const gastos=n(compra)+n(material)+n(projeto)+n(maoObra);
  const comissao=!temComissao?0:tipoComissao==="percentual"?n(venda)*n(comissaoInput)/100:n(comissaoInput);
  const lucro=n(venda)-gastos-comissao, base=Math.max(0,lucro);
  const capital=base*n(pctCapital)/100, manut=base*n(pctManut)/100, emerg=base*n(pctEmerg)/100, ferr=base*n(pctFerr)/100;
  const pct=n(pctCapital)+n(pctManut)+n(pctEmerg)+n(pctFerr), destinado=capital+manut+emerg+ferr;
  return {gastos,comissao,lucro,capital,manut,emerg,ferr,pct,destinado,saldo:lucro-destinado,margem:n(venda)>0?lucro/n(venda)*100:0};
 },[compra,material,projeto,maoObra,venda,temComissao,tipoComissao,comissaoInput,pctCapital,pctManut,pctEmerg,pctFerr]);

 function selecionarCliente(id:string){ setClienteId(id); const c=clientes.find(x=>x.id===id); if(c){setNome(c.nome);setTelefone(c.telefone||"");setCidade(c.cidade||"");setEndereco(c.endereco||"");setCadastrarCliente(false)} else {setNome("");setTelefone("");setCidade("");setEndereco("")} }
 function beneficiario(){ if(!temComissao)return ""; if(tipoBenef==="funcionario")return funcionarios.find(f=>f.id===funcId)?.nome||""; return benefManual.trim(); }
 async function garantirCliente(){ if(clienteId)return clienteId; if(!cadastrarCliente)return null; const r=await supabase.from("clientes").insert({nome:nome.trim(),telefone,cidade,endereco}).select("id").single(); if(r.error)throw r.error; setClienteId(String(r.data.id)); return String(r.data.id); }
 function payload(){
  const b=beneficiario();
  return {cliente_nome:nome.trim(),cliente_telefone:telefone,cliente_cidade:cidade,cliente_endereco:endereco,segmento,consumo_kwh:n(consumo),potencia_kwp:n(kwp),kit_nome:identificacao||null,kit_dados:{identificacao},itens:[],custos:[{nome:"Compra no fornecedor",valor:n(compra)},{nome:"Material utilizado",valor:n(material)},{nome:"Projeto",valor:n(projeto)},{nome:"Mão de obra",valor:n(maoObra)}],comissoes:temComissao?[{beneficiario:b,tipo_beneficiario:tipoBenef,forma:tipoComissao,percentual:tipoComissao==="percentual"?n(comissaoInput):0,valor_fixo:tipoComissao==="fixo"?n(comissaoInput):0,valor_calculado:total.comissao}]:[],reservas:[{categoria:CATEGORIAS[0],percentual:n(pctCapital),valor:total.capital},{categoria:CATEGORIAS[1],percentual:n(pctManut),valor:total.manut},{categoria:CATEGORIAS[2],percentual:n(pctEmerg),valor:total.emerg},{categoria:CATEGORIAS[3],percentual:n(pctFerr),valor:total.ferr}],custo_total:total.gastos,valor_venda:n(venda),comissao_total:total.comissao,lucro_antes_reservas:total.lucro,reservas_total:total.destinado,lucro_final:total.saldo,margem_percentual:total.margem,observacoes:obs,criado_por:usuarioNome||null};
 }
 async function salvar(){
  setMsg(""); if(!nome.trim())return setMsg("Informe o cliente."); if(n(venda)<=0)return setMsg("Informe o valor de venda."); if(total.pct>100)return setMsg("As destinações não podem ultrapassar 100%."); if(temComissao&&!beneficiario())return setMsg("Informe quem receberá a comissão.");
  setSalvando(true); try{ const cid=await garantirCliente(); const r=await supabase.from("precificacao_simulacoes").insert({...payload(),cliente_id:cid,status:"Simulação",contabilizada:false}).select("*").single(); if(r.error)throw r.error; setMsg("Simulação salva no histórico."); await carregar(); }
  catch(e:any){setMsg(`Erro ao salvar: ${e?.message||e?.details||"falha na gravação"}`)} finally{setSalvando(false)}
 }
 async function confirmarVenda(s:Simulacao){
  if(!window.confirm(`Confirmar a venda de ${s.cliente_nome} por ${moeda(s.valor_venda)}?`))return;
  const quando=new Date().toISOString(); const u=await supabase.from("precificacao_simulacoes").update({status:"Venda Confirmada",contabilizada:true,venda_confirmada_em:quando,atualizada_em:quando}).eq("id",s.id); if(u.error){setMsg(u.error.message);return}
  const entradas=(s.reservas||[]).filter((r:any)=>n(r.valor)>0).map((r:any)=>({categoria:r.categoria,tipo:"entrada",valor:n(r.valor),descricao:`Venda ${s.cliente_nome} — ${s.segmento}`,simulacao_id:s.id,criado_por:usuarioNome||null}));
  if(entradas.length){const ir=await supabase.from("precificacao_reserva_movimentos").insert(entradas); if(ir.error){setMsg(`Venda confirmada, mas houve erro nas reservas: ${ir.error.message}`);await carregar();return}}
  setMsg("Venda confirmada e contabilizada."); setSelecionada(null); await carregar();
 }
 async function excluirSimulacao(s:Simulacao){
  if(s.contabilizada){
   setMsg("Venda confirmada não pode ser excluída por este botão. Cancele a venda para preservar o histórico financeiro.");
   return;
  }
  if(!window.confirm(`Excluir a simulação de ${s.cliente_nome}?\n\nEssa ação remove a simulação do histórico e não pode ser desfeita.`))return;
  const r=await supabase.from("precificacao_simulacoes").delete().eq("id",s.id).eq("contabilizada",false);
  if(r.error){setMsg(`Erro ao excluir: ${r.error.message}`);return}
  if(selecionada?.id===s.id)setSelecionada(null);
  setMsg("Simulação excluída do histórico.");
  await carregar();
 }
 async function retirar(){
  if(n(valorRetirada)<=0||!motivoRetirada.trim())return setMsg("Informe o valor e o motivo da retirada.");
  const saldo=saldoCategoria(catRetirada); if(n(valorRetirada)>saldo)return setMsg(`Saldo insuficiente em ${catRetirada}. Saldo: ${moeda(saldo)}`);
  const r=await supabase.from("precificacao_reserva_movimentos").insert({categoria:catRetirada,tipo:"retirada",valor:n(valorRetirada),descricao:motivoRetirada.trim(),criado_por:usuarioNome||null}); if(r.error)return setMsg(r.error.message);
  setValorRetirada(0);setMotivoRetirada("");setMsg("Retirada registrada.");await carregar();
 }
 function saldoCategoria(cat:string){return movimentos.filter(m=>m.categoria===cat).reduce((a,m)=>a+(m.tipo==="entrada"?n(m.valor):-n(m.valor)),0)}

 const filtrado=historico.filter(s=>(!busca||`${s.cliente_nome} ${s.segmento}`.toLowerCase().includes(busca.toLowerCase()))&&(filtroStatus==="Todos"||s.status===filtroStatus));
 const vendasMes=historico.filter(s=>s.contabilizada&&s.venda_confirmada_em&&new Date(s.venda_confirmada_em).getMonth()+1===mes&&new Date(s.venda_confirmada_em).getFullYear()===ano);
 const resumo=useMemo(()=>{
  const faturamento=vendasMes.reduce((a,s)=>a+n(s.valor_venda),0), custos=vendasMes.reduce((a,s)=>a+n(s.custo_total),0), comissoes=vendasMes.reduce((a,s)=>a+n(s.comissao_total),0), lucro=vendasMes.reduce((a,s)=>a+n(s.lucro_antes_reservas),0), reservas=vendasMes.reduce((a,s)=>a+n(s.reservas_total),0);
  const seg=Object.fromEntries(SEGMENTOS.map(x=>[x,vendasMes.filter(s=>s.segmento===x).reduce((a,s)=>a+n(s.valor_venda),0)]));
  const pessoas:Record<string,number>={}; vendasMes.forEach(s=>(s.comissoes||[]).forEach((c:any)=>{const k=c.beneficiario||"Não identificado";pessoas[k]=(pessoas[k]||0)+n(c.valor_calculado)}));
  const dest:Record<string,number>={}; vendasMes.forEach(s=>(s.reservas||[]).forEach((r:any)=>dest[r.categoria]=(dest[r.categoria]||0)+n(r.valor)));
  return {faturamento,custos,comissoes,lucro,reservas,seg,pessoas,dest};
 },[vendasMes]);

 const input="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-yellow-400";
 const card="rounded-xl border border-zinc-800 bg-black p-3";
 const tab=(x:Aba)=>`rounded-xl px-4 py-2 text-sm font-black ${aba===x?"bg-yellow-400 text-black":"border border-zinc-700 text-zinc-300"}`;
 return <div className="h-full min-h-0 bg-zinc-950 text-white">
  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-yellow-500/30 bg-black px-3 py-1.5">
   <div><h1 className="text-lg font-black text-yellow-400">PRECIFICAÇÃO</h1><p className="text-[10px] text-zinc-500">Simular → salvar → confirmar venda → acompanhar resultado</p></div>
   <div className="flex flex-wrap gap-2"><button className={tab("nova")} onClick={()=>setAba("nova")}>Nova Precificação</button><button className={tab("historico")} onClick={()=>setAba("historico")}>Histórico</button><button className={tab("reservas")} onClick={()=>setAba("reservas")}>Reservas / Caixa</button><button className={tab("resumo")} onClick={()=>setAba("resumo")}>Resumo Mensal</button></div>
  </div>
  {msg&&<div className="border-b border-yellow-500/30 bg-yellow-400/10 px-3 py-1.5 text-sm font-bold text-yellow-300">{msg}</div>}

  {aba==="nova"&&<div className="grid h-[calc(100%-52px)] min-h-0 gap-2 p-2 lg:grid-cols-2">
   <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
    <section className={card}><h2 className="mb-2 font-black text-yellow-400">1. CLIENTE / SERVIÇO</h2><div className="grid gap-2 md:grid-cols-2"><select className={input} value={segmento} onChange={e=>setSegmento(e.target.value as Segmento)}>{SEGMENTOS.map(x=><option key={x}>{x}</option>)}</select><select className={input} value={clienteId} onChange={e=>selecionarCliente(e.target.value)}><option value="">Novo cliente / manual</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select><input className={input} placeholder="Nome do cliente" value={nome} onChange={e=>setNome(e.target.value)}/><input className={input} placeholder="Identificação do serviço / sistema" value={identificacao} onChange={e=>setIdentificacao(e.target.value)}/>{segmento==="Energia Solar"&&<><Campo label="Consumo / geração (kWh)" value={consumo} set={setConsumo}/><Campo label="Potência (kWp)" value={kwp} set={setKwp}/></>}</div>{!clienteId&&<label className="mt-2 flex gap-2 text-xs text-zinc-400"><input type="checkbox" checked={cadastrarCliente} onChange={e=>setCadastrarCliente(e.target.checked)}/> Cadastrar este cliente ao salvar</label>}</section>
    <section className={card}><h2 className="mb-2 font-black text-yellow-400">2. GASTOS DA OPERAÇÃO</h2><Campo label="Valor de compra no fornecedor" value={compra} set={setCompra}/><Campo label="Material utilizado" value={material} set={setMaterial}/><Campo label="Projeto" value={projeto} set={setProjeto}/><Campo label="Mão de obra" value={maoObra} set={setMaoObra}/><Total label="TOTAL DOS GASTOS" value={total.gastos}/></section>
   </div>
   <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
    <section className={card}><h2 className="mb-2 font-black text-yellow-400">3. VENDA, COMISSÃO E LUCRO</h2><CampoVenda value={venda} set={setVenda}/><label className="my-2 flex gap-2 text-sm font-bold"><input type="checkbox" checked={temComissao} onChange={e=>setTemComissao(e.target.checked)}/> Tem comissão / gratificação</label>{temComissao&&<div className="grid gap-2 md:grid-cols-2"><select className={input} value={tipoBenef} onChange={e=>setTipoBenef(e.target.value)}><option value="funcionario">Funcionário cadastrado</option><option value="indicacao">Cliente / amigo / indicação</option><option value="outro">Outra pessoa</option></select>{tipoBenef==="funcionario"?<select className={input} value={funcId} onChange={e=>setFuncId(e.target.value)}><option value="">Quem recebe?</option>{funcionarios.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select>:<input className={input} placeholder="Nome de quem recebe" value={benefManual} onChange={e=>setBenefManual(e.target.value)}/>}<select className={input} value={tipoComissao} onChange={e=>setTipoComissao(e.target.value)}><option value="percentual">Porcentagem sobre a venda (%)</option><option value="fixo">Valor fixo (R$)</option></select><Campo label={tipoComissao==="percentual"?"Percentual (%)":"Valor (R$)"} value={comissaoInput} set={setComissaoInput}/></div>}<div className="mt-2 grid gap-2 md:grid-cols-3"><Mini label="Gastos" value={total.gastos}/><Mini label="Comissão" value={total.comissao}/><Mini label="LUCRO LIVRE" value={total.lucro} destaque/></div></section>
    <section className={card}><h2 className="mb-1 font-black text-yellow-400">4. DESTINAÇÃO DO LUCRO LIVRE</h2><p className="mb-2 text-xs text-zinc-500">Percentuais calculados automaticamente sobre o lucro livre.</p><Pct label="Capital de giro" value={pctCapital} set={setPctCapital} calc={total.capital}/><Pct label="Manutenção futura / garantia" value={pctManut} set={setPctManut} calc={total.manut}/><Pct label="Emergência" value={pctEmerg} set={setPctEmerg} calc={total.emerg}/><Pct label="Ferramentas / outros" value={pctFerr} set={setPctFerr} calc={total.ferr}/><div className="mt-2 grid gap-2 md:grid-cols-2"><Mini label={`Total destinado (${total.pct.toFixed(1)}%)`} value={total.destinado}/><Mini label="Saldo após destinações" value={total.saldo} destaque/></div></section>
    <textarea className={input} rows={1} placeholder="Observações" value={obs} onChange={e=>setObs(e.target.value)}/><button disabled={salvando} onClick={()=>void salvar()} className="w-full rounded-xl bg-yellow-400 px-4 py-2.5 font-black text-black">{salvando?"SALVANDO...":"💾 SALVAR SIMULAÇÃO"}</button>
   </div>
  </div>}

  {aba==="historico"&&<div className="h-[calc(100%-52px)] overflow-y-auto p-2"><div className="mb-2 grid gap-2 md:grid-cols-[1fr_220px]"><input className={input} placeholder="Buscar cliente ou segmento..." value={busca} onChange={e=>setBusca(e.target.value)}/><select className={input} value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)}><option>Todos</option><option>Simulação</option><option>Venda Confirmada</option></select></div><div className="space-y-2">{filtrado.map(s=><div key={s.id} className={`${card} flex flex-wrap items-center justify-between gap-2`}><div><div className="font-black">{s.cliente_nome}</div><div className="text-xs text-zinc-500">{s.segmento} • {dataBR(s.criada_em)} • {s.status}</div></div><div className="text-right"><div className="font-black text-yellow-400">{moeda(s.valor_venda)}</div><div className="mt-1 flex flex-wrap gap-2"><button className="rounded-lg border border-zinc-700 px-3 py-1 text-xs" onClick={()=>setSelecionada(s)}>Visualizar</button>{!s.contabilizada&&<><button className="rounded-lg bg-yellow-400 px-3 py-1 text-xs font-black text-black" onClick={()=>void confirmarVenda(s)}>Confirmar venda</button><button className="rounded-lg border border-red-500/70 px-3 py-1 text-xs font-black text-red-400" onClick={()=>void excluirSimulacao(s)}>Excluir</button></>}</div></div></div>)}{!filtrado.length&&<div className="p-8 text-center text-zinc-500">Nenhuma simulação encontrada.</div>}</div></div>}

  {aba==="reservas"&&<div className="h-[calc(100%-52px)] overflow-y-auto p-2"><div className="grid gap-2 lg:grid-cols-4">{CATEGORIAS.map(c=><div className={card} key={c}><div className="text-xs text-zinc-500">{c}</div><div className="mt-2 text-2xl font-black text-yellow-400">{moeda(saldoCategoria(c))}</div></div>)}</div><div className="mt-2 grid gap-2 lg:grid-cols-2"><section className={card}><h2 className="mb-2 font-black text-yellow-400">REGISTRAR RETIRADA</h2><select className={input} value={catRetirada} onChange={e=>setCatRetirada(e.target.value)}>{CATEGORIAS.map(c=><option key={c}>{c}</option>)}</select><div className="mt-2"><Campo label="Valor da retirada" value={valorRetirada} set={setValorRetirada}/></div><input className={`${input} mt-2`} placeholder="Para que o dinheiro foi utilizado?" value={motivoRetirada} onChange={e=>setMotivoRetirada(e.target.value)}/><button className="mt-2 w-full rounded-lg bg-yellow-400 py-2.5 font-black text-black" onClick={()=>void retirar()}>REGISTRAR RETIRADA</button></section><section className={card}><h2 className="mb-2 font-black text-yellow-400">ÚLTIMAS MOVIMENTAÇÕES</h2><div className="max-h-72 space-y-1.5 overflow-y-auto">{movimentos.map(m=><div key={m.id} className="rounded-lg bg-zinc-900 p-2.5"><div className="flex justify-between gap-2"><b>{m.categoria}</b><b className={m.tipo==="retirada"?"text-red-400":"text-green-400"}>{m.tipo==="retirada"?"-":"+"}{moeda(m.valor)}</b></div><div className="text-xs text-zinc-500">{m.descricao||"—"} • {dataBR(m.criada_em)}</div></div>)}</div></section></div></div>}

  {aba==="resumo"&&<div className="h-[calc(100%-52px)] overflow-y-auto p-2"><div className="mb-2 flex gap-2"><select className={input} value={mes} onChange={e=>setMes(Number(e.target.value))}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{String(i+1).padStart(2,"0")}</option>)}</select><input className={input} type="number" value={ano} onChange={e=>setAno(Number(e.target.value))}/></div><div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5"><Kpi t="Faturamento" v={resumo.faturamento}/><Kpi t="Custos" v={resumo.custos}/><Kpi t="Comissões" v={resumo.comissoes}/><Kpi t="Lucro livre" v={resumo.lucro}/><Kpi t="Destinado às reservas" v={resumo.reservas}/></div><div className="mt-2 grid gap-2 lg:grid-cols-3"><section className={card}><h2 className="mb-2 font-black text-yellow-400">VENDAS POR SEGMENTO</h2>{SEGMENTOS.map(s=><Linha key={s} a={s} b={moeda(resumo.seg[s]||0)}/>)}</section><section className={card}><h2 className="mb-2 font-black text-yellow-400">COMISSÃO POR PESSOA</h2>{Object.entries(resumo.pessoas).sort((a,b)=>b[1]-a[1]).map(([p,v])=><Linha key={p} a={p} b={moeda(v)}/>)}{!Object.keys(resumo.pessoas).length&&<span className="text-sm text-zinc-500">Sem comissões no período.</span>}</section><section className={card}><h2 className="mb-2 font-black text-yellow-400">DESTINAÇÕES DO MÊS</h2>{CATEGORIAS.map(c=><Linha key={c} a={c} b={moeda(resumo.dest[c]||0)}/>)}</section></div></div>}

  {selecionada&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={()=>setSelecionada(null)}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-yellow-500/40 bg-zinc-950 p-5" onClick={e=>e.stopPropagation()}><div className="flex justify-between"><div><h2 className="text-xl font-black text-yellow-400">{selecionada.cliente_nome}</h2><p className="text-xs text-zinc-500">{selecionada.segmento} • {dataBR(selecionada.criada_em)}</p></div><button onClick={()=>setSelecionada(null)}>✕</button></div><div className="mt-4 grid gap-2 md:grid-cols-2"><Mini label="Total de gastos" value={n(selecionada.custo_total)}/><Mini label="Valor de venda" value={n(selecionada.valor_venda)} destaque/><Mini label="Comissão" value={n(selecionada.comissao_total)}/><Mini label="Lucro livre" value={n(selecionada.lucro_antes_reservas)} destaque/><Mini label="Reservas" value={n(selecionada.reservas_total)}/><Mini label="Saldo final" value={n(selecionada.lucro_final)} destaque/></div>{!selecionada.contabilizada&&<div className="mt-4 grid gap-2 md:grid-cols-2"><button className="w-full rounded-xl bg-yellow-400 py-3 font-black text-black" onClick={()=>void confirmarVenda(selecionada)}>CONFIRMAR VENDA</button><button className="w-full rounded-xl border border-red-500/70 py-3 font-black text-red-400" onClick={()=>void excluirSimulacao(selecionada)}>EXCLUIR SIMULAÇÃO</button></div>}</div></div>}
 </div>
}

function CampoVenda({value,set}:{value:number,set:(v:number)=>void}){return <label className="mb-3 block rounded-2xl bg-yellow-400 p-4 text-black shadow-sm md:grid md:grid-cols-[1fr_260px] md:items-center md:gap-4"><span className="block text-sm font-black uppercase tracking-wide md:text-base">Valor de venda</span><input aria-label="Valor de venda" type="number" step="0.01" className="mt-2 w-full rounded-xl border-2 border-black/20 bg-yellow-300 px-4 py-3 text-right text-3xl font-black text-black outline-none placeholder:text-black/40 focus:border-black md:mt-0 md:text-4xl" value={value||""} onChange={e=>set(n(e.target.value))}/></label>}
function Campo({label,value,set}:{label:string,value:number,set:(v:number)=>void}){return <label className="mb-1.5 grid items-center gap-2 text-sm md:grid-cols-[1fr_190px]"><span className="font-bold">{label}</span><input type="number" step="0.01" className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" value={value||""} onChange={e=>set(n(e.target.value))}/></label>}
function Pct({label,value,set,calc}:{label:string,value:number,set:(v:number)=>void,calc:number}){return <div className="mb-1.5 grid items-center gap-2 text-sm md:grid-cols-[1fr_95px_145px]"><b>{label}</b><div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-950 px-3"><input className="w-full bg-transparent py-2 text-right outline-none" type="number" value={value||""} onChange={e=>set(n(e.target.value))}/><b className="ml-2 text-yellow-400">%</b></div><b className="rounded-lg bg-zinc-900 px-3 py-2 text-right text-yellow-400">{moeda(calc)}</b></div>}
function Total({label,value}:{label:string,value:number}){return <div className="mt-2 flex items-center justify-between rounded-lg bg-zinc-900 p-3"><b>{label}</b><b className="text-xl text-yellow-400">{moeda(value)}</b></div>}
function Mini({label,value,destaque=false}:{label:string,value:number,destaque?:boolean}){return <div className={`rounded-lg p-2.5 ${destaque?"border border-yellow-500/30 bg-yellow-400/10":"bg-zinc-900"}`}><div className="text-xs text-zinc-500">{label}</div><div className={`font-black ${destaque?"text-lg text-yellow-400":"text-base"}`}>{moeda(value)}</div></div>}
function Kpi({t,v}:{t:string,v:number}){return <div className="rounded-xl border border-zinc-800 bg-black p-3"><div className="text-xs text-zinc-500">{t}</div><div className="mt-0.5 text-lg font-black text-yellow-400">{moeda(v)}</div></div>}
function Linha({a,b}:{a:string,b:string}){return <div className="flex justify-between gap-3 border-b border-zinc-800 py-1.5 text-sm"><span>{a}</span><b>{b}</b></div>}
