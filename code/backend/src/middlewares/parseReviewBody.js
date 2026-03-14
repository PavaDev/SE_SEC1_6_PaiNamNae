module.exports = (req, res, next) => {
    if (req.body.rating) {
        const rating = parseInt(req.body.rating, 10);
        if (!isNaN(rating)) {
            req.body.rating = rating;
        }
    }
    next();
};
