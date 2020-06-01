<template>
  <div class="about">
    <!-- <div class="container"> -->
      <div class="row">
      <div class="col-sm">
        <scrollableList storageLocation='listA'></scrollableList>
      </div>
      <div class="col-sm">
        <scrollableList storageLocation='listB'></scrollableList>
      </div>
      <div class="col-sm">
        <rankerModule></rankerModule>
      </div>
  <!-- </div> -->
</div>
  </div>
</template>


<script>
import scrollableList from "@/components/scrollableList.vue";
import rankerModule from "@/components/rankerModule.vue";
export default {
	name: "About",
	components: {
		scrollableList,
		rankerModule
	}
}
</script>