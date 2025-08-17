// GitHub Gist API Konfigürasyonu
const GITHUB_TOKEN = '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'; // GitHub Personal Access Token
const GIST_ID = null; // İlk kullanımda null, sonra otomatik doldurulacak

// Gist API fonksiyonları
class GistManager {
    constructor() {
        this.token = GITHUB_TOKEN;
        this.gistId = GIST_ID;
    }

    // Veri kaydetme
    async saveData(data) {
        try {
            const content = JSON.stringify(data, null, 2);
            const filename = 'kizilay-hesaplama-data.json';
            
            if (!this.gistId) {
                // Yeni Gist oluştur
                const response = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        description: 'Kızılay Bayraklı Şube Hesaplama Verileri',
                        public: false,
                        files: {
                            [filename]: {
                                content: content
                            }
                        }
                    })
                });
                
                const result = await response.json();
                this.gistId = result.id;
                localStorage.setItem('gist_id', this.gistId);
                
            } else {
                // Mevcut Gist'i güncelle
                await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        files: {
                            [filename]: {
                                content: content
                            }
                        }
                    })
                });
            }
            
            console.log('Veriler GitHub Gist\'e kaydedildi!');
            return true;
            
        } catch (error) {
            console.error('Gist kaydetme hatası:', error);
            return false;
        }
    }

    // Veri yükleme
    async loadData() {
        try {
            if (!this.gistId) {
                this.gistId = localStorage.getItem('gist_id');
                if (!this.gistId) return null;
            }
            
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                }
            });
            
            const gist = await response.json();
            const filename = 'kizilay-hesaplama-data.json';
            
            if (gist.files && gist.files[filename]) {
                const content = gist.files[filename].content;
                return JSON.parse(content);
            }
            
            return null;
            
        } catch (error) {
            console.error('Gist yükleme hatası:', error);
            return null;
        }
    }
}

// Gist Manager'ı başlat
const gistManager = new GistManager();

class CalculationTable {
    constructor() {
        console.log('CalculationTable constructor başlatıldı');
        
        this.tableBody = document.getElementById('tableBody');
        this.totalScoreElement = document.getElementById('totalScore');
        this.averageSuccessElement = document.getElementById('averageSuccess');
        this.rowCounter = 0;
        
        console.log('tableBody:', this.tableBody);
        console.log('totalScoreElement:', this.totalScoreElement);
        console.log('averageSuccessElement:', this.averageSuccessElement);
        
        this.initializeEventListeners();
        
        // Veri yükleme işlemi
        this.loadData().catch(error => {
            console.error('Veri yükleme hatası:', error);
            this.loadSampleData();
        });
        
        console.log('CalculationTable constructor tamamlandı');
    }

    initializeEventListeners() {
        const addRowBtn = document.getElementById('addRow');
        const saveDataBtn = document.getElementById('saveData');
        const exportPDFBtn = document.getElementById('exportPDF');
        
        if (addRowBtn) {
            addRowBtn.addEventListener('click', () => this.addRow());
            console.log('addRow event listener eklendi');
        }
        
        if (saveDataBtn) {
            saveDataBtn.addEventListener('click', () => {
                console.log('Kaydet butonuna tıklandı');
                this.saveData();
            });
            console.log('saveData event listener eklendi');
        }
        
        if (exportPDFBtn) {
            exportPDFBtn.addEventListener('click', () => this.exportToPDF());
            console.log('exportPDF event listener eklendi');
        }
    }

