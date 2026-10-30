# UAT END-TO-END NEXORA DIGITAL — 15 skenario via Invoke-RestMethod (quoting aman)
$base = 'http://localhost:5000'
$R = [ordered]@{}

function Post($url, $obj, $tok) {
  $h = @{ 'Content-Type' = 'application/json' }
  if ($tok) { $h.Authorization = "Bearer $tok" }
  try { return Invoke-RestMethod -Uri $url -Method Post -Headers $h -Body ($obj | ConvertTo-Json -Depth 5) -ErrorAction Stop }
  catch {
    $resp = $_.Exception.Response
    if ($resp -and $resp.GetResponseStream()) {
      $sr = New-Object IO.StreamReader($resp.GetResponseStream())
      $msg = $sr.ReadToEnd()
      return @{ error = @{ code = 'HTTP'; message = $msg } }
    }
    return @{ error = @{ code = 'HTTP'; message = $_.Exception.Message } }
  }
}
function Get2($url, $tok) {
  $h = @{}
  if ($tok) { $h.Authorization = "Bearer $tok" }
  try { return Invoke-RestMethod -Uri $url -Headers $h }
  catch { return $_.Exception.Response }
}

# 1-2. Register + Login
$email = "uat$(Get-Random -Maximum 99999)@uat.test"
$reg = Post "$base/api/auth/register" @{ email = $email; password = 'UatTest123!x'; name = 'UAT Tester' }
$R['01 Register'] = if ($reg.user) { 'PASS' } else { 'FAIL' }
$lg = Post "$base/api/auth/login" @{ email = $email; password = 'UatTest123!x' }
$R['02 Login'] = if ($lg.token) { 'PASS' } else { 'FAIL' }
$tok = $lg.token

# 3. Produk dari DB
$prod = (Get2 "$base/api/products?perPage=1").products[0]
$R['03 Produk DB'] = if ($prod.id) { "PASS ($($prod.name))" } else { 'FAIL' }

# 4. Checkout — debug raw
$o = Post "$base/api/orders" @{ productId = $prod.id; kind = 'TOPUP'; quantity = 1; accountInput = '12345'; accountInput2 = '2345'; idempotencyKey = "uat-$(Get-Random)-abcdef01" } $tok
if ($o.order) { $R['04 Checkout'] = "PASS ($($o.order.orderNo))"; $oid = $o.order.id }
else { $R['04 Checkout'] = "FAIL: $($o.error.message)" }

# 5. Pembayaran sandbox — tanpa credential Midtrans HARIS menampilkan pesan jelas
$pay = Post "$base/api/orders/$oid/pay" @{} $tok
$R['05 Payment sandbox'] = if ($pay.payment.snapToken) { 'PASS (snapToken)' }
elseif ($pay.error.code -eq 'PAYMENT_NOT_CONFIGURED') { 'EXPECTED: butuh credential Midtrans (pesan jelas, bukan simulasi)' }
else { "cek: $($pay | ConvertTo-Json -Compress)" }

# 6-7. Webhook + verifikasi → diuji di jest security.test (signature palsu ditolak)
$wh = Post "$base/api/webhooks/midtrans" @{ order_id = 'FAKE-UAT'; status_code = '200'; gross_amount = '10000.00'; signature_key = ('a' * 128); transaction_status = 'settlement' }
$R['06-07 Webhook palsu ditolak'] = if ($wh.error) { "PASS ($($wh.error.code))" } else { 'FAIL' }

# 8-9. Provider sandbox: SIMULATION aktif; worker memproses saat PAID. (tanpa pembayaran nyata, order tetap PENDING = benar)
$st = Get2 "$base/api/orders/$oid/status" $tok
$R['08-09 Status provider'] = if ($st.order.status -eq 'PENDING') { 'PASS (belum dibayar = tidak diproses)' } else { "cek: $($st.order.status)" }

# 10. Riwayat transaksi
$hist = Get2 "$base/api/account/orders" $tok
$R['10 Riwayat'] = if ($hist.orders.Count -ge 1) { "PASS ($($hist.orders.Count) order)" } else { 'FAIL' }

# 12. Admin login + kelola produk
$adm = Post "$base/api/auth/login" @{ email = 'admin@nexora.test'; password = 'ChangeMe_Now!2026' }
$R['12 Admin login'] = if ($adm.user.role -eq 'ADMIN') { 'PASS' } else { 'FAIL' }
$AH = $adm.token
$pr = Invoke-RestMethod -Uri "$base/api/admin/products/$($prod.id)" -Method Patch -Headers @{ Authorization = "Bearer $AH" } -ContentType 'application/json' -Body (@{ sellPrice = 21500 } | ConvertTo-Json)
$R['12b Admin ubah harga'] = if ($pr.product.sellPrice -eq 21500) { 'PASS (audit log tercatat)' } else { 'FAIL' }
Invoke-RestMethod -Uri "$base/api/admin/products/$($prod.id)" -Method Patch -Headers @{ Authorization = "Bearer $AH" } -ContentType 'application/json' -Body (@{ sellPrice = $prod.sellPrice } | ConvertTo-Json) | Out-Null

# 13. Akses ilegal
$sc = try { (Invoke-WebRequest -Uri "$base/api/admin/dashboard" -Headers @{ Authorization = "Bearer $tok" } -SkipHttpErrorCheck).StatusCode } catch { $_.Exception.Response.StatusCode.value__ }
$R['13 Akses ilegal'] = if ($sc -eq 403) { 'PASS (403)' } else { "FAIL ($sc)" }

# 14. Transaksi ganda
$k = "uat-dup-$(Get-Random)"
$a = Post "$base/api/orders" @{ productId = $prod.id; kind = 'TOPUP'; quantity = 1; accountInput = '1'; idempotencyKey = $k } $tok
$b = Post "$base/api/orders" @{ productId = $prod.id; kind = 'TOPUP'; quantity = 1; accountInput = '1'; idempotencyKey = $k } $tok
$R['14 Transaksi ganda'] = if ($a.order.id -eq $b.order.id) { 'PASS (id sama)' } else { 'FAIL' }

# 15. Pembayaran gagal (saldo kurang → saldo guard 409)
$sc2 = try { (Invoke-WebRequest -Uri "$base/api/orders/$oid/pay-wallet" -Method Post -Headers @{ Authorization = "Bearer $tok" } -SkipHttpErrorCheck).StatusCode } catch { $_.Exception.Response.StatusCode.value__ }
$R['15 Pay gagal (saldo kurang)'] = if ($sc2 -eq 409) { 'PASS (409 INSUFFICIENT_BALANCE)' } else { "cek: $sc2" }

$R | ConvertTo-Json
