<#
Автосинхронизация репозитория "-3" с GitHub (аналог codex-doma/scripts/autosync.ps1,
без синхронизации истории диалогов Claude Code — это отдельный продуктовый
репозиторий с backend/frontend, а не рабочая папка Codex-сессий).

Каждые $IntervalSeconds секунд:
  1) git pull --rebase --autostash origin $Branch — подтягивает изменения,
     запушенные с другой машины;
  2) если в рабочем дереве появились изменения (свои правки) — коммитит их
     как "Autosave <timestamp>" и пушит.

Работает в фоне (обычно запускается скрытым через Планировщик заданий при
входе в систему). Если возникнет конфликт слияния — скрипт сам продолжить
не сможет, нужно зайти в папку и разрешить конфликт вручную (git status
подскажет, что делать).
#>

param(
    [string]$RepoPath = (Split-Path -Parent $PSScriptRoot),
    [int]$IntervalSeconds = 180,
    [string]$Branch = "main"
)

Set-Location $RepoPath

while ($true) {
    try {
        git pull --rebase --autostash origin $Branch 2>&1 | Out-Null

        git add -A
        $status = git status --porcelain
        if ($status) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            git commit -m "Autosave $timestamp" 2>&1 | Out-Null
            git push origin $Branch 2>&1 | Out-Null
        }
    } catch {
        # Например, нет интернета или временная ошибка сети — попробуем в следующем цикле
    }

    Start-Sleep -Seconds $IntervalSeconds
}
