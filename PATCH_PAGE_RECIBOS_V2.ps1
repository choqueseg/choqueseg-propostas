

$page = Join-Path (Get-Location) "app\page.tsx"

if (-not (Test-Path $page)) {
  throw "Não encontrei app\page.tsx. Execute este script dentro da pasta yes."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = "$page.backup-recibos-v2-$timestamp"
Copy-Item $page $backup -Force

$texto = Get-Content $page -Raw -Encoding UTF8

function Aplicar-Regex {
  param(
    [string]$Padrao,
    [string]$Substituicao,
    [string]$Descricao
  )

  if ([regex]::IsMatch($script:texto, $Padrao)) {
    $script:texto = [regex]::Replace(
      $script:texto,
      $Padrao,
      $Substituicao,
      1
    )
    Write-Host "OK - $Descricao" -ForegroundColor Green
  } else {
    Write-Host "AVISO - ponto não encontrado ou já aplicado: $Descricao" -ForegroundColor Yellow
  }
}

# 1) Import
if ($texto -notmatch 'RecibosModule') {
  Aplicar-Regex `
    '(import FinanceiroModule from "@/modules/financeiro/FinanceiroModule";)' `
    '$1' + "`r`n" + 'import RecibosModule from "@/modules/recibos/RecibosModule";' `
    "Import do módulo Recibos"
} else {
  Write-Host "OK - Import do módulo Recibos já existe" -ForegroundColor DarkYellow
}

# 2) Permissão
if ($texto -notmatch '\{ id: "recibos", nome: "Recibos" \}') {
  Aplicar-Regex `
    '(\{ id: "financeiro", nome: "Financeiro" \},)' `
    '$1' + "`r`n  " + '{ id: "recibos", nome: "Recibos" },' `
    "Permissão Recibos"
} else {
  Write-Host "OK - Permissão Recibos já existe" -ForegroundColor DarkYellow
}

# 3) TelaSistema - inserção flexível após financeiro
if ($texto -notmatch '\|\s*"recibos"') {
  Aplicar-Regex `
    '(\|\s*"financeiro"\s*\r?\n)' `
    '$1  | "recibos"' + "`r`n" `
    "Tipo TelaSistema"
} else {
  Write-Host "OK - TelaSistema já contém recibos" -ForegroundColor DarkYellow
}

# 4) Ordem padrão
if ($texto -notmatch '(?m)^\s*"recibos",\s*$') {
  Aplicar-Regex `
    '(^\s*"financeiro",\s*\r?\n)' `
    '$1  "recibos",' + "`r`n" `
    "Ordem padrão do menu"
} else {
  Write-Host "OK - Ordem padrão já contém recibos" -ForegroundColor DarkYellow
}

# 5) Renderização da tela
if ($texto -notmatch 'telaAtual === "recibos"') {
  $padraoFinanceiro = '(\{telaAtual === "financeiro" && ehAdministrador && \(\s*<FinanceiroModule usuarioNome=\{usuarioLogado\.nome\} />\s*\)\})'
  $blocoRecibos = '$1' + "`r`n`r`n          " + '{telaAtual === "recibos" && ehAdministrador && (' + "`r`n            " + '<RecibosModule />' + "`r`n          " + ')}'
  Aplicar-Regex $padraoFinanceiro $blocoRecibos "Abertura da tela Recibos"
} else {
  Write-Host "OK - Abertura da tela Recibos já existe" -ForegroundColor DarkYellow
}

# 6) Menu administrador - inserir antes de Financeiro
if ($texto -notmatch '\{ tela: "recibos", nome: "Recibos"') {
  Aplicar-Regex `
    '(^\s*\{ tela: "financeiro", nome: "Financeiro", icone:.*$)' `
    '  { tela: "recibos", nome: "Recibos", icone: "🧾" },' + "`r`n" + '$1' `
    "Item Recibos no menu do administrador"
} else {
  Write-Host "OK - Item Recibos no menu já existe" -ForegroundColor DarkYellow
}

Set-Content -Path $page -Value $texto -Encoding UTF8

Write-Host ""
Write-Host "Integração de Recibos aplicada." -ForegroundColor Green
Write-Host "Backup criado em:" -ForegroundColor Cyan
Write-Host $backup
Write-Host ""
Write-Host "Agora execute: npm run build" -ForegroundColor Yellow
