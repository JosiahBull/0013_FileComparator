<template>
  <div>
    <ul class="list-group">
      <li class="list-group-item">
        <div class="container">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1 nowrap">Merge Settings</h5>
            <small class="text-right limitTextBox">{{
              !$data.rename
                ? "Ranked and one file will be exlcuded."
                : "Rename as required."
            }}</small>
          </div>
          <div
            class="custom-control custom-switch flex-row d-flex justify-content-between"
          >
            <input
              type="checkbox"
              class="custom-control-input"
              id="renameSetting"
              v-on:click="$data.rename = !$data.rename"
            />
            <label class="custom-control-label" for="renameSetting">{{
              $data.rename ? "Rename and Merge" : "Merge and Replace"
            }}</label>
          </div>
        </div>
      </li>
      <!-- List Divider -->
      <li>
        <div
          style="height:3px; background-color:rgba(19, 20, 79, .4); width:100%"
        ></div>
      </li>
      <li
        v-for="(rankSlot, index) in ranks"
        :key="index"
        class="list-group-item flex-column align-items-start"
        @mouseover="rankSlot.hover = true"
        @mouseleave="rankSlot.hover = false"
        :class="{ active: rankSlot.hover, disabled: rankSlot.disabled }"
      >
        <div class="container">
          <div class="row">
            <div class="col-11">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1 nowrap">{{ rankSlot.title }}</h5>
                <small class="text-right limitTextBox">{{
                  rankSlot.description
                }}</small>
              </div>
              <div class="custom-control custom-switch flex-row d-flex">
                <input
                  type="checkbox"
                  class="custom-control-input"
                  v-bind:id="rankSlot.searchTerm"
                  v-on:click="rankSlot.descending = !rankSlot.descending"
                />
                <label
                  class="custom-control-label"
                  v-bind:for="rankSlot.searchTerm"
                  >{{ rankSlot.descending ? "Ascending" : "Descending" }}</label
                >
              </div>
            </div>
            <div class="d-flex flex-column align-items-start col-1">
              <button
                @mousedown="moveUp(index)"
                class="sortingButton btn btn-outline-secondary justify-content-center"
                type="button"
                @mouseover="rankSlot.upHover = true"
                @mouseleave="rankSlot.upHover = false"
              >
                <svg
                  class="arrowSvgImg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 3.5a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"
                  />
                  <path
                    fill-rule="evenodd"
                    d="M7.646 2.646a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8 3.707 5.354 6.354a.5.5 0 1 1-.708-.708l3-3z"
                  />
                </svg>
              </button>
              <button
                @mousedown="moveDown(index)"
                class="sortingButton btn btn-outline-secondary justify-content-center"
                type="button"
                @mouseover="rankSlot.downHover = true"
                @mouseleave="rankSlot.downHover = false"
              >
                <svg
                  class="arrowSvgImg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.646 9.646a.5.5 0 0 1 .708 0L8 12.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"
                  />
                  <path
                    fill-rule="evenodd"
                    d="M8 2.5a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0V3a.5.5 0 0 1 .5-.5z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
// import { ipcRenderer } from 'electron';
function moveArrayItemToNewIndex(arr, old_index, new_index) {
  if (new_index >= arr.length) {
    var k = new_index - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr;
}

export default {
  name: "rankerModule",
  data: function() {
    return {
      rename: false,
      renameSettings: {
        title: "Rename Settings",
        searchTerm: "",
        description: "Rename Method",
        options: ["date", "num", "title"],
        selection: ""
      },
      ranks: [
        {
          title: "Last Changed",
          searchTerm: "changeTime",
          description: "Sort by file last change time.",
          descending: true,
          hover: false,
          disabled: false,
          upHover: false,
          downHover: false
        },
        {
          title: "Size of File",
          searchTerm: "size",
          description: "Sort by file size.",
          descending: true,
          hover: false,
          disabled: false,
          upHover: false,
          downHover: false
        },
        {
          title: "Date Created",
          searchTerm: "creationTime",
          description: "Sort by creation time.",
          descending: true,
          hover: false,
          disabled: false,
          upHover: false,
          downHover: false
        },
        {
          title: "Last Accessed",
          searchTerm: "accessTime",
          description: "Sort by last access time.",
          descending: true,
          hover: false,
          disabled: false,
          upHover: false,
          downHover: false
        }
      ],
      iconLinks: {
        downArrow: {
          black: require("@/assets/downArrowBlack.svg")
        },
        upArrow: {
          black: require("@/assets/upArrowBlack.svg")
        }
      }
    };
  },
  props: {},
  methods: {
    moveUp(index) {
      if (index === 0) return;
      this.$data.ranks[index].hover = false;
      this.$data.ranks[index - 1].hover = true;
      this.$data.ranks = moveArrayItemToNewIndex(
        this.$data.ranks,
        index,
        index - 1
      );
    },
    moveDown(index) {
      if (index === this.$data.ranks.length - 1) return;
      this.$data.ranks[index].hover = false;
      this.$data.ranks[index + 1].hover = true;
      this.$data.ranks = moveArrayItemToNewIndex(
        this.$data.ranks,
        index,
        index + 1
      );
    },
    onRankRequest(event, args) {
      ipcRenderer.send('rankInfo', {rename: this.$data.rename, renameSettings: this.$data.renameSettings, ranks: this.$data.ranks, path: args.path});
    }
  },
  mounted() {
    ipcRenderer.on("mergeFiles", this.onRankRequest);
  },
  beforeDestroy() {
    ipcRenderer.off('mergeFiles', this.onRankRequest);
  },
  components: {}
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
.nowrap {
  white-space: nowrap;
}
.limitTextBox {
  width: 27em;
  overflow: hidden;
}
li.active {
  background-color: rgba(19, 20, 79, 0.2);
  border-color: rgba(19, 20, 79, 0.3);
  // color: black;
}
.sortingButton {
  cursor: pointer;
  height: 36px;
  width: 36px;
  margin: 1px;
}
.arrowSvgImg {
  box-sizing: content-box;
  padding: 0;
  margin: 0;
  height: 32px;
  width: 32px;
  left: -11px;
  top: -5px;
  position: relative;
}
</style>
