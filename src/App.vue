<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view />
  </div>
</template>
<script>
import { ipcRenderer } from "electron";
export default {
  name: "App",
  components: {
  },
  methods: {
    unknownErr: function(event, args) {
      console.log(`An unknown error has occured: ${JSON.stringify(args)}\n`);
    }
  },
  mounted() {
    ipcRenderer.on("unknownErr", this.unknownErr);
  },
  beforeDestroy() {
    ipcRenderer.off("unknownErr", this.unknownErr);
  }
}
</script>
<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

body {
  overflow: hidden;
}
#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
