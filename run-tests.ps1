$preamble = Get-Content test-card.js | Select-Object -First 21
$assertions = Get-Content test-card.js | Select-Object -Skip 21
$implementation = Get-Content weather-solar-card.js
@($preamble; $implementation; $assertions) | node -
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
