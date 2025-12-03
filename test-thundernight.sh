#!/bin/bash
# Thundernight Test Başlatıcı Scripti
# HackerOne: thundernight21
# Bugcrowd: Thundernigth1
# DevPost: Thundernight1

echo "🎯 Thundernight Bug Bounty Test Sistemi"
echo "========================================="
echo "Hesaplar:"
echo "- HackerOne: thundernight21"
echo "- Bugcrowd: Thundernigth1" 
echo "- DevPost: Thundernight1"
echo ""

# API Anahtarları kontrolü
if [ ! -f ".env.thundernight" ]; then
    echo "❌ .env.thundernight dosyası bulunamadı!"
    exit 1
fi

# Ortam değişkenlerini yükle
export $(cat .env.thundernight | grep -v '^#' | xargs)

# API Anahtarları dolu mu kontrol et
if [ "$HACKERONE_API_KEY" = "hack_thundernight21_api_key_here" ]; then
    echo "❌ HackerOne API anahtarı girilmemiş!"
    echo "Lütfen .env.thundernight dosyasındaki API anahtarlarını doldur:"
    echo "- HACKERONE_API_KEY: thundernight21 hesabının API anahtarı"
    echo "- BUGCROWD_API_KEY: Thundernigth1 hesabının API anahtarı"
    echo "- BUGCROWD_EMAIL: Thundernigth1 email adresi"
    echo "- DEVPOST_API_KEY: Thundernight1 hesabının API anahtarı"
    exit 1
fi

echo "✅ API Anahtarları kontrol edildi"
echo "🚀 Test başlatılıyor..."

# Build al
npm run build

# Testi çalıştır
echo "📊 Platform testleri başlatılıyor..."
DOTENV_CONFIG_PATH=.env.thundernight node -r dotenv/config dist/testing/bug-bounty-tester.js

# Sonuçları göster
echo ""
echo "📈 Test Sonuçları:"
echo "==================="
if [ -f "test-results/bug-bounty-test-report.txt" ]; then
    cat test-results/bug-bounty-test-report.txt
else
    echo "Test sonuç dosyası bulunamadı!"
fi

# Gelir raporu
echo ""
echo "💰 Gelir Raporu:"
echo "================="
if [ -f "test-results/revenue-report.json" ]; then
    node -e "
    const report = require('./test-results/revenue-report.json');
    console.log('Toplam Potansiyel Gelir: $' + report.totalPotentialRevenue);
    console.log('Bulunan Zafiyetler: ' + report.findingsFound);
    console.log('Gönderilen Raporlar: ' + report.reportsSubmitted);
    console.log('Kazanılan Ödüller: $' + report.earnedBounties);
    "
fi

echo ""
echo "✅ Test tamamlandı!"