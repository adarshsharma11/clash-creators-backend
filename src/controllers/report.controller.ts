import { NextFunction, Request, Response } from 'express';
import * as ReportService from '../services/report.service';
import { createReportSchema } from '../types/report';
import { sendSuccessResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

export const createReport = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const body = createReportSchema.parse(request.body);
    const report = await ReportService.createReport(request.user?.id ?? '', body);
    return sendSuccessResponse(response, report, HttpStatusCode.CREATED);
  } catch (error) {
    next(error);
  }
};
