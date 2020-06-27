<template>
    <div class="container d-flex flex-row justify-content-end">
        <button type="button" class="btn btn-outline-primary buttonCustom" @mousedown="selectDir()">Merge Folders</button>
    </div>
</template>

<script>
import { ipcRenderer } from "electron";


export default {
    name: "actionButton",
    components: {
        
    },
      data: function() {
    return {
      
    };
  },
    props: {
        storageLocation: {
            type: String,
            default: "actionButton"
        }
    },
    methods: {
        selectDir: function(title) {
            if (title === undefined) title = "Select a directory to save to: ";
            ipcRenderer.send("selectDir", { title: title, id: "actionButton" });
        },
        onDirSelected(event, args) {
            if (args.id !== "actionButton") return; //Not for us.
            if (args.canceled) return; //Got canceled.
            ipcRenderer.send('mergeFiles', {path: args.filePaths[0]});   
        }
    },
    mounted() {
        //Start listeners for things here.
        // ipcRenderer.on("unknownErr", this.unknownErr);
        ipcRenderer.on("dirSelected", this.onDirSelected);
    },
    beforeDestroy() {
        //Kill listeners here before destruction.
        // ipcRenderer.off("unknownErr", this.unknownErr);
        ipcRenderer.off("dirSelected", this.onDirSelected);
    }
};
</script>
<style scoped lang="scss">
.buttonCustom {
    width: 40%;
    height: 3rem;
    margin-right: 10px;
}
</style>