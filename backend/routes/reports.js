const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Report = require('../models/Report');
const ParkingRecord = require('../models/ParkingRecord');
const Payment = require('../models/Payment');
const ParkingSlot = require('../models/ParkingSlot');

// @route   GET /api/reports/daily
// @desc    Generate daily activity report
// @access  Private
router.get('/daily', auth, async (req, res) => {
  try {
    console.log('User from auth middleware:', req.user);
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();

    // Set start and end of day
    const startDate = new Date(reportDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);

    // Get parking records for the day
    const records = await ParkingRecord.find({
      entryTime: { $gte: startDate, $lte: endDate }
    }).populate('car', 'plateNumber driverName phoneNumber')
      .populate('parkingSlot', 'slotNumber location');

    // Get payments for the day
    const payments = await Payment.find({
      paymentDate: { $gte: startDate, $lte: endDate }
    });

    // Calculate statistics
    const totalCarsParked = records.length;
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    const totalDuration = records.reduce((sum, record) => sum + (record.duration || 0), 0);

    // Payment method breakdown
    const paymentMethods = {
      cash: payments.filter(p => p.paymentMethod === 'cash').reduce((sum, p) => sum + p.amountPaid, 0),
      mobile_money: payments.filter(p => p.paymentMethod === 'mobile_money').reduce((sum, p) => sum + p.amountPaid, 0),
      card: payments.filter(p => p.paymentMethod === 'card').reduce((sum, p) => sum + p.amountPaid, 0)
    };

    // Peak hours analysis
    const hourlyData = {};
    records.forEach(record => {
      const hour = new Date(record.entryTime).getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourlyData)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Slot utilization
    const totalSlots = await ParkingSlot.countDocuments({ isActive: true });
    const occupiedSlots = records.filter(r => r.status === 'active').length;
    const averageOccupancy = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

    // Create or update report
    const reportData = {
      reportType: 'daily',
      reportDate,
      startDate,
      endDate,
      generatedBy: req.user._id,
      data: {
        totalCarsParked,
        totalRevenue,
        totalDuration,
        paymentMethods,
        slotUtilization: {
          totalSlots,
          averageOccupancy,
          peakOccupancy: Math.max(...Object.values(hourlyData), 0)
        },
        peakHours,
        recordIds: records.map(r => r._id)
      }
    };

    const existingReport = await Report.findOne({
      reportType: 'daily',
      reportDate: {
        $gte: startDate,
        $lte: endDate
      }
    });

    let report;
    if (existingReport) {
      Object.assign(existingReport, reportData);
      report = await existingReport.save();
    } else {
      report = new Report(reportData);
      await report.save();
    }

    await report.populate('generatedBy', 'username role');

    res.json({
      report,
      records: records.slice(0, 50), // Limit records for performance
      summary: {
        totalCarsParked,
        totalRevenue,
        totalDuration,
        paymentMethods,
        peakHours: peakHours.slice(0, 3)
      }
    });
  } catch (error) {
    console.error('Generate daily report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/monthly
// @desc    Generate monthly activity report
// @access  Private
router.get('/monthly', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const reportDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1);

    // Set start and end of month
    const startDate = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
    const endDate = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get all records for the month
    const records = await ParkingRecord.find({
      entryTime: { $gte: startDate, $lte: endDate }
    }).populate('car', 'plateNumber driverName phoneNumber');

    // Get all payments for the month
    const payments = await Payment.find({
      paymentDate: { $gte: startDate, $lte: endDate }
    });

    // Calculate monthly statistics
    const totalCarsParked = records.length;
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    const totalDuration = records.reduce((sum, record) => sum + (record.duration || 0), 0);

    // Daily breakdown
    const dailyStats = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split('T')[0];
      dailyStats[dayKey] = {
        cars: 0,
        revenue: 0,
        duration: 0
      };
    }

    records.forEach(record => {
      const dayKey = record.entryTime.toISOString().split('T')[0];
      if (dailyStats[dayKey]) {
        dailyStats[dayKey].cars++;
        dailyStats[dayKey].duration += record.duration || 0;
      }
    });

    payments.forEach(payment => {
      const dayKey = payment.paymentDate.toISOString().split('T')[0];
      if (dailyStats[dayKey]) {
        dailyStats[dayKey].revenue += payment.amountPaid;
      }
    });

    // Payment method breakdown
    const paymentMethods = {
      cash: payments.filter(p => p.paymentMethod === 'cash').reduce((sum, p) => sum + p.amountPaid, 0),
      mobile_money: payments.filter(p => p.paymentMethod === 'mobile_money').reduce((sum, p) => sum + p.amountPaid, 0),
      card: payments.filter(p => p.paymentMethod === 'card').reduce((sum, p) => sum + p.amountPaid, 0)
    };

    // Create report
    const reportData = {
      reportType: 'monthly',
      reportDate,
      startDate,
      endDate,
      generatedBy: req.user._id,
      data: {
        totalCarsParked,
        totalRevenue,
        totalDuration,
        paymentMethods,
        dailyStats,
        recordIds: records.map(r => r._id)
      }
    };

    const existingReport = await Report.findOne({
      reportType: 'monthly',
      reportDate: {
        $gte: startDate,
        $lte: endDate
      }
    });

    let report;
    if (existingReport) {
      Object.assign(existingReport, reportData);
      report = await existingReport.save();
    } else {
      report = new Report(reportData);
      await report.save();
    }

    await report.populate('generatedBy', 'username role');

    res.json({
      report,
      summary: {
        totalCarsParked,
        totalRevenue,
        totalDuration,
        paymentMethods,
        dailyStats: Object.entries(dailyStats).slice(-7) // Last 7 days
      }
    });
  } catch (error) {
    console.error('Generate monthly report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/:id/sign
// @desc    Add signature to report
// @access  Private
router.post('/:id/sign', auth, async (req, res) => {
  try {
    const { signedBy, position, signatureData } = req.body;

    if (!signedBy || !signatureData) {
      return res.status(400).json({ message: 'Signed by name and signature data are required' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.signature = {
      signedBy,
      signedAt: new Date(),
      signatureData,
      position: position || 'Manager'
    };
    report.status = 'signed';

    await report.save();
    await report.populate('generatedBy', 'username role');

    res.json(report);
  } catch (error) {
    console.error('Sign report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/:id/download
// @desc    Download report as JSON
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'username role');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Set response headers for JSON download
    const filename = `${report.reportType}-report-${report.reportDate.toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.json(report);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports
// @desc    Get all reports
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;

    const query = {};
    if (type) {
      query.reportType = type;
    }

    const reports = await Report.find(query)
      .populate('generatedBy', 'username role')
      .sort({ reportDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
