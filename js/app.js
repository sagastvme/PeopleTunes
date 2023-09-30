//app.js
const port = 8080;
require('./middleware')(app);
require('./routes')(app);
require('./variables');
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
