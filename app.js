const express = require('express');
const ytsr = require("ytsr");
const ytdl = require("ytdl-core");
const path = require("path");
const fs = require('fs');

const app = express();
const port = 8080;

const currentDate = new Date(Date.now());
const formattedDate = currentDate.toLocaleString();
console.log(`I restarted at: ${formattedDate}`);

app.use(express.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
app.use('/img', express.static(path.join(__dirname, 'img')));

app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, './search.html'));
});
app.get('/link', (req, res) => {
    res.sendFile(path.join(__dirname, './link.html'));
});
app.get('/audio', (req, res) => {
    res.sendFile(path.join(__dirname, './audio.html'));
});
app.post('/link', async (req, res) => {
    const link = req.body.link;

    if(req.body?.downloadType && req.body?.quality){
        const downloadType = req.body.downloadType;
        const quality = req.body.quality;
        if (isValidUrl(link) && checkForm(downloadType, quality)) {
            const filePath = await customDownload(link, downloadType, quality);
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
        }else{
            console.log('the link is ', link)
            res.status(202).send('Accepted but the processing has failed.'); // Send 202 response on error
        }
    }else{
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
        }else{
            res.status(202).send('Accepted but the processing has failed.'); // Send 202 response on error
        }
    }


});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './index.html'));
});

app.post('/results', async (req, res) => {
    const videoLink = req.body.videoLink;
    const results = await lookFor(videoLink);
    res.send(results);
});

const sanitizeFilename = require('sanitize-filename');

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


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

async function lookFor(test) {
    const searchResults = await ytsr(test, {limit: 5});
    let ul = '<ul>';
    searchResults.items.forEach(item => {
        if (item.type !== 'channel') {
            if (item.type === 'video') {
                if (item.duration) {
                    ul += prepareElement(item);
                }
            } else if (item.type === 'shelf') {
                item.items.forEach(item => {
                    if (item.duration) {
                        ul += prepareElement(item);
                    }
                });
            }
        }
    });
    ul += '</ul>';
    return ul;
}

function prepareElement(item) {
    return `<li> 
                <img src="${item.bestThumbnail.url}" style="width:100px; height:auto; border-radius:5px;"> 
                <form method="post" action="/get">
                    <input type="hidden" name="videoId" value="${item.id}">
                    <input type="hidden" name="title" value="${item.title}">
                    <a href="#" onclick="event.preventDefault(); this.closest('form').submit();">${item.title}, ${item.duration}</a>
                  
                </form>
            </li>`;
}

async function downloadYTvideo(videoId, title) {
    return new Promise(async (resolve, reject) => {
        try {
            const newUrl = 'https://www.youtube.com/watch?v=' + videoId;
            const info = await ytdl.getInfo(newUrl);
            const video = ytdl(newUrl, {filter: 'audioonly'});
            video.pipe(fs.createWriteStream(path.join(__dirname, `${title}.mkv`))); // Save in the correct directory
            video.on('end', resolve);
            video.on('error', reject); // Handle video errors
        } catch (error) {
            reject(error);
        }
    });
}

async function downloadFromLink(link) {
    return new Promise(async (resolve, reject) => {
        try {

            const info = await ytdl.getInfo(link);
            let title = info.videoDetails.title;
            title = sanitizeFilename(title);
            const video = ytdl(link, {filter: 'audioonly'});
            video.pipe(fs.createWriteStream(path.join(__dirname, `${title}.mkv`))); // Save in the correct directory
            video.on('end', () => {
                const filePath = path.join(__dirname, `${title}.mkv`);
                if (fs.existsSync(filePath)) {
                    resolve(filePath);
                }
            });
            video.on('error', reject); // Handle video errors
        } catch (error) {
            reject(error);
        }
    });
}
async function customDownload(link, downloadType, quality) {
    return new Promise(async function(resolve, reject) {
        try {
            const info = await ytdl.getInfo(link);
            const title = sanitizeFilename(info.videoDetails.title);
            console.log('the title is ', title)
            const filter = downloadType.trim().toLowerCase() === 'audio' ? {filter: 'audioonly'} : {filter: 'video'};
            const fileName = downloadType.trim().toLowerCase() === 'audio' ? `${title}.mp3` : `${title}.mkv`;
            console.log('the filter is ', filter)
            const video = ytdl(link, filter);
            video.pipe(fs.createWriteStream(path.join(__dirname, fileName))); // Save in the correct directory
            video.on('end', () => resolve(fileName)); // Corrected this line
            video.on('error', reject); // Handle video errors

        } catch (error) {
            reject(error);
        }
    });
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (err) {
        return false;
    }
}

function checkForm(downloadType, quality) {
    console.log('the download type is ', downloadType)
    console.log('the quality type is ', quality);
    const downloadTypes = ['audio', 'video'];
    const qualities = ['high', 'fast'];
    return downloadTypes.includes(downloadType) && qualities.includes(quality);
}