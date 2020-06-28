<template>
<!-- TODO: Implement web workers to offload processing of list 'updates' when changes are being made when the user excludes an extension or something. -->
<!-- TODO: Change item buttons to appear on top of each element rather than slide out from underneath || have the slideout not impact the height of the element (somehow), thereby not causing a scroll of all elements and resulting lag -->
  <div>
    <ul class="list-group">
      <li
        class="list-group-item"
        @mouseover="$data.selectionContainer.hover = true"
        @mouseleave="$data.selectionContainer.hover = false"
        :class="{ active: $data.selectionContainer.hover }"
      >
        <div class="row align-items-start">
          <div class="col-1">
            <div class="fiv-sqo fiv-icon-folder fiv-size-md"></div>
          </div>
          <div class="col-11">
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">
                Directory: {{ $data.selectionContainer.title }}
              </h5>
              <small
                class="sizeIdentifier"
                v-if="$data.selectionContainer.path.length > 0"
                >{{ this.$data.fileCount }} files,
                {{
                  fileSizer(this.$data.fileSize)
                }}</small
              >
            </div>
            <div
              class="pathContainer mb-1 text-left"
              v-if="$data.selectionContainer.path.length > 0"
            >
              <small>{{ $data.selectionContainer.path }}</small>
            </div>
            <div
              class="dropDown-Container"
              v-bind:class="{
                'dropDown-Container-Active': $data.selectionContainer.hover
              }"
            >
              <div
                class="d-flex w-100 justify-content-between dropDown"
                v-bind:class="{
                  dropdownActive: $data.selectionContainer.hover
                }"
              >
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm"
                  v-on:click="clearSelection()"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm"
                  v-on:click="clearFilters()"
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm"
                  v-on:click="selectDir()"
                >
                  Load From Directory
                </button>
              </div>
            </div>
          </div>
        </div>
      </li>
      <!-- List Divider -->
      <li>
        <div style="background-color:rgba(19, 20, 79, .4); width: 100%; height: 3px; margin: 0px; padding: 0px;" v-if="!$data.scanning" class="listDivider"></div>
        <b-progress style="height: 6px; margin: 0px; padding: 0px;" :value="value" :max="max" class="listDivider" v-if="$data.scanning" animated></b-progress>
      </li>

      <li
        v-for="(file, index) in $data[this.storageLocation]"
        :key="index"
        class="list-group-item flex-column align-items-start"
        @mouseover="file.hover = true"
        @mouseleave="file.hover = false"
        :class="{ active: file.hover, disabled: file.disabled }"
      >
        <div class="row align-items-start">
          <div class="col-1">
            <div
              class="fiv-sqo"
              :class="file.disabled ? file.icon.small : file.icon.normal"
            ></div>
          </div>
          <div class="col-11">
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1 titleLimit">{{ file.fileName }}</h5>
              <small class="sizeIdentifier">{{ fileSizer(file.size) }}</small>
            </div>
            <div class="pathContainer mb-1 text-left" v-if="!file.disabled">
              <small><p class="pathLimit">{{ file.path }}</p></small>
            </div>
            <div
              class="dropDown-Container"
              v-bind:class="{ 'dropDown-Container-Active': file.hover }"
            >
              <div
                class="d-flex w-100 justify-content-between dropDown"
                v-bind:class="{ dropdownActive: file.hover }"
              >
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm"
                  @mousedown="addBlackFile(file.fileName)"
                >
                  Ignore File
                </button>
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm"
                  @mousedown="addBlackExt(file.extension)"
                >
                  Ignore All {{ file.extension }}
                </button>
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm"
                  @mousedown="addWhiteExt(file.extension)"
                >
                  Only Select {{ file.extension }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </li>
            <!-- List Divider -->
      <li>
        <div
          style="height:3px; background-color:rgba(19, 20, 79, .4); width:100%"
          v-if="$data.selectionContainer.path.length > 0 && !$data.scanning"
        ></div>
      </li>

      <!-- Load more items Button -->
      <!-- TODO -->

    </ul>
    <div class="pagination d-inline-flex" v-if="$data[this.storageLocation].length > 0">
      <button type="button" class="btn btn-outline-secondary paginationButton" @mousedown="prevPage()">&laquo; Prev</button>
      <h6 class="mb-1 justify-content-center align-self-center ml-3 mr-3">Page {{$data.currentPage}} of {{Math.ceil($data.fileCount/100)}}</h6>
      <button type="button" class="btn btn-outline-secondary paginationButton" @mousedown="nextPage()">Next &raquo;</button>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "scrollableList",
  data: function() {
    return {
      [this.storageLocation]: [],
      blackFiles: [],
      scanning: false,
      value: 1,
      max: 1,
      whiteFiles: [],
      currentPage: 1,
      fileSize: 0,
      fileCount: 0,
      selectionContainer: {
        hover: false,
        title: "No Selection",
        path: ""
      },
      availableIcons: [
        "3g2",
        "3ga",
        "3gp",
        "7z",
        "aa",
        "aac",
        "ac",
        "accdb",
        "accdt",
        "adn",
        "ai",
        "aif",
        "aifc",
        "aiff",
        "ait",
        "amr",
        "ani",
        "apk",
        "app",
        "applescript",
        "asax",
        "asc",
        "ascx",
        "asf",
        "ash",
        "ashx",
        "asmx",
        "asp",
        "aspx",
        "asx",
        "au",
        "aup",
        "avi",
        "axd",
        "aze",
        "bak",
        "bash",
        "bat",
        "bin",
        "blank",
        "bmp",
        "bowerrc",
        "bpg",
        "browser",
        "bz2",
        "c",
        "cab",
        "cad",
        "caf",
        "cal",
        "cd",
        "cer",
        "cfg",
        "cfm",
        "cfml",
        "cgi",
        "class",
        "cmd",
        "codekit",
        "coffee",
        "coffeelintignore",
        "com",
        "compile",
        "conf",
        "config",
        "cpp",
        "cptx",
        "cr2",
        "crdownload",
        "crt",
        "crypt",
        "cs",
        "csh",
        "cson",
        "csproj",
        "css",
        "csv",
        "cue",
        "dat",
        "db",
        "dbf",
        "deb",
        "dgn",
        "dist",
        "diz",
        "dll",
        "dmg",
        "dng",
        "doc",
        "docb",
        "docm",
        "docx",
        "dot",
        "dotm",
        "dotx",
        "download",
        "dpj",
        "ds_store",
        "dtd",
        "dwg",
        "dxf",
        "editorconfig",
        "el",
        "enc",
        "eot",
        "eps",
        "epub",
        "eslintignore",
        "exe",
        "f4v",
        "fax",
        "fb2",
        "fla",
        "flac",
        "flv",
        "folder",
        "gadget",
        "gdp",
        "gem",
        "gif",
        "gitattributes",
        "gitignore",
        "go",
        "gpg",
        "gz",
        "h",
        "handlebars",
        "hbs",
        "heic",
        "hs",
        "hsl",
        "htm",
        "html",
        "ibooks",
        "icns",
        "ico",
        "ics",
        "idx",
        "iff",
        "ifo",
        "image",
        "img",
        "in",
        "indd",
        "inf",
        "ini",
        "iso",
        "j2",
        "jar",
        "java",
        "jpe",
        "jpeg",
        "jpg",
        "js",
        "json",
        "jsp",
        "jsx",
        "key",
        "kf8",
        "kmk",
        "ksh",
        "kup",
        "less",
        "lex",
        "licx",
        "lisp",
        "lit",
        "lnk",
        "lock",
        "log",
        "lua",
        "m",
        "m2v",
        "m3u",
        "m3u8",
        "m4",
        "m4a",
        "m4r",
        "m4v",
        "map",
        "master",
        "mc",
        "md",
        "mdb",
        "mdf",
        "me",
        "mi",
        "mid",
        "midi",
        "mk",
        "mkv",
        "mm",
        "mo",
        "mobi",
        "mod",
        "mov",
        "mp2",
        "mp3",
        "mp4",
        "mpa",
        "mpd",
        "mpe",
        "mpeg",
        "mpg",
        "mpga",
        "mpp",
        "mpt",
        "msi",
        "msu",
        "nef",
        "nes",
        "nfo",
        "nix",
        "npmignore",
        "odb",
        "ods",
        "odt",
        "ogg",
        "ogv",
        "ost",
        "otf",
        "ott",
        "ova",
        "ovf",
        "p12",
        "p7b",
        "pages",
        "part",
        "pcd",
        "pdb",
        "pdf",
        "pem",
        "pfx",
        "pgp",
        "ph",
        "phar",
        "php",
        "pkg",
        "pl",
        "plist",
        "pm",
        "png",
        "po",
        "pom",
        "pot",
        "potx",
        "pps",
        "ppsx",
        "ppt",
        "pptm",
        "pptx",
        "prop",
        "ps",
        "ps1",
        "psd",
        "psp",
        "pst",
        "pub",
        "py",
        "pyc",
        "qt",
        "ra",
        "ram",
        "rar",
        "raw",
        "rb",
        "rdf",
        "resx",
        "retry",
        "rm",
        "rom",
        "rpm",
        "rsa",
        "rss",
        "rtf",
        "ru",
        "rub",
        "sass",
        "scss",
        "sdf",
        "sed",
        "sh",
        "sitemap",
        "skin",
        "sldm",
        "sldx",
        "sln",
        "sol",
        "sql",
        "sqlite",
        "step",
        "stl",
        "svg",
        "swd",
        "swf",
        "swift",
        "sys",
        "tar",
        "tcsh",
        "tex",
        "tfignore",
        "tga",
        "tgz",
        "tif",
        "tiff",
        "tmp",
        "torrent",
        "ts",
        "tsv",
        "ttf",
        "twig",
        "txt",
        "udf",
        "vb",
        "vbproj",
        "vbs",
        "vcd",
        "vcs",
        "vdi",
        "vdx",
        "vmdk",
        "vob",
        "vscodeignore",
        "vsd",
        "vss",
        "vst",
        "vsx",
        "vtx",
        "war",
        "wav",
        "wbk",
        "webinfo",
        "webm",
        "webp",
        "wma",
        "wmf",
        "wmv",
        "woff",
        "woff2",
        "wps",
        "wsf",
        "xaml",
        "xcf",
        "xlm",
        "xls",
        "xlsm",
        "xlsx",
        "xlt",
        "xltm",
        "xltx",
        "xml",
        "xpi",
        "xps",
        "xrb",
        "xsd",
        "xsl",
        "xspf",
        "xz",
        "yaml",
        "yml",
        "z",
        "zip",
        "zsh"
      ]
    };
  },
  props: {
    storageLocation: String,
    title: {
      type: String,
      default: "Directory Selection"
    }
  },
  methods: {
    fileSizer: function(bytes, decimals = 1) {
      if (bytes === 0) return "0 Bytes";
      let k = 1024;
      let dm = decimals < 0 ? 0 : decimals;
      let sizes = ["Bytes", "kb", "mb", "gb", "tb", "pb", "eb", "zb", "yb"];
      let i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    },
    clearFilters: function() {
      this.$data.blackFiles = [];
      this.$data.whiteFiles = [];
      this.$data[this.storageLocation] = this.$data[this.storageLocation].map(
        file => {
          file.disabled = false;
          return file;
        }
      );
    },
    createMasterRegex: (regexArray = []) => new RegExp(regexArray.reduce((result, current) => result += `(${current.source})|`, '').slice(0, -1), 'gi'),
    applyFilters: function() {
      let blackRegex = this.createMasterRegex(this.$data.blackFiles);
      let whiteRegex = this.createMasterRegex(this.$data.whiteFiles);
      this.$data[this.storageLocation] = this.$data[this.storageLocation].map(file => {
        if (file.fileName.match(blackRegex) && this.$data.blackFiles.length > 0) file.disabled = true;
        if (!(file.fileName.match(whiteRegex)) && this.$data.whiteFiles.length > 0) file.disabled = true;
        return file;
      })
    },
    addBlackExt: function(ext) {
      let regex = new RegExp(`^.*\.(${ext.replace(".", "").toLowerCase()}|${ext.replace(".", "").toUpperCase()})$`
      );
      this.$data.blackFiles.push(regex);
      this.applyFilters()
    },
    addBlackFile: function(file) {
      let regex = new RegExp(`${file}`);
      this.$data.blackFiles.push(regex);
      this.applyFilters();
    },
    addWhiteExt: function(ext) {
      let regex = new RegExp(
        `^.*\.(${ext.replace(".", "").toLowerCase()}|${ext
          .replace(".", "")
          .toUpperCase()})$`
      );
      this.$data.whiteFiles.push(regex);
      this.applyFilters();
    },
    scanDir: function() {
      let config = {
        id: this.storageLocation,
        dbID: this.storageLocation + '_no_edit',
        parentDirectory: this.$data.selectionContainer.path
      };
      this.$data.scanning = true;
      ipcRenderer.send("scanDir", config);
    },
    selectDir: function(title) {
      if (title === undefined) title = "Select a directory to load: ";
      ipcRenderer.send("selectDir", { title: title, id: this.storageLocation });
    },
    clearSelection: function() {
      this.$data[this.storageLocation] = [];
      this.$data.blackFiles = [];
      this.$data.whiteFiles = [];
      this.$data.fileSize = 0;
      this.$data.fileCount = 0;
      this.$data.selectionContainer.title = "No Selection";
      this.$data.selectionContainer.path = "";
      ipcRenderer.send('clearFiles', {id: this.storageLocation, dbID: this.storageLocation+ '_no_edit'});//Clear db.
      ipcRenderer.send('clearFiles', {id: this.storageLocation, dbID: this.storageLocation+ '_edit'});//Clear db.
    },
    updateFiles: function(newFiles) {
      let updatedFiles = newFiles.map(file => {
        file.hover = false;
        file.disabled = false;
        let extension = file.extension.replace(".", "").toLowerCase();
        file.icon = {
          normal: this.$data.availableIcons.includes(extension)
            ? `fiv-size-md fiv-icon-${extension}`
            : "defaultIcon", //Icon
          small: this.$data.availableIcons.includes(extension)
            ? `fiv-size-sm fiv-icon-${extension}`
            : "defaultIconSmall" //Smaller Icon
        };
        return file;
      });
      this.$data[this.storageLocation] = updatedFiles;
    },
    onDirScanned: function(event, args) {
      if (args.id !== this.storageLocation) return; //Not for us.
      this.$data.scanning = false;
      this.updateFiles(args.result);
      this.$data.fileCount = args.count;
      this.$data.fileSize = args.size;
    },
    onDirChecked: function(event, args) {
      if (args.id !== this.storageLocation) return; //Not for us.
      console.log(args);
    },
    onDirSelected: function(event, args) {
      if (args.id !== this.storageLocation) return; //Not for us.
      if (args.canceled) return; //Got canceled.
      this.$data.selectionContainer.path = args.filePaths[0];
      this.$data.selectionContainer.title = args.filePaths[0].match(
        /([^\\\\]*)\\*$/
      )[1];
      this.scanDir();
    },
    onFilesCollected: function(event, args) {
      if(args.id !== this.storageLocation) return; //Not for us.
      this.updateFiles(args.result);
      this.applyFilters();
    },
    getFilter: function(event, args) {
      args.id = this.storageLocation;
      args.blackNames = this.$data.blackFiles;
      args.whiteNames = this.$data.whiteFiles;
      ipcRenderer.send('filters', args);
    },
    getItems: function(offSet) {
      ipcRenderer.send('getFiles', {
        id: this.storageLocation, //Our id
        dbID: this.storageLocation + '_no_edit', //Db to get items from.
        count: 100, //Get 100 items.
        offset: offSet
      })
    },
    prevPage: function() {
      if (this.$data.currentPage === 1) return; //Check that the limit is alg.
      this.$data.currentPage--; //Decrease current page limit by 1.
      this.getItems(this.$data.currentPage * 100 - 100);
    },
    nextPage: function() { 
      if (this.$data.currentPage === Math.ceil(this.$data.fileCount/100)) return; //Check that the limit is alg.
      this.$data.currentPage++; //Increase current page by 1.
      this.getItems(this.$data.currentPage * 100 - 100);
    }
  },
  beforeCreate() {
    //Things
  },
  mounted() {
    ipcRenderer.on("dirScanned", this.onDirScanned);
    ipcRenderer.on("dirChecked", this.onDirChecked);
    ipcRenderer.on("dirSelected", this.onDirSelected);
    ipcRenderer.on('filesCollected', this.onFilesCollected);  
    ipcRenderer.on('getFilters', this.getFilter);
  },
  beforeDestroy() {
    ipcRenderer.off("dirScanned", this.onDirScanned);
    ipcRenderer.off("dirChecked", this.onDirChecked);
    ipcRenderer.off("dirSelected", this.onDirSelected);
    ipcRenderer.off('filesCollected', this.onFilesCollected);
    ipcRenderer.off('getFilters', this.getFilter);
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
::-webkit-scrollbar {
  width: 12px;
}
::-webkit-scrollbar-thumb {
  background: #888;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.list-group {
  max-height: 85vh;
  margin-bottom: 10px;
  overflow-y: scroll;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
.titleLimit {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 88%;
}
.pathContainer {
  width: 500px;
  // margin: 0;
  // padding: 3px;
  // height: 1em;
  overflow: hidden;
  position: relative;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.pathLimit {
  direction: rtl;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}
.sizeIdentifier {
  white-space: nowrap;
}
.dropDown-Container {
  overflow: hidden;
  height: 0;
  z-index: -2;
  position: relative;
  margin: 0, auto;
  padding-bottom: 5px;
}
.dropDown-Container-Active {
  height: auto;
  z-index: 2000;
}
.dropDown {
  position: relative;
  z-index: -1;
  height: 0px;
  font-size: 0px;
  margin: 0 auto;
  width: 92%;
  /* top: 80%; */
  top: -60px;
  transition: top 1s, height 1s, font-size 1s;
  border-radius: 7px;
}
.dropdownActive {
  top: 2px;
  height: 40px;
  font-size: 25px;
  z-index: 2000;
}
li.active {
  background-color: rgba(19, 20, 79, 0.2);
  border-color: rgba(19, 20, 79, 0.3);
  color: black;
}
.defaultIcon {
  background-image: url("data:image/svg+xml,<svg class='bi bi-file-earmark' width='36px' height='36px' viewBox='0 0 16 16' fill='currentColor' xmlns='http://www.w3.org/2000/svg'><path d='M4 1h5v1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6h1v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z'/><path d='M9 4.5V1l5 5h-3.5A1.5 1.5 0 0 1 9 4.5z'/></svg>");
  background-repeat: no-repeat;
  background-size: 36px;
  font-size: 36px;
  width: 36px;
  height: 36px;
}
.defaultIconSmall {
  background-image: url("data:image/svg+xml,<svg class='bi bi-file-earmark' width='36px' height='36px' viewBox='0 0 16 16' fill='currentColor' xmlns='http://www.w3.org/2000/svg'><path d='M4 1h5v1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6h1v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z'/><path d='M9 4.5V1l5 5h-3.5A1.5 1.5 0 0 1 9 4.5z'/></svg>");
  background-repeat: no-repeat;
  background-size: 20px;
  font-size: 20px;
  width: 20px;
  height: 20px;
}
.disabled {
  cursor: default;
}
.paginationButton {
  font-size: 0.8rem;
  font-weight: bold;
  // height: 3vh;
}
</style>
