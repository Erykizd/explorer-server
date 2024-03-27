const http = require('http');
const fs = require('fs');
const pathlib = require("path");

const scriptPath = process.cwd();
const system = process.platform;

console.log("Welcome in explorer server");
console.log("Serve's script is located at: ");
console.log(scriptPath);
console.log("and is running on system: " + system);

let basePath = scriptPath;

const server = http.createServer((request, response) => 
{
  const parsedUrl = getRequestParams(request.url, true);

  console.log("url");
  console.log(request.url);
  console.log("parsedUrl");
  console.log(parsedUrl);

  if (request.url == '/index' || request.url == '')
  {
    let file = readFile( pathlib.join(scriptPath, 'index.html'));
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html');
    response.end(file);
  }
  else if (request.url == '/script')
  {
    let file = readFile( pathlib.join(scriptPath, 'script.js'));
    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/javascript');
    response.end(file);
  }
  else if (request.url == '/style')
  {
    let file = readFile( pathlib.join(scriptPath, 'style.css'));
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/css');
    response.end(file);
  }
  else if (request.url == '/favicon.ico')
  {
    let file = readFileWithBuffer( pathlib.join(scriptPath, 'favicon.ico'), response);
    response.statusCode = 200;
    response.setHeader('Content-Type', 'image/x-icon');
  }
  else if (parsedUrl.action && parsedUrl.action == 'openfile')
  {
    let filePath = decodeURIComponent(parsedUrl.path);
    console.log("file path");
    console.log(filePath);
    readFileWithBuffer(filePath, response);
  }
  else if(parsedUrl.action && parsedUrl.action == 'getscriptfolderpath')
  {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(scriptPath));
  }
  else if (parsedUrl.action && parsedUrl.action == 'explore')
  {
    basePath = decodeURIComponent(parsedUrl.path);
    if(system == "win32")
    {
      basePath = basePath.replaceAll("/","\\");
    }
    getFilesInFolder(basePath, (err, files) =>
    {
      if (err)
      {
        console.error('Error while reading directory', err);
        response.statusCode = 500;
        response.setHeader('Content-Type', 'text/plain');
        response.end('Error while reading directory');
        return;
      }
      response.statusCode = 200;
      response.setHeader('Content-Type', 'application/json');
      console.log("basePath");
      console.log(basePath);
      response.end(JSON.stringify(files));
    });
  }
  else if (request.url.startsWith('/')
      && request.url.includes(".")
      && !request.url.endsWith("action")
      && !request.url.endsWith("path"))
  {
    let path = basePath + "\\" + request.url.substring(1);
    path = path.replaceAll("/", "\\");
    console.log(path);
    let file = readFile(path);
    response.statusCode = 200;
    if(path.endsWith(".html"))
    {
      response.setHeader('Content-Type', 'text/html');
    }
    else if(path.endsWith(".js"))
    {
      response.setHeader('Content-Type', 'text/js');
    }
    else if(path.endsWith(".css"))
    {
      response.setHeader('Content-Type', 'text/css');
    }
    else
    {
      response.setHeader('Content-Type', 'text/plain');
    }
    response.end(file);
  }
  else 
  {
    console.log(request.url);
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Nie znaleziono strony');
  }
});

server.listen(3000, () => 
{
  console.log('Server is running on port 3000');
});

function readFile(path)
{
  if(system != "win32")
  {
    path = path.replaceAll("\\", "/")
  }
  try
  {
    const fileContent = fs.readFileSync(path, 'utf8');
    return fileContent;
  }
  catch (error)
  {
    console.error('Error while reading file:', error);
    return null;
  }
}

function readFileWithBuffer(filePath, response)
{
  if (system != "win32")
  {
    filePath = filePath.replaceAll("\\", "/");
  }
  try
  {
    // check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) =>
    {
      if (err)
      {
        // File does not exist - return code 404
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('File doesn\'t exist');
        return;
      }

      // File exists - write file's content as response
      const fileStream = fs.createReadStream(filePath);

      let contentType = getContentType(filePath);
      // Set headers according to type of file
      response.setHeader('Content-Type', contentType);
      response.setHeader('Content-Disposition', 'inline');

      // Give content of file to response stream
      fileStream.pipe(response);
    });
  }
  catch (error)
  {
    console.error('Error while reading file:', error);
    return null;
  }
}

function getFilesInFolder(folderPath, callback)
{
  if(system != "win32")
  {
    folderPath = folderPath.replaceAll("\\", "/")
  }
  fs.readdir(folderPath, (err, files) =>
  {
    if (err)
    {
      console.error('Error while reading directory', err);
      callback(err, null);
      return;
    }

    callback(null, files);
  });
}

