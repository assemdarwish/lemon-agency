# Prepares any piece of work for the site and prints the line to paste into content.js.
#
#   .\optimize-media.ps1 social  "D:\designs\nice post.png"     nice-post-1
#   .\optimize-media.ps1 print   "D:\designs\andrea menu.jpg"   andrea-menu
#   .\optimize-media.ps1 gifs    "D:\designs\sticker.gif"       sticker-1
#   .\optimize-media.ps1 ai      "D:\WORK\Behance\new ad.mp4"   new-ad
#   .\optimize-media.ps1 editing "D:\WORK\reel.mp4"             brand-reel-1
param(
  [Parameter(Mandatory)][ValidateSet('social','print','gifs','ai','editing')][string]$Type,
  [Parameter(Mandatory)][string]$Source,
  [Parameter(Mandatory)][string]$Id
)
$ErrorActionPreference = 'Stop'
$ff = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if (-not $ff) { $ff = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter ffmpeg.exe | Select-Object -First 1 -ExpandProperty FullName }
$ffprobe = Join-Path (Split-Path $ff) 'ffprobe.exe'
$root = Join-Path $PSScriptRoot "assets\media\$Type"
function Dur($f) { $d = [double](& $ffprobe -v error -show_entries format=duration -of csv=p=0 $f); '{0}:{1:00}' -f [math]::Floor($d / 60), [math]::Floor($d % 60) }
function Size($f) { (& $ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 $f) -split ',' }

switch ($Type) {
  { $_ -in 'social','print' } {
    New-Item -ItemType Directory -Force "$root\thumb" | Out-Null
    & $ff -y -v error -i $Source -vf "scale='min(1600,iw)':-2" -frames:v 1 -c:v libwebp -quality 86 "$root\$Id.webp"
    & $ff -y -v error -i $Source -vf "scale='min(560,iw)':-2" -frames:v 1 -c:v libwebp -quality 80 "$root\thumb\$Id.webp"
    "Paste into $($Type.ToUpper()) in content.js:"
    "  { id:'$Id', client:'CLIENT', title:{en:'TITLE', ar:'ARABIC TITLE'} },"
  }
  'gifs' {
    New-Item -ItemType Directory -Force $root | Out-Null
    & $ff -y -v error -i $Source -vf "scale='min(720,iw)':-2:flags=lanczos,fps=30,pad=ceil(iw/2)*2:ceil(ih/2)*2" -an -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart "$root\$Id.mp4"
    & $ff -y -v error -i "$root\$Id.mp4" -frames:v 1 -q:v 4 "$root\$Id.jpg"
    $w, $h = Size "$root\$Id.mp4"
    $size = if ([int]$w -gt [int]$h * 1.4) { 'w' } elseif ([int]$h -gt [int]$w * 1.4) { 't' } else { 's' }
    "Paste into GIFS in content.js:"
    "  { id:'$Id', size:'$size' },"
  }
  { $_ -in 'ai','editing' } {
    foreach ($d in 'full','preview','poster') { New-Item -ItemType Directory -Force "$root\$d" | Out-Null }
    $w, $h = Size $Source
    $vertical = [int]$h -ge [int]$w
    $fullScale = if ($vertical) { 'scale=-2:960' } else { 'scale=1280:-2' }
    $prevScale = if ($vertical) { 'scale=-2:480' } else { 'scale=640:-2' }
    & $ff -y -v error -i $Source -vf $fullScale -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart "$root\full\$Id.mp4"
    & $ff -y -v error -ss 0.5 -t 4 -i $Source -vf "$prevScale,fps=24" -an -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart "$root\preview\$Id.mp4"
    & $ff -y -v error -ss 1 -i $Source -frames:v 1 -vf $prevScale -q:v 4 "$root\poster\$Id.jpg"
    $dur = Dur "$root\full\$Id.mp4"
    $ratio = if ($vertical) { '9:16' } else { '16:9' }
    if ($Type -eq 'ai') {
      "Paste into AI_VIDEOS in content.js:"
      "  { id:'$Id', dur:'$dur', brand:'BRAND', title:{en:'TITLE', ar:'ARABIC TITLE'} },"
    } else {
      "Add to a project's videos list in EDITING in content.js:"
      "  { id:'$Id', dur:'$dur', ratio:'$ratio' },"
    }
  }
}
