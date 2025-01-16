import * as XLSX from 'xlsx';
import { PrismaClient, Status } from '@prisma/client';
import fs from 'fs';
import Logger from '$pkg/logger';
import { INTERNAL_SERVER_ERROR_SERVICE_RESPONSE, ServiceResponse } from '$entities/Service';
import { FilteringQueryV2 } from '$entities/Query';
const prisma = new PrismaClient();

export async function processExcelFile(filePath: string, userId: string): Promise<string> {
  const fileName = filePath.split('/').pop() || 'unknown'; 
  const fileSize = fs.statSync(filePath).size;  

  let fileRecord;
  try {
    fileRecord = await prisma.file.create({
      data: {
        fileName,
        filePath,
        fileSize,
        status: Status.PENDING, 
        userId,
        uploadedAt: new Date()
      },
    });

    const file = fs.readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    await updateFileStatus(fileRecord.id, Status.IN_PROGRESS);


    for (const row of data) {
      const message = await saveTodoToDatabase(row, userId);
      if (message !== 'Todo saved successfully.') {
        await updateFileStatus(fileRecord.id, Status.FAILED);  
        return message;
      }
    }

    await updateFileStatus(fileRecord.id, Status.SUCCESS);
    return 'Data has been processed and saved to database';
  } catch (error) {
    Logger.error(`processExcelFile error: ${error}`);
    if (fileRecord) {
      await updateFileStatus(fileRecord.id, Status.FAILED); 
    }
    return 'Failed to process the Excel file';
  }
}

async function updateFileStatus(fileId: string, status: Status) {
  try {
    await prisma.file.update({
      where: { id: fileId },
      data: {
        status: status,
        uploadedAt: new Date(),
      },
    });
  } catch (error) {
    Logger.error(`updateFileStatus error: ${error}`);
  }
}

export async function saveTodoToDatabase(row: any, userId: string): Promise<string> {
  try {
    await prisma.todo.create({
      data: {
        task: row['Todo Name'],
        isCompleted: row['Status'] || false, 
        userId: userId, 
        createdAt: new Date(), 
        updatedAt: new Date(), 
      },
    });

    return 'Todo saved successfully.';
  } catch (error) {
    Logger.error(`saveTodoToDatabase error: ${error}`);
    return 'Error saving todo to database';
  }
}

export async function getTodos(filter: FilteringQueryV2): Promise<ServiceResponse<{}>> {
  try {
    const { task = '', completed, page = 1, limit = 10 } = filter;

    const offset = (page - 1) * limit;

    const completedFilter = completed === null ? undefined : completed;

    const todos = await prisma.todo.findMany({
      where: {
        task: {
          contains: task,
        },
        isCompleted: completedFilter, 
        isDeleted: false,
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt:'desc', 
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const totalTodos = await prisma.todo.count({
      where: {
        task: {
          contains: task,
        },
        isCompleted: completedFilter, 
        isDeleted: false,
      },
      orderBy: {
        createdAt:'desc', 
      },
    });

    return {
      status: true,
      data: {
        todos: todos.map(todo => ({
          ...todo,
          userFullName: `${todo.user?.firstName} ${todo.user?.lastName}` || '',
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTodos / limit),
          totalItems: totalTodos,
        },
      },
    };
  } catch (error) {
    Logger.error(`TodoService.getTodos : ${error}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function getTodosList(
  filter: FilteringQueryV2, 
  userId: string
): Promise<ServiceResponse<{}>> {
  try {
    const { page = 1, limit = 10 } = filter; 

    const skip = (page - 1) * limit;
    const take = limit;

    const todos = await prisma.todo.findMany({
      where: {
        userId: userId,
        isDeleted: false,
      },
      skip, 
      take, 
      orderBy: {
        createdAt:'desc', 
      },
    });
  
    const totalItems = await prisma.todo.count({
      where: {
        userId: userId,
        isDeleted: false,
      },
      orderBy: {
        createdAt:'desc', 
      },
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      status: true,
      data: {
        content: todos,  
        totalItems: totalItems,  
        totalPages: totalPages,  
        currentPage: page, 
      }
    };
  } catch (error) {
    Logger.error(`TodoService.getTodosList: ${error}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}


export async function createTodo(todoData: { task: string, isCompleted: boolean, userId: string}): Promise<ServiceResponse<{}>> {
  try {
    const newTodo = await prisma.todo.create({
      data: {
        task: todoData.task,
        isCompleted: todoData.isCompleted,
        userId: todoData.userId
      },
    });

    return {
      status: true,
      data: newTodo
    };
  } catch (err) {
    Logger.error(`TodoService.create : ${err}`);
     return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE
  }
}

export async function removeTodos(ids: string[]): Promise<ServiceResponse<{}>> {
  try {
    const updatedTodos = await prisma.todo.updateMany({
      where: {
        id: {
          in: ids,  
        },
      },
      data: {
        isDeleted: true,
      },
    });

    return {
      status: true,
      data: updatedTodos, 
    };
  } catch (err) {
    Logger.error(`TodoService.removeTodos : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function updateTodo(id: string, data: any): Promise<ServiceResponse<{}>> {
  try {
    const findTodo = await prisma.todo.findUnique({ where: { id } });
    
    const updatedData = {
      isCompleted: data?.isCompleted !== undefined ? data.isCompleted : findTodo?.isCompleted,  
      task: data?.task || findTodo?.task,  
    };

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: updatedData,
    });

    return {
      status: true,
      data: updatedTodo,
    };
  } catch (err) {
    Logger.error(`TodoService.updateTodo : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function getUploadedFiles(filter: FilteringQueryV2, userId: string): Promise<ServiceResponse<{}>> {
  try {
    const { page = 1, limit = 10, status = 'all' } = filter; 
    const skip = (page - 1) * limit;
    const take = limit;

    const whereConditions: any = {
      userId: userId,
    };

    if (status !== 'all') {
      whereConditions.status = status; 
    }

    const todos = await prisma.file.findMany({
      where: whereConditions,
      skip,
      take,
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    const totalItems = await prisma.file.count({
      where: whereConditions, // Apply status filter to the count query as well
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      status: true,
      data: {
        content: todos,
        totalItems: totalItems,
        totalPages: totalPages,
        currentPage: page,
      },
    };
  } catch (error) {
    Logger.error(`Error fetching uploaded files ${error}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
