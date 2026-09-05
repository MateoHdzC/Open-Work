# OpenWork Official Windows Icon Generator
Add-Type -AssemblyName System.Drawing

$assetsDir = Join-Path $PSScriptRoot "..\assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Clear background (transparent)
$gfx.Clear([System.Drawing.Color]::Transparent)

# Background rounded square (electric dark blue gradient)
$rect = New-Object System.Drawing.Rectangle(12, 12, 232, 232)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 30, 41, 59),
    [System.Drawing.Color]::FromArgb(255, 15, 23, 42),
    45.0
)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$arcRadius = 54
$path.AddArc(12, 12, $arcRadius, $arcRadius, 180, 90)
$path.AddArc(244 - $arcRadius, 12, $arcRadius, $arcRadius, 270, 90)
$path.AddArc(244 - $arcRadius, 244 - $arcRadius, $arcRadius, $arcRadius, 0, 90)
$path.AddArc(12, 244 - $arcRadius, $arcRadius, $arcRadius, 90, 90)
$path.CloseFigure()

$gfx.FillPath($brush, $path)

# Border glow
$glowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 59, 130, 246), 4)
$gfx.DrawPath($glowPen, $path)

# Inner Core: Glowing Circuit / Diamond
$coreRect = New-Object System.Drawing.Rectangle(56, 56, 144, 144)
$coreBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $coreRect,
    [System.Drawing.Color]::FromArgb(255, 59, 130, 246),
    [System.Drawing.Color]::FromArgb(255, 147, 51, 234),
    90.0
)

# Hexagonal core symbol
$hexPoints = @(
    (New-Object System.Drawing.Point(128, 56)),
    (New-Object System.Drawing.Point(196, 96)),
    (New-Object System.Drawing.Point(196, 160)),
    (New-Object System.Drawing.Point(128, 200)),
    (New-Object System.Drawing.Point(60, 160)),
    (New-Object System.Drawing.Point(60, 96))
)
$gfx.FillPolygon($coreBrush, $hexPoints)

# Inner eye / aperture
$centerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
$gfx.FillEllipse($centerBrush, 100, 100, 56, 56)

$sparkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$gfx.FillEllipse($sparkBrush, 116, 116, 24, 24)

# Save PNG
$pngPath = Join-Path $assetsDir "icon.png"
$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Save ICO
$icoPath = Join-Path $assetsDir "icon.ico"
$iconHandle = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$fileStream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$icon.Save($fileStream)
$fileStream.Close()
$icon.Dispose()

$gfx.Dispose()
$bmp.Dispose()

Write-Host "Icons generated successfully:"
Write-Host "  PNG: $pngPath"
Write-Host "  ICO: $icoPath"
