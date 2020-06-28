import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { BootstrapVue } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "file-icon-vectors/dist/file-icon-square-o.min.css";
import VueClipboard from "vue-clipboard2";
import VueNotifications from 'vue-notifications';
// Include mini-toaster (or any other UI-notification library)
import miniToastr from 'mini-toastr'
 
// We shall setup types of the messages. ('error' type - red and 'success' - green in mini-toastr)
const toastTypes = {
  success: 'success',
  error: 'error',
  info: 'info',
  warn: 'warn'
}
 
// This step requires only for mini-toastr, just an initialization
miniToastr.init({types: toastTypes})
 
function toast ({title, message, type, timeout, cb}) {
  return miniToastr[type](message, title, timeout, cb)
}
 
const options = {
  success: toast,
  error: toast,
  info: toast,
  warn: toast
}
 
// Activate plugin
// VueNotifications have auto install but if we want to specify options we've got to do it manually.
Vue.use(VueNotifications, options)

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(VueClipboard);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
