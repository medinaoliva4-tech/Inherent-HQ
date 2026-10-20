# Laya para Inherent OS · instalador de un comando (Windows).
#
#   Instalar o actualizar (PowerShell):  irm https://inherent-work.vercel.app/laya/instalar.ps1 | iex
#   Con el modelo local:  & ([scriptblock]::Create((irm https://inherent-work.vercel.app/laya/instalar.ps1))) -ModeloLocal
#   Quitarlo todo:  & ([scriptblock]::Create((irm https://inherent-work.vercel.app/laya/instalar.ps1))) -Desinstalar
#
# Qué hace (sin administrador, todo dentro de %USERPROFILE%\.inherent\laya):
#   1. Instala uv si no está (el instalador oficial, dentro de esta carpeta).
#   2. Crea un entorno con Python 3.12 propio y le instala laya[serve] (torch en Windows ya es CPU).
#   3. Copia el puente (puente.py) y baja el modelo multilingual (~650 MB, solo la primera vez).
#   4. Lo deja corriendo siempre: una tarea programada al iniciar sesión (o, si Windows no deja,
#      un acceso directo en Inicio).
#   5. Revisa que http://127.0.0.1:7357/health responda.
#   6. OPCIONAL, solo con -ModeloLocal: instala Ollama (sin administrador, dentro de esta misma carpeta) y
#      baja un modelo pequeño que escribe español (gemma3:4b, ~3.4 GB) para el texto repetitivo: variantes
#      de caption, alt text y títulos cortos. Queda en http://127.0.0.1:11434. Si algo falla ahí, Laya ya
#      quedó funcionando: este paso nunca la rompe.
# Correrlo otra vez actualiza sin romper nada.
#
# Opciones: -ModeloLocal (agrega el paso 6) · -SoloModeloLocal (solo el paso 6, sin tocar Laya) · -Desinstalar
# (quita todo, también el modelo local). Variable opcional: LAYA_MODELO_LOCAL (otro modelo de ollama.com/library).
param([switch]$Desinstalar, [switch]$ModeloLocal, [switch]$SoloModeloLocal)

function Instalar-LayaInherent {
  param([switch]$Quitar, [switch]$ModeloLocal, [switch]$SoloModeloLocal)

  $ErrorActionPreference = 'Stop'
  $ProgressPreference = 'SilentlyContinue'
  try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch { }

  $LayaHome = if ($env:LAYA_HOME) { $env:LAYA_HOME } else { Join-Path $env:USERPROFILE '.inherent\laya' }
  $Puerto = if ($env:LAYA_PUENTE_PUERTO) { [int]$env:LAYA_PUENTE_PUERTO } else { 7357 }
  $PyVer = if ($env:LAYA_PYTHON) { $env:LAYA_PYTHON } else { '3.12' }
  $BaseUrl = if ($env:LAYA_BASE_URL) { $env:LAYA_BASE_URL } else { 'https://inherent-work.vercel.app/laya' }
  $Tarea = 'Inherent Laya'
  $Venv = Join-Path $LayaHome 'venv'
  $Py = Join-Path $Venv 'Scripts\python.exe'
  $Pyw = Join-Path $Venv 'Scripts\pythonw.exe'
  $Puente = Join-Path $LayaHome 'puente.py'
  $Logs = Join-Path $LayaHome 'log'
  $LogInstalar = Join-Path $Logs 'instalar.log'
  $Atajo = [IO.Path]::Combine([Environment]::GetFolderPath('Startup'), 'Inherent Laya.lnk')
  $Emoji = [bool]($env:WT_SESSION -or $env:TERM_PROGRAM)  # la consola vieja no pinta emojis
  $OllamaPuerto = 11434
  $OllamaUrl = "http://127.0.0.1:$OllamaPuerto"
  $OllamaHome = Join-Path $LayaHome 'ollama'
  $TareaOllama = 'Inherent Ollama'
  $AtajoOllama = [IO.Path]::Combine([Environment]::GetFolderPath('Startup'), 'Inherent Ollama.lnk')
  $ModeloNombre = if ($env:LAYA_MODELO_LOCAL) { $env:LAYA_MODELO_LOCAL } else { 'gemma3:4b' }
  $env:UV_PYTHON_INSTALL_DIR = Join-Path $LayaHome 'python'
  $env:UV_CACHE_DIR = Join-Path $LayaHome 'cache'
  $env:UV_NO_PROGRESS = '1'

  function Paso([string]$t) { Write-Host ''; Write-Host "-> $t" }
  function Fallo([string]$t) { throw $t }

  # Corre un programa, manda su salida al log y devuelve el código de salida (sin que stderr corte el script).
  function Correr([string]$exe, [string[]]$argv) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & $exe @argv 2>&1 | Out-File -FilePath $LogInstalar -Append -Encoding utf8 } finally { $ErrorActionPreference = $prev }
    return $LASTEXITCODE
  }

  function Buscar-Uv {
    $c = Get-Command uv -ErrorAction SilentlyContinue
    if ($c) { return $c.Source }
    foreach ($p in @((Join-Path $LayaHome 'bin\uv.exe'), (Join-Path $env:USERPROFILE '.local\bin\uv.exe'), (Join-Path $env:USERPROFILE '.cargo\bin\uv.exe'))) {
      if (Test-Path $p) { return $p }
    }
    return $null
  }

  # Nuestros procesos: python que corre ESTE puente.py. Se matan por su pid exacto.
  function Detener {
    try { Stop-ScheduledTask -TaskName $Tarea -ErrorAction SilentlyContinue } catch { }
    $procs = Get-CimInstance Win32_Process -Filter "Name='python.exe' OR Name='pythonw.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -and $_.CommandLine.Contains($Puente) }
    foreach ($p in $procs) { try { Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop } catch { } }
    if ($procs) { Start-Sleep -Seconds 2 }
  }

  function Salud {
    try { return Invoke-RestMethod -Uri "http://127.0.0.1:$Puerto/health" -TimeoutSec 2 -UseBasicParsing } catch { return $null }
  }

  # ---------- el modelo local (opcional): Ollama + un modelo pequeño que escribe español ----------
  function Ollama-Vivo {
    try { Invoke-RestMethod -Uri "$OllamaUrl/api/version" -TimeoutSec 2 -UseBasicParsing | Out-Null; return $true } catch { return $false }
  }
  function Ollama-Buscar {
    foreach ($p in @((Join-Path $OllamaHome 'ollama.exe'), (Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'))) { if (Test-Path $p) { return $p } }
    $c = Get-Command ollama -ErrorAction SilentlyContinue
    if ($c) { return $c.Source }
    return $null
  }
  function Modelo-Instalado {
    try { $t = Invoke-RestMethod -Uri "$OllamaUrl/api/tags" -TimeoutSec 3 -UseBasicParsing; return [bool]($t.models | Where-Object { $_.name -eq $ModeloNombre }) } catch { return $false }
  }
  function Bajar-Ollama {
    $arq = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'amd64' }
    $zip = Join-Path $LayaHome "ollama-windows-$arq.zip"
    Paso 'Bajando Ollama (el programa que corre el modelo en tu compu)'
    Invoke-WebRequest -Uri "https://ollama.com/download/ollama-windows-$arq.zip" -OutFile $zip -UseBasicParsing
    if (Test-Path $OllamaHome) { Remove-Item $OllamaHome -Recurse -Force }
    Expand-Archive -Path $zip -DestinationPath $OllamaHome -Force
    Remove-Item $zip -Force -ErrorAction SilentlyContinue
    return (Test-Path (Join-Path $OllamaHome 'ollama.exe'))
  }
  function Encender-Ollama([string]$exe) {
    $modelos = Join-Path $OllamaHome 'modelos'
    New-Item -ItemType Directory -Force -Path $modelos | Out-Null
    Paso 'Dejando el modelo local encendido siempre'
    # OLLAMA_ORIGINS deja que Inherent OS lea /api/tags desde el navegador.
    $cmd = "`$env:OLLAMA_HOST='127.0.0.1:$OllamaPuerto'; `$env:OLLAMA_ORIGINS='https://inherent-work.vercel.app'; `$env:OLLAMA_MODELS='$modelos'; & '$exe' serve"
    $argumentos = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command `"$cmd`""
    try {
      $usuario = "$env:USERDOMAIN\$env:USERNAME"
      $accion = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argumentos -WorkingDirectory $LayaHome
      $disparador = New-ScheduledTaskTrigger -AtLogOn -User $usuario
      $ajustes = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
        -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew -Priority 5
      $quien = New-ScheduledTaskPrincipal -UserId $usuario -LogonType Interactive -RunLevel Limited
      Register-ScheduledTask -TaskName $TareaOllama -Action $accion -Trigger $disparador -Settings $ajustes -Principal $quien `
        -Description 'Modelo local para Inherent OS (Ollama en 127.0.0.1)' -Force | Out-Null
      Start-ScheduledTask -TaskName $TareaOllama
    } catch {
      $ws = New-Object -ComObject WScript.Shell
      $lnk = $ws.CreateShortcut($AtajoOllama)
      $lnk.TargetPath = 'powershell.exe'
      $lnk.Arguments = $argumentos
      $lnk.WorkingDirectory = $LayaHome
      $lnk.WindowStyle = 7
      $lnk.Save()
      Start-Process -FilePath 'powershell.exe' -ArgumentList $argumentos -WindowStyle Hidden
    }
    for ($i = 0; $i -lt 60; $i++) { if (Ollama-Vivo) { return $true }; Start-Sleep -Seconds 1 }
    return $false
  }
  function Modelo-Local {
    Paso "Modelo local para el texto repetitivo ($ModeloNombre)"
    $exe = Ollama-Buscar
    if (Ollama-Vivo) {
      Write-Host "Ya hay un Ollama encendido en ${OllamaUrl}: lo uso tal cual."
    } else {
      if (-not $exe) {
        if (-not (Bajar-Ollama)) { Write-Host 'No pude bajar Ollama. Revisa tu internet.'; return $false }
        $exe = Ollama-Buscar
      }
      if (-not (Encender-Ollama $exe)) { Write-Host "No pude encender Ollama. Revisa $OllamaHome."; return $false }
    }
    if (Modelo-Instalado) {
      Write-Host "El modelo $ModeloNombre ya está bajado."
    } else {
      Paso "Bajando el modelo $ModeloNombre (~3.4 GB), solo la primera vez…"
      if ($exe) {
        $env:OLLAMA_HOST = "127.0.0.1:$OllamaPuerto"
        if ((Correr $exe @('pull', $ModeloNombre)) -ne 0) { Write-Host "No pude bajar el modelo $ModeloNombre."; return $false }
      } else {
        try { Invoke-RestMethod -Method Post -Uri "$OllamaUrl/api/pull" -Body (@{ model = $ModeloNombre; stream = $false } | ConvertTo-Json) -ContentType 'application/json' -TimeoutSec 7200 | Out-Null } catch { Write-Host "No pude bajar el modelo $ModeloNombre."; return $false }
      }
      if (-not (Modelo-Instalado)) { Write-Host "El modelo $ModeloNombre no quedó bajado."; return $false }
    }
    # Un texto de prueba: carga el modelo en memoria y confirma que escribe.
    $ok = $false
    try {
      $r = Invoke-RestMethod -Method Post -Uri "$OllamaUrl/api/generate" -ContentType 'application/json' -TimeoutSec 240 `
        -Body (@{ model = $ModeloNombre; prompt = 'Responde solo con la palabra: listo'; stream = $false; options = @{ num_predict = 8 } } | ConvertTo-Json -Depth 4)
      $ok = [bool]$r.response
    } catch { $ok = $false }
    Write-Host ''
    if ($ok) {
      $v = if ($Emoji) { [char]::ConvertFromUtf32(0x2705) + ' ' } else { '' }
      Write-Host ($v + "Modelo local listo: $ModeloNombre en $OllamaUrl") -ForegroundColor Green
    } else {
      Write-Host 'El modelo quedó bajado pero no contestó la prueba (¿poca memoria libre?). Se volverá a intentar solo al usarlo.'
    }
    return $true
  }
  # Apaga y desregistra el Ollama que dejó este instalador (nunca toca uno que ya tenías).
  function Quitar-Ollama {
    try { Stop-ScheduledTask -TaskName $TareaOllama -ErrorAction SilentlyContinue } catch { }
    try { Unregister-ScheduledTask -TaskName $TareaOllama -Confirm:$false -ErrorAction SilentlyContinue } catch { }
    if (Test-Path $AtajoOllama) { Remove-Item $AtajoOllama -Force }
    $procs = Get-Process -Name ollama, 'ollama app' -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith($OllamaHome) }
    foreach ($p in $procs) { try { Stop-Process -Id $p.Id -Force -ErrorAction Stop } catch { } }
    if ($procs) { Start-Sleep -Seconds 2 }
  }

  try {
    if ($Quitar) {
      Paso 'Quitando Laya de esta compu'
      Detener
      Quitar-Ollama
      try { Unregister-ScheduledTask -TaskName $Tarea -Confirm:$false -ErrorAction SilentlyContinue } catch { }
      if (Test-Path $Atajo) { Remove-Item $Atajo -Force }
      if (-not $LayaHome.StartsWith($env:USERPROFILE + [IO.Path]::DirectorySeparatorChar)) { Fallo "No borro $LayaHome porque no está dentro de tu carpeta personal." }
      if (Test-Path $LayaHome) { Remove-Item $LayaHome -Recurse -Force }
      $padre = Join-Path $env:USERPROFILE '.inherent'
      if ((Test-Path $padre) -and -not (Get-ChildItem $padre -Force)) { Remove-Item $padre -Force }
      Write-Host ''
      Write-Host 'Laya quedó desinstalado (y el modelo local, si lo habías puesto). Para volver a tenerlo, corre otra vez el comando de instalar.' -ForegroundColor Green
      return
    }

    if ($env:OS -ne 'Windows_NT') { Fallo 'Este instalador es para Windows. En Mac o Linux usa: curl -fsSL https://inherent-work.vercel.app/laya/instalar.sh | bash' }
    if ($SoloModeloLocal) {
      New-Item -ItemType Directory -Force -Path $Logs | Out-Null
      if (-not (Modelo-Local)) { Fallo "No pude dejar el modelo local. Mira $LogInstalar y vuelve a correr el comando." }
      return
    }
    if (Test-Path $Py) { Paso "Actualizando Laya en $LayaHome" } else { Paso "Instalando Laya en $LayaHome (5 a 15 minutos la primera vez)" }
    New-Item -ItemType Directory -Force -Path $Logs | Out-Null
    Detener

    # 1. uv
    $uv = Buscar-Uv
    if (-not $uv) {
      Paso 'Instalando uv (el que instala Python sin tocar tu sistema)'
      $env:UV_UNMANAGED_INSTALL = Join-Path $LayaHome 'bin'
      $r = Correr 'powershell' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', 'irm https://astral.sh/uv/install.ps1 | iex')
      Remove-Item Env:\UV_UNMANAGED_INSTALL -ErrorAction SilentlyContinue
      $uv = Join-Path $LayaHome 'bin\uv.exe'
      if ($r -ne 0 -or -not (Test-Path $uv)) { Fallo 'No pude instalar uv. Revisa tu internet y vuelve a correr el comando.' }
    }

    # 2. El entorno con su propio Python
    $ver = $null
    if (Test-Path $Py) { $ver = (& $Py -c "import sys;print('%d.%d' % sys.version_info[:2])" 2>$null) }
    if ($ver -ne $PyVer) {
      Paso "Preparando Python $PyVer"
      if (Test-Path $Venv) { Remove-Item $Venv -Recurse -Force }
      if ((Correr $uv @('venv', '--quiet', '--python', $PyVer, '--python-preference', 'only-managed', $Venv)) -ne 0) { Fallo "No pude preparar Python $PyVer. Mira $LogInstalar y vuelve a intentar." }
    }

    # 3. Laya (en Windows, torch de PyPI ya es el de CPU)
    Paso 'Instalando Laya y sus piezas (torch pesa; ten paciencia)'
    if ((Correr $uv @('pip', 'install', '--quiet', '--python', $Py, '--upgrade-package', 'laya', 'laya[serve]')) -ne 0) { Fallo "No pude instalar Laya. Mira $LogInstalar y vuelve a intentar." }

    # 4. El puente
    $nuevo = "$Puente.nuevo"
    Invoke-WebRequest -Uri "$BaseUrl/puente.py" -OutFile $nuevo -UseBasicParsing
    if (-not (Select-String -Path $nuevo -Pattern 'Puente local de Laya' -Quiet)) { Fallo 'El puente que bajé no se ve bien. Vuelve a correr el comando en un rato.' }
    Move-Item $nuevo $Puente -Force

    # El modelo: si ya lo bajaste antes con pip, se reusa; si no, queda dentro de la carpeta de Laya.
    $hf = $env:HF_HOME
    $marca = 'hub\models--convaiinnovations--laya\snapshots\*\multilingual\model.safetensors'
    if (-not $hf) {
      $comun = Join-Path $env:USERPROFILE '.cache\huggingface'
      $hf = if (Test-Path (Join-Path $comun $marca)) { $comun } else { Join-Path $LayaHome 'modelo' }
    }
    New-Item -ItemType Directory -Force -Path $hf | Out-Null
    if (Test-Path (Join-Path $hf $marca)) { Paso 'Revisando el modelo (ya está bajado)' } else { Paso 'Bajando el modelo (~650 MB), solo la primera vez…' }
    $env:HF_HOME = $hf; $env:USE_TF = '0'; $env:TOKENIZERS_PARALLELISM = 'false'
    if ((Correr $Py @($Puente, '--precargar')) -ne 0) { Fallo 'No pude bajar o probar el modelo. Revisa tu internet y vuelve a correr el comando.' }
    # La tarea programada no pasa variables: el puente las lee de este archivo.
    $config = "HF_HOME=$hf`nLAYA_PUENTE_PUERTO=$Puerto`nLAYA_PUENTE_LOG=$Logs`nUSE_TF=0`nTOKENIZERS_PARALLELISM=false`n"
    [IO.File]::WriteAllText((Join-Path $LayaHome 'config'), $config, (New-Object System.Text.UTF8Encoding $false))

    if (Salud) { Fallo 'Ya hay un puente abierto a mano en otra ventana: ciérralo (Ctrl + C) y vuelve a correr el comando.' }

    # 5. Que quede corriendo siempre: tarea programada al iniciar sesión, que se reinicia si se cae.
    Paso 'Dejándolo encendido siempre (también al reiniciar)'
    $modo = 'tarea'
    try {
      $usuario = "$env:USERDOMAIN\$env:USERNAME"
      $accion = New-ScheduledTaskAction -Execute $Pyw -Argument "`"$Puente`"" -WorkingDirectory $LayaHome
      $disparador = New-ScheduledTaskTrigger -AtLogOn -User $usuario
      $ajustes = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
        -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew -Priority 5
      $quien = New-ScheduledTaskPrincipal -UserId $usuario -LogonType Interactive -RunLevel Limited
      Register-ScheduledTask -TaskName $Tarea -Action $accion -Trigger $disparador -Settings $ajustes -Principal $quien `
        -Description 'Laya para Inherent OS (puente en 127.0.0.1)' -Force | Out-Null
      Start-ScheduledTask -TaskName $Tarea
    } catch {
      # Sin permiso para tareas: un acceso directo en Inicio (arranca al iniciar sesión, sin ventana).
      $modo = 'inicio'
      $ws = New-Object -ComObject WScript.Shell
      $lnk = $ws.CreateShortcut($Atajo)
      $lnk.TargetPath = $Pyw
      $lnk.Arguments = "`"$Puente`""
      $lnk.WorkingDirectory = $LayaHome
      $lnk.WindowStyle = 7
      $lnk.Save()
      Start-Process -FilePath $Pyw -ArgumentList "`"$Puente`"" -WorkingDirectory $LayaHome -WindowStyle Hidden
    }

    # 6. ¿Responde?
    Paso 'Revisando que responda (hasta 1 minuto)'
    $s = $null
    for ($i = 0; $i -lt 60; $i++) {
      $s = Salud
      if ($s -and ($s.listo -or $s.error)) { break }
      Start-Sleep -Seconds 1
    }
    if (-not $s) { Fallo "Laya no respondió. Reinicia la compu; si sigue igual, manda $Logs\puente.log a tu operador." }
    if ($s.error) { Fallo "Laya arrancó pero el modelo no cargó. Mira $Logs\puente.log y mándaselo a tu operador." }
    if (-not $s.listo) { Write-Host ''; Write-Host '(El modelo termina de cargar en unos segundos.)' }
    if ($modo -eq 'inicio') { Write-Host ''; Write-Host 'Quedó en Inicio de Windows: arranca solo cada vez que entras a tu sesión.' }
    Write-Host ''
    $ok = if ($Emoji) { [char]::ConvertFromUtf32(0x2705) + ' ' } else { '' }
    Write-Host ($ok + 'Laya está corriendo. Vuelve a Inherent OS y recarga.') -ForegroundColor Green

    # 6. El modelo local (opcional). Laya ya quedó corriendo: aquí un fallo solo avisa.
    if ($ModeloLocal) {
      $listo = $false
      try { $listo = Modelo-Local } catch { Write-Host $_.Exception.Message }
      if (-not $listo) { Write-Host ''; Write-Host "El modelo local no quedó, pero Laya sí está corriendo. Mira $LogInstalar y vuelve a correr con -ModeloLocal cuando quieras." -ForegroundColor Yellow }
    }
  } catch {
    Write-Host ''
    $x = if ($Emoji) { [char]::ConvertFromUtf32(0x274C) + ' ' } else { 'ERROR: ' }
    Write-Host ($x + $_.Exception.Message) -ForegroundColor Red
  }
}

Instalar-LayaInherent -Quitar:$Desinstalar -ModeloLocal:$ModeloLocal -SoloModeloLocal:$SoloModeloLocal
