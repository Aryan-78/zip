let zipName = "";
let zipFileName = "";
let isEditable = false;        // Global mode tracker
let currentFileType = "";      // "text" or "image"

function readZipFile(file) {
    zipName = file;
    const zip = new JSZip();

    zip.loadAsync(file).then(function (zip) {
        const workspace = document.getElementById('zipContent');
        workspace.innerHTML = '';

        zip.forEach(function (relativePath, zipEntry) {
            if (zipEntry.dir) return;

            const fileNameOnly = zipEntry.name.split('/').pop();
            const btn = document.createElement('button');
            btn.innerHTML = `📄 ${fileNameOnly}`;
            btn.onclick = () => fileContent(zipEntry.name);
            workspace.appendChild(btn);
        });
    });
}

function fileContent(fileName) {
    zipFileName = fileName;
    readZipFileContent(zipName, fileName);
}

function readZipFileContent(zipFile, fileName) {
    const container = document.getElementById('value');
    container.innerHTML = '';

    const ext = fileName.split('.').pop().toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext);

    const zip = new JSZip();
    zip.loadAsync(zipFile).then(function (zipData) {
        const file = zipData.files[fileName];
        if (!file) {
            container.innerHTML = `<p style="color:#ff6b6b;padding:20px;">File not found!</p>`;
            return;
        }

        if (isImage) {
            currentFileType = "image";
            file.async("base64").then(base64 => {
                const img = document.createElement('img');
                img.src = `data:image/${ext};base64,${base64}`;
                img.style.maxWidth = "100%";
                img.style.maxHeight = "100%";
                img.style.borderRadius = "12px";
                img.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
                container.appendChild(img);
            });
        } 
        else {
            currentFileType = "text";
            file.async("string").then(content => {
                const textarea = document.createElement('textarea');
                textarea.value = content;
                textarea.id = "textarea";
                textarea.spellcheck = false;
                textarea.readOnly = !isEditable;     // ← Respect current mode
                container.appendChild(textarea);
            });
        }
    });
}

function toggleMode(editable) {
    isEditable = editable;

    // Apply immediately to current textarea if exists
    const textarea = document.getElementById("textarea");
    if (textarea) {
        textarea.readOnly = !isEditable;
    }
}

function changeZipContent() {
    if (!zipFileName) {
        alert("Please select a file first!");
        return;
    }

    if (currentFileType === "image") {
        alert("Image files cannot be edited in this tool.");
        return;
    }

    const textarea = document.getElementById("textarea");
    if (!textarea || textarea.readOnly) {
        alert("You are in View Only mode.\nSwitch to Editable mode to make changes.");
        return;
    }

    const zip = new JSZip();
    zip.loadAsync(zipName).then(function (loadedZip) {
        loadedZip.file(zipFileName, textarea.value);

        loadedZip.generateAsync({ type: "blob" }).then(function (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "modified_" + (zipName.name || "archive.zip");
            link.click();
        });
    });
}

function handleFileInputChange(event) {
    const file = event.target.files[0];
    if (!file || !file.name.toLowerCase().endsWith(".zip")) {
        alert("Please upload a valid .zip file");
        return;
    }
    readZipFile(file);
}