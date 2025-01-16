import { Router } from 'express';
import * as ExcelController from '$controllers/rest/TodoController'; 

const TodoRoutes = Router({ mergeParams: true }); 

TodoRoutes.post('/upload', ExcelController.handleExcelUpload);
TodoRoutes.post('/create', ExcelController.create);
TodoRoutes.delete('/delete', ExcelController.remove);
TodoRoutes.get('/get-all', ExcelController.getTodosController);
TodoRoutes.get('/get-list', ExcelController.getTodosListController);
TodoRoutes.put('/update/:id', ExcelController.update);
TodoRoutes.get('/get-file-list', ExcelController.getFileListController);


export default TodoRoutes;
