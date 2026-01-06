# Скрипт для проверки получения изображения по requestId
# Использование: .\test-image-request.ps1 -RequestId "fa6406ea-9c12-4e3c-9b52-f9335700bee1"

param(
    [Parameter(Mandatory=$true)]
    [string]$RequestId
)

$url = "http://localhost:3000/api/get-image"
$body = @{
    requestId = $RequestId
} | ConvertTo-Json

Write-Host "🔍 Запрос изображения по requestId: $RequestId" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ Изображение получено!" -ForegroundColor Green
    Write-Host "URL: $($response.url)" -ForegroundColor Yellow
    Write-Host "RequestId: $($response.requestId)" -ForegroundColor Yellow
    
    # Открываем изображение в браузере
    Start-Process $response.url
} catch {
    Write-Host "❌ Ошибка: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Детали ошибки: $responseBody" -ForegroundColor Red
    }
}



