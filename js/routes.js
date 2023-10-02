//routes.js

const {
    isValidUrl,
    checkForm,
    customDownload,
    downloadFromLink,
    lookFor,
    generateResultLinks,
    downloadYTvideo
} = require('./utils');
const fs = require('fs');
module.exports = function (app) {

    app.get('/search', (req, res) => {
        res.sendFile(path.join(__dirname, '../views/search.html'));
    });
    app.get('/link', (req, res) => {
        res.sendFile(path.join(__dirname, '../views/link.html'));
    });
    app.get('/audio', (req, res) => {
        res.sendFile(path.join(__dirname, '../views/audio.html'));
    });
    app.post('/link', async (req, res) => {
        const link = req.body.link;

        if (req.body?.downloadType) {
            const downloadType = req.body.downloadType;
            if (isValidUrl(link) && checkForm(downloadType)) {
                const filePath = await customDownload(link, downloadType);
                res.download(filePath, (err) => {
                    if (err) {
                        console.error('Error sending file:', err);
                    } else {
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                console.error('Error deleting file:', err);
                            }
                        });
                    }
                });
            } else {
                res.status(400).sendFile(path.join(__dirname, '../views/error.html'));

            }
        } else {
            if (isValidUrl(link)) {
                const filePath = await downloadFromLink(req.body.link);
                res.download(filePath, (err) => {
                    if (err) {
                        console.error('Error sending file:', err);
                    } else {
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                console.error('Error deleting file:', err);
                            }
                        });
                    }
                });
            } else {
                res.status(400).sendFile(path.join(__dirname, '../views/error.html'));

            }
        }


    });

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../views/index.html'));
    });

    let tempId = null;
    let tempTitle = null;
    app.get('/get/:id', (req, res) => {
        tempId = req.params.id;
        res.sendFile(path.join(__dirname, '../views/downloadOption.html'));
    });

    app.post('/downloadOption', async (req, res) => {
        const values = ['audio', 'video'];
        const selectedOption = req.body.downloadType;
        if (values.includes(selectedOption) && tempId) {
            const newUrl = 'https://www.youtube.com/watch?v=' + tempId;
            const info = await ytdl.getInfo(newUrl);
            const title = sanitizeFilename(info.videoDetails.title); // Sanitize the title
            try {
                const filePath = await customDownload(newUrl, selectedOption);
                if (fs.existsSync(filePath)) {
                    res.download(filePath, (err) => {
                        if (err) {
                            console.error('Error sending file:', err);
                        } else {
                            fs.unlink(filePath, (err) => {
                                if (err) {
                                    console.error('Error deleting file:', err);
                                }
                            });
                        }
                    });
                } else {
                    res.status(404).send('File not found');
                }
            } catch (error) {
                console.error('Error downloading video:', error);
                res.status(500).send('Internal server error');
            }
        } else {
            res.status(404).send('File not found and missing parameters');
        }
    });


    app.post('/results', async (req, res) => {
        const videoLink = req.body.videoLink;
        const results = await lookFor(videoLink);
        res.send(results);
    });

    app.post('/linkResults', async (req, res) => {
        const videoLink = req.body.videoLink;
        const results = await generateResultLinks(videoLink);
        res.send(results);
    });
    app.post('/get', async (req, res) => {
        const videoId = req.body.videoId;
        const title = sanitizeFilename(req.body.title); // Sanitize the title
        const filePath = path.join(__dirname, title + '.mkv');

        try {
            await downloadYTvideo(videoId, title);
            if (fs.existsSync(filePath)) {
                res.download(filePath, (err) => {
                    if (err) {
                        console.error('Error sending file:', err);
                    } else {
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                console.error('Error deleting file:', err);
                            }
                        });
                    }
                });
            } else {
                res.status(404).send('File not found');
            }
        } catch (error) {
            console.error('Error downloading video:', error);
            res.status(500).send('Internal server error');
        }
    });


}