Add-Type -AssemblyName System.Drawing

$iconPath = "C:\Users\USUARIO\Desktop\Python-bash\app\python-bash.ico"

$bmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$g.Clear([System.Drawing.Color]::FromArgb(255, 30, 30, 46))

$brushOrange = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 107, 53))
$g.FillRectangle($brushOrange, 36, 36, 184, 184)

$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 14)
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

$g.DrawLine($pen, 84, 108, 116, 140)
$g.DrawLine($pen, 116, 140, 84, 172)
$g.DrawLine($pen, 138, 172, 196, 172)

$g.Dispose()

$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fs = [System.IO.File]::Create($iconPath)
$icon.Save($fs)
$fs.Close()

$batPath = "C:\Users\USUARIO\Desktop\Python-bash\app\python-bash.bat"
$shortcutPath = [Environment]::GetFolderPath("Desktop") + "\python-bash.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = "C:\Users\USUARIO\Desktop\Python-bash\app"
$shortcut.Description = "ED-python/bash - Aprende Python y Bash"
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Save()

Write-Host "Icono creado: $iconPath"
Write-Host "Acceso directo creado en el Escritorio: python-bash.lnk"
