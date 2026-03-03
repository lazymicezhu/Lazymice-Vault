(() => {
  const treeData = window.FILE_TREE;
  const scopedRoot = findDirectoryByName(treeData, "抖音") || treeData;
  const visibleRoot = createVisibleRoot(scopedRoot);
  const treeContainer = document.getElementById("tree-container");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const listingEl = document.getElementById("listing");
  const previewEl = document.getElementById("preview");
  const mediaSourceHintEl = document.getElementById("media-source-hint");
  const refreshBtn = document.getElementById("refresh-btn");
  const RESOURCE_PREFIX = "..";
  const LOCAL_BASE_URL = normalizeBaseUrl(window.LOCAL_ASSET_BASE_URL || "") || normalizeBaseUrl(RESOURCE_PREFIX);
  const ASSET_BASE_URL = normalizeBaseUrl(window.ASSET_BASE_URL || "");

  const videoExt = new Set([".mp4", ".mov", ".m4v"]);
  const audioExt = new Set([".mp3", ".m4a", ".wav", ".flac"]);
  let mediaUnlocked = false;

  let currentDirectory = scopedRoot;
  let currentLineage = [scopedRoot];

  refreshBtn?.addEventListener("click", () => {
    // data.js 是静态文件，刷新页面即可重新载入
    window.location.reload();
  });
  setMediaSourceHint("未选择");

  function renderTree() {
    treeContainer.innerHTML = "";
    const rootList = document.createElement("ul");
    rootList.className = "tree-root";
    const dirs = (visibleRoot.children || []).filter((child) => child.type === "directory");
    dirs.forEach((dir) => {
      rootList.appendChild(createTreeItem(dir, [scopedRoot, dir]));
    });
    treeContainer.appendChild(rootList);
  }

  function createTreeItem(node, lineage) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = node.name;
    button.className = "tree-entry";
    if (node === currentDirectory) {
      button.classList.add("active");
    }
    button.addEventListener("click", () => openDirectory(node, lineage));
    li.appendChild(button);

    const dirs = (node.children || []).filter((child) => child.type === "directory");
    if (dirs.length) {
      const childList = document.createElement("ul");
      dirs.forEach((child) => {
        childList.appendChild(createTreeItem(child, [...lineage, child]));
      });
      li.appendChild(childList);
    }
    return li;
  }

  function openDirectory(node, lineage) {
    currentDirectory = node;
    currentLineage = lineage;
    renderTree();
    renderBreadcrumb();
    renderListing();
    resetPreview();
  }

  function renderBreadcrumb() {
    breadcrumbEl.innerHTML = "";
    const visibleLineage = currentLineage.slice(1);
    const breadcrumbNodes =
      visibleLineage.length > 0
        ? visibleLineage
        : [{ name: "根目录", __isPlaceholder: true, __lineage: [scopedRoot] }];

    breadcrumbNodes.forEach((node, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = node.name || "根目录";
      if (node.__isPlaceholder) {
        button.addEventListener("click", () => openDirectory(scopedRoot, [scopedRoot]));
      } else {
        button.addEventListener("click", () => {
          const path = [scopedRoot, ...visibleLineage.slice(0, index + 1)];
          openDirectory(node, path);
        });
      }
      breadcrumbEl.appendChild(button);
      if (index < breadcrumbNodes.length - 1) {
        const divider = document.createElement("span");
        divider.textContent = "/";
        breadcrumbEl.appendChild(divider);
      }
    });
  }

  function renderListing() {
    listingEl.innerHTML = "";
    const children = currentDirectory.children || [];
    const directories = children.filter((child) => child.type === "directory");
    const files = children.filter((child) => child.type === "file");

    if (!directories.length && !files.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty";
      emptyState.textContent = "该文件夹为空。";
      listingEl.appendChild(emptyState);
      return;
    }

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>名称</th>
          <th>类型</th>
          <th>大小/操作</th>
        </tr>
      </thead>
    `;
    const tbody = document.createElement("tbody");
    directories.forEach((dir) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.textContent = `📁 ${dir.name}`;
      openBtn.addEventListener("click", () => {
        const lineage = [...currentLineage, dir];
        openDirectory(dir, lineage);
      });
      nameCell.appendChild(openBtn);

      const typeCell = document.createElement("td");
      typeCell.textContent = "文件夹";

      const actionCell = document.createElement("td");
      actionCell.textContent = `${(dir.children || []).length} 项`;

      row.appendChild(nameCell);
      row.appendChild(typeCell);
      row.appendChild(actionCell);
      tbody.appendChild(row);
    });

    files.forEach((file) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const previewBtn = document.createElement("button");
      previewBtn.type = "button";
      previewBtn.textContent = file.name;
      previewBtn.addEventListener("click", () => previewFile(file));
      nameCell.appendChild(previewBtn);

      const typeCell = document.createElement("td");
      typeCell.textContent = file.ext ? file.ext.replace(".", "").toUpperCase() : "未知";

      const actionCell = document.createElement("td");
      const sizeText = document.createElement("span");
      sizeText.textContent = formatSize(file.size);
      const spacer = document.createTextNode(" ");
      const downloadLink = document.createElement("a");
      downloadLink.href = buildFileUrl(file.path);
      downloadLink.textContent = "下载";
      downloadLink.setAttribute("download", file.name);
      downloadLink.title = "下载文件";

      actionCell.appendChild(sizeText);
      actionCell.appendChild(spacer);
      actionCell.appendChild(downloadLink);

      row.appendChild(nameCell);
      row.appendChild(typeCell);
      row.appendChild(actionCell);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    listingEl.appendChild(table);
  }

  function previewFile(file) {
    previewEl.innerHTML = "";
    const header = document.createElement("header");
    const title = document.createElement("h3");
    title.textContent = file.name;
    const downloadLink = document.createElement("a");
    const urlCandidates = buildFileUrlCandidates(file.path);
    const fileUrl = urlCandidates[0] || "";
    downloadLink.href = fileUrl;
    downloadLink.textContent = "下载文件";
    downloadLink.setAttribute("download", file.name);
    header.appendChild(title);
    header.appendChild(downloadLink);

    previewEl.appendChild(header);

    if (!fileUrl) {
      const note = document.createElement("p");
      note.textContent = "当前文件没有可用的引用地址。";
      previewEl.appendChild(note);
      return;
    }

    const url = fileUrl;
    setMediaSourceHint(url === urlCandidates[0] ? "本地" : "云端");
    if (videoExt.has(file.ext)) {
      const video = document.createElement("video");
      video.controls = true;
      video.src = url;
      video.className = "player";
      attachFallbackOnError(video, file.path, urlCandidates);
      setupMediaUnlock(video);
      video.addEventListener("loadedmetadata", () => {
        if (video.videoWidth && video.videoHeight) {
          video.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
        }
      });
      previewEl.appendChild(video);
    } else if (audioExt.has(file.ext)) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = url;
      audio.className = "player";
      attachFallbackOnError(audio, file.path, urlCandidates);
      setupMediaUnlock(audio);
      previewEl.appendChild(audio);
    } else if (file.ext === ".pdf") {
      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.className = "player";
      attachFallbackOnError(iframe, file.path, urlCandidates);
      previewEl.appendChild(iframe);
    } else {
      const note = document.createElement("p");
      note.textContent = "当前格式暂不支持在线预览，可直接下载。";
      previewEl.appendChild(note);
    }
  }

  function resetPreview() {
    previewEl.innerHTML = "";
    const placeholder = document.createElement("div");
    placeholder.className = "placeholder";
    placeholder.textContent = "请选择一个文件即可在此处预览。";
    previewEl.appendChild(placeholder);
  }

  function formatSize(bytes) {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB"];
    let size = bytes / 1024;
    for (const unit of units) {
      if (size < 1024) {
        return `${size.toFixed(1)} ${unit}`;
      }
      size /= 1024;
    }
    return `${size.toFixed(1)} TB`;
  }

  function buildFileUrl(relativePath) {
    return buildFileUrlCandidates(relativePath)[0] || "";
  }

  function buildFileUrlCandidates(relativePath) {
    if (!relativePath) {
      return [LOCAL_BASE_URL || RESOURCE_PREFIX];
    }

    const normalizedPath = String(relativePath).replace(/^\/+/, "");
    const encodedPath = encodePathSegments(normalizedPath);
    const localUrl = joinUrl(LOCAL_BASE_URL || RESOURCE_PREFIX, encodedPath);
    if (!ASSET_BASE_URL || ASSET_BASE_URL === LOCAL_BASE_URL) {
      return [localUrl];
    }
    const assetUrl = joinUrl(ASSET_BASE_URL, encodedPath);
    return [localUrl, assetUrl];
  }

  function normalizeBaseUrl(baseUrl) {
    if (!baseUrl) return "";
    return String(baseUrl).replace(/\/+$/, "");
  }

  function encodePathSegments(path) {
    return String(path)
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  function joinUrl(baseUrl, path) {
    const base = String(baseUrl || "");
    const rel = String(path || "");
    try {
      const normalizedBase = base.endsWith("/") ? base : `${base}/`;
      return new URL(rel, normalizedBase).toString();
    } catch {
      return `${base.replace(/\/+$/, "")}/${rel.replace(/^\/+/, "")}`;
    }
  }

  function attachFallbackOnError(mediaElement, path, candidates) {
    if (!Array.isArray(candidates) || candidates.length < 2) return;
    let currentIndex = 0;
    mediaElement.addEventListener("error", () => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= candidates.length) return;
      const nextUrl = candidates[nextIndex];
      currentIndex = nextIndex;
      mediaElement.src = nextUrl;
      if (typeof mediaElement.load === "function") {
        mediaElement.load();
      }
      if (mediaElement.tagName === "VIDEO" || mediaElement.tagName === "AUDIO") {
        mediaElement.play().catch(() => {});
      }
      setMediaSourceHint("云端");
    });
  }

  function setMediaSourceHint(source) {
    if (!mediaSourceHintEl) return;
    mediaSourceHintEl.textContent = `当前媒体来源：${source}`;
  }

  function setupMediaUnlock(media) {
    media.muted = false;
    if (typeof media.volume === "number") {
      media.volume = 1;
    }

    if (mediaUnlocked) {
      return;
    }

    const unlockBtn = document.createElement("button");
    unlockBtn.type = "button";
    unlockBtn.className = "unlock-audio-btn";
    unlockBtn.textContent = "点击播放（解锁音量）";

    const hideButton = () => {
      unlockBtn.remove();
    };

    unlockBtn.addEventListener("click", async () => {
      try {
        media.muted = false;
        media.volume = 1;
        await media.play();
        mediaUnlocked = true;
        hideButton();
      } catch {
        unlockBtn.textContent = "播放被拦截，请再点一次";
      }
    });

    media.addEventListener(
      "play",
      () => {
        media.muted = false;
        media.volume = 1;
        mediaUnlocked = true;
        hideButton();
      },
      { once: true }
    );

    previewEl.appendChild(unlockBtn);
  }

  function findDirectoryByName(node, name) {
    if (!node || node.type !== "directory") return null;
    const children = node.children || [];
    return children.find((child) => child.type === "directory" && child.name === name) || null;
  }

  function createVisibleRoot(node) {
    return {
      type: "directory",
      name: "",
      path: "",
      children: node?.children || []
    };
  }

  openDirectory(scopedRoot, [scopedRoot]);
})();