    addRow(criteria = '', target = '', achievement = '') {
        this.rowCounter++;
        const row = document.createElement('tr');
        row.id = `row-${this.rowCounter}`;
        
        row.innerHTML = `
            <td>
                <input type="text" class="criteria-input" placeholder="Kriter adı" value="${criteria}">
            </td>
            <td>
                <input type="number" class="target-input" placeholder="Hedef" step="0.01" value="${target}">
            </td>
            <td>
                <input type="number" class="achievement-input" placeholder="Gerçekleştirme" step="0.01" value="${achievement}">
            </td>
            <td class="percentage-cell percentage-neutral">
                <div class="percentage">%0.00</div>
                <div class="score-value">0.00</div>
            </td>
            <td>
                <button class="delete-btn" onclick="table.deleteRow(${this.rowCounter})">Sil</button>
            </td>
        `;

        this.tableBody.appendChild(row);
        this.attachRowEventListeners(row);
        this.calculateAll();
    }

    attachRowEventListeners(row) {
        const targetInput = row.querySelector('.target-input');
        const achievementInput = row.querySelector('.achievement-input');
        const criteriaInput = row.querySelector('.criteria-input');

        [targetInput, achievementInput, criteriaInput].forEach(input => {
            input.addEventListener('input', () => this.calculateRow(row));
        });
    }

    calculateRow(row) {
        const target = parseFloat(row.querySelector('.target-input').value) || 0;
        const achievement = parseFloat(row.querySelector('.achievement-input').value) || 0;
        const percentageCell = row.querySelector('.percentage-cell');
        const percentageDiv = row.querySelector('.percentage');
        const scoreDiv = row.querySelector('.score-value');

        let percentage = 0;
        if (target > 0) {
            percentage = (achievement / target) * 100;
        }

        // Puan hesaplama (örnek: %100 = 10 puan)
        const score = Math.min(percentage / 10, 25); // Maksimum 25 puan

        // Renk sınıflarını güncelle
        percentageCell.className = 'percentage-cell';
        if (percentage >= 100) {
            percentageCell.classList.add('percentage-positive');
        } else if (percentage > 0) {
            percentageCell.classList.add('percentage-neutral');
        } else {
            percentageCell.classList.add('percentage-negative');
        }

        percentageDiv.textContent = `%${percentage.toFixed(2)}`;
        scoreDiv.textContent = score.toFixed(2);
    }

    calculateAll() {
        const rows = this.tableBody.querySelectorAll('tr');
        let totalScore = 0;
        let totalPercentage = 0;
        let validRows = 0;

        rows.forEach(row => {
            this.calculateRow(row);
            const score = parseFloat(row.querySelector('.score-value').textContent) || 0;
            const percentage = parseFloat(row.querySelector('.percentage').textContent.replace('%', '')) || 0;
            
            totalScore += score;
            totalPercentage += percentage;
            validRows++;
        });

        const averagePercentage = validRows > 0 ? totalPercentage / validRows : 0;

        this.totalScoreElement.textContent = totalScore.toFixed(2);
        this.averageSuccessElement.textContent = `${averagePercentage.toFixed(2)}%`;
        
        // İstatistikleri güncelle
        this.updateStatistics(totalScore, averagePercentage);
    }

    deleteRow(rowId) {
        const row = document.getElementById(`row-${rowId}`);
        if (row) {
            row.remove();
            this.calculateAll();
        }
    }

