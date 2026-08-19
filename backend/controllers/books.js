const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Book = require('../models/Book');

// Répertoire images
const IMAGES_DIR = path.join(__dirname, '..', 'images');

// Convertit et redimensionne l'image
async function saveOptimizedImage(file) {
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  await sharp(file.buffer)
    .resize({ width: 500, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(IMAGES_DIR, filename));
  return filename;
}

function deleteImageFile(imageUrl) {
  if (!imageUrl) return;
  const filename = imageUrl.split('/images/')[1];
  if (!filename) return;
  fs.unlink(path.join(IMAGES_DIR, filename), (err) => {
    if (err) console.error('Erreur lors de la suppression de l\'image :', err.message);
  });
}

function computeAverageRating(ratings) {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.grade, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // arrondi à 1 décimale
}

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) return res.status(404).json({ message: 'Livre non trouvé !' });
      res.status(200).json(book);
    })
    .catch((error) => res.status(404).json({ error }));
};

exports.getBestRating = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.createBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    delete bookObject.averageRating;

    if (!req.file) {
      return res.status(400).json({ message: 'Une image est requise.' });
    }

    const filename = await saveOptimizedImage(req.file);

const initialRatings = Array.isArray(bookObject.ratings)
  ? bookObject.ratings
      .filter((r) => typeof r.grade === 'number' && r.grade >= 0 && r.grade <= 5)
      .map((r) => ({ userId: req.auth.userId, grade: r.grade }))
  : [];

const book = new Book({
  ...bookObject,
  userId: req.auth.userId,
  imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}`,
  ratings: initialRatings,
  averageRating: computeAverageRating(initialRatings),
});

    await book.save();
    res.status(201).json({ message: 'Livre enregistré !' });
  } catch (error) {
    console.error('Erreur createBook :', error);
    res.status(400).json({ error });
  }
};

exports.modifyBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: 'Livre non trouvé !' });

    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ message: '403: unauthorized request' });
    }

    let newBookData = req.file
      ? { ...JSON.parse(req.body.book) }
      : { ...req.body };

    delete newBookData._id;
    delete newBookData._userId;
    delete newBookData.userId;
    delete newBookData.ratings;
    delete newBookData.averageRating;
    if (newBookData.year !== undefined) {
  newBookData.year = normalizeYear(newBookData.year);
}

    if (req.file) {
      const filename = await saveOptimizedImage(req.file);
      deleteImageFile(book.imageUrl);
      newBookData.imageUrl = `${req.protocol}://${req.get('host')}/images/${filename}`;
    }

    await Book.updateOne({ _id: req.params.id }, { ...newBookData, _id: req.params.id });
    res.status(200).json({ message: 'Livre modifié !' });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) return res.status(404).json({ message: 'Livre non trouvé !' });

      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: '403: unauthorized request' });
      }

      deleteImageFile(book.imageUrl);
      Book.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Livre supprimé !' }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.rateBook = (req, res, next) => {
  const { userId, rating } = req.body;

  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5.' });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) return res.status(404).json({ message: 'Livre non trouvé !' });

      const alreadyRated = book.ratings.some((r) => r.userId === userId);
      if (alreadyRated) {
        return res.status(400).json({ message: 'Vous avez déjà noté ce livre.' });
      }

      book.ratings.push({ userId, grade: rating });
      book.averageRating = computeAverageRating(book.ratings);

      book
        .save()
        .then((updatedBook) => res.status(200).json(updatedBook))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(404).json({ error }));
};
