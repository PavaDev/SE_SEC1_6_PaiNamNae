module.exports = (req, res, next) => {
    if (req.body.rating) {
        const rating = parseInt(req.body.rating, 10);
        if (!isNaN(rating)) {
            req.body.rating = rating;
        }
    }
    if (req.body.categories) {
        if (typeof req.body.categories === 'string') {
            try {
                // Try parsing if it's a JSON array string
                req.body.categories = JSON.parse(req.body.categories);
            } catch (e) {
                // If it's just a single category string like 'GOOD_DRIVING'
                req.body.categories = [req.body.categories];
            }
        }
        // If it's already an array, leave it as is
    }
    next();
};
