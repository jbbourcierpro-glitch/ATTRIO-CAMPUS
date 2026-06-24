$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$WorkspaceRoot = Split-Path -Parent $ProjectRoot
$OutputExe = Join-Path $WorkspaceRoot 'ATTRIO CAMPUS.exe'
$IconPath = Join-Path $ProjectRoot 'launchers\ATTRIO CAMPUS.ico'
$BatchPath = Join-Path $WorkspaceRoot 'Lancer ATTRIO CAMPUS.bat'
$TempSource = Join-Path $env:TEMP 'attrio-campus-launcher.cs'

if (-not (Test-Path $IconPath)) {
    throw "Icône introuvable : $IconPath"
}

if (-not (Test-Path $BatchPath)) {
    throw "Lanceur batch introuvable : $BatchPath"
}

$FrameworkRoots = @(
    "$env:WINDIR\Microsoft.NET\Framework64",
    "$env:WINDIR\Microsoft.NET\Framework"
)

$CscPath = $null

foreach ($root in $FrameworkRoots) {
    if (-not (Test-Path $root)) {
        continue
    }

    $candidate = Get-ChildItem -Path $root -Recurse -Filter csc.exe -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1

    if ($candidate) {
        $CscPath = $candidate.FullName
        break
    }
}

if (-not $CscPath) {
    throw "Impossible de trouver csc.exe sur cette machine Windows."
}

$Source = @"
using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        var root = AppDomain.CurrentDomain.BaseDirectory;
        var batchPath = Path.Combine(root, "Lancer ATTRIO CAMPUS.bat");

        if (!File.Exists(batchPath))
        {
            MessageBox.Show(
                "Le fichier 'Lancer ATTRIO CAMPUS.bat' est introuvable à côté du lanceur.",
                "ATTRIO CAMPUS",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            return;
        }

        var process = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = "/c start \"ATTRIO CAMPUS\" \"" + batchPath + "\"",
            WorkingDirectory = root,
            UseShellExecute = true,
            WindowStyle = ProcessWindowStyle.Normal,
        };

        Process.Start(process);
    }
}
"@

Set-Content -Path $TempSource -Value $Source -Encoding UTF8

& $CscPath /nologo /target:winexe /win32icon:"$IconPath" /out:"$OutputExe" "$TempSource"

if ($LASTEXITCODE -ne 0) {
    throw "La compilation du lanceur Windows a échoué."
}

Write-Host "EXE généré :" $OutputExe
