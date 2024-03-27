var zipName = ""
var zipFileName = ""
var currentTextareaStatus

// Function to read zip file content and make the button for them
function readZipFile(file) {
    var zip = new JSZip();
    
    // Read the zip file
    zip.loadAsync(file)
        .then(function(zip) {

            const workSpace = document.getElementById('zipContent');
            while (workSpace.firstChild) workSpace.removeChild(workSpace.firstChild);

            // Access each file in the zip
            zip.forEach(function (relativePath, zipEntry) {
                // Print file name    

                const divItems = document.createElement('button');
                divItems.innerHTML = zipEntry.name
                divItems.setAttribute("onclick","fileContent('"+zipEntry.name+"')");
                console.log(zipEntry.name);
                workSpace.appendChild(divItems);
            });
        });
}

// Functon to present the zip file content to the screen
function readZipFileContent(zipFile, fileName) {
    var zip = new JSZip();

    const workSpace = document.getElementById('value');
    while (workSpace.firstChild) workSpace.removeChild(workSpace.firstChild);

    // Read the zip file
    zip.loadAsync(zipFile)
        .then(function(zip) {
            // Check if the file exists in the zip
            if (zip.files[fileName]) {
                
                // Read the content of the file
                zip.files[fileName].async("string")
                    .then(function(content) {
                        const divItems = document.createElement('textarea');
                        divItems.innerHTML = content;
                        divItems.setAttribute("name","textarea")
                        divItems.setAttribute("id","textarea")
                        divItems.setAttribute("cols","30")
                        divItems.setAttribute("rows","10")
                        if(currentTextareaStatus == null){
                            divItems.readOnly = true
                        }else{
                            divItems.readOnly = currentTextareaStatus;
                        }
                        workSpace.appendChild(divItems);
                    });
            } else {
                console.log("File not found in zip: " + fileName);
            }
        });
}

function editZipFileContent(zipFile, fileName) {
    var modifyzip = new JSZip();

    console.log(zipFile)
    console.log("fileName: ",fileName)

    // Read the zip file
    modifyzip.loadAsync(zipFile)
        .then(function(modifyzip) {
            // Check if the file exists in the zip
            modifyzip.files[fileName].async("string")
                .then(function(content) {
                    textAreaContext = document.getElementById("textarea");
                    content = textAreaContext.value                        
                    console.log(modifyzip.files[fileName].name)
                    console.log(content)
                    modifyzip.file(modifyzip.files[fileName].name, content,{binary:true,base64: true});
            
            });
        });
}

function toggleTextarea(editable) {
    var textarea = document.getElementById("textarea");
    currentTextareaStatus = !editable
    textarea.readOnly = currentTextareaStatus;
}

// Handle file input change event [ When user sends the file ]
function handleFileInputChange(event) {
    var zip = event.target.files[0];
    zipName = zip
    if( ! zip.name.endsWith(".zip")){
        alert("Send in the .zip input file")
    }
    readZipFile(zip);
}

// Handle button action event t read file [ When user want to read the file ]
function fileContent(fileName) {
    zipFileName = fileName
    readZipFileContent(zipName,zipFileName);
}

// Handle file input change event
function changeZipContent() {            
    if(textarea == null){
        alert("First select the file...")
    }
    console.log("123123")
    editZipFileContent(zipName,zipFileName);
    var url = window.URL.createObjectURL(zipName);
    var link = document.createElement("a");
    link.href = url;
    link.download = "modified.zip";
    document.body.appendChild(link);
    link.click();
}
