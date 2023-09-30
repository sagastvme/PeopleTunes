require('./variables');
module.exports = function (app) {
    app.use(express.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

    // Adjust the path to point to the correct img directory
    app.use('/img', express.static(path.join(__dirname, '../img')));
    console.log("Serving css from:", path.join(__dirname, '../css'));

    app.use('/views', express.static(path.join(__dirname, 'views')));
    app.use('/js', express.static(path.join(__dirname, 'js')));
    app.use('/css', express.static(path.join(__dirname, '../css')));
};
