import Vue from 'vue'
import App from './App.vue'
import store from './store'
import { Button, Input, Image, Message, Dialog } from 'element-ui'
import 'assets/global.scss'
import axios from 'axios'
import VueClipboard from 'vue-clipboard2'
import myMessage from 'utils/reWriteMessage.js'

Vue.config.productionTip = false
Vue.prototype.$axios = axios
Vue.prototype.$message = myMessage
Vue.prototype.$oriMessage = Message

VueClipboard.config.autoSetContainer = true
Vue.use(VueClipboard)
Vue.use(Button)
Vue.use(Input)
Vue.use(Image)
Vue.use(Dialog)

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
