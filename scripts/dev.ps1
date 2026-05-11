# scripts/dev.ps1
#
# Comandi di sviluppo per MoneyBuddy.
# Uso: .\scripts\dev.ps1 <comando>
# Es.: .\scripts\dev.ps1 up

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

$ComposeFile = "infra/docker-compose.yml"
$ComposeCmd = "docker compose -f $ComposeFile"

function Show-Help {
    Write-Host "Comandi disponibili:" -ForegroundColor Cyan
    Write-Host "  up         Avvia tutti i servizi in background"
    Write-Host "  down       Ferma e rimuove i container (i dati restano)"
    Write-Host "  restart    Riavvia i container"
    Write-Host "  logs       Mostra i log (Ctrl+C per uscire)"
    Write-Host "  ps         Mostra lo stato dei container"
    Write-Host "  psql       Apre una shell psql dentro Postgres"
    Write-Host "  redis-cli  Apre una shell Redis"
    Write-Host "  clean      ATTENZIONE: ferma tutto e cancella i volumi"
}

switch ($Command) {
    "up"        { Invoke-Expression "$ComposeCmd up -d" }
    "down"      { Invoke-Expression "$ComposeCmd down" }
    "restart"   { Invoke-Expression "$ComposeCmd restart" }
    "logs"      { Invoke-Expression "$ComposeCmd logs -f" }
    "ps"        { Invoke-Expression "$ComposeCmd ps" }
    "psql"      { Invoke-Expression "$ComposeCmd exec postgres psql -U moneybuddy -d moneybuddy" }
    "redis-cli" { Invoke-Expression "$ComposeCmd exec redis redis-cli" }
    "clean"     {
        Write-Host "Stai per cancellare TUTTI i dati. Sei sicuro? (digita 'si')" -ForegroundColor Red
        $confirm = Read-Host
        if ($confirm -eq "si") {
            Invoke-Expression "$ComposeCmd down -v"
        } else {
            Write-Host "Annullato." -ForegroundColor Yellow
        }
    }
    default     { Show-Help }
}
