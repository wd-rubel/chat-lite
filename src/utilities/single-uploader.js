import multer from "multer";
import path from "path";
import fs from "fs";

function uploader(subfolderPath, allowedTypes, maxFileSize, errorMsg) {
  const uploadFolder = path.join(process.cwd(), "src", "public", "uploads", subfolderPath);

  // auto create folder if not exists
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const fileName =
        file.originalname
          .replace(fileExt, "")
          .toLowerCase()
          .split(" ")
          .join("-") +
        "-" +
        Date.now() +
        fileExt;
      cb(null, fileName);
    },
  });

  const upload = multer({
    storage: storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) cb(null, true);
      else cb(new Error(errorMsg));
    },
  });



  return upload;
}

export default uploader;
