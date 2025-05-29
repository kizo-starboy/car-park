// Simple PDF generation utility using browser's print functionality
export const generateReportPDF = (report, reportData) => {
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatCurrency = (amount) => `${amount.toLocaleString()} RWF`;

  const isDaily = report.reportType === 'daily';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${isDaily ? 'Daily' : 'Monthly'} Parking Report</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.4;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #333; 
          padding-bottom: 20px; 
        }
        .logo { 
          font-size: 24px; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 10px;
        }
        .report-title { 
          font-size: 20px; 
          margin: 10px 0; 
        }
        .report-period { 
          color: #666; 
          font-size: 14px;
        }
        .summary { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 20px; 
          margin: 30px 0; 
        }
        .summary-card { 
          border: 1px solid #ddd; 
          padding: 15px; 
          border-radius: 8px; 
          text-align: center;
        }
        .summary-card h3 { 
          margin: 0 0 10px 0; 
          color: #333; 
          font-size: 14px;
        }
        .summary-card .value { 
          font-size: 24px; 
          font-weight: bold; 
          color: #2563eb; 
        }
        .section { 
          margin: 30px 0; 
        }
        .section h2 { 
          border-bottom: 1px solid #ddd; 
          padding-bottom: 10px; 
          font-size: 18px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left; 
          font-size: 12px;
        }
        th { 
          background-color: #f5f5f5; 
          font-weight: bold;
        }
        .signature-section { 
          margin-top: 50px; 
          display: flex; 
          justify-content: space-between; 
        }
        .signature-box { 
          border: 1px solid #333; 
          padding: 20px; 
          width: 200px; 
          text-align: center; 
          font-size: 12px;
        }
        .signature-image { 
          max-width: 150px; 
          max-height: 50px; 
        }
        .footer { 
          margin-top: 50px; 
          text-align: center; 
          color: #666; 
          font-size: 10px; 
        }
        .print-button {
          background: #2563eb;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin: 20px;
          font-size: 14px;
        }
        .print-button:hover {
          background: #1d4ed8;
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button class="print-button" onclick="window.print()">🖨️ Print Report</button>
        <button class="print-button" onclick="window.close()">❌ Close</button>
      </div>

      <div class="header">
        <div class="logo">Park-kizo Parking Management</div>
        <div class="report-title">${isDaily ? 'Daily' : 'Monthly'} Activity Report</div>
        <div class="report-period">
          ${isDaily ? formatDate(report.reportDate) : 
            `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`}
        </div>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total Cars Parked</h3>
          <div class="value">${report.data.totalCarsParked}</div>
        </div>
        <div class="summary-card">
          <h3>Total Revenue</h3>
          <div class="value">${formatCurrency(report.data.totalRevenue)}</div>
        </div>
        <div class="summary-card">
          <h3>Total Duration</h3>
          <div class="value">${Math.round(report.data.totalDuration / 60)} hours</div>
        </div>
        ${report.data.slotUtilization ? `
        <div class="summary-card">
          <h3>Average Occupancy</h3>
          <div class="value">${report.data.slotUtilization.averageOccupancy.toFixed(1)}%</div>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <h2>Payment Methods Breakdown</h2>
        <table>
          <tr>
            <th>Payment Method</th>
            <th>Amount</th>
            <th>Percentage</th>
          </tr>
          <tr>
            <td>Cash</td>
            <td>${formatCurrency(report.data.paymentMethods.cash)}</td>
            <td>${report.data.totalRevenue > 0 ? ((report.data.paymentMethods.cash / report.data.totalRevenue) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Mobile Money</td>
            <td>${formatCurrency(report.data.paymentMethods.mobile_money)}</td>
            <td>${report.data.totalRevenue > 0 ? ((report.data.paymentMethods.mobile_money / report.data.totalRevenue) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Card</td>
            <td>${formatCurrency(report.data.paymentMethods.card)}</td>
            <td>${report.data.totalRevenue > 0 ? ((report.data.paymentMethods.card / report.data.totalRevenue) * 100).toFixed(1) : 0}%</td>
          </tr>
        </table>
      </div>

      ${report.data.peakHours && report.data.peakHours.length > 0 ? `
      <div class="section">
        <h2>Peak Hours</h2>
        <table>
          <tr>
            <th>Hour</th>
            <th>Number of Cars</th>
          </tr>
          ${report.data.peakHours.map(peak => `
            <tr>
              <td>${peak.hour}:00 - ${peak.hour + 1}:00</td>
              <td>${peak.count}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}

      ${reportData && reportData.records && reportData.records.length > 0 ? `
      <div class="section">
        <h2>Recent Parking Records (Sample)</h2>
        <table>
          <tr>
            <th>Plate Number</th>
            <th>Driver Name</th>
            <th>Entry Time</th>
            <th>Duration</th>
            <th>Slot</th>
          </tr>
          ${reportData.records.slice(0, 10).map(record => `
            <tr>
              <td>${record.car?.plateNumber || 'N/A'}</td>
              <td>${record.car?.driverName || 'N/A'}</td>
              <td>${new Date(record.entryTime).toLocaleString()}</td>
              <td>${record.duration ? Math.round(record.duration / 60) + ' hrs' : 'Active'}</td>
              <td>${record.parkingSlot?.slotNumber || 'N/A'}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}

      <div class="signature-section">
        <div class="signature-box">
          <div>Generated By:</div>
          <div style="margin: 20px 0;">${report.generatedBy?.username || 'System'}</div>
          <div>Date: ${formatDate(report.createdAt || new Date())}</div>
        </div>
        ${report.signature ? `
        <div class="signature-box">
          <div>Approved By:</div>
          ${report.signature.signatureData ? `
            <div style="margin: 10px 0; font-style: italic;">[Digital Signature]</div>
          ` : '<div style="height: 50px;"></div>'}
          <div>${report.signature.signedBy}</div>
          <div>${report.signature.position}</div>
          <div>Date: ${formatDate(report.signature.signedAt)}</div>
        </div>
        ` : `
        <div class="signature-box">
          <div>Signature:</div>
          <div style="height: 50px; border-bottom: 1px solid #333; margin: 20px 0;"></div>
          <div>Name: ________________</div>
          <div>Date: ________________</div>
        </div>
        `}
      </div>

      <div class="footer">
        <p>This report was generated automatically by Park-kizo Parking Management System</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Auto-focus the print window
  printWindow.focus();
  
  return printWindow;
};

export default generateReportPDF;
