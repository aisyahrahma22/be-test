import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedFileTypes = /xlsx|xls/;  
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  
  const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.mimetype === 'application/vnd.ms-excel'; 

  if (extname && mimetype) {
    return cb(null, true); 
  } else {
    return cb(new Error('Only Excel files are allowed'), false); 
  }
};

const uploadExcel = multer({
  storage: storage,
  fileFilter: fileFilter,
}).single('file'); 

export default uploadExcel;
