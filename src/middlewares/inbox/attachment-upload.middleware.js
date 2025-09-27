import uploader from "../../utilities/single-uploader.js";

function attachmentsUpload(req, res, next) {
  
  const upload = uploader(
    "attachments",
    ["image/jpeg", "image/jpg", "image/png", "application/pdf",  "image/webp", "text/plain"],
    1000000,
    "Only .jpg, .png, .webp, .pdf or .txt allowed!"
  );

  // call the multer upload middleware
  upload.any()(req, res, (err) => {
    
    if (err) {
      res.status(500).json({
        errors: {
          common: {
            msg: err.message,
          },
        },
      });
    }else{
      next();
    }
    
  });

}

export default attachmentsUpload;
