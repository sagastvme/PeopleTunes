const express =require('express');
const ytsr =require("ytsr");
const ytdl= require("ytdl-core");
const path =require("path");
const fs =require('fs');

const app = express();
const port = 8080;

const currentDate = new Date(Date.now());
const formattedDate = currentDate.toLocaleString();
console.log(`I restarted at: ${formattedDate}`);

app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './index.html'));
});

app.post('/results', async (req, res) => {
    const videoLink = req.body.videoLink;
    const results = await lookFor(videoLink);
    res.send(results);
});

app.post('/get', async (req, res) => {
    const videoId = req.body.videoId;
    const title= req.body.title;
    const filePath = path.join(__dirname, title + '.mkv');
    console.log('the filepath is ', filePath);
    await downloadYTvideo(videoId, title);
    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            } else {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    } else {
                        console.log('File deleted successfully');
                    }
                });
            }
        });
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

async function lookFor(test) {
    const searchResults = await ytsr(test, { limit: 5 });
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

async function downloadYTvideo(videoUrl, title) {
    return new Promise(async (resolve, reject) => {
        console.log('the url i got is ', videoUrl);
        let newUrl = 'https://www.youtube.com/watch?v=' + videoUrl;
        try {
            const info = await ytdl.getInfo(newUrl);
            const video = ytdl(newUrl, { filter: 'audioonly' });
            video.pipe(fs.createWriteStream(`${title}.mkv`));
            video.on('end', () => {
                console.log('video downloaded');
                resolve();
            });
        } catch (error) {
            console.error('Error downloading video:', error);
            reject(error);
        }
    });
}
