import { Request, Response } from 'express';
import path from 'path';
import { processExcelFile, createTodo, removeTodos, getTodos, getTodosList, updateTodo, getUploadedFiles} from '$services/TodoService';
import uploadExcel from '$utils/multer'; 
import { handleServiceErrorWithResponse, response_success } from '$utils/response.utils';
import { FilteringQueryV2 } from '$entities/Query';
import * as fs from 'fs';
import { INTERNAL_SERVER_ERROR_SERVICE_RESPONSE } from '$entities/Service';

import Logger from '$pkg/logger';
export function handleExcelUpload(req: Request, res: Response): void {
  uploadExcel(req, res, async (err: any) => {
    if (err instanceof Error) {
      return res.status(400).json({
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded.',
      });
    }

    if (!req.body.userId) {
      return res.status(400).json({
        message: 'User ID is required.',
      });
    }

    try {
      const filePath = path.join(__dirname, '../../uploads', req.file.filename);
      await processExcelFile(filePath, req.body.userId);

      fs.unlinkSync(filePath);

      return res.status(200).json({
        message: 'Excel file has been processed and data saved to database successfully.',
      });
    } catch (error: any) {
      Logger.error(`Error during registration: ${error}`);
      return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
    }
  });
}

export async function create(req: Request, res: Response): Promise<Response> {
  const { task, isCompleted, userId } = req.body;

  const serviceResponse = await createTodo({ task, isCompleted, userId });

  if (!serviceResponse.status) return handleServiceErrorWithResponse(res, serviceResponse);

  return response_success(res, serviceResponse.data, "Todo created successfully!");
}

export async function remove(req: Request, res: Response): Promise<Response> {
  try {
    const ids = JSON.parse(req.query.ids as string);
    const serviceResponse = await removeTodos(ids);

    if (!serviceResponse.status) {
      return handleServiceErrorWithResponse(res, serviceResponse);
    }

    return response_success(res, serviceResponse.data, "Todos deleted successfully!");
  } catch (err: any) {
    Logger.error(`Error during registration: ${err}`);
    return res.status(500).json({
      message: 'Failed to remove todos',
      error: err.message,
    });
  }
}

export async function getTodosController(req: Request, res: Response): Promise<Response> {
  try {
    const completed = req.query.completed === '1' ? true :
                 req.query.completed === '0' ? false :
                 null;
    const filter: FilteringQueryV2 = {
      task: typeof req.query.task === 'string' ? req.query.task : '',
      completed: completed,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    };

    const serviceResponse = await getTodos(filter);

    if (!serviceResponse.status) {
      return handleServiceErrorWithResponse(res, serviceResponse);
    }

    return response_success(res, serviceResponse.data, 'Fetched todos successfully');
  } catch (err: any) {
    Logger.error(`Error during fetch todos: ${err}`);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch todos',
      error: err.message,
    });
  }
}

export async function getTodosListController(req: Request, res: Response): Promise<Response> {
  const { page = 1, limit = 10 } = req.query; 
  const filter: FilteringQueryV2 = { page: Number(page), limit: Number(limit) }; 

  try {


    const serviceResponse = await getTodosList(filter, filter.userId as string);

    if (!serviceResponse.status) {
      return handleServiceErrorWithResponse(res, serviceResponse);
    }

    return response_success(res, serviceResponse.data, 'Fetched todos successfully');
  } catch (err: any) {
    Logger.error(`Error during fetch todo list: ${err}`);
    return res.status(500).json({
      message: 'Failed to fetch todos list',
      error: err.message,
    });
  }
}

export async function update(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;  
  const data = req.body;     

  const serviceResponse = await updateTodo(id, data);  

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(res, serviceResponse);
  }
  return response_success(res, serviceResponse.data, "Todo updated successfully!");
}

export async function getFileListController(req: Request, res: Response): Promise<Response> {
  const { page = 1, limit = 5, userId} = req.query; 
  const filter: FilteringQueryV2 = { page: Number(page), limit: Number(limit), status:  typeof req.query.status === 'string' ? req.query.status : '' }; 

  try {

    const serviceResponse = await getUploadedFiles(filter, userId as string);

    if (!serviceResponse.status) {
      return handleServiceErrorWithResponse(res, serviceResponse);
    }

    return response_success(res, serviceResponse.data, 'Fetched todos file successfully');
  } catch (err: any) {
    Logger.error(`Error during fetching todos files: ${err}`);
    return res.status(500).json({
      message: 'Failed to fetch todos files',
      error: err.message,
    });
  }
}