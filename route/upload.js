const multer = require('multer');
const path = require('path');
const fs = require('fs');
const e = require('express');
const uploadRoute = e.Router();

const imageUploadPath = 'uploads/images';
const videoUploadPath = 'uploads/videos';

uploadRoute.use(e.json());

if (!fs.existsSync(imageUploadPath)) {
  fs.mkdirSync(imageUploadPath, { recursive: true });
}
if (!fs.existsSync(videoUploadPath)) {
  fs.mkdirSync(videoUploadPath, { recursive: true });
}

// Set up storage with Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'image') {
      cb(null, imageUploadPath);
    } else if (file.fieldname === 'video') {
      cb(null, videoUploadPath);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep original file name
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'image') {
      console.log(file.mimetype);
      const imageTypes = /jpeg|jpg|png|gif/;
      const mimetype = imageTypes.test(file.mimetype);
      const extname = imageTypes.test(path.extname(file.originalname).toLowerCase());
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Error: Image upload only supports the following filetypes - ' + imageTypes));
    } else if (file.fieldname === 'video') {
      console.log(file.mimetype);
      const videoTypes = /mp4|avi/;
      const mimetype = videoTypes.test(file.mimetype);
      const extname = videoTypes.test(path.extname(file.originalname).toLowerCase());
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Error: Video upload only supports the following filetypes - ' + videoTypes));
    }
  }
});

// Endpoint to upload multiple files
uploadRoute.post('/upload', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), (req, res) => {
  console.log(req.files);
  res.json(req.files);
});

// Endpoint to list available files for download
uploadRoute.get('/files', (req, res) => {
  const images = fs.readdirSync(imageUploadPath).map(file => ({ type: 'image', name: file }));
  const videos = fs.readdirSync(videoUploadPath).map(file => ({ type: 'video', name: file }));
  res.json({ images, videos });
});

// Endpoint to download a specific file by its name
uploadRoute.get('/download/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  let filePath;

  if (type === 'image') {
    filePath = path.join(imageUploadPath, filename);
  } else if (type === 'video') {
    filePath = path.join(videoUploadPath, filename);
  } else {
    return res.status(400).json({ message: 'Invalid file type' });
  }

  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': type === 'image' ? 'image/jpeg' : 'video/mp4',
      'Content-Length': stat.size,
      'Content-Disposition': `inline; filename="${filename}"`
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});

module.exports = uploadRoute;