    updateStatistics(totalScore, averagePercentage) {
        // Net Puan (toplam puanın %80'i + ortalama başarının %20'si)
        const netScore = (totalScore * 0.8) + (averagePercentage * 0.2);
        
        // Gauge fill yüzdesini hesapla (maksimum 100 için)
        const gaugePercentage = Math.min((netScore / 100) * 100, 100);
        
        // Net puan değerlerini güncelle
        const netScoreElement = document.getElementById('netScore');
        const gaugeFillElement = document.getElementById('gaugeFill');
        
        if (netScoreElement) {
            netScoreElement.textContent = netScore.toFixed(2);
        }
        
        if (gaugeFillElement) {
            gaugeFillElement.style.height = `${gaugePercentage}%`;
        }
        
        // Gönüllü Yapı Puanı (toplam puanın %30'u)
        const volunteerScore = totalScore * 0.3;
        const volunteerElement = document.getElementById('volunteerScore');
        if (volunteerElement) {
            volunteerElement.textContent = volunteerScore.toFixed(2);
        }
        
        // Hizmet Kuruluşu Puanı (toplam puanın %70'i)
        const serviceScore = totalScore * 0.7;
        const serviceElement = document.getElementById('serviceScore');
        if (serviceElement) {
            serviceElement.textContent = serviceScore.toFixed(2);
        }
        
        // İstatistik grid değerlerini güncelle
        const statsTotalScoreElement = document.getElementById('statsTotalScore');
        if (statsTotalScoreElement) {
            statsTotalScoreElement.textContent = totalScore.toFixed(2);
        }
        
        // İl, İlçe, Temsilcilik değerleri (örnek hesaplamalar)
        const provinceWeight = (totalScore / 100) * 25; // Örnek hesaplama
        const provinceAchievement = (averagePercentage / 100) * 100;
        const districtAverage = (totalScore + averagePercentage) / 2;
        const districtWeight = (totalScore / 100) * 20;
        const districtAchieved = (averagePercentage / 100) * 80;
        const representationAverage = (totalScore + averagePercentage + netScore) / 3;
        const representationWeight = (totalScore / 100) * 15;
        const representationAchieved = (averagePercentage / 100) * 60;
        
        // İl değerleri
        const provinceWeightElement = document.getElementById('provinceWeight');
        const provinceAchievementElement = document.getElementById('provinceAchievement');
        if (provinceWeightElement) provinceWeightElement.textContent = provinceWeight.toFixed(2);
        if (provinceAchievementElement) provinceAchievementElement.textContent = provinceAchievement.toFixed(2);
        
        // İlçe değerleri
        const districtAverageElement = document.getElementById('districtAverage');
        const districtWeightElement = document.getElementById('districtWeight');
        const districtAchievedElement = document.getElementById('districtAchieved');
        if (districtAverageElement) districtAverageElement.textContent = districtAverage.toFixed(2);
        if (districtWeightElement) districtWeightElement.textContent = districtWeight.toFixed(2);
        if (districtAchievedElement) districtAchievedElement.textContent = districtAchieved.toFixed(2);
        
        // Temsilcilik değerleri
        const representationAverageElement = document.getElementById('representationAverage');
        const representationWeightElement = document.getElementById('representationWeight');
        const representationAchievedElement = document.getElementById('representationAchieved');
        if (representationAverageElement) representationAverageElement.textContent = representationAverage.toFixed(2);
        if (representationWeightElement) representationWeightElement.textContent = representationWeight.toFixed(2);
        if (representationAchievedElement) representationAchievedElement.textContent = representationAchieved.toFixed(2);
        
        // Gerçekleşme Puanı (net puanın %90'ı)
        const achievementScore = netScore * 0.9;
        const achievementElement = document.getElementById('achievementScore');
        if (achievementElement) {
            achievementElement.textContent = achievementScore.toFixed(2);
        }
    }

    async saveData() {
        console.log('saveData fonksiyonu çağrıldı');
        
        try {
            const data = this.getTableData();
            console.log('Alınan veri:', data);
            
            // Boş satırları filtrele
            const filteredData = data.filter(row => 
                row.criteria.trim() !== '' || 
                row.target.trim() !== '' || 
                row.achievement.trim() !== ''
            );
            
            console.log('Filtrelenmiş veri:', filteredData);
            
            if (filteredData.length === 0) {
                this.showNotification('Kaydedilecek veri bulunamadı!', 'error');
                return;
            }
            
            // Önce localStorage'a kaydet
            try {
                localStorage.setItem('calculationTableData', JSON.stringify(filteredData));
                console.log('Veri localStorage\'a kaydedildi');
            } catch (localStorageError) {
                console.log('localStorage hatası:', localStorageError);
            }
            
            // GitHub Gist'e kaydetme
            if (GITHUB_TOKEN !== 'BURAYA_TOKEN_GELECEK') {
                const success = await gistManager.saveData(filteredData);
                
                if (success) {
                    this.showNotification('Veriler kaydedildi ve senkronize edildi!', 'success');
                } else {
                    this.showNotification('Veriler sadece yerel olarak kaydedildi.', 'warning');
                }
            } else {
                this.showNotification('Veriler yerel olarak kaydedildi. GitHub senkronizasyonu için token ekleyin.', 'info');
            }
            
        } catch (error) {
            console.error('Veri kaydetme hatası:', error);
            this.showNotification('Veri kaydedilirken hata oluştu!', 'error');
        }
    }