function getRequestParams(urlStr)
{
  let params = {};
  let paramsStr = "";
  let paramsArray = [];

  for (let i = 0; i < urlStr.toString().length; i++)
  {
    if(urlStr.toString().charAt(i) === '?')
    {
      paramsStr = urlStr.toString().substring(i+1, urlStr.toString().length);
      break;
    }
  }
  paramsArray = paramsStr.split('&');
  for (let i = 0; i < paramsArray.length; i++)
  {
    params[paramsArray[i].split('=')[0]] = paramsArray[i].split('=')[1];
  }

  return params
}

function getContentType(filePath)
{
  if(filePath.toString().endsWith(".html"))
  {
    return "text/html; charset=utf-8";
  }
  else if(filePath.toString().endsWith(".js"))
  {
    return "application/javascript; charset=utf-8";
  }
  else if(filePath.toString().endsWith(".css"))
  {
    return "text/css; charset=utf-8";
  }
  else if(filePath.toString().endsWith(".jpg")
          || filePath.toString().endsWith(".jpeg"))
  {
    return "image/jpeg";
  }
  else if(filePath.toString().endsWith(".png"))
  {
    return "image/png";
  }
  else if(filePath.toString().endsWith(".gif"))
  {
    return "image/gif";
  }
  else if(filePath.toString().endsWith(".svg"))
  {
    return "image/svg+xml";
  }
  else if(filePath.toString().endsWith(".ico"))
  {
    return "image/x-icon";
  }
  else if(filePath.toString().endsWith(".mp3"))
  {
    return "audio/mpeg";
  }
  else if(filePath.toString().endsWith(".wav"))
  {
    return "audio/wav";
  }
  else if(filePath.toString().endsWith(".ogg"))
  {
    return "video/ogg";
  }
  else if(filePath.toString().endsWith(".mpeg")
          || filePath.toString().endsWith(".mpg"))
  {
    return "video/mpeg";
  }
  else if(filePath.toString().endsWith(".mp4"))
  {
    return "video/mp4";
  }
  else if(filePath.toString().endsWith(".webm"))
  {
    return "video/webm";
  }
  else if(filePath.toString().endsWith(".pdf"))
  {
    return "application/pdf";
  }
  else if(filePath.toString().endsWith(".doc")
          || filePath.toString().endsWith(".docx"))
  {
    return "application/msword";
  }
  else if(filePath.toString().endsWith(".xls")
          || filePath.toString().endsWith(".xlsx"))
  {
    return "application/vnd.ms-excel";
  }
  else if(filePath.toString().endsWith(".ppt")
          || filePath.toString().endsWith(".pptx"))
  {
    return "application/vnd.ms-powerpoint";
  }
  else if(filePath.toString().endsWith(".odt"))
  {
    return "application/vnd.oasis.opendocument.text";
  }
  else if(filePath.toString().endsWith(".xml"))
  {
    return "application/xml";
  }
  else if(filePath.toString().endsWith(".rss"))
  {
    return "application/rss+xml";
  }
  else if(filePath.toString().endsWith(".zip"))
  {
    return "application/zip";
  }
  else if(filePath.toString().endsWith(".gz"))
  {
    return "application/gzip";
  }
  else if(filePath.toString().endsWith(".tar"))
  {
    return "application/x-tar";
  }
  else if(filePath.toString().endsWith(".7z"))
  {
    return "application/x-7z-compressed";
  }
  else if(filePath.toString().endsWith(".ttf"))
  {
    return "font/ttf";
  }
  else if(filePath.toString().endsWith(".otf"))
  {
    return "font/otf";
  }
  else if(filePath.toString().endsWith(".woff"))
  {
    return "font/woff";
  }
  else if(filePath.toString().endsWith(".woff2"))
  {
    return "font/woff2";
  }
  else if(filePath.toString().endsWith(".json"))
  {
    return "application/json";
  }
  else if(filePath.toString().endsWith(".mjs"))
  {
    return "application/javascript";
  }
  else if(filePath.toString().endsWith(".ws"))
  {
    return "application/websocket";
  }
  else if(filePath.toString().endsWith(".torrent"))
  {
    return "application/x-bittorrent";
  }
  else if(filePath.toString().endsWith(".jar"))
  {
    return "application/java-archive";
  }
  else if(filePath.toString().endsWith(".java"))
  {
    return "text/x-java-sourc";
  }
  else if(filePath.toString().endsWith(".cpp"))
  {
    return "text/x-c++src";
  }
  else if(filePath.toString().endsWith(".c"))
  {
    return "text/x-csrc";
  }
  else if(filePath.toString().endsWith(".py"))
  {
    return "text/x-python";
  }
  else if(filePath.toString().endsWith(".cs"))
  {
    return "text/x-csharp";
  }
  else
  {
    return "text/plain; charset=utf-8";
  }
}
