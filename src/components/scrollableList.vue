<template>
  <div class="listContainer">
      <ul class='fileList list-group'>
            <li class="list-group-item flex-column align-items-start" @mouseover="$data.selectionContainer.hover = true" @mouseleave="$data.selectionContainer.hover = false" :class="{ 'active': $data.selectionContainer.hover}"> 
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">Directory: {{$data.selectionContainer.title}}</h5> <!-- TODO: Update this thing when a dir selected. -->
                    <small v-if="$data.selectionContainer.path.length > 0">{{$data[this.storageLocation].length}} files, {{Math.round($data[this.storageLocation].reduce((total, item) => total+item.size, 0)/1000)}} mb</small>
                </div>
                <div class="pathContainer mb-1 text-left" v-if="$data.selectionContainer.path.length > 0">
                    <small>{{$data.selectionContainer.path}}</small>
                </div>
                <div class="dropDown-Container" v-bind:class="{'dropDown-Container-Active': $data.selectionContainer.hover}">
                    <div class="d-flex w-100 justify-content-between dropDown" v-bind:class="{'dropdownActive': $data.selectionContainer.hover}">
                        <button type="button" class="btn btn-outline-danger btn-sm" v-on:click="clearSelection()">Clear Selection</button>
                        <button type="button" class="btn btn-outline-primary btn-sm" v-on:click="selectDir()">Load From Directory</button>
                        <!-- <button type="button" class="btn btn-outline-danger btn-sm">TBD</button> -->
                    </div>
                </div>
            </li>
            <!-- List Divider -->
            <li> 
                <div style="height:3px; background-color:rgba(19, 20, 79, .3); width:100%" v-if="$data.selectionContainer.path.length > 0"></div>
            </li>

            <li v-for="(file, index) in $data[this.storageLocation]" :key="index" class="list-group-item flex-column align-items-start" @mouseover="file.hover = true" @mouseleave="file.hover = false" :class="{ 'active': file.hover, disabled: file.disabled}">
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">{{file.fileName}}</h5>
                        <small>{{file.size}} kb</small>
                    </div>
                    <div class="pathContainer mb-1 text-left">
                        <small>{{file.path}}</small>
                    </div>
                    <div class="dropDown-Container" v-bind:class="{'dropDown-Container-Active': file.hover}">
                        <div class="d-flex w-100 justify-content-between dropDown" v-bind:class="{'dropdownActive': file.hover}">
                            <button type="button" class="btn btn-outline-danger btn-sm">Ignore File</button>
                            <button type="button" class="btn btn-outline-danger btn-sm">Ignore All .XML</button>
                            <button type="button" class="btn btn-outline-danger btn-sm">Only Select .XML</button>
                        </div>
                    </div>
            </li>
      </ul>
  </div>
</template>

<script>



import { ipcRenderer } from 'electron';

export default {
    name: "scrollableList",
    data: function(){
        return {
            [this.storageLocation] : [],
            selectionContainer: {
                hover: false,
                title: 'No Selection',
                path: ''
            }
        }
    },
    props: {
        storageLocation: String
    },
    methods: {
        checkDir: function(checkPath) {
            ipcRenderer.send('checkDirEmpty', {parentDirectory: checkPath, id:this.storageLocation})
        },
        scanDir: function(config) {
            config.id = this.storageLocation;
            ipcRenderer.send('scanDir', config);
        },
        selectDir: function(title) {
            if (title === undefined) title = 'Select a directory to load: '
            ipcRenderer.send('selectDir', {title: title, id: this.storageLocation});
        },
        clearSelection: function() {
            this.$data[this.storageLocation] = [];
            this.$data.selectionContainer.title = 'No Selection';
            this.$data.selectionContainer.path = '';
        },
        onDirScanned(event, args) {
            if (args.id !== this.storageLocation) return; //Not for us.
            let updatedFiles = args.result.map(file => {
                file.hover = false;
                file.disabled = false;
                return file;
            });
            this.$data[this.storageLocation] = updatedFiles;
        },
        onDirChecked(event, args) {
            if (args.id !== this.storageLocation) return; //Not for us.
            console.log(args);
        },
        onDirSelected(event, args) {
            if (args.id !== this.storageLocation) return; //Not for us.
            if (args.canceled) return; //Got canceled.
            this.$data.selectionContainer.path = args.filePaths[0];
            this.$data.selectionContainer.title = args.filePaths[0].match(/([^\\\\]*)\\*$/)[1];
            this.scanDir({
                parentDirectory: this.$data.selectionContainer.path,
            });
        },
        onErr(event, args) { //temp
            console.log('An error has occured.')
            console.log(args);
        }

    },
    beforeCreate() {
        //Things
    },
    mounted() {
        ipcRenderer.on('dirScanned', this.onDirScanned);
        ipcRenderer.on('dirChecked', this.onDirChecked);
        ipcRenderer.on('dirSelected', this.onDirSelected);
        //temp
        ipcRenderer.on('unknownErr', this.onErr);
    },
    beforeDestroy() {
        ipcRenderer.off('dirScanned', this.onDirScanned);
        ipcRenderer.off('dirChecked', this.onDirChecked);
        ipcRenderer.off('dirSelected', this.onDirSelected);
        //temp
        ipcRenderer.off('unknownErr', this.onErr);
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
    .list-group{
        max-height: 80vh;
        margin-bottom: 10px;
        overflow-y:scroll;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
    }
    .titleContainer{
        width: 200px;   
        // padding: 3px;
        // height: 1em;
        overflow: hidden;
        position: relative;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .pathContainer{
        width: 500px;   
        // margin: 0;
        // padding: 3px;
        // height: 1em;
        overflow: hidden;
        position: relative;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .dropDown-Container {
        overflow: hidden;
        height: 0;
        z-index: -2;
        position: relative;
        margin: 0, auto;
        padding-bottom: 5px;
    }
    .dropDown-Container-Active{
        height:auto;
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
    }
    li.active {
        background-color: rgba(19, 20, 79, .2);
        border-color: rgba(19, 20, 79, .3);
        color: black;
    }
</style>
