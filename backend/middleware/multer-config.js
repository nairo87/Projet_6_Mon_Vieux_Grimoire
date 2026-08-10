const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// On stocke temporairement le fichier en mémoire : le contrôleur books.js
// se charge ensuite de le redimensionner/convertir en webp avec sharp
// avant de l'écrire sur le disque dans /images.
const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  if (MIME_TYPES[file.mimetype]) {
    callback(null, true);
  } else {
    callback(new Error('Type de fichier non supporté !'), false);
  }
};

module.exports = multer({ storage, fileFilter }).single('image');
module.exports.MIME_TYPES = MIME_TYPES;