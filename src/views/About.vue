<template>
  <div class="about">
    <!-- <div class="container"> -->
    <div class="row">
      <div class="col-sm">
        <scrollableList storageLocation="ListA"></scrollableList>
      </div>
      <div class="col-sm">
        <scrollableList storageLocation="ListB"></scrollableList>
      </div>
      <div class="col-sm">
        <div style="height:85vh; margin-bottom: 10px;" class="d-flex flex-column"> 
          <rankerModule class="mb-auto"></rankerModule>
          <actionButton></actionButton>
        </div>
      </div>
      <!-- </div> -->
    </div>
  </div>
</template>

<script>
import scrollableList from '@/components/scrollableList.vue';
import rankerModule from '@/components/rankerModule.vue';
import actionButton from '@/components/actionButton.vue';
import { ipcRenderer } from "electron";
export default {
  name: "About",
  components: {
    scrollableList,
    rankerModule,
    actionButton
  },
  methods: {
    filesMerged: function(event, args) {
      this.showSuccessMsg({
        title: 'Files merged!',
        message: 'Files have been successfully merged.'
      })
    }
  },
  notifications: {
    showSuccessMsg: {
      type: 'success',
      title: 'Success!',
      message: 'The requested action has been performed.'
    }
  },
  mounted() {
    ipcRenderer.on('filesMerged', this.filesMerged);
  },
  beforeDestroy() {
    ipcRenderer.off('filesMerged', this.filesMerged);
  }
};

</script>
<style scoped lang="scss">


</style>