    saveDataAsFile(data) {
        const BOM = '\uFEFF';
        let csvContent = BOM;
        
        // Başlık satırı
        csvContent += "KRİTERLER,HEDEF,GERÇEKLEŞMELER\n";
        
        // Veri satırları
        data.forEach(row => {
            const escapedCriteria = row.criteria.replace(/"/g, '""');
            csvContent += `"${escapedCriteria}","${row.target}","${row.achievement}"\n`;
        });

        // Dosya indir
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "kizilay_kayitli_veriler.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        this.showNotification('Veriler dosya olarak indirildi!', 'success');
    }

    async loadData() {
        try {
            console.log('loadData fonksiyonu çağrıldı');
            
            // Önce GitHub Gist'ten yükle
            if (GITHUB_TOKEN !== 'BURAYA_TOKEN_GELECEK') {
                const gistData = await gistManager.loadData();
                
                if (gistData) {
                    this.loadTableData(gistData);
                    this.showNotification('Veriler GitHub\'dan yüklendi!', 'success');
                    return;
                }
            }
            
            // Gist'ten yüklenemezse localStorage'dan yükle
            const savedData = localStorage.getItem('calculationTableData');
            console.log('localStorage\'dan alınan veri:', savedData);
            
            if (savedData) {
                const data = JSON.parse(savedData);
                console.log('Parse edilen veri:', data);
                
                if (Array.isArray(data) && data.length > 0) {
                    this.loadTableData(data);
                    this.showNotification('Veriler yerel olarak yüklendi.', 'info');
                } else {
                    this.loadSampleData();
                    this.showNotification('Örnek veriler yüklendi.', 'info');
                }
            } else {
                this.loadSampleData();
                this.showNotification('Örnek veriler yüklendi.', 'info');
            }
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            this.showNotification('Veri yüklenirken hata oluştu!', 'error');
        }
    }

    getTableData() {
        const rows = this.tableBody.querySelectorAll('tr');
        const data = [];

        rows.forEach(row => {
            data.push({
                criteria: row.querySelector('.criteria-input').value,
                target: row.querySelector('.target-input').value,
                achievement: row.querySelector('.achievement-input').value
            });
        });

        return data;
    }

    loadTableData(data) {
        this.tableBody.innerHTML = '';
        this.rowCounter = 0;

        data.forEach(rowData => {
            this.addRow(rowData.criteria, rowData.target, rowData.achievement);
        });
    }

    loadSampleData() {
        const sampleData = [
            { criteria: 'ŞARTSIZ NAKDİ BAĞIŞ', target: '110994', achievement: '116149' },
            { criteria: 'ŞARTLI NAKDİ BAĞIŞ', target: '402509', achievement: '684109' },
            { criteria: 'AYNİ BAĞIŞ', target: '1191436', achievement: '1650550' },
            { criteria: 'GAYRİMENKUL BAĞIŞI', target: '688473', achievement: '0' },
            { criteria: 'SANAL BÜTÇE', target: '19000', achievement: '0' },
            { criteria: 'SOSYAL İNCELEME', target: '19', achievement: '315' },
            { criteria: 'ŞUBE KAY. NAKDİ YARDML', target: '193480', achievement: '488200' },
            { criteria: 'ŞUBE KAY. AYNİ YARDMLAR', target: '503934', achievement: '1839617' },
            { criteria: 'GÖREV SAYISI', target: '10', achievement: '102' },
            { criteria: 'YENİ GÖNÜLLÜ SAYISI', target: '20', achievement: '213' }
        ];

        this.loadTableData(sampleData);
    }

    exportToPDF() {
        // Doğrudan HTML raporu oluştur
        this.createSimplePDF();
    }

    createSimplePDF() {
        try {
            // Tablo verilerini topla
            const tableData = [];
            const rows = this.tableBody.querySelectorAll('tr');
            
            rows.forEach(row => {
                const criteria = row.querySelector('.criteria-input').value;
                const target = row.querySelector('.target-input').value;
                const achievement = row.querySelector('.achievement-input').value;
                const percentage = row.querySelector('.percentage').textContent;
                const score = row.querySelector('.score-value').textContent;
                
                if (criteria.trim() !== '') {
                    tableData.push({
                        criteria: criteria,
                        target: target,
                        achievement: achievement,
                        percentage: percentage,
                        score: score
                    });
                }
            });

            // Gelişmiş HTML raporu oluştur
            let htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Kızılay Hesaplama Raporu</title>
                    <style>
                        * { box-sizing: border-box; }
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            margin: 0; padding: 20px; background: #f5f5f5;
                            line-height: 1.6;
                        }
                        .report-container {
                            max-width: 1200px; margin: 0 auto; background: white;
                            padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                        }
                        .header {
                            text-align: center; margin-bottom: 30px; padding-bottom: 20px;
                            border-bottom: 3px solid #dc3545;
                        }
                                                 h1 { 
                             color: #dc3545; margin: 0; font-size: 28px; font-weight: bold;
                             text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                         }
                         .date { 
                             color: #666; font-size: 16px; margin-top: 10px;
                             font-style: italic;
                         }
                        .summary { 
                            background: linear-gradient(135deg, #dc3545, #c82333);
                            color: white; padding: 20px; border-radius: 8px;
                            margin: 20px 0; box-shadow: 0 3px 10px rgba(220, 53, 69, 0.3);
                        }
                                                 .summary h3 { margin: 0 0 15px 0; font-size: 20px; }
                         .summary-grid {
                             display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
                         }
                         .summary-item {
                             background: rgba(255,255,255,0.1); padding: 15px;
                             border-radius: 5px; text-align: center;
                         }
                         .summary-item strong { font-size: 18px; }
                        table { 
                            width: 100%; border-collapse: collapse; margin: 20px 0;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        th, td { 
                            border: 1px solid #ddd; padding: 12px; text-align: left;
                            vertical-align: middle;
                        }
                        th { 
                            background: linear-gradient(135deg, #dc3545, #c82333);
                            color: white; font-weight: bold; font-size: 14px;
                        }
                        tr:nth-child(even) { background-color: #f8f9fa; }
                        tr:hover { background-color: #e9ecef; }
                        .footer {
                            text-align: center; margin-top: 30px; padding-top: 20px;
                            border-top: 1px solid #ddd; color: #666; font-size: 14px;
                        }
                        .print-btn { 
                            position: fixed; top: 20px; right: 20px; 
                            background: linear-gradient(135deg, #dc3545, #c82333);
                            color: white; border: none; padding: 12px 24px;
                            border-radius: 25px; cursor: pointer; font-size: 14px;
                            font-weight: bold; box-shadow: 0 3px 10px rgba(220, 53, 69, 0.3);
                            transition: all 0.3s ease;
                        }
                        .print-btn:hover { 
                            transform: translateY(-2px); box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4);
                        }
                        .print-btn:active { transform: translateY(0); }
                                                                          @media print { 
                             body { background: white; margin: 0; padding: 10px; }
                             .print-btn { display: none; }
                             .report-container { box-shadow: none; padding: 15px; }
                             .header { margin-bottom: 15px; padding-bottom: 10px; }
                             .summary { margin: 10px 0; padding: 15px; }
                             table { margin: 10px 0; }
                             th, td { padding: 6px; font-size: 11px; }
                             h1 { font-size: 20px; }
                             .summary-item { padding: 10px; }
                             
                             .footer { margin-top: 15px; padding-top: 10px; }
                         }
                        @media (max-width: 768px) {
                            .summary-grid { grid-template-columns: 1fr; }
                            th, td { padding: 8px; font-size: 12px; }
                        }
                    </style>
                </head>
                <body>
                    <button class="print-btn" onclick="window.print()">📄 PDF Olarak Yazdır</button>
                    <div class="report-container">
                                                 <div class="header">
                             <h1>Kızılay Bayraklı Şube Hesaplama Raporu</h1>
                             <div class="date">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
                         </div>
                         
                         <table>
                            <thead>
                                <tr>
                                    <th>KRİTERLER</th>
                                    <th>HEDEF</th>
                                    <th>GERÇEKLEŞMELER</th>
                                    <th>YÜZDE</th>
                                    <th>PUAN</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            tableData.forEach(row => {
                // Yüzde değerini sayıya çevir
                const percentageValue = parseFloat(row.percentage.replace('%', ''));
                const percentageColor = percentageValue >= 100 ? '#28a745' : '#dc3545'; // 100+ ise yeşil, değilse kırmızı
                
                htmlContent += `
                    <tr>
                        <td><strong>${row.criteria}</strong></td>
                        <td>${row.target}</td>
                        <td>${row.achievement}</td>
                        <td><span style="color: ${percentageColor}; font-weight: bold;">${row.percentage}</span></td>
                        <td><span style="color: #28a745; font-weight: bold;">${row.score}</span></td>
                    </tr>
                `;
            });

                         htmlContent += `
                             </tbody>
                         </table>
                         
                         <!-- Özet Bilgiler Bölümü -->
                         <div class="summary">
                             <h3>📊 Özet Bilgiler</h3>
                             <div class="summary-grid">
                                 <div class="summary-item">
                                     <strong>Toplam Puan</strong><br>
                                     <span style="font-size: 24px;">${this.totalScoreElement.textContent}</span>
                                 </div>
                                 <div class="summary-item">
                                     <strong>Ortalama Başarı</strong><br>
                                     <span style="font-size: 24px;">${this.averageSuccessElement.textContent}</span>
                                 </div>
                             </div>
                         </div>
                         

                         
                         <div class="footer">
                             <p>📋 Bu rapor Kızılay Bayraklı Şube Hesaplama Sistemi tarafından oluşturulmuştur.</p>
                         </div>
                     </div>
                 </body>
                 </html>
             `;

            // HTML'i yeni pencerede aç
            const newWindow = window.open('', '_blank', 'width=1200,height=800');
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            
            // Pencereyi odakla
            setTimeout(() => {
                if (newWindow && !newWindow.closed) {
                    newWindow.focus();
                    this.showNotification('🎉 Rapor başarıyla açıldı! PDF için "📄 PDF Olarak Yazdır" butonuna tıklayın.', 'success');
                }
            }, 500);
            
        } catch (error) {
            console.error('HTML rapor oluşturma hatası:', error);
            this.showNotification('❌ Rapor oluşturulamadı!', 'error');
        }
    }

    showNotification(message, type) {
        // Mevcut bildirimleri temizle
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Stil ekle
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;

        if (type === 'success') {
            notification.style.background = '#28a745';
        } else if (type === 'error') {
            notification.style.background = '#dc3545';
        } else if (type === 'info') {
            notification.style.background = '#17a2b8';
        }

        document.body.appendChild(notification);

        // 3 saniye sonra kaldır
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// CSS animasyonları için stil ekle
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Uygulamayı başlat
const table = new CalculationTable();
