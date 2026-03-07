# PowerShell Script to Download Offline Assets for PytonCode

$libPath = "C:\Users\user\Documents\antipyton\lib"
$monacoPath = "$libPath\monaco"
$lucidePath = "$libPath\lucide"
$fontsPath = "$libPath\fonts"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path $monacoPath | Out-Null
New-Item -ItemType Directory -Force -Path $lucidePath | Out-Null
New-Item -ItemType Directory -Force -Path $fontsPath | Out-Null

# 1. Download and Extract Monaco Editor
Write-Host "Downloading Monaco Editor v0.44.0..."
$monacoUrl = "https://registry.npmjs.org/monaco-editor/-/monaco-editor-0.44.0.tgz"
$monacoTgz = "$libPath\monaco.tgz"

Invoke-WebRequest -Uri $monacoUrl -OutFile $monacoTgz

Write-Host "Extracting Monaco Editor..."
# Use tar to extract (Windows 10+ includes tar)
tar -xf $monacoTgz -C $monacoPath

# Move the 'package' folder content to 'monaco' root and clean up
# The tgz contains 'package/...'
# We want 'package/min/vs' -> 'lib/monaco/vs'

if (Test-Path "$monacoPath\package\min\vs") {
    Write-Host "Moving Monaco files..."
    Copy-Item -Path "$monacoPath\package\min\vs" -Destination "$monacoPath" -Recurse -Force
    Remove-Item -Path "$monacoPath\package" -Recurse -Force
} else {
    Write-Error "Monaco extraction failed or structure changed."
}
Remove-Item -Path $monacoTgz -Force

# 2. Download Lucide Icons
Write-Host "Downloading Lucide Icons..."
$lucideUrl = "https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js"
Invoke-WebRequest -Uri $lucideUrl -OutFile "$lucidePath\lucide.min.js"

# 3. Download Fonts (Inter and Fira Code)
# Using Google Fonts download links for woff2 is tricky without API key or complex scraping.
# Plan B: Use a reliable CDN direct link for woff2 or similar if available, or just standard ttf/woff.
# For stability, I will use JSDelivr/Unpkg mirror for these fonts.

Write-Host "Downloading Fonts..."

# Inter (Variable or Regular)
$interUrl = "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2" # Latin regular
Invoke-WebRequest -Uri $interUrl -OutFile "$fontsPath\Inter-Regular.woff2"

# Fira Code (Regular)
$firaUrl = "https://fonts.gstatic.com/s/firacode/v22/uU9eCBsR6Z2vbLqJfyLdOSSvg7wwb5S_Vcl_wQ.woff2" # Latin regular
Invoke-WebRequest -Uri $firaUrl -OutFile "$fontsPath\FiraCode-Regular.woff2"

# Create fonts.css
$fontCss = @"
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url('./Inter-Regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Fira Code';
  font-style: normal;
  font-weight: 400;
  src: url('./FiraCode-Regular.woff2') format('woff2');
}
"@
Set-Content -Path "$fontsPath\fonts.css" -Value $fontCss

Write-Host "Downloads Complete!"
