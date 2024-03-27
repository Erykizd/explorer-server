let folderPathTag = document.getElementById("folderPath");
let currentURL = window.location.href;

setup();

function setup()
{
    getScriptFolderPath()
        .then((data) =>
        {
            setLinks(encodeURIComponent(folderPathTag.innerText));
            folderPathTag.innerText = decodeURIComponent(folderPathTag.innerText);
        })
        .catch((err) =>
        {
            console.error("Error:", err);
        });
    document.getElementById("up").addEventListener("click", ()=>
    {
        let path = folderPathTag.innerText;
        let pathParts = path.split("\\");
        pathParts.pop();
        path = pathParts.join("\\");
        if(path.length>0)
        {
            setLinks(path);
        }
    })

    setupSelectTag();
}

function getScriptFolderPath()
{
    return new Promise((resolve, reject) =>
    {
        folderPathTag = document.getElementById("folderPath");

        sendPathRequest("", "getscriptfolderpath", "/")
            .then((data) =>
            {
                folderPathTag.innerText = data.toString().replaceAll("/","\\");
                resolve(data);
            })
            .catch(err =>
            {
                console.error(err);
                reject(err);
            });
    });
}


function setLinks(path)
{
    folderPathTag.innerText = path;
    clearLinks();
    path = path.toString().replaceAll("\\", "/");
    if(path.length == 2) //if drive letter
    {
        path+="/";
    }
    sendPathRequest("","explore" ,path)
        .then((data) =>
        {
            let linkName = "";
            let href = "";

            for (let i = 0; i < data.length; i++)
            {
                linkName = data[i];
                href = "\\" + data[i];
                addLink(linkName, href);
            }
        })
        .catch(err => {console.error(err)});
}

function openFile(path)
{
    path = path.toString().replaceAll("\\", "/");
    let request = "/?path=" + path + "&action=openfile";
    let win = window.open(request);
}

function clearLinks()
{
    let unorderedList = document.getElementById("links");
    unorderedList.innerHTML = "";
}

function addLink(linkName, href)
{
    let unorderedList = document.getElementById("links");
    let listItem = document.createElement("li");
    let button = document.createElement("button");

    if(href.toString().includes("."))
    {
        //link to file
        button.addEventListener("click", ()=>
        {
            let path = encodeURIComponent(folderPathTag.innerText + href.toString());
            openFile(path);
        });
    }
    else
    {
        //link to directory
        button.addEventListener("click", ()=>
        {
            folderPathTag.innerText += encodeURIComponent(href.toString());
            setLinks(folderPathTag.innerText);
            folderPathTag.innerText = decodeURIComponent(folderPathTag.innerText);
        });
    }
    button.innerText = linkName;

    listItem.appendChild(button);
    unorderedList.appendChild(listItem);
}

function sendPathRequest(beforeParams, action, path)
{
    let parts = currentURL.split("/");
    let baseAddress = parts[0] + "/" + parts[2] + "/";

    return fetch(baseAddress + beforeParams + '?path=' + path + '&action=' + action)
        .then(response =>
        {
            if (!response.ok)
            {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data =>
        {
            return data;
        })
        .catch(error =>
        {
            console.error('Error while sending request: ', error);
            throw error;
        });
}

function changeDrive(driveLetter)
{
    setLinks(driveLetter.toString().toUpperCase()+":");
}

function setupSelectTag()
{
    let selectTag = document.getElementById("selectDrive");

    let character = '@';

    for (let i = 0; i < 26; i++)
    {
        character = String.fromCharCode(character.charCodeAt(0) + 1);
        let option = document.createElement("option");
        option.value = character;
        option.innerText = character;
        selectTag.appendChild(option);
    }

    selectTag.value = folderPathTag.innerText.charAt(0);

    selectTag.addEventListener("change", ()=>
    {
        changeDrive(selectTag.value);
    });
}
