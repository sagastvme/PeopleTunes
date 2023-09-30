


async function generateResultLinks(test){
    const searchResults = await ytsr(test, {limit: 5});
    let ul = '<ul>';
    searchResults.items.forEach(item => {
        if (item.type !== 'channel') {
            if (item.type === 'video') {
                if (item.duration) {
                    ul += prepareLinkElement(item);
                }
            } else if (item.type === 'shelf') {
                item.items.forEach(item => {
                    if (item.duration) {
                        ul += prepareLinkElement(item);
                    }
                });
            }
        }
    });
    ul += '</ul>';
    return ul;
}

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
function prepareLinkElement(item) {
    const information=`${item.title}, duration: ${item.duration}`
    const link = `/get/${item.id}`;

    return `<li> 
<a href="${link}">
                <img src="${item.bestThumbnail.url}" style="width:100px; height:auto; border-radius:5px;"> 
<p>${information}</p>`;

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
async function customDownload(link, downloadType) {
    return new Promise(async function(resolve, reject) {
        try {
            const info = await ytdl.getInfo(link);
            const title = sanitizeFilename(info.videoDetails.title);
            const filter = downloadType.trim().toLowerCase() === 'audio' ? {filter: 'audioonly',quality: 'highestaudio'} : {filter: 'audioandvideo',quality: 'highestvideo'};
            const fileName = downloadType.trim().toLowerCase() === 'audio' ? `${title}.mp3` : `${title}.mkv`;
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
    const regex = /^https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}$/;

    try {
        new URL(string);
        return regex.test(string);
    } catch (err) {
        return false;
    }
}


function checkForm(downloadType) {
    const downloadTypes = ['audio', 'video'];
    return downloadTypes.includes(downloadType) ;
}

module.exports = {
    isValidUrl,
    checkForm,
    customDownload,
    downloadFromLink,
    lookFor,
    generateResultLinks,
    downloadYTvideo
};