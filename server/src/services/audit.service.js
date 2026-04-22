'use strict';

const { AuditLog } = require('../models/auditlog.model');

class AuditService {
  /**
   * Log an admin action
   */
  static async log(data) {
    try {
      await AuditLog.create(data);
    } catch (error) {
      console.error('Failed to log audit:', error);
      // Don't throw — we don't want to fail the main operation if audit fails
    }
  }

  /**
   * Get audit logs with filters
   */
  static async getLogs(filters = {}, page = 1, limit = 20) {
    const query = {};

    if (filters.adminId) query.adminId = filters.adminId;
    if (filters.action) query.action = filters.action;
    if (filters.targetType) query.targetType = filters.targetType;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const total = await AuditLog.countDocuments(query);
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(query)
      .populate('adminId', 'email username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      logs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get logs for a specific target
   */
  static async getLogsForTarget(targetType, targetId, page = 1, limit = 20) {
    const total = await AuditLog.countDocuments({ targetType, targetId });
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find({ targetType, targetId })
      .populate('adminId', 'email username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      logs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Export audit logs to CSV
   */
  static async exportLogs(filters = {}) {
    const logs = await AuditLog.find(filters).populate('adminId', 'email');

    let csv = 'Admin Email,Action,Target Type,Target ID,Reason,Created At\n';

    for (const log of logs) {
      const admin = log.adminId;
      csv += `"${admin.email}","${log.action}","${log.targetType}","${log.targetId}","${log.reason || ''}","${log.createdAt}"\n`;
    }

    return csv;
  }
}

module.exports = { AuditService };
