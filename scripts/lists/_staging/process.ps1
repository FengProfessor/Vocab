$nawl = Get-Content -Path "nawl-academic.raw.txt" -Raw
$collocations = Get-Content -Path "academic-collocations.raw.txt" -Raw
$combined = $nawl.Split(',') + $collocations.Split(',')
$unique = $combined | ForEach-Object { $_.Trim() } | Sort-Object -Unique
$final_list = $unique[0..249] -join ','
$final_list | Out-File -FilePath "pte-list.txt" -Encoding utf8
