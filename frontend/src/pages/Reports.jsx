import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileText, Signature, Printer, Eye } from 'lucide-react';
import api from '../services/api';
import { generateReportPDF } from '../utils/pdfGenerator';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [currentReport, setCurrentReport] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [reportType, setReportType] = useState('daily');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports');
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/daily?date=${selectedDate}`);
      setCurrentReport(response.data);
      await fetchReports(); // Refresh reports list
    } catch (error) {
      console.error('Error generating daily report:', error);
      alert('Error generating daily report');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyReport = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      const response = await api.get(`/reports/monthly?year=${year}&month=${parseInt(month) - 1}`);
      setCurrentReport(response.data);
      await fetchReports(); // Refresh reports list
    } catch (error) {
      console.error('Error generating monthly report:', error);
      alert('Error generating monthly report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    }
  };

  const printReport = () => {
    if (currentReport) {
      generateReportPDF(currentReport.report, currentReport);
    }
  };



  const formatCurrency = (amount) => `${amount.toLocaleString()} RWF`;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Generate and manage daily and monthly activity reports</p>
      </div>

      {/* Report Generation Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Generate New Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Report */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Daily Report
            </h3>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={generateDailyReport}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Daily Report'}
            </button>
          </div>

          {/* Monthly Report */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Monthly Report
            </h3>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={generateMonthlyReport}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Monthly Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Report Preview */}
      {currentReport && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Report Preview</h2>
            <div className="flex space-x-2">
              <button
                onClick={printReport}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
              <button
                onClick={() => downloadReport(currentReport.report._id)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </button>
              <button
                onClick={() => setShowSignatureModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
              >
                <Signature className="w-4 h-4 mr-2" />
                Sign Report
              </button>
            </div>
          </div>

          {/* Report Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Total Cars</h3>
              <p className="text-2xl font-bold text-blue-900">{currentReport.summary.totalCarsParked}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Total Revenue</h3>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(currentReport.summary.totalRevenue)}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800">Total Duration</h3>
              <p className="text-2xl font-bold text-yellow-900">{Math.round(currentReport.summary.totalDuration / 60)} hrs</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">Status</h3>
              <p className="text-2xl font-bold text-purple-900 capitalize">{currentReport.report.status}</p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Payment Methods Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">Cash</h4>
                <p className="text-xl font-bold">{formatCurrency(currentReport.summary.paymentMethods.cash)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">Mobile Money</h4>
                <p className="text-xl font-bold">{formatCurrency(currentReport.summary.paymentMethods.mobile_money)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">Card</h4>
                <p className="text-xl font-bold">{formatCurrency(currentReport.summary.paymentMethods.card)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Reports History</h2>

        {loading ? (
          <div className="text-center py-4">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No reports generated yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.reportType === 'daily'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {report.reportType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(report.reportDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.generatedBy.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.status === 'signed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadReport(report._id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentReport({ report, summary: report.data })}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          report={currentReport?.report}
          onClose={() => setShowSignatureModal(false)}
          onSigned={(signedReport) => {
            setCurrentReport(prev => ({ ...prev, report: signedReport }));
            fetchReports();
          }}
        />
      )}
    </div>
  );
};

// Signature Modal Component
const SignatureModal = ({ report, onClose, onSigned }) => {
  const [signedBy, setSignedBy] = useState('');
  const [position, setPosition] = useState('Manager');
  const [signatureData, setSignatureData] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSign = async () => {
    if (!signedBy || !signatureData) {
      alert('Please provide your name and signature');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/reports/${report._id}/sign`, {
        signedBy,
        position,
        signatureData
      });
      onSigned(response.data);
      onClose();
    } catch (error) {
      console.error('Error signing report:', error);
      alert('Error signing report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Sign Report</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            type="text"
            value={signedBy}
            onChange={(e) => setSignedBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your full name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position
          </label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your position/title"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Digital Signature
          </label>
          <textarea
            value={signatureData}
            onChange={(e) => setSignatureData(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Type your signature or paste base64 image data"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing...' : 'Sign Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
