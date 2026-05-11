let zipName = "";
let zipFileName = "";
let isEditable = false;        // Global mode tracker
let currentFileType = "";      // "text" or "image"
let selectedRow = null;        // Currently selected file row in the tree

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];

function isImageFile(name) {
    const ext = name.split('.').pop().toLowerCase();
    return IMAGE_EXTS.includes(ext);
}

function buildTree(zip) {
    const root = { name: '', type: 'folder', fullPath: '', children: {} };

    zip.forEach(function (relativePath, zipEntry) {
        const parts = relativePath.split('/').filter(Boolean);
        let node = root;

        parts.forEach((part, idx) => {
            const isLast = idx === parts.length - 1;
            const isFile = isLast && !zipEntry.dir;

            if (!node.children[part]) {
                node.children[part] = {
                    name: part,
                    type: isFile ? 'file' : 'folder',
                    fullPath: isFile ? relativePath : parts.slice(0, idx + 1).join('/') + '/',
                    children: {}
                };
            }
            node = node.children[part];
        });
    });

    return root;
}

function sortedChildren(node) {
    return Object.values(node.children).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
}

function renderTree(node, parentEl, depth) {
    sortedChildren(node).forEach(child => {
        if (child.type === 'folder') {
            const row = document.createElement('div');
            row.className = 'tree-item tree-folder';
            row.style.paddingLeft = `${depth * 16 + 8}px`;
            row.innerHTML = `
                <i class="fas fa-chevron-right tree-chevron"></i>
                <i class="fas fa-folder tree-icon folder-icon"></i>
                <span class="tree-name"></span>
            `;
            row.querySelector('.tree-name').textContent = child.name;

            const childWrap = document.createElement('div');
            childWrap.className = 'tree-children collapsed';
            renderTree(child, childWrap, depth + 1);

            row.addEventListener('click', (e) => {
                e.stopPropagation();
                const collapsed = childWrap.classList.toggle('collapsed');
                row.querySelector('.tree-chevron').classList.toggle('rotated', !collapsed);
                const folderIcon = row.querySelector('.folder-icon');
                folderIcon.classList.toggle('fa-folder', collapsed);
                folderIcon.classList.toggle('fa-folder-open', !collapsed);
            });

            parentEl.appendChild(row);
            parentEl.appendChild(childWrap);
        } else {
            const row = document.createElement('div');
            row.className = 'tree-item tree-file';
            row.style.paddingLeft = `${depth * 16 + 8}px`;
            const icon = isImageFile(child.name) ? 'fa-image' : 'fa-file-lines';
            row.innerHTML = `
                <span class="tree-chevron-spacer"></span>
                <i class="fas ${icon} tree-icon file-icon"></i>
                <span class="tree-name"></span>
            `;
            row.querySelector('.tree-name').textContent = child.name;
            row.addEventListener('click', (e) => {
                e.stopPropagation();
                if (selectedRow) selectedRow.classList.remove('selected');
                row.classList.add('selected');
                selectedRow = row;
                fileContent(child.fullPath);
            });
            parentEl.appendChild(row);
        }
    });
}

function readZipFile(file) {
    zipName = file;
    zipFileName = "";
    currentFileType = "";
    selectedRow = null;
    document.getElementById('value').innerHTML = '';

    const zip = new JSZip();

    zip.loadAsync(file).then(function (zip) {
        const workspace = document.getElementById('zipContent');
        workspace.innerHTML = '';

        const tree = buildTree(zip);
        renderTree(tree, workspace, 0);
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
    const isImage = isImageFile(fileName);

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
