# Shop-Edoo - configuration reseau pour iPhone (Expo Go)
# Executer en PowerShell ADMINISTRATEUR (clic droit > Executer en tant qu'administrateur)

$ErrorActionPreference = "Stop"

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host ""
Write-Host "=== Shop-Edoo : configuration iPhone / Expo Go ===" -ForegroundColor Cyan
if (-not $isAdmin) {
    Write-Host "[!] Lancez PowerShell en ADMINISTRATEUR pour appliquer toutes les regles." -ForegroundColor Yellow
}
Write-Host ""

# 1. Passer le Wi-Fi en reseau PRIVE
$wifi = Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -eq "Wi-Fi" }
if ($null -ne $wifi) {
    if ($wifi.NetworkCategory -ne "Private") {
        try {
            Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private -ErrorAction Stop
            Write-Host "[OK] Wi-Fi passe en reseau PRIVE (etait: $($wifi.NetworkCategory))" -ForegroundColor Green
        }
        catch {
            Write-Host "[!] Impossible de passer le Wi-Fi en PRIVE : $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "    -> Ouvrez Parametres > Reseau > Wi-Fi > votre reseau > Profil : PRIVE" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "[OK] Wi-Fi deja en reseau PRIVE" -ForegroundColor Green
    }
}
else {
    Write-Host "[!] Carte Wi-Fi introuvable - verifiez que vous etes connecte au Wi-Fi" -ForegroundColor Yellow
}

# 2. Pare-feu Windows - autoriser Node.js et les ports Expo / API
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodePath) {
    $nodePath = "C:\Program Files\nodejs\node.exe"
}

$rules = @(
    @{ Name = "Node.js Shop-Edoo Inbound"; Program = $nodePath },
    @{ Name = "Expo Metro 8081"; Port = 8081 },
    @{ Name = "Expo Metro 8082"; Port = 8082 },
    @{ Name = "Expo Dev 19000"; Port = 19000 },
    @{ Name = "Expo Dev 19001"; Port = 19001 },
    @{ Name = "Shop-Edoo API 5000"; Port = 5000 }
)

foreach ($rule in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "[OK] Regle pare-feu deja presente : $($rule.Name)" -ForegroundColor DarkGray
        continue
    }

    try {
        if ($rule.Program) {
            New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Program $rule.Program -Action Allow -Profile Any -ErrorAction Stop | Out-Null
        }
        else {
            New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol TCP -LocalPort $rule.Port -Action Allow -Profile Any -ErrorAction Stop | Out-Null
        }
        Write-Host "[OK] Regle pare-feu ajoutee : $($rule.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "[!] Echec regle $($rule.Name) : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# 3. Afficher l'IP locale
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -eq "Wi-Fi" -and $_.IPAddress -notlike "169.254*"
}
$ip = $ipAddresses.IPAddress

Write-Host ""
Write-Host "--- Etapes suivantes ---" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verifiez que mobile/.env et mobile/.env.local contiennent :"
Write-Host "   (.env) EXPO_PUBLIC_API_URL=http://${ip}:5000"
Write-Host "   (.env.local) REACT_NATIVE_PACKAGER_HOSTNAME=${ip}"
Write-Host ""
Write-Host "2. Terminal 1 (backend) :"
Write-Host '   cd "..\.." ; npm run dev:backend'
Write-Host ""
Write-Host "3. Terminal 2 (Expo) :"
Write-Host "   cd mobile ; npm start"
Write-Host ""
Write-Host "4. Sur iPhone :"
Write-Host "   - Meme Wi-Fi que le PC"
Write-Host "   - Installer Expo Go (App Store)"
Write-Host "   - Reglages > Expo Go > Reseau local = ACTIVE"
Write-Host "   - Scanner le QR code dans le terminal"
Write-Host ""
Write-Host "5. Si timeout persiste, mode tunnel (compte Expo gratuit) :"
Write-Host "   npx expo login"
Write-Host "   npm run start:tunnel"
Write-Host ""
Write-Host "IP Wi-Fi detectee : $ip" -ForegroundColor Yellow
Write-Host ""